import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeWhatsAppRequest {
  lead_id: string;
  phone_number: string;
  lead_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { lead_id, phone_number, lead_name }: WelcomeWhatsAppRequest = await req.json();

    console.log("Sending welcome message to:", phone_number, "for lead:", lead_name);

    // Formatar número de telefone para padrão internacional
    let formattedPhone = phone_number.replace(/\D/g, '');
    
    // Se não tiver código do país (55 para Brasil), adicionar
    if (!formattedPhone.startsWith('55') && formattedPhone.length === 11) {
      formattedPhone = '55' + formattedPhone;
    }

    console.log("Formatted phone:", formattedPhone);

    // Buscar configurações do WhatsApp
    const { data: whatsappSettings, error: settingsError } = await supabase
      .from("whatsapp_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    if (settingsError || !whatsappSettings) {
      console.log("WhatsApp não configurado, pulando envio");
      return new Response(
        JSON.stringify({ success: false, message: "WhatsApp não configurado" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mensagem de boas-vindas
    const message = `Olá *${lead_name}*! 👋\n\n` +
      `Obrigado pelo seu contato com a *TECHNE Digital*! 🚀\n\n` +
      `Recebemos sua mensagem e um de nossos especialistas entrará em contato em breve para entender melhor suas necessidades.\n\n` +
      `Enquanto isso, fique à vontade para nos enviar mais informações que possam nos ajudar a preparar a melhor solução para você.\n\n` +
      `_Equipe TECHNE Digital_ ✨`;

    // Enviar mensagem via WhatsApp API
    const whatsappUrl = `${whatsappSettings.api_url}/message/sendText/${whatsappSettings.instance_name}`;
    
    console.log("Sending to WhatsApp API:", whatsappUrl);
    
    const whatsappResponse = await fetch(whatsappUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": whatsappSettings.api_token,
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message,
      }),
    });

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.text();
      console.error("WhatsApp API error:", errorData);
      throw new Error(`Erro ao enviar mensagem: ${errorData}`);
    }

    const whatsappData = await whatsappResponse.json();
    console.log("WhatsApp welcome message sent:", whatsappData);

    // Log activity
    await supabase.from("lead_activities").insert({
      lead_id: lead_id,
      user_id: (await supabase.auth.admin.listUsers()).data.users[0]?.id || lead_id,
      activity_type: "note",
      description: `Mensagem automática de boas-vindas enviada via WhatsApp para ${formattedPhone}`,
    });

    return new Response(
      JSON.stringify({ success: true, whatsappData }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending welcome WhatsApp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
