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
      appointments: {
        Row: {
          appointment_date: string
          cancelled_at: string | null
          cancelled_by: string | null
          cancelled_reason: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          location: string | null
          notes: string | null
          org_id: string
          patient_id: string
          status: string | null
          therapist_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancelled_reason?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          org_id: string
          patient_id: string
          status?: string | null
          therapist_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancelled_reason?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          org_id?: string
          patient_id?: string
          status?: string | null
          therapist_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          org_id: string
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          org_id: string
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          org_id?: string
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
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
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          error_message: string | null
          expires_at: string | null
          id: string
          invited_by: string
          last_resent_at: string | null
          message: string | null
          name: string
          org_id: string
          permissions: Json | null
          resent_count: number | null
          role: string
          status: string | null
          token: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          invited_by: string
          last_resent_at?: string | null
          message?: string | null
          name: string
          org_id: string
          permissions?: Json | null
          resent_count?: number | null
          role: string
          status?: string | null
          token?: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          invited_by?: string
          last_resent_at?: string | null
          message?: string | null
          name?: string
          org_id?: string
          permissions?: Json | null
          resent_count?: number | null
          role?: string
          status?: string | null
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          business_hours: Json | null
          city: string | null
          cnes_code: string | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          postal_code: string | null
          slug: string
          state: string | null
          status: string | null
          subscription_expires_at: string | null
          subscription_type: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          business_hours?: Json | null
          city?: string | null
          cnes_code?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          slug: string
          state?: string | null
          status?: string | null
          subscription_expires_at?: string | null
          subscription_type?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          business_hours?: Json | null
          city?: string | null
          cnes_code?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          slug?: string
          state?: string | null
          status?: string | null
          subscription_expires_at?: string | null
          subscription_type?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          consent_data_processing: boolean | null
          consent_lgpd: boolean | null
          consent_marketing: boolean | null
          cpf: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          gender: string | null
          id: string
          last_login_at: string | null
          name: string
          phone: string | null
          registration_number: string | null
          specialty: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          consent_data_processing?: boolean | null
          consent_lgpd?: boolean | null
          consent_marketing?: boolean | null
          cpf?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          gender?: string | null
          id: string
          last_login_at?: string | null
          name: string
          phone?: string | null
          registration_number?: string | null
          specialty?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          consent_data_processing?: boolean | null
          consent_lgpd?: boolean | null
          consent_marketing?: boolean | null
          cpf?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          gender?: string | null
          id?: string
          last_login_at?: string | null
          name?: string
          phone?: string | null
          registration_number?: string | null
          specialty?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      org_memberships: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string | null
          joined_at: string | null
          org_id: string
          permissions: Json | null
          role: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          org_id: string
          permissions?: Json | null
          role: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          org_id?: string
          permissions?: Json | null
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_memberships_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
        ]
      }
      patients: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          allergies: string | null
          city: string | null
          consent_lgpd: boolean | null
          consent_photos: boolean | null
          consent_treatment: boolean | null
          cpf: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          gender: string | null
          id: string
          insurance_number: string | null
          insurance_provider: string | null
          medical_history: string | null
          medications: string | null
          name: string
          occupation: string | null
          org_id: string
          phone: string | null
          photo_url: string | null
          postal_code: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          allergies?: string | null
          city?: string | null
          consent_lgpd?: boolean | null
          consent_photos?: boolean | null
          consent_treatment?: boolean | null
          cpf?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          id?: string
          insurance_number?: string | null
          insurance_provider?: string | null
          medical_history?: string | null
          medications?: string | null
          name: string
          occupation?: string | null
          org_id: string
          phone?: string | null
          photo_url?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          allergies?: string | null
          city?: string | null
          consent_lgpd?: boolean | null
          consent_photos?: boolean | null
          consent_treatment?: boolean | null
          cpf?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          id?: string
          insurance_number?: string | null
          insurance_provider?: string | null
          medical_history?: string | null
          medications?: string | null
          name?: string
          occupation?: string | null
          org_id?: string
          phone?: string | null
          photo_url?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_user_orgs: {
        Row: {
          org_id: string | null
          org_name: string | null
          org_slug: string | null
          role: string | null
          status: string | null
          user_id: string | null
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
        ]
      }
    }
    Functions: {
      get_user_current_org: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { org_uuid: string; user_uuid: string }
        Returns: string
      }
      has_permission: {
        Args: { org_uuid: string; required_role: string; user_uuid: string }
        Returns: boolean
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

// User roles enum for TypeScript
export type UserRole = 'admin' | 'fisioterapeuta' | 'estagiario' | 'paciente'

// Legacy type mappings for compatibility
export type PainPoint = {
  id: string
  session_id: string
  patient_id: string
  body_part: string
  body_region?: string
  pain_level: number
  pain_intensity: number
  pain_type: string | null
  pain_description: string | null
  coordinates_x: number | null
  coordinates_y: number | null
  x_coordinate: number | null
  y_coordinate: number | null
  created_at: string | null
}

export type PainType = 'sharp' | 'dull' | 'burning' | 'tingling' | 'cramping' | 'other'
export type AssessmentType = 'initial' | 'progress' | 'discharge' | 'reassessment'

// Additional types for compatibility
export type Patient = Database['public']['Tables']['patients']['Row']
export type Session = any
export type Appointment = Database['public']['Tables']['appointments']['Row']