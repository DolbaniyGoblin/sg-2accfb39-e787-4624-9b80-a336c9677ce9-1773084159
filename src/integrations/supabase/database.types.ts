/* eslint-disable @typescript-eslint/no-empty-object-type */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      deliveries: {
        Row: {
          courier_id: string | null
          delivered_at: string | null
          id: string
          notes: string | null
          photo_url: string | null
          task_id: string | null
        }
        Insert: {
          courier_id?: string | null
          delivered_at?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          task_id?: string | null
        }
        Update: {
          courier_id?: string | null
          delivered_at?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_points: {
        Row: {
          address: string
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string | null
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      location_history: {
        Row: {
          courier_id: string
          id: string
          latitude: number
          longitude: number
          speed: number | null
          timestamp: string | null
        }
        Insert: {
          courier_id: string
          id?: string
          latitude: number
          longitude: number
          speed?: number | null
          timestamp?: string | null
        }
        Update: {
          courier_id?: string
          id?: string
          latitude?: number
          longitude?: number
          speed?: number | null
          timestamp?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          courier_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          updated_at: string | null
        }
        Insert: {
          courier_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string | null
        }
        Update: {
          courier_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      route_history: {
        Row: {
          courier_id: string
          created_at: string | null
          estimated_time: number
          id: string
          is_best: boolean | null
          route_order: Json
          total_distance: number
        }
        Insert: {
          courier_id: string
          created_at?: string | null
          estimated_time: number
          id?: string
          is_best?: boolean | null
          route_order: Json
          total_distance: number
        }
        Update: {
          courier_id?: string
          created_at?: string | null
          estimated_time?: number
          id?: string
          is_best?: boolean | null
          route_order?: Json
          total_distance?: number
        }
        Relationships: []
      }
      saved_routes: {
        Row: {
          courier_id: string
          created_at: string | null
          estimated_duration: number | null
          id: string
          is_best: boolean | null
          route_order: string[]
          total_distance: number | null
        }
        Insert: {
          courier_id: string
          created_at?: string | null
          estimated_duration?: number | null
          id?: string
          is_best?: boolean | null
          route_order: string[]
          total_distance?: number | null
        }
        Update: {
          courier_id?: string
          created_at?: string | null
          estimated_duration?: number | null
          id?: string
          is_best?: boolean | null
          route_order?: string[]
          total_distance?: number | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          address: string
          box_count: number | null
          client_name: string
          client_phone: string | null
          courier_id: string | null
          created_at: string | null
          created_by: string | null
          delivery_point_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          priority: number | null
          scheduled_time: string | null
          status: string | null
          time_slot: string | null
        }
        Insert: {
          address: string
          box_count?: number | null
          client_name: string
          client_phone?: string | null
          courier_id?: string | null
          created_at?: string | null
          created_by?: string | null
          delivery_point_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          priority?: number | null
          scheduled_time?: string | null
          status?: string | null
          time_slot?: string | null
        }
        Update: {
          address?: string
          box_count?: number | null
          client_name?: string
          client_phone?: string | null
          courier_id?: string | null
          created_at?: string | null
          created_by?: string | null
          delivery_point_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          priority?: number | null
          scheduled_time?: string | null
          status?: string | null
          time_slot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_delivery_point_id_fkey"
            columns: ["delivery_point_id"]
            isOneToOne: false
            referencedRelation: "delivery_points"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          experience_months: number | null
          full_name: string | null
          id: string
          is_on_shift: boolean | null
          phone: string | null
          photo_url: string | null
          rating: number | null
          role: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          experience_months?: number | null
          full_name?: string | null
          id: string
          is_on_shift?: boolean | null
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          role?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          experience_months?: number | null
          full_name?: string | null
          id?: string
          is_on_shift?: boolean | null
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          role?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_reset_user_password: {
        Args: { new_password: string; user_email: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
