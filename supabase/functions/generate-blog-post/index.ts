import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic } = await req.json();
    console.log('Generating blog post for topic:', topic);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Generate blog content with AI
    console.log('Step 1: Generating content with AI...');
    const contentPrompt = `Você é um especialista em copywriting e marketing de conteúdo que cria artigos que CONVERTEM. 

Crie um artigo de blog completo sobre "${topic}" seguindo estas diretrizes:

1. TÍTULO: 50-60 caracteres, use gatilhos mentais (números, "segredos", "erros", "guia"), palavra-chave no início

2. RESUMO (excerpt): 150-160 caracteres, crie curiosidade e prometa benefício claro

3. CONTEÚDO (1200-1500 palavras em HTML):
   ESTRUTURA:
   - Introdução (2-3 parágrafos): Fale DIRETAMENTE com o leitor, use "você", apresente uma dor ou desejo
   - 4-6 seções principais com <h2>: Use títulos diretos e acionáveis
   - Use <h3> para subseções
   - Parágrafos curtos (2-3 linhas máximo)
   - Use bullet points (<ul><li>) para listas
   - Exemplos REAIS sempre que possível
   - Inclua dados e números específicos
   
   TOM DE VOZ:
   - Conversacional e direto (use "você", "seu", "sua")
   - Prático e sem enrolação
   - Empático com as dores do leitor
   - Confident mas não arrogante
   
   CTAs ESTRATÉGICOS (incluir 2-3 ao longo do conteúdo):
   - Meio do artigo: "Quer uma análise gratuita do seu site? Fale conosco!"
   - Final: "Pronto para transformar seu site em máquina de vendas? Entre em contato!"
   - Pode incluir: "Baixe nosso checklist gratuito", "Agende uma consultoria", etc.
   
   LINKS ESTRATÉGICOS (incluir 3-5 links ao longo do conteúdo):
   
   LINKS INTERNOS (2-3 obrigatórios):
   Use anchor text natural e relevante linkando para:
   - Blog: <a href="/blog">nosso blog</a>
   - Serviços: <a href="/services">nossos serviços</a>
   - Portfólio: <a href="/portfolio">portfólio de projetos</a>
   - Sobre: <a href="/about">sobre nós</a>
   - Contato: <a href="/contact">entre em contato</a>
   
   Exemplos de uso natural:
   - "Confira nosso [portfólio de projetos](/portfolio) para ver casos reais"
   - "Descubra como [nossos serviços](/services) podem ajudar você"
   - "Leia mais no [nosso blog](/blog) sobre estratégias digitais"
   
   LINKS EXTERNOS (2-3 recomendados para autoridade):
   Linke para sites de referência como:
   - Ferramentas: Google Analytics, Search Console, HubSpot, SEMrush
   - Estudos: Neil Patel, Moz, Backlinko, Content Marketing Institute
   - Plataformas: WordPress.org, Shopify, WooCommerce
   - Docs oficiais: developers.google.com, react.dev, etc.
   
   Use target="_blank" e rel="noopener noreferrer" para links externos:
   <a href="https://blog.hubspot.com" target="_blank" rel="noopener noreferrer">HubSpot</a>
   
   REGRAS:
   - Links internos: sem target blank (navegação no mesmo site)
   - Links externos: target="_blank" rel="noopener noreferrer" (abre em nova aba)
   - Anchor text natural (não use "clique aqui", use texto descritivo)
   - Espalhe os links ao longo do conteúdo (não todos no final)
   - Links devem ser relevantes ao contexto da frase
   
   SEO:
   - Palavra-chave nos primeiros 100 palavras
   - Variações da palavra-chave nos <h2>
   - 3-5 links no total (internos + externos)
   - Meta description otimizada

4. CATEGORIA: Escolha entre: Marketing, Tecnologia, Design, Negócios, E-commerce, Ferramentas

5. TAGS: 5-7 tags práticas (mix de palavras-chave + long-tail)

6. PROMPT DE IMAGEM: Descrição profissional, moderna, cores vibrantes, 16:9, relacionada ao tema

CRÍTICO:
- Use linguagem CLARA e DIRETA
- Foque em RESULTADOS e BENEFÍCIOS, não só teoria
- Inclua pelo menos 2 CTAs para contato/conversão
- Inclua 2-3 links internos (/blog, /services, /portfolio, /contact)
- Inclua 2-3 links externos para sites de autoridade (com target="_blank")
- Crie senso de urgência ou exclusividade quando apropriado
- NUNCA use jargões desnecessários

Retorne APENAS JSON válido:
{
  "title": "título com gatilho mental",
  "excerpt": "resumo que gera curiosidade",
  "content": "conteúdo completo em HTML com CTAs",
  "category": "categoria principal",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "imagePrompt": "descrição detalhada"
}`;

    const contentResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um especialista em criação de conteúdo SEO-optimizado. Sempre retorne JSON válido.' },
          { role: 'user', content: contentPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error('AI content generation error:', contentResponse.status, errorText);
      throw new Error(`AI content generation failed: ${contentResponse.status}`);
    }

    const contentData = await contentResponse.json();
    const aiResponse = contentData.choices[0].message.content;
    console.log('AI raw response:', aiResponse);

    // Parse JSON from AI response (handle markdown code blocks)
    let blogContent;
    try {
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
      blogContent = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw response:', aiResponse);
      throw new Error('Failed to parse AI response as JSON');
    }

    console.log('Parsed blog content:', blogContent);

    // Step 2: Generate cover image with AI
    console.log('Step 2: Generating cover image with AI...');
    const imagePrompt = `${blogContent.imagePrompt}. IMPORTANTE: Criar imagem SEM QUALQUER TEXTO. Imagem conceitual e visual apenas, profissional para capa de blog, proporção 16:9, cores vibrantes, design moderno e clean, apenas elementos visuais e ilustrações, alta qualidade, estilo profissional.`;
    
    const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: imagePrompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('AI image generation error:', imageResponse.status, errorText);
      throw new Error(`AI image generation failed: ${imageResponse.status}`);
    }

    const imageData = await imageResponse.json();
    const generatedImageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!generatedImageUrl) {
      console.error('No image in AI response:', imageData);
      throw new Error('AI did not return an image');
    }

    console.log('Image generated successfully');

    // Step 3: Upload image to Supabase Storage
    console.log('Step 3: Uploading image to storage...');
    const base64Data = generatedImageUrl.split(',')[1];
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `${Date.now()}-${blogContent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50)}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    console.log('Image uploaded:', publicUrl);

    // Step 4: Generate SEO-friendly slug with uniqueness check
    let baseSlug = blogContent.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);

    // Check for existing slug and add suffix if necessary
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const { data: existingPost } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      
      if (!existingPost) break; // Slug is unique
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    console.log(`Generated unique slug: ${slug}`);

    // Step 5: Get first admin user as author
    const { data: adminUser, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (adminError || !adminUser) {
      console.error('Failed to get admin user:', adminError);
      throw new Error('No admin user found for authoring posts');
    }

    // Step 6: Insert blog post into database
    console.log('Step 4: Inserting post into database...');
    const { data: postData, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        title: blogContent.title,
        slug: slug,
        content: blogContent.content,
        excerpt: blogContent.excerpt,
        cover_image: publicUrl,
        category: blogContent.category,
        tags: blogContent.tags,
        status: 'published',
        published_at: new Date().toISOString(),
        author_id: adminUser.id
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Failed to insert post: ${insertError.message}`);
    }

    console.log('Blog post created successfully:', postData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        postId: postData.id,
        title: blogContent.title,
        slug: slug,
        coverImage: publicUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-post:', error);
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
