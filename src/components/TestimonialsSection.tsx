import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Maria Silva',
    role: 'CEO, Tech Startup',
    content: 'A TECHNE Digital transformou completamente nossa presença digital. Resultados incríveis em SEO e conversões.',
    avatar: '👩‍💼',
  },
  {
    name: 'João Santos',
    role: 'Diretor de Marketing',
    content: 'Profissionais extremamente capacitados. A automação com IA reduziu nossos custos em 40%.',
    avatar: '👨‍💼',
  },
  {
    name: 'Ana Costa',
    role: 'E-commerce Manager',
    content: 'O melhor investimento que fizemos. Nossa loja virtual dobrou as vendas em 6 meses.',
    avatar: '👩‍🦰',
  },
];

export function TestimonialsSection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 md:py-32">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold">{t('testimonials.title')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover-lift border-border/50">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-3 pt-4">
                  <div className="text-3xl">{testimonial.avatar}</div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
