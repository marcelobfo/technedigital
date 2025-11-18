import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="automation">Ativar Automação</Label>
              <p className="text-sm text-muted-foreground">
                Gera automaticamente 3 posts por semana (segunda, quarta e sexta às 9h UTC)
              </p>
            </div>
            <Switch
              id="automation"
              checked={settings?.automation_enabled ?? false}
              onCheckedChange={handleAutomationToggle}
              disabled={updateAutomation.isPending}
            />
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-medium">Status da Automação</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Estado atual:</p>
                <p className="font-medium">
                  {settings?.automation_enabled ? (
                    <span className="text-green-600">Ativa</span>
                  ) : (
                    <span className="text-red-600">Desativada</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Posts por semana:</p>
                <p className="font-medium">{settings?.posts_per_week ?? 3}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">Como funciona</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Posts são gerados automaticamente 3x por semana</li>
              <li>Segunda-feira, quarta-feira e sexta-feira às 9h (UTC)</li>
              <li>Conteúdo e imagens criados por IA otimizada para SEO</li>
              <li>Posts são publicados automaticamente</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
