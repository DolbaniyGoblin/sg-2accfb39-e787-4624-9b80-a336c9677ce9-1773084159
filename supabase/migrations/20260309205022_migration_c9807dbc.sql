-- Удаляем таблицу полностью
DROP TABLE IF EXISTS users CASCADE;

-- Создаём таблицу БЕЗ foreign key constraint
CREATE TABLE users (
  id UUID PRIMARY KEY,  -- Простой PRIMARY KEY без REFERENCES
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'courier' CHECK (role IN ('admin', 'dispatcher', 'courier')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включаем RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Создаём RLS политики
CREATE POLICY "Allow users to read own data and admins to read all"
  ON users FOR SELECT
  USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Allow users to update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow insert for authenticated users"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Даём права доступа
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- Вставляем запись администратора
INSERT INTO users (id, email, full_name, role, status)
VALUES (
  'e507857e-1c8c-4985-bbf8-be1d094a2107',
  'admin@courierpro.ru',
  'Admin',
  'admin',
  'active'
);

-- Обновляем схему PostgREST
NOTIFY pgrst, 'reload schema';