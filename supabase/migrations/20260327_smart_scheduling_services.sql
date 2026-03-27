-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Smart Scheduling System
-- Creates servicos_loja table + unique constraint on agendamentos
-- ═══════════════════════════════════════════════════════════════

-- 1. Tabela de Serviços da Loja
CREATE TABLE IF NOT EXISTS public.servicos_loja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  duracao_min INTEGER NOT NULL DEFAULT 60,
  preco NUMERIC(10,2),
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.servicos_loja ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Store admins manage own services') THEN
    CREATE POLICY "Store admins manage own services" ON public.servicos_loja
      FOR ALL TO authenticated
      USING (loja_id = get_user_store_id(auth.uid()))
      WITH CHECK (loja_id = get_user_store_id(auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access to servicos_loja') THEN
    CREATE POLICY "Service role full access to servicos_loja" ON public.servicos_loja
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. Unique constraint on agendamentos to prevent duplicates at DB level
-- (lead + loja + same time slot within same service)
CREATE UNIQUE INDEX IF NOT EXISTS idx_agendamentos_no_duplicate
  ON public.agendamentos (loja_id, lead_id, data_hora, servico)
  WHERE status != 'cancelado';

-- 3. Add a column to track if confirmation was sent (avoid double-confirmation)
ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS confirmacao_enviada BOOLEAN DEFAULT FALSE;

-- 4. Enable Realtime for servicos_loja
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'servicos_loja'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE servicos_loja;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'agendamentos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE agendamentos;
  END IF;
END $$;
