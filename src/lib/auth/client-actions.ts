/**
 * Client Authentication Actions for FisioFlow
 * Server Actions that can be called from Client Components
 */

'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SignInCredentials, SignUpData, AuthError } from './types'

interface MagicLinkCredentials {
  email: string
  redirectTo?: string
}

/**
 * Server Action para fazer login
 */
export async function signInAction(
  credentials: SignInCredentials
): Promise<{ success: boolean; error: AuthError | null }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      return {
        success: false,
        error: {
          code: error.name || 'auth_error',
          message: getAuthErrorMessage(error.message)
        }
      }
    }

    if (data.user) {
      // Log de acesso para auditoria
      try {
        await (supabase as any).rpc('log_patient_data_access', {
          patient_id: data.user.id,
          access_type: 'login'
        })
      } catch (logError) {
        console.warn('Erro ao registrar log de acesso:', logError)
      }

      // Redirect será feito no componente cliente
      return { success: true, error: null }
    }

    return {
      success: false,
      error: {
        code: 'auth_error',
        message: 'Erro durante autenticação'
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'unexpected_error',
        message: 'Erro inesperado durante o login'
      }
    }
  }
}

/**
 * Server Action para fazer cadastro
 */
export async function signUpAction(
  data: SignUpData
): Promise<{ success: boolean; error: AuthError | null }> {
  const supabase = createClient()

  // Validações
  if (data.password !== data.confirmPassword) {
    return {
      success: false,
      error: {
        code: 'password_mismatch',
        message: 'As senhas não coincidem'
      }
    }
  }

  if (!data.acceptTerms || !data.acceptLgpd) {
    return {
      success: false,
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
        success: false,
        error: {
          code: authError.name || 'signup_error',
          message: getAuthErrorMessage(authError.message)
        }
      }
    }

    // Criar perfil do usuário
    if (authData.user) {
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: data.email,
          name: data.name,
          cpf: data.cpf || null,
          crefito_number: data.crefito || null,
          phone: data.phone || null,
        })

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError)
        // Não retornar erro aqui pois o usuário já foi criado
      }
    }

    return { success: true, error: null }
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'unexpected_error',
        message: 'Erro inesperado durante o cadastro'
      }
    }
  }
}

/**
 * Server Action para fazer logout
 */
export async function signOutAction(): Promise<void> {
  const supabase = createClient()

  try {
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Erro durante logout:', error)
  }

  redirect('/login')
}

/**
 * Server Action para solicitar redefinição de senha
 */
export async function resetPasswordAction(
  email: string,
  redirectTo?: string
): Promise<{ success: boolean; error: AuthError | null }> {
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
    })

    if (error) {
      return {
        success: false,
        error: {
          code: error.name || 'reset_error',
          message: getAuthErrorMessage(error.message)
        }
      }
    }

    return { success: true, error: null }
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'unexpected_error',
        message: 'Erro inesperado ao solicitar redefinição'
      }
    }
  }
}

/**
 * Server Action para login com Magic Link (email sem senha)
 */
export async function signInWithMagicLinkAction(
  credentials: MagicLinkCredentials
): Promise<{ success: boolean; error: AuthError | null }> {
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: credentials.email,
      options: {
        emailRedirectTo: credentials.redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        shouldCreateUser: false // Só permite login se usuário já existe
      }
    })

    if (error) {
      return {
        success: false,
        error: {
          code: error.name || 'magic_link_error',
          message: getAuthErrorMessage(error.message)
        }
      }
    }

    return { success: true, error: null }
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'unexpected_error',
        message: 'Erro inesperado ao enviar link de acesso'
      }
    }
  }
}

/**
 * Server Action para login com Google
 */
export async function signInWithGoogleAction(
  redirectTo?: string
): Promise<{ success: boolean; error: AuthError | null; url?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })

    if (error) {
      return {
        success: false,
        error: {
          code: error.name || 'google_auth_error',
          message: getAuthErrorMessage(error.message)
        }
      }
    }

    if (data.url) {
      return { success: true, error: null, url: data.url }
    }

    return { success: true, error: null }
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'unexpected_error',
        message: 'Erro inesperado ao conectar com Google'
      }
    }
  }
}

/**
 * Traduzir mensagens de erro de autenticação
 */
function getAuthErrorMessage(errorMessage: string): string {
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
    'New password should be different from the old password': 'A nova senha deve ser diferente da atual',
    'Signup not allowed for this instance': 'Registro não permitido. Entre em contato com o administrador',
    'Email link is invalid or has expired': 'Link de email expirado ou inválido',
    'User with this email does not exist': 'Usuário com este email não existe'
  }

  return errorMessages[errorMessage] || errorMessage
}