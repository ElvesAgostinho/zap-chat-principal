-- Adicionar suporte a categorias e atributos flexíveis em produtos
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS atributos JSONB DEFAULT '{}'::jsonb;

-- Comentários para documentação
COMMENT ON COLUMN public.produtos.categoria IS 'Categoria do produto (ex: Calçados, Roupas)';
COMMENT ON COLUMN public.produtos.atributos IS 'Atributos dinâmicos do produto (ex: tamanho, cor, nº do sapato)';
