/**
 * Sistema de Notificações Push para FisioFlow
 * Gerencia notificações web push, WhatsApp e email
 */

import { logger } from '@/src/lib/logging/logger'

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: Record<string, any>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  requireInteraction?: boolean
  silent?: boolean
  timestamp?: number
  tag?: string
}

export interface NotificationRecipient {
  userId: string
  patientId?: string
  email?: string
  phone?: string
  pushSubscription?: PushSubscription
  preferences: {
    webPush: boolean
    email: boolean
    whatsapp: boolean
  }
}

export enum NotificationType {
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  EXERCISE_REMINDER = 'exercise_reminder',
  MEDICATION_REMINDER = 'medication_reminder',
  TREATMENT_UPDATE = 'treatment_update',
  PAYMENT_DUE = 'payment_due',
  SYSTEM_NOTIFICATION = 'system_notification'
}

class PushNotificationService {
  private vapidKeys = {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || ''
  }

  /**
   * Registra service worker para notificações
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      logger.info('Service Worker registrado com sucesso')
      return registration
    } catch (error) {
      logger.error('Erro ao registrar Service Worker', {}, error as Error)
      return null
    }
  }

  /**
   * Solicita permissão para notificações
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied'
    }

    const permission = await Notification.requestPermission()
    logger.info('Permissão de notificação', { permission })

    return permission
  }

  /**
   * Cria uma inscrição push
   */
  async createPushSubscription(
    registration: ServiceWorkerRegistration
  ): Promise<PushSubscription | null> {
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidKeys.publicKey)
      })

      logger.info('Push subscription criada')
      return subscription
    } catch (error) {
      logger.error('Erro ao criar push subscription', {}, error as Error)
      return null
    }
  }

  /**
   * Salva a inscrição no servidor
   */
  async savePushSubscription(
    userId: string,
    subscription: PushSubscription
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          subscription: subscription.toJSON()
        })
      })

      if (!response.ok) {
        throw new Error('Falha ao salvar subscription')
      }

      logger.info('Push subscription salva', { userId })
      return true
    } catch (error) {
      logger.error('Erro ao salvar push subscription', { userId }, error as Error)
      return false
    }
  }

  /**
   * Envia notificação para múltiplos destinatários
   */
  async sendNotification(
    type: NotificationType,
    recipients: NotificationRecipient[],
    payload: NotificationPayload
  ): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    for (const recipient of recipients) {
      try {
        await this.sendToRecipient(type, recipient, payload)
        success++
      } catch (error) {
        logger.error('Erro ao enviar notificação', {
          userId: recipient.userId,
          type
        }, error as Error)
        failed++
      }
    }

    logger.info('Notificações enviadas', { type, success, failed })
    return { success, failed }
  }

  /**
   * Envia notificação para um destinatário específico
   */
  private async sendToRecipient(
    type: NotificationType,
    recipient: NotificationRecipient,
    payload: NotificationPayload
  ): Promise<void> {
    const promises: Promise<any>[] = []

    // Web Push
    if (recipient.preferences.webPush && recipient.pushSubscription) {
      promises.push(this.sendWebPush(recipient.pushSubscription, payload))
    }

    // Email
    if (recipient.preferences.email && recipient.email) {
      promises.push(this.sendEmail(recipient.email, type, payload))
    }

    // WhatsApp
    if (recipient.preferences.whatsapp && recipient.phone) {
      promises.push(this.sendWhatsApp(recipient.phone, type, payload))
    }

    await Promise.allSettled(promises)
  }

  /**
   * Envia notificação web push
   */
  private async sendWebPush(
    subscription: PushSubscription,
    payload: NotificationPayload
  ): Promise<void> {
    const response = await fetch('/api/notifications/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription,
        payload
      })
    })

    if (!response.ok) {
      throw new Error('Falha ao enviar web push')
    }
  }

  /**
   * Envia notificação por email
   */
  private async sendEmail(
    email: string,
    type: NotificationType,
    payload: NotificationPayload
  ): Promise<void> {
    const response = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        type,
        payload
      })
    })

    if (!response.ok) {
      throw new Error('Falha ao enviar email')
    }
  }

  /**
   * Envia notificação por WhatsApp
   */
  private async sendWhatsApp(
    phone: string,
    type: NotificationType,
    payload: NotificationPayload
  ): Promise<void> {
    const response = await fetch('/api/notifications/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone,
        type,
        payload
      })
    })

    if (!response.ok) {
      throw new Error('Falha ao enviar WhatsApp')
    }
  }

  /**
   * Cria templates de notificação por tipo
   */
  createNotificationTemplate(
    type: NotificationType,
    data: Record<string, any>
  ): NotificationPayload {
    switch (type) {
      case NotificationType.APPOINTMENT_REMINDER:
        return {
          title: 'Lembrete de Consulta',
          body: `Sua consulta com ${data.therapistName} está marcada para ${data.appointmentTime}`,
          icon: '/icons/appointment.png',
          badge: '/icons/badge.png',
          data: { appointmentId: data.appointmentId },
          actions: [
            { action: 'confirm', title: 'Confirmar' },
            { action: 'reschedule', title: 'Reagendar' }
          ],
          requireInteraction: true,
          tag: `appointment-${data.appointmentId}`
        }

      case NotificationType.EXERCISE_REMINDER:
        return {
          title: 'Hora dos Exercícios!',
          body: `Não esqueça de fazer seus exercícios terapêuticos: ${data.exerciseName}`,
          icon: '/icons/exercise.png',
          badge: '/icons/badge.png',
          data: { exerciseId: data.exerciseId },
          actions: [
            { action: 'done', title: 'Concluído' },
            { action: 'snooze', title: 'Lembrar em 30min' }
          ],
          tag: `exercise-${data.exerciseId}`
        }

      case NotificationType.MEDICATION_REMINDER:
        return {
          title: 'Lembrete de Medicação',
          body: `Hora de tomar: ${data.medicationName} - ${data.dosage}`,
          icon: '/icons/medication.png',
          badge: '/icons/badge.png',
          data: { medicationId: data.medicationId },
          actions: [
            { action: 'taken', title: 'Tomei' },
            { action: 'skip', title: 'Pular desta vez' }
          ],
          requireInteraction: true,
          tag: `medication-${data.medicationId}`
        }

      case NotificationType.TREATMENT_UPDATE:
        return {
          title: 'Atualização do Tratamento',
          body: data.message || 'Há atualizações em seu plano de tratamento',
          icon: '/icons/treatment.png',
          badge: '/icons/badge.png',
          data: { patientId: data.patientId },
          tag: `treatment-${data.patientId}`
        }

      case NotificationType.PAYMENT_DUE:
        return {
          title: 'Pagamento Pendente',
          body: `Você tem um pagamento de R$ ${data.amount} com vencimento em ${data.dueDate}`,
          icon: '/icons/payment.png',
          badge: '/icons/badge.png',
          data: { paymentId: data.paymentId },
          actions: [
            { action: 'pay', title: 'Pagar Agora' },
            { action: 'view', title: 'Ver Detalhes' }
          ],
          requireInteraction: true,
          tag: `payment-${data.paymentId}`
        }

      default:
        return {
          title: 'FisioFlow',
          body: data.message || 'Você tem uma nova notificação',
          icon: '/icons/default.png',
          badge: '/icons/badge.png',
          data
        }
    }
  }

  /**
   * Agenda notificação para o futuro
   */
  async scheduleNotification(
    type: NotificationType,
    recipients: NotificationRecipient[],
    payload: NotificationPayload,
    scheduleTime: Date
  ): Promise<string> {
    const response = await fetch('/api/notifications/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        recipients,
        payload,
        scheduleTime: scheduleTime.toISOString()
      })
    })

    if (!response.ok) {
      throw new Error('Falha ao agendar notificação')
    }

    const { scheduleId } = await response.json()
    return scheduleId
  }

  /**
   * Cancela notificação agendada
   */
  async cancelScheduledNotification(scheduleId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/notifications/schedule/${scheduleId}`, {
        method: 'DELETE'
      })

      return response.ok
    } catch (error) {
      logger.error('Erro ao cancelar notificação agendada', { scheduleId }, error as Error)
      return false
    }
  }

  /**
   * Utilitário para converter VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
}

// Instância global do serviço
export const pushNotificationService = new PushNotificationService()

// Hooks React para notificações
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    const newPermission = await pushNotificationService.requestPermission()
    setPermission(newPermission)

    if (newPermission === 'granted') {
      const registration = await pushNotificationService.registerServiceWorker()
      if (registration) {
        const newSubscription = await pushNotificationService.createPushSubscription(registration)
        setSubscription(newSubscription)
      }
    }

    return newPermission
  }

  return {
    permission,
    subscription,
    requestPermission
  }
}