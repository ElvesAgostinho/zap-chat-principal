CREATE TABLE IF NOT EXISTS public.automacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loja_id UUID NOT NULL,
    nome TEXT NOT NULL DEFAULT 'Nova Automação',
    ativo BOOLEAN NOT NULL DEFAULT false,
    trigger_type TEXT DEFAULT 'keyword',
    trigger_keyword TEXT,
    nodes JSONB DEFAULT '[]'::jsonb,
    edges JSONB DEFAULT '[]'::jsonb,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.automacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizadores podem ver automacoes da sua loja"
    ON public.automacoes FOR SELECT
    USING (
        loja_id IN (
            SELECT loja_id FROM public.usuarios_loja WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Utilizadores podem inserir automacoes na sua loja"
    ON public.automacoes FOR INSERT
    WITH CHECK (
        loja_id IN (
            SELECT loja_id FROM public.usuarios_loja WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Utilizadores podem atualizar automacoes da sua loja"
    ON public.automacoes FOR UPDATE
    USING (
        loja_id IN (
            SELECT loja_id FROM public.usuarios_loja WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Utilizadores podem apagar automacoes da sua loja"
    ON public.automacoes FOR DELETE
    USING (
        loja_id IN (
            SELECT loja_id FROM public.usuarios_loja WHERE user_id = auth.uid()
        )
    );
