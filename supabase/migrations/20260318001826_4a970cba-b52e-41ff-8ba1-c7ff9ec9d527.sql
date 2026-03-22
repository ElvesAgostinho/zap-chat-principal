
-- =============================================
-- VENDAZAP FULL DATABASE RESTRUCTURE
-- =============================================

-- 0. Drop old trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 1. Store code generator
CREATE OR REPLACE FUNCTION public.generate_store_code()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- 2. Create new tables
CREATE TABLE public.lojas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  owner_user_id uuid,
  codigo_unico text UNIQUE NOT NULL DEFAULT generate_store_code(),
  telefone text,
  endereco text,
  mensagem_boas_vindas text DEFAULT 'Olá! 👋 Bem-vindo! Como posso ajudar?',
  linguagem_bot text DEFAULT 'Amigável e informal, com emojis moderados',
  formas_pagamento text[] DEFAULT '{}',
  zonas_entrega text[] DEFAULT '{}',
  bot_ativo boolean DEFAULT true,
  instance_name text,
  instance_status text DEFAULT 'disconnected',
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.usuarios_loja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  loja_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE NOT NULL,
  nome text,
  role text NOT NULL DEFAULT 'funcionario',
  status text NOT NULL DEFAULT 'pendente',
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, loja_id)
);

CREATE TABLE public.leads_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  telefone text,
  email text,
  status text NOT NULL DEFAULT 'novo',
  fonte text DEFAULT 'whatsapp',
  interesse text,
  notas text,
  tags text[] DEFAULT '{}',
  controle_conversa text DEFAULT 'bot',
  precisa_humano boolean DEFAULT false,
  bot_enabled boolean DEFAULT true,
  id_thread text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads_new(id) ON DELETE SET NULL,
  lead_nome text,
  loja_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE NOT NULL,
  conteudo text NOT NULL,
  tipo text NOT NULL DEFAULT 'recebida',
  is_bot boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  preco numeric DEFAULT 0,
  imagem text,
  estoque integer DEFAULT 0,
  descricao text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads_new(id) ON DELETE SET NULL,
  loja_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE NOT NULL,
  funcionario_id uuid REFERENCES public.usuarios_loja(id) ON DELETE SET NULL,
  produto text,
  produto_imagem text,
  valor numeric DEFAULT 0,
  quantidade integer DEFAULT 1,
  status text NOT NULL DEFAULT 'pendente',
  cliente_nome text,
  cliente_telefone text,
  cliente_endereco text,
  entregador text,
  pagamento_status text DEFAULT 'pendente',
  status_entrega text DEFAULT 'pendente',
  observacoes text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.campanhas_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE NOT NULL,
  tipo text,
  conteudo text,
  produto_nome text,
  destinatarios integer DEFAULT 0,
  enviados integer DEFAULT 0,
  status_publicado boolean DEFAULT false,
  data_envio timestamptz DEFAULT now()
);

-- 3. Migrate data
INSERT INTO public.lojas (id, nome, owner_user_id, telefone, endereco, mensagem_boas_vindas, linguagem_bot, formas_pagamento, zonas_entrega, bot_ativo, criado_em)
SELECT id, name, owner_id, phone, address, welcome_message, bot_language,
  COALESCE(payment_methods, '{}'), COALESCE(delivery_zones, '{}'),
  COALESCE(bot_active, true), created_at
FROM public.stores
ON CONFLICT (id) DO NOTHING;

UPDATE public.lojas l SET
  instance_name = si.instance_name,
  instance_status = COALESCE(si.status, 'disconnected')
FROM public.store_instances si
WHERE si.store_id = l.id;

INSERT INTO public.usuarios_loja (user_id, loja_id, nome, role, status)
SELECT p.id, p.store_id, p.full_name,
  COALESCE((SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = p.id LIMIT 1), 'funcionario'),
  CASE WHEN p.status IS NULL OR p.status = 'pending' THEN 'pendente'
       WHEN p.status = 'approved' THEN 'aprovado'
       ELSE p.status END
FROM public.profiles p
WHERE p.store_id IS NOT NULL
ON CONFLICT (user_id, loja_id) DO NOTHING;

UPDATE public.usuarios_loja SET status = 'aprovado' WHERE role = 'admin';

INSERT INTO public.produtos (loja_id, nome, preco, imagem, estoque, descricao, criado_em)
SELECT store_id, COALESCE(nome, 'Sem nome'), COALESCE(valor, 0), image_url, COALESCE(stock, 0), description, created_at
FROM public.produto WHERE store_id IS NOT NULL;

INSERT INTO public.campanhas_new (loja_id, conteudo, produto_nome, destinatarios, enviados, status_publicado, data_envio)
SELECT store_id, message, product_name, COALESCE(recipients_count, 0), COALESCE(success_count, 0), COALESCE(status_published, false), created_at
FROM public.campaigns WHERE store_id IS NOT NULL;

-- 4. Drop old functions
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.log_action(text, text, text, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.update_overdue_payments() CASCADE;

-- 5. Drop old tables
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.connection_logs CASCADE;
DROP TABLE IF EXISTS public.store_config CASCADE;
DROP TABLE IF EXISTS public.store_instances CASCADE;
DROP TABLE IF EXISTS public.unresolved_bot_messages CASCADE;
DROP TABLE IF EXISTS public.bot_learning CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.pedidos CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.produto CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;

-- 6. Drop old types
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public."categorias de produtos" CASCADE;

-- 7. Rename tables
ALTER TABLE public.leads_new RENAME TO leads;
ALTER TABLE public.campanhas_new RENAME TO campanhas;

-- 8. New functions
CREATE OR REPLACE FUNCTION public.get_user_store_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT loja_id FROM public.usuarios_loja WHERE user_id = _user_id AND status = 'aprovado' LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.usuarios_loja WHERE user_id = _user_id AND status = 'aprovado' LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.usuarios_loja WHERE user_id = _user_id AND role = _role AND status = 'aprovado') $$;

-- 9. New auth trigger
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
    INSERT INTO public.lojas (nome, owner_user_id, telefone, endereco)
    VALUES (_store_name, NEW.id, _store_phone, _store_address)
    RETURNING id INTO _new_loja_id;
    INSERT INTO public.usuarios_loja (user_id, loja_id, nome, role, status)
    VALUES (NEW.id, _new_loja_id, _full_name, 'admin', 'aprovado');
  ELSIF _store_code IS NOT NULL AND _store_code <> '' THEN
    SELECT id INTO _found_loja_id FROM public.lojas WHERE codigo_unico = upper(trim(_store_code));
    IF _found_loja_id IS NOT NULL THEN
      INSERT INTO public.usuarios_loja (user_id, loja_id, nome, role, status)
      VALUES (NEW.id, _found_loja_id, _full_name, 'funcionario', 'pendente');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_vendazap();

-- 10. RLS
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages loja" ON public.lojas FOR ALL TO authenticated
USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "Members read loja" ON public.lojas FOR SELECT TO authenticated
USING (id = get_user_store_id(auth.uid()));

CREATE POLICY "Users read own" ON public.usuarios_loja FOR SELECT TO authenticated
USING (user_id = auth.uid() OR loja_id = get_user_store_id(auth.uid()));
CREATE POLICY "Admin manages users" ON public.usuarios_loja FOR UPDATE TO authenticated
USING (loja_id = get_user_store_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Service inserts" ON public.usuarios_loja FOR INSERT WITH CHECK (true);

CREATE POLICY "Store scoped leads" ON public.leads FOR ALL TO authenticated
USING (loja_id = get_user_store_id(auth.uid()));
CREATE POLICY "Service insert leads" ON public.leads FOR INSERT WITH CHECK (true);

CREATE POLICY "Store scoped mensagens" ON public.mensagens FOR ALL TO authenticated
USING (loja_id = get_user_store_id(auth.uid()));
CREATE POLICY "Service insert mensagens" ON public.mensagens FOR INSERT WITH CHECK (true);

CREATE POLICY "Store scoped produtos" ON public.produtos FOR ALL TO authenticated
USING (loja_id = get_user_store_id(auth.uid()));

CREATE POLICY "Store scoped vendas" ON public.vendas FOR ALL TO authenticated
USING (loja_id = get_user_store_id(auth.uid()));
CREATE POLICY "Service insert vendas" ON public.vendas FOR INSERT WITH CHECK (true);

CREATE POLICY "Store scoped campanhas" ON public.campanhas FOR ALL TO authenticated
USING (loja_id = get_user_store_id(auth.uid()));
