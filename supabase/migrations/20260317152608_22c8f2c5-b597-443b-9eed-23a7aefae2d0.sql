
-- Update the trigger to handle role-based signup
CREATE OR REPLACE FUNCTION public.handle_new_user_vendazap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
  _store_name text;
  _store_phone text;
  _store_address text;
  _new_store_id uuid;
BEGIN
  _role := NEW.raw_user_meta_data ->> 'role';
  _store_name := NEW.raw_user_meta_data ->> 'store_name';
  _store_phone := NEW.raw_user_meta_data ->> 'store_phone';
  _store_address := NEW.raw_user_meta_data ->> 'store_address';

  IF _role = 'admin' AND _store_name IS NOT NULL AND _store_name <> '' THEN
    -- Admin: create store + profile linked to store + admin role
    INSERT INTO public.stores (name, phone, address, owner_id)
    VALUES (_store_name, _store_phone, _store_address, NEW.id)
    RETURNING id INTO _new_store_id;

    INSERT INTO public.profiles (id, full_name, store_id)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', _new_store_id);

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');

  ELSE
    -- Employee: profile without store (pending approval), no role yet
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  END IF;

  RETURN NEW;
END;
$$;

-- Add status to profiles for approval flow
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Allow admins to read all profiles (for approval)
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Allow insert on profiles for trigger (service role)
CREATE POLICY "Service can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);
