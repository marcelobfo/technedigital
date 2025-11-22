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

  // Verificar se o token expirou
  const expiresAt = new Date(settings.token_expires_at);
  const now = new Date();
  const needsRefresh = expiresAt.getTime() - now.getTime() < 5 * 60 * 1000; // Refresh se falta menos de 5min

  if (needsRefresh) {
    console.log('🔄 Token expirado, atualizando...');
    
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

    return tokens.access_token;
  }

  return settings.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settings } = await supabase
      .from('google_search_console_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!settings || !settings.auto_submit_sitemap) {
      return new Response(
        JSON.stringify({ message: 'Submissão automática desabilitada' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const accessToken = await getValidAccessToken(supabase);
    const sitemapUrl = 'https://technedigital.com.br/sitemap.xml';
    const propertyUrl = settings.property_url;

    console.log('📤 Submetendo sitemap ao Google Search Console...');

    // Submeter sitemap
    const response = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erro ao submeter sitemap:', error);
      throw new Error(`Erro ao submeter sitemap: ${error}`);
    }

    // Atualizar última submissão
    await supabase
      .from('google_search_console_settings')
      .update({
        last_sitemap_submit: new Date().toISOString(),
      })
      .eq('id', settings.id);

    console.log('✅ Sitemap submetido com sucesso!');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Sitemap submetido com sucesso',
        sitemapUrl,
        submittedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro ao submeter sitemap:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
