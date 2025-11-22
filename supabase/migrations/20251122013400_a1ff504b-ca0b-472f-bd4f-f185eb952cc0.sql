-- 1. Corrigir o trigger para evitar duplicação e sincronizar status
CREATE OR REPLACE FUNCTION public.create_financial_record_on_proposal_accept()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Se mudou para accepted E não era accepted antes
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Verificar se já existe registro financeiro para esta proposta
    IF NOT EXISTS (
      SELECT 1 FROM public.financial_records 
      WHERE proposal_id = NEW.id
    ) THEN
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
  END IF;
  
  -- Se saiu de accepted para outro status, cancelar/deletar o registro financeiro
  IF OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
    DELETE FROM public.financial_records
    WHERE proposal_id = NEW.id
    AND status = 'pending'; -- Só deleta se ainda está pendente
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Limpar registros financeiros duplicados mantendo apenas o mais recente
DELETE FROM public.financial_records a
WHERE a.id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY proposal_id 
             ORDER BY created_at DESC
           ) as rn
    FROM public.financial_records
    WHERE proposal_id IS NOT NULL
  ) t
  WHERE t.rn > 1
);