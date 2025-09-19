/**
 * Session Manager - FisioFlow
 * Gerenciamento de sessões com Supabase Auth e compliance LGPD
 * Inclui timeout de sessão, refresh automático e auditoria
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Session, User } from '@supabase/supabase-js'
import type { Database, UserRole } from '@/src/lib/supabase/database.types'
import logger from '../logger';

// Configurações de sessão para saúde brasileira
const SESSION_CONFIG = {
  // Timeout de sessão para dados sensíveis de saúde (30 minutos)
  HEALTHCARE_SESSION_TIMEOUT: 30 * 60 * 1000,
  // Timeout estendido para lembrar login (7 dias)
  EXTENDED_SESSION_TIMEOUT: 7 * 24 * 60 * 60 * 1000,
  // Refresh automático quando restam 5 minutos
  REFRESH_THRESHOLD: 5 * 60 * 1000,
  // Maximum tentativas de refresh
  MAX_REFRESH_ATTEMPTS: 3
}

export interface SessionData {
  user: User
  session: Session
  role: UserRole
  orgId: string
  orgName: string
  lastActivity: number
  sessionTimeout: number
  refreshAttempts: number
}

export interface SessionValidationResult {
  isValid: boolean
  sessionData?: SessionData
  error?: string
  shouldRefresh?: boolean
  shouldLogout?: boolean
}

/**
 * Classe para gerenciamento de sessões
 */
export class SessionManager {
  private supabase: ReturnType<typeof createServerClient>

  constructor(request: NextRequest, response: NextResponse) {
    this.supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            request.cookies.set({ name, value: '', ...options })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )
  }

  /**
   * Valida sessão atual e dados do usuário
   */
  async validateSession(): Promise<SessionValidationResult> {
    try {
      // Obter sessão do Supabase
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()

      if (sessionError || !session) {
        return {
          isValid: false,
          error: 'Sessão não encontrada ou inválida',
          shouldLogout: true
        }
      }

      // Verificar expiração da sessão
      const now = Date.now()
      const sessionExpiry = new Date(session.expires_at!).getTime()

      if (now >= sessionExpiry) {
        return {
          isValid: false,
          error: 'Sessão expirada',
          shouldRefresh: true
        }
      }

      // Obter dados do usuário e organização
      const userData = await this.getUserWithOrganization(session.user.id)
      if (!userData) {
        return {
          isValid: false,
          error: 'Dados do usuário não encontrados',
          shouldLogout: true
        }
      }

      // Verificar timeout de atividade
      const sessionData = await this.getSessionData()
      if (sessionData && this.isSessionTimedOut(sessionData)) {
        await this.logAuditEvent('session_timeout', session.user.id)
        return {
          isValid: false,
          error: 'Sessão expirada por inatividade',
          shouldLogout: true
        }
      }

      // Atualizar última atividade
      await this.updateLastActivity(session.user.id, userData.role)

      // Verificar se precisa refresh
      const shouldRefresh = (sessionExpiry - now) <= SESSION_CONFIG.REFRESH_THRESHOLD

      const validSessionData: SessionData = {
        user: session.user,
        session,
        role: userData.role,
        orgId: userData.orgId,
        orgName: userData.orgName,
        lastActivity: now,
        sessionTimeout: userData.role === 'paciente'
          ? SESSION_CONFIG.EXTENDED_SESSION_TIMEOUT
          : SESSION_CONFIG.HEALTHCARE_SESSION_TIMEOUT,
        refreshAttempts: sessionData?.refreshAttempts || 0
      }

      return {
        isValid: true,
        sessionData: validSessionData,
        shouldRefresh
      }

    } catch (error) {
      logger.error('Erro na validação de sessão:', error)
      return {
        isValid: false,
        error: 'Erro interno na validação de sessão',
        shouldLogout: true
      }
    }
  }

  /**
   * Refresh da sessão
   */
  async refreshSession(): Promise<SessionValidationResult> {
    try {
      const { data: { session }, error } = await this.supabase.auth.refreshSession()

      if (error || !session) {
        return {
          isValid: false,
          error: 'Falha ao renovar sessão',
          shouldLogout: true
        }
      }

      // Incrementar contador de tentativas de refresh
      const sessionData = await this.getSessionData()
      const refreshAttempts = (sessionData?.refreshAttempts || 0) + 1

      if (refreshAttempts > SESSION_CONFIG.MAX_REFRESH_ATTEMPTS) {
        await this.logAuditEvent('max_refresh_attempts', session.user.id)
        return {
          isValid: false,
          error: 'Limite de renovações de sessão excedido',
          shouldLogout: true
        }
      }

      // Log da renovação para auditoria
      await this.logAuditEvent('session_refreshed', session.user.id)

      // Validar sessão renovada
      return await this.validateSession()

    } catch (error) {
      logger.error('Erro no refresh de sessão:', error)
      return {
        isValid: false,
        error: 'Erro interno no refresh de sessão',
        shouldLogout: true
      }
    }
  }

  /**
   * Logout e limpeza de sessão
   */
  async logout(userId?: string): Promise<void> {
    try {
      if (userId) {
        await this.logAuditEvent('user_logout', userId)
      }

      // Logout do Supabase
      await this.supabase.auth.signOut()

      // Limpar cookies de sessão
      await this.clearSessionCookies()

    } catch (error) {
      logger.error('Erro no logout:', error)
    }
  }

  /**
   * Obter dados do usuário com organização
   */
  private async getUserWithOrganization(userId: string) {
    try {
      const { data: membership, error } = await this.supabase
        .from('org_memberships')
        .select(`
          role,
          org_id,
          orgs!inner (
            id,
            name,
            status
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error || !membership) {
        return null
      }

      const org = membership.orgs as any

      return {
        role: membership.role as UserRole,
        orgId: membership.org_id,
        orgName: org.name,
        orgStatus: org.status
      }
    } catch (error) {
      logger.error('Erro ao obter dados do usuário:', error)
      return null
    }
  }

  /**
   * Obter dados de sessão dos cookies
   */
  private async getSessionData(): Promise<SessionData | null> {
    try {
      const cookieStore = await cookies()
      const sessionCookie = cookieStore.get('fisioflow-session')

      if (!sessionCookie?.value) {
        return null
      }

      return JSON.parse(sessionCookie.value)
    } catch (error) {
      return null
    }
  }

  /**
   * Verificar se sessão expirou por inatividade
   */
  private isSessionTimedOut(sessionData: SessionData): boolean {
    const now = Date.now()
    const timeSinceLastActivity = now - sessionData.lastActivity
    return timeSinceLastActivity > sessionData.sessionTimeout
  }

  /**
   * Atualizar última atividade
   */
  private async updateLastActivity(userId: string, role: UserRole): Promise<void> {
    try {
      const now = Date.now()
      const timeout = role === 'paciente'
        ? SESSION_CONFIG.EXTENDED_SESSION_TIMEOUT
        : SESSION_CONFIG.HEALTHCARE_SESSION_TIMEOUT

      const sessionData = {
        userId,
        role,
        lastActivity: now,
        sessionTimeout: timeout,
        refreshAttempts: 0
      }

      const cookieStore = await cookies()
      cookieStore.set('fisioflow-session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: timeout / 1000
      })

    } catch (error) {
      logger.error('Erro ao atualizar última atividade:', error)
    }
  }

  /**
   * Limpar cookies de sessão
   */
  private async clearSessionCookies(): Promise<void> {
    const cookieStore = await cookies()
    const sessionCookies = [
      'fisioflow-session',
      'sb-access-token',
      'sb-refresh-token',
      'current-org'
    ]

    sessionCookies.forEach(cookieName => {
      cookieStore.set(cookieName, '', {
        expires: new Date(0),
        path: '/'
      })
    })
  }

  /**
   * Log de eventos de auditoria
   */
  private async logAuditEvent(event: string, userId: string, additionalData?: any): Promise<void> {
    try {
      await this.supabase
        .from('audit_logs')
        .insert({
          table_name: 'auth_sessions',
          operation: event,
          user_id: userId,
          additional_data: {
            event_type: 'session_management',
            timestamp: new Date().toISOString(),
            user_agent: '',
            ip_address: '',
            ...additionalData
          }
        })
    } catch (error) {
      logger.error('Erro ao registrar evento de auditoria:', error)
    }
  }
}

/**
 * Middleware helper para validação de sessão
 */
export async function validateSessionMiddleware(
  request: NextRequest
): Promise<{ response: NextResponse; sessionData?: SessionData }> {
  const response = NextResponse.next()
  const sessionManager = new SessionManager(request, response)

  const validation = await sessionManager.validateSession()

  if (!validation.isValid) {
    if (validation.shouldLogout) {
      await sessionManager.logout()

      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', validation.error || 'session_expired')
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)

      return { response: NextResponse.redirect(loginUrl) }
    }

    if (validation.shouldRefresh) {
      const refreshResult = await sessionManager.refreshSession()
      if (!refreshResult.isValid) {
        await sessionManager.logout()

        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('error', 'session_refresh_failed')

        return { response: NextResponse.redirect(loginUrl) }
      }

      return { response, sessionData: refreshResult.sessionData }
    }
  }

  // Adicionar headers de segurança para sessões válidas
  if (validation.sessionData) {
    response.headers.set('X-Session-Valid', 'true')
    response.headers.set('X-User-Role', validation.sessionData.role)
    response.headers.set('X-Org-Id', validation.sessionData.orgId)
  }

  return { response, sessionData: validation.sessionData }
}

/**
 * Utilitário para verificar consentimento LGPD
 */
export async function checkLgpdConsent(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  role: UserRole
): Promise<boolean> {
  // Apenas pacientes precisam de verificação de consentimento
  if (role !== 'paciente') {
    return true
  }

  try {
    const { data: patient, error } = await supabase
      .from('patients')
      .select('consent_lgpd, consent_date')
      .eq('cpf',
        supabase
          .from('profiles')
          .select('cpf')
          .eq('id', userId)
          .single()
      )
      .single()

    if (error || !patient) {
      return false
    }

    // Verificar se consentimento é válido (dentro de 2 anos)
    const consentDate = new Date(patient.consent_date)
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    return patient.consent_lgpd && consentDate > twoYearsAgo
  } catch (error) {
    logger.error('Erro ao verificar consentimento LGPD:', error)
    return false
  }
}

export default SessionManager