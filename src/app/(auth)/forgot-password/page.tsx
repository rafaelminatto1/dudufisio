/**
 * Forgot Password Page for FisioFlow
 * Password reset request page
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { resetPasswordAction } from '@/lib/auth/client-actions'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { success, error } = await resetPasswordAction(email)

      if (error) {
        setError(error.message)
      } else if (success) {
        setIsSuccess(true)
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Email Enviado!</h1>
            <p className="text-gray-600 mt-2">
              Enviamos um link de redefinição de senha para <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Não recebeu o email? Verifique sua pasta de spam ou{' '}
                <button
                  onClick={() => {
                    setIsSuccess(false)
                    setEmail('')
                  }}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  tente novamente
                </button>
              </p>
              
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao login
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Sistema em conformidade com a LGPD e regulamentações do CFM
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">FisioFlow</h1>
          <p className="text-gray-600 mt-2">Sistema de Gestão Fisioterapêutica</p>
          <p className="text-sm text-gray-500 mt-1">Redefinir senha</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Esqueceu sua senha?
            </h2>
            <p className="text-gray-600">
              Digite seu email e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Erro
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                'Enviar link de redefinição'
              )}
            </button>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao login
              </Link>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Ao solicitar redefinição de senha, você concorda com nossos{' '}
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
