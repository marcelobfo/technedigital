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

    // Tentar fazer uma requisição de teste à API do WhatsApp
    const testUrl = `${settings.api_url}/message/sendText/${settings.instance_name}`;
    
    const response = await fetch(testUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.api_token}`,
      },
      body: JSON.stringify({
        number: "0000000000", // Número de teste
        text: "Teste de conexão",
      }),
    });

    // Se a API responder (mesmo com erro de número inválido), a conexão está OK
    const isConnected = response.status === 200 || response.status === 400;

    return new Response(
      JSON.stringify({
        success: isConnected,
        message: isConnected
          ? "Conexão estabelecida com sucesso"
          : "Falha na conexão com a API",
        status: response.status,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error testing WhatsApp connection:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
