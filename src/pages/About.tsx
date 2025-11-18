import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Eye, Heart } from 'lucide-react';

const About = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-20 md:py-32" style={{ background: 'var(--gradient-hero)' }}>
          <div className="container">
            <div className="max-w-4xl mx-auto text-center space-y-6 animate-fade-up">
              <h1 className="text-4xl md:text-6xl font-bold">{t('about.title')}</h1>
              <p className="text-xl text-muted-foreground">{t('about.subtitle')}</p>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  A <strong className="text-foreground">TECHNE Digital</strong> nasceu da visão de unir tecnologia de ponta com estratégias
                  de marketing inovadoras. Somos uma agência moderna, especializada em marketing digital, automação
                  inteligente e soluções baseadas em inteligência artificial.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Nossa missão é transformar desafios digitais em oportunidades reais de crescimento. Combinamos
                  expertise técnica com criatividade estratégica para entregar resultados mensuráveis e impactantes
                  para nossos clientes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
                <Card className="border-border/50 hover-lift">
                  <CardContent className="p-6 space-y-4 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                      <Target className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold">Missão</h3>
                    <p className="text-sm text-muted-foreground">
                      Transformar tecnologia em resultados digitais concretos, impulsionando o crescimento
                      sustentável de nossos clientes.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 hover-lift">
                  <CardContent className="p-6 space-y-4 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                      <Eye className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold">Visão</h3>
                    <p className="text-sm text-muted-foreground">
                      Ser referência em soluções digitais inteligentes, reconhecida pela excelência e inovação
                      constante.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 hover-lift">
                  <CardContent className="p-6 space-y-4 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                      <Heart className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold">Valores</h3>
                    <p className="text-sm text-muted-foreground">
                      Inovação, transparência, resultados mensuráveis e compromisso com o sucesso de nossos
                      parceiros.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="pt-12">
                <h2 className="text-3xl font-bold mb-8 text-center">Por que escolher a TECHNE Digital?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                      <span className="text-2xl">🚀</span>
                    </div>
                    <h3 className="text-xl font-semibold">Inovação</h3>
                    <p className="text-muted-foreground">
                      Utilizamos as tecnologias mais avançadas, incluindo IA e automação, para manter você à frente
                      da concorrência.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                      <span className="text-2xl">📊</span>
                    </div>
                    <h3 className="text-xl font-semibold">Performance</h3>
                    <p className="text-muted-foreground">
                      Focamos em resultados mensuráveis. Cada estratégia é orientada por dados e métricas concretas
                      de desempenho.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <h3 className="text-xl font-semibold">Tecnologia</h3>
                    <p className="text-muted-foreground">
                      Expertise em desenvolvimento, SEO, automação e inteligência artificial para soluções
                      completas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
