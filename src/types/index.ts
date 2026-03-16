export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  photo_url: string | null;
  role: "courier" | "dispatcher" | "admin";
  status: "active" | "blocked";
  rating: number;
  experience_months: number;
  is_on_shift: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  courier_id: string;
  client_name: string;
  client_phone: string;
  address: string;
  latitude: number;
  longitude: number;
  boxes_count: number;
  time_slot: "morning" | "day" | "evening";
  scheduled_time: string;
  status: "pending" | "in_progress" | "on_location" | "delivered" | "problem";
  created_at: string;
  completed_at?: string;
  priority?: number;
  photo_url?: string;
  comment?: string;
}

export interface Delivery {
  id: string;
  task_id: string;
  courier_id: string;
  photo_url: string | null;
  notes: string | null;
  delivered_at: string;
}

export interface CourierLocation {
  id: string;
  courier_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
}

export interface DashboardStats {
  deliveredToday: number;
  totalTasksToday: number;
  earnedToday: number;
  kmToday: number;
}