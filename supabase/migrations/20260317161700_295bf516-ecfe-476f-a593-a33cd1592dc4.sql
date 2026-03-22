
-- Fix overly permissive policy on user_roles
DROP POLICY "Service can manage roles" ON public.user_roles;

-- Only admins can manage roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
