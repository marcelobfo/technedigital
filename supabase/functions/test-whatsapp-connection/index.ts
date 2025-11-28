import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestConnectionRequest {
  settings: {
    api_url: string;
    api_token: string;
    instance_name: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { settings }: TestConnectionRequest = await req.json();

    console.log("🔍 Testando conexão WhatsApp...");
    console.log(`📍 API URL: ${settings.api_url}`);
    console.log(`📱 Instance: ${settings.instance_name}`);

    // Primeiro, verificar o status da instância
    const statusUrl = `${settings.api_url}/instance/connectionState/${settings.instance_name}`;
    
    console.log(`🔗 Verificando status: ${statusUrl}`);
    
    const statusResponse = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": settings.api_token,
      },
    });

    const statusText = await statusResponse.text();
    console.log(`📥 Status response: ${statusResponse.status}`);
    console.log(`📥 Status body: ${statusText}`);

    let statusData: any = null;
    try {
      statusData = JSON.parse(statusText);
    } catch {
      statusData = { raw: statusText };
    }

    // Se conseguiu verificar o status, a conexão está OK
    if (statusResponse.ok) {
      const isConnected = statusData?.instance?.state === 'open' || 
                          statusData?.state === 'open' ||
                          statusData?.instance?.status === 'open';
      
      return new Response(
        JSON.stringify({
          success: true,
          connected: isConnected,
          message: isConnected 
            ? "✅ Conexão estabelecida e WhatsApp conectado!" 
            : "⚠️ API acessível, mas WhatsApp pode não estar conectado. Verifique o QR Code.",
          status: statusResponse.status,
          details: statusData,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Tentar endpoint alternativo de fetch instances
    const fetchUrl = `${settings.api_url}/instance/fetchInstances`;
    
    console.log(`🔗 Tentando endpoint alternativo: ${fetchUrl}`);
    
    const fetchResponse = await fetch(fetchUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": settings.api_token,
      },
    });

    const fetchText = await fetchResponse.text();
    console.log(`📥 Fetch response: ${fetchResponse.status}`);
    console.log(`📥 Fetch body: ${fetchText}`);

    if (fetchResponse.ok) {
      let fetchData: any = null;
      try {
        fetchData = JSON.parse(fetchText);
      } catch {
        fetchData = { raw: fetchText };
      }

      // Verificar se a instância existe na lista
      const instances = Array.isArray(fetchData) ? fetchData : [];
      const instanceFound = instances.find((i: any) => 
        i.instance?.instanceName === settings.instance_name ||
        i.instanceName === settings.instance_name
      );

      return new Response(
        JSON.stringify({
          success: true,
          connected: !!instanceFound,
          message: instanceFound 
            ? "✅ Conexão estabelecida! Instância encontrada." 
            : `⚠️ API acessível, mas instância "${settings.instance_name}" não encontrada.`,
          status: fetchResponse.status,
          details: { instances_count: instances.length, instance_found: !!instanceFound },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Se ambos falharam, retornar erro
    return new Response(
      JSON.stringify({
        success: false,
        connected: false,
        message: "❌ Não foi possível conectar à API. Verifique URL e Token.",
        status: statusResponse.status,
        details: statusData,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("❌ Erro ao testar conexão:", error);
    return new Response(
      JSON.stringify({
        success: false,
        connected: false,
        message: `❌ Erro: ${error.message}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
