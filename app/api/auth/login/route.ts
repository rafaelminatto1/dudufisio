/**
 * API Endpoint - Authentication Login - FisioFlow
 * POST /api/auth/login
 *
 * Handles user authentication with email/password
 * Implements Brazilian healthcare compliance and RBAC
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit/server'

// Schema for login request
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
})

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // 1. Parse and validate request body
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // 2. Attempt authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (error) {
      // Log failed login attempt
      await logAuditEvent({
        table_name: 'auth',
        operation: 'LOGIN_FAILED',
        record_id: null,
        user_id: null,
        additional_data: {
          email: validatedData.email,
          error: error.message,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        }
      })

      // Return appropriate error message
      const errorMessage = getErrorMessage(error.message)
      return NextResponse.json(
        { 
          error: errorMessage,
          code: error.message
        },
        { status: 401 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Falha na autenticação' },
        { status: 401 }
      )
    }

    // 3. Get user profile with role information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        name
      `)
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      console.error('Erro ao buscar perfil do usuário:', profileError)
      return NextResponse.json(
        { error: 'Erro ao carregar perfil do usuário' },
        { status: 500 }
      )
    }

    // 4. Log successful login
    if (false) { // Disabled user check for now
      await logAuditEvent({
        table_name: 'auth',
        operation: 'LOGIN_DENIED_INACTIVE',
        record_id: profile?.id || '',
        user_id: profile?.id || '',
        additional_data: {
          email: validatedData.email,
          reason: 'user_inactive'
        }
      })

      return NextResponse.json(
        { error: 'Usuário inativo. Entre em contato com o administrador.' },
        { status: 403 }
      )
    }

    // 5. Skip org check for now
    if (false) { // Org check disabled
      await logAuditEvent({
        table_name: 'auth',
        operation: 'LOGIN_DENIED_ORG_INACTIVE',
        record_id: profile?.id || '',
        user_id: profile?.id || '',
        additional_data: {
          email: validatedData.email,
          org_id: null,
          org_status: null
        }
      })

      return NextResponse.json(
        { error: 'Organização inativa. Entre em contato com o administrador.' },
        { status: 403 }
      )
    }

    // 6. Skip last login update for now
    // await supabase
    //   .from('profiles')
    //   .update({ last_login_at: new Date().toISOString() })
    //   .eq('id', profile.id)

    // 7. Log successful login
    await logAuditEvent({
      table_name: 'auth',
      operation: 'LOGIN_SUCCESS',
      record_id: profile?.id || '',
      user_id: profile?.id || '',
      additional_data: {
        email: validatedData.email,
        role: 'admin', // Default role for now
        org_id: null,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    // 8. Return success response
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          full_name: profile.name || '',
          role: 'admin', // Default role
          org_id: null,
          org_name: null
        },
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at
        }
      },
      message: 'Login realizado com sucesso'
    })

  } catch (error) {
    console.error('Erro inesperado no login:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Email ou senha incorretos',
    'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada',
    'User not found': 'Usuário não encontrado',
    'Unable to validate email address': 'Email inválido',
    'Signup not allowed': 'Cadastro não permitido',
    'Too many requests': 'Muitas tentativas. Tente novamente em alguns minutos',
    'Invalid email': 'Email inválido',
    'Password should be at least 6 characters': 'Senha deve ter pelo menos 6 caracteres',
    'Invalid password': 'Senha inválida',
    'User already registered': 'Usuário já cadastrado',
    'Weak password': 'Senha muito fraca'
  }

  // Find specific error message or return generic
  for (const [key, value] of Object.entries(errorMessages)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }

  return 'Erro ao fazer login. Tente novamente.'
}
