-- Шаг 1: Удаляем все старые RLS политики
DROP POLICY IF EXISTS "Allow users to read own data and admins to read all" ON users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow users to update own data" ON users;

-- Шаг 2: Создаём новые политики с правильной функцией auth.uid()
CREATE POLICY "users_select_policy" ON users
  FOR SELECT
  USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Шаг 3: Выдаём явные права доступа для ролей anon и authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON users TO anon, authenticated;

-- Шаг 4: Принудительно обновляем схему PostgREST
NOTIFY pgrst, 'reload schema';