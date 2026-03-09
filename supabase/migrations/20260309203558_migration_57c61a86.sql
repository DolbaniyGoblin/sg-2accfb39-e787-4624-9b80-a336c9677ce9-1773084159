-- Удаляем ВСЕ существующие политики SELECT для users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;

-- Создаём ОДНУ универсальную политику для чтения
CREATE POLICY "Allow users to read own data and admins to read all"
  ON users
  FOR SELECT
  USING (
    auth.uid() = id  -- Пользователь может читать свой профиль
    OR
    EXISTS (         -- Или это администратор
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );