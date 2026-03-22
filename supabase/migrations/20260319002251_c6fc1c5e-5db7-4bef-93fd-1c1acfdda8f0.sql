
-- 1. Super admins table (separate from usuarios_loja since they don't belong to a specific store)
CREATE TABLE public.super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text,
  email text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins read own" ON public.super_admins
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 2. Function to check super admin status
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = _user_id) $$;

-- 3. Planos table
CREATE TABLE public.planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  preco numeric NOT NULL DEFAULT 0,
  modulos text[] DEFAULT '{}',
  ativo boolean DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads active planos" ON public.planos FOR SELECT USING (true);
CREATE POLICY "Super admin manages planos" ON public.planos FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- Insert default plans
INSERT INTO public.planos (nome, slug, preco, modulos) VALUES
('Básico', 'basico', 15000, ARRAY['whatsapp', 'bot_simples', 'crm_leads', 'pipeline_basico']),
('Profissional', 'profissional', 30000, ARRAY['whatsapp', 'bot_inteligente', 'crm_leads', 'pipeline_refinado', 'vendas_externas', 'stock_realtime', 'envio_imagens']),
('Premium', 'premium', 50000, ARRAY['whatsapp', 'bot_inteligente', 'crm_leads', 'pipeline_refinado', 'vendas_externas', 'stock_realtime', 'envio_imagens', 'agendamento', 'multi_idioma', 'analytics', 'suporte_prioritario']);

-- 4. Assinaturas (subscriptions) table
CREATE TABLE public.assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  plano_id uuid NOT NULL REFERENCES public.planos(id),
  status text NOT NULL DEFAULT 'aguardando_pagamento',
  comprovativo_url text,
  notas text,
  aprovado_por uuid,
  data_aprovacao timestamptz,
  data_inicio timestamptz,
  data_fim timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owner reads own subscriptions" ON public.assinaturas
  FOR SELECT TO authenticated USING (loja_id = get_user_store_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Store owner inserts subscription" ON public.assinaturas
  FOR INSERT TO authenticated WITH CHECK (loja_id = get_user_store_id(auth.uid()));

CREATE POLICY "Super admin manages subscriptions" ON public.assinaturas
  FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

CREATE POLICY "Service insert assinaturas" ON public.assinaturas
  FOR INSERT TO public WITH CHECK (true);

-- 5. Add super_admin cross-store RLS policies to all existing tables
CREATE POLICY "Super admin all lojas" ON public.lojas FOR ALL TO authenticated USING (is_super_admin(auth.uid()));
CREATE POLICY "Super admin all leads" ON public.leads FOR ALL TO authenticated USING (is_super_admin(auth.uid()));
CREATE POLICY "Super admin all mensagens" ON public.mensagens FOR ALL TO authenticated USING (is_super_admin(auth.uid()));
CREATE POLICY "Super admin all vendas" ON public.vendas FOR ALL TO authenticated USING (is_super_admin(auth.uid()));
CREATE POLICY "Super admin all produtos" ON public.produtos FOR ALL TO authenticated USING (is_super_admin(auth.uid()));
CREATE POLICY "Super admin all campanhas" ON public.campanhas FOR ALL TO authenticated USING (is_super_admin(auth.uid()));
CREATE POLICY "Super admin all usuarios" ON public.usuarios_loja FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- 6. Storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('comprovativos', 'comprovativos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone uploads comprovativo" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'comprovativos');

CREATE POLICY "Anyone reads comprovativo" ON storage.objects
  FOR SELECT USING (bucket_id = 'comprovativos');
