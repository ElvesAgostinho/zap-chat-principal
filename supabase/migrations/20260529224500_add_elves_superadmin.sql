-- Adiciona elvessacapuri57@gmail.com como super admin

DO $$
DECLARE
  _user_id uuid;
BEGIN
  -- Busca o ID do utilizador caso já tenha criado conta
  SELECT id INTO _user_id FROM auth.users WHERE email = 'elvessacapuri57@gmail.com';
  
  IF _user_id IS NOT NULL THEN
    -- Insere na tabela de super_admins
    INSERT INTO public.super_admins (user_id, email, nome) 
    VALUES (_user_id, 'elvessacapuri57@gmail.com', 'Elves Agostinho')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Atualiza o perfil para garantir acesso no frontend
    UPDATE public.profiles SET role = 'super_admin' WHERE user_id = _user_id;
  END IF;
END $$;
