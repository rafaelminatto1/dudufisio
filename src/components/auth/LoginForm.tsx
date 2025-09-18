'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Link from 'next/link'

interface LoginFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()
  
  // Initialize Supabase client only on client side
  const [supabase, setSupabase] = useState<any>(null)
  
  useEffect(() => {
    setIsMounted(true)
    setSupabase(createClient())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isMounted || !supabase) {
      return
    }
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('Erro no login:', signInError)
        const errorMessage = getErrorMessage(signInError.message)
        setError(errorMessage)
        toast.error(errorMessage)
        onError?.(errorMessage)
        return
      }

      if (data.user) {
        toast.success('Login realizado com sucesso!')
        onSuccess?.()
        
        // Redirecionar para o dashboard
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Erro inesperado:', error)
      const errorMessage = 'Erro inesperado ao fazer login'
      setError(errorMessage)
      toast.error(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render until mounted to prevent hydration issues
  if (!isMounted) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            disabled
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="Sua senha"
            disabled
          />
        </div>
        <Button type="submit" className="w-full" disabled>
          Carregando...
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center justify-between">
        <Link
          href="/auth/forgot-password"
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          Esqueceu a senha?
        </Link>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || !supabase}>
        {isLoading ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}

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
  }

  // Buscar mensagem específica ou retornar mensagem genérica
  for (const [key, value] of Object.entries(errorMessages)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }

  return 'Erro ao fazer login. Tente novamente.'
}
