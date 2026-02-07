import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  Globe,
  Search,
  TrendingUp,
  Palette,
  Bot,
  Workflow,
  FileText,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';

const services = [
  {
    icon: Globe,
    titleKey: 'services.websites',
    descKey: 'services.websites.desc',
    details:
      'Desenvolvemos sites institucionais, landing pages e lojas virtuais completas usando as melhores tecnologias do mercado. WordPress, Elementor, WooCommerce e soluções customizadas para atender suas necessidades específicas.',
    features: ['Design Responsivo', 'Otimização de Performance', 'Integração com Pagamentos', 'Gerenciamento Fácil'],
  },
  {
    icon: Search,
    titleKey: 'services.seo',
    descKey: 'services.seo.desc',
    details:
      'Estratégias completas de SEO para posicionar seu site no topo do Google. Análise de palavras-chave, otimização on-page, link building e relatórios detalhados de performance.',
    features: ['Auditoria SEO Completa', 'Otimização Técnica', 'Criação de Conteúdo', 'Link Building'],
  },
  {
    icon: TrendingUp,
    titleKey: 'services.ads',
    descKey: 'services.ads.desc',
    details:
      'Gerenciamento profissional de campanhas no Google Ads e Meta Ads. Criação, otimização e acompanhamento de campanhas para maximizar seu ROI e alcançar os melhores resultados.',
    features: ['Google Ads', 'Facebook & Instagram Ads', 'Otimização de Conversão', 'Relatórios Detalhados'],
  },
  {
    icon: Palette,
    titleKey: 'services.design',
    descKey: 'services.design.desc',
    details:
      'Criação de identidade visual completa para sua marca. Logotipo, paleta de cores, tipografia, materiais gráficos e guidelines de marca para garantir consistência em todos os pontos de contato.',
    features: ['Logotipo e Identidade', 'Material Gráfico', 'Social Media', 'Apresentações'],
  },
  {
    icon: Bot,
    titleKey: 'services.ai',
    descKey: 'services.ai.desc',
    details:
      'Desenvolvimento de chatbots inteligentes e agentes de IA para automatizar atendimento, qualificar leads e melhorar a experiência do usuário. Integração com WhatsApp, website e outras plataformas.',
    features: ['Chatbots Inteligentes', 'Integração WhatsApp', 'Qualificação de Leads', 'Atendimento 24/7'],
  },
  {
    icon: Workflow,
    titleKey: 'services.automation',
    descKey: 'services.automation.desc',
    details:
      'Sistemas de automação customizados para otimizar processos internos, integrar plataformas e aumentar a produtividade. Automação de marketing, vendas e operações.',
    features: ['Automação de Marketing', 'Integração de Sistemas', 'Workflows Customizados', 'CRM e Vendas'],
  },
  {
    icon: FileText,
    titleKey: 'services.content',
    descKey: 'services.content.desc',
    details:
      'Estratégia completa de marketing de conteúdo. Planejamento editorial, produção de artigos otimizados para SEO, gestão de blog e criação de conteúdo para redes sociais.',
    features: ['Planejamento Editorial', 'Produção de Conteúdo', 'Gestão de Blog', 'Social Media'],
  },
  {
    icon: Lightbulb,
    titleKey: 'services.consulting',
    descKey: 'services.consulting.desc',
    details:
      'Consultoria especializada em transformação digital. Análise de maturidade digital, planejamento estratégico, definição de roadmap e acompanhamento de implementação.',
    features: ['Análise Digital', 'Planejamento Estratégico', 'Definição de Roadmap', 'Mentoria Executiva'],
  },
];

const Services = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Serviços - TECHNE Digital | Marketing Digital, SEO, IA e Automação</title>
        <meta name="description" content="Conheça nossos serviços: criação de sites, SEO, Google Ads, design, chatbots com IA, automação de marketing, produção de conteúdo e consultoria digital." />
        <link rel="canonical" href="https://technedigital.lovable.app/services" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Serviços - TECHNE Digital" />
        <meta property="og:description" content="Soluções completas em marketing digital, tecnologia e automação. Sites, SEO, Google Ads, IA e chatbots inteligentes." />
        <meta property="og:url" content="https://technedigital.lovable.app/services" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Serviços - TECHNE Digital" />
        <meta name="twitter:description" content="Soluções completas em marketing digital, tecnologia e automação. Sites, SEO, Google Ads, IA e chatbots inteligentes." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "provider": {
              "@type": "Organization",
              "name": "TECHNE Digital",
            },
            "serviceType": "Marketing Digital, SEO, Criação de Sites, Automação, Inteligência Artificial",
            "areaServed": "BR",
            "description": "Soluções completas em marketing digital, tecnologia e automação.",
          })}
        </script>
      </Helmet>
      <Header />
      <main className="flex-1">
        <section className="py-20 md:py-32" style={{ background: 'var(--gradient-hero)' }}>
          <div className="container">
            <div className="max-w-4xl mx-auto text-center space-y-6 animate-fade-up">
              <h1 className="text-4xl md:text-6xl font-bold">{t('services.title')}</h1>
              <p className="text-xl text-muted-foreground">
                Soluções completas em marketing digital, tecnologia e automação
              </p>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <Card key={index} className="hover-lift border-border/50">
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-7 h-7 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold mb-2">{t(service.titleKey)}</h3>
                          <p className="text-muted-foreground">{t(service.descKey)}</p>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">{service.details}</p>

                      <div className="grid grid-cols-2 gap-2">
                        {service.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                            <span className="text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4">
                        <Link to="/contact">
                          <Button className="w-full group" style={{ background: 'var(--gradient-accent)' }}>
                            Solicitar proposta
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Services;
