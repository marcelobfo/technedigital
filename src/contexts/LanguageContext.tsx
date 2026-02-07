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
    
    // Cookie Consent
    'cookies.banner.title': 'Usamos cookies para melhorar sua experiência',
    'cookies.banner.description': 'Utilizamos cookies essenciais, de análise e marketing para personalizar conteúdo e analisar o tráfego do site. Você pode aceitar todos ou gerenciar suas preferências.',
    'cookies.banner.accept': 'Aceitar Todos',
    'cookies.banner.reject': 'Rejeitar Não Essenciais',
    'cookies.banner.manage': 'Gerenciar Preferências',
    'cookies.banner.privacy': 'Ver Política de Privacidade',
    
    'cookies.preferences.title': 'Preferências de Cookies',
    'cookies.preferences.description': 'Controle quais cookies você aceita. Os cookies essenciais são necessários para o funcionamento do site e não podem ser desativados.',
    
    'cookies.essential.title': 'Cookies Essenciais',
    'cookies.essential.description': 'Necessários para o funcionamento básico do site, incluindo autenticação, sessão e preferências de idioma. Estes cookies não podem ser desativados.',
    
    'cookies.analytics.title': 'Cookies de Analytics',
    'cookies.analytics.description': 'Nos ajudam a entender como você usa o site através de estatísticas anônimas de uso. Não identificamos você pessoalmente.',
    
    'cookies.marketing.title': 'Cookies de Marketing',
    'cookies.marketing.description': 'Permitem personalizar anúncios e conteúdo relevante. Podem ser usados para remarketing e publicidade direcionada.',
    
    'cookies.save': 'Salvar Preferências',
    'cookies.acceptAll': 'Aceitar Todos',
    'cookies.rejectAll': 'Rejeitar Não Essenciais',
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
    
    // Cookie Consent
    'cookies.banner.title': 'We use cookies to improve your experience',
    'cookies.banner.description': 'We use essential, analytics and marketing cookies to personalize content and analyze site traffic. You can accept all or manage your preferences.',
    'cookies.banner.accept': 'Accept All',
    'cookies.banner.reject': 'Reject Non-Essential',
    'cookies.banner.manage': 'Manage Preferences',
    'cookies.banner.privacy': 'View Privacy Policy',
    
    'cookies.preferences.title': 'Cookie Preferences',
    'cookies.preferences.description': 'Control which cookies you accept. Essential cookies are necessary for the site to function and cannot be disabled.',
    
    'cookies.essential.title': 'Essential Cookies',
    'cookies.essential.description': 'Required for basic site functionality, including authentication, session and language preferences. These cookies cannot be disabled.',
    
    'cookies.analytics.title': 'Analytics Cookies',
    'cookies.analytics.description': 'Help us understand how you use the site through anonymous usage statistics. We do not personally identify you.',
    
    'cookies.marketing.title': 'Marketing Cookies',
    'cookies.marketing.description': 'Allow us to personalize ads and relevant content. May be used for remarketing and targeted advertising.',
    
    'cookies.save': 'Save Preferences',
    'cookies.acceptAll': 'Accept All',
    'cookies.rejectAll': 'Reject Non-Essential',
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
    
    // Cookie Consent
    'cookies.banner.title': 'Usamos cookies para mejorar su experiencia',
    'cookies.banner.description': 'Utilizamos cookies esenciales, de análisis y marketing para personalizar contenido y analizar el tráfico del sitio. Puede aceptar todos o gestionar sus preferencias.',
    'cookies.banner.accept': 'Aceptar Todos',
    'cookies.banner.reject': 'Rechazar No Esenciales',
    'cookies.banner.manage': 'Gestionar Preferencias',
    'cookies.banner.privacy': 'Ver Política de Privacidad',
    
    'cookies.preferences.title': 'Preferencias de Cookies',
    'cookies.preferences.description': 'Controle qué cookies acepta. Las cookies esenciales son necesarias para el funcionamiento del sitio y no pueden desactivarse.',
    
    'cookies.essential.title': 'Cookies Esenciales',
    'cookies.essential.description': 'Necesarias para el funcionamiento básico del sitio, incluyendo autenticación, sesión y preferencias de idioma. Estas cookies no pueden desactivarse.',
    
    'cookies.analytics.title': 'Cookies de Analytics',
    'cookies.analytics.description': 'Nos ayudan a entender cómo usa el sitio a través de estadísticas anónimas de uso. No lo identificamos personalmente.',
    
    'cookies.marketing.title': 'Cookies de Marketing',
    'cookies.marketing.description': 'Permiten personalizar anuncios y contenido relevante. Pueden usarse para remarketing y publicidad dirigida.',
    
    'cookies.save': 'Guardar Preferencias',
    'cookies.acceptAll': 'Aceptar Todos',
    'cookies.rejectAll': 'Rechazar No Esenciales',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'pt';
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
