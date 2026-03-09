-- Добавляем недостающие колонки в таблицу users
ALTER TABLE users ADD COLUMN photo_url TEXT;
ALTER TABLE users ADD COLUMN rating NUMERIC DEFAULT 5.0;
ALTER TABLE users ADD COLUMN experience_months INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN is_on_shift BOOLEAN DEFAULT false;

-- Принудительно обновляем схему PostgREST
NOTIFY pgrst, 'reload schema';