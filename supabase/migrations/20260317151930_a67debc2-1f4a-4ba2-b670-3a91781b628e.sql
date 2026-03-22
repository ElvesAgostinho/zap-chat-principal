
-- 1. Create stores table
CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  welcome_message text DEFAULT 'Olá! 👋 Bem-vindo! Como posso ajudar?',
  bot_language text DEFAULT 'Amigável e informal, com emojis moderados',
  payment_methods text[] DEFAULT '{}',
  delivery_zones text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create store_instances table (WhatsApp instances)
CREATE TABLE IF NOT EXISTS public.store_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  instance_name text NOT NULL UNIQUE,
  status text DEFAULT 'disconnected', -- disconnected, connecting, connected
  phone_number text,
  session_data jsonb,
  last_connected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Add store_id to existing tables
ALTER TABLE public.produto ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.bot_learning ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.unresolved_bot_messages ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;

-- 5. RLS on new tables
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Helper function: get user's store_id
CREATE OR REPLACE FUNCTION public.get_user_store_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- 7. RLS policies for profiles
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- 8. RLS policies for stores
CREATE POLICY "Admins can manage all stores" ON public.stores
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Store owners can read own store" ON public.stores
  FOR SELECT USING (id = public.get_user_store_id(auth.uid()));

-- 9. RLS policies for store_instances
CREATE POLICY "Admins can manage all instances" ON public.store_instances
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Store users can manage own instances" ON public.store_instances
  FOR ALL USING (store_id = public.get_user_store_id(auth.uid()));

-- 10. Update RLS on existing tables to scope by store_id
-- produto
DROP POLICY IF EXISTS "Allow public read on produto" ON public.produto;
DROP POLICY IF EXISTS "Allow public all on produto" ON public.produto;
CREATE POLICY "Store scoped read produto" ON public.produto
  FOR SELECT USING (store_id = public.get_user_store_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Store scoped write produto" ON public.produto
  FOR ALL USING (store_id = public.get_user_store_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- pedidos
DROP POLICY IF EXISTS "Allow public read on pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Allow public all on pedidos" ON public.pedidos;
CREATE POLICY "Store scoped read pedidos" ON public.pedidos
  FOR SELECT USING (store_id = public.get_user_store_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Store scoped write pedidos" ON public.pedidos
  FOR ALL USING (store_id = public.get_user_store_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- usuarios
DROP POLICY IF EXISTS "Allow public read on usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Allow public all on usuarios" ON public.usuarios;
CREATE POLICY "Store scoped read usuarios" ON public.usuarios
  FOR SELECT USING (store_id = public.get_user_store_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Store scoped write usuarios" ON public.usuarios
  FOR ALL USING (store_id = public.get_user_store_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- leads
DROP POLICY IF EXISTS "Allow public read on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public insert on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public update on leads" ON public.leads;
CREATE POLICY "Store scoped leads" ON public.leads
  FOR ALL USING (store_id = public.get_user_store_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- messages
DROP POLICY IF EXISTS "Allow public read on messages" ON public.messages;
DROP POLICY IF EXISTS "Allow public insert on messages" ON public.messages;
CREATE POLICY "Store scoped messages" ON public.messages
  FOR ALL USING (store_id = public.get_user_store_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- bot_learning
DROP POLICY IF EXISTS "Allow public read on bot_learning" ON public.bot_learning;
DROP POLICY IF EXISTS "Allow public insert on bot_learning" ON public.bot_learning;
DROP POLICY IF EXISTS "Allow public update on bot_learning" ON public.bot_learning;
CREATE POLICY "Store scoped bot_learning" ON public.bot_learning
  FOR ALL USING (store_id = public.get_user_store_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- unresolved_bot_messages
DROP POLICY IF EXISTS "Allow public read on unresolved_bot_messages" ON public.unresolved_bot_messages;
DROP POLICY IF EXISTS "Allow public insert on unresolved_bot_messages" ON public.unresolved_bot_messages;
DROP POLICY IF EXISTS "Allow public update on unresolved_bot_messages" ON public.unresolved_bot_messages;
CREATE POLICY "Store scoped unresolved_bot_messages" ON public.unresolved_bot_messages
  FOR ALL USING (store_id = public.get_user_store_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- store_config
DROP POLICY IF EXISTS "Allow public read on store_config" ON public.store_config;
DROP POLICY IF EXISTS "Allow public insert on store_config" ON public.store_config;
DROP POLICY IF EXISTS "Allow public update on store_config" ON public.store_config;
CREATE POLICY "Store scoped store_config" ON public.store_config
  FOR ALL USING (store_id = public.get_user_store_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- 11. Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_vendazap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created_vendazap ON auth.users;
CREATE TRIGGER on_auth_user_created_vendazap
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_vendazap();
