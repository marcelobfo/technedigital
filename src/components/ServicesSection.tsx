import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import {
  Globe,
  Search,
  TrendingUp,
  Palette,
  Bot,
  Workflow,
  FileText,
  Lightbulb,
} from 'lucide-react';

const services = [
  {
    icon: Globe,
    titleKey: 'services.websites',
    descKey: 'services.websites.desc',
  },
  {
    icon: Search,
    titleKey: 'services.seo',
    descKey: 'services.seo.desc',
  },
  {
    icon: TrendingUp,
    titleKey: 'services.ads',
    descKey: 'services.ads.desc',
  },
  {
    icon: Palette,
    titleKey: 'services.design',
    descKey: 'services.design.desc',
  },
  {
    icon: Bot,
    titleKey: 'services.ai',
    descKey: 'services.ai.desc',
  },
  {
    icon: Workflow,
    titleKey: 'services.automation',
    descKey: 'services.automation.desc',
  },
  {
    icon: FileText,
    titleKey: 'services.content',
    descKey: 'services.content.desc',
  },
  {
    icon: Lightbulb,
    titleKey: 'services.consulting',
    descKey: 'services.consulting.desc',
  },
];

export function ServicesSection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 md:py-32 bg-muted/30">
      <div className="container">
        <div className="text-center space-y-4 mb-16 animate-fade-up">
          <h2 className="text-3xl md:text-5xl font-bold">{t('services.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tecnologia e estratégia para transformar seu negócio digital
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card
                key={index}
                className="hover-lift border-border/50 bg-card/50 backdrop-blur-sm"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg">{t(service.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(service.descKey)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
