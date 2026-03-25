-- Adicionar coluna slug na tabela lojas se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pf_get_column_info('public', 'lojas', 'slug')) THEN
        ALTER TABLE public.lojas ADD COLUMN slug TEXT UNIQUE;
    END IF;
END $$;

-- Tentar usar uma função mais comum se a acima falhar ou não for suportada
-- (dependendo do ambiente Supabase)
ALTER TABLE public.lojas ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Popular slugs vazios com o código único como fallback inicial
UPDATE public.lojas SET slug = codigo_unico WHERE slug IS NULL;
