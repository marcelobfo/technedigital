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

  // Verificar status da conexão e Indexing API
  const { data: connectionStatus } = useQuery({
    queryKey: ['google-connection-status-widget'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('test-google-connection');
      if (error) throw error;
      return data;
    },
    enabled: !!settings?.is_active,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
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
      
      // URLs que foram indexadas com sucesso
      const indexed = data?.filter(item => 
        item.indexing_status === 'URL_IS_ON_GOOGLE' || 
        item.indexing_status === 'SUBMITTED' ||
        item.indexing_status === 'VALID'
      ).length || 0;
      
      // URLs aguardando rastreamento do Google
      const pending = data?.filter(item => 
        item.indexing_status === 'NEUTRAL' || 
        item.indexing_status === 'UNKNOWN' ||
        !item.indexing_status
      ).length || 0;
      
      // URLs com erro real
      const errors = data?.filter(item => 
        item.indexing_status && 
        !['URL_IS_ON_GOOGLE', 'SUBMITTED', 'VALID', 'NEUTRAL', 'UNKNOWN'].includes(item.indexing_status)
      ).length || 0;

      return { total, indexed, pending, errors };
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seo-indexing-stats-widget'] });
      
      if (data.successCount > 0) {
        toast.success(`${data.successCount} URLs verificadas com sucesso!`);
      }
      
      if (data.errorCount > 0) {
        toast.warning(`${data.errorCount} URLs com erro. Verifique os detalhes.`);
      }
    },
    onError: (error: Error) => {
      console.error('Erro ao buscar status:', error);
      toast.error('Erro ao buscar status de indexação', {
        description: error.message || 'Verifique sua conexão com Google'
      });
    }
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('test-google-connection');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Conexão funcionando corretamente!', {
          description: `✅ Token válido | ✅ API acessível`
        });
      } else {
        const errors = data.checks?.errors || [];
        toast.error('Problemas na conexão detectados', {
          description: errors.join(' | ')
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao testar conexão', {
        description: error.message
      });
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
            <>
              <Badge variant="default" className="ml-auto">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
              {connectionStatus && !connectionStatus.checks?.indexingApiEnabled && (
                <Badge variant="destructive" className="ml-2">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  API não habilitada
                </Badge>
              )}
            </>
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
                Configuração necessária no Google Cloud Console:
              </p>
              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-medium mb-1">1. Authorized redirect URIs:</p>
                  <code className="block bg-muted/80 px-2 py-1.5 rounded text-xs break-all">
                    https://technedigital.com.br/admin/google-callback
                  </code>
                </div>
                <div>
                  <p className="font-medium mb-1">2. Authorized JavaScript origins:</p>
                  <code className="block bg-muted/80 px-2 py-1.5 rounded text-xs">
                    https://technedigital.com.br
                  </code>
                </div>
                <div>
                  <p className="font-medium mb-1">3. Scopes necessários:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5 ml-2">
                    <li>https://www.googleapis.com/auth/webmasters</li>
                    <li>https://www.googleapis.com/auth/webmasters.readonly</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-1">4. Propriedade no Search Console:</p>
                  <code className="block bg-muted/80 px-2 py-1.5 rounded text-xs">
                    https://technedigital.com.br/
                  </code>
                  <p className="text-muted-foreground mt-1">⚠️ A barra no final é obrigatória</p>
                </div>
              </div>
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
            {/* Alerta de Indexing API não habilitada */}
            {connectionStatus && !connectionStatus.checks?.indexingApiEnabled && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-medium text-destructive">Indexing API não habilitada</p>
                  <p className="text-xs text-muted-foreground">
                    Habilite a API para enviar URLs
                  </p>
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm"
                    className="mt-2 h-7 text-xs border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <a 
                      href="https://console.developers.google.com/apis/api/indexing.googleapis.com/overview" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Habilitar API
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {loadingStats ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : indexingStats ? (
              <div className="grid grid-cols-4 gap-2">
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
                
                <div className="space-y-1 text-center p-3 bg-yellow-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {indexingStats.pending}
                  </div>
                  <div className="text-xs text-muted-foreground">Aguardando</div>
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

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => testConnectionMutation.mutate()}
                disabled={testConnectionMutation.isPending}
              >
                {testConnectionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Testar Conexão
                  </>
                )}
              </Button>

              {indexingStats && indexingStats.total === 0 && (
                <Button 
                  variant="secondary" 
                  className="flex-1"
                  onClick={() => fetchIndexingMutation.mutate()}
                  disabled={fetchIndexingMutation.isPending}
                >
                  {fetchIndexingMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Buscar Status
                    </>
                  )}
                </Button>
              )}
            </div>

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
