import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

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
        JSON.stringify({ error: "Configuracoes de email nao encontradas" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email provider:", settings.provider);

    // Get authenticated user email to send test
    const authHeader = req.headers.get("Authorization");
    let testEmail = settings.smtp_from_email || settings.resend_from_email || "onboarding@resend.dev";

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user?.email) {
        testEmail = user.email;
      }
    }

    if (settings.provider === "smtp") {
      // Test SMTP connection using deno.land/x/smtp
      if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_password) {
        return new Response(
          JSON.stringify({ error: "Configuracoes SMTP incompletas. Verifique host, usuario e senha." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log(`Testing SMTP connection to ${settings.smtp_host}:${settings.smtp_port}`);

      const fromName = settings.smtp_from_name || "Teste";
      const fromEmail = settings.smtp_from_email || settings.smtp_user;

      try {
        const client = new SmtpClient();

        // Connect based on port/security settings
        if (settings.smtp_secure || settings.smtp_port === 465) {
          await client.connectTLS({
            hostname: settings.smtp_host,
            port: settings.smtp_port || 465,
            username: settings.smtp_user,
            password: settings.smtp_password,
          });
        } else {
          await client.connect({
            hostname: settings.smtp_host,
            port: settings.smtp_port || 587,
            username: settings.smtp_user,
            password: settings.smtp_password,
          });
        }

        console.log("Sending test email via SMTP to:", testEmail);

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #22c55e;">Conexao SMTP Estabelecida!</h1>
            <p>Este e um email de teste para confirmar que as configuracoes SMTP estao funcionando corretamente.</p>
            <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Servidor SMTP: ${settings.smtp_host}:${settings.smtp_port}<br>
              Remetente: ${fromName} &lt;${fromEmail}&gt;<br>
              Conexao segura: ${settings.smtp_secure ? 'Sim (SSL/TLS)' : 'Nao'}
            </p>
          </div>
        `;

        await client.send({
          from: `${fromName} <${fromEmail}>`,
          to: testEmail,
          subject: "Teste de Conexao - Email SMTP Configurado com Sucesso!",
          content: htmlContent,
          html: htmlContent,
        });

        await client.close();

        console.log("SMTP email sent successfully");

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Email de teste SMTP enviado com sucesso para ${testEmail}`,
            provider: "smtp"
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );

      } catch (smtpError: any) {
        console.error("SMTP error:", smtpError);
        return new Response(
          JSON.stringify({ error: `Falha na conexao SMTP: ${smtpError.message}` }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

    } else if (settings.provider === "resend") {
      // Test Resend connection
      if (!settings.resend_api_key) {
        return new Response(
          JSON.stringify({ error: "API Key do Resend nao configurada" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
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
          subject: "Teste de Conexao - Email Configurado com Sucesso!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #22c55e;">Conexao Estabelecida!</h1>
              <p>Este e um email de teste para confirmar que as configuracoes do Resend estao funcionando corretamente.</p>
              <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 14px;">
                Enviado via Resend API<br>
                Remetente: ${settings.resend_from_name || "Nao configurado"} &lt;${settings.resend_from_email || "onboarding@resend.dev"}&gt;
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
    }

    return new Response(
      JSON.stringify({ error: "Provedor de email nao reconhecido" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in test-email-connection:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao testar conexao de email" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
