/**
 * API Types for FisioFlow
 * Shared types for API requests and responses
 */

import { Database } from '@/src/lib/database.types'

// Profile types
export interface ProfileUpdate {
  full_name?: string
  name?: string
  phone?: string
  crefito_number?: string
  avatar_url?: string
}

export interface OrganizationMembership {
  id: string
  org_id: string
  role: string
  permissions: string[]
  is_active: boolean
  joined_at: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  crefito_number?: string | null
  phone?: string | null
  avatar_url?: string | null
  created_at: string
  updated_at: string
}

export interface ProfileResponse {
  success: boolean
  data: {
    user: UserProfile
    organization: Organization | null
    permissions: UserPermissions
    memberships: OrganizationMembership[]
  }
}

// Organization types
export interface Organization {
  id: string
  name: string
  slug: string
  cnpj?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// Permission types
export interface UserPermissions {
  patients: string[]
  appointments: string[]
  sessions: string[]
  pain_points: string[]
  reports: string[]
  users: string[]
  settings: string[]
  analytics: string[]
}

// Appointment types
export interface AppointmentRequest {
  patient_id: string
  practitioner_id: string
  appointment_date: string
  duration_minutes: number
  appointment_type: string
  notes?: string
  room?: string
}

export interface AppointmentUpdate {
  appointment_date?: string
  duration_minutes?: number
  appointment_type?: string
  notes?: string
  room?: string
  status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
}

export interface RescheduleRequest {
  appointment_id: string
  new_date: string
  reason?: string
  notify_patient?: boolean
}

// Error response
export interface APIError {
  error: string
  code?: string
  details?: unknown
}

// Success response
export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Database row types shortcuts
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type OrganizationRow = Database['public']['Tables']['orgs']['Row']
export type AppointmentRow = Database['public']['Tables']['appointments']['Row']
export type PatientRow = Database['public']['Tables']['patients']['Row']

// Request body types
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    org_id?: string
  }
}

// Brazilian specific types
export interface BrazilianAddress {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  postal_code: string // CEP
}

export interface BrazilianPhone {
  country_code: string // +55
  area_code: string
  number: string
  formatted: string // (11) 99999-9999
}

export interface CPFValidation {
  cpf: string
  is_valid: boolean
  formatted: string // 000.000.000-00
}

export interface CNPJValidation {
  cnpj: string
  is_valid: boolean
  formatted: string // 00.000.000/0000-00
}