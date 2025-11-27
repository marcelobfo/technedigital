import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { settingsId } = await req.json();

    console.log("Testing email connection for settings:", settingsId);

    // Fetch email settings
    const { data: settings, error: fetchError } = await supabase
      .from("email_settings")
      .select("*")
      .eq("id", settingsId)
      .single();

    if (fetchError || !settings) {
      console.error("Error fetching settings:", fetchError);
      return new Response(
        JSON.stringify({ error: "Configurações de email não encontradas" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email provider:", settings.provider);

    if (settings.provider === "resend") {
      // Test Resend connection
      if (!settings.resend_api_key) {
        return new Response(
          JSON.stringify({ error: "API Key do Resend não configurada" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Get authenticated user email to send test
      const authHeader = req.headers.get("Authorization");
      let testEmail = settings.resend_from_email || "onboarding@resend.dev";

      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user?.email) {
          testEmail = user.email;
        }
      }

      console.log("Sending test email via Resend to:", testEmail);

      // Use fetch to call Resend API directly
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${settings.resend_api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${settings.resend_from_name || "Teste"} <${settings.resend_from_email || "onboarding@resend.dev"}>`,
          to: [testEmail],
          subject: "✅ Teste de Conexão - Email Configurado com Sucesso!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #22c55e;">✅ Conexão Estabelecida!</h1>
              <p>Este é um email de teste para confirmar que as configurações do Resend estão funcionando corretamente.</p>
              <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 14px;">
                Enviado via Resend API<br>
                Remetente: ${settings.resend_from_name || "Não configurado"} &lt;${settings.resend_from_email || "onboarding@resend.dev"}&gt;
              </p>
            </div>
          `,
        }),
      });

      const resendData = await resendResponse.json();

      if (!resendResponse.ok) {
        console.error("Resend error:", resendData);
        return new Response(
          JSON.stringify({ error: `Erro ao enviar email: ${resendData.message || JSON.stringify(resendData)}` }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log("Email sent successfully:", resendData);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Email de teste enviado com sucesso para ${testEmail}`,
          provider: "resend"
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } else if (settings.provider === "smtp") {
      // For SMTP, validate settings exist
      if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_password) {
        return new Response(
          JSON.stringify({ error: "Configurações SMTP incompletas. Verifique host, usuário e senha." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Basic validation that settings exist
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Configurações SMTP verificadas: ${settings.smtp_host}:${settings.smtp_port}. Teste de envio SMTP em desenvolvimento.`,
          provider: "smtp"
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Provedor de email não reconhecido" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in test-email-connection:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao testar conexão de email" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
