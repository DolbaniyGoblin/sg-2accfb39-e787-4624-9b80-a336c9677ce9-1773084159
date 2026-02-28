-- Добавляем недостающие колонки в таблицу users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS experience_months INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_on_shift BOOLEAN DEFAULT FALSE;

-- Обновляем кэш схемы
NOTIFY pgrst, 'reload schema';