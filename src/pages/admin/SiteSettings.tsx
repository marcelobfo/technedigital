import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

interface SiteSettings {
  id?: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string[];
  google_analytics_id: string;
  facebook_pixel_id: string;
  custom_head_scripts: string;
  custom_body_scripts: string;
}

export default function SiteSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    meta_title: '',
    meta_description: '',
    meta_keywords: [],
    google_analytics_id: '',
    facebook_pixel_id: '',
    custom_head_scripts: '',
    custom_body_scripts: '',
  });
  const [keywordsInput, setKeywordsInput] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
        setKeywordsInput((data.meta_keywords || []).join(', '));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const keywords = keywordsInput
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const { data: { user } } = await supabase.auth.getUser();

      const dataToSave = {
        ...settings,
        meta_keywords: keywords,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (settings.id) {
        const { error } = await supabase
          .from('site_settings')
          .update(dataToSave)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([dataToSave]);

        if (error) throw error;
      }

      toast.success('Configurações salvas com sucesso!');
      fetchSettings();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
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
        <h1 className="text-3xl font-bold">Configurações do Site</h1>
        <p className="text-muted-foreground">Configure SEO, pixels de rastreamento e scripts personalizados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meta Tags (SEO)</CardTitle>
          <CardDescription>Configure as meta tags para otimização em mecanismos de busca</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="meta_title">Título Padrão do Site</Label>
            <Input
              id="meta_title"
              value={settings.meta_title}
              onChange={(e) => setSettings({ ...settings, meta_title: e.target.value })}
              placeholder="Meu Site Incrível"
            />
          </div>

          <div>
            <Label htmlFor="meta_description">Descrição Padrão</Label>
            <Textarea
              id="meta_description"
              value={settings.meta_description}
              onChange={(e) => setSettings({ ...settings, meta_description: e.target.value })}
              placeholder="Descrição do seu site que aparecerá nos resultados de busca"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
            <Input
              id="keywords"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="tecnologia, desenvolvimento, web design"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pixels de Rastreamento</CardTitle>
          <CardDescription>Configure pixels para Google Analytics e Facebook</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="google_analytics">ID do Google Analytics</Label>
            <Input
              id="google_analytics"
              value={settings.google_analytics_id}
              onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
              placeholder="G-XXXXXXXXXX ou UA-XXXXXXXXX"
            />
          </div>

          <div>
            <Label htmlFor="facebook_pixel">ID do Facebook Pixel</Label>
            <Input
              id="facebook_pixel"
              value={settings.facebook_pixel_id}
              onChange={(e) => setSettings({ ...settings, facebook_pixel_id: e.target.value })}
              placeholder="123456789012345"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scripts Personalizados</CardTitle>
          <CardDescription>Adicione scripts personalizados ao seu site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="head_scripts">Scripts no &lt;head&gt;</Label>
            <Textarea
              id="head_scripts"
              value={settings.custom_head_scripts}
              onChange={(e) => setSettings({ ...settings, custom_head_scripts: e.target.value })}
              placeholder="<script>/* seu código aqui */</script>"
              rows={5}
              className="font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Estes scripts serão inseridos no &lt;head&gt; do site
            </p>
          </div>

          <div>
            <Label htmlFor="body_scripts">Scripts no &lt;body&gt;</Label>
            <Textarea
              id="body_scripts"
              value={settings.custom_body_scripts}
              onChange={(e) => setSettings({ ...settings, custom_body_scripts: e.target.value })}
              placeholder="<script>/* seu código aqui */</script>"
              rows={5}
              className="font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Estes scripts serão inseridos no final do &lt;body&gt;
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}
