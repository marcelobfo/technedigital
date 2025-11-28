import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendNewsletterRequest {
  post_id: string;
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

    // Fetch the blog post
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

    // Fetch email settings
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

    // Get Resend API key from settings or env
    const resendApiKey = emailSettings.resend_api_key || Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Chave da API Resend não configurada" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);
    const fromEmail = emailSettings.resend_from_email || "onboarding@resend.dev";
    const fromName = emailSettings.resend_from_name || "TECHNE Digital";

    // Fetch all active subscribers
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

    // Build email HTML
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
            <h2 style="color: #1f2937; margin-top: 0;">🆕 Novo Post no Blog!</h2>
            <p style="color: #4b5563; font-size: 16px;">
              Acabamos de publicar um novo artigo que você vai adorar!
            </p>
          </div>

          <div style="margin: 20px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            ${post.cover_image ? `<img src="${post.cover_image}" alt="${post.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;" />` : ""}
            <h3 style="color: #1f2937; margin: 10px 0; font-size: 20px;">${post.title}</h3>
            <p style="color: #6b7280; margin: 10px 0;">${post.excerpt || ""}</p>
            <a href="${postUrl}" 
               style="display: inline-block; margin-top: 10px; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 4px; font-weight: 600;">
              Ler artigo completo →
            </a>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 14px;">
            <p>
              Você está recebendo este email porque se inscreveu na nossa newsletter.
              <br>
              <a href="${siteUrl}/unsubscribe" style="color: #667eea; text-decoration: none;">Cancelar inscrição</a>
            </p>
            <p style="margin-top: 10px;">
              © ${new Date().getFullYear()} TECHNE Digital. Todos os direitos reservados.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send emails to all subscribers and log results
    let sentCount = 0;
    let errorCount = 0;

    for (const subscriber of subscribers) {
      // Create pending log entry
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
        const emailResponse = await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: [subscriber.email],
          subject: `📰 ${post.title}`,
          html: emailHtml,
        });

        console.log(`Email sent to ${subscriber.email}:`, emailResponse);

        // Update log with success
        await supabase
          .from("newsletter_logs")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            api_response: emailResponse,
          })
          .eq("id", logEntry?.id);

        sentCount++;
      } catch (emailError: any) {
        console.error(`Failed to send to ${subscriber.email}:`, emailError);

        // Update log with error
        await supabase
          .from("newsletter_logs")
          .update({
            status: "error",
            error_message: emailError.message || "Erro desconhecido",
            api_response: { error: emailError.message, statusCode: emailError.statusCode },
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
