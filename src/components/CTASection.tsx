import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 md:py-32 bg-muted/30">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center space-y-8 p-8 md:p-12 rounded-2xl" style={{ background: 'var(--gradient-primary)' }}>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            {t('cta.title')}
          </h2>
          <Link to="/contact">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 group">
              {t('cta.button')}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
