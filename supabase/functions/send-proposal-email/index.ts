import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProposalEmailRequest {
  proposal_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { proposal_id }: ProposalEmailRequest = await req.json();

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

    // Construir HTML do email
    const itemsHtml = items
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.service_name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">R$ ${item.unit_price.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">R$ ${item.subtotal.toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #f9fafb; padding: 10px; text-align: left; font-weight: bold; }
            .total-row { background: #f9fafb; font-weight: bold; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Proposta Comercial</h1>
              <p>Proposta #${proposal.proposal_number}</p>
            </div>
            <div class="content">
              <p>Olá <strong>${proposal.leads.name}</strong>,</p>
              <p>Segue a proposta comercial conforme solicitado:</p>
              
              <table>
                <thead>
                  <tr>
                    <th>Serviço</th>
                    <th style="text-align: center;">Qtd</th>
                    <th style="text-align: right;">Valor Unit.</th>
                    <th style="text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <table>
                <tr>
                  <td style="text-align: right; padding: 10px;"><strong>Subtotal:</strong></td>
                  <td style="text-align: right; padding: 10px;">R$ ${proposal.total_amount.toFixed(2)}</td>
                </tr>
                ${proposal.discount_amount > 0 ? `
                <tr>
                  <td style="text-align: right; padding: 10px;"><strong>Desconto:</strong></td>
                  <td style="text-align: right; padding: 10px; color: #059669;">-R$ ${proposal.discount_amount.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                  <td style="text-align: right; padding: 15px; font-size: 18px;"><strong>Total:</strong></td>
                  <td style="text-align: right; padding: 15px; font-size: 18px; color: #667eea;">R$ ${proposal.final_amount.toFixed(2)}</td>
                </tr>
              </table>

              ${proposal.notes ? `
              <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-left: 4px solid #667eea;">
                <strong>Observações:</strong><br>
                ${proposal.notes}
              </div>
              ` : ''}

              ${proposal.terms_and_conditions ? `
              <div style="margin: 20px 0; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b;">
                <strong>Termos e Condições:</strong><br>
                ${proposal.terms_and_conditions}
              </div>
              ` : ''}

              ${proposal.valid_until ? `
              <p style="margin-top: 20px;"><em>Proposta válida até: ${new Date(proposal.valid_until).toLocaleDateString('pt-BR')}</em></p>
              ` : ''}
            </div>
            <div class="footer">
              <p>Esta proposta foi gerada automaticamente.</p>
              <p>Em caso de dúvidas, entre em contato conosco.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Enviar email
    const emailResponse = await resend.emails.send({
      from: "Propostas <onboarding@resend.dev>",
      to: [proposal.leads.email],
      subject: `Proposta Comercial #${proposal.proposal_number}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Atualizar proposta
    await supabase
      .from("proposals")
      .update({
        sent_at: new Date().toISOString(),
        sent_via: "email",
        sent_to_email: proposal.leads.email,
        status: proposal.status === "draft" ? "sent" : proposal.status,
      })
      .eq("id", proposal_id);

    // Get authenticated user
    const authHeader = req.headers.get("authorization");
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Log activity in lead
    if (userId) {
      await supabase.from("lead_activities").insert({
        lead_id: proposal.lead_id,
        user_id: userId,
        activity_type: "proposal_sent",
        description: `Proposta comercial #${proposal.proposal_number} enviada por email para ${proposal.leads.email}`,
      });

      // Update lead status
      await supabase
        .from("leads")
        .update({ status: "proposal_sent" })
        .eq("id", proposal.lead_id);
    }

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending proposal email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
