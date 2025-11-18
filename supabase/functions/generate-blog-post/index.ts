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
    const contentPrompt = `Você é um especialista em SEO e marketing de conteúdo. Crie um artigo de blog completo e profissional sobre "${topic}" seguindo estas diretrizes rigorosas de SEO:

1. TÍTULO: 50-60 caracteres, com palavra-chave principal no início, atrativo e clicável
2. RESUMO (excerpt): 150-160 caracteres, persuasivo com benefício claro para o leitor
3. CONTEÚDO (1200-1500 palavras em HTML):
   - Use tags HTML semânticas: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>
   - Introdução (2-3 parágrafos) com palavra-chave nos primeiros 100 palavras
   - 4-6 seções principais com <h2> contendo variações da palavra-chave
   - Subseções com <h3> quando relevante
   - Parágrafos curtos (2-4 linhas) para melhor leitura
   - Use bullet points (<ul><li>) para listas e informações importantes
   - Inclua exemplos práticos e dados quando possível
   - Conclusão forte com chamada para ação (CTA)
4. CATEGORIA: Uma categoria relevante (ex: Tecnologia, Marketing, Design, Desenvolvimento, Negócios)
5. TAGS: 5-7 tags relevantes (mix de palavras-chave primárias e secundárias)
6. PROMPT DE IMAGEM: Descrição detalhada e profissional para gerar uma imagem moderna, atrativa e relacionada ao tema (16:9 aspect ratio, estilo profissional, cores vibrantes)

IMPORTANTE: 
- O conteúdo deve ser original, informativo e de alta qualidade
- Use linguagem clara e acessível, mas profissional
- Otimize naturalmente para SEO sem keyword stuffing
- O HTML deve ser válido e bem formatado

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "title": "título do post",
  "excerpt": "resumo atrativo",
  "content": "conteúdo completo em HTML",
  "category": "categoria principal",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "imagePrompt": "descrição detalhada para gerar imagem"
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
    const imagePrompt = `${blogContent.imagePrompt}. Professional blog cover image, 16:9 aspect ratio, vibrant colors, modern design, high quality.`;
    
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

    // Step 4: Generate SEO-friendly slug
    const slug = blogContent.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);

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
