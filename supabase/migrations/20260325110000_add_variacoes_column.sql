-- Adicionar coluna de variações à tabela de produtos
-- Esta coluna suporta o novo sistema de variações (cor, tamanho, etc.)
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS variacoes JSONB DEFAULT '[]'::jsonb;

-- Comentário para documentação
COMMENT ON COLUMN public.produtos.variacoes IS 'Lista de variações do produto (cor, tamanho, estoque, preco, imagem)';

-- Garantir que a coluna atributos também exista (caso alguma migração anterior tenha falhado)
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS atributos JSONB DEFAULT '{}'::jsonb;

-- Atualizar RLS para garantir que o acesso continue correto
-- (A política existente "Store scoped produtos" já cobre ALL operations para usuários autenticados da loja)
