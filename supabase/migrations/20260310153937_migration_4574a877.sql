-- 1. Создаём запись для существующего admin пользователя
INSERT INTO users (id, email, full_name, role, status, rating, experience_months, is_on_shift)
VALUES (
  'e507857e-1c8c-4985-bbf8-be1d094a2107',
  'admin@courierpro.ru',
  'Администратор',
  'admin',
  'active',
  5.0,
  0,
  false
)
ON CONFLICT (id) DO UPDATE
SET 
  role = 'admin',
  full_name = 'Администратор',
  status = 'active';

-- 2. Создаём функцию для автоматического создания пользователя
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Пользователь'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'courier'),
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Создаём триггер на таблицу auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();