
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  product_id bigint REFERENCES public.produto(id) ON DELETE SET NULL,
  product_name text,
  message text,
  recipients_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  status_published boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store scoped campaigns" ON public.campaigns
  FOR ALL
  TO public
  USING (store_id = get_user_store_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
