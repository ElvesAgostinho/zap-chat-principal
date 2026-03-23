-- c:\Users\DELL\Desktop\zap chat\zap-chat-principal\supabase\payments_schema.sql
-- Drop if exists (development)
-- DROP TABLE IF EXISTS pagamentos;

CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venda_id UUID REFERENCES vendas(id) ON DELETE CASCADE,
  referencia TEXT NOT NULL, -- 9 digits
  valor NUMERIC(15, 2) NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'expirado')),
  provedor TEXT DEFAULT 'proxypay',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  pago_em TIMESTAMPTZ
);

-- Index for fast lookup by reference (used by webhook)
CREATE INDEX IF NOT EXISTS idx_pagamentos_referencia ON pagamentos(referencia);

-- Enable RLS
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can see their own store's payments via the sales relationship
-- We need to join with vendas to check loja_id
CREATE POLICY "Store owners can view their store payments" ON pagamentos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vendas v
      WHERE v.id = pagamentos.venda_id
      AND v.loja_id IN (
        SELECT store_id FROM auth_profiles WHERE id = auth.uid()
      )
    )
  );

-- Trigger to update Order Status automatically when Payment is marked as Paid
CREATE OR REPLACE FUNCTION tr_update_order_on_payment() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pago' AND OLD.status <> 'pago' THEN
    UPDATE vendas SET 
      pagamento_status = 'pago',
      status = 'confirmado'
    WHERE id = NEW.venda_id;
    
    -- Also log in lead events if possible (optional but good)
    INSERT INTO lead_eventos (lead_id, tipo, descritivo, store_id)
    SELECT v.lead_id, 'venda_atualizada', 'Pagamento confirmado via Multicaixa (' || NEW.referencia || ')', v.loja_id
    FROM vendas v WHERE v.id = NEW.venda_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_payment_confirm ON pagamentos;
CREATE TRIGGER tr_payment_confirm
AFTER UPDATE ON pagamentos
FOR EACH ROW
EXECUTE FUNCTION tr_update_order_on_payment();
