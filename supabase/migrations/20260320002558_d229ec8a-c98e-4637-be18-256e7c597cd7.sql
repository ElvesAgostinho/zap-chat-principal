
-- 1. AGENDAMENTOS (Scheduling System)
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  cliente_nome text NOT NULL,
  cliente_telefone text,
  servico text,
  data_hora timestamp with time zone NOT NULL,
  duracao_min integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'agendado',
  notas text,
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store scoped agendamentos" ON public.agendamentos
  FOR ALL TO authenticated
  USING (loja_id = get_user_store_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Service insert agendamentos" ON public.agendamentos
  FOR INSERT TO public
  WITH CHECK (true);

CREATE INDEX idx_agendamentos_loja_data ON public.agendamentos(loja_id, data_hora);

-- 2. HORARIOS DISPONIVEIS
CREATE TABLE IF NOT EXISTS public.horarios_loja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  dia_semana integer NOT NULL,
  hora_inicio time NOT NULL DEFAULT '08:00',
  hora_fim time NOT NULL DEFAULT '18:00',
  ativo boolean NOT NULL DEFAULT true,
  UNIQUE(loja_id, dia_semana)
);

ALTER TABLE public.horarios_loja ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store scoped horarios" ON public.horarios_loja
  FOR ALL TO authenticated
  USING (loja_id = get_user_store_id(auth.uid()) OR is_super_admin(auth.uid()));

-- 3. ADD idioma column to lojas
ALTER TABLE public.lojas ADD COLUMN IF NOT EXISTS idioma text DEFAULT 'pt-AO';

-- 4. Stock update trigger on vendas
CREATE OR REPLACE FUNCTION public.update_stock_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.produto IS NOT NULL AND NEW.loja_id IS NOT NULL AND NEW.status != 'cancelado' THEN
    UPDATE public.produtos
    SET estoque = GREATEST(estoque - COALESCE(NEW.quantidade, 1), 0)
    WHERE loja_id = NEW.loja_id
      AND lower(nome) = lower(NEW.produto)
      AND estoque > 0;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_stock_on_sale ON public.vendas;
CREATE TRIGGER trg_update_stock_on_sale
  AFTER INSERT ON public.vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_sale();

-- 5. Lead pipeline trigger
CREATE OR REPLACE FUNCTION public.update_lead_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL THEN
    UPDATE public.leads SET status = 'cliente'
    WHERE id = NEW.lead_id AND status != 'cliente';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_lead_on_sale ON public.vendas;
CREATE TRIGGER trg_update_lead_on_sale
  AFTER INSERT ON public.vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_on_sale();
