import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Loader2 } from 'lucide-react';

export function NewsletterSubscribe() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: 'Email inválido',
        description: 'Por favor, insira um email válido.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('newsletter-subscribe', {
        body: { email },
      });

      if (error) throw error;

      toast({
        title: 'Inscrição realizada! 🎉',
        description: 'Verifique seu email para confirmar a inscrição.',
      });

      setEmail('');
    } catch (error: any) {
      console.error('Error subscribing to newsletter:', error);
      toast({
        title: 'Erro ao se inscrever',
        description: error.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-10"
          disabled={loading}
        />
      </div>
      <Button type="submit" disabled={loading} className="sm:w-auto">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Inscrevendo...
          </>
        ) : (
          'Inscrever-se'
        )}
      </Button>
    </form>
  );
}
