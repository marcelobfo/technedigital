import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getValidAccessToken(supabase: any) {
  const { data: settings } = await supabase
    .from('google_search_console_settings')
    .select('*')
    .eq('is_active', true)
    .single();

  if (!settings) {
    throw new Error('Configuração do Google não encontrada');
  }

  const expiresAt = new Date(settings.token_expires_at);
  const now = new Date();
  const needsRefresh = expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;

  if (needsRefresh) {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        refresh_token: settings.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const tokens = await tokenResponse.json();
    const newExpiresAt = new Date();
    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + tokens.expires_in);

    await supabase
      .from('google_search_console_settings')
      .update({
        access_token: tokens.access_token,
        token_expires_at: newExpiresAt.toISOString(),
      })
      .eq('id', settings.id);

    return { accessToken: tokens.access_token, settings };
  }

  return { accessToken: settings.access_token, settings };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { url, type, reference_id } = await req.json();

    if (!url) {
      throw new Error('URL é obrigatória');
    }

    const { accessToken, settings } = await getValidAccessToken(supabase);

    // Verificar se auto-submit está habilitado
    if (!settings.auto_submit_on_publish) {
      return new Response(
        JSON.stringify({ message: 'Auto-submit desabilitado' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`🚀 Submetendo URL para indexação: ${url}`);

    // Usar Google Indexing API para solicitar indexação imediata
    const response = await fetch(
      'https://indexing.googleapis.com/v3/urlNotifications:publish',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          type: 'URL_UPDATED'
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erro ao submeter URL:', error);
      throw new Error(`Erro ao submeter URL: ${error}`);
    }

    const result = await response.json();

    // Salvar no banco
    await supabase
      .from('seo_indexing_status')
      .upsert({
        url,
        page_type: type,
        reference_id,
        indexing_status: 'SUBMITTED',
        last_checked: new Date().toISOString(),
      }, {
        onConflict: 'url'
      });

    console.log(`✅ URL submetida com sucesso: ${url}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'URL submetida para indexação',
        url,
        result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro ao submeter conteúdo:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
