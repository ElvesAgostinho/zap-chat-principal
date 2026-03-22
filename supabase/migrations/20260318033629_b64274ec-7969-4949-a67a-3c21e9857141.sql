CREATE POLICY "Users delete own record"
ON public.usuarios_loja
FOR DELETE
TO authenticated
USING (user_id = auth.uid());