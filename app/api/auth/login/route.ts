/**
 * API Endpoint - Authentication Login - FisioFlow
 * POST /api/auth/login
 *
 * Handles user authentication with email/password
 * Implements Brazilian healthcare compliance and RBAC
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/src/lib/supabase/server'
import { logAuditEvent } from '@/src/lib/audit/server'
import logger from '../../../../lib/logger';

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = 'nodejs'

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

    // 3. Get user profile
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        name
      `)
      .eq('auth_user_id', data.user.id)

    if (profileError || !profiles || profiles.length === 0) {
      logger.error('Erro ao buscar perfil do usuário:', profileError)
      return NextResponse.json(
        { error: 'Erro ao carregar perfil do usuário' },
        { status: 500 }
      )
    }

    const profile = profiles[0] as any

    if (!profile) {
      logger.error('Perfil do usuário não encontrado')
      return NextResponse.json(
        { error: 'Perfil do usuário não encontrado' },
        { status: 500 }
      )
    }

    // 4. Get active org memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('org_memberships')
      .select(`
        role,
        org_id,
        status
      `)
      .eq('profile_id', profile.id)
      .eq('status', 'active')

    if (membershipError || !memberships || memberships.length === 0) {
      logger.error('Usuário não possui membros ativos em nenhuma organização')
      return NextResponse.json(
        { error: 'Usuário não possui acesso a nenhuma organização' },
        { status: 403 }
      )
    }

    const activeMemberships = memberships

    // 4. Log successful login
    // User activity check removed for now - can be re-enabled later if needed

    // 5. Skip org check for now
    // Organization check removed for now - can be re-enabled later if needed

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
          role: (activeMemberships[0] as any)?.role || 'admin', // Default role if not set
          org_id: (activeMemberships[0] as any)?.org_id || null,
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
    logger.error('Erro inesperado no login:', error)
    
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
