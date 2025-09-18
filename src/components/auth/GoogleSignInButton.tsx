'use client'

import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { createClient } from '@/lib/supabase/client-simple'
import { useState } from 'react'
import { toast } from 'sonner'

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
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    if (disabled || isLoading) return

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
        console.error('Erro ao iniciar login com Google:', error)
        const errorMessage = getErrorMessage(error.message)
        toast.error(errorMessage)
        onError?.(errorMessage)
        return
      }

      // O redirecionamento será feito automaticamente pelo Supabase
      toast.success('Redirecionando para Google...')
      onSuccess?.()
    } catch (error) {
      console.error('Erro inesperado:', error)
      const errorMessage = 'Erro inesperado ao conectar com Google'
      toast.error(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      type="button"
      disabled={disabled || isLoading}
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