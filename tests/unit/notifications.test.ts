/**
 * Testes unitários para o sistema de notificações
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { pushNotificationService, NotificationType } from '@/lib/notifications/push-service'

// Mock do Service Worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn().mockResolvedValue({
      pushManager: {
        subscribe: vi.fn().mockResolvedValue({
          endpoint: 'https://fcm.googleapis.com/fcm/send/test',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key'
          }
        })
      }
    })
  },
  writable: true
})

// Mock do Notification API
Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'granted',
    requestPermission: vi.fn().mockResolvedValue('granted')
  },
  writable: true
})

describe('Push Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Service Worker Registration', () => {
    it('deve registrar service worker com sucesso', async () => {
      const registration = await pushNotificationService.registerServiceWorker()
      
      expect(registration).toBeDefined()
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js')
    })

    it('deve retornar null se service worker não estiver disponível', async () => {
      // @ts-ignore
      delete navigator.serviceWorker
      
      const registration = await pushNotificationService.registerServiceWorker()
      
      expect(registration).toBeNull()
    })
  })

  describe('Permission Request', () => {
    it('deve solicitar permissão com sucesso', async () => {
      const permission = await pushNotificationService.requestPermission()
      
      expect(permission).toBe('granted')
      expect(window.Notification.requestPermission).toHaveBeenCalled()
    })
  })

  describe('Push Subscription', () => {
    it('deve criar subscription push com sucesso', async () => {
      const mockRegistration = {
        pushManager: {
          subscribe: vi.fn().mockResolvedValue({
            endpoint: 'https://fcm.googleapis.com/fcm/send/test',
            keys: {
              p256dh: 'test-p256dh-key',
              auth: 'test-auth-key'
            }
          })
        }
      }

      const subscription = await pushNotificationService.createPushSubscription(mockRegistration as any)
      
      expect(subscription).toBeDefined()
      expect(subscription.endpoint).toBe('https://fcm.googleapis.com/fcm/send/test')
      expect(mockRegistration.pushManager.subscribe).toHaveBeenCalled()
    })
  })

  describe('Notification Sending', () => {
    it('deve enviar notificação com dados corretos', async () => {
      const recipients = [{
        userId: 'user-123',
        preferences: {
          webPush: true,
          email: false,
          whatsapp: false
        },
        pushSubscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/test',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key'
          }
        }
      }]

      const payload = {
        title: 'Teste',
        body: 'Mensagem de teste',
        icon: '/icons/icon-192x192.png'
      }

      // Mock do fetch para simular envio de notificação
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      const result = await pushNotificationService.sendNotification(
        NotificationType.APPOINTMENT_REMINDER,
        recipients,
        payload
      )

      expect(result.success).toBe(1)
      expect(result.failed).toBe(0)
    })

    it('deve lidar com falhas no envio de notificação', async () => {
      const recipients = [{
        userId: 'user-123',
        preferences: {
          webPush: true,
          email: false,
          whatsapp: false
        },
        pushSubscription: {
          endpoint: 'invalid-endpoint',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key'
          }
        }
      }]

      const payload = {
        title: 'Teste',
        body: 'Mensagem de teste'
      }

      // Mock fetch para simular erro
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await pushNotificationService.sendNotification(
        NotificationType.APPOINTMENT_REMINDER,
        recipients,
        payload
      )

      expect(result.success).toBe(0)
      expect(result.failed).toBe(1)
    })
  })

  describe('Notification Types', () => {
    it('deve ter todos os tipos de notificação definidos', () => {
      const expectedTypes = [
        'APPOINTMENT_REMINDER',
        'APPOINTMENT_CONFIRMATION',
        'EXERCISE_REMINDER',
        'MEDICATION_REMINDER',
        'PAYMENT_REMINDER',
        'TREATMENT_UPDATE',
        'SYSTEM_NOTIFICATION'
      ]

      expectedTypes.forEach(type => {
        expect(NotificationType[type as keyof typeof NotificationType]).toBeDefined()
      })
    })
  })
})
