import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CPF_API_KEY = "efd727b7bf3925e6a1ec2d45079427f1";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cpf } = await req.json();
    
    if (!cpf) {
      return new Response(
        JSON.stringify({ success: false, error: "CPF é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limpar CPF - apenas números
    const cleanCPF = cpf.replace(/\D/g, "");
    
    if (cleanCPF.length !== 11) {
      return new Response(
        JSON.stringify({ success: false, error: "CPF inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Consultando CPF: ${cleanCPF.substring(0, 3)}...`);

    const response = await fetch(`https://api.cpf-brasil.org/cpf/${cleanCPF}`, {
      method: "GET",
      headers: {
        "X-API-Key": CPF_API_KEY,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro na API de CPF: ${response.status}`, errorText);
      
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ success: false, error: "CPF não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Limite de requisições atingido" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("CPF consultado com sucesso:", data.data?.NOME ? data.data.NOME.substring(0, 10) + "..." : "N/A");

    return new Response(
      JSON.stringify({
        success: true,
        data: data.data,
        meta: data.meta,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Erro ao consultar CPF:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro ao consultar CPF" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
