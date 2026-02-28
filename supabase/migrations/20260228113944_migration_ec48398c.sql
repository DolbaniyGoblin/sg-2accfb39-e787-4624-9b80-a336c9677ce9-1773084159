-- Шаг 2: Удаляем таблицу users (это обновит кэш Supabase)
DROP TABLE IF EXISTS public.users CASCADE;