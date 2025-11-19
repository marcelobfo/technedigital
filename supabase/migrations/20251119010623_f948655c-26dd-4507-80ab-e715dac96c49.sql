-- Criar bucket para imagens do portfolio
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true);

-- Políticas RLS para portfolio-images bucket
CREATE POLICY "Imagens do portfolio são públicas para leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-images');

CREATE POLICY "Admins podem fazer upload de imagens do portfolio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins podem deletar imagens do portfolio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portfolio-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Tabela de configurações do site (SEO, Pixels, Analytics)
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  google_analytics_id TEXT,
  facebook_pixel_id TEXT,
  custom_head_scripts TEXT,
  custom_body_scripts TEXT,
  tracking_pixels JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar configurações do site"
ON public.site_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Qualquer um pode ler configurações do site"
ON public.site_settings FOR SELECT
USING (true);

-- Inserir configuração padrão
INSERT INTO public.site_settings (id, meta_title, meta_description)
VALUES (gen_random_uuid(), 'Meu Site', 'Descrição do meu site');

-- Tabela de configurações do WhatsApp
CREATE TABLE public.whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_url TEXT NOT NULL,
  api_token TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar configurações do WhatsApp"
ON public.whatsapp_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Tabela de analytics do site
CREATE TABLE public.site_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver analytics"
ON public.site_analytics FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Qualquer um pode inserir analytics"
ON public.site_analytics FOR INSERT
WITH CHECK (true);

-- Criar índices para melhorar performance de consultas
CREATE INDEX idx_site_analytics_created_at ON public.site_analytics(created_at);
CREATE INDEX idx_site_analytics_page_path ON public.site_analytics(page_path);
CREATE INDEX idx_site_analytics_visitor_id ON public.site_analytics(visitor_id);

-- Atualizar tabela proposals para rastrear envios
ALTER TABLE public.proposals
ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN sent_via TEXT,
ADD COLUMN sent_to_email TEXT,
ADD COLUMN sent_to_whatsapp TEXT;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_settings_updated_at
BEFORE UPDATE ON public.whatsapp_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();