import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save, Mail, Phone, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

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

interface ContactSettings {
  id?: string;
  email: string;
  phone: string;
  location: string;
  maps_embed_url: string;
  whatsapp_number: string;
  business_hours: string;
  show_map?: boolean;
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
  const [contactSettings, setContactSettings] = useState<ContactSettings>({
    email: '',
    phone: '',
    location: '',
    maps_embed_url: '',
    whatsapp_number: '',
    business_hours: '',
    show_map: true,
  });

  useEffect(() => {
    fetchSettings();
    fetchContactSettings();
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

  const fetchContactSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setContactSettings(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de contato:', error);
      toast.error('Erro ao carregar configurações de contato');
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

  const handleSaveContact = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const dataToSave = {
        ...contactSettings,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (contactSettings.id) {
        const { error } = await supabase
          .from('contact_settings')
          .update(dataToSave)
          .eq('id', contactSettings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contact_settings')
          .insert([dataToSave]);

        if (error) throw error;
      }

      toast.success('Configurações de contato salvas com sucesso!');
      fetchContactSettings();
    } catch (error) {
      console.error('Erro ao salvar configurações de contato:', error);
      toast.error('Erro ao salvar configurações de contato');
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
        <p className="text-muted-foreground">Configure SEO, informações de contato e scripts personalizados</p>
      </div>

      <Tabs defaultValue="seo" className="w-full">
        <TabsList>
          <TabsTrigger value="seo">SEO & Scripts</TabsTrigger>
          <TabsTrigger value="contact">Informações de Contato</TabsTrigger>
        </TabsList>

        <TabsContent value="seo" className="space-y-6">
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
              {saving ? 'Salvando...' : 'Salvar Configurações de SEO'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
              <CardDescription>Configure as informações exibidas na página de contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="contact_email">
                    <Mail className="inline mr-2 h-4 w-4" />
                    E-mail de Contato
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={contactSettings.email}
                    onChange={(e) => setContactSettings({ ...contactSettings, email: e.target.value })}
                    placeholder="contato@seusite.com"
                  />
                </div>

                <div>
                  <Label htmlFor="contact_phone">
                    <Phone className="inline mr-2 h-4 w-4" />
                    Telefone
                  </Label>
                  <Input
                    id="contact_phone"
                    value={contactSettings.phone}
                    onChange={(e) => setContactSettings({ ...contactSettings, phone: e.target.value })}
                    placeholder="+55 11 99999-9999"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contact_location">
                  <MapPin className="inline mr-2 h-4 w-4" />
                  Localização
                </Label>
                <Input
                  id="contact_location"
                  value={contactSettings.location}
                  onChange={(e) => setContactSettings({ ...contactSettings, location: e.target.value })}
                  placeholder="São Paulo, SP - Brasil"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="show_map">Exibir Mapa do Google Maps</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar ou ocultar o mapa na página de contato
                  </p>
                </div>
                <Switch
                  id="show_map"
                  checked={contactSettings.show_map ?? true}
                  onCheckedChange={(checked) => 
                    setContactSettings({ ...contactSettings, show_map: checked })
                  }
                />
              </div>

              <div>
                <Label htmlFor="maps_url">URL do Google Maps (Embed)</Label>
                <Textarea
                  id="maps_url"
                  value={contactSettings.maps_embed_url}
                  onChange={(e) => setContactSettings({ ...contactSettings, maps_embed_url: e.target.value })}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  rows={3}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Cole a URL do iframe do Google Maps. Para obter: Google Maps → Compartilhar → Incorporar mapa
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
                  <Input
                    id="whatsapp"
                    value={contactSettings.whatsapp_number}
                    onChange={(e) => setContactSettings({ ...contactSettings, whatsapp_number: e.target.value })}
                    placeholder="+55 11 99999-9999"
                  />
                </div>

                <div>
                  <Label htmlFor="business_hours">Horário de Funcionamento (opcional)</Label>
                  <Input
                    id="business_hours"
                    value={contactSettings.business_hours}
                    onChange={(e) => setContactSettings({ ...contactSettings, business_hours: e.target.value })}
                    placeholder="Seg-Sex: 9h-18h"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveContact} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Informações de Contato'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
