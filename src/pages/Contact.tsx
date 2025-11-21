import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { WhatsAppFloatingButton } from '@/components/WhatsAppFloatingButton';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo'),
  phone: z.string().trim().max(20, 'Telefone muito longo').optional(),
  message: z.string().trim().min(1, 'Mensagem é obrigatória').max(2000, 'Mensagem muito longa'),
});

const Contact = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    email: 'contato@technedigital.com',
    phone: '+55 11 99999-9999',
    location: 'São Paulo, SP - Brasil',
    maps_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.0977!2d-46.6546!3d-23.5615!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDMzJzQxLjQiUyA0NsKwMzknMTYuNiJX!5e0!3m2!1spt-BR!2sbr!4v1234567890',
    show_map: true,
  });

  useEffect(() => {
    const fetchContactSettings = async () => {
      const { data, error } = await supabase
        .from('contact_settings')
        .select('*')
        .single();
      
      if (data && !error) {
        setContactInfo(data);
      }
    };
    
    fetchContactSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validar dados
      const validatedData = contactSchema.parse({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        message: formData.message,
      });

      // Inserir lead no banco
      const { error } = await supabase.from('leads').insert([
        {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone || null,
          message: validatedData.message,
          status: 'new',
          priority: 'medium',
          source: 'contact_form',
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Mensagem enviada!',
        description: 'Entraremos em contato em breve.',
      });

      // Limpar formulário
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Erro de validação',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        console.error('Error submitting contact form:', error);
        toast({
          title: 'Erro ao enviar',
          description: 'Ocorreu um erro ao enviar sua mensagem. Tente novamente.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-20 md:py-32" style={{ background: 'var(--gradient-hero)' }}>
          <div className="container">
            <div className="max-w-4xl mx-auto text-center space-y-6 animate-fade-up">
              <h1 className="text-4xl md:text-6xl font-bold">{t('contact.title')}</h1>
              <p className="text-xl text-muted-foreground">
                Vamos conversar sobre como podemos ajudar seu negócio a crescer
              </p>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold mb-6">Informações de Contato</h2>
                  <p className="text-muted-foreground mb-8">
                    Preencha o formulário ou entre em contato através de nossos canais diretos.
                  </p>
                </div>

                <Card className="border-border/50">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold">E-mail</p>
                        <p className="text-sm text-muted-foreground">{contactInfo.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                        <Phone className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold">Telefone</p>
                        <p className="text-sm text-muted-foreground">{contactInfo.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold">Localização</p>
                        <p className="text-sm text-muted-foreground">{contactInfo.location}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {contactInfo.show_map && (
                  <div className="aspect-video rounded-lg overflow-hidden border border-border/50">
                    <iframe
                      src={contactInfo.maps_embed_url}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Localização TECHNE Digital"
                    ></iframe>
                  </div>
                )}
              </div>

              <Card className="border-border/50">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        {t('contact.name')}
                      </label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Seu nome completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        {t('contact.email')}
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="seu@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium">
                        {t('contact.phone')}
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium">
                        {t('contact.message')}
                      </label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        rows={5}
                        placeholder="Como podemos ajudar?"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      style={{ background: 'var(--gradient-accent)' }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Enviando...' : t('contact.send')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloatingButton 
        phoneNumber="5538988285462"
        message="Olá! Vi a página de contato e gostaria de mais informações sobre os serviços da TECHNE Digital."
      />
    </div>
  );
};

export default Contact;
