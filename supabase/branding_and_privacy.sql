-- 1. Adicionar a coluna slug se não existir
ALTER TABLE public.lojas ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Função para gerar slug a partir de texto
CREATE OR REPLACE FUNCTION public.slugify(value text) 
RETURNS text AS $$
BEGIN
  RETURN lower(regexp_replace(
    regexp_replace(
      value,
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  ));
END;
$$ LANGUAGE plpgsql;

-- 3. Atualizar o trigger de criação de loja para preencher o slug automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user_vendazap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _role text; _store_name text; _store_phone text; _store_address text;
  _store_code text; _full_name text; _new_loja_id uuid; _found_loja_id uuid;
  _slug text;
BEGIN
  _role := NEW.raw_user_meta_data ->> 'role';
  _full_name := NEW.raw_user_meta_data ->> 'full_name';
  _store_name := NEW.raw_user_meta_data ->> 'store_name';
  _store_phone := NEW.raw_user_meta_data ->> 'store_phone';
  _store_address := NEW.raw_user_meta_data ->> 'store_address';
  _store_code := NEW.raw_user_meta_data ->> 'store_code';

  IF _role = 'admin' AND _store_name IS NOT NULL AND _store_name <> '' THEN
    -- Gerar slug a partir do nome
    _slug := public.slugify(_store_name);
    
    -- Garantir unicidade (adicionar sufixo aleatório se o slug já existir)
    IF EXISTS (SELECT 1 FROM public.lojas WHERE slug = _slug) THEN
      _slug := _slug || '-' || lower(substring(replace(gen_random_uuid()::text, '-', ''), 1, 4));
    END IF;

    -- Criar loja com slug
    INSERT INTO public.lojas (nome, owner_user_id, telefone, endereco, slug)
    VALUES (_store_name, NEW.id, _store_phone, _store_address, _slug)
    RETURNING id INTO _new_loja_id;
    
    INSERT INTO public.usuarios_loja (user_id, loja_id, nome, role, status)
    VALUES (NEW.id, _new_loja_id, _full_name, 'admin', 'pendente');
    
  ELSIF _store_code IS NOT NULL AND _store_code <> '' THEN
    -- Signup de funcionário
    SELECT id INTO _found_loja_id FROM public.lojas WHERE codigo_unico = upper(trim(_store_code));
    IF _found_loja_id IS NOT NULL THEN
      INSERT INTO public.usuarios_loja (user_id, loja_id, nome, role, status)
      VALUES (NEW.id, _found_loja_id, _full_name, 'funcionario', 'pendente');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Popular slugs para lojas existentes (baseado no nome, não no código)
UPDATE public.lojas SET slug = public.slugify(nome) WHERE slug IS NULL;
-- Resolver duplicados se houver
UPDATE public.lojas l1 
SET slug = slug || '-' || lower(substring(codigo_unico, 1, 3))
FROM public.lojas l2
WHERE l1.id <> l2.id AND l1.slug = l2.slug AND l1.slug IS NOT NULL;
