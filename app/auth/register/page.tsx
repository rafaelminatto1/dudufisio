'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { createClient } from '@/src/lib/supabase/client-simple'
import { toast } from 'sonner'
import Link from 'next/link'
import logger from '../../../lib/logger';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          }
        }
      })

      if (signUpError) {
        logger.error('Erro no cadastro:', signUpError)
        const errorMessage = getErrorMessage(signUpError.message)
        setError(errorMessage)
        toast.error(errorMessage)
        return
      }

      if (data.user) {
        toast.success('Cadastro realizado com sucesso! Verifique seu email para confirmar a conta.')
        router.push('/login')
      }
    } catch (error) {
      logger.error('Erro inesperado:', error)
      const errorMessage = 'Erro inesperado ao criar conta'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Criar conta no FisioFlow
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de gestão para fisioterapia
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Criar Conta</CardTitle>
            <CardDescription>
              Preencha os dados para criar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
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
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Criando conta...' : 'Criar Conta'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">Já tem uma conta? </span>
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Faça login
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Ao criar uma conta, você concorda com nossos{' '}
            <Link href="/terms" className="underline">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link href="/privacy" className="underline">
              Política de Privacidade LGPD
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function getErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    'User already registered': 'Este email já está cadastrado',
    'Invalid email': 'Email inválido',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
    'Unable to validate email address': 'Email inválido',
    'Signup not allowed': 'Cadastro não permitido',
  }

  for (const [key, value] of Object.entries(errorMessages)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }

  return 'Erro ao criar conta. Tente novamente.'
}
