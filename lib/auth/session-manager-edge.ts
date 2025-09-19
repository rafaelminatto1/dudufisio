/**
 * Session Manager Edge - FisioFlow
 * Versão compatível com Edge Runtime para middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Session, User } from '@supabase/supabase-js'

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
  user: {
    id: string
    email?: string
  }
  role: string
  orgId: string
  lastActivity?: number
  sessionTimeout?: number
}

export interface SessionValidationResult {
  isValid: boolean
  sessionData?: SessionData
  response: NextResponse
  error?: string
}

/**
 * Validar sessão no middleware (Edge Runtime compatible)
 */
export async function validateSessionMiddleware(
  request: NextRequest
): Promise<SessionValidationResult> {
  try {
    // Obter token do cookie
    const cookieStore = request.cookies
    const sessionCookie = cookieStore.get('sb-access-token')
    
    if (!sessionCookie) {
      return {
        isValid: false,
        error: 'No session found',
        response: NextResponse.next()
      }
    }

    // Decodificar JWT básico (sem verificação de assinatura no edge)
    const tokenParts = sessionCookie.value.split('.')
    if (tokenParts.length !== 3) {
      return {
        isValid: false,
        error: 'Invalid token format',
        response: NextResponse.next()
      }
    }

    try {
      // Decodificar payload do JWT
      const payload = JSON.parse(atob(tokenParts[1]))
      
      // Verificar expiração
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp && payload.exp < now) {
        return {
          isValid: false,
          error: 'Token expired',
          response: NextResponse.next()
        }
      }

      // Extrair dados da sessão
      const sessionData: SessionData = {
        user: {
          id: payload.sub || '',
          email: payload.email
        },
        role: payload.user_metadata?.role || 'paciente',
        orgId: payload.user_metadata?.org_id || 'default',
        lastActivity: Date.now(),
        sessionTimeout: SESSION_CONFIG.HEALTHCARE_SESSION_TIMEOUT
      }

      const response = NextResponse.next()
      
      return {
        isValid: true,
        sessionData,
        response
      }
    } catch (error) {
      return {
        isValid: false,
        error: 'Failed to decode token',
        response: NextResponse.next()
      }
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      response: NextResponse.next()
    }
  }
}

/**
 * Verificar se a sessão precisa de refresh
 */
export function shouldRefreshSession(sessionData: SessionData): boolean {
  if (!sessionData.lastActivity || !sessionData.sessionTimeout) {
    return false
  }

  const timeSinceActivity = Date.now() - sessionData.lastActivity
  const timeRemaining = sessionData.sessionTimeout - timeSinceActivity

  return timeRemaining <= SESSION_CONFIG.REFRESH_THRESHOLD
}

/**
 * Verificar se a sessão expirou
 */
export function isSessionExpired(sessionData: SessionData): boolean {
  if (!sessionData.lastActivity || !sessionData.sessionTimeout) {
    return false
  }

  const timeSinceActivity = Date.now() - sessionData.lastActivity
  return timeSinceActivity >= sessionData.sessionTimeout
}