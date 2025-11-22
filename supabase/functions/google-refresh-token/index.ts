import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshGoogleToken(supabase: any) {
  const { data: settings } = await supabase
    .from('google_search_console_settings')
    .select('*')
    .eq('is_active', true)
    .single();

  if (!settings || !settings.refresh_token) {
    throw new Error('Configuração ou refresh token não encontrado');
  }

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  console.log('🔄 Atualizando access token...');

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: settings.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Erro ao atualizar token: ${error}`);
  }

  const tokens = await tokenResponse.json();

  // Calcular nova expiração
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

  // Atualizar no banco
  const { error: updateError } = await supabase
    .from('google_search_console_settings')
    .update({
      access_token: tokens.access_token,
      token_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', settings.id);

  if (updateError) throw updateError;

  console.log('✅ Token atualizado com sucesso');

  return tokens.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const accessToken = await refreshGoogleToken(supabase);

    return new Response(
      JSON.stringify({ success: true, accessToken }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro ao atualizar token:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Exportar função para uso em outras edge functions
export { refreshGoogleToken };
