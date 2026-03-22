
-- Create connection_logs table for detailed WhatsApp connection logging
CREATE TABLE public.connection_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  instance_name text NOT NULL,
  event text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_connection_logs_instance ON public.connection_logs(instance_name, timestamp DESC);
CREATE INDEX idx_connection_logs_store ON public.connection_logs(store_id, timestamp DESC);

-- Enable RLS
ALTER TABLE public.connection_logs ENABLE ROW LEVEL SECURITY;

-- Admins can see all logs
CREATE POLICY "Admins can manage all connection_logs"
ON public.connection_logs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Store users can see their own logs
CREATE POLICY "Store users can read own connection_logs"
ON public.connection_logs FOR SELECT
USING (store_id = get_user_store_id(auth.uid()));

-- Service role insert (edge functions use service role)
CREATE POLICY "Service can insert connection_logs"
ON public.connection_logs FOR INSERT
WITH CHECK (true);
