-- Migração de Correção: Adiciona colunas faltantes na tabela leads
-- Estas colunas são essenciais para o funcionamento do CRM e do Multi-Agente

-- 1. Adiciona atendente_id se não existir
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS atendente_id uuid REFERENCES auth.users(id);

-- 2. Adiciona segmento se não existir
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS segmento text DEFAULT 'Geral';

-- 3. Garante que os índices existam para performance
CREATE INDEX IF NOT EXISTS idx_leads_atendente_id ON public.leads(atendente_id);
CREATE INDEX IF NOT EXISTS idx_leads_loja_id ON public.leads(loja_id);

-- 4. Mensagem de sucesso
DO $$ 
BEGIN 
    RAISE NOTICE 'Estrutura da tabela leads corrigida com sucesso.';
END $$;
