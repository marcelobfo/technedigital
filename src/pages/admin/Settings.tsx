import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch blog settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['blog-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Update automation status mutation
  const updateAutomation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('blog_settings')
        .update({ 
          automation_enabled: enabled,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', settings?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-settings'] });
      toast({
        title: "Configurações atualizadas",
        description: "As configurações de automação foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  // Manual post generation mutation
  const generatePost = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-blog-post', {
        body: { topic: 'Marketing Digital e Tecnologia' }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['recent-automated-posts'] });
      toast({
        title: "Post gerado com sucesso!",
        description: `"${data.title}" foi criado e publicado.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar post",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao gerar o post.",
        variant: "destructive",
      });
    },
  });

  // Test schedule mutation
  const testSchedule = useMutation({
    mutationFn: async (day: string) => {
      const { data, error } = await supabase.functions.invoke('schedule-blog-posts', {
        body: { day }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['recent-automated-posts'] });
      toast({
        title: "Teste de agendamento executado!",
        description: data.success ? `Post "${data.topic}" foi gerado com sucesso.` : "O agendamento está desabilitado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao testar agendamento",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao executar o teste.",
        variant: "destructive",
      });
    },
  });

  // Get recent automated posts
  const { data: recentPosts } = useQuery({
    queryKey: ['recent-automated-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('title, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  const handleAutomationToggle = (checked: boolean) => {
    updateAutomation.mutate(checked);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as configurações do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automação de Posts do Blog</CardTitle>
          <CardDescription>
            Configure a geração automática de posts com IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Alert */}
          <Alert>
            {settings?.automation_enabled ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {settings?.automation_enabled ? (
                <span className="text-sm">
                  Automação <strong>ativa</strong>. Posts serão gerados automaticamente às segundas, quartas e sextas-feiras.
                </span>
              ) : (
                <span className="text-sm">
                  Automação <strong>desativada</strong>. Ative para começar a gerar posts automaticamente.
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Toggle de Automação */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="automation" className="text-base font-semibold">Ativar Automação</Label>
                <Badge variant={settings?.automation_enabled ? "default" : "secondary"}>
                  {settings?.automation_enabled ? 'Ativo' : 'Desativado'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Posts serão gerados automaticamente {settings?.posts_per_week || 3}x por semana
              </p>
            </div>
            <Switch
              id="automation"
              checked={settings?.automation_enabled || false}
              onCheckedChange={handleAutomationToggle}
              disabled={updateAutomation.isPending}
            />
          </div>

          {/* Próximas Execuções */}
          {settings?.automation_enabled && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Próximas Execuções
              </h4>
              <div className="grid gap-2">
                {['Segunda-feira', 'Quarta-feira', 'Sexta-feira'].map((day) => (
                  <div key={day} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{day}</span>
                    </div>
                    <Badge variant="outline">Agendado</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações Manuais */}
          <div className="border-t pt-6 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Ações Manuais
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  onClick={() => generatePost.mutate()}
                  disabled={generatePost.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {generatePost.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gerar Post Agora
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => testSchedule.mutate('monday')}
                  disabled={testSchedule.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {testSchedule.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Testar Agendamento
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Posts Recentes */}
            {recentPosts && recentPosts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Posts Recentes</h4>
                <div className="space-y-2">
                  {recentPosts.map((post, index) => (
                    <div key={`${post.title}-${index}`} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                      <div className="flex-1 truncate">
                        <p className="font-medium truncate">{post.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                        {post.status === 'published' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {post.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Informações */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Como funciona</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5 pl-4">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Posts são gerados automaticamente às segundas, quartas e sextas-feiras</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Cada post é criado com conteúdo único e otimizado para SEO</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Imagens de capa são geradas automaticamente com IA</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Posts são publicados imediatamente após a geração</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
