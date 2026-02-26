-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (Couriers)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  photo_url TEXT,
  rating NUMERIC DEFAULT 5.0,
  experience_months INTEGER DEFAULT 0,
  is_on_shift BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  courier_id UUID REFERENCES users(id),
  client_name TEXT NOT NULL,
  client_phone TEXT,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  boxes_count INTEGER,
  time_slot TEXT CHECK (time_slot IN ('morning', 'day', 'evening')),
  scheduled_time TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'on_location', 'delivered', 'problem')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couriers can view assigned tasks" ON tasks FOR SELECT USING (auth.uid() = courier_id);
CREATE POLICY "Couriers can update assigned tasks" ON tasks FOR UPDATE USING (auth.uid() = courier_id);

-- 3. Deliveries table (History)
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  courier_id UUID REFERENCES users(id),
  photo_url TEXT,
  notes TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couriers can view own deliveries" ON deliveries FOR SELECT USING (auth.uid() = courier_id);
CREATE POLICY "Couriers can insert own deliveries" ON deliveries FOR INSERT WITH CHECK (auth.uid() = courier_id);

-- 4. Locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  courier_id UUID REFERENCES users(id),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couriers can manage own location" ON locations FOR ALL USING (auth.uid() = courier_id);

-- Storage bucket for delivery photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('delivery-photos', 'delivery-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload delivery photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'delivery-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view delivery photos" ON storage.objects
FOR SELECT USING (bucket_id = 'delivery-photos');