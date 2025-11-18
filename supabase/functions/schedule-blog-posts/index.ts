import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Topic pool for blog posts - diversified and relevant
const topicsByDay: Record<string, string[]> = {
  monday: [
    "Tendências de Desenvolvimento Web para 2025",
    "Como criar uma Landing Page de Alta Conversão",
    "Melhores Práticas de UX/UI Design",
    "Otimização de Performance Web: Guia Completo",
    "Arquitetura de Microserviços Moderna"
  ],
  wednesday: [
    "SEO Técnico: Como Ranquear no Google em 2025",
    "Marketing Digital: Estratégias que Funcionam",
    "Inteligência Artificial no E-commerce",
    "Design System: Como Criar e Manter",
    "Automação de Marketing: Ferramentas Essenciais"
  ],
  friday: [
    "Segurança Web: Protegendo sua Aplicação",
    "React vs Vue vs Angular: Comparativo 2025",
    "Como Monetizar seu Blog ou Site",
    "Ferramentas de Produtividade para Desenvolvedores",
    "Cloud Computing: AWS, Azure ou Google Cloud?"
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
