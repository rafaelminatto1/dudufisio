'use client'

import { Button } from '@/src/components/ui/button'
import { Icons } from '@/src/components/ui/icons'
import { createClient } from '@/src/lib/supabase/client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import logger from '../../../lib/logger';

interface GoogleSignInButtonProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  className,
  disabled = false
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    setIsMounted(true)
    setSupabase(createClient())
  }, [])

  const handleGoogleSignIn = async () => {
    if (disabled || isLoading || !isMounted || !supabase) return

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        logger.error('Erro ao iniciar login com Google:', error)
        const errorMessage = getErrorMessage(error.message)
        toast.error(errorMessage)
        onError?.(errorMessage)
        return
      }

      // O redirecionamento será feito automaticamente pelo Supabase
      toast.success('Redirecionando para Google...')
      onSuccess?.()
    } catch (error) {
      logger.error('Erro inesperado:', error)
      const errorMessage = 'Erro inesperado ao conectar com Google'
      toast.error(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render until mounted to prevent hydration issues
  if (!isMounted) {
    return (
      <Button
        variant="outline"
        type="button"
        disabled
        className={className}
      >
        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        Carregando...
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      type="button"
      disabled={disabled || isLoading || !supabase}
      onClick={handleGoogleSignIn}
      className={className}
    >
      {isLoading ? (
        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Icons.google className="mr-2 h-4 w-4" />
      )}
      Entrar com Google
    </Button>
  )
}

function getErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Credenciais inválidas',
    'Email not confirmed': 'Email não confirmado',
    'User not found': 'Usuário não encontrado',
    'Unable to validate email address': 'Email inválido',
    'Signup not allowed': 'Cadastro não permitido',
    'OAuth provider error': 'Erro no provedor de autenticação',
    'User denied access': 'Acesso negado pelo usuário',
    'Invalid request': 'Solicitação inválida',
  }

  // Buscar mensagem específica ou retornar mensagem genérica
  for (const [key, value] of Object.entries(errorMessages)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }

  return 'Erro ao fazer login com Google. Tente novamente.'
}