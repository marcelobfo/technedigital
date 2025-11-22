-- Criar tabela para configurações do Google Search Console
CREATE TABLE IF NOT EXISTS public.google_search_console_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  property_url TEXT NOT NULL DEFAULT 'https://technedigital.com.br',
  is_active BOOLEAN DEFAULT false,
  auto_submit_sitemap BOOLEAN DEFAULT true,
  auto_submit_on_publish BOOLEAN DEFAULT true,
  last_sitemap_submit TIMESTAMPTZ,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela para status de indexação SEO
CREATE TABLE IF NOT EXISTS public.seo_indexing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  page_type TEXT,
  reference_id UUID,
  last_crawled TIMESTAMPTZ,
  indexing_status TEXT,
  coverage_state TEXT,
  errors JSONB,
  warnings JSONB,
  last_checked TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_seo_indexing_url ON public.seo_indexing_status(url);
CREATE INDEX IF NOT EXISTS idx_seo_indexing_type ON public.seo_indexing_status(page_type, reference_id);

-- RLS Policies
ALTER TABLE public.google_search_console_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_indexing_status ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar GSC settings
CREATE POLICY "Admins podem gerenciar GSC settings"
  ON public.google_search_console_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins podem gerenciar status de indexação
CREATE POLICY "Admins podem gerenciar status de indexação"
  ON public.seo_indexing_status
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));