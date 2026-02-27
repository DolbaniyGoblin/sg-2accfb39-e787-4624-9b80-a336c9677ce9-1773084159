-- Создаём публичную политику SELECT для таблицы users
CREATE POLICY "Anyone can view user profiles"
ON public.users
FOR SELECT
USING (true);