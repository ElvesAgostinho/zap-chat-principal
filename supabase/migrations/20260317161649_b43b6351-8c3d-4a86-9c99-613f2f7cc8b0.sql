
-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own role"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Service can manage roles"
ON public.user_roles FOR ALL
USING (true)
WITH CHECK (true);

-- Create a store for the existing user
INSERT INTO public.stores (id, name, owner_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'Minha Loja', '63e87805-f05d-47fc-b96b-f38df10c28fa');

-- Create profile for the user
INSERT INTO public.profiles (id, full_name, store_id, status)
VALUES ('63e87805-f05d-47fc-b96b-f38df10c28fa', 'Elves Agostinho', '00000000-0000-0000-0000-000000000001', 'approved');

-- Create admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('63e87805-f05d-47fc-b96b-f38df10c28fa', 'admin');

-- Fix all null store_ids
UPDATE public.messages SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.usuarios SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.store_instances SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;

-- Also set handle_new_user_vendazap trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created_vendazap
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_vendazap();
