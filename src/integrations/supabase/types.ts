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
      content: {
        Row: {
          content: string
          content_id: string
          created_at: string | null
          id: string
          level_number: number
          quote_index: number
        }
        Insert: {
          content: string
          content_id: string
          created_at?: string | null
          id?: string
          level_number: number
          quote_index: number
        }
        Update: {
          content?: string
          content_id?: string
          created_at?: string | null
          id?: string
          level_number?: number
          quote_index?: number
        }
        Relationships: []
      }
      custom_panels: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          panel_type: string
          position: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          panel_type: string
          position: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          panel_type?: string
          position?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      game_levels: {
        Row: {
          accuracy_threshold: number
          created_at: string
          id: string
          level_number: number
          max_attempts: number
          required_quotes: number
          updated_at: string
          wpm_threshold_multiplier: number
        }
        Insert: {
          accuracy_threshold: number
          created_at?: string
          id?: string
          level_number: number
          max_attempts?: number
          required_quotes: number
          updated_at?: string
          wpm_threshold_multiplier: number
        }
        Update: {
          accuracy_threshold?: number
          created_at?: string
          id?: string
          level_number?: number
          max_attempts?: number
          required_quotes?: number
          updated_at?: string
          wpm_threshold_multiplier?: number
        }
        Relationships: []
      }
      game_progress: {
        Row: {
          baseline_wpm: number | null
          completed_quotes: string[]
          created_at: string
          current_level: number
          current_quote_index: number
          id: string
          level_attempts_used: number
          level_best_wpm: number
          successful_quotes_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          baseline_wpm?: number | null
          completed_quotes?: string[]
          created_at?: string
          current_level?: number
          current_quote_index?: number
          id?: string
          level_attempts_used?: number
          level_best_wpm?: number
          successful_quotes_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          baseline_wpm?: number | null
          completed_quotes?: string[]
          created_at?: string
          current_level?: number
          current_quote_index?: number
          id?: string
          level_attempts_used?: number
          level_best_wpm?: number
          successful_quotes_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      level_completion_logs: {
        Row: {
          baseline_wpm: number
          completed_at: string
          id: string
          level_best_wpm: number
          level_number: number
          next_level_number: number | null
          next_level_threshold: number | null
          user_id: string
        }
        Insert: {
          baseline_wpm: number
          completed_at?: string
          id?: string
          level_best_wpm: number
          level_number: number
          next_level_number?: number | null
          next_level_threshold?: number | null
          user_id: string
        }
        Update: {
          baseline_wpm?: number
          completed_at?: string
          id?: string
          level_best_wpm?: number
          level_number?: number
          next_level_number?: number | null
          next_level_threshold?: number | null
          user_id?: string
        }
        Relationships: []
      }
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
          total_characters: number | null
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
          total_characters?: number | null
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
          total_characters?: number | null
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
        Insert: {
          avg_accuracy?: number | null
          avg_wpm?: number | null
          best_wpm?: number | null
          content?: string | null
          id?: string | null
          quote_index?: number | null
          script_id?: string | null
          typed_count?: number | null
          unique_typers_count?: number | null
        }
        Update: {
          avg_accuracy?: number | null
          avg_wpm?: number | null
          best_wpm?: number | null
          content?: string | null
          id?: string | null
          quote_index?: number | null
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
      increment: {
        Args: { row_id: string; table_name: string; column_name: string }
        Returns: undefined
      }
      migrate_script_content_to_quotes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      populate_content_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
