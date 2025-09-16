/**
 * Authentication Middleware for FisioFlow
 * Handles route protection, role-based access control, and session management
 * Includes Brazilian healthcare compliance and LGPD requirements
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database, UserRole } from '@/lib/supabase/database.types'

/**
 * Configuração de rotas protegidas
 */
const protectedRoutes = {
  // Rotas que requerem autenticação
  auth: [
    '/dashboard',
    '/patients',
    '/appointments',
    '/sessions',
    '/exercises',
    '/reports',
    '/profile',
    '/settings'
  ],

  // Rotas por papel específico
  admin: [
    '/admin',
    '/settings/organization',
    '/settings/users',
    '/settings/billing',
    '/audit-logs'
  ],

  fisioterapeuta: [
    '/patients/create',
    '/patients/[id]/edit',
    '/sessions/create',
    '/sessions/[id]/edit',
    '/exercises/create',
    '/exercises/[id]/edit'
  ],

  estagiario: [
    // Estagiários têm acesso limitado - principalmente leitura
  ],

  paciente: [
    '/patient-portal',
    '/my-sessions',
    '/my-exercises',
    '/my-progress'
  ]
}

/**
 * Rotas públicas que não requerem autenticação
 */
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/privacy',
  '/terms',
  '/about',
  '/contact'
]

/**
 * Rotas de redirecionamento baseadas em papel
 */
const roleRedirects: Record<UserRole, string> = {
  admin: '/dashboard/admin',
  fisioterapeuta: '/dashboard/fisioterapeuta',
  estagiario: '/dashboard/estagiario',
  paciente: '/dashboard/paciente'
}

/**
 * Middleware principal de autenticação com gestão de sessão aprimorada
 */
export async function authMiddleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const pathname = request.nextUrl.pathname

  // Criar cliente Supabase para middleware
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    // Atualizar sessão com refresh automático
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    // Verificar refresh token se necessário
    if (sessionError || !session) {
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        console.warn('Falha ao renovar sessão:', refreshError.message)
      }
    }

    // Obter sessão atualizada após refresh
    const { data: { session: currentSession } } = await supabase.auth.getSession()

    // Se rota é pública, permitir acesso
    if (isPublicRoute(pathname)) {
      // Se usuário logado tenta acessar rota de auth, redirecionar para dashboard
      if (currentSession && (pathname === '/login' || pathname === '/cadastro')) {
        const user = await getCurrentUserWithRole(supabase, currentSession.user.id)
        if (user?.role) {
          return NextResponse.redirect(new URL(roleRedirects[user.role], request.url))
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return response
    }

    // Se não há sessão e rota é protegida, redirecionar para login
    if (!currentSession) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      loginUrl.searchParams.set('error', 'session_expired')
      return NextResponse.redirect(loginUrl)
    }

    // Verificar se sessão não expirou (timeout de 4 horas para segurança médica)
    const sessionAge = Date.now() - new Date(currentSession.user.created_at).getTime()
    const maxSessionAge = 4 * 60 * 60 * 1000 // 4 horas em milissegundos

    if (sessionAge > maxSessionAge) {
      await supabase.auth.signOut()
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'session_timeout')
      loginUrl.searchParams.set('message', 'Sua sessão expirou por segurança. Faça login novamente.')
      return NextResponse.redirect(loginUrl)
    }

    // Obter dados completos do usuário
    const user = await getCurrentUserWithRole(supabase, currentSession.user.id)

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verificar acesso baseado em papel
    const hasAccess = await checkRoleAccess(pathname, user.role, user.org_id)

    if (!hasAccess) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Verificar consentimento LGPD para pacientes
    if (user.role === 'paciente') {
      const hasValidConsent = await checkPatientLgpdConsent(supabase, user.id)
      if (!hasValidConsent && !pathname.startsWith('/lgpd-consent')) {
        return NextResponse.redirect(new URL('/lgpd-consent', request.url))
      }
    }

    // Adicionar headers de segurança
    response.headers.set('X-User-Role', user.role)
    response.headers.set('X-Org-Id', user.org_id || '')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    return response
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error)

    // Log de auditoria para tentativa de acesso com erro
    try {
      const auditLog = {
        event_type: 'auth_middleware_error',
        resource_type: 'authentication',
        user_id: null,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        pathname,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
      // TODO: Enviar para sistema de auditoria
      console.info('Audit log:', auditLog)
    } catch (auditError) {
      console.error('Erro ao registrar log de auditoria:', auditError)
    }

    // Em caso de erro, redirecionar para login com mensagem em português
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'authentication_error')
    loginUrl.searchParams.set('message', 'Ocorreu um erro na autenticação. Tente fazer login novamente.')
    return NextResponse.redirect(loginUrl)
  }
}

/**
 * Verificar se rota é pública
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route === pathname) return true
    if (route.includes('[') && pathname.match(routeToRegex(route))) return true
    return false
  })
}

/**
 * Verificar acesso baseado em papel
 */
async function checkRoleAccess(pathname: string, role: UserRole, orgId: string | null): Promise<boolean> {
  // Verificar se rota requer papel específico
  for (const [requiredRole, routes] of Object.entries(protectedRoutes)) {
    if (requiredRole === 'auth') continue // Pular verificação geral de auth

    const hasRouteMatch = routes.some(route => {
      if (route === pathname) return true
      if (route.includes('[') && pathname.match(routeToRegex(route))) return true
      return false
    })

    if (hasRouteMatch) {
      // Verificar se usuário tem papel necessário
      if (role !== requiredRole as UserRole) {
        // Exceções para papéis hierárquicos
        if (requiredRole === 'fisioterapeuta' && role === 'admin') return true
        if (requiredRole === 'estagiario' && (role === 'admin' || role === 'fisioterapeuta')) return true

        return false
      }
    }
  }

  return true
}

/**
 * Obter usuário atual com papel na organização
 */
async function getCurrentUserWithRole(supabase: any, userId: string) {
  try {
    const { data: memberships, error } = await supabase
      .from('org_memberships')
      .select(`
        role,
        org_id,
        status,
        orgs (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .single()

    if (error || !memberships) {
      return null
    }

    return {
      id: userId,
      role: memberships.role as UserRole,
      org_id: memberships.org_id,
      org: memberships.orgs
    }
  } catch (error) {
    console.error('Erro ao obter papel do usuário:', error)
    return null
  }
}

/**
 * Verificar consentimento LGPD para pacientes
 */
async function checkPatientLgpdConsent(supabase: any, userId: string): Promise<boolean> {
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
    console.error('Erro ao verificar consentimento LGPD:', error)
    return false
  }
}

/**
 * Converter rota dinâmica para regex
 */
function routeToRegex(route: string): RegExp {
  const pattern = route
    .replace(/\[([^\]]+)\]/g, '([^/]+)') // [id] -> ([^/]+)
    .replace(/\*\*/g, '.*') // ** -> .*
    .replace(/\*/g, '[^/]*') // * -> [^/]*

  return new RegExp(`^${pattern}$`)
}

/**
 * Middleware para validação de API
 */
export async function apiAuthMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Rotas de API que não requerem autenticação
  const publicApiRoutes = [
    '/api/health',
    '/api/auth/callback',
    '/api/webhooks'
  ]

  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  try {
    const response = NextResponse.next()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Token de acesso inválido ou expirado',
          code: 'AUTH_SESSION_INVALID',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    // Verificar se token não está próximo do vencimento (renova 5 min antes)
    const tokenExp = session.expires_at
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExp = tokenExp ? tokenExp - now : 0

    if (timeUntilExp < 300) { // Menos de 5 minutos para expirar
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        return NextResponse.json(
          {
            error: 'Token Refresh Failed',
            message: 'Falha ao renovar token de acesso',
            code: 'AUTH_REFRESH_FAILED',
            timestamp: new Date().toISOString()
          },
          { status: 401 }
        )
      }
    }

    // Verificar se usuário tem acesso à organização
    const orgId = request.headers.get('x-org-id')
    if (orgId) {
      const hasOrgAccess = await supabase.rpc('user_has_org_access', {
        target_org_id: orgId
      })

      if (!hasOrgAccess.data) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Acesso negado à organização' },
          { status: 403 }
        )
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Erro na validação da API:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * Middleware para Rate Limiting (proteção contra abuso)
 */
const rateLimitMap = new Map()

export function rateLimitMiddleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutos
  const maxRequests = 100 // Máximo de requisições por IP por janela

  const requests = rateLimitMap.get(ip) || []
  const recentRequests = requests.filter((time: number) => now - time < windowMs)

  if (recentRequests.length >= maxRequests) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Muitas requisições. Tente novamente em alguns minutos.',
        retryAfter: Math.ceil(windowMs / 1000)
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(windowMs / 1000).toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': Math.max(0, maxRequests - recentRequests.length).toString(),
          'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
        }
      }
    )
  }

  recentRequests.push(now)
  rateLimitMap.set(ip, recentRequests)

  return NextResponse.next()
}

/**
 * Configuração do matcher para o middleware
 */
export const config = {
  matcher: [
    /*
     * Aplicar middleware a todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico (favicon)
     * - arquivos públicos com extensão
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}