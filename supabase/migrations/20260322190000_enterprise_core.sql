-- Enterprise CRM Core Upgrade
-- Autor: Antigravity
-- Data: 2026-03-22

-- 1. Profit Tracking: Adiciona custo unitário aos produtos
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS custo_unitario numeric DEFAULT 0;

-- 2. Multi-agent Support: Adiciona atendente responsável ao lead
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS atendente_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS segmento text DEFAULT 'Geral';

-- 3. Automation Engine: Tabela para campanhas de retenção/pós-venda
CREATE TABLE IF NOT EXISTS public.campanhas_automaticas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    nome text NOT NULL,
    evento text NOT NULL, -- ex: 'pos_venda', 'abandono_carrinho', 'reativacao'
    atraso_dias integer DEFAULT 1,
    mensagem text NOT NULL,
    is_active boolean DEFAULT true,
    criado_em timestamp with time zone DEFAULT now()
);

-- 4. RLS para Campanhas Automáticas
ALTER TABLE public.campanhas_automaticas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage own automations" ON public.campanhas_automaticas
    FOR ALL TO authenticated
    USING (loja_id = get_user_store_id(auth.uid()))
    WITH CHECK (loja_id = get_user_store_id(auth.uid()));

CREATE POLICY "Super admin manages all automations" ON public.campanhas_automaticas
    FOR ALL TO authenticated
    USING (is_super_admin(auth.uid()));

-- 5. Atualiza RLS de Leads para suportar atribuição (opcional, já coberto por loja_id geralmente)
-- Mas podemos adicionar uma política específica para atendentes verem apenas seus leads se desejar no futuro.
