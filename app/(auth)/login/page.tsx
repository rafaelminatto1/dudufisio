import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { GoogleSignInButton } from '@/src/components/auth/GoogleSignInButton'
import { LoginForm } from '@/src/components/auth/LoginForm'
import { Separator } from '@/src/components/ui/separator'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Entrar no FisioFlow
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de gestão para fisioterapia
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Acesse sua conta</CardTitle>
            <CardDescription>
              Entre com suas credenciais ou use o Google
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Login com Google */}
            <GoogleSignInButton className="w-full" />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Ou continue com</span>
              </div>
            </div>

            {/* Form de login tradicional */}
            <LoginForm />

            <div className="text-center text-sm">
              <span className="text-gray-600">Não tem uma conta? </span>
              <Link
                href="/auth/register"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Cadastre-se
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Ao entrar, você concorda com nossos{' '}
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