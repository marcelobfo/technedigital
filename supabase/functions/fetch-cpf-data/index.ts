import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CPF_API_KEY = Deno.env.get("CPF_API_KEY") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { cpf } = await req.json();

    if (!cpf) {
      return new Response(
        JSON.stringify({ success: false, error: "CPF é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanCPF = cpf.replace(/\D/g, "");

    if (cleanCPF.length !== 11) {
      return new Response(
        JSON.stringify({ success: false, error: "CPF inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Consultando CPF via cpfhub.io: ${cleanCPF.substring(0, 3)}...`);

    const response = await fetch(`https://api.cpfhub.io/cpf/${cleanCPF}`, {
      method: "GET",
      headers: {
        "x-api-key": CPF_API_KEY,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro na API cpfhub.io: ${response.status}`, errorText);

      if (response.status === 404) {
        return new Response(
          JSON.stringify({ success: false, error: "CPF não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ success: false, error: "Chave de API inválida" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    console.log("CPF consultado com sucesso:", data.data?.name ? data.data.name.substring(0, 10) + "..." : "N/A");

    // Mapear resposta para formato padronizado usado pelo frontend
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          NOME: data.data?.nameUpper || data.data?.name || "",
          CPF: data.data?.cpf || cleanCPF,
          SEXO: data.data?.gender === "M" ? "Masculino" : data.data?.gender === "F" ? "Feminino" : data.data?.gender || "",
          NASC: data.data?.birthDate || "",
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
