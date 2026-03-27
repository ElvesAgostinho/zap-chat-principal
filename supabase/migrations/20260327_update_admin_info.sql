-- 20260327_update_admin_info.sql
-- Adiciona colunas de contacto à tabela de utilizadores e atualiza o trigger

-- 1. Adicionar colunas se não existirem
ALTER TABLE public.usuarios_loja 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS telefone text;

-- 2. Atualizar a função de Trigger para capturar dados automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user_vendazap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _role text; _store_name text; _store_phone text; _store_address text;
  _store_code text; _full_name text; _new_loja_id uuid; _found_loja_id uuid;
  _user_email text;
BEGIN
  _role := NEW.raw_user_meta_data ->> 'role';
  _full_name := NEW.raw_user_meta_data ->> 'full_name';
  _store_name := NEW.raw_user_meta_data ->> 'store_name';
  _store_phone := NEW.raw_user_meta_data ->> 'store_phone';
  _store_address := NEW.raw_user_meta_data ->> 'store_address';
  _store_code := NEW.raw_user_meta_data ->> 'store_code';
  _user_email := NEW.email; -- Captura o email direto do auth.users

  -- Priorizar o telefone do metadados
  IF _store_phone IS NULL OR _store_phone = '' THEN
    _store_phone := NEW.raw_user_meta_data ->> 'phone';
  END IF;

  IF _role = 'admin' AND _store_name IS NOT NULL AND _store_name <> '' THEN
    -- Criar loja e utilizador admin
    INSERT INTO public.lojas (nome, owner_user_id, telefone, endereco)
    VALUES (_store_name, NEW.id, _store_phone, _store_address)
    RETURNING id INTO _new_loja_id;
    
    INSERT INTO public.usuarios_loja (user_id, loja_id, nome, role, status, email, telefone)
    VALUES (NEW.id, _new_loja_id, _full_name, 'admin', 'pendente', _user_email, _store_phone);
    
  ELSIF _store_code IS NOT NULL AND _store_code <> '' THEN
    -- Registo de funcionário
    SELECT id INTO _found_loja_id FROM public.lojas WHERE codigo_unico = upper(trim(_store_code));
    IF _found_loja_id IS NOT NULL THEN
      INSERT INTO public.usuarios_loja (user_id, loja_id, nome, role, status, email, telefone)
      VALUES (NEW.id, _found_loja_id, _full_name, 'funcionario', 'pendente', _user_email, _store_phone);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Script Retroativo: Preencher os dados dos utilizadores existentes a partir do auth.users
-- Isto ajudará o Super Admin a ver os e-mails e telefones dos admins actuais
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT id, raw_user_meta_data, email FROM auth.users) LOOP
        UPDATE public.usuarios_loja 
        SET 
            email = r.email,
            telefone = COALESCE(
              r.raw_user_meta_data->>'store_phone', 
              r.raw_user_meta_data->>'phone', 
              r.raw_user_meta_data->>'telefone'
            )
        WHERE user_id = r.id AND (email IS NULL OR telefone IS NULL);
    END LOOP;
END;
$$;
