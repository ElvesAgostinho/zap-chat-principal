-- Migration: Add Super Admin RLS to Notificacoes
-- Author: Antigravity AI
-- Date: 2026-03-25

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super admin can view all notifications') THEN
    CREATE POLICY "Super admin can view all notifications" 
    ON notificacoes FOR ALL 
    TO authenticated
    USING (is_super_admin(auth.uid()));
  END IF;
END $$;
