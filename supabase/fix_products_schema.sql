-- 1. Adicionar colunas necessárias para o Catálogo Enterprise (SHEIN Style)
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS variacoes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS atributos JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS custo_unitario NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Geral';

-- 2. Comentário descritivo para as colunas
COMMENT ON COLUMN public.produtos.variacoes IS 'Array de objetos: [{cor, tamanho, estoque, preco, imagem}]';
COMMENT ON COLUMN public.produtos.categoria IS 'Categoria do produto para filtragem no catálogo';

-- 3. Habilitar RLS (caso não esteja) e garantir permissões
-- Se já existir RLS, isto apenas reforça que autenticados podem inserir
-- ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
