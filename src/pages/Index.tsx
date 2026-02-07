import { Helmet } from 'react-helmet';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Hero } from '@/components/Hero';
import { ServicesSection } from '@/components/ServicesSection';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { CTASection } from '@/components/CTASection';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>TECHNE Digital - Transformamos tecnologia em resultados digitais</title>
        <meta name="description" content="Agência moderna de marketing digital, automação e inteligência artificial. Criação de sites, SEO, tráfego pago, IA e chatbots inteligentes." />
        <link rel="canonical" href="https://technedigital.lovable.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="TECHNE Digital - Transformamos tecnologia em resultados digitais" />
        <meta property="og:description" content="Agência moderna de marketing digital, automação e inteligência artificial. Criação de sites, SEO, tráfego pago, IA e chatbots inteligentes." />
        <meta property="og:url" content="https://technedigital.lovable.app/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TECHNE Digital - Transformamos tecnologia em resultados digitais" />
        <meta name="twitter:description" content="Agência moderna de marketing digital, automação e inteligência artificial. Criação de sites, SEO, tráfego pago, IA e chatbots inteligentes." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "TECHNE Digital",
            "description": "Agência moderna de marketing digital, automação e inteligência artificial.",
            "url": "https://technedigital.lovable.app",
            "sameAs": [],
          })}
        </script>
      </Helmet>
      <Header />
      <main className="flex-1">
        <Hero />
        <ServicesSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
