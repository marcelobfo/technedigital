-- Criar função e trigger para gerar registro financeiro automaticamente quando proposta é aceita
CREATE OR REPLACE FUNCTION public.create_financial_record_on_proposal_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se mudou para accepted e não era accepted antes
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Criar registro financeiro
    INSERT INTO public.financial_records (
      type,
      amount,
      date,
      status,
      lead_id,
      proposal_id,
      notes,
      category
    ) VALUES (
      'income',
      NEW.final_amount,
      CURRENT_DATE,
      'pending',
      NEW.lead_id,
      NEW.id,
      'Receita gerada automaticamente da proposta ' || NEW.proposal_number,
      'Projeto'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS proposal_accepted_create_financial ON public.proposals;
CREATE TRIGGER proposal_accepted_create_financial
  AFTER UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.create_financial_record_on_proposal_accept();