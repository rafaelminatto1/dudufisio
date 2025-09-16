/**
 * Authentication Types for FisioFlow
 * Shared types between client and server authentication modules
 */

import type { User } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/supabase/database.types'

/**
 * Interfaces para autenticação
 */
export interface AuthUser extends User {
  profile?: any
  currentOrg?: any
  currentRole?: UserRole
  memberships?: any[]
}

export interface SignInCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignUpData {
  email: string
  password: string
  confirmPassword: string
  name: string
  cpf?: string
  crefito?: string
  phone?: string
  acceptTerms: boolean
  acceptLgpd: boolean
}

export interface PasswordResetData {
  email: string
  redirectTo?: string
}

export interface AuthError {
  code: string
  message: string
}