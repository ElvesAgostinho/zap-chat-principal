
CREATE OR REPLACE FUNCTION public.get_my_membership()
RETURNS TABLE(loja_id uuid, role text, status text, nome text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- First try approved membership (oldest first)
  -- If none, return the oldest membership of any status
  SELECT ul.loja_id, ul.role, ul.status, ul.nome
  FROM public.usuarios_loja ul
  WHERE ul.user_id = auth.uid()
  ORDER BY (ul.status = 'aprovado') DESC, ul.criado_em ASC
  LIMIT 1;
$$;
