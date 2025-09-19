import { NextResponse } from 'next/server'
import { createServerClient } from '@/src/lib/supabase/server'
import { cookies } from 'next/headers'
import logger from '../../../lib/logger';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = await createServerClient()

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        logger.error('Erro ao trocar código por sessão:', error)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
      }

      if (data?.user) {
        // Log de acesso para auditoria LGPD
        try {
          await supabase.rpc('log_patient_data_access', {
            patient_id: data.user.id,
            access_type: 'oauth_login',
            accessed_fields: undefined
          })
        } catch (auditError) {
          logger.error('Erro ao registrar log de auditoria:', auditError)
        }

        // Determinar redirecionamento baseado no papel do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profile) {
          const { data: memberships } = await supabase
            .from('org_memberships')
            .select('role, orgs(*)')
            .eq('user_id', data.user.id)
            .eq('status', 'active')

          const currentMembership = memberships?.[0]
          const role = currentMembership?.role

          // Redirecionar baseado no papel
          let redirectPath = '/dashboard'
          if (role === 'admin') {
            redirectPath = '/dashboard/admin'
          } else if (role === 'fisioterapeuta') {
            redirectPath = '/dashboard/fisioterapeuta'
          } else if (role === 'estagiario') {
            redirectPath = '/dashboard/estagiario'
          } else if (role === 'paciente') {
            redirectPath = '/dashboard/paciente'
          }

          return NextResponse.redirect(`${origin}${redirectPath}`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    } catch (error) {
      logger.error('Erro durante callback OAuth:', error)
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent('Erro interno do servidor')}`)
    }
  }

  // Retornar usuário para página de erro se não houver código
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent('Código de autorização não encontrado')}`)
}