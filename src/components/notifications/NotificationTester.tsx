'use client'

import { useState } from 'react'
import { useNotificationPermission } from '@/src/components/pwa/PWAManager'
import logger from '../../../lib/logger';

/**
 * Componente para testar e demonstrar notificações push
 * Útil para validar se o sistema está funcionando
 */
export function NotificationTester() {
  const { requestPermission, showNotification, hasPermission } = useNotificationPermission()
  const [isLoading, setIsLoading] = useState(false)

  const testNotifications = [
    {
      title: '📅 Lembrete de Consulta',
      body: 'Você tem uma consulta com Dr. Silva em 30 minutos',
      icon: '/icons/icon-192x192.png',
      actions: [
        { action: 'confirm', title: '✅ Confirmar' },
        { action: 'reschedule', title: '🔄 Reagendar' }
      ],
      data: { appointmentId: '123', type: 'appointment' }
    },
    {
      title: '💪 Hora dos Exercícios',
      body: 'Não se esqueça de fazer seus exercícios de fisioterapia',
      icon: '/icons/icon-192x192.png',
      actions: [
        { action: 'done', title: '✅ Concluído' },
        { action: 'later', title: '⏰ Mais tarde' }
      ],
      data: { exerciseId: '456', type: 'exercise' }
    },
    {
      title: '💰 Lembrete de Pagamento',
      body: 'Sua mensalidade vence amanhã - R$ 150,00',
      icon: '/icons/icon-192x192.png',
      actions: [
        { action: 'pay', title: '💳 Pagar Agora' },
        { action: 'remind', title: '🔔 Lembrar Depois' }
      ],
      data: { paymentId: '789', amount: 150, type: 'payment' }
    },
    {
      title: '📊 Relatório Semanal',
      body: 'Seu progresso da semana está pronto para visualização',
      icon: '/icons/icon-192x192.png',
      data: { reportId: '999', type: 'report' }
    }
  ]

  const sendTestNotification = async (notification: typeof testNotifications[0]) => {
    setIsLoading(true)
    try {
      await showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        actions: notification.actions,
        data: notification.data,
        requireInteraction: true,
        tag: `test-${Date.now()}`
      })
    } catch (error) {
      logger.error('Erro ao enviar notificação:', error)
      alert('Erro ao enviar notificação. Verifique as permissões.')
    } finally {
      setIsLoading(false)
    }
  }

  const requestPermissionHandler = async () => {
    setIsLoading(true)
    try {
      const granted = await requestPermission()
      if (!granted) {
        alert('Permissão de notificação negada. Por favor, habilite nas configurações do navegador.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            🔔 Central de Notificações
          </h3>
          <p className="text-sm text-gray-600">
            Teste e configure notificações push do FisioFlow
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${hasPermission ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {hasPermission ? 'Ativado' : 'Desativado'}
          </span>
        </div>
      </div>

      {!hasPermission && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="text-yellow-600">⚠️</div>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Permissão de notificação necessária
              </p>
              <p className="text-sm text-yellow-700">
                Para receber lembretes de consultas e exercícios, permita notificações
              </p>
            </div>
          </div>
          <button
            onClick={requestPermissionHandler}
            disabled={isLoading}
            className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 text-sm font-medium"
          >
            {isLoading ? 'Solicitando...' : '🔔 Permitir Notificações'}
          </button>
        </div>
      )}

      {hasPermission && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testNotifications.map((notification, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {notification.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {notification.body}
                  </p>
                  {notification.actions && (
                    <div className="flex space-x-2 mt-2">
                      {notification.actions.map((action, i) => (
                        <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {action.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => sendTestNotification(notification)}
                  disabled={isLoading}
                  className="ml-3 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? '...' : 'Testar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 text-sm mb-2">
          📱 Funcionalidades de Notificação
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>✅ Lembretes de consultas automáticos</li>
          <li>✅ Notificações de exercícios personalizadas</li>
          <li>✅ Alertas de pagamento com ações rápidas</li>
          <li>✅ Relatórios de progresso semanais</li>
          <li>✅ Notificações offline sincronizadas</li>
          <li>✅ Ações interativas (confirmar, reagendar, pagar)</li>
        </ul>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <strong>💡 Dica:</strong> As notificações funcionam mesmo quando o app está fechado.
        No mobile, você pode instalar este app como PWA para uma experiência nativa.
      </div>
    </div>
  )
}