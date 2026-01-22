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
      academic_periods: {
        Row: {
          academic_year: string
          created_at: string
          created_by: string
          end_date: string
          id: string
          is_active: boolean
          name: string
          semester: number
          start_date: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          created_by: string
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          semester: number
          start_date: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          created_by?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          semester?: number
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_question_submissions: {
        Row: {
          answers: Json
          assignment_id: string
          feedback: string | null
          graded: boolean
          id: string
          score: number | null
          student_id: string
          submitted_at: string
        }
        Insert: {
          answers?: Json
          assignment_id: string
          feedback?: string | null
          graded?: boolean
          id?: string
          score?: number | null
          student_id: string
          submitted_at?: string
        }
        Update: {
          answers?: Json
          assignment_id?: string
          feedback?: string | null
          graded?: boolean
          id?: string
          score?: number | null
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_question_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_questions: {
        Row: {
          assignment_id: string
          correct_answer: number | null
          correct_answers: number[] | null
          created_at: string
          id: string
          options: Json | null
          order_index: number
          points: number
          question: string
          type: string
        }
        Insert: {
          assignment_id: string
          correct_answer?: number | null
          correct_answers?: number[] | null
          created_at?: string
          id?: string
          options?: Json | null
          order_index?: number
          points?: number
          question: string
          type: string
        }
        Update: {
          assignment_id?: string
          correct_answer?: number | null
          correct_answers?: number[] | null
          created_at?: string
          id?: string
          options?: Json | null
          order_index?: number
          points?: number
          question?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_questions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          feedback: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          graded: boolean
          graded_at: string | null
          graded_by: string | null
          id: string
          is_late: boolean
          rubric_scores: Json | null
          score: number | null
          student_id: string
          submitted_at: string
          text_content: string | null
        }
        Insert: {
          assignment_id: string
          feedback?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          graded?: boolean
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_late?: boolean
          rubric_scores?: Json | null
          score?: number | null
          student_id: string
          submitted_at?: string
          text_content?: string | null
        }
        Update: {
          assignment_id?: string
          feedback?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          graded?: boolean
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_late?: boolean
          rubric_scores?: Json | null
          score?: number | null
          student_id?: string
          submitted_at?: string
          text_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          allow_late_submissions: boolean
          allowed_file_types: string[] | null
          archived: boolean
          assignment_type: string | null
          course_id: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          instructions: string | null
          kkm: number | null
          late_penalty_percent: number | null
          max_file_size_mb: number | null
          max_points: number
          risk_below_kkm_severity: string | null
          risk_late_severity: string | null
          risk_missed_severity: string | null
          risk_on_below_kkm: boolean
          risk_on_late: boolean
          risk_on_missed: boolean
          rubric: Json | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          allow_late_submissions?: boolean
          allowed_file_types?: string[] | null
          archived?: boolean
          assignment_type?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          instructions?: string | null
          kkm?: number | null
          late_penalty_percent?: number | null
          max_file_size_mb?: number | null
          max_points?: number
          risk_below_kkm_severity?: string | null
          risk_late_severity?: string | null
          risk_missed_severity?: string | null
          risk_on_below_kkm?: boolean
          risk_on_late?: boolean
          risk_on_missed?: boolean
          rubric?: Json | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          allow_late_submissions?: boolean
          allowed_file_types?: string[] | null
          archived?: boolean
          assignment_type?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          instructions?: string | null
          kkm?: number | null
          late_penalty_percent?: number | null
          max_file_size_mb?: number | null
          max_points?: number
          risk_below_kkm_severity?: string | null
          risk_late_severity?: string | null
          risk_missed_severity?: string | null
          risk_on_below_kkm?: boolean
          risk_on_late?: boolean
          risk_on_missed?: boolean
          rubric?: Json | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          description: string | null
          icon: string
          id: string
          is_preset: boolean
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_preset?: boolean
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_preset?: boolean
          name?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          course_id: string | null
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          event_date: string
          event_type?: string
          id?: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_materials: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          status: string
          teacher_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          teacher_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          teacher_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          student_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          student_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_submissions: {
        Row: {
          answers: Json
          exam_id: string
          graded: boolean
          id: string
          score: number | null
          student_id: string
          submitted_at: string
        }
        Insert: {
          answers?: Json
          exam_id: string
          graded?: boolean
          id?: string
          score?: number | null
          student_id: string
          submitted_at?: string
        }
        Update: {
          answers?: Json
          exam_id?: string
          graded?: boolean
          id?: string
          score?: number | null
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_submissions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          archived: boolean
          course_id: string
          created_at: string
          description: string | null
          duration: number
          end_date: string | null
          id: string
          kkm: number | null
          risk_below_kkm_severity: string | null
          risk_missed_severity: string | null
          risk_on_below_kkm: boolean
          risk_on_missed: boolean
          start_date: string | null
          status: string
          title: string
          total_points: number
          updated_at: string
        }
        Insert: {
          archived?: boolean
          course_id: string
          created_at?: string
          description?: string | null
          duration?: number
          end_date?: string | null
          id?: string
          kkm?: number | null
          risk_below_kkm_severity?: string | null
          risk_missed_severity?: string | null
          risk_on_below_kkm?: boolean
          risk_on_missed?: boolean
          start_date?: string | null
          status?: string
          title: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          archived?: boolean
          course_id?: string
          created_at?: string
          description?: string | null
          duration?: number
          end_date?: string | null
          id?: string
          kkm?: number | null
          risk_below_kkm_severity?: string | null
          risk_missed_severity?: string | null
          risk_on_below_kkm?: boolean
          risk_on_missed?: boolean
          start_date?: string | null
          status?: string
          title?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      material_views: {
        Row: {
          id: string
          material_id: string
          student_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          material_id: string
          student_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          material_id?: string
          student_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_views_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "course_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          id: string
          language_preference: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          id?: string
          language_preference?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          id?: string
          language_preference?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      question_bank: {
        Row: {
          category: string
          correct_answer: number | null
          correct_answers: number[] | null
          course_id: string | null
          created_at: string
          id: string
          options: Json | null
          points: number
          question: string
          tags: string[] | null
          teacher_id: string
          type: string
          updated_at: string
          used_count: number
        }
        Insert: {
          category?: string
          correct_answer?: number | null
          correct_answers?: number[] | null
          course_id?: string | null
          created_at?: string
          id?: string
          options?: Json | null
          points?: number
          question: string
          tags?: string[] | null
          teacher_id: string
          type?: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          category?: string
          correct_answer?: number | null
          correct_answers?: number[] | null
          course_id?: string | null
          created_at?: string
          id?: string
          options?: Json | null
          points?: number
          question?: string
          tags?: string[] | null
          teacher_id?: string
          type?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_bank_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_answer: number | null
          correct_answers: number[] | null
          created_at: string
          exam_id: string
          id: string
          options: Json | null
          order_index: number
          points: number
          question: string
          type: string
        }
        Insert: {
          correct_answer?: number | null
          correct_answers?: number[] | null
          created_at?: string
          exam_id: string
          id?: string
          options?: Json | null
          order_index?: number
          points?: number
          question: string
          type: string
        }
        Update: {
          correct_answer?: number | null
          correct_answers?: number[] | null
          created_at?: string
          exam_id?: string
          id?: string
          options?: Json | null
          order_index?: number
          points?: number
          question?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      report_card_entries: {
        Row: {
          assignment_average: number | null
          course_id: string
          created_at: string
          exam_average: number | null
          final_grade: number
          id: string
          kkm: number
          passed: boolean | null
          report_card_id: string
          teacher_notes: string | null
          updated_at: string
        }
        Insert: {
          assignment_average?: number | null
          course_id: string
          created_at?: string
          exam_average?: number | null
          final_grade: number
          id?: string
          kkm?: number
          passed?: boolean | null
          report_card_id: string
          teacher_notes?: string | null
          updated_at?: string
        }
        Update: {
          assignment_average?: number | null
          course_id?: string
          created_at?: string
          exam_average?: number | null
          final_grade?: number
          id?: string
          kkm?: number
          passed?: boolean | null
          report_card_id?: string
          teacher_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_card_entries_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_card_entries_report_card_id_fkey"
            columns: ["report_card_id"]
            isOneToOne: false
            referencedRelation: "report_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      report_cards: {
        Row: {
          created_at: string
          finalized_at: string | null
          finalized_by: string | null
          id: string
          overall_average: number | null
          overall_rank: number | null
          period_id: string
          principal_signature: string | null
          status: string
          student_id: string
          teacher_notes: string | null
          teacher_signature: string | null
          total_courses: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          overall_average?: number | null
          overall_rank?: number | null
          period_id: string
          principal_signature?: string | null
          status?: string
          student_id: string
          teacher_notes?: string | null
          teacher_signature?: string | null
          total_courses?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          overall_average?: number | null
          overall_rank?: number | null
          period_id?: string
          principal_signature?: string | null
          status?: string
          student_id?: string
          teacher_notes?: string | null
          teacher_signature?: string | null
          total_courses?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_cards_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_settings: {
        Row: {
          created_at: string
          high_risk_below_kkm_count: number
          high_risk_missed_assignments: number
          id: string
          low_risk_late_submissions: number
          low_risk_material_view_percent: number
          medium_risk_below_kkm_count: number
          medium_risk_missed_assignments: number
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          high_risk_below_kkm_count?: number
          high_risk_missed_assignments?: number
          id?: string
          low_risk_late_submissions?: number
          low_risk_material_view_percent?: number
          medium_risk_below_kkm_count?: number
          medium_risk_missed_assignments?: number
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          high_risk_below_kkm_count?: number
          high_risk_missed_assignments?: number
          id?: string
          low_risk_late_submissions?: number
          low_risk_material_view_percent?: number
          medium_risk_below_kkm_count?: number
          medium_risk_missed_assignments?: number
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_badges: {
        Row: {
          awarded_at: string
          awarded_by: string
          badge_id: string
          exam_id: string | null
          id: string
          student_id: string
          submission_id: string | null
        }
        Insert: {
          awarded_at?: string
          awarded_by: string
          badge_id: string
          exam_id?: string | null
          id?: string
          student_id: string
          submission_id?: string | null
        }
        Update: {
          awarded_at?: string
          awarded_by?: string
          badge_id?: string
          exam_id?: string | null
          id?: string
          student_id?: string
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "exam_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string | null
          name: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      student_exam_questions: {
        Row: {
          created_at: string | null
          exam_id: string | null
          id: string | null
          options: Json | null
          order_index: number | null
          points: number | null
          question: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          exam_id?: string | null
          id?: string | null
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          exam_id?: string | null
          id?: string | null
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_enrolled: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      owns_course: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "teacher" | "student"
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
      app_role: ["teacher", "student"],
    },
  },
} as const
