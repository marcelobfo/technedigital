import React, { createContext, useContext, useState } from 'react';

type Language = 'pt' | 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  pt: {
    'nav.home': 'Início',
    'nav.about': 'Sobre',
    'nav.services': 'Serviços',
    'nav.contact': 'Contato',
    'footer.legal': 'Legal',
    'footer.terms': 'Termos de Uso',
    'footer.privacy': 'Política de Privacidade',
    'terms.title': 'Termos de Uso',
    'privacy.title': 'Política de Privacidade',
    'hero.title': 'Transformamos tecnologia em resultados digitais',
    'hero.subtitle': 'Somos a TECHNE Digital — agência moderna de marketing, automação e inteligência artificial.',
    'hero.cta1': 'Solicitar orçamento',
    'hero.cta2': 'Ver portfólio',
    'services.title': 'Soluções que impulsionam negócios',
    'services.websites': 'Criação de Sites e Lojas Virtuais',
    'services.websites.desc': 'Sites responsivos e lojas virtuais otimizadas com WordPress e Elementor.',
    'services.seo': 'SEO e Otimização para Google',
    'services.seo.desc': 'Posicione seu negócio no topo do Google com estratégias avançadas de SEO.',
    'services.ads': 'Gestão de Tráfego Pago',
    'services.ads.desc': 'Campanhas estratégicas no Google Ads e Meta Ads para resultados rápidos.',
    'services.design': 'Design e Branding',
    'services.design.desc': 'Identidade visual que comunica a essência da sua marca.',
    'services.ai': 'Agentes de IA e Chatbots',
    'services.ai.desc': 'Automatize atendimentos com inteligência artificial de ponta.',
    'services.automation': 'Sistemas de Automação',
    'services.automation.desc': 'Otimize processos e ganhe eficiência com automação inteligente.',
    'services.content': 'Marketing de Conteúdo',
    'services.content.desc': 'Estratégias de conteúdo que engajam e convertem.',
    'services.consulting': 'Consultoria Digital',
    'services.consulting.desc': 'Orientação especializada para transformação digital do seu negócio.',
    'testimonials.title': 'O que nossos clientes dizem',
    'cta.title': 'Quer impulsionar seus resultados com tecnologia e automação?',
    'cta.button': 'Fale com um especialista',
    'footer.rights': 'Todos os direitos reservados.',
    'contact.title': 'Entre em Contato',
    'contact.name': 'Nome',
    'contact.email': 'E-mail',
    'contact.phone': 'Telefone',
    'contact.message': 'Mensagem',
    'contact.send': 'Enviar mensagem',
    'about.title': 'Nossa História',
    'about.subtitle': 'Inovação e tecnologia para resultados extraordinários',
    'portfolio.title': 'Nossos Projetos',
    'portfolio.subtitle': 'Conheça alguns dos trabalhos que transformaram negócios',
    'portfolio.view': 'Ver detalhes',
    'portfolio.all': 'Ver todos os projetos',
    'blog.title': 'Blog TECHNE',
    'blog.subtitle': 'Insights sobre tecnologia, marketing e inovação',
    'blog.read': 'Ler mais',
    'blog.recent': 'Posts recentes',
  },
  en: {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.services': 'Services',
    'nav.contact': 'Contact',
    'footer.legal': 'Legal',
    'footer.terms': 'Terms of Service',
    'footer.privacy': 'Privacy Policy',
    'terms.title': 'Terms of Service',
    'privacy.title': 'Privacy Policy',
    'hero.title': 'We transform technology into digital results',
    'hero.subtitle': 'We are TECHNE Digital — a modern marketing, automation, and artificial intelligence agency.',
    'hero.cta1': 'Request a quote',
    'hero.cta2': 'View portfolio',
    'services.title': 'Solutions that drive business',
    'services.websites': 'Website & E-commerce Development',
    'services.websites.desc': 'Responsive websites and optimized online stores with WordPress and Elementor.',
    'services.seo': 'SEO & Google Optimization',
    'services.seo.desc': 'Position your business at the top of Google with advanced SEO strategies.',
    'services.ads': 'Paid Traffic Management',
    'services.ads.desc': 'Strategic campaigns on Google Ads and Meta Ads for fast results.',
    'services.design': 'Design & Branding',
    'services.design.desc': 'Visual identity that communicates your brand essence.',
    'services.ai': 'AI Agents & Chatbots',
    'services.ai.desc': 'Automate customer service with cutting-edge artificial intelligence.',
    'services.automation': 'Automation Systems',
    'services.automation.desc': 'Optimize processes and gain efficiency with intelligent automation.',
    'services.content': 'Content Marketing',
    'services.content.desc': 'Content strategies that engage and convert.',
    'services.consulting': 'Digital Consulting',
    'services.consulting.desc': 'Expert guidance for your business digital transformation.',
    'testimonials.title': 'What our clients say',
    'cta.title': 'Want to boost your results with technology and automation?',
    'cta.button': 'Talk to a specialist',
    'footer.rights': 'All rights reserved.',
    'contact.title': 'Get in Touch',
    'contact.name': 'Name',
    'contact.email': 'Email',
    'contact.phone': 'Phone',
    'contact.message': 'Message',
    'contact.send': 'Send message',
    'about.title': 'Our Story',
    'about.subtitle': 'Innovation and technology for extraordinary results',
    'portfolio.title': 'Our Projects',
    'portfolio.subtitle': 'Discover some of the works that transformed businesses',
    'portfolio.view': 'View details',
    'portfolio.all': 'View all projects',
    'blog.title': 'TECHNE Blog',
    'blog.subtitle': 'Insights on technology, marketing and innovation',
    'blog.read': 'Read more',
    'blog.recent': 'Recent posts',
  },
  es: {
    'nav.home': 'Inicio',
    'nav.about': 'Nosotros',
    'nav.services': 'Servicios',
    'nav.contact': 'Contacto',
    'footer.legal': 'Legal',
    'footer.terms': 'Términos de Uso',
    'footer.privacy': 'Política de Privacidad',
    'terms.title': 'Términos de Uso',
    'privacy.title': 'Política de Privacidad',
    'hero.title': 'Transformamos tecnología en resultados digitales',
    'hero.subtitle': 'Somos TECHNE Digital — agencia moderna de marketing, automatización e inteligencia artificial.',
    'hero.cta1': 'Solicitar presupuesto',
    'hero.cta2': 'Ver portafolio',
    'services.title': 'Soluciones que impulsan negocios',
    'services.websites': 'Creación de Sitios y Tiendas Virtuales',
    'services.websites.desc': 'Sitios responsivos y tiendas virtuales optimizadas con WordPress y Elementor.',
    'services.seo': 'SEO y Optimización para Google',
    'services.seo.desc': 'Posiciona tu negocio en la cima de Google con estrategias avanzadas de SEO.',
    'services.ads': 'Gestión de Tráfico Pago',
    'services.ads.desc': 'Campañas estratégicas en Google Ads y Meta Ads para resultados rápidos.',
    'services.design': 'Diseño y Branding',
    'services.design.desc': 'Identidad visual que comunica la esencia de tu marca.',
    'services.ai': 'Agentes de IA y Chatbots',
    'services.ai.desc': 'Automatiza atenciones con inteligencia artificial de punta.',
    'services.automation': 'Sistemas de Automatización',
    'services.automation.desc': 'Optimiza procesos y gana eficiencia con automatización inteligente.',
    'services.content': 'Marketing de Contenido',
    'services.content.desc': 'Estrategias de contenido que enganchan y convierten.',
    'services.consulting': 'Consultoría Digital',
    'services.consulting.desc': 'Orientación especializada para transformación digital de tu negocio.',
    'testimonials.title': 'Lo que dicen nuestros clientes',
    'cta.title': '¿Quieres impulsar tus resultados con tecnología y automatización?',
    'cta.button': 'Habla con un especialista',
    'footer.rights': 'Todos los derechos reservados.',
    'contact.title': 'Ponte en Contacto',
    'contact.name': 'Nombre',
    'contact.email': 'Correo',
    'contact.phone': 'Teléfono',
    'contact.message': 'Mensaje',
    'contact.send': 'Enviar mensaje',
    'about.title': 'Nuestra Historia',
    'about.subtitle': 'Innovación y tecnología para resultados extraordinarios',
    'portfolio.title': 'Nuestros Proyectos',
    'portfolio.subtitle': 'Conoce algunos de los trabajos que transformaron negocios',
    'portfolio.view': 'Ver detalles',
    'portfolio.all': 'Ver todos los proyectos',
    'blog.title': 'Blog TECHNE',
    'blog.subtitle': 'Perspectivas sobre tecnología, marketing e innovación',
    'blog.read': 'Leer más',
    'blog.recent': 'Posts recientes',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('language');
    if (stored && ['pt', 'en', 'es'].includes(stored)) {
      return stored as Language;
    }
    const browserLang = navigator.language.split('-')[0];
    return ['pt', 'en', 'es'].includes(browserLang) ? browserLang as Language : 'pt';
  });

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
