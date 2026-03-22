-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Add the embedding column to the produtos table
-- 1536 is the dimension size for OpenAI's text-embedding-3-small and text-embedding-ada-002
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS produtos_embedding_idx ON produtos USING hnsw (embedding vector_cosine_ops);

-- Create or replace the match_produtos function
CREATE OR REPLACE FUNCTION match_produtos (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_loja_id uuid
)
RETURNS TABLE (
  id uuid,
  loja_id uuid,
  nome text,
  preco numeric,
  imagem text,
  estoque integer,
  categoria text,
  atributos jsonb,
  descricao text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    produtos.id,
    produtos.loja_id,
    produtos.nome,
    produtos.preco,
    produtos.imagem,
    produtos.estoque,
    produtos.categoria,
    produtos.atributos,
    produtos.descricao,
    1 - (produtos.embedding <=> query_embedding) AS similarity
  FROM produtos
  WHERE produtos.loja_id = p_loja_id
  AND produtos.embedding IS NOT NULL
  AND produtos.estoque > 0
  AND 1 - (produtos.embedding <=> query_embedding) > match_threshold
  ORDER BY produtos.embedding <=> query_embedding
  LIMIT match_count;
$$;
