-- Таблица истории перемещений (для отрисовки следа)
CREATE TABLE IF NOT EXISTS location_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  courier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица сохранённых маршрутов
CREATE TABLE IF NOT EXISTS saved_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  courier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  route_order UUID[] NOT NULL, -- Массив ID задач в нужном порядке
  total_distance DOUBLE PRECISION,
  estimated_duration DOUBLE PRECISION,
  is_best BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Политики
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_routes ENABLE ROW LEVEL SECURITY;

-- Политики для location_history
DROP POLICY IF EXISTS "Users can manage their own history" ON location_history;
CREATE POLICY "Users can manage their own history" ON location_history
  FOR ALL USING (auth.uid() = courier_id);

DROP POLICY IF EXISTS "Dispatchers can view all history" ON location_history;
CREATE POLICY "Dispatchers can view all history" ON location_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('dispatcher', 'admin'))
  );

-- Политики для saved_routes
DROP POLICY IF EXISTS "Users can manage their own routes" ON saved_routes;
CREATE POLICY "Users can manage their own routes" ON saved_routes
  FOR ALL USING (auth.uid() = courier_id);