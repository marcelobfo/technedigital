import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const GoogleOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        console.error('Erro no OAuth:', error);
        toast.error('Erro ao conectar com Google');
        setStatus('error');
        setTimeout(() => navigate('/admin/google-search-console'), 2000);
        return;
      }

      if (!code) {
        toast.error('Código de autorização não encontrado');
        setStatus('error');
        setTimeout(() => navigate('/admin/google-search-console'), 2000);
        return;
      }

      try {
        const { data, error: callbackError } = await supabase.functions.invoke(
          'google-oauth-callback',
          {
            body: {
              code
            }
          }
        );

        if (callbackError) throw callbackError;

        if (data.success) {
          toast.success('Conectado com Google Search Console com sucesso!');
          navigate('/admin/google-search-console');
        } else {
          throw new Error('Falha ao processar callback');
        }
      } catch (error) {
        console.error('Erro ao processar callback:', error);
        toast.error('Erro ao completar autenticação');
        setStatus('error');
        setTimeout(() => navigate('/admin/google-search-console'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        {status === 'loading' ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h2 className="text-2xl font-semibold">Autenticando com Google...</h2>
            <p className="text-muted-foreground">Aguarde enquanto processamos sua autorização</p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-destructive">Erro na autenticação</h2>
            <p className="text-muted-foreground">Redirecionando...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleOAuthCallback;
