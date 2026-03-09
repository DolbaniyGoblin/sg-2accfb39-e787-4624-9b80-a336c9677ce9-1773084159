-- Шаг 1: Сохраняем ТОЛЬКО критические данные администратора
CREATE TEMP TABLE users_backup AS
SELECT id, email, full_name, role, status 
FROM users 
WHERE id = 'e507857e-1c8c-4985-bbf8-be1d094a2107';

-- Шаг 2: Удаляем старую таблицу users
DROP TABLE IF EXISTS users CASCADE;