/**
 * Register Page for FisioFlow
 * Professional registration with Brazilian healthcare compliance
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Heart, Lock, Mail, User, Phone, FileText, Loader2, CheckCircle } from 'lucide-react'
import { signUpAction } from '@/src/lib/auth/client-actions'

// Tipos locais para evitar importar auth.ts no client
interface SignUpData {
  email: string
  password: string
  confirmPassword: string
  name: string
  cpf?: string
  crefito?: string
  phone?: string
  acceptTerms: boolean
  acceptLgpd: boolean
}

interface AuthError {
  code: string
  message: string
}

export default function RegisterPage() {
  const router = useRouter()

  const [formData, setFormData] = useState<SignUpData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    cpf: '',
    crefito: '',
    phone: '',
    acceptTerms: false,
    acceptLgpd: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { success, error } = await signUpAction(formData)

      if (error) {
        setError(error)
      } else if (success) {
        setSuccess(true)
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

  const handleInputChange = (field: keyof SignUpData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'acceptTerms' || field === 'acceptLgpd' ? e.target.checked : e.target.value,
    }))
  }

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14)
  }

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Cadastro Realizado!</h2>
              <p className="text-gray-600 mt-2">
                Enviamos um email de confirmação para {formData.email}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Próximos passos:</strong>
                <br />
                1. Verifique sua caixa de entrada
                <br />
                2. Clique no link de confirmação
                <br />
                3. Aguarde a aprovação do administrador
              </p>
            </div>
            <Link
              href="/login"
              className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Ir para Login
            </Link>
          </div>
        </div>
      </div>
    )
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
          <p className="text-sm text-gray-500 mt-1">Solicite acesso profissional</p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Erro no Cadastro
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error.message}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange('name')}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Seu nome completo"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Profissional *
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
                value={formData.email}
                onChange={handleInputChange('email')}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {/* CPF Field */}
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-2">
              CPF
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="cpf"
                name="cpf"
                type="text"
                value={formData.cpf}
                onChange={(e) => {
                  const formatted = formatCPF(e.target.value)
                  setFormData(prev => ({ ...prev, cpf: formatted }))
                }}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          {/* CREFITO Field */}
          <div>
            <label htmlFor="crefito" className="block text-sm font-medium text-gray-700 mb-2">
              CREFITO (Fisioterapeutas)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="crefito"
                name="crefito"
                type="text"
                value={formData.crefito}
                onChange={handleInputChange('crefito')}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="12345-F"
              />
            </div>
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value)
                  setFormData(prev => ({ ...prev, phone: formatted }))
                }}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.password}
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

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Senha *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Terms Acceptance */}
          <div className="space-y-4">
            <div className="flex items-start">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={handleInputChange('acceptTerms')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
                Aceito os{' '}
                <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                  Termos de Uso
                </Link>{' '}
                do sistema *
              </label>
            </div>

            <div className="flex items-start">
              <input
                id="acceptLgpd"
                name="acceptLgpd"
                type="checkbox"
                checked={formData.acceptLgpd}
                onChange={handleInputChange('acceptLgpd')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="acceptLgpd" className="ml-2 block text-sm text-gray-700">
                Autorizo o tratamento dos meus dados pessoais conforme a{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                  Política de Privacidade
                </Link>{' '}
                (LGPD) *
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !formData.acceptTerms || !formData.acceptLgpd}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Solicitar Acesso'
            )}
          </button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </form>

        {/* LGPD Compliance Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Sistema em conformidade com a LGPD e regulamentações do CFM
            <br />
            Seus dados serão protegidos e utilizados apenas para prestação de serviços
          </p>
        </div>
      </div>
    </div>
  )
}