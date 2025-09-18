/**
 * Auth Callback Route - FisioFlow
 * Manipula o callback de autenticação OAuth (Google) e Magic Links
 */

import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { env } from '@/lib/env'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = env.NEXT_PUBLIC_APP_URL
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/dashboard'

  if (code) {
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Log de acesso para auditoria
          try {
            await (supabase as any).rpc('log_patient_data_access', {
              patient_id: user.id,
              access_type: 'oauth_login'
            })
          } catch (logError) {
            console.warn('Erro ao registrar log de acesso OAuth:', logError)
          }

          // Verificar se o usuário tem um perfil
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (!profile) {
            // Criar perfil básico para usuários OAuth
            await (supabase as any)
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.user_metadata?.name,
                avatar_url: user.user_metadata?.avatar_url,
              })
          }

          // Redirecionar para o dashboard
          return NextResponse.redirect(`${origin}${redirectTo}`)
        }
      }

      // Se houver erro, redirecionar para login com mensagem
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Erro na autenticação')}`
      )

    } catch (error) {
      console.error('Erro no callback de autenticação:', error)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Erro interno do servidor')}`
      )
    }
  }

  // URL inválida ou sem código
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('Link de autenticação inválido')}`
  )
}