import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  ArrowRight,
  Settings,
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function GoogleSearchConsoleWidget() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const queryClient = useQueryClient();

  // Buscar configurações do GSC
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['google-search-console-settings-widget'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('google_search_console_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Buscar estatísticas de indexação
  const { data: indexingStats, isLoading: loadingStats } = useQuery({
    queryKey: ['seo-indexing-stats-widget'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_indexing_status')
        .select('indexing_status');
      
      if (error) throw error;

      const total = data?.length || 0;
      const indexed = data?.filter(item => 
        item.indexing_status === 'URL_IS_ON_GOOGLE' || 
        item.indexing_status === 'SUBMITTED'
      ).length || 0;
      const errors = data?.filter(item => 
        item.indexing_status && 
        !['URL_IS_ON_GOOGLE', 'SUBMITTED', 'UNKNOWN'].includes(item.indexing_status)
      ).length || 0;

      return { total, indexed, errors };
    },
    enabled: !!settings?.is_active,
    refetchInterval: 60000,
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-oauth-init');
      
      if (error) throw error;
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Erro ao iniciar OAuth:', error);
      toast.error('Erro ao conectar com Google');
      setIsConnecting(false);
    }
  };

  const saveCredentialsMutation = useMutation({
    mutationFn: async () => {
      if (!clientId || !clientSecret) {
        throw new Error('Preencha todos os campos');
      }

      const { data: existing } = await supabase
        .from('google_search_console_settings')
        .select('id')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('google_search_console_settings')
          .update({
            client_id: clientId,
            client_secret: clientSecret,
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('google_search_console_settings')
          .insert({
            client_id: clientId,
            client_secret: clientSecret,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-search-console-settings-widget'] });
      toast.success('Credenciais salvas! Agora você pode conectar.');
      setIsDialogOpen(false);
      setClientId("");
      setClientSecret("");
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar credenciais');
    }
  });

  const fetchIndexingMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-indexing-status');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-indexing-stats-widget'] });
      toast.success('Status de indexação atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao buscar status: ${error.message}`);
    }
  });

  if (loadingSettings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Google Search Console
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Google Search Console
          {settings?.is_active && (
            <Badge variant="default" className="ml-auto">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Conectado
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Status de indexação e SEO
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!settings?.is_active ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Não conectado</p>
                <p className="text-xs text-muted-foreground">
                  Conecte sua conta do Google para monitorar indexação
                </p>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                Passos para configurar:
              </p>
              <ol className="text-xs space-y-1.5 text-muted-foreground list-decimal list-inside">
                <li>Configure OAuth 2.0 no Google Cloud Console</li>
                <li>Adicione o redirect URI: <code className="text-xs bg-muted px-1 py-0.5 rounded">https://technedigital.com.br/admin/google-callback</code></li>
                <li>Insira as credenciais usando o botão abaixo</li>
                <li>Conecte sua conta do Google</li>
              </ol>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Conectar com Google
                  </>
                )}
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar Credenciais
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configurar Credenciais do Google</DialogTitle>
                    <DialogDescription>
                      Insira as credenciais OAuth 2.0 do Google Cloud Console
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-id">Client ID</Label>
                      <Input
                        id="client-id"
                        placeholder="123456789.apps.googleusercontent.com"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client-secret">Client Secret</Label>
                      <Input
                        id="client-secret"
                        type="password"
                        placeholder="GOCSPX-..."
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                      />
                    </div>
                    <div className="pt-2 space-y-2">
                      <Button 
                        onClick={() => saveCredentialsMutation.mutate()} 
                        disabled={saveCredentialsMutation.isPending || !clientId || !clientSecret}
                        className="w-full"
                      >
                        {saveCredentialsMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          'Salvar Credenciais'
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Configure o OAuth 2.0 no{' '}
                        <a 
                          href="https://console.cloud.google.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Google Cloud Console
                        </a>
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Link to="/admin/google-search-console">
                <Button variant="ghost" className="w-full text-xs">
                  Ver documentação completa
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {loadingStats ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : indexingStats ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{indexingStats.total}</div>
                  <div className="text-xs text-muted-foreground">URLs Total</div>
                </div>
                
                <div className="space-y-1 text-center p-3 bg-green-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {indexingStats.indexed}
                  </div>
                  <div className="text-xs text-muted-foreground">Indexadas</div>
                </div>
                
                <div className="space-y-1 text-center p-3 bg-destructive/10 rounded-lg">
                  <div className="text-2xl font-bold text-destructive">
                    {indexingStats.errors}
                  </div>
                  <div className="text-xs text-muted-foreground">Com Erro</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}

            <div className="space-y-2 p-3 bg-muted/50 rounded-lg text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Auto-submit Sitemap</span>
                {settings.auto_submit_sitemap ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Auto-submit Conteúdo</span>
                {settings.auto_submit_on_publish ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {indexingStats && indexingStats.total === 0 && (
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => fetchIndexingMutation.mutate()}
                disabled={fetchIndexingMutation.isPending}
              >
                {fetchIndexingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando Status...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Buscar Status de Indexação
                  </>
                )}
              </Button>
            )}

            <Link to="/admin/google-search-console">
              <Button variant="outline" className="w-full">
                Ver Detalhes Completos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
