import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const baseUrl = 'https://technedigital.com.br';
    const today = new Date().toISOString().split('T')[0];

    // Buscar posts publicados
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false });

    // Buscar projetos ativos
    const { data: projects } = await supabase
      .from('portfolio_projects')
      .select('slug, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Buscar serviços ativos
    const { data: services } = await supabase
      .from('services')
      .select('slug')
      .eq('status', 'active');

    // URLs estáticas
    const staticUrls = [
      { loc: baseUrl, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/about`, priority: '0.8', changefreq: 'monthly' },
      { loc: `${baseUrl}/services`, priority: '0.9', changefreq: 'weekly' },
      { loc: `${baseUrl}/portfolio`, priority: '0.9', changefreq: 'weekly' },
      { loc: `${baseUrl}/blog`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/contact`, priority: '0.8', changefreq: 'monthly' },
    ];

    // URLs dinâmicas - Blog
    const blogUrls = (posts || []).map(post => ({
      loc: `${baseUrl}/blog/${post.slug}`,
      lastmod: post.updated_at.split('T')[0],
      priority: '0.7',
      changefreq: 'monthly'
    }));

    // URLs dinâmicas - Portfolio
    const portfolioUrls = (projects || []).map(project => ({
      loc: `${baseUrl}/portfolio/${project.slug}`,
      lastmod: project.created_at.split('T')[0],
      priority: '0.7',
      changefreq: 'monthly'
    }));

    // Gerar XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Adicionar URLs estáticas
    staticUrls.forEach(url => {
      xml += '  <url>\n';
      xml += `    <loc>${url.loc}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // Adicionar URLs de blog
    blogUrls.forEach(url => {
      xml += '  <url>\n';
      xml += `    <loc>${url.loc}</loc>\n`;
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // Adicionar URLs de portfolio
    portfolioUrls.forEach(url => {
      xml += '  <url>\n';
      xml += `    <loc>${url.loc}</loc>\n`;
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    console.log(`✅ Sitemap gerado com sucesso! Total de URLs: ${staticUrls.length + blogUrls.length + portfolioUrls.length}`);

    return new Response(xml, {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    console.error('❌ Erro ao gerar sitemap:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
