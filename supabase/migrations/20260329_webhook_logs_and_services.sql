-- =====================================================
-- Migração: Idempotência Webhook + Serviço Padrão
-- Data: 2026-03-29
-- =====================================================

-- 1. Tabela de Idempotência para o Webhook do WhatsApp
-- Garante que cada mensagem é processada uma única vez.
CREATE TABLE IF NOT EXISTS webhook_logs (
    message_id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-limpar logs com mais de 72h (para não crescer indefinidamente)
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON webhook_logs (created_at);

-- 2. Política de limpeza (executar manualmente ou via cron se necessário)
-- DELETE FROM webhook_logs WHERE created_at < NOW() - INTERVAL '72 hours';

-- 3. Garantir que a tabela servicos_loja existe
CREATE TABLE IF NOT EXISTS servicos_loja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    duracao_min INTEGER DEFAULT 60,
    preco NUMERIC(10,2) DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_servicos_loja_loja_id ON servicos_loja (loja_id);

-- 4. RLS para servicos_loja (se não existir)
ALTER TABLE servicos_loja ENABLE ROW LEVEL SECURITY;

-- Política: loja pode gerir os seus próprios serviços
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'servicos_loja' AND policyname = 'Loja pode ver e gerir os seus servicos'
    ) THEN
        CREATE POLICY "Loja pode ver e gerir os seus servicos"
            ON servicos_loja
            FOR ALL
            USING (
                loja_id IN (
                    SELECT id FROM lojas WHERE user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Service Role pode tudo (para o bot)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'servicos_loja' AND policyname = 'Service role full access'
    ) THEN
        CREATE POLICY "Service role full access"
            ON servicos_loja
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;
