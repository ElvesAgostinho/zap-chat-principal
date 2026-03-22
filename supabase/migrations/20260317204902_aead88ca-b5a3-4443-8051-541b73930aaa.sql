
-- Remove the old handle_new_user function that references non-existent columns (signup_ip, signup_location, schools)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Ensure the correct VendaZap trigger is active on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_vendazap();
