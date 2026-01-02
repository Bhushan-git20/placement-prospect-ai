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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assessments: {
        Row: {
          areas_of_improvement: string[] | null
          assessment_date: string | null
          assessment_type: string
          company_focus: string | null
          correct_answers: number | null
          created_at: string | null
          difficulty_level: string | null
          feedback: string | null
          id: string
          recommendations: string[] | null
          score: number | null
          strengths: string[] | null
          student_id: string
          student_name: string
          test_category: string
          time_limit_minutes: number | null
          time_taken_minutes: number | null
          total_questions: number | null
          user_id: string | null
        }
        Insert: {
          areas_of_improvement?: string[] | null
          assessment_date?: string | null
          assessment_type: string
          company_focus?: string | null
          correct_answers?: number | null
          created_at?: string | null
          difficulty_level?: string | null
          feedback?: string | null
          id?: string
          recommendations?: string[] | null
          score?: number | null
          strengths?: string[] | null
          student_id: string
          student_name: string
          test_category: string
          time_limit_minutes?: number | null
          time_taken_minutes?: number | null
          total_questions?: number | null
          user_id?: string | null
        }
        Update: {
          areas_of_improvement?: string[] | null
          assessment_date?: string | null
          assessment_type?: string
          company_focus?: string | null
          correct_answers?: number | null
          created_at?: string | null
          difficulty_level?: string | null
          feedback?: string | null
          id?: string
          recommendations?: string[] | null
          score?: number | null
          strengths?: string[] | null
          student_id?: string
          student_name?: string
          test_category?: string
          time_limit_minutes?: number | null
          time_taken_minutes?: number | null
          total_questions?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      career_transitions: {
        Row: {
          avg_time_months: number | null
          created_at: string | null
          from_role: string
          id: string
          required_skills: string[] | null
          salary_change_percent: number | null
          sample_size: number | null
          success_rate: number | null
          to_role: string
          updated_at: string | null
        }
        Insert: {
          avg_time_months?: number | null
          created_at?: string | null
          from_role: string
          id?: string
          required_skills?: string[] | null
          salary_change_percent?: number | null
          sample_size?: number | null
          success_rate?: number | null
          to_role: string
          updated_at?: string | null
        }
        Update: {
          avg_time_months?: number | null
          created_at?: string | null
          from_role?: string
          id?: string
          required_skills?: string[] | null
          salary_change_percent?: number | null
          sample_size?: number | null
          success_rate?: number | null
          to_role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applied_date: string
          created_at: string
          id: string
          job_id: string
          notes: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          applied_date?: string
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          applied_date?: string
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      job_market_trends: {
        Row: {
          avg_salary: number | null
          created_at: string | null
          demand_score: number | null
          growth_rate: number | null
          id: string
          job_postings_count: number | null
          job_role: string | null
          month_year: string
          region: string | null
          skill_name: string | null
        }
        Insert: {
          avg_salary?: number | null
          created_at?: string | null
          demand_score?: number | null
          growth_rate?: number | null
          id?: string
          job_postings_count?: number | null
          job_role?: string | null
          month_year: string
          region?: string | null
          skill_name?: string | null
        }
        Update: {
          avg_salary?: number | null
          created_at?: string | null
          demand_score?: number | null
          growth_rate?: number | null
          id?: string
          job_postings_count?: number | null
          job_role?: string | null
          month_year?: string
          region?: string | null
          skill_name?: string | null
        }
        Relationships: []
      }
      job_postings: {
        Row: {
          application_deadline: string | null
          company: string
          created_at: string | null
          demand_score: number | null
          description: string | null
          experience_level: string
          id: string
          industry: string
          is_active: boolean | null
          job_type: string
          location: string
          posted_date: string | null
          preferred_skills: string[]
          required_skills: string[]
          salary_max: number | null
          salary_min: number | null
          source: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          application_deadline?: string | null
          company: string
          created_at?: string | null
          demand_score?: number | null
          description?: string | null
          experience_level: string
          id?: string
          industry: string
          is_active?: boolean | null
          job_type: string
          location: string
          posted_date?: string | null
          preferred_skills?: string[]
          required_skills?: string[]
          salary_max?: number | null
          salary_min?: number | null
          source?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          application_deadline?: string | null
          company?: string
          created_at?: string | null
          demand_score?: number | null
          description?: string | null
          experience_level?: string
          id?: string
          industry?: string
          is_active?: boolean | null
          job_type?: string
          location?: string
          posted_date?: string | null
          preferred_skills?: string[]
          required_skills?: string[]
          salary_max?: number | null
          salary_min?: number | null
          source?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string
          id: string
          new_role: Database["public"]["Enums"]["app_role"]
          old_role: Database["public"]["Enums"]["app_role"] | null
          target_user_id: string
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by: string
          id?: string
          new_role: Database["public"]["Enums"]["app_role"]
          old_role?: Database["public"]["Enums"]["app_role"] | null
          target_user_id: string
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string
          id?: string
          new_role?: Database["public"]["Enums"]["app_role"]
          old_role?: Database["public"]["Enums"]["app_role"] | null
          target_user_id?: string
        }
        Relationships: []
      }
      skill_analysis: {
        Row: {
          average_salary_impact: number | null
          category: string
          created_at: string | null
          current_demand: number | null
          growth_rate: number | null
          id: string
          industry_focus: string[] | null
          job_count: number | null
          last_updated: string | null
          predicted_demand: number | null
          skill_name: string
          trend: Database["public"]["Enums"]["skill_trend"] | null
        }
        Insert: {
          average_salary_impact?: number | null
          category: string
          created_at?: string | null
          current_demand?: number | null
          growth_rate?: number | null
          id?: string
          industry_focus?: string[] | null
          job_count?: number | null
          last_updated?: string | null
          predicted_demand?: number | null
          skill_name: string
          trend?: Database["public"]["Enums"]["skill_trend"] | null
        }
        Update: {
          average_salary_impact?: number | null
          category?: string
          created_at?: string | null
          current_demand?: number | null
          growth_rate?: number | null
          id?: string
          industry_focus?: string[] | null
          job_count?: number | null
          last_updated?: string | null
          predicted_demand?: number | null
          skill_name?: string
          trend?: Database["public"]["Enums"]["skill_trend"] | null
        }
        Relationships: []
      }
      skill_relationships: {
        Row: {
          created_at: string | null
          id: string
          relationship_type: string
          skill_from: string
          skill_to: string
          strength: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          relationship_type: string
          skill_from: string
          skill_to: string
          strength?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          relationship_type?: string
          skill_from?: string
          skill_to?: string
          strength?: number | null
        }
        Relationships: []
      }
      students: {
        Row: {
          cgpa: number | null
          created_at: string | null
          department: string
          email: string
          id: string
          last_analysis_date: string | null
          name: string
          package_lpa: number | null
          placed_company: string | null
          placed_role: string | null
          placement_readiness_score: number | null
          placement_status:
            | Database["public"]["Enums"]["placement_status"]
            | null
          preferred_locations: string[]
          preferred_roles: string[]
          recommendations: string[] | null
          resume_url: string | null
          skill_gaps: string[] | null
          skills: string[]
          strengths: string[] | null
          student_id: string
          target_companies: string[] | null
          university: string
          updated_at: string | null
          user_id: string | null
          year: number
        }
        Insert: {
          cgpa?: number | null
          created_at?: string | null
          department: string
          email: string
          id?: string
          last_analysis_date?: string | null
          name: string
          package_lpa?: number | null
          placed_company?: string | null
          placed_role?: string | null
          placement_readiness_score?: number | null
          placement_status?:
            | Database["public"]["Enums"]["placement_status"]
            | null
          preferred_locations?: string[]
          preferred_roles?: string[]
          recommendations?: string[] | null
          resume_url?: string | null
          skill_gaps?: string[] | null
          skills?: string[]
          strengths?: string[] | null
          student_id: string
          target_companies?: string[] | null
          university: string
          updated_at?: string | null
          user_id?: string | null
          year: number
        }
        Update: {
          cgpa?: number | null
          created_at?: string | null
          department?: string
          email?: string
          id?: string
          last_analysis_date?: string | null
          name?: string
          package_lpa?: number | null
          placed_company?: string | null
          placed_role?: string | null
          placement_readiness_score?: number | null
          placement_status?:
            | Database["public"]["Enums"]["placement_status"]
            | null
          preferred_locations?: string[]
          preferred_roles?: string[]
          recommendations?: string[] | null
          resume_url?: string | null
          skill_gaps?: string[] | null
          skills?: string[]
          strengths?: string[] | null
          student_id?: string
          target_companies?: string[] | null
          university?: string
          updated_at?: string | null
          user_id?: string | null
          year?: number
        }
        Relationships: []
      }
      user_career_journeys: {
        Row: {
          created_at: string | null
          from_role: string | null
          id: string
          skills_acquired: string[] | null
          student_id: string
          success_metrics: Json | null
          time_invested_months: number | null
          to_role: string
          transition_date: string
        }
        Insert: {
          created_at?: string | null
          from_role?: string | null
          id?: string
          skills_acquired?: string[] | null
          student_id: string
          success_metrics?: Json | null
          time_invested_months?: number | null
          to_role: string
          transition_date: string
        }
        Update: {
          created_at?: string | null
          from_role?: string | null
          id?: string
          skills_acquired?: string[] | null
          student_id?: string
          success_metrics?: Json | null
          time_invested_months?: number | null
          to_role?: string
          transition_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_career_journeys_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      can_view_salary: { Args: never; Returns: boolean }
      check_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      get_primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_email: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "faculty" | "recruiter" | "user"
      placement_status: "placed" | "in_process" | "not_placed"
      skill_trend: "Rising" | "Stable" | "Declining"
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
      app_role: ["admin", "faculty", "recruiter", "user"],
      placement_status: ["placed", "in_process", "not_placed"],
      skill_trend: ["Rising", "Stable", "Declining"],
    },
  },
} as const
