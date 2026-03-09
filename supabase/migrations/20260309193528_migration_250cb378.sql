-- Drop incorrect triggers
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON public.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;

-- Create correct trigger on auth.users table
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();