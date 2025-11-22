import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save, Mail, Phone, MapPin, Copy, Eye, RefreshCw, Map } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
  const [sitemapStats, setSitemapStats] = useState({
    totalUrls: 0,
    blogPosts: 0,
    projects: 0,
    services: 0,
  });

  useEffect(() => {
    fetchSettings();
    fetchContactSettings();
    fetchSitemapStats();
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

  const fetchSitemapStats = async () => {
    try {
      const [postsResponse, projectsResponse, servicesResponse] = await Promise.all([
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('portfolio_projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('services').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      const blogCount = postsResponse.count || 0;
      const projectsCount = projectsResponse.count || 0;
      const servicesCount = servicesResponse.count || 0;
      const staticPages = 6; // home, about, services, portfolio, blog, contact

      setSitemapStats({
        totalUrls: staticPages + blogCount + projectsCount,
        blogPosts: blogCount,
        projects: projectsCount,
        services: servicesCount,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas do sitemap:', error);
    }
  };

  const copySitemapUrl = () => {
    const sitemapUrl = 'https://technedigital.com.br/sitemap.xml';
    navigator.clipboard.writeText(sitemapUrl);
    toast.success('URL do sitemap copiada!');
  };

  const viewSitemap = () => {
    window.open('https://technedigital.com.br/sitemap.xml', '_blank');
  };

  const refreshSitemap = async () => {
    await fetchSitemapStats();
    toast.success('Estatísticas do sitemap atualizadas!');
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
          <TabsTrigger value="sitemap">
            <Map className="mr-2 h-4 w-4" />
            Sitemap
          </TabsTrigger>
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

        <TabsContent value="sitemap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sitemap XML</CardTitle>
              <CardDescription>
                Configure e gerencie o sitemap do seu site para mecanismos de busca
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Status do Sitemap */}
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-900">
                <h3 className="font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                  ✅ Sitemap ativo e acessível
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Seu sitemap é gerado automaticamente a cada nova publicação
                </p>
              </div>
              
              {/* URL do Sitemap */}
              <div>
                <Label>URL do Sitemap</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    value="https://technedigital.com.br/sitemap.xml"
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button onClick={copySitemapUrl} variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Use esta URL direta para enviar ao Google Search Console
                </p>
              </div>
              
              {/* Estatísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-primary">{sitemapStats.totalUrls}</div>
                    <p className="text-sm text-muted-foreground mt-1">URLs Totais</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-primary">{sitemapStats.blogPosts}</div>
                    <p className="text-sm text-muted-foreground mt-1">Posts do Blog</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-primary">{sitemapStats.projects}</div>
                    <p className="text-sm text-muted-foreground mt-1">Projetos</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-primary">6</div>
                    <p className="text-sm text-muted-foreground mt-1">Páginas Estáticas</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Ações */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={viewSitemap} variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar Sitemap
                </Button>
                
                <Button onClick={refreshSitemap} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar Estatísticas
                </Button>
              </div>
              
              {/* Instruções Google Search Console */}
              <Accordion type="single" collapsible>
                <AccordionItem value="google">
                  <AccordionTrigger>
                    📊 Como Enviar para o Google Search Console
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <ol className="list-decimal pl-4 space-y-2 text-sm">
                      <li>
                        Acesse{' '}
                        <a 
                          href="https://search.google.com/search-console" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                        >
                          Google Search Console
                        </a>
                      </li>
                      <li>Selecione sua propriedade (<strong>technedigital.com.br</strong>)</li>
                      <li>No menu lateral, clique em <strong>"Sitemaps"</strong></li>
                      <li>
                        Cole a URL:{' '}
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          https://technedigital.com.br/sitemap.xml
                        </code>
                      </li>
                      <li>Clique em <strong>"Enviar"</strong></li>
                      <li>Aguarde o processamento (pode levar alguns dias)</li>
                    </ol>
                    
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded border border-blue-200 dark:border-blue-900">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        💡 <strong>Dica:</strong> Após enviar, o Google irá crawlear seu site automaticamente. 
                        Você pode acompanhar o status na seção "Cobertura" do Search Console.
                      </p>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded border border-amber-200 dark:border-amber-900">
                      <p className="text-sm text-amber-900 dark:text-amber-100">
                        ⚠️ <strong>Importante:</strong> Certifique-se de ter verificado a propriedade do domínio 
                        no Google Search Console antes de enviar o sitemap.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
