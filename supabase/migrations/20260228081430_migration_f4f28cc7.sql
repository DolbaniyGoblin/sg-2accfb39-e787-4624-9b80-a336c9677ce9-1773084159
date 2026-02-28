-- 1. Добавляем поле status в таблицу users
ALTER TABLE users ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- 2. Исправляем tasks - приводим названия к единому виду
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'box_count') THEN
        ALTER TABLE tasks RENAME COLUMN boxes_count TO box_count;
    END IF;
END $$;

-- 3. Добавляем поле name в delivery_points
ALTER TABLE delivery_points ADD COLUMN IF NOT EXISTS name text;