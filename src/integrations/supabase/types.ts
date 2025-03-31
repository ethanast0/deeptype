export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      saved_scripts: {
        Row: {
          created_at: string | null
          script_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          script_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          script_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_scripts_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "script_views"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_scripts_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      script_quotes: {
        Row: {
          avg_accuracy: number | null
          avg_wpm: number | null
          best_wpm: number | null
          content: string
          id: string
          quote_index: number
          script_id: string | null
          typed_count: number | null
          unique_typers_count: number | null
        }
        Insert: {
          avg_accuracy?: number | null
          avg_wpm?: number | null
          best_wpm?: number | null
          content: string
          id?: string
          quote_index: number
          script_id?: string | null
          typed_count?: number | null
          unique_typers_count?: number | null
        }
        Update: {
          avg_accuracy?: number | null
          avg_wpm?: number | null
          best_wpm?: number | null
          content?: string
          id?: string
          quote_index?: number
          script_id?: string | null
          typed_count?: number | null
          unique_typers_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "script_quotes_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "script_views"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_quotes_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      scripts: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          is_featured: boolean | null
          name: string
          saves_count: number | null
          typed_count: number | null
          unique_typers_count: number | null
          user_id: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          name: string
          saves_count?: number | null
          typed_count?: number | null
          unique_typers_count?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          name?: string
          saves_count?: number | null
          typed_count?: number | null
          unique_typers_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      typing_history: {
        Row: {
          accuracy: number
          created_at: string | null
          elapsed_time: number
          id: string
          quote_id: string | null
          script_id: string | null
          user_id: string | null
          wpm: number
        }
        Insert: {
          accuracy: number
          created_at?: string | null
          elapsed_time: number
          id?: string
          quote_id?: string | null
          script_id?: string | null
          user_id?: string | null
          wpm: number
        }
        Update: {
          accuracy?: number
          created_at?: string | null
          elapsed_time?: number
          id?: string
          quote_id?: string | null
          script_id?: string | null
          user_id?: string | null
          wpm?: number
        }
        Relationships: [
          {
            foreignKeyName: "typing_history_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_views"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_history_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "script_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_history_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "script_views"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_history_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          password_hash: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          password_hash?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          password_hash?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      quote_views: {
        Row: {
          avg_accuracy: number | null
          avg_wpm: number | null
          best_wpm: number | null
          content: string | null
          id: string | null
          quote_index: number | null
          script_id: string | null
          typed_count: number | null
          unique_typers_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "script_quotes_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "script_views"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_quotes_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      script_views: {
        Row: {
          avg_accuracy: number | null
          avg_wpm: number | null
          best_wpm: number | null
          category: string | null
          id: string | null
          is_featured: boolean | null
          name: string | null
          saves_count: number | null
          typed_count: number | null
          unique_typers_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
