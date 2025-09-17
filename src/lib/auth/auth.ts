/**
 * Authentication Utilities for FisioFlow
 * Handles user authentication, session management, and Brazilian healthcare compliance
 * Includes LGPD compliance and multi-role authentication
 */

import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { cache } from 'react'
import type { Org, UserRole } from '@/lib/supabase/database.types'
import type { Database } from '@/lib/supabase/database.types'
import type { AuthUser, SignInCredentials, SignUpData, PasswordResetData, AuthError } from './types'

/**
 * Obter usuário atual do servidor (cached)
 * Usado em Server Components e Route Handlers
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createServerClient()

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // Buscar perfil do usuário
    const userId = user.id
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId as any)
      .single()

    // Buscar memberships e organização ativa
    const { data: memberships } = await supabase
      .from('org_memberships')
      .select(`
        *,
        orgs (*)
      `)
      .eq('user_id', userId as any)
      .eq('status', 'active' as any)

    // Determinar organização atual (primeira ativa)
    const currentMembership = memberships?.[0] as any
    const currentOrg = currentMembership?.orgs as Org
    const currentRole = currentMembership?.role as UserRole

    return {
      ...user,
      profile: profile as any,
      currentOrg,
      currentRole,
      memberships: (memberships || []) as any
    }
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error)
    return null
  }
})

/**
 * Verificar se usuário está autenticado
 */
export const requireAuth = async (redirectTo: string = '/login'): Promise<AuthUser> => {
  const user = await getCurrentUser()

  if (!user) {
    redirect(redirectTo)
  }

  return user
}

/**
 * Verificar se usuário tem papel específico
 */
export const requireRole = async (
  requiredRoles: UserRole | UserRole[],
  orgId?: string,
  redirectTo: string = '/unauthorized'
): Promise<AuthUser> => {
  const user = await requireAuth()
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

  // Se orgId especificado, verificar papel na organização específica
  if (orgId) {
    const membership = user.memberships?.find(m => m.org_id === orgId)
    if (!membership || !roles.includes(membership.role as UserRole)) {
      redirect(redirectTo)
    }
  } else {
    // Verificar papel na organização atual
    if (!user.currentRole || !roles.includes(user.currentRole)) {
      redirect(redirectTo)
    }
  }

  return user
}

/**
 * Fazer login
 */
export const signIn = async (
  credentials: SignInCredentials
): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      return {
        user: null,
        error: {
          code: error.name || 'auth_error',
          message: getAuthErrorMessage(error.message)
        }
      }
    }

    // Buscar dados completos do usuário
    const user = await getCurrentUser()

    // Log de acesso para auditoria
    if (user?.currentOrg) {
      await (supabase as any).rpc('log_patient_data_access', {
        patient_id: user.id as string,
        access_type: 'login',
        accessed_fields: null
      })
    }

    return { user, error: null }
  } catch (error: any) {
    return {
      user: null,
      error: {
        code: 'unexpected_error',
        message: 'Erro inesperado durante o login'
      }
    }
  }
}

/**
 * Fazer cadastro
 */
export const signUp = async (
  data: SignUpData
): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
  const supabase = createClient()

  // Validações
  if (data.password !== data.confirmPassword) {
    return {
      user: null,
      error: {
        code: 'password_mismatch',
        message: 'As senhas não coincidem'
      }
    }
  }

  if (!data.acceptTerms || !data.acceptLgpd) {
    return {
      user: null,
      error: {
        code: 'terms_not_accepted',
        message: 'Você deve aceitar os termos de uso e a política de privacidade'
      }
    }
  }

  try {
    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          cpf: data.cpf,
          crefito: data.crefito,
          phone: data.phone,
        },
      },
    })

    if (authError) {
      return {
        user: null,
        error: {
          code: authError.name || 'signup_error',
          message: getAuthErrorMessage(authError.message)
        }
      }
    }

    // Criar perfil do usuário
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id as string,
          email: data.email,
          name: data.name,
          cpf: data.cpf || null,
          crefito_number: data.crefito || null,
          phone: data.phone || null,
        } as any)

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError)
      }
    }

    return { user: null, error: null } // Usuário precisa confirmar email
  } catch (error: any) {
    return {
      user: null,
      error: {
        code: 'unexpected_error',
        message: 'Erro inesperado durante o cadastro'
      }
    }
  }
}

/**
 * Fazer logout
 */
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        error: {
          code: error.name || 'signout_error',
          message: 'Erro ao fazer logout'
        }
      }
    }

    redirect('/login')
  } catch (error: any) {
    return {
      error: {
        code: 'unexpected_error',
        message: 'Erro inesperado durante logout'
      }
    }
  }
}

/**
 * Solicitar redefinição de senha
 */
export const resetPassword = async (
  data: PasswordResetData
): Promise<{ error: AuthError | null }> => {
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: data.redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
    })

    if (error) {
      return {
        error: {
          code: error.name || 'reset_error',
          message: getAuthErrorMessage(error.message)
        }
      }
    }

    return { error: null }
  } catch (error: any) {
    return {
      error: {
        code: 'unexpected_error',
        message: 'Erro inesperado ao solicitar redefinição'
      }
    }
  }
}

/**
 * Atualizar senha
 */
export const updatePassword = async (
  newPassword: string
): Promise<{ error: AuthError | null }> => {
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      return {
        error: {
          code: error.name || 'update_error',
          message: getAuthErrorMessage(error.message)
        }
      }
    }

    return { error: null }
  } catch (error: any) {
    return {
      error: {
        code: 'unexpected_error',
        message: 'Erro inesperado ao atualizar senha'
      }
    }
  }
}

/**
 * Trocar organização ativa
 */
export const switchOrganization = async (orgId: string): Promise<{ error: AuthError | null }> => {
  const supabase = createClient()
  const user = await getCurrentUser()

  if (!user) {
    return {
      error: {
        code: 'not_authenticated',
        message: 'Usuário não autenticado'
      }
    }
  }

  // Verificar se usuário tem acesso à organização
  const membership = user.memberships?.find(m => m.org_id === orgId)
  if (!membership) {
    return {
      error: {
        code: 'access_denied',
        message: 'Acesso negado à organização'
      }
    }
  }

  try {
    // Atualizar cookies ou session storage com organização ativa
    const cookieStore = await cookies()
    cookieStore.set('current-org', orgId, {
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 dias
    })

    return { error: null }
  } catch (error: any) {
    return {
      error: {
        code: 'unexpected_error',
        message: 'Erro ao trocar organização'
      }
    }
  }
}

/**
 * Verificar consentimento LGPD
 */
export const checkLgpdConsent = async (patientId: string): Promise<boolean> => {
  const supabase = await createServerClient()

  try {
    const { data } = await (supabase as any).rpc('check_lgpd_consent', {
      target_patient_id: patientId
    })

    return Boolean(data) || false
  } catch (error) {
    console.error('Erro ao verificar consentimento LGPD:', error)
    return false
  }
}

/**
 * Registrar acesso a dados do paciente (LGPD)
 */
export const logPatientDataAccess = async (
  patientId: string,
  accessType: string,
  accessedFields?: string[]
): Promise<void> => {
  const supabase = createClient()

  try {
    await (supabase as any).rpc('log_patient_data_access', {
      patient_id: patientId,
      access_type: accessType,
      accessed_fields: accessedFields || null
    })
  } catch (error) {
    console.error('Erro ao registrar acesso aos dados:', error)
  }
}

/**
 * Traduzir mensagens de erro de autenticação
 */
const getAuthErrorMessage = (errorMessage: string): string => {
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Email ou senha incorretos',
    'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada',
    'User not found': 'Usuário não encontrado',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
    'Unable to validate email address: invalid format': 'Formato de email inválido',
    'Password is too weak': 'Senha muito fraca. Use ao menos 8 caracteres com letras e números',
    'User already registered': 'Este email já está cadastrado no sistema',
    'Email address not authorized': 'Este email não está autorizado',
    'Token has expired or is invalid': 'Link expirado ou inválido. Solicite um novo',
    'New password should be different from the old password': 'A nova senha deve ser diferente da atual'
  }

  return errorMessages[errorMessage] || errorMessage
}

/**
 * Utilitários para verificação de permissões no cliente
 */
export const hasRole = (user: AuthUser | null, roles: UserRole | UserRole[]): boolean => {
  if (!user?.currentRole) return false

  const roleList = Array.isArray(roles) ? roles : [roles]
  return roleList.includes(user.currentRole)
}

export const isHealthcareProfessional = (user: AuthUser | null): boolean => {
  return hasRole(user, ['admin', 'fisioterapeuta', 'estagiario'])
}

export const canManagePatients = (user: AuthUser | null): boolean => {
  return hasRole(user, ['admin', 'fisioterapeuta'])
}

export const canViewPatients = (user: AuthUser | null): boolean => {
  return hasRole(user, ['admin', 'fisioterapeuta', 'estagiario'])
}

export const isAdmin = (user: AuthUser | null): boolean => {
  return hasRole(user, 'admin')
}

export const isPatient = (user: AuthUser | null): boolean => {
  return hasRole(user, 'paciente')
}

/**
 * Hook personalizado para autenticação (para uso em Client Components)
 */
export const useAuth = () => {
  // Este será implementado quando criarmos os hooks do cliente
  throw new Error('useAuth deve ser usado apenas em Client Components. Use getCurrentUser em Server Components.')
}