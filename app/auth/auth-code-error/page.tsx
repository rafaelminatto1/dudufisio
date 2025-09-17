import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

function ErrorContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="mt-6 text-xl font-semibold text-gray-900">
              Erro na Autenticação
            </CardTitle>
            <CardDescription className="mt-2 text-sm text-gray-600">
              Ocorreu um problema durante o processo de login com Google.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Possíveis causas:</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Você cancelou o processo de autenticação</li>
                <li>Ocorreu um erro de rede</li>
                <li>As credenciais OAuth estão incorretas</li>
                <li>O link de callback expirou</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/login">
                  Tentar Novamente
                </Link>
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  Voltar ao Início
                </Link>
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Se o problema persistir, entre em contato com o suporte técnico.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ErrorContent />
    </Suspense>
  )
}