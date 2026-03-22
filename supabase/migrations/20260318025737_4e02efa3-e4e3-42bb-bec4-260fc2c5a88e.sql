
-- 1. Add followup columns to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS followup_count integer DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ultimo_followup timestamptz;

-- 2. Add data_entregue to vendas
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS data_entregue timestamptz;

-- 3. Create trigger function for auto-conversion lead -> cliente
CREATE OR REPLACE FUNCTION public.update_lead_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL THEN
    UPDATE public.leads SET status = 'cliente'
    WHERE id = NEW.lead_id AND status != 'cliente';
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Create the trigger
DROP TRIGGER IF EXISTS on_venda_convert_lead ON public.vendas;
CREATE TRIGGER on_venda_convert_lead
AFTER INSERT ON public.vendas
FOR EACH ROW EXECUTE FUNCTION public.update_lead_on_sale();
