/**
 * Next.js Middleware - FisioFlow
 * Implementa autenticação, CORS e headers de segurança para dados de saúde
 * Compliance LGPD e regulamentações CFM/CREFITO
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateSessionMiddleware } from './lib/auth/session-manager'

/**
 * Configurações de segurança para dados de saúde brasileiros
 */
const SECURITY_CONFIG = {
  // Domínios permitidos para CORS (apenas produção e desenvolvimento)
  allowedOrigins: [
    'https://fisioflow.com.br',
    'https://app.fisioflow.com.br',
    'https://fisioflow.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],

  // Headers de segurança obrigatórios para saúde
  securityHeaders: {
    // Previne ataques XSS
    'X-XSS-Protection': '1; mode=block',

    // Previne MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Controle de frames (previne clickjacking)
    'X-Frame-Options': 'DENY',

    // Referrer policy para privacidade
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions Policy (controle de recursos sensíveis)
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',

    // Content Security Policy para dados de saúde
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "media-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; '),

    // Strict Transport Security (HTTPS obrigatório)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // Cache control para dados sensíveis
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
  }
}

/**
 * Rotas que requerem autenticação
 */
const protectedRoutes = [
  '/dashboard',
  '/patients',
  '/appointments',
  '/sessions',
  '/exercises',
  '/reports',
  '/api/patients',
  '/api/appointments',
  '/api/sessions',
  '/api/pain-points',
  '/api/prescriptions',
  '/api/audit'
]

/**
 * Rotas públicas que não requerem autenticação
 */
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/api/health'
]

/**
 * Middleware principal
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Criar resposta com headers de segurança
  const response = await handleRequest(request)

  // Aplicar headers de segurança obrigatórios
  applySecurityHeaders(response)

  // Aplicar CORS para APIs
  if (pathname.startsWith('/api/')) {
    applyCorsHeaders(request, response)
  }

  return response
}

/**
 * Processar requisição principal
 */
async function handleRequest(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Verificar se rota é pública
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Verificar se rota requer autenticação
  if (isProtectedRoute(pathname)) {
    const sessionResult = await validateSessionMiddleware(request)

    if (!sessionResult.sessionData) {
      // Redirecionar para login com callback URL
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      loginUrl.searchParams.set('error', 'session_required')

      return NextResponse.redirect(loginUrl)
    }

    // Adicionar dados de sessão aos headers para APIs
    if (pathname.startsWith('/api/')) {
      const response = sessionResult.response
      response.headers.set('X-User-ID', sessionResult.sessionData.user.id)
      response.headers.set('X-User-Role', sessionResult.sessionData.role)
      response.headers.set('X-Org-ID', sessionResult.sessionData.orgId)
      return response
    }

    return sessionResult.response
  }

  return NextResponse.next()
}

/**
 * Aplicar headers de segurança para compliance de saúde
 */
function applySecurityHeaders(response: NextResponse): void {
  Object.entries(SECURITY_CONFIG.securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Headers específicos para dados de saúde (LGPD Article 46)
  response.headers.set('X-Healthcare-Data', 'true')
  response.headers.set('X-LGPD-Compliant', 'true')
  response.headers.set('X-Data-Classification', 'sensitive-health')

  // Timestamp para auditoria
  response.headers.set('X-Request-Timestamp', new Date().toISOString())
}

/**
 * Aplicar headers CORS para APIs
 */
function applyCorsHeaders(request: NextRequest, response: NextResponse): NextResponse | void {
  const origin = request.headers.get('origin')

  // Verificar se origem é permitida
  if (origin && SECURITY_CONFIG.allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else if (process.env.NODE_ENV === 'development') {
    // Em desenvolvimento, permitir localhost
    response.headers.set('Access-Control-Allow-Origin', '*')
  }

  // Headers CORS obrigatórios
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-User-Role, X-Org-ID'
  )
  response.headers.set('Access-Control-Max-Age', '86400') // 24 horas

  // Headers específicos para saúde
  response.headers.set(
    'Access-Control-Expose-Headers',
    'X-Healthcare-Data, X-LGPD-Compliant, X-Request-Timestamp, X-Rate-Limit-Remaining'
  )

  // Tratar requisições OPTIONS (preflight)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers })
  }
}

/**
 * Verificar se rota é pública
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(route)
  })
}

/**
 * Verificar se rota requer autenticação
 */
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

/**
 * Rate limiting básico para APIs sensíveis
 */
const rateLimitMap = new Map<string, { count: number; timestamp: number }>()

function checkRateLimit(request: NextRequest): boolean {
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const now = Date.now()
  const windowMs = 60000 // 1 minuto
  const maxRequests = 100 // 100 requests por minuto

  const clientData = rateLimitMap.get(clientIP)

  if (!clientData) {
    rateLimitMap.set(clientIP, { count: 1, timestamp: now })
    return true
  }

  // Reset contador se janela expirou
  if (now - clientData.timestamp > windowMs) {
    rateLimitMap.set(clientIP, { count: 1, timestamp: now })
    return true
  }

  // Incrementar contador
  clientData.count++

  // Verificar limite
  return clientData.count <= maxRequests
}

/**
 * Configuração do matcher para otimização
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}

/**
 * Utilitários para validação de segurança específicas de saúde
 */
export class HealthcareSecurityValidator {
  /**
   * Validar se requisição contém dados sensíveis de saúde
   */
  static containsSensitiveHealthData(request: NextRequest): boolean {
    const sensitiveDataPatterns = [
      /cpf/i,
      /rg/i,
      /prontuario/i,
      /diagnostico/i,
      /medicacao/i,
      /sintoma/i,
      /dor/i,
      /lesao/i,
      /tratamento/i
    ]

    const url = request.url
    const body = request.body

    return sensitiveDataPatterns.some(pattern =>
      pattern.test(url) || (body && pattern.test(body.toString()))
    )
  }

  /**
   * Validar headers de segurança obrigatórios
   */
  static validateSecurityHeaders(request: NextRequest): boolean {
    // Verificar User-Agent (prevenir bots maliciosos)
    const userAgent = request.headers.get('user-agent')
    if (!userAgent || userAgent.length < 10) {
      return false
    }

    // Verificar se vem de HTTPS em produção
    if (process.env.NODE_ENV === 'production') {
      const proto = request.headers.get('x-forwarded-proto')
      if (proto !== 'https') {
        return false
      }
    }

    return true
  }

  /**
   * Log de tentativa de acesso para auditoria LGPD
   */
  static async logAccessAttempt(request: NextRequest, allowed: boolean): Promise<void> {
    const accessLog = {
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
      method: request.method,
      url: request.url,
      allowed,
      containsSensitiveData: this.containsSensitiveHealthData(request)
    }

    // Em um sistema real, isso seria salvo no banco de dados
    console.log('Healthcare Access Log:', accessLog)
  }
}

export default middleware