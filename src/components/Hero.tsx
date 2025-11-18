import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import Autoplay from 'embla-carousel-autoplay';

export function Hero() {
  const { t } = useLanguage();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['featured-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolio_projects')
        .select('*')
        .eq('status', 'active')
        .eq('is_featured', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="relative overflow-hidden py-20 md:py-32" style={{ background: 'var(--gradient-hero)' }}>
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>

      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Marketing & Tecnologia</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            {t('hero.title')}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link to="/contact">
              <Button size="lg" className="w-full sm:w-auto group" style={{ background: 'var(--gradient-accent)' }}>
                {t('hero.cta1')}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/services">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t('hero.cta2')}
              </Button>
            </Link>
          </div>

          {/* Portfolio Carousel */}
          <div className="pt-12">
            <div className="relative mx-auto max-w-5xl">
              {isLoading ? (
                <Skeleton className="aspect-video rounded-2xl w-full" />
              ) : projects && projects.length > 0 ? (
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  plugins={[
                    Autoplay({
                      delay: 5000,
                    }),
                  ]}
                  className="w-full"
                >
                  <CarouselContent>
                    {projects.map((project) => (
                      <CarouselItem key={project.id}>
                        <Link to={`/portfolio/${project.slug}`} className="block group">
                          <div className="relative aspect-video rounded-2xl overflow-hidden border border-border/50">
                            {project.cover_image ? (
                              <img
                                src={project.cover_image}
                                alt={project.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                <Sparkles className="w-16 h-16 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-90"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-8">
                              <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                                {project.title}
                              </h3>
                              <p className="text-muted-foreground line-clamp-2">
                                {project.description}
                              </p>
                              {project.client_name && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  Cliente: {project.client_name}
                                </p>
                              )}
                              {project.technologies && project.technologies.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {project.technologies.slice(0, 4).map((tech, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent-foreground"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </Carousel>
              ) : (
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-border/50 flex items-center justify-center">
                  <div className="text-center space-y-4 p-8">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Projetos em destaque aparecerão aqui
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
