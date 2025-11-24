import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw, 
  Send, 
  Search,
  AlertCircle,
  AlertTriangle,
  LogOut,
  Clock,
  HelpCircle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AddUrlDialog from "@/components/admin/AddUrlDialog";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const GoogleSearchConsole = () => {
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  // Buscar configurações
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['google-search-console-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('google_search_console_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // Buscar status de indexação
  const { data: indexingStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ['seo-indexing-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_indexing_status')
        .select('*')
        .order('last_checked', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Conectar com Google
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

  // Atualizar configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!settings) throw new Error('Configuração não encontrada');
      
      const { error } = await supabase
        .from('google_search_console_settings')
        .update(updates)
        .eq('id', settings.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-search-console-settings'] });
      toast.success('Configurações atualizadas');
    },
    onError: (error) => {
      console.error('Erro ao atualizar:', error);
      toast.error('Erro ao atualizar configurações');
    }
  });

  // Submeter sitemap
  const submitSitemapMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('submit-sitemap-to-google');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Sitemap submetido com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['google-search-console-settings'] });
    },
    onError: (error) => {
      console.error('Erro ao submeter sitemap:', error);
      toast.error('Erro ao submeter sitemap');
    }
  });

  // Verificar status
  const checkStatusMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-indexing-status');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const successMsg = data.successCount 
        ? `✅ ${data.successCount} URLs verificadas com sucesso`
        : '';
      const errorMsg = data.errorCount 
        ? `⚠️ ${data.errorCount} URLs com erro`
        : '';
      
      toast.success(`Status atualizado! ${successMsg} ${errorMsg}`);
      queryClient.invalidateQueries({ queryKey: ['seo-indexing-status'] });
    },
    onError: (error: any) => {
      console.error('Erro ao verificar status:', error);
      const errorMessage = error?.message || 'Erro desconhecido ao verificar status';
      toast.error(`Erro: ${errorMessage}`, {
        description: 'Verifique os logs da edge function para mais detalhes'
      });
    }
  });

  // Atualizar tokens
  const refreshTokenMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('google-refresh-token');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Tokens atualizados com sucesso');
      queryClient.invalidateQueries({ queryKey: ['google-search-console-settings'] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar tokens:', error);
      toast.error('Erro ao atualizar tokens');
    }
  });

  // Desconectar
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!settings?.id) throw new Error('Configuração não encontrada');
      
      const { error } = await supabase
        .from('google_search_console_settings')
        .delete()
        .eq('id', settings.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-search-console-settings'] });
      toast.success('Desconectado com sucesso!', {
        description: 'Você pode reconectar com outra conta do Google'
      });
    },
    onError: (error) => {
      console.error('Erro ao desconectar:', error);
      toast.error('Erro ao desconectar');
    }
  });

  // Solicitar indexação de URLs selecionadas
  const requestIndexingMutation = useMutation({
    mutationFn: async ({ urls }: { urls: string[] }) => {
      const { data, error } = await supabase.functions.invoke('request-url-indexing', {
        body: { urls }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seo-indexing-status'] });
      setSelectedUrls([]);
      
      const successMsg = `${data.successCount} URL${data.successCount !== 1 ? 's' : ''} solicitada${data.successCount !== 1 ? 's' : ''}`;
      const errorMsg = data.errorCount > 0 
        ? ` | ${data.errorCount} erro${data.errorCount !== 1 ? 's' : ''}`
        : '';
      
      toast.success(`${successMsg} com sucesso!`, {
        description: data.errorCount > 0 
          ? `${errorMsg}. O Google processará em até 48 horas.`
          : 'O Google processará a indexação em até 48 horas.'
      });
    },
    onError: (error: any) => {
      console.error('Erro ao solicitar indexação:', error);
      toast.error('Erro ao solicitar indexação', {
        description: error?.message || 'Verifique os logs da função'
      });
    }
  });

  // Handlers para seleção de URLs
  const handleToggleUrl = (url: string) => {
    setSelectedUrls(prev => 
      prev.includes(url) 
        ? prev.filter(u => u !== url)
        : [...prev, url]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && indexingStatus) {
      setSelectedUrls(indexingStatus.map((item: any) => item.url));
    } else {
      setSelectedUrls([]);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any, text: string, icon: any }> = {
      'SUBMITTED': { 
        variant: 'secondary', 
        text: 'Solicitado', 
        icon: <Send className="h-3 w-3" />
      },
      'URL_IS_ON_GOOGLE': { 
        variant: 'default', 
        text: 'Indexado', 
        icon: <CheckCircle2 className="h-3 w-3" />
      },
      'VALID': { 
        variant: 'default', 
        text: 'Válido', 
        icon: <CheckCircle2 className="h-3 w-3" />
      },
      'NEUTRAL': { 
        variant: 'outline', 
        text: 'Aguardando', 
        icon: <Clock className="h-3 w-3" />
      },
      'UNKNOWN': { 
        variant: 'outline', 
        text: 'Desconhecido', 
        icon: <HelpCircle className="h-3 w-3" />
      },
    };

    const config = statusMap[status] || statusMap['UNKNOWN'];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.text}
      </Badge>
    );
  };

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Google Search Console</h1>
        <p className="text-muted-foreground">
          Gerencie a integração com Google Search Console para SEO
        </p>
      </div>

      {/* Card de Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {settings?.is_active ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
            Status da Conexão
          </CardTitle>
          <CardDescription>
            {settings?.is_active 
              ? 'Conectado com Google Search Console' 
              : 'Não conectado'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!settings?.is_active ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Para habilitar a integração, você precisa conectar sua conta do Google e
                configurar as credenciais OAuth no Google Cloud Console.
              </p>
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                className="w-full sm:w-auto"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  'Conectar com Google'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Propriedade:</strong> {settings.property_url}
                </p>
                {settings.last_sitemap_submit && (
                  <p className="text-sm text-muted-foreground">
                    Última submissão do sitemap:{' '}
                    {format(new Date(settings.last_sitemap_submit), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR
                    })}
                  </p>
                )}
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Desconectar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Desconectar Google Search Console?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso irá remover a conexão com sua conta do Google. 
                      Você precisará reconectar para continuar usando a integração.
                      <br /><br />
                      Os dados de indexação já coletados serão mantidos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => disconnectMutation.mutate()}
                      disabled={disconnectMutation.isPending}
                    >
                      {disconnectMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Desconectando...
                        </>
                      ) : (
                        'Desconectar'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>

      {settings?.is_active && (
        <>
          {/* Card de Configurações */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>
                Configure o comportamento automático da integração
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-sitemap" className="flex flex-col gap-1">
                  <span>Submeter sitemap automaticamente</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    Envia o sitemap para o Google periodicamente
                  </span>
                </Label>
                <Switch
                  id="auto-sitemap"
                  checked={settings.auto_submit_sitemap}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ auto_submit_sitemap: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-publish" className="flex flex-col gap-1">
                  <span>Submeter URLs ao publicar conteúdo</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    Solicita indexação imediata de novos posts e projetos
                  </span>
                </Label>
                <Switch
                  id="auto-publish"
                  checked={settings.auto_submit_on_publish}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ auto_submit_on_publish: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Card de Ações Manuais */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Manuais</CardTitle>
              <CardDescription>
                Execute operações manualmente quando necessário
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => submitSitemapMutation.mutate()}
                  disabled={submitSitemapMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {submitSitemapMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Submeter Sitemap
                </Button>

                <Button
                  onClick={() => checkStatusMutation.mutate()}
                  disabled={checkStatusMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {checkStatusMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Verificar Status
                </Button>

                <Button
                  onClick={() => refreshTokenMutation.mutate()}
                  disabled={refreshTokenMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {refreshTokenMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Atualizar Tokens
                </Button>
              </div>

              {checkStatusMutation.isError && (
                <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-destructive">
                      Erro ao verificar status
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Verifique se o access token está válido e se você tem permissões no Google Search Console
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <AddUrlDialog />
              </div>
            </CardContent>
          </Card>

          {/* Card de Status de Indexação */}
          <Card>
            <CardHeader>
              <CardTitle>Status de Indexação</CardTitle>
              <CardDescription>
                Acompanhe o status das suas URLs no Google
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStatus ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : indexingStatus && indexingStatus.length > 0 ? (
                <>
                  {/* Barra de ações com seleção */}
                  <div className="flex items-center justify-between mb-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {selectedUrls.length > 0 && (
                        <Badge variant="secondary" className="text-sm">
                          {selectedUrls.length} URL{selectedUrls.length !== 1 ? 's' : ''} selecionada{selectedUrls.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => requestIndexingMutation.mutate({ urls: selectedUrls })}
                      disabled={selectedUrls.length === 0 || requestIndexingMutation.isPending}
                      size="sm"
                    >
                      {requestIndexingMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Solicitando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Solicitar Indexação ({selectedUrls.length})
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Tabela com checkboxes */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox 
                              checked={selectedUrls.length === indexingStatus.length && indexingStatus.length > 0}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead>URL</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Última Verificação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {indexingStatus.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Checkbox 
                                checked={selectedUrls.includes(item.url)}
                                onCheckedChange={() => handleToggleUrl(item.url)}
                              />
                            </TableCell>
                            <TableCell className="font-medium max-w-md truncate">
                              {item.url}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.page_type}</Badge>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(item.indexing_status)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(item.last_checked), 'dd/MM/yyyy HH:mm', {
                                locale: ptBR
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhum status de indexação registrado ainda</p>
                  <p className="text-sm">Clique em "Verificar Status" para começar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default GoogleSearchConsole;
