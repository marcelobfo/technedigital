import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowLeft, Share2 } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  return (
    <div className="min-h-screen flex flex-col">
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

        {/* Post Header */}
        <article className="py-12">
          <div className="container max-w-4xl">
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

            {/* Author Info */}
            <div className="mt-16 pt-8 border-t border-border/40">
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
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
