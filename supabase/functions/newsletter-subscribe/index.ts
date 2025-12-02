import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import nodemailer from "https://esm.sh/nodemailer@6.9.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscribeRequest {
  email: string;
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

      const info = await transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to: to,
        subject: subject,
        html: html,
      });

      return { success: true, response: { provider: "smtp", messageId: info.messageId } };
    } catch (err: any) {
      throw err;
    }
  } else {
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
      subject: subject,
      html: html,
    });

    return { success: true, response };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { email }: SubscribeRequest = await req.json();
    console.log("Newsletter subscription request for:", email);

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Email invalido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: existingSubscriber } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    let subscriberId: string;

    if (existingSubscriber) {
      if (existingSubscriber.status === "unsubscribed") {
        const { data: updated } = await supabase
          .from("newsletter_subscribers")
          .update({ status: "active", subscribed_at: new Date().toISOString(), unsubscribed_at: null })
          .eq("email", email)
          .select()
          .single();
        subscriberId = updated?.id;
        console.log("Subscription reactivated for:", email);
      } else {
        return new Response(
          JSON.stringify({ error: "Email ja esta inscrito" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else {
      const { data: newSubscriber, error: insertError } = await supabase
        .from("newsletter_subscribers")
        .insert({ email })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting subscriber:", insertError);
        throw insertError;
      }
      subscriberId = newSubscriber.id;
      console.log("New subscriber added:", email);
    }

    const { data: emailSettings } = await supabase
      .from("email_settings")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    let canSendEmail = false;
    if (emailSettings) {
      if (emailSettings.provider === "smtp") {
        canSendEmail = !!(emailSettings.smtp_host && emailSettings.smtp_user && emailSettings.smtp_password);
      } else {
        canSendEmail = !!(emailSettings.resend_api_key || Deno.env.get("RESEND_API_KEY"));
      }
    }

    if (!canSendEmail) {
      console.log("Email not configured, skipping welcome email");
      return new Response(
        JSON.stringify({ success: true, message: "Inscricao realizada com sucesso!" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Using email provider:", emailSettings!.provider);

    const { data: logEntry } = await supabase
      .from("newsletter_logs")
      .insert({
        subscriber_id: subscriberId,
        email: email,
        send_type: "welcome",
        status: "pending",
      })
      .select()
      .single();

    const { data: recentPosts } = await supabase
      .from("blog_posts")
      .select("title, slug, excerpt, cover_image, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(3);

    const siteUrl = "https://technedigital.com.br";
    let postsHtml = "";
    if (recentPosts && recentPosts.length > 0) {
      postsHtml = recentPosts
        .map(
          (post) => `
        <div style="margin: 20px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          ${post.cover_image ? `<img src="${post.cover_image}" alt="${post.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;" />` : ""}
          <h3 style="color: #1f2937; margin: 10px 0;">${post.title}</h3>
          <p style="color: #6b7280; margin: 10px 0;">${post.excerpt || ""}</p>
          <a href="${siteUrl}/blog/${post.slug}" 
             style="display: inline-block; margin-top: 10px; padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 4px;">
            Ler mais
          </a>
        </div>
      `
        )
        .join("");
    }

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
            <h2 style="color: #1f2937; margin-top: 0;">Obrigado por se inscrever!</h2>
            <p style="color: #4b5563; font-size: 16px;">
              Estamos felizes em ter voce conosco! A partir de agora, voce recebera nossas ultimas novidades, 
              dicas e insights sobre marketing digital, desenvolvimento web e tecnologia.
            </p>
          </div>

          ${recentPosts && recentPosts.length > 0 ? `
            <h2 style="color: #1f2937; margin-bottom: 20px;">Ultimas Publicacoes</h2>
            <p style="color: #6b7280;">Confira nossos posts mais recentes:</p>
            ${postsHtml}
          ` : ""}

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

    try {
      const result = await sendEmailWithProvider(
        emailSettings as EmailSettings,
        email,
        "Bem-vindo a Newsletter da TECHNE Digital!",
        emailHtml
      );

      if (result.success) {
        console.log("Welcome email sent successfully:", result.response);

        await supabase
          .from("newsletter_logs")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            api_response: result.response,
          })
          .eq("id", logEntry?.id);
      } else {
        throw new Error(result.error);
      }
    } catch (emailError: any) {
      console.error("Failed to send welcome email:", emailError);

      await supabase
        .from("newsletter_logs")
        .update({
          status: "error",
          error_message: emailError.message || "Erro desconhecido",
          api_response: { error: emailError.message },
        })
        .eq("id", logEntry?.id);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Inscricao realizada com sucesso!" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in newsletter-subscribe function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao processar inscricao" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
