import { Helmet } from 'react-helmet';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Portfolio() {
  const { t } = useLanguage();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['portfolio-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolio_projects')
        .select('*')
        .eq('status', 'active')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Portfólio - TECHNE Digital | Projetos e Cases de Sucesso</title>
        <meta name="description" content="Veja nossos projetos e cases de sucesso em marketing digital, criação de sites, SEO e automação. Resultados reais para empresas reais." />
        <link rel="canonical" href="https://technedigital.lovable.app/portfolio" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Portfólio - TECHNE Digital" />
        <meta property="og:description" content="Veja nossos projetos e cases de sucesso em marketing digital, criação de sites, SEO e automação." />
        <meta property="og:url" content="https://technedigital.lovable.app/portfolio" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Portfólio - TECHNE Digital" />
        <meta name="twitter:description" content="Veja nossos projetos e cases de sucesso em marketing digital, criação de sites, SEO e automação." />
      </Helmet>
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32" style={{ background: 'var(--gradient-hero)' }}>
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-up">
              <h1 className="text-4xl md:text-6xl font-bold">{t('portfolio.title')}</h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                {t('portfolio.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Projects Grid */}
        <section className="py-20">
          <div className="container">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-video w-full" />
                    <CardContent className="p-6 space-y-4">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-20 w-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-muted-foreground">
                  Nenhum projeto disponível no momento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project, index) => (
                  <Card 
                    key={project.id} 
                    className="hover-lift overflow-hidden group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Link to={`/portfolio/${project.slug}`}>
                      <div className="aspect-video overflow-hidden relative">
                        {/* Badge Case de Sucesso */}
                        {project.is_featured && (
                          <div className="absolute top-4 left-4 z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold shadow-lg backdrop-blur-sm border border-accent/20">
                              <Trophy className="w-3 h-3" />
                              <span>Case de Sucesso</span>
                            </div>
                          </div>
                        )}
                        
                        {project.cover_image ? (
                          <img 
                            src={project.cover_image} 
                            alt={project.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground">Sem imagem</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-xl font-semibold">{project.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {project.technologies?.slice(0, 3).map((tech: string) => (
                          <Badge key={tech} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                        {project.tags?.slice(0, 2).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {project.client_name && (
                        <div className="pt-4 border-t border-border/50">
                          <p className="text-sm font-semibold text-accent">
                            Cliente: {project.client_name}
                          </p>
                        </div>
                      )}

                      <Button asChild variant="outline" className="w-full group/btn">
                        <Link to={`/portfolio/${project.slug}`}>
                          {t('portfolio.view')}
                          <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
