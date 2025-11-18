import { Link } from 'react-router-dom';
import { Moon, Sun, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold gradient-text">TECHNE</span>
          <span className="text-2xl font-light text-foreground">Digital</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-sm font-medium transition-colors hover:text-accent">
            {t('nav.home')}
          </Link>
          <Link to="/about" className="text-sm font-medium transition-colors hover:text-accent">
            {t('nav.about')}
          </Link>
          <Link to="/services" className="text-sm font-medium transition-colors hover:text-accent">
            {t('nav.services')}
          </Link>
          <Link to="/portfolio" className="text-sm font-medium transition-colors hover:text-accent">
            Portfolio
          </Link>
          <Link to="/blog" className="text-sm font-medium transition-colors hover:text-accent">
            Blog
          </Link>
          <Link to="/contact" className="text-sm font-medium transition-colors hover:text-accent">
            {t('nav.contact')}
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('pt')} className={language === 'pt' ? 'bg-accent/10' : ''}>
                🇧🇷 Português
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('en')} className={language === 'en' ? 'bg-accent/10' : ''}>
                🇺🇸 English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('es')} className={language === 'es' ? 'bg-accent/10' : ''}>
                🇪🇸 Español
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
          <div className="container py-4 space-y-3">
            <Link
              to="/"
              className="block py-2 text-sm font-medium transition-colors hover:text-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/about"
              className="block py-2 text-sm font-medium transition-colors hover:text-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.about')}
            </Link>
            <Link
              to="/services"
              className="block py-2 text-sm font-medium transition-colors hover:text-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.services')}
            </Link>
            <Link
              to="/portfolio"
              className="block py-2 text-sm font-medium transition-colors hover:text-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              Portfolio
            </Link>
            <Link
              to="/blog"
              className="block py-2 text-sm font-medium transition-colors hover:text-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              to="/contact"
              className="block py-2 text-sm font-medium transition-colors hover:text-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.contact')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
