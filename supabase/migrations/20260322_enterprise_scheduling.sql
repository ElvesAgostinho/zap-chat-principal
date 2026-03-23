-- Enterprise Scheduling Upgrade
-- Adds advanced scheduling (upsert/cancel) and real-time notifications.

-- 1. Create Notifications Table (if not exists via previous plan)
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  tipo TEXT CHECK (tipo IN ('agendamento', 'pedido', 'lead_quente', 'sistema')),
  titulo TEXT NOT NULL,
  mensagem TEXT,
  lida BOOLEAN DEFAULT FALSE,
  link TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime for notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notificacoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notificacoes;
  END IF;
END $$;

-- 2. Update Agendamentos Table
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS servico_detalhes JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Standardize status: pendente, confirmado, concluido, cancelado
-- Ensure current 'agendado' becomes 'confirmado' for professional look
UPDATE agendamentos SET status = 'confirmado' WHERE status = 'agendado';

-- 3. RLS for Notificacoes
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own store notifications') THEN
    CREATE POLICY "Users can view their own store notifications" 
    ON notificacoes FOR SELECT 
    USING (loja_id IN (SELECT loja_id FROM usuarios_loja WHERE user_id = auth.uid()));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can do everything on notifications') THEN
    CREATE POLICY "Service role can do everything on notifications" 
    ON notificacoes FOR ALL 
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;
