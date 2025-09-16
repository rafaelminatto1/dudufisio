/**
 * Página Inicial - FisioFlow
 * Landing page e redirecionamento para área apropriada
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Users, Calendar, Activity, Shield, Smartphone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'FisioFlow - Sistema de Gestão Fisioterapêutica',
  description: 'Sistema completo para gestão de clínicas de fisioterapia com compliance LGPD'
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">FisioFlow</h1>
                <p className="text-sm text-gray-600">Sistema de Gestão Fisioterapêutica</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="sm">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Gestão Completa para
              <span className="text-blue-600"> Clínicas de Fisioterapia</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Sistema brasileiro com compliance LGPD e CFM para gerenciamento de pacientes,
              agendamentos, sessões e evolução clínica.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  <Activity className="mr-2 h-5 w-5" />
                  Acessar Sistema
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Fazer Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Funcionalidades Completas
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Desenvolvido especificamente para o mercado brasileiro de fisioterapia,
              com todas as regulamentações necessárias.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Gestão de Pacientes</CardTitle>
                <CardDescription>
                  Cadastro completo com validação de CPF, fotos, histórico médico e compliance LGPD
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Agendamentos</CardTitle>
                <CardDescription>
                  Sistema de agendamento com prevenção de conflitos, lembretes automáticos e calendário integrado
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Mapeamento Corporal</CardTitle>
                <CardDescription>
                  Sistema interativo de mapeamento de dor com escala 0-10 e timeline de evolução
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Sessões de Tratamento</CardTitle>
                <CardDescription>
                  Documentação de evolução, prescrição de exercícios e relatórios para pacientes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Compliance LGPD</CardTitle>
                <CardDescription>
                  Auditoria completa, consentimento de dados, exportação e adequação às leis brasileiras
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Mobile First</CardTitle>
                <CardDescription>
                  Interface responsiva otimizada para dispositivos móveis com UX brasileiro
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-4">
              Pronto para Modernizar sua Clínica?
            </h3>
            <p className="text-blue-100 mb-8 text-lg">
              Sistema completo desenvolvido para fisioterapeutas brasileiros,
              com todas as funcionalidades necessárias para uma gestão eficiente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  <Activity className="mr-2 h-5 w-5" />
                  Explorar Sistema
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-blue-600">
                  Fazer Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">FisioFlow</span>
          </div>
          <p className="text-gray-400 mb-4">
            Sistema de Gestão Fisioterapêutica com Compliance LGPD
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            <Link href="/login" className="hover:text-white">Login</Link>
            <span>Versão MVP 1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
