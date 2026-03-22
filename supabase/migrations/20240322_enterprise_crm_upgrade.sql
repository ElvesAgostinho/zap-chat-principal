-- Enterprise CRM Upgrade Migration
-- Adds support for universal business types, advanced payments, and delivery tracking.

-- 1. Update Lojas Table
ALTER TABLE lojas 
ADD COLUMN IF NOT EXISTS tipo_negocio TEXT DEFAULT 'geral',
ADD COLUMN IF NOT EXISTS iban TEXT,
ADD COLUMN IF NOT EXISTS conta_nome TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_pagamento TEXT,
ADD COLUMN IF NOT EXISTS localizacao_url TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL,
ADD COLUMN IF NOT EXISTS longitude DECIMAL,
ADD COLUMN IF NOT EXISTS config_followup JSONB DEFAULT '{"enabled": false, "interval_hours": 24, "max_messages": 3}';

-- 2. Update Vendas Table for Deliveries
ALTER TABLE vendas
ADD COLUMN IF NOT EXISTS data_entrega DATE,
ADD COLUMN IF NOT EXISTS periodo_entrega TEXT, -- 'manha', 'tarde', 'noite'
ADD COLUMN IF NOT EXISTS entregador_id UUID;

-- 3. Create Notificacoes Table
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

-- Enable Realtime for the new table
ALTER PUBLICATION supabase_realtime ADD TABLE notificacoes;

-- 4. Enable RLS on Notificacoes
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own store notifications" 
ON notificacoes FOR SELECT 
USING (loja_id IN (SELECT loja_id FROM usuarios_loja WHERE user_id = auth.uid()));

CREATE POLICY "Service role can do everything on notifications" 
ON notificacoes FOR ALL 
USING (true)
WITH CHECK (true);
