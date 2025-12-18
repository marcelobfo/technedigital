import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import nodemailer from "https://esm.sh/nodemailer@6.9.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendNewsletterRequest {
  post_id: string;
}

interface EmailSettings {
  provider: string;
  resend_api_key: string | null;
  resend_from_email: string | null;
  resend_from_name: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_secure: boolean | null;
  smtp_user: string | null;
  smtp_password: string | null;
  smtp_from_email: string | null;
  smtp_from_name: string | null;
}

async function sendEmailWithProvider(
  settings: EmailSettings,
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; response?: any; error?: string }> {
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (settings.provider === "smtp") {
    const fromName = settings.smtp_from_name || "TECHNE Digital";
    const fromEmail = settings.smtp_from_email || settings.smtp_user;

    try {
      const transporter = nodemailer.createTransport({
        host: settings.smtp_host!,
        port: settings.smtp_port || 465,
        secure: settings.smtp_secure || settings.smtp_port === 465,
        auth: {
          user: settings.smtp_user!,
          pass: settings.smtp_password!,
        },
      });

      // Fail fast on bad config / TLS issues
      await transporter.verify();

      const info = await transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to,
        subject,
        text,
        html,
        headers: {
          "X-Content-Type-Options": "nosniff",
        },
      });

      return { success: true, response: { provider: "smtp", messageId: info.messageId } };
    } catch (err: any) {
      return { success: false, error: err?.message || "Falha ao enviar via SMTP" };
    }
  }

  const resendApiKey = settings.resend_api_key || Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { success: false, error: "Chave da API Resend não configurada" };
  }

  const resend = new Resend(resendApiKey);
  const fromEmail = settings.resend_from_email || "onboarding@resend.dev";
  const fromName = settings.resend_from_name || "TECHNE Digital";

  const response = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: [to],
    subject,
    text,
    html,
  });

  return { success: true, response };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { post_id }: SendNewsletterRequest = await req.json();
    console.log("Sending newsletter for post:", post_id);

    if (!post_id) {
      return new Response(
        JSON.stringify({ error: "post_id é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: post, error: postError } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", post_id)
      .single();

    if (postError || !post) {
      console.error("Post not found:", postError);
      return new Response(
        JSON.stringify({ error: "Post não encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: emailSettings } = await supabase
      .from("email_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    if (!emailSettings) {
      console.error("Email settings not configured");
      return new Response(
        JSON.stringify({ error: "Configurações de email não encontradas" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Using email provider:", emailSettings.provider);

    if (emailSettings.provider === "smtp") {
      if (!emailSettings.smtp_host || !emailSettings.smtp_user || !emailSettings.smtp_password) {
        return new Response(
          JSON.stringify({ error: "Configurações SMTP incompletas" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else {
      const resendApiKey = emailSettings.resend_api_key || Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        return new Response(
          JSON.stringify({ error: "Chave da API Resend não configurada" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    const { data: subscribers, error: subsError } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("status", "active");

    if (subsError) {
      console.error("Error fetching subscribers:", subsError);
      throw subsError;
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("No active subscribers found");
      return new Response(
        JSON.stringify({ success: true, message: "Nenhum assinante ativo", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${subscribers.length} active subscribers`);

    const siteUrl = "https://technedigital.com.br";
    const postUrl = `${siteUrl}/blog/${post.slug}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 32px; margin: 0;">
              TECHNE Digital
            </h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #1f2937; margin-top: 0;">Novo Post no Blog!</h2>
            <p style="color: #4b5563; font-size: 16px;">
              Acabamos de publicar um novo artigo que voce vai adorar!
            </p>
          </div>

          <div style="margin: 20px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            ${post.cover_image ? `<img src="${post.cover_image}" alt="${post.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;" />` : ""}
            <h3 style="color: #1f2937; margin: 10px 0; font-size: 20px;">${post.title}</h3>
            <p style="color: #6b7280; margin: 10px 0;">${post.excerpt || ""}</p>
            <a href="${postUrl}" 
               style="display: inline-block; margin-top: 10px; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 4px; font-weight: 600;">
              Ler artigo completo
            </a>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 14px;">
            <p>
              Voce esta recebendo este email porque se inscreveu na nossa newsletter.
              <br>
              <a href="${siteUrl}/unsubscribe" style="color: #667eea; text-decoration: none;">Cancelar inscricao</a>
            </p>
            <p style="margin-top: 10px;">
              ${new Date().getFullYear()} TECHNE Digital. Todos os direitos reservados.
            </p>
          </div>
        </body>
      </html>
    `;

    let sentCount = 0;
    let errorCount = 0;

    for (const subscriber of subscribers) {
      const { data: logEntry } = await supabase
        .from("newsletter_logs")
        .insert({
          subscriber_id: subscriber.id,
          post_id: post.id,
          email: subscriber.email,
          send_type: "new_post",
          status: "pending",
        })
        .select()
        .single();

      try {
        const result = await sendEmailWithProvider(
          emailSettings as EmailSettings,
          subscriber.email,
          `Novo Post: ${post.title}`,
          emailHtml
        );

        if (result.success) {
          console.log(`Email sent to ${subscriber.email}:`, result.response);

          await supabase
            .from("newsletter_logs")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              api_response: result.response,
            })
            .eq("id", logEntry?.id);

          sentCount++;
        } else {
          throw new Error(result.error);
        }
      } catch (emailError: any) {
        console.error(`Failed to send to ${subscriber.email}:`, emailError);

        await supabase
          .from("newsletter_logs")
          .update({
            status: "error",
            error_message: emailError.message || "Erro desconhecido",
            api_response: { error: emailError.message },
          })
          .eq("id", logEntry?.id);

        errorCount++;
      }
    }

    console.log(`Newsletter sent: ${sentCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Newsletter enviada para ${sentCount} assinantes`,
        sent: sentCount,
        errors: errorCount,
        total: subscribers.length,
        provider: emailSettings.provider,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-newsletter-post:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao enviar newsletter" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
