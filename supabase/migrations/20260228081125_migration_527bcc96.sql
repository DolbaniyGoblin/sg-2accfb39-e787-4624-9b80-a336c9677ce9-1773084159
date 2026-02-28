-- 1. Добавляем поле role в таблицу users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'courier';

-- 2. Создаём constraint для ролей
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('courier', 'dispatcher', 'admin'));

-- 3. Создаём таблицу delivery_points (справочник адресов)
CREATE TABLE IF NOT EXISTS delivery_points (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  address text NOT NULL,
  latitude double precision,
  longitude double precision,
  contact_name text,
  contact_phone text,
  notes text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. Добавляем поля в tasks для связи с диспетчером и точками доставки
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delivery_point_id uuid REFERENCES delivery_points(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority integer DEFAULT 1;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes text;

-- 5. RLS политики для delivery_points
ALTER TABLE delivery_points ENABLE ROW LEVEL SECURITY;

-- Все авторизованные могут видеть активные точки
CREATE POLICY "Anyone can view active delivery points" ON delivery_points
  FOR SELECT USING (is_active = true);

-- Только диспетчеры и админы могут добавлять точки
CREATE POLICY "Dispatchers and admins can insert delivery points" ON delivery_points
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('dispatcher', 'admin')
    )
  );

-- Только диспетчеры и админы могут обновлять точки
CREATE POLICY "Dispatchers and admins can update delivery points" ON delivery_points
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('dispatcher', 'admin')
    )
  );

-- Только админы могут удалять точки
CREATE POLICY "Admins can delete delivery points" ON delivery_points
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 6. Обновляем RLS политики для tasks (добавляем доступ для диспетчеров)
DROP POLICY IF EXISTS "Dispatchers and admins can view all tasks" ON tasks;
CREATE POLICY "Dispatchers and admins can view all tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('dispatcher', 'admin')
    )
  );

DROP POLICY IF EXISTS "Dispatchers and admins can create tasks" ON tasks;
CREATE POLICY "Dispatchers and admins can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('dispatcher', 'admin')
    )
  );

DROP POLICY IF EXISTS "Dispatchers and admins can update tasks" ON tasks;
CREATE POLICY "Dispatchers and admins can update tasks" ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('dispatcher', 'admin')
    )
  );

-- 7. Обновляем RLS политики для users (админы видят всех)
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all users" ON users;
CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- 8. Создаём индексы для производительности
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_delivery_point ON tasks(delivery_point_id);
CREATE INDEX IF NOT EXISTS idx_delivery_points_active ON delivery_points(is_active);

-- 9. Создаём функцию для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Создаём триггер для delivery_points
DROP TRIGGER IF EXISTS update_delivery_points_updated_at ON delivery_points;
CREATE TRIGGER update_delivery_points_updated_at 
  BEFORE UPDATE ON delivery_points 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();