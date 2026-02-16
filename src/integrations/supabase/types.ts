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
      categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      complaint_attachments: {
        Row: {
          complaint_id: string
          content_type: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          uploaded_by: string
        }
        Insert: {
          complaint_id: string
          content_type?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          uploaded_by: string
        }
        Update: {
          complaint_id?: string
          content_type?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_attachments_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          actual_resolution: string | null
          assigned_to: string | null
          category: string
          closure_approval: boolean | null
          contact_number: string
          created_at: string
          current_stage: number
          department: string | null
          description: string
          expected_resolution: string | null
          flow_type: string | null
          id: string
          priority: string
          remarks: string | null
          reported_by: string
          reported_by_name: string
          sent_back_from_stage: number | null
          sent_back_from_status: string | null
          status: string
          store: string
          sub_category: string | null
          updated_at: string
        }
        Insert: {
          actual_resolution?: string | null
          assigned_to?: string | null
          category: string
          closure_approval?: boolean | null
          contact_number: string
          created_at?: string
          current_stage?: number
          department?: string | null
          description: string
          expected_resolution?: string | null
          flow_type?: string | null
          id: string
          priority?: string
          remarks?: string | null
          reported_by: string
          reported_by_name: string
          sent_back_from_stage?: number | null
          sent_back_from_status?: string | null
          status?: string
          store: string
          sub_category?: string | null
          updated_at?: string
        }
        Update: {
          actual_resolution?: string | null
          assigned_to?: string | null
          category?: string
          closure_approval?: boolean | null
          contact_number?: string
          created_at?: string
          current_stage?: number
          department?: string | null
          description?: string
          expected_resolution?: string | null
          flow_type?: string | null
          id?: string
          priority?: string
          remarks?: string | null
          reported_by?: string
          reported_by_name?: string
          sent_back_from_stage?: number | null
          sent_back_from_status?: string | null
          status?: string
          store?: string
          sub_category?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      department_contacts: {
        Row: {
          created_at: string
          department: string
          email: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          department: string
          email: string
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string
          department?: string
          email?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          complaint_id: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          complaint_id?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          complaint_id?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          contact_number: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          store: string | null
          updated_at: string
        }
        Insert: {
          contact_number?: string | null
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id: string
          store?: string | null
          updated_at?: string
        }
        Update: {
          contact_number?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          store?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          active: boolean
          city: string | null
          code: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          region_id: string | null
        }
        Insert: {
          active?: boolean
          city?: string | null
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          region_id?: string | null
        }
        Update: {
          active?: boolean
          city?: string | null
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          region_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
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
      workflow_actions: {
        Row: {
          action: string
          actor_id: string
          actor_name: string | null
          complaint_id: string
          created_at: string
          id: string
          notes: string | null
          stage: number
        }
        Insert: {
          action: string
          actor_id: string
          actor_name?: string | null
          complaint_id: string
          created_at?: string
          id?: string
          notes?: string | null
          stage: number
        }
        Update: {
          action?: string
          actor_id?: string
          actor_name?: string | null
          complaint_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          stage?: number
        }
        Relationships: [
          {
            foreignKeyName: "workflow_actions_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_complaint_id: { Args: never; Returns: string }
      get_user_store: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "local_user"
        | "store_manager"
        | "store_coordinator"
        | "maintenance_coordinator"
        | "regional_manager"
        | "maintenance_manager"
        | "admin_manager"
        | "quality_verification"
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
      app_role: [
        "admin",
        "local_user",
        "store_manager",
        "store_coordinator",
        "maintenance_coordinator",
        "regional_manager",
        "maintenance_manager",
        "admin_manager",
        "quality_verification",
      ],
    },
  },
} as const
