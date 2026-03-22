CREATE OR REPLACE FUNCTION public.handle_new_user_vendazap()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    IF NOT EXISTS (SELECT 1 FROM public.usuarios_loja WHERE user_id = NEW.id) THEN
      INSERT INTO public.lojas (nome, owner_user_id, telefone, endereco)
      VALUES (_store_name, NEW.id, _store_phone, _store_address)
      RETURNING id INTO _new_loja_id;
      
      INSERT INTO public.usuarios_loja (user_id, loja_id, nome, role, status)
      VALUES (NEW.id, _new_loja_id, _full_name, 'admin', 'aprovado')
      ON CONFLICT (user_id, loja_id) DO NOTHING;
    END IF;
  ELSIF _store_code IS NOT NULL AND _store_code <> '' THEN
    SELECT id INTO _found_loja_id FROM public.lojas WHERE codigo_unico = upper(trim(_store_code));
    IF _found_loja_id IS NOT NULL THEN
      INSERT INTO public.usuarios_loja (user_id, loja_id, nome, role, status)
      VALUES (NEW.id, _found_loja_id, _full_name, 'funcionario', 'pendente')
      ON CONFLICT (user_id, loja_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;