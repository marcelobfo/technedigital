-- Criar tabela para configurações de contato
CREATE TABLE IF NOT EXISTS public.contact_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL DEFAULT 'contato@technedigital.com',
  phone TEXT NOT NULL DEFAULT '+55 11 99999-9999',
  location TEXT NOT NULL DEFAULT 'São Paulo, SP - Brasil',
  maps_embed_url TEXT NOT NULL DEFAULT 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.0977!2d-46.6546!3d-23.5615!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDMzJzQxLjQiUyA0NsKwMzknMTYuNiJX!5e0!3m2!1spt-BR!2sbr!4v1234567890',
  whatsapp_number TEXT,
  business_hours TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode ler as informações de contato
CREATE POLICY "Qualquer um pode ler configurações de contato"
  ON public.contact_settings
  FOR SELECT
  USING (true);

-- Política: Apenas admins podem gerenciar
CREATE POLICY "Admins podem gerenciar configurações de contato"
  ON public.contact_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Inserir valores padrão
INSERT INTO public.contact_settings (email, phone, location, maps_embed_url)
VALUES (
  'contato@technedigital.com',
  '+55 11 99999-9999',
  'São Paulo, SP - Brasil',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.0977!2d-46.6546!3d-23.5615!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDMzJzQxLjQiUyA0NsKwMzknMTYuNiJX!5e0!3m2!1spt-BR!2sbr!4v1234567890'
);