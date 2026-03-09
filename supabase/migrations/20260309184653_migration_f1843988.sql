-- Create my_boxes table for current boxes carried by courier
CREATE TABLE IF NOT EXISTS my_boxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  courier_id UUID NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  box_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_transit',
  picked_up_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  CONSTRAINT my_boxes_status_check CHECK (status IN ('in_transit', 'delivered', 'problem'))
);

-- Enable RLS
ALTER TABLE my_boxes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Couriers can view own boxes"
  ON my_boxes FOR SELECT
  USING (auth.uid() = courier_id);

CREATE POLICY "Couriers can insert own boxes"
  ON my_boxes FOR INSERT
  WITH CHECK (auth.uid() = courier_id);

CREATE POLICY "Couriers can update own boxes"
  ON my_boxes FOR UPDATE
  USING (auth.uid() = courier_id);

CREATE POLICY "Couriers can delete own boxes"
  ON my_boxes FOR DELETE
  USING (auth.uid() = courier_id);

-- Create indexes
CREATE INDEX idx_my_boxes_courier_id ON my_boxes(courier_id);
CREATE INDEX idx_my_boxes_status ON my_boxes(status);

-- Add photo storage bucket for delivery photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-photos', 'delivery-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for delivery photos
CREATE POLICY "Couriers can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'delivery-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'delivery-photos');