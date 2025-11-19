import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppProposalRequest {
  proposal_id: string;
  phone_number: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { proposal_id, phone_number }: WhatsAppProposalRequest = await req.json();

    // Buscar configurações do WhatsApp
    const { data: whatsappSettings, error: settingsError } = await supabase
      .from("whatsapp_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    if (settingsError || !whatsappSettings) {
      throw new Error("WhatsApp não configurado ou inativo");
    }

    // Buscar proposta e itens
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select("*, leads(name, email)")
      .eq("id", proposal_id)
      .single();

    if (proposalError) throw proposalError;

    const { data: items, error: itemsError } = await supabase
      .from("proposal_items")
      .select("*")
      .eq("proposal_id", proposal_id)
      .order("display_order");

    if (itemsError) throw itemsError;

    // Construir mensagem formatada
    let message = `*PROPOSTA COMERCIAL*\n`;
    message += `Proposta #${proposal.proposal_number}\n\n`;
    message += `Olá *${proposal.leads.name}*,\n\n`;
    message += `Segue a proposta comercial conforme solicitado:\n\n`;
    message += `*SERVIÇOS*\n`;
    message += `━━━━━━━━━━━━━━━━\n`;

    items.forEach((item: any) => {
      message += `\n*${item.service_name}*\n`;
      if (item.description) {
        message += `${item.description}\n`;
      }
      message += `Qtd: ${item.quantity} x R$ ${item.unit_price.toFixed(2)}\n`;
      message += `Subtotal: *R$ ${item.subtotal.toFixed(2)}*\n`;
    });

    message += `\n━━━━━━━━━━━━━━━━\n`;
    message += `Subtotal: R$ ${proposal.total_amount.toFixed(2)}\n`;

    if (proposal.discount_amount > 0) {
      message += `Desconto: -R$ ${proposal.discount_amount.toFixed(2)}\n`;
    }

    message += `\n*VALOR TOTAL: R$ ${proposal.final_amount.toFixed(2)}*\n`;

    if (proposal.notes) {
      message += `\n*OBSERVAÇÕES*\n${proposal.notes}\n`;
    }

    if (proposal.terms_and_conditions) {
      message += `\n*TERMOS E CONDIÇÕES*\n${proposal.terms_and_conditions}\n`;
    }

    if (proposal.valid_until) {
      message += `\n_Proposta válida até: ${new Date(proposal.valid_until).toLocaleDateString('pt-BR')}_`;
    }

    // Enviar mensagem via WhatsApp API
    const whatsappUrl = `${whatsappSettings.api_url}/message/sendText/${whatsappSettings.instance_name}`;
    
    const whatsappResponse = await fetch(whatsappUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${whatsappSettings.api_token}`,
      },
      body: JSON.stringify({
        number: phone_number,
        text: message,
      }),
    });

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.text();
      throw new Error(`Erro ao enviar mensagem: ${errorData}`);
    }

    const whatsappData = await whatsappResponse.json();
    console.log("WhatsApp message sent:", whatsappData);

    // Atualizar proposta
    await supabase
      .from("proposals")
      .update({
        sent_at: new Date().toISOString(),
        sent_via: proposal.sent_via ? `${proposal.sent_via},whatsapp` : "whatsapp",
        sent_to_whatsapp: phone_number,
        status: proposal.status === "draft" ? "sent" : proposal.status,
      })
      .eq("id", proposal_id);

    return new Response(
      JSON.stringify({ success: true, whatsappData }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending WhatsApp proposal:", error);
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
