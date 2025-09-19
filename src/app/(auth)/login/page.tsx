/**
 * Login Page for FisioFlow
 * Authentication page with Brazilian healthcare compliance
 */

'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Heart, Lock, Mail, Loader2, Chrome, Send } from 'lucide-react'
import { signInAction, signInWithGoogleAction, signInWithMagicLinkAction } from '@/src/lib/auth/client-actions'

// Tipos locais para evitar importar auth.ts no client
interface SignInCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

interface AuthError {
  code: string
  message: string
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const [credentials, setCredentials] = useState<SignInCredentials>({
    email: '',
    password: '',
    rememberMe: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { success, error } = await signInAction(credentials)

      if (error) {
        setError(error)
      } else if (success) {
        router.push(callbackUrl)
      }
    } catch (err) {
      setError({
        code: 'unexpected_error',
        message: 'Erro inesperado. Tente novamente.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError(null)

    try {
      const { success, error, url } = await signInWithGoogleAction(callbackUrl)

      if (error) {
        setError(error)
      } else if (success && url) {
        window.location.href = url
      }
    } catch (err) {
      setError({
        code: 'unexpected_error',
        message: 'Erro inesperado ao conectar com Google.',
      })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleMagicLinkSignIn = async () => {
    if (!credentials.email) {
      setError({
        code: 'validation_error',
        message: 'Por favor, insira seu email.',
      })
      return
    }

    setIsMagicLinkLoading(true)
    setError(null)

    try {
      const { success, error } = await signInWithMagicLinkAction({
        email: credentials.email,
        redirectTo: callbackUrl
      })

      if (error) {
        setError(error)
      } else if (success) {
        setMagicLinkSent(true)
      }
    } catch (err) {
      setError({
        code: 'unexpected_error',
        message: 'Erro inesperado ao enviar link de acesso.',
      })
    } finally {
      setIsMagicLinkLoading(false)
    }
  }

  const handleInputChange = (field: keyof SignInCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: field === 'rememberMe' ? e.target.checked : e.target.value,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">FisioFlow</h1>
          <p className="text-gray-600 mt-2">Sistema de Gestão Fisioterapêutica</p>
          <p className="text-sm text-gray-500 mt-1">Acesse sua conta profissional</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Success Alert for Magic Link */}
          {magicLinkSent && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Link de acesso enviado!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    Verifique seu email e clique no link para acessar o sistema.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Erro de Autenticação
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error.message}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || magicLinkSent}
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Chrome className="h-5 w-5 mr-2" />
                  Entrar com Google
                </>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ou</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Profissional
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={credentials.email}
                onChange={handleInputChange('email')}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="seu@email.com"
              />
            </div>

            {/* Magic Link Button */}
            <button
              type="button"
              onClick={handleMagicLinkSignIn}
              disabled={isMagicLinkLoading || !credentials.email || magicLinkSent}
              className="w-full flex justify-center items-center py-2 px-3 border border-blue-300 rounded-lg shadow-sm bg-blue-50 text-sm font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMagicLinkLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Receber link por email
                </>
              )}
            </button>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={credentials.password}
                onChange={handleInputChange('password')}
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={credentials.rememberMe}
                onChange={handleInputChange('rememberMe')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Lembrar de mim
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Esqueci minha senha
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link
                href="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Solicitar acesso
              </Link>
            </p>
          </div>
          </form>
        </div>

        {/* LGPD Compliance Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Ao fazer login, você concorda com nossos{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              Política de Privacidade
            </Link>
            <br />
            Sistema em conformidade com a LGPD e regulamentações do CFM
          </p>
        </div>

        {/* Professional Credentials */}
        <div className="text-center space-y-2">
          <div className="flex justify-center space-x-4 text-xs text-gray-400">
            <span>CFM</span>
            <span>•</span>
            <span>CREFITO</span>
            <span>•</span>
            <span>LGPD</span>
          </div>
          <p className="text-xs text-gray-400">
            Sistema certificado para gestão de dados de saúde
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>}>
      <LoginForm />
    </Suspense>
  )
}