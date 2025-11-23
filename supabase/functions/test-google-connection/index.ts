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

    return { token: tokens.access_token, settings };
  }

  return { token: settings.access_token, settings };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Testando conexão com Google Search Console...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Passo 1: Verificar configurações no banco
    console.log('📊 Verificando configurações...');
    const { data: settings, error: settingsError } = await supabase
      .from('google_search_console_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (settingsError || !settings) {
      throw new Error('Configurações do Google não encontradas no banco de dados');
    }

    const checks = {
      hasSettings: true,
      hasClientId: !!settings.client_id,
      hasClientSecret: !!settings.client_secret,
      hasRefreshToken: !!settings.refresh_token,
      hasAccessToken: !!settings.access_token,
      propertyUrl: settings.property_url,
      tokenValid: false,
      apiAccessible: false,
      scopes: [],
      errors: [] as string[],
    };

    // Passo 2: Obter e verificar token
    console.log('🔐 Verificando token de acesso...');
    try {
      const { token, settings: updatedSettings } = await getValidAccessToken(supabase);
      checks.hasAccessToken = !!token;
      checks.tokenValid = true;
      console.log('✅ Token válido obtido');

      // Passo 3: Testar acesso à API
      console.log('🌐 Testando acesso à API do Search Console...');
      const testUrl = settings.property_url || 'https://technedigital.com.br/';
      
      const response = await fetch(
        'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inspectionUrl: testUrl,
            siteUrl: testUrl,
          }),
        }
      );

      if (response.ok) {
        checks.apiAccessible = true;
        console.log('✅ API acessível com sucesso');
      } else {
        const errorText = await response.text();
        console.error(`❌ Erro ao acessar API (${response.status}): ${errorText}`);
        
        if (response.status === 403) {
          checks.errors.push('Acesso negado (403). Verifique se a propriedade está cadastrada no Google Search Console.');
        } else if (response.status === 401) {
          checks.errors.push('Não autorizado (401). Token de acesso pode estar inválido.');
        } else if (response.status === 404) {
          checks.errors.push('Propriedade não encontrada (404). Verifique se a URL da propriedade está correta.');
        } else {
          checks.errors.push(`Erro ${response.status}: ${errorText}`);
        }
      }

      // Passo 4: Verificar informações do token
      console.log('📋 Verificando informações do token...');
      const tokenInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
      );

      if (tokenInfoResponse.ok) {
        const tokenInfo = await tokenInfoResponse.json();
        checks.scopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : [];
        console.log(`✅ Scopes do token: ${checks.scopes.join(', ')}`);
      }

    } catch (error) {
      checks.tokenValid = false;
      checks.errors.push(error instanceof Error ? error.message : 'Erro ao obter token');
      console.error('❌ Erro ao validar token:', error);
    }

    // Resultado final
    const allPassed = checks.hasSettings && 
                      checks.hasClientId && 
                      checks.hasClientSecret && 
                      checks.hasRefreshToken && 
                      checks.tokenValid && 
                      checks.apiAccessible;

    console.log(`${allPassed ? '✅' : '❌'} Teste de conexão concluído`);

    return new Response(
      JSON.stringify({ 
        success: allPassed,
        checks,
        message: allPassed 
          ? 'Conexão com Google Search Console funcionando corretamente!' 
          : 'Problemas detectados na conexão. Verifique os detalhes.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro crítico ao testar conexão:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        checks: {
          hasSettings: false,
          errors: [errorMessage]
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
