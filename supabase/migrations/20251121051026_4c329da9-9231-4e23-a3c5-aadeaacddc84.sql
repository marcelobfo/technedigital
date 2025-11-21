-- Criar função que será chamada após inserção de lead
CREATE OR REPLACE FUNCTION trigger_send_welcome_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_phone TEXT;
BEGIN
  -- Verificar se o lead tem telefone
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    v_phone := NEW.phone;
    
    -- Chamar edge function de forma assíncrona (não bloqueia a inserção)
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-welcome-whatsapp',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'lead_id', NEW.id,
        'phone_number', v_phone,
        'lead_name', NEW.name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger que executa após INSERT em leads
DROP TRIGGER IF EXISTS on_lead_created_send_whatsapp ON public.leads;
CREATE TRIGGER on_lead_created_send_whatsapp
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_welcome_whatsapp();

-- Comentário
COMMENT ON FUNCTION trigger_send_welcome_whatsapp() IS 
  'Envia mensagem automática de boas-vindas via WhatsApp quando um novo lead é criado';