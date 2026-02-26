import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string;
          photo_url: string | null;
          rating: number;
          experience_months: number;
          is_on_shift: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      tasks: {
        Row: {
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
        };
        Insert: Omit<Database["public"]["Tables"]["tasks"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };
      deliveries: {
        Row: {
          id: string;
          task_id: string;
          courier_id: string;
          photo_url: string | null;
          notes: string | null;
          delivered_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["deliveries"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["deliveries"]["Insert"]>;
      };
      locations: {
        Row: {
          id: string;
          courier_id: string;
          latitude: number;
          longitude: number;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["locations"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["locations"]["Insert"]>;
      };
    };
  };
};