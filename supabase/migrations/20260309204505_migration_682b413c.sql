-- Удаляем старую дублирующуюся политику
DROP POLICY IF EXISTS "Users can view their own data" ON users;

-- Проверяем, что осталась только правильная политика
SELECT policyname, cmd, qual 
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users' AND cmd = 'SELECT';