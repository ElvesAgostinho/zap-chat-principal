-- Executar este SQL no Editor de SQL do Supabase para corrigir o erro de carregamento das automações

-- 1. Garante que a tabela existe com as colunas corretas
CREATE TABLE IF NOT EXISTS public.campanhas_automaticas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    nome text NOT NULL,
    evento text NOT NULL, -- 'pos_venda', 'abandono_carrinho', 'reativacao', 'boas_vindas'
    atraso_dias integer DEFAULT 1,
    mensagem text NOT NULL,
    is_active boolean DEFAULT true,
    criado_em timestamp with time zone DEFAULT now()
);

-- 2. Habilita RLS
ALTER TABLE public.campanhas_automaticas ENABLE ROW LEVEL SECURITY;

-- 3. Remove políticas antigas se existirem para evitar conflitos
DROP POLICY IF EXISTS "Admins manage own automations" ON public.campanhas_automaticas;
DROP POLICY IF EXISTS "Super admin manages all automations" ON public.campanhas_automaticas;

-- 4. Cria novas políticas baseadas na estrutura atual de usuarios_loja
CREATE POLICY "Admins manage own automations" ON public.campanhas_automaticas
    FOR ALL TO authenticated
    USING (loja_id IN (SELECT loja_id FROM public.usuarios_loja WHERE user_id = auth.uid()))
    WITH CHECK (loja_id IN (SELECT loja_id FROM public.usuarios_loja WHERE user_id = auth.uid()));

CREATE POLICY "Super admin manages all automations" ON public.campanhas_automaticas
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.usuarios_loja WHERE user_id = auth.uid() AND role = 'super_admin'));

-- 5. Habilita Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE campanhas_automaticas;
