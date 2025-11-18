import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SubscribeRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: SubscribeRequest = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if email already exists
    const { data: existingSubscriber } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (existingSubscriber) {
      if (existingSubscriber.status === "unsubscribed") {
        // Reactivate subscription
        await supabase
          .from("newsletter_subscribers")
          .update({ status: "active", subscribed_at: new Date().toISOString() })
          .eq("email", email);
      } else {
        return new Response(
          JSON.stringify({ error: "Email já está inscrito" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    } else {
      // Insert new subscriber
      const { error: insertError } = await supabase
        .from("newsletter_subscribers")
        .insert({ email });

      if (insertError) {
        console.error("Error inserting subscriber:", insertError);
        throw insertError;
      }
    }

    // Fetch recent published posts
    const { data: recentPosts } = await supabase
      .from("blog_posts")
      .select("title, slug, excerpt, cover_image, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(3);

    // Build email HTML with recent posts
    let postsHtml = "";
    if (recentPosts && recentPosts.length > 0) {
      postsHtml = recentPosts
        .map(
          (post) => `
        <div style="margin: 20px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          ${
            post.cover_image
              ? `<img src="${post.cover_image}" alt="${post.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;" />`
              : ""
          }
          <h3 style="color: #1f2937; margin: 10px 0;">${post.title}</h3>
          <p style="color: #6b7280; margin: 10px 0;">${post.excerpt || ""}</p>
          <a href="${supabaseUrl.replace(
            "qtmjhkztsghpisykhdrc.supabase.co",
            window.location?.hostname || "seu-site.com"
          )}/blog/${post.slug}" 
             style="display: inline-block; margin-top: 10px; padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 4px;">
            Ler mais
          </a>
        </div>
      `
        )
        .join("");
    }

    // Send welcome email with recent posts
    const emailResponse = await resend.emails.send({
      from: "TECHNE Digital <onboarding@resend.dev>",
      to: [email],
      subject: "Bem-vindo à Newsletter da TECHNE Digital! 🚀",
      html: `
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
              <h2 style="color: #1f2937; margin-top: 0;">Obrigado por se inscrever! 🎉</h2>
              <p style="color: #4b5563; font-size: 16px;">
                Estamos felizes em ter você conosco! A partir de agora, você receberá nossas últimas novidades, 
                dicas e insights sobre marketing digital, desenvolvimento web e tecnologia.
              </p>
            </div>

            ${
              recentPosts && recentPosts.length > 0
                ? `
              <h2 style="color: #1f2937; margin-bottom: 20px;">📚 Últimas Publicações</h2>
              <p style="color: #6b7280;">Confira nossos posts mais recentes:</p>
              ${postsHtml}
            `
                : ""
            }

            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 14px;">
              <p>
                Você está recebendo este email porque se inscreveu na nossa newsletter.
                <br>
                <a href="#" style="color: #667eea; text-decoration: none;">Cancelar inscrição</a>
              </p>
              <p style="margin-top: 10px;">
                © ${new Date().getFullYear()} TECHNE Digital. Todos os direitos reservados.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Inscrição realizada com sucesso!" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in newsletter-subscribe function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao processar inscrição" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
