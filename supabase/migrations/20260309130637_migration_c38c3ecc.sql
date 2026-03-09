-- Включаем pgcrypto в схеме auth (где находится таблица users)
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA auth;