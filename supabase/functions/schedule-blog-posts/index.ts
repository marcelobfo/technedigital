import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Topic pool - diversificado com foco em conversão e engajamento
const topicsByDay: Record<string, string[]> = {
  monday: [
    "5 Sacadas que Fizeram Nossos Clientes Venderem 3x Mais Online",
    "O Erro #1 que Está Matando Suas Conversões (e Como Corrigir Hoje)",
    "A Tática Simples que Dobrou o Tráfego Orgânico em 60 Dias",
    "3 Segredos de Landing Pages que Convertem Acima de 15%",
    "Como Automatizar Seu Marketing Digital em 20 Minutos"
  ],
  wednesday: [
    "WordPress vs Webflow: Qual Escolher Para Seu Negócio em 2025?",
    "RD Station vs HubSpot: Testamos as Duas (Veja o Resultado)",
    "Shopify, Nuvemshop ou WooCommerce: Guia Definitivo para E-commerce",
    "As 7 Melhores Ferramentas de Automação de Marketing (Testadas por Nós)",
    "Google Ads vs Facebook Ads: Onde Investir Seu Orçamento?"
  ],
  friday: [
    "Seu Site Não Converte? 4 Erros Que Você Pode Estar Cometendo",
    "Checklist Gratuito: 15 Pontos para Auditar Seu Site Agora",
    "Pequeno Negócio: Como Competir com Grandes Empresas Online",
    "Quanto Custa um Site Profissional? [Calculadora Gratuita]",
    "7 Sinais de que Seu Site Precisa de Redesign URGENTE"
  ]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { day } = await req.json();
    console.log('Schedule triggered for day:', day);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if automation is enabled
    console.log('Checking automation status...');
    const { data: blogSettings, error: settingsError } = await supabase
      .from('blog_settings')
      .select('automation_enabled')
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      throw settingsError;
    }

    if (!blogSettings || !blogSettings.automation_enabled) {
      console.log('Automation is disabled, skipping post generation');
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Automation is disabled',
          day: day
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Automation is enabled, proceeding with post generation');

    // Select topic based on day of the week
    const dayKey = day.toLowerCase();
    const topics = topicsByDay[dayKey] || topicsByDay.monday;
    
    // Randomly select a topic from the day's pool
    const selectedTopic = topics[Math.floor(Math.random() * topics.length)];
    
    console.log('Selected topic:', selectedTopic);

    // Call generate-blog-post function
    const { data, error } = await supabase.functions.invoke('generate-blog-post', {
      body: { topic: selectedTopic }
    });

    if (error) {
      console.error('Error generating blog post:', error);
      throw error;
    }

    console.log('Blog post generated successfully:', data);

    // Log the success (optional: could save to a logs table)
    return new Response(
      JSON.stringify({ 
        success: true,
        day: day,
        topic: selectedTopic,
        result: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in schedule-blog-posts:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
