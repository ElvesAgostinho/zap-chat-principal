-- Fix the super_admin role for geral@topconsultores.pt
UPDATE auth.users
SET email_confirmed_at = coalesce(email_confirmed_at, NOW())
WHERE email = 'geral@topconsultores.pt';

UPDATE public.profiles
SET role = 'super_admin'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'geral@topconsultores.pt'
);
