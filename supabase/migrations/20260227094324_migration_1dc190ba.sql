-- Создание таблицы истории маршрутов
CREATE TABLE IF NOT EXISTS route_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  courier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_order JSONB NOT NULL,
  total_distance FLOAT NOT NULL,
  estimated_time FLOAT NOT NULL,
  is_best BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включение RLS для route_history
ALTER TABLE route_history ENABLE ROW LEVEL SECURITY;

-- Политики для route_history
CREATE POLICY "Users can view their own route history" 
  ON route_history FOR SELECT USING (auth.uid() = courier_id);

CREATE POLICY "Users can insert their own route history" 
  ON route_history FOR INSERT WITH CHECK (auth.uid() = courier_id);

CREATE POLICY "Users can update their own route history" 
  ON route_history FOR UPDATE USING (auth.uid() = courier_id);


-- Создание таблицы истории перемещений
CREATE TABLE IF NOT EXISTS location_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  courier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  speed FLOAT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включение RLS для location_history
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;

-- Политики для location_history
CREATE POLICY "Users can view their own location history" 
  ON location_history FOR SELECT USING (auth.uid() = courier_id);

CREATE POLICY "Users can insert their own location history" 
  ON location_history FOR INSERT WITH CHECK (auth.uid() = courier_id);

-- Индекс для ускорения выборок по времени
CREATE INDEX IF NOT EXISTS idx_location_history_courier_timestamp 
  ON location_history(courier_id, timestamp);