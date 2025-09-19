import { Metadata } from 'next'
import { NotificationTester } from '@/src/components/notifications/NotificationTester'
import { OfflineTester } from '@/src/components/pwa/OnlineStatus'

export const metadata: Metadata = {
  title: 'Demo - Funcionalidades Avançadas | FisioFlow',
  description: 'Demonstração das funcionalidades PWA, notificações e sistemas avançados do FisioFlow.',
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 FisioFlow - Funcionalidades Avançadas
          </h1>
          <p className="text-lg text-gray-600">
            Demonstração das funcionalidades PWA, Analytics, Financeiro e Notificações
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-semibold text-gray-900">PWA</h3>
            <p className="text-sm text-gray-600">Progressive Web App</p>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ Ativo
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-600">Dashboard Clínico</p>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ Ativo
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-semibold text-gray-900">Financeiro</h3>
            <p className="text-sm text-gray-600">Gestão Completa</p>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ Ativo
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl mb-2">🔔</div>
            <h3 className="font-semibold text-gray-900">Push</h3>
            <p className="text-sm text-gray-600">Notificações</p>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ Ativo
              </span>
            </div>
          </div>
        </div>

        {/* Quick Access Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <a href="/dashboard/analytics" className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">📈</div>
              <div>
                <h3 className="font-semibold text-gray-900">Dashboard Analytics</h3>
                <p className="text-sm text-gray-600">Métricas clínicas avançadas</p>
              </div>
            </div>
          </a>

          <a href="/dashboard/financial" className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">💳</div>
              <div>
                <h3 className="font-semibold text-gray-900">Gestão Financeira</h3>
                <p className="text-sm text-gray-600">Controle de pagamentos e receitas</p>
              </div>
            </div>
          </a>

          <a href="/dashboard" className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🏥</div>
              <div>
                <h3 className="font-semibold text-gray-900">Dashboard Principal</h3>
                <p className="text-sm text-gray-600">Visão geral da clínica</p>
              </div>
            </div>
          </a>
        </div>

        {/* Notification Tester */}
        <NotificationTester />

        {/* Offline Tester */}
        <div className="mt-8">
          <OfflineTester />
        </div>

        {/* PWA Features */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📱 Recursos PWA Disponíveis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded p-4">
              <h4 className="font-medium text-gray-900 mb-2">🔧 Instalação</h4>
              <p className="text-sm text-gray-600">
                App pode ser instalado no dispositivo como aplicativo nativo
              </p>
            </div>

            <div className="bg-gray-50 rounded p-4">
              <h4 className="font-medium text-gray-900 mb-2">⚡ Offline</h4>
              <p className="text-sm text-gray-600">
                Funcionalidades básicas disponíveis mesmo sem internet
              </p>
            </div>

            <div className="bg-gray-50 rounded p-4">
              <h4 className="font-medium text-gray-900 mb-2">🔄 Sincronização</h4>
              <p className="text-sm text-gray-600">
                Dados sincronizam automaticamente quando voltar online
              </p>
            </div>

            <div className="bg-gray-50 rounded p-4">
              <h4 className="font-medium text-gray-900 mb-2">🎯 Shortcuts</h4>
              <p className="text-sm text-gray-600">
                Atalhos para ações rápidas: novo paciente, agendar, etc.
              </p>
            </div>

            <div className="bg-gray-50 rounded p-4">
              <h4 className="font-medium text-gray-900 mb-2">🔔 Push Native</h4>
              <p className="text-sm text-gray-600">
                Notificações funcionam mesmo com app fechado
              </p>
            </div>

            <div className="bg-gray-50 rounded p-4">
              <h4 className="font-medium text-gray-900 mb-2">📊 Analytics</h4>
              <p className="text-sm text-gray-600">
                Dashboard com insights clínicos em tempo real
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            💡 Como testar as funcionalidades
          </h3>

          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>
              <strong>PWA:</strong> No Chrome/Edge, clique no ícone de instalação na barra de endereços
            </li>
            <li>
              <strong>Notificações:</strong> Clique em &quot;Permitir Notificações&quot; acima e teste os exemplos
            </li>
            <li>
              <strong>Offline:</strong> Desconecte a internet e navegue pelo app
            </li>
            <li>
              <strong>Analytics:</strong> Acesse o dashboard de analytics para ver métricas simuladas
            </li>
            <li>
              <strong>Financeiro:</strong> Explore o sistema de gestão financeira
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}