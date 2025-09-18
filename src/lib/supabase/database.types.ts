/**
 * Database Types for FisioFlow
 * Generated TypeScript definitions for Supabase database schema
 * Includes Brazilian healthcare compliance and LGPD requirements
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      orgs: {
        Row: {
          id: string
          name: string
          slug: string
          cnpj: string | null
          cnes_code: string | null
          phone: string | null
          email: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          logo_url: string | null
          timezone: string
          business_hours: Json
          status: 'active' | 'inactive' | 'suspended'
          subscription_type: 'free' | 'basic' | 'pro' | 'enterprise'
          subscription_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          cnpj?: string | null
          cnes_code?: string | null
          phone?: string | null
          email?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          logo_url?: string | null
          timezone?: string
          business_hours?: Json
          status?: 'active' | 'inactive' | 'suspended'
          subscription_type?: 'free' | 'basic' | 'pro' | 'enterprise'
          subscription_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          cnpj?: string | null
          cnes_code?: string | null
          phone?: string | null
          email?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          logo_url?: string | null
          timezone?: string
          business_hours?: Json
          status?: 'active' | 'inactive' | 'suspended'
          subscription_type?: 'free' | 'basic' | 'pro' | 'enterprise'
          subscription_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          cpf: string | null
          crefito_number: string | null
          phone: string | null
          avatar_url: string | null
          timezone: string
          locale: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          cpf?: string | null
          crefito_number?: string | null
          phone?: string | null
          avatar_url?: string | null
          timezone?: string
          locale?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          cpf?: string | null
          crefito_number?: string | null
          phone?: string | null
          avatar_url?: string | null
          timezone?: string
          locale?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      org_memberships: {
        Row: {
          id: string
          org_id: string
          user_id: string
          role: 'admin' | 'fisioterapeuta' | 'estagiario' | 'paciente'
          status: 'active' | 'inactive' | 'pending'
          permissions: Json | null
          invited_by: string | null
          joined_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          role: 'admin' | 'fisioterapeuta' | 'estagiario' | 'paciente'
          status?: 'active' | 'inactive' | 'pending'
          permissions?: Json | null
          invited_by?: string | null
          joined_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          role?: 'admin' | 'fisioterapeuta' | 'estagiario' | 'paciente'
          status?: 'active' | 'inactive' | 'pending'
          permissions?: Json | null
          invited_by?: string | null
          joined_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_memberships_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      patients: {
        Row: {
          id: string
          org_id: string
          name: string
          cpf: string
          rg: string | null
          date_of_birth: string
          gender: 'masculino' | 'feminino' | 'outro'
          phone: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          photo_url: string | null
          health_insurance: string | null
          health_insurance_number: string | null
          medical_history: string | null
          current_medications: string | null
          allergies: string | null
          observations: string | null
          consent_lgpd: boolean
          consent_date: string
          consent_ip_address: string | null
          status: 'active' | 'inactive' | 'discharged'
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          cpf: string
          rg?: string | null
          date_of_birth: string
          gender: 'masculino' | 'feminino' | 'outro'
          phone: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          photo_url?: string | null
          health_insurance?: string | null
          health_insurance_number?: string | null
          medical_history?: string | null
          current_medications?: string | null
          allergies?: string | null
          observations?: string | null
          consent_lgpd?: boolean
          consent_date?: string
          consent_ip_address?: string | null
          status?: 'active' | 'inactive' | 'discharged'
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          cpf?: string
          rg?: string | null
          date_of_birth?: string
          gender?: 'masculino' | 'feminino' | 'outro'
          phone?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          photo_url?: string | null
          health_insurance?: string | null
          health_insurance_number?: string | null
          medical_history?: string | null
          current_medications?: string | null
          allergies?: string | null
          observations?: string | null
          consent_lgpd?: boolean
          consent_date?: string
          consent_ip_address?: string | null
          status?: 'active' | 'inactive' | 'discharged'
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      appointments: {
        Row: {
          id: string
          org_id: string
          patient_id: string
          practitioner_id: string
          appointment_date: string
          start_time: string
          end_time: string
          duration_minutes: number
          appointment_type: 'consulta' | 'retorno' | 'avaliacao' | 'fisioterapia' | 'reavaliacao' | 'emergencia'
          status: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado' | 'falta'
          notes: string | null
          reminder_sent: boolean
          reminder_sent_at: string | null
          is_recurring: boolean
          recurrence_pattern: string | null
          recurrence_count: number | null
          recurrence_days: number[] | null
          parent_appointment_id: string | null
          conflict_resolution: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          org_id: string
          patient_id: string
          practitioner_id: string
          appointment_date: string
          start_time: string
          end_time: string
          duration_minutes?: number
          appointment_type: 'consulta' | 'retorno' | 'avaliacao' | 'fisioterapia' | 'reavaliacao' | 'emergencia'
          status?: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado' | 'falta'
          notes?: string | null
          reminder_sent?: boolean
          reminder_sent_at?: string | null
          is_recurring?: boolean
          recurrence_pattern?: string | null
          recurrence_count?: number | null
          recurrence_days?: number[] | null
          parent_appointment_id?: string | null
          conflict_resolution?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          patient_id?: string
          therapist_id?: string
          appointment_date?: string
          start_time?: string
          end_time?: string
          duration_minutes?: number
          appointment_type?: 'consulta' | 'retorno' | 'avaliacao' | 'fisioterapia' | 'reavaliacao' | 'emergencia'
          status?: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado' | 'falta'
          notes?: string | null
          reminder_sent?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          id: string
          org_id: string
          appointment_id: string | null
          patient_id: string
          practitioner_id: string
          session_date: string
          start_time: string
          end_time: string
          session_type: 'individual' | 'group' | 'home_visit' | 'online'
          status: 'in_progress' | 'completed' | 'cancelled'
          subjective: string | null
          objective: string | null
          assessment: string | null
          plan: string | null
          session_notes: string | null
          exercises_prescribed: Json | null
          next_session_notes: string | null
          patient_feedback_pain: number | null
          patient_feedback_improvement: number | null
          patient_feedback_satisfaction: number | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          org_id: string
          appointment_id?: string | null
          patient_id: string
          practitioner_id: string
          session_date: string
          start_time: string
          end_time: string
          session_type?: 'individual' | 'group' | 'home_visit' | 'online'
          status?: 'in_progress' | 'completed' | 'cancelled'
          subjective?: string | null
          objective?: string | null
          assessment?: string | null
          plan?: string | null
          session_notes?: string | null
          exercises_prescribed?: Json | null
          next_session_notes?: string | null
          patient_feedback_pain?: number | null
          patient_feedback_improvement?: number | null
          patient_feedback_satisfaction?: number | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          appointment_id?: string | null
          patient_id?: string
          therapist_id?: string
          session_date?: string
          start_time?: string
          end_time?: string
          session_type?: 'individual' | 'group' | 'home_visit' | 'online'
          status?: 'in_progress' | 'completed' | 'cancelled'
          subjective?: string | null
          objective?: string | null
          assessment?: string | null
          plan?: string | null
          session_notes?: string | null
          exercises_prescribed?: Json | null
          next_session_notes?: string | null
          patient_feedback_pain?: number | null
          patient_feedback_improvement?: number | null
          patient_feedback_satisfaction?: number | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      pain_points: {
        Row: {
          id: string
          org_id: string
          patient_id: string
          session_id: string | null
          body_region: string
          x_coordinate: number
          y_coordinate: number
          pain_intensity: number
          pain_type: 'aguda' | 'cronica' | 'latejante' | 'queimacao' | 'formigamento' | 'dormencia' | 'rigidez' | 'outro' | null
          pain_description: string | null
          assessment_date: string
          assessment_type: 'initial' | 'progress' | 'discharge' | 'followup'
          clinical_notes: string | null
          improvement_notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          org_id: string
          patient_id: string
          session_id?: string | null
          body_region: string
          x_coordinate: number
          y_coordinate: number
          pain_intensity: number
          pain_type?: 'aguda' | 'cronica' | 'latejante' | 'queimacao' | 'formigamento' | 'dormencia' | 'rigidez' | 'outro' | null
          pain_description?: string | null
          assessment_date?: string
          assessment_type: 'initial' | 'progress' | 'discharge' | 'followup'
          clinical_notes?: string | null
          improvement_notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          patient_id?: string
          session_id?: string | null
          body_region?: string
          x_coordinate?: number
          y_coordinate?: number
          pain_intensity?: number
          pain_type?: 'aguda' | 'cronica' | 'latejante' | 'queimacao' | 'formigamento' | 'dormencia' | 'rigidez' | 'outro' | null
          pain_description?: string | null
          assessment_date?: string
          assessment_type?: 'initial' | 'progress' | 'discharge' | 'followup'
          clinical_notes?: string | null
          improvement_notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pain_points_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pain_points_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pain_points_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      body_assessments: {
        Row: {
          id: string
          org_id: string
          patient_id: string
          session_id: string | null
          assessment_name: string
          assessment_date: string
          assessment_type: 'initial' | 'progress' | 'discharge' | 'followup'
          overall_pain_score: number | null
          functional_limitation_score: number | null
          subjective_notes: string | null
          objective_findings: string | null
          assessment_conclusion: string | null
          treatment_plan: string | null
          previous_assessment_id: string | null
          improvement_percentage: number | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          org_id: string
          patient_id: string
          session_id?: string | null
          assessment_name: string
          assessment_date?: string
          assessment_type: 'initial' | 'progress' | 'discharge' | 'followup'
          overall_pain_score?: number | null
          functional_limitation_score?: number | null
          subjective_notes?: string | null
          objective_findings?: string | null
          assessment_conclusion?: string | null
          treatment_plan?: string | null
          previous_assessment_id?: string | null
          improvement_percentage?: number | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          patient_id?: string
          session_id?: string | null
          assessment_name?: string
          assessment_date?: string
          assessment_type?: 'initial' | 'progress' | 'discharge' | 'followup'
          overall_pain_score?: number | null
          functional_limitation_score?: number | null
          subjective_notes?: string | null
          objective_findings?: string | null
          assessment_conclusion?: string | null
          treatment_plan?: string | null
          previous_assessment_id?: string | null
          improvement_percentage?: number | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "body_assessments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_assessments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      body_regions: {
        Row: {
          id: string
          region_code: string
          region_name_pt: string
          region_group: string
          svg_path: string | null
          anatomical_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          region_code: string
          region_name_pt: string
          region_group: string
          svg_path?: string | null
          anatomical_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          region_code?: string
          region_name_pt?: string
          region_group?: string
          svg_path?: string | null
          anatomical_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      exercise_body_targets: {
        Row: {
          id: string
          org_id: string
          exercise_id: string
          body_region: string
          target_type: 'primary' | 'secondary' | 'stabilizer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          exercise_id: string
          body_region: string
          target_type: 'primary' | 'secondary' | 'stabilizer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          exercise_id?: string
          body_region?: string
          target_type?: 'primary' | 'secondary' | 'stabilizer'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_body_targets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_body_targets_body_region_fkey"
            columns: ["body_region"]
            isOneToOne: false
            referencedRelation: "body_regions"
            referencedColumns: ["region_code"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          table_name: string
          operation: string
          record_id: string | null
          org_id: string | null
          old_values: Json | null
          new_values: Json | null
          additional_data: Json | null
          user_id: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          table_name: string
          operation: string
          record_id?: string | null
          org_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          additional_data?: Json | null
          user_id?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          table_name?: string
          operation?: string
          record_id?: string | null
          org_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          additional_data?: Json | null
          user_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      v_user_orgs: {
        Row: {
          org_id: string | null
          user_id: string | null
          role: 'admin' | 'fisioterapeuta' | 'estagiario' | 'paciente' | null
        }
        Relationships: [
          {
            foreignKeyName: "org_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      v_patient_access_log: {
        Row: {
          timestamp: string | null
          user_id: string | null
          user_email: string | null
          patient_id: string | null
          patient_name: string | null
          operation: string | null
          access_type: string | null
          accessed_fields: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      validate_cpf: {
        Args: { cpf: string }
        Returns: boolean
      }
      check_appointment_availability: {
        Args: {
          p_therapist_id: string
          p_start_time: string
          p_end_time: string
          p_appointment_date: string
          p_org_id: string
          p_exclude_appointment_id?: string
        }
        Returns: boolean
      }
      check_appointment_conflicts: {
        Args: {
          p_practitioner_id: string
          p_appointment_date: string
          p_start_time: string
          p_end_time: string
          p_exclude_appointment_id?: string
        }
        Returns: Array<{
          conflict_id: string
          conflict_type: string
          severity: string
        }>
      }
      generate_appointment_reminders: {
        Args: {
          p_appointment_id: string
        }
        Returns: void
      }
      get_patient_pain_history: {
        Args: {
          p_patient_id: string
          p_days_back?: number
        }
        Returns: {
          assessment_date: string
          avg_pain_intensity: number
          max_pain_intensity: number
          affected_regions: number
          total_pain_points: number
        }[]
      }
      analyze_pain_improvement: {
        Args: {
          p_patient_id: string
          p_region?: string
        }
        Returns: {
          body_region: string
          initial_pain: number
          current_pain: number
          improvement_percentage: number
          assessment_count: number
        }[]
      }
      user_has_org_access: {
        Args: { target_org_id: string }
        Returns: boolean
      }
      get_user_role_in_org: {
        Args: { target_org_id: string }
        Returns: string
      }
      can_access_patient: {
        Args: { target_patient_id: string }
        Returns: boolean
      }
      check_lgpd_consent: {
        Args: { target_patient_id: string }
        Returns: boolean
      }
      log_patient_data_access: {
        Args: {
          patient_id: string
          access_type: string
          accessed_fields?: string[]
        }
        Returns: void
      }
      get_patient_photo_path: {
        Args: {
          patient_id: string
          filename: string
        }
        Returns: string
      }
      get_exercise_video_path: {
        Args: {
          org_id: string
          exercise_id: string
          filename: string
        }
        Returns: string
      }
      get_data_export_path: {
        Args: {
          org_id: string
          user_id: string
          filename: string
        }
        Returns: string
      }
      cleanup_expired_data_exports: {
        Args: {}
        Returns: number
      }
      validate_file_upload: {
        Args: {
          bucket_name: string
          file_path: string
          file_size: number
          mime_type: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: 'admin' | 'fisioterapeuta' | 'estagiario' | 'paciente'
      appointment_status: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado' | 'falta'
      session_status: 'in_progress' | 'completed' | 'cancelled'
      patient_status: 'active' | 'inactive' | 'discharged'
      org_status: 'active' | 'inactive' | 'suspended'
      membership_status: 'active' | 'inactive' | 'pending'
      subscription_type: 'free' | 'basic' | 'pro' | 'enterprise'
      gender: 'masculino' | 'feminino' | 'outro'
      appointment_type: 'consulta' | 'retorno' | 'avaliacao' | 'fisioterapia' | 'reavaliacao' | 'emergencia'
      session_type: 'individual' | 'group' | 'home_visit' | 'online'
      assessment_type: 'initial' | 'progress' | 'discharge' | 'followup'
      pain_type: 'aguda' | 'cronica' | 'latejante' | 'queimacao' | 'formigamento' | 'dormencia' | 'rigidez' | 'outro'
      body_region_code: 'head' | 'neck' | 'shoulder_left' | 'shoulder_right' | 'arm_left' | 'arm_right' | 'elbow_left' | 'elbow_right' | 'forearm_left' | 'forearm_right' | 'wrist_left' | 'wrist_right' | 'hand_left' | 'hand_right' | 'chest' | 'upper_back' | 'lower_back' | 'abdomen' | 'hip_left' | 'hip_right' | 'thigh_left' | 'thigh_right' | 'knee_left' | 'knee_right' | 'shin_left' | 'shin_right' | 'calf_left' | 'calf_right' | 'ankle_left' | 'ankle_right' | 'foot_left' | 'foot_right'
      target_type: 'primary' | 'secondary' | 'stabilizer'
    }
  }
}

// Helper types for common database operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific type aliases for common entities
export type Org = Tables<'orgs'>
export type Profile = Tables<'profiles'>
export type OrgMembership = Tables<'org_memberships'>
export type Patient = Tables<'patients'>
export type Appointment = Tables<'appointments'>
export type Session = Tables<'sessions'>
export type PainPoint = Tables<'pain_points'>
export type BodyAssessment = Tables<'body_assessments'>
export type BodyRegion = Tables<'body_regions'>
export type ExerciseBodyTarget = Tables<'exercise_body_targets'>
export type AuditLog = Tables<'audit_logs'>

// Insert/Update type aliases
export type PatientInsert = Inserts<'patients'>
export type PatientUpdate = Updates<'patients'>
export type AppointmentInsert = Inserts<'appointments'>
export type AppointmentUpdate = Updates<'appointments'>
export type SessionInsert = Inserts<'sessions'>
export type SessionUpdate = Updates<'sessions'>

// Enum type aliases
export type UserRole = Enums<'user_role'>
export type AppointmentStatus = Enums<'appointment_status'>
export type SessionStatus = Enums<'session_status'>
export type PatientStatus = Enums<'patient_status'>
export type Gender = Enums<'gender'>
export type AppointmentType = Enums<'appointment_type'>
export type SessionType = Enums<'session_type'>
export type AssessmentType = Enums<'assessment_type'>
export type PainType = Enums<'pain_type'>
export type BodyRegionCode = Enums<'body_region_code'>
export type TargetType = Enums<'target_type'>

// Combined types for joins
export type PatientWithCreator = Patient & {
  created_by_profile?: Profile | null
  updated_by_profile?: Profile | null
}

export type AppointmentWithPatientAndTherapist = Appointment & {
  patient: Patient
  therapist: Profile
}

export type SessionWithPatientAndTherapist = Session & {
  patient: Patient
  therapist: Profile
  appointment?: Appointment | null
}

export type PainPointWithSession = PainPoint & {
  session?: Session | null
}

export type OrgWithMemberships = Org & {
  memberships: (OrgMembership & { profile: Profile })[]
}