-- Tabela de configurações de email
CREATE TABLE public.email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'resend', -- 'resend' ou 'smtp'
  is_active BOOLEAN DEFAULT true,
  
  -- Configurações Resend
  resend_api_key TEXT,
  resend_from_email TEXT DEFAULT 'onboarding@resend.dev',
  resend_from_name TEXT DEFAULT 'Minha Empresa',
  
  -- Configurações SMTP
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_user TEXT,
  smtp_password TEXT,
  smtp_from_email TEXT,
  smtp_from_name TEXT,
  smtp_secure BOOLEAN DEFAULT true, -- TLS
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver/editar
CREATE POLICY "Admins can manage email settings"
ON public.email_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_email_settings_updated_at
BEFORE UPDATE ON public.email_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configuração padrão
INSERT INTO public.email_settings (provider, resend_from_email, resend_from_name)
VALUES ('resend', 'onboarding@resend.dev', 'Minha Empresa');