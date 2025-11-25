import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Sparkles, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import Autoplay from 'embla-carousel-autoplay';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { LeadFormDialog } from '@/components/LeadFormDialog';
import macbookFrame from '@/assets/macbook-frame.png';
export function Hero() {
  const {
    t
  } = useLanguage();
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const {
    data: projects,
    isLoading
  } = useQuery({
    queryKey: ['featured-projects'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('portfolio_projects').select('*').eq('status', 'active').eq('is_featured', true).order('display_order', {
        ascending: true
      });
      if (error) throw error;
      return data;
    }
  });
  useEffect(() => {
    if (!api) return;
    api.on('select', () => {
      setCurrentIndex(api.selectedScrollSnap());
    });
  }, [api]);
  return <section className="relative overflow-hidden py-20 md:py-32 pb-32" style={{
    background: 'var(--gradient-hero)'
  }}>
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
            <LeadFormDialog trigger={<Button size="lg" className="w-full sm:w-auto group" style={{
            background: 'var(--gradient-accent)'
          }}>
                  {t('hero.cta1')}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>} defaultMessage="Gostaria de solicitar um orçamento para meu projeto." />
            <Link to="/portfolio">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t('hero.cta2')}
              </Button>
            </Link>
          </div>

          {/* Cases de Sucesso Section */}
          <div className="pt-16">
            <div className="text-center mb-8 space-y-4 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium border border-accent/20">
                <Trophy className="w-4 h-4" />
                <span>Cases de Sucesso</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Projetos que Transformaram Negócios
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Conheça alguns dos projetos que desenvolvemos e os resultados alcançados
              </p>
            </div>

            <div className="relative mx-auto max-w-5xl">
              {isLoading ? <div className="relative w-full">
                  <img src={macbookFrame} alt="MacBook Frame" className="w-full h-auto" />
                  <div className="absolute top-[6%] left-[12.5%] right-[12.5%] bottom-[22%]">
                    <Skeleton className="w-full h-full rounded-lg" />
                  </div>
                </div> : projects && projects.length > 0 ? <div className="relative w-full">
                  {/* MacBook Frame */}
                  <img src={macbookFrame} alt="MacBook Frame" className="w-full h-auto relative z-10 pointer-events-none" />
                  
                  {/* Carousel dentro da tela do MacBook */}
                  <div className="absolute top-[6%] left-[12.5%] right-[12.5%] bottom-[22%] overflow-hidden rounded-lg">
                    <Carousel setApi={setApi} opts={{
                  align: "start",
                  loop: true
                }} plugins={[Autoplay({
                  delay: 5000
                })]} className="w-full h-full">
                      <CarouselContent className="h-full">
                        {projects.map(project => <CarouselItem key={project.id} className="h-full">
                            <Link to={`/portfolio/${project.slug}`} className="block group h-full">
                              <div className="relative w-full h-full my-[50px]">
                                {/* Badge Case de Sucesso */}
                                <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10">
                                  <div className="inline-flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-accent/10 text-accent text-[10px] md:text-xs font-semibold shadow-lg backdrop-blur-sm border border-accent/20">
                                    <Trophy className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                    <span>Case de Sucesso</span>
                                  </div>
                                </div>

                                {project.cover_image ? <img src={project.cover_image} alt={project.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                    <Sparkles className="w-16 h-16 text-muted-foreground" />
                                  </div>}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/30"></div>
                                <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 lg:p-6 backdrop-blur-sm">
                                  <h3 className="text-sm md:text-lg lg:text-xl font-bold text-white mb-1 md:mb-2 group-hover:text-primary-foreground transition-colors drop-shadow-lg">
                                    {project.title}
                                  </h3>
                                  <p className="text-xs md:text-sm text-white/90 line-clamp-2 drop-shadow-md">
                                    {project.description}
                                  </p>
                                  {project.client_name && <p className="text-[10px] md:text-xs text-white/80 mt-1 md:mt-2 drop-shadow-md">
                                      Cliente: {project.client_name}
                                    </p>}
                                  {project.technologies && project.technologies.length > 0 && <div className="flex flex-wrap gap-1 md:gap-1.5 mt-1 md:mt-2">
                                      {project.technologies.slice(0, 3).map((tech, idx) => <span key={idx} className="text-[8px] md:text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/30">
                                          {tech}
                                        </span>)}
                                    </div>}
                                </div>
                              </div>
                            </Link>
                          </CarouselItem>)}
                      </CarouselContent>
                      <CarouselPrevious className="left-1 md:left-2 h-6 w-6 md:h-8 md:w-8 bg-background/80 backdrop-blur-md hover:bg-background border-border/50" />
                      <CarouselNext className="right-1 md:right-2 h-6 w-6 md:h-8 md:w-8 bg-background/80 backdrop-blur-md hover:bg-background border-border/50" />
                    </Carousel>
                  </div>

                  {/* Slide Indicators */}
                  {projects.length > 1 && <div className="flex justify-center gap-1.5 md:gap-2 mt-4 md:mt-6">
                      {projects.map((_, index) => <button key={index} onClick={() => api?.scrollTo(index)} className={cn("h-1.5 md:h-2 rounded-full transition-all duration-300", currentIndex === index ? "bg-primary w-6 md:w-8" : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-1.5 md:w-2")} aria-label={`Ir para slide ${index + 1}`} />)}
                    </div>}
                </div> : <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-border/50 flex items-center justify-center">
                  <div className="text-center space-y-4 p-8">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Projetos em destaque aparecerão aqui
                    </p>
                  </div>
                </div>}
            </div>

            {/* CTA Button após Cases de Sucesso */}
            <div className="mt-16 md:mt-20 text-center animate-fade-in space-y-4">
              <LeadFormDialog trigger={<Button size="lg" className="group shadow-xl hover:shadow-2xl transition-all duration-300" style={{
              background: 'var(--gradient-accent)'
            }}>
                    Solicitar Orçamento!
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>} defaultMessage="Vi seus cases de sucesso e gostaria de saber mais sobre como podem ajudar meu negócio." />
              <p className="text-sm text-muted-foreground">
                Transforme seu negócio com nossas soluções
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>;
}