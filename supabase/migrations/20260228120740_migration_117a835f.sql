-- Пересоздаём функцию handle_new_user правильно
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Вставляем нового пользователя в public.users
  INSERT INTO public.users (
    id,
    email,
    full_name,
    phone,
    role,
    status,
    rating,
    experience_months,
    is_on_shift
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'courier', -- по умолчанию роль courier
    'active',
    5.0,
    0,
    false
  );

  -- Также вставляем в profiles для совместимости
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULL
  );

  RETURN NEW;
END;
$$;