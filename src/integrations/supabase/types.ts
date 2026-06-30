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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          address_id: string | null
          address_text: string | null
          client_id: string
          comments: string | null
          created_at: string
          digicode: string | null
          end_at: string
          id: string
          mode: Database["public"]["Enums"]["booking_mode"]
          phone: string | null
          price: number
          pro_id: string
          service_id: string | null
          service_name: string
          start_at: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          address_id?: string | null
          address_text?: string | null
          client_id: string
          comments?: string | null
          created_at?: string
          digicode?: string | null
          end_at: string
          id?: string
          mode?: Database["public"]["Enums"]["booking_mode"]
          phone?: string | null
          price: number
          pro_id: string
          service_id?: string | null
          service_name: string
          start_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          address_id?: string | null
          address_text?: string | null
          client_id?: string
          comments?: string | null
          created_at?: string
          digicode?: string | null
          end_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["booking_mode"]
          phone?: string | null
          price?: number
          pro_id?: string
          service_id?: string | null
          service_name?: string
          start_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "client_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "pro_services"
            referencedColumns: ["id"]
          },
        ]
      }
      client_addresses: {
        Row: {
          address: string
          created_at: string
          id: string
          is_primary: boolean
          kind: Database["public"]["Enums"]["address_kind"]
          label: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          is_primary?: boolean
          kind?: Database["public"]["Enums"]["address_kind"]
          label: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          kind?: Database["public"]["Enums"]["address_kind"]
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          client_id: string
          created_at: string
          id: string
          pro_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          pro_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          pro_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          pro_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          pro_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          pro_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_services: {
        Row: {
          active: boolean
          created_at: string
          duration_min: number
          id: string
          name: string
          position: number
          price: number
          pro_id: string
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          duration_min: number
          id?: string
          name: string
          position?: number
          price: number
          pro_id: string
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          duration_min?: number
          id?: string
          name?: string
          position?: number
          price?: number
          pro_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_services_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_activity_blocks: {
        Row: {
          active: boolean
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          label: string | null
          location_id: string | null
          pro_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          label?: string | null
          location_id?: string | null
          pro_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          label?: string | null
          location_id?: string | null
          pro_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_activity_blocks_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "pro_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_activity_blocks_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_locations: {
        Row: {
          active: boolean
          address: string
          city: string
          created_at: string
          id: string
          is_primary: boolean
          is_private: boolean
          name: string
          postal_code: string
          pro_id: string
          travel_fee_fixed: number
          travel_fee_free_until_km: number
          travel_fee_per_km: number
          travel_fee_type: string
          travel_radius_km: number
          travel_time_max_min: number
          type: "home" | "salon" | "coworking" | "video"
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string
          city?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          is_private?: boolean
          name?: string
          postal_code?: string
          pro_id: string
          travel_fee_fixed?: number
          travel_fee_free_until_km?: number
          travel_fee_per_km?: number
          travel_fee_type?: string
          travel_radius_km?: number
          travel_time_max_min?: number
          type?: "home" | "salon" | "coworking" | "video"
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string
          city?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          is_private?: boolean
          name?: string
          postal_code?: string
          pro_id?: string
          travel_fee_fixed?: number
          travel_fee_free_until_km?: number
          travel_fee_per_km?: number
          travel_fee_type?: string
          travel_radius_km?: number
          travel_time_max_min?: number
          type?: "home" | "salon" | "coworking" | "video"
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_locations_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pros: {
        Row: {
          at_home: boolean
          availability: string
          avatar_url: string | null
          bio: string | null
          category: string
          created_at: string
          distance_km: number
          experience_years: number
          id: string
          job: string
          map_x: number
          map_y: number
          modes: Database["public"]["Enums"]["booking_mode"][]
          name: string
          rating: number
          reviews_count: number
          slug: string
          specialty: string | null
          starting_price: number
          updated_at: string
          user_id: string | null
          verified: boolean
        }
        Insert: {
          at_home?: boolean
          availability?: string
          avatar_url?: string | null
          bio?: string | null
          category: string
          created_at?: string
          distance_km?: number
          experience_years?: number
          id?: string
          job: string
          map_x?: number
          map_y?: number
          modes?: Database["public"]["Enums"]["booking_mode"][]
          name: string
          rating?: number
          reviews_count?: number
          slug: string
          specialty?: string | null
          starting_price?: number
          updated_at?: string
          user_id?: string | null
          verified?: boolean
        }
        Update: {
          at_home?: boolean
          availability?: string
          avatar_url?: string | null
          bio?: string | null
          category?: string
          created_at?: string
          distance_km?: number
          experience_years?: number
          id?: string
          job?: string
          map_x?: number
          map_y?: number
          modes?: Database["public"]["Enums"]["booking_mode"][]
          name?: string
          rating?: number
          reviews_count?: number
          slug?: string
          specialty?: string | null
          starting_price?: number
          updated_at?: string
          user_id?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          client_id: string
          comment: string | null
          created_at: string
          id: string
          pro_id: string
          rating: number
        }
        Insert: {
          booking_id?: string | null
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          pro_id: string
          rating: number
        }
        Update: {
          booking_id?: string | null
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          pro_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      address_kind: "home" | "hotel" | "office" | "custom"
      app_role: "client" | "pro" | "admin"
      booking_mode: "home" | "studio" | "video"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
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
    Enums: {
      address_kind: ["home", "hotel", "office", "custom"],
      app_role: ["client", "pro", "admin"],
      booking_mode: ["home", "studio", "video"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
    },
  },
} as const
