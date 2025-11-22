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

    const accessToken = await getValidAccessToken(supabase);

    // Buscar URLs para verificar
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('id, slug, status')
      .eq('status', 'published');

    const { data: projects } = await supabase
      .from('portfolio_projects')
      .select('id, slug, status')
      .eq('status', 'active');

    const urlsToCheck = [
      { url: 'https://technedigital.com.br', type: 'page', id: null },
      { url: 'https://technedigital.com.br/about', type: 'page', id: null },
      { url: 'https://technedigital.com.br/services', type: 'page', id: null },
      { url: 'https://technedigital.com.br/portfolio', type: 'page', id: null },
      { url: 'https://technedigital.com.br/blog', type: 'page', id: null },
      { url: 'https://technedigital.com.br/contact', type: 'page', id: null },
      ...(blogPosts || []).map(post => ({
        url: `https://technedigital.com.br/blog/${post.slug}`,
        type: 'blog_post',
        id: post.id
      })),
      ...(projects || []).map(project => ({
        url: `https://technedigital.com.br/portfolio/${project.slug}`,
        type: 'portfolio',
        id: project.id
      }))
    ];

    console.log(`🔍 Verificando status de ${urlsToCheck.length} URLs...`);

    const results = [];

    for (const item of urlsToCheck) {
      try {
        const response = await fetch(
          'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inspectionUrl: item.url,
              siteUrl: 'https://technedigital.com.br',
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const indexingStatus = data.inspectionResult?.indexStatusResult;

          // Salvar/atualizar no banco
          const { error } = await supabase
            .from('seo_indexing_status')
            .upsert({
              url: item.url,
              page_type: item.type,
              reference_id: item.id,
              indexing_status: indexingStatus?.verdict || 'UNKNOWN',
              coverage_state: indexingStatus?.coverageState || null,
              last_crawled: indexingStatus?.lastCrawlTime || null,
              errors: indexingStatus?.errors || null,
              warnings: indexingStatus?.warnings || null,
              last_checked: new Date().toISOString(),
            }, {
              onConflict: 'url'
            });

          if (!error) {
            results.push({ url: item.url, status: 'checked', verdict: indexingStatus?.verdict });
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`Erro ao verificar ${item.url}:`, errorMessage);
        results.push({ url: item.url, status: 'error', error: errorMessage });
      }

      // Aguardar 100ms entre requisições para não exceder rate limit
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Verificação concluída: ${results.length} URLs processadas`);

    return new Response(
      JSON.stringify({ 
        success: true,
        totalChecked: results.length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro ao buscar status de indexação:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
