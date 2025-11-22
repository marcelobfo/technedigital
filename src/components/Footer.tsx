import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { NewsletterSubscribe } from '@/components/NewsletterSubscribe';

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold gradient-text">TECHNE</span>
              <span className="text-xl font-light">Digital</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('hero.subtitle')}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Menu</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-accent transition-colors">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-accent transition-colors">
                  {t('nav.about')}
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-muted-foreground hover:text-accent transition-colors">
                  {t('nav.services')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-accent transition-colors">
                  {t('nav.contact')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t('nav.services')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>SEO & Marketing</li>
              <li>Design & Branding</li>
              <li>IA & Automação</li>
              <li>Desenvolvimento Web</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t('nav.contact')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>contato@technedigital.com</li>
              <li>+55 11 99999-9999</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-accent transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-accent transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40">
          <div className="max-w-md mx-auto text-center space-y-4">
            <h3 className="font-semibold text-lg">Assine nossa Newsletter 📬</h3>
            <p className="text-sm text-muted-foreground">
              Receba nossas últimas novidades, dicas e insights sobre marketing digital
            </p>
            <NewsletterSubscribe />
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>© {currentYear} TECHNE Digital. {t('footer.rights')}</p>
          <div className="flex justify-center gap-4 mt-3">
            <Link to="/terms" className="hover:text-accent transition-colors text-xs">
              {t('footer.terms')}
            </Link>
            <span className="text-border">•</span>
            <Link to="/privacy" className="hover:text-accent transition-colors text-xs">
              {t('footer.privacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
