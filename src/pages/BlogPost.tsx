import { Helmet } from 'react-helmet';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, ArrowLeft, Share2, ArrowRight } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BlogSidebar } from '@/components/blog/BlogSidebar';

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*, profiles(full_name)')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      return data;
    },
  });

  // Fetch related posts (same category or similar tags)
  const { data: relatedPosts = [] } = useQuery({
    queryKey: ['related-posts', post?.category, post?.tags],
    enabled: !!post,
    queryFn: async () => {
      if (!post) return [];
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, cover_image, excerpt, category, published_at, created_at')
        .eq('status', 'published')
        .neq('id', post.id)
        .or(`category.eq.${post.category},tags.ov.{${post.tags?.join(',') || ''}}`)
        .order('published_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleShare = async () => {
    if (!post) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.excerpt || '',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link copiado!',
          description: 'O link do post foi copiado para a área de transferência.',
        });
      }
    } catch (error) {
      // User cancelled share or clipboard write failed
      console.log('Share cancelled or failed');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Post não encontrado</h1>
            <p className="text-muted-foreground">O post que você procura não existe ou foi removido.</p>
            <Link to="/blog">
              <Button>Voltar ao blog</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const authorName = (post.profiles as any)?.full_name || 'TECHNE Digital';

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://technedigital.lovable.app';
  const postUrl = `${siteUrl}/blog/${slug}`;
  const publishDate = post.published_at || post.created_at;

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{post.title} | TECHNE Digital Blog</title>
        <meta name="description" content={post.excerpt || post.title} />
        <meta name="keywords" content={post.tags?.join(', ') || post.category} />
        <link rel="canonical" href={postUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || post.title} />
        <meta property="og:url" content={postUrl} />
        {post.cover_image && <meta property="og:image" content={post.cover_image} />}
        <meta property="article:published_time" content={publishDate} />
        <meta property="article:author" content={authorName} />
        <meta property="article:section" content={post.category} />
        {post.tags?.map((tag: string) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt || post.title} />
        {post.cover_image && <meta name="twitter:image" content={post.cover_image} />}

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.excerpt || post.title,
            "image": post.cover_image || undefined,
            "datePublished": publishDate,
            "dateModified": post.updated_at || publishDate,
            "author": {
              "@type": "Organization",
              "name": authorName,
            },
            "publisher": {
              "@type": "Organization",
              "name": "TECHNE Digital",
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": postUrl,
            },
            "articleSection": post.category,
            "keywords": post.tags?.join(', ') || post.category,
          })}
        </script>
      </Helmet>

      <Header />
      
      <main className="flex-1">
        {/* Back Button */}
        <div className="container pt-8">
          <Link to="/blog">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao blog
            </Button>
          </Link>
        </div>

        {/* Post Content with Sidebar */}
        <div className="container py-12">
          <div className="grid lg:grid-cols-[1fr_300px] gap-8">
            {/* Main Content */}
            <article className="max-w-4xl">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Link to="/" className="hover:text-foreground">Home</Link>
                <span>/</span>
                <Link to="/blog" className="hover:text-foreground">Blog</Link>
                <span>/</span>
                <Link to={`/blog?category=${post.category}`} className="hover:text-foreground">{post.category}</Link>
              </nav>

              <div className="space-y-6 mb-12">
                <Badge>{post.category}</Badge>
                <h1 className="text-4xl md:text-5xl font-bold">{post.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(post.published_at || post.created_at).toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleShare}
                  className="ml-auto"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </div>
            </div>

            {/* Featured Image */}
            {post.cover_image && (
              <div className="aspect-video rounded-lg overflow-hidden mb-12">
                <img 
                  src={post.cover_image} 
                  alt={post.title}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            )}

            {/* Post Content */}
            <div 
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border/40">
                <p className="text-sm text-muted-foreground mb-3">Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag: string) => (
                    <Link key={tag} to={`/blog?tag=${tag}`}>
                      <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Author Info */}
            <div className="mt-8 pt-8 border-t border-border/40">
              <p className="text-sm text-muted-foreground mb-4">Escrito por</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold">
                  {authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{authorName}</p>
                  <p className="text-sm text-muted-foreground">
                    Agência de Marketing e Tecnologia
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-16 p-8 rounded-lg bg-muted/30 text-center space-y-4">
              <h3 className="text-2xl font-bold">Gostou deste conteúdo?</h3>
              <p className="text-muted-foreground">
                Entre em contato e descubra como podemos transformar seus resultados digitais.
              </p>
              <Link to="/contact">
                <Button size="lg" style={{ background: 'var(--gradient-accent)' }}>
                  Fale com um especialista
                </Button>
              </Link>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-16 pt-8 border-t border-border/40">
                <h3 className="text-2xl font-bold mb-8">Posts Relacionados</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {relatedPosts.map((relatedPost) => (
                    <Link key={relatedPost.id} to={`/blog/${relatedPost.slug}`}>
                      <Card className="group hover-lift h-full">
                        <CardContent className="p-0">
                          {relatedPost.cover_image && (
                            <div className="aspect-video overflow-hidden rounded-t-lg">
                              <img
                                src={relatedPost.cover_image}
                                alt={relatedPost.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="p-4 space-y-2">
                            <Badge className="mb-2">{relatedPost.category}</Badge>
                            <h4 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                              {relatedPost.title}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {relatedPost.excerpt}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                              <Calendar className="w-3 h-3" />
                              {new Date(relatedPost.published_at || relatedPost.created_at).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <BlogSidebar />
          </aside>
        </div>
      </div>
    </main>

      <Footer />
    </div>
  );
}
