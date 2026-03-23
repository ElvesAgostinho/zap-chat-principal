-- Migração para estruturar Formas de Pagamento e Taxas de Entrega
-- Autor: Antigravity
-- Data: 2026-03-22

-- 1. Tabela de Formas de Pagamento
CREATE TABLE IF NOT EXISTS public.formas_pagamento (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    tipo text NOT NULL, -- ex: 'Multicaixa', 'IBAN', 'Dinheiro'
    detalhes text,      -- ex: '0001.0002.0003', 'Pagamento na entrega'
    is_active boolean DEFAULT true,
    criado_em timestamp with time zone DEFAULT now()
);

-- 2. Tabela de Taxas de Entrega (Zonas)
CREATE TABLE IF NOT EXISTS public.taxas_entrega (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    zona text NOT NULL,  -- ex: 'Talatona', 'Viana'
    taxa numeric NOT NULL DEFAULT 0,
    is_active boolean DEFAULT true,
    criado_em timestamp with time zone DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxas_entrega ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS para Admin
CREATE POLICY "Admins manage own payment methods" ON public.formas_pagamento
    FOR ALL TO authenticated
    USING (loja_id = get_user_store_id(auth.uid()))
    WITH CHECK (loja_id = get_user_store_id(auth.uid()));

CREATE POLICY "Admins manage own delivery fees" ON public.taxas_entrega
    FOR ALL TO authenticated
    USING (loja_id = get_user_store_id(auth.uid()))
    WITH CHECK (loja_id = get_user_store_id(auth.uid()));

-- 5. Políticas de RLS para Super Admin
CREATE POLICY "Super admin manages all payment methods" ON public.formas_pagamento
    FOR ALL TO authenticated
    USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admin manages all delivery fees" ON public.taxas_entrega
    FOR ALL TO authenticated
    USING (is_super_admin(auth.uid()));

-- 6. Migrar dados existentes (opcional, mas recomendado)
-- Move dados das colunas legadas da tabela lojas para as novas tabelas
INSERT INTO public.formas_pagamento (loja_id, tipo)
SELECT id, unnest(formas_pagamento) 
FROM public.lojas 
WHERE array_length(formas_pagamento, 1) > 0;

INSERT INTO public.taxas_entrega (loja_id, zona)
SELECT id, unnest(zonas_entrega) 
FROM public.lojas 
WHERE array_length(zonas_entrega, 1) > 0;
