-- Criar tabela de logs do WhatsApp
CREATE TABLE public.whatsapp_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  formatted_phone TEXT,
  message_type TEXT NOT NULL DEFAULT 'welcome',
  status TEXT NOT NULL DEFAULT 'pending',
  api_response JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Política para admins visualizarem logs
CREATE POLICY "Admins podem visualizar logs do WhatsApp" 
ON public.whatsapp_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Permitir inserção de logs (será feito pela edge function com service role)
CREATE POLICY "Service role pode inserir logs" 
ON public.whatsapp_logs 
FOR INSERT 
WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_whatsapp_logs_lead_id ON public.whatsapp_logs(lead_id);
CREATE INDEX idx_whatsapp_logs_created_at ON public.whatsapp_logs(created_at DESC);
CREATE INDEX idx_whatsapp_logs_status ON public.whatsapp_logs(status);