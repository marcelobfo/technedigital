-- Remover o trigger problemático
DROP TRIGGER IF EXISTS on_lead_created_send_whatsapp ON public.leads;
DROP FUNCTION IF EXISTS trigger_send_welcome_whatsapp();

-- A chamada ao WhatsApp será feita via código da aplicação, não via trigger SQL