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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_type: string
          created_at: string
          event_id: string | null
          file_url: string | null
          id: string
          issued_on: string | null
          participant_id: string | null
          serial_number: string | null
          updated_at: string
        }
        Insert: {
          certificate_type?: string
          created_at?: string
          event_id?: string | null
          file_url?: string | null
          id?: string
          issued_on?: string | null
          participant_id?: string | null
          serial_number?: string | null
          updated_at?: string
        }
        Update: {
          certificate_type?: string
          created_at?: string
          event_id?: string | null
          file_url?: string | null
          id?: string
          issued_on?: string | null
          participant_id?: string | null
          serial_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rounds: {
        Row: {
          allow_answer_change: boolean
          allow_backward_navigation: boolean
          created_at: string
          created_by: string | null
          duration_minutes: number
          event_id: string
          id: string
          instructions: string | null
          name: string
          negative_marking: number
          question_count: number
          result_visibility: Database["public"]["Enums"]["result_visibility"]
          round_order: number
          round_type: string | null
          status: Database["public"]["Enums"]["round_status"]
          total_marks: number
          updated_at: string
        }
        Insert: {
          allow_answer_change?: boolean
          allow_backward_navigation?: boolean
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          event_id: string
          id?: string
          instructions?: string | null
          name: string
          negative_marking?: number
          question_count?: number
          result_visibility?: Database["public"]["Enums"]["result_visibility"]
          round_order?: number
          round_type?: string | null
          status?: Database["public"]["Enums"]["round_status"]
          total_marks?: number
          updated_at?: string
        }
        Update: {
          allow_answer_change?: boolean
          allow_backward_navigation?: boolean
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          event_id?: string
          id?: string
          instructions?: string | null
          name?: string
          negative_marking?: number
          question_count?: number
          result_visibility?: Database["public"]["Enums"]["result_visibility"]
          round_order?: number
          round_type?: string | null
          status?: Database["public"]["Enums"]["round_status"]
          total_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rounds_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string | null
          event_date: string
          event_mode: Database["public"]["Enums"]["event_mode"]
          id: string
          name: string
          online_platform: string | null
          registration_closes_at: string | null
          registration_opens_at: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
          venue: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          event_mode?: Database["public"]["Enums"]["event_mode"]
          id?: string
          name: string
          online_platform?: string | null
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          venue?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_mode?: Database["public"]["Enums"]["event_mode"]
          id?: string
          name?: string
          online_platform?: string | null
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      logistics_items: {
        Row: {
          category: string | null
          created_at: string
          event_id: string | null
          id: string
          item_name: string
          notes: string | null
          quantity: number
          status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          item_name: string
          notes?: string | null
          quantity?: number
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          item_name?: string
          notes?: string | null
          quantity?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "logistics_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          college: string | null
          created_at: string
          email: string | null
          event_id: string | null
          full_name: string
          id: string
          phone: string | null
          status: Database["public"]["Enums"]["registration_status"]
          updated_at: string
          user_id: string | null
          year_of_study: string | null
        }
        Insert: {
          college?: string | null
          created_at?: string
          email?: string | null
          event_id?: string | null
          full_name: string
          id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
          user_id?: string | null
          year_of_study?: string | null
        }
        Update: {
          college?: string | null
          created_at?: string
          email?: string | null
          event_id?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
          user_id?: string | null
          year_of_study?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          institution: string | null
          phone: string | null
          updated_at: string
          year_of_study: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          institution?: string | null
          phone?: string | null
          updated_at?: string
          year_of_study?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          institution?: string | null
          phone?: string | null
          updated_at?: string
          year_of_study?: string | null
        }
        Relationships: []
      }
      question_reviews: {
        Row: {
          comments: string | null
          created_at: string
          id: string
          question_id: string
          reviewer_id: string | null
          verdict: Database["public"]["Enums"]["review_verdict"]
          version_number: number
        }
        Insert: {
          comments?: string | null
          created_at?: string
          id?: string
          question_id: string
          reviewer_id?: string | null
          verdict: Database["public"]["Enums"]["review_verdict"]
          version_number?: number
        }
        Update: {
          comments?: string | null
          created_at?: string
          id?: string
          question_id?: string
          reviewer_id?: string | null
          verdict?: Database["public"]["Enums"]["review_verdict"]
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_reviews_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_usage: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          question_id: string
          recorded_by: string | null
          round_id: string | null
          used_at: string
          version_number: number | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          question_id: string
          recorded_by?: string | null
          round_id?: string | null
          used_at?: string
          version_number?: number | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          question_id?: string
          recorded_by?: string | null
          round_id?: string | null
          used_at?: string
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "question_usage_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_usage_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_usage_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "event_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      question_versions: {
        Row: {
          change_note: string | null
          changed_by: string | null
          created_at: string
          id: string
          question_id: string
          snapshot: Json
          status: Database["public"]["Enums"]["question_status"]
          version_number: number
        }
        Insert: {
          change_note?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          question_id: string
          snapshot: Json
          status: Database["public"]["Enums"]["question_status"]
          version_number: number
        }
        Update: {
          change_note?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          question_id?: string
          snapshot?: Json
          status?: Database["public"]["Enums"]["question_status"]
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_versions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_answer: string | null
          correct_answers: Json
          created_at: string
          created_by: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          event_id: string | null
          explanation: string | null
          id: string
          negative_marks: number
          options: Json
          points: number
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          reviewed_at: string | null
          reviewed_by: string | null
          round_id: string | null
          source_reference: string | null
          status: Database["public"]["Enums"]["question_status"]
          subject: string | null
          subject_id: string | null
          submitted_at: string | null
          subtopic_id: string | null
          tags: string[]
          topic_id: string | null
          updated_at: string
          updated_by: string | null
          version_number: number
        }
        Insert: {
          correct_answer?: string | null
          correct_answers?: Json
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          event_id?: string | null
          explanation?: string | null
          id?: string
          negative_marks?: number
          options?: Json
          points?: number
          question_text: string
          question_type?: Database["public"]["Enums"]["question_type"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          round_id?: string | null
          source_reference?: string | null
          status?: Database["public"]["Enums"]["question_status"]
          subject?: string | null
          subject_id?: string | null
          submitted_at?: string | null
          subtopic_id?: string | null
          tags?: string[]
          topic_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version_number?: number
        }
        Update: {
          correct_answer?: string | null
          correct_answers?: Json
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          event_id?: string | null
          explanation?: string | null
          id?: string
          negative_marks?: number
          options?: Json
          points?: number
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          round_id?: string | null
          source_reference?: string | null
          status?: Database["public"]["Enums"]["question_status"]
          subject?: string | null
          subject_id?: string | null
          submitted_at?: string | null
          subtopic_id?: string | null
          tags?: string[]
          topic_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "event_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          created_at: string
          event_id: string
          id: string
          participant_id: string | null
          points: number
          recorded_by: string | null
          round_id: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          participant_id?: string | null
          points?: number
          recorded_by?: string | null
          round_id?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          participant_id?: string | null
          points?: number
          recorded_by?: string | null
          round_id?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "event_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string
          created_by: string | null
          division: Database["public"]["Enums"]["academic_division"]
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          division?: Database["public"]["Enums"]["academic_division"]
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          division?: Database["public"]["Enums"]["academic_division"]
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          is_captain: boolean
          participant_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_captain?: boolean
          participant_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_captain?: boolean
          participant_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          name: string
          team_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          name: string
          team_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          name?: string
          team_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          parent_topic_id: string | null
          sort_order: number
          subject_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_topic_id?: string | null
          sort_order?: number
          subject_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_topic_id?: string | null
          sort_order?: number
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_parent_topic_id_fkey"
            columns: ["parent_topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
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
      volunteers: {
        Row: {
          contact: string | null
          created_at: string
          duty: string | null
          event_id: string | null
          full_name: string
          id: string
          shift: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          contact?: string | null
          created_at?: string
          duty?: string | null
          event_id?: string | null
          full_name: string
          id?: string
          shift?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          contact?: string | null
          created_at?: string
          duty?: string | null
          event_id?: string | null
          full_name?: string
          id?: string
          shift?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_question_bank: { Args: { _user_id: string }; Returns: boolean }
      can_author_questions: { Args: { _user_id: string }; Returns: boolean }
      can_review_division: {
        Args: {
          _division: Database["public"]["Enums"]["academic_division"]
          _user_id: string
        }
        Returns: boolean
      }
      can_review_question: {
        Args: { _question_id: string; _user_id: string }
        Returns: boolean
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_organiser: { Args: { _user_id: string }; Returns: boolean }
      is_senior_leadership: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      academic_division: "PRE_CLINICAL" | "PARA_CLINICAL" | "CLINICAL" | "OTHER"
      app_role:
        | "SUPER_ADMIN"
        | "ADMIN"
        | "IT_LOGISTICS_HEAD"
        | "QUESTION_SETTER"
        | "QUESTION_REVIEWER"
        | "QUIZMASTER"
        | "SCOREKEEPER"
        | "VOLUNTEER"
        | "PARTICIPANT"
        | "PRESIDENT"
        | "VICE_PRESIDENT"
        | "CREATIVE_HEAD"
        | "PRE_CLINICAL_HEAD"
        | "PARA_CLINICAL_HEAD"
        | "CLINICAL_HEAD"
        | "FOUNDER"
      difficulty_level: "EASY" | "MEDIUM" | "HARD"
      event_mode: "ONLINE" | "OFFLINE"
      event_status:
        | "DRAFT"
        | "REGISTRATION_OPEN"
        | "REGISTRATION_CLOSED"
        | "LIVE"
        | "COMPLETED"
        | "ARCHIVED"
      question_status:
        | "DRAFT"
        | "SUBMITTED"
        | "UNDER_REVIEW"
        | "APPROVED"
        | "REJECTED"
        | "CHANGES_REQUESTED"
        | "ARCHIVED"
      question_type:
        | "MCQ"
        | "TRUE_FALSE"
        | "SHORT_ANSWER"
        | "IMAGE_BASED"
        | "BUZZER"
        | "MULTI_MCQ"
      registration_status: "PENDING" | "CONFIRMED" | "WAITLISTED" | "CANCELLED"
      result_visibility: "IMMEDIATE" | "AFTER_EVENT"
      review_verdict:
        | "APPROVED"
        | "REJECTED"
        | "NEEDS_REVISION"
        | "CHANGES_REQUESTED"
      round_status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
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
      academic_division: ["PRE_CLINICAL", "PARA_CLINICAL", "CLINICAL", "OTHER"],
      app_role: [
        "SUPER_ADMIN",
        "ADMIN",
        "IT_LOGISTICS_HEAD",
        "QUESTION_SETTER",
        "QUESTION_REVIEWER",
        "QUIZMASTER",
        "SCOREKEEPER",
        "VOLUNTEER",
        "PARTICIPANT",
        "PRESIDENT",
        "VICE_PRESIDENT",
        "CREATIVE_HEAD",
        "PRE_CLINICAL_HEAD",
        "PARA_CLINICAL_HEAD",
        "CLINICAL_HEAD",
        "FOUNDER",
      ],
      difficulty_level: ["EASY", "MEDIUM", "HARD"],
      event_mode: ["ONLINE", "OFFLINE"],
      event_status: [
        "DRAFT",
        "REGISTRATION_OPEN",
        "REGISTRATION_CLOSED",
        "LIVE",
        "COMPLETED",
        "ARCHIVED",
      ],
      question_status: [
        "DRAFT",
        "SUBMITTED",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        "CHANGES_REQUESTED",
        "ARCHIVED",
      ],
      question_type: [
        "MCQ",
        "TRUE_FALSE",
        "SHORT_ANSWER",
        "IMAGE_BASED",
        "BUZZER",
        "MULTI_MCQ",
      ],
      registration_status: ["PENDING", "CONFIRMED", "WAITLISTED", "CANCELLED"],
      result_visibility: ["IMMEDIATE", "AFTER_EVENT"],
      review_verdict: [
        "APPROVED",
        "REJECTED",
        "NEEDS_REVISION",
        "CHANGES_REQUESTED",
      ],
      round_status: ["DRAFT", "PUBLISHED", "ARCHIVED"],
    },
  },
} as const
