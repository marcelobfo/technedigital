import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function PortfolioProject() {
  const { slug } = useParams<{ slug: string }>();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['portfolio-project', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolio_projects')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-20">
          <div className="container max-w-4xl space-y-8">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-20">
          <div className="container max-w-4xl text-center space-y-4">
            <h1 className="text-4xl font-bold">Projeto não encontrado</h1>
            <p className="text-muted-foreground">
              O projeto que você está procurando não existe ou foi removido.
            </p>
            <Button asChild>
              <Link to="/portfolio">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao portfólio
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-20" style={{ background: 'var(--gradient-hero)' }}>
          <div className="container max-w-4xl">
            <Link 
              to="/portfolio" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao portfólio
            </Link>
            
            <div className="space-y-6 animate-fade-up">
              <h1 className="text-4xl md:text-5xl font-bold">{project.title}</h1>
              <p className="text-lg text-muted-foreground">
                {project.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {project.technologies?.map((tech: string) => (
                  <Badge key={tech} variant="secondary">
                    {tech}
                  </Badge>
                ))}
                {project.tags?.map((tag: string) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              {project.project_url && (
                <Button asChild className="group">
                  <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                    Visitar projeto
                    <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Cover Image */}
        {project.cover_image && (
          <section className="py-12">
            <div className="container max-w-4xl">
              <div className="aspect-video rounded-lg overflow-hidden shadow-2xl">
                <img 
                  src={project.cover_image} 
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </section>
        )}

        {/* Project Details */}
        <section className="py-12">
          <div className="container max-w-4xl space-y-12">
            {project.client_name && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Cliente</h2>
                <p className="text-lg text-muted-foreground">{project.client_name}</p>
              </div>
            )}

            {project.challenge && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Desafio</h2>
                <div 
                  className="prose prose-neutral dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: project.challenge }}
                />
              </div>
            )}

            {project.solution && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Solução</h2>
                <div 
                  className="prose prose-neutral dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: project.solution }}
                />
              </div>
            )}

            {project.results && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Resultados</h2>
                <div 
                  className="prose prose-neutral dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: project.results }}
                />
              </div>
            )}

            {/* Gallery Images */}
            {project.gallery_images && project.gallery_images.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Galeria</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {project.gallery_images.map((image: string, index: number) => (
                    <div key={index} className="aspect-video rounded-lg overflow-hidden shadow-lg">
                      <img 
                        src={image} 
                        alt={`${project.title} - Imagem ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20" style={{ background: 'var(--gradient-accent)' }}>
          <div className="container max-w-4xl text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Pronto para criar algo incrível?
            </h2>
            <p className="text-lg text-muted-foreground">
              Vamos transformar sua ideia em realidade
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link to="/contact">Fale conosco</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
