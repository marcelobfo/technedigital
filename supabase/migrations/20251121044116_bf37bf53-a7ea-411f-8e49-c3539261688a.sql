-- Adicionar coluna para controlar visibilidade do mapa
ALTER TABLE public.contact_settings 
ADD COLUMN IF NOT EXISTS show_map BOOLEAN DEFAULT true;

-- Comentário da coluna
COMMENT ON COLUMN public.contact_settings.show_map 
IS 'Controla se o mapa do Google Maps será exibido na página de contato';