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

// Função para formatar número de telefone brasileiro
function formatBrazilianPhone(phone: string): string {
  // Remove todos os caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '');
  
  console.log(`📱 Número original: ${phone}`);
  console.log(`📱 Número limpo: ${cleaned} (${cleaned.length} dígitos)`);
  
  // Se já tem 55 no início e tem 12 ou 13 dígitos, está correto
  if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
    console.log(`✅ Número já formatado corretamente: ${cleaned}`);
    return cleaned;
  }
  
  // Se começa com 55, remove para reprocessar
  if (cleaned.startsWith('55')) {
    cleaned = cleaned.substring(2);
  }
  
  // Número brasileiro completo: DDD (2 dígitos) + número (8 ou 9 dígitos)
  // Celular: 9 dígitos (começa com 9)
  // Fixo: 8 dígitos
  
  // Se tem 11 dígitos (DDD + celular com 9)
  if (cleaned.length === 11) {
    const result = '55' + cleaned;
    console.log(`✅ Adicionado código do país: ${result}`);
    return result;
  }
  
  // Se tem 10 dígitos (DDD + fixo ou celular antigo sem 9)
  if (cleaned.length === 10) {
    // Verificar se é celular (começa com 9 no terceiro dígito ou número do celular)
    const ddd = cleaned.substring(0, 2);
    const number = cleaned.substring(2);
    
    // Se o número começa com 9, 8, 7 (indicativo de celular), adicionar 9 na frente
    if (['9', '8', '7'].includes(number.charAt(0))) {
      const result = '55' + ddd + '9' + number;
      console.log(`✅ Adicionado código do país e 9: ${result}`);
      return result;
    }
    
    const result = '55' + cleaned;
    console.log(`✅ Adicionado código do país (número fixo): ${result}`);
    return result;
  }
  
  // Se tem 9 dígitos (só o número do celular sem DDD)
  if (cleaned.length === 9) {
    // Assumir DDD 11 (São Paulo) como padrão se não tiver
    const result = '5511' + cleaned;
    console.log(`⚠️ Sem DDD, assumindo 11: ${result}`);
    return result;
  }
  
  // Se tem 8 dígitos (número fixo ou celular antigo sem DDD)
  if (cleaned.length === 8) {
    // Assumir DDD 11 e adicionar 9 se parecer celular
    if (['9', '8', '7'].includes(cleaned.charAt(0))) {
      const result = '55119' + cleaned;
      console.log(`⚠️ Sem DDD, assumindo 11 e adicionando 9: ${result}`);
      return result;
    }
    const result = '5511' + cleaned;
    console.log(`⚠️ Sem DDD, assumindo 11: ${result}`);
    return result;
  }
  
  // Para outros casos, adicionar 55 e retornar
  const result = '55' + cleaned;
  console.log(`⚠️ Formato não reconhecido, adicionando 55: ${result}`);
  return result;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let logId: string | null = null;

  try {
    const { lead_id, phone_number, lead_name }: WelcomeWhatsAppRequest = await req.json();

    console.log("🚀 Iniciando envio de mensagem de boas-vindas");
    console.log(`👤 Lead: ${lead_name} (${lead_id})`);
    console.log(`📞 Telefone recebido: ${phone_number}`);

    // Formatar número
    const formattedPhone = formatBrazilianPhone(phone_number);

    // Criar log inicial
    const { data: logData, error: logError } = await supabase
      .from("whatsapp_logs")
      .insert({
        lead_id: lead_id,
        phone_number: phone_number,
        formatted_phone: formattedPhone,
        message_type: "welcome",
        status: "pending",
      })
      .select()
      .single();

    if (logData) {
      logId = logData.id;
      console.log(`📝 Log criado: ${logId}`);
    }

    // Buscar configurações do WhatsApp
    const { data: whatsappSettings, error: settingsError } = await supabase
      .from("whatsapp_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    if (settingsError || !whatsappSettings) {
      console.log("⚠️ WhatsApp não configurado ou inativo");
      
      if (logId) {
        await supabase
          .from("whatsapp_logs")
          .update({ status: "skipped", error_message: "WhatsApp não configurado ou inativo" })
          .eq("id", logId);
      }

      return new Response(
        JSON.stringify({ success: false, message: "WhatsApp não configurado" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`⚙️ Configuração encontrada: ${whatsappSettings.instance_name}`);
    console.log(`🌐 API URL: ${whatsappSettings.api_url}`);

    // Mensagem de boas-vindas
    const message = `Olá *${lead_name}*! 👋\n\n` +
      `Obrigado pelo seu contato com a *TECHNE Digital*! 🚀\n\n` +
      `Recebemos sua mensagem e um de nossos especialistas entrará em contato em breve para entender melhor suas necessidades.\n\n` +
      `Enquanto isso, fique à vontade para nos enviar mais informações que possam nos ajudar a preparar a melhor solução para você.\n\n` +
      `_Equipe TECHNE Digital_ ✨`;

    // Enviar mensagem via WhatsApp API
    const whatsappUrl = `${whatsappSettings.api_url}/message/sendText/${whatsappSettings.instance_name}`;
    
    console.log(`📤 Enviando para: ${whatsappUrl}`);
    console.log(`📱 Número formatado: ${formattedPhone}`);
    
    const requestBody = {
      number: formattedPhone,
      text: message,
    };

    console.log(`📦 Request body:`, JSON.stringify(requestBody));
    
    const whatsappResponse = await fetch(whatsappUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": whatsappSettings.api_token,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await whatsappResponse.text();
    console.log(`📥 Response status: ${whatsappResponse.status}`);
    console.log(`📥 Response body: ${responseText}`);

    let responseData: any = null;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!whatsappResponse.ok) {
      console.error("❌ Erro na API do WhatsApp:", responseText);
      
      if (logId) {
        await supabase
          .from("whatsapp_logs")
          .update({ 
            status: "error", 
            error_message: responseText,
            api_response: responseData
          })
          .eq("id", logId);
      }

      throw new Error(`Erro ao enviar mensagem: ${responseText}`);
    }

    console.log("✅ Mensagem enviada com sucesso!");

    // Atualizar log com sucesso
    if (logId) {
      await supabase
        .from("whatsapp_logs")
        .update({ 
          status: "sent", 
          api_response: responseData
        })
        .eq("id", logId);
    }

    // Log activity
    try {
      await supabase.from("lead_activities").insert({
        lead_id: lead_id,
        user_id: lead_id, // Usar lead_id como fallback
        activity_type: "note",
        description: `✅ Mensagem automática de boas-vindas enviada via WhatsApp para ${formattedPhone}`,
      });
    } catch (activityError) {
      console.log("⚠️ Erro ao criar atividade (não crítico):", activityError);
    }

    return new Response(
      JSON.stringify({ success: true, data: responseData, formatted_phone: formattedPhone }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("❌ Erro ao enviar WhatsApp:", error);
    
    if (logId) {
      await supabase
        .from("whatsapp_logs")
        .update({ 
          status: "error", 
          error_message: error.message
        })
        .eq("id", logId);
    }

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
