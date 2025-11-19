import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, TestTube, MessageCircle } from 'lucide-react';

interface WhatsAppSettings {
  id?: string;
  api_url: string;
  api_token: string;
  instance_name: string;
  is_active: boolean;
}

export default function WhatsAppSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState<WhatsAppSettings>({
    api_url: '',
    api_token: '',
    instance_name: '',
    is_active: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings.api_url || !settings.api_token || !settings.instance_name) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const dataToSave = {
        api_url: settings.api_url,
        api_token: settings.api_token,
        instance_name: settings.instance_name,
        is_active: settings.is_active,
        updated_by: user.id,
      };

      if (settings.id) {
        const { error } = await supabase
          .from('whatsapp_settings')
          .update(dataToSave)
          .eq('id', settings.id);

        if (error) {
          console.error('Erro ao atualizar:', error);
          toast.error(`Erro ao atualizar: ${error.message}`);
          return;
        }
      } else {
        const { error } = await supabase
          .from('whatsapp_settings')
          .insert([dataToSave]);

        if (error) {
          console.error('Erro ao inserir:', error);
          toast.error(`Erro ao inserir: ${error.message}`);
          return;
        }
      }

      toast.success('Configurações salvas com sucesso!');
      await fetchSettings();
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast.error(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!settings.api_url || !settings.api_token || !settings.instance_name) {
      toast.error('Salve as configurações antes de testar');
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-whatsapp-connection', {
        body: { settings },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Conexão com WhatsApp estabelecida com sucesso!');
      } else {
        toast.error('Falha na conexão: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      toast.error('Erro ao testar conexão com WhatsApp');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações do WhatsApp</h1>
        <p className="text-muted-foreground">Configure a integração com a API de WhatsApp</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            API do WhatsApp
          </CardTitle>
          <CardDescription>
            Configure os dados da sua API de WhatsApp para envio automático de propostas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="api_url">URL da API *</Label>
            <Input
              id="api_url"
              value={settings.api_url}
              onChange={(e) => setSettings({ ...settings, api_url: e.target.value })}
              placeholder="https://sub.domain.com"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Exemplo: https://api.whatsapp.com
            </p>
          </div>

          <div>
            <Label htmlFor="api_token">Token de API *</Label>
            <Input
              id="api_token"
              type="password"
              value={settings.api_token}
              onChange={(e) => setSettings({ ...settings, api_token: e.target.value })}
              placeholder="••••••••••••••••"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Token de autenticação fornecido pela sua API de WhatsApp
            </p>
          </div>

          <div>
            <Label htmlFor="instance_name">Nome da Instância *</Label>
            <Input
              id="instance_name"
              value={settings.instance_name}
              onChange={(e) => setSettings({ ...settings, instance_name: e.target.value })}
              placeholder="minhainstancia"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Nome da instância configurada na sua API de WhatsApp
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Ativar Integração</Label>
              <p className="text-sm text-muted-foreground">
                Habilite o envio de propostas via WhatsApp
              </p>
            </div>
            <Switch
              id="is_active"
              checked={settings.is_active}
              onCheckedChange={(checked) => setSettings({ ...settings, is_active: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">Como usar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900 dark:text-blue-100">
          <p><strong>1.</strong> Configure os dados da API acima</p>
          <p><strong>2.</strong> Salve as configurações</p>
          <p><strong>3.</strong> Teste a conexão</p>
          <p><strong>4.</strong> Vá para uma proposta e clique em "Enviar via WhatsApp"</p>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={handleTest} disabled={testing || !settings.id}>
          <TestTube className="mr-2 h-4 w-4" />
          {testing ? 'Testando...' : 'Testar Conexão'}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}
