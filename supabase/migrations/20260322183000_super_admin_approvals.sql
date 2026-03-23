
-- Update handle_new_user_vendazap trigger to set 'admin' status as 'pendente'
-- This requires super_admin approval for new store admins/owners

CREATE OR REPLACE FUNCTION public.handle_new_user_vendazap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _role text; _store_name text; _store_phone text; _store_address text;
  _store_code text; _full_name text; _new_loja_id uuid; _found_loja_id uuid;
BEGIN
  _role := NEW.raw_user_meta_data ->> 'role';
  _full_name := NEW.raw_user_meta_data ->> 'full_name';
  _store_name := NEW.raw_user_meta_data ->> 'store_name';
  _store_phone := NEW.raw_user_meta_data ->> 'store_phone';
  _store_address := NEW.raw_user_meta_data ->> 'store_address';
  _store_code := NEW.raw_user_meta_data ->> 'store_code';

  IF _role = 'admin' AND _store_name IS NOT NULL AND _store_name <> '' THEN
    -- Admin (Owner) signup: create store and user in 'pendente' status
    -- They must be approved by a super_admin
    INSERT INTO public.lojas (nome, owner_user_id, telefone, endereco)
    VALUES (_store_name, NEW.id, _store_phone, _store_address)
    RETURNING id INTO _new_loja_id;
    
    INSERT INTO public.usuarios_loja (user_id, loja_id, nome, role, status)
    VALUES (NEW.id, _new_loja_id, _full_name, 'admin', 'pendente');
    
  ELSIF _store_code IS NOT NULL AND _store_code <> '' THEN
    -- Employee signup: join existing store in 'pendente' status
    -- They must be approved by the store admin
    SELECT id INTO _found_loja_id FROM public.lojas WHERE codigo_unico = upper(trim(_store_code));
    IF _found_loja_id IS NOT NULL THEN
      INSERT INTO public.usuarios_loja (user_id, loja_id, nome, role, status)
      VALUES (NEW.id, _found_loja_id, _full_name, 'funcionario', 'pendente');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Refine RLS for usuarios_loja to ensure clean separation of approval powers
-- 1. Super Admin manages everything
DROP POLICY IF EXISTS "Super admin all usuarios" ON public.usuarios_loja;
CREATE POLICY "Super admin all usuarios" ON public.usuarios_loja 
FOR ALL TO authenticated 
USING (is_super_admin(auth.uid()));

-- 2. Admins manage their own store's employees (but cannot approve other admins or themselves)
DROP POLICY IF EXISTS "Admin manages users" ON public.usuarios_loja;
CREATE POLICY "Admin manages users" ON public.usuarios_loja 
FOR UPDATE TO authenticated
USING (
    loja_id = get_user_store_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin')
    AND role = 'funcionario'
)
WITH CHECK (
    loja_id = get_user_store_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin')
    AND role = 'funcionario'
);
