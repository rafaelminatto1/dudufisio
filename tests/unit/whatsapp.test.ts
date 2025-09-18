/**
 * Testes unitários para a integração WhatsApp Business API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { whatsappAPI } from '@/lib/integrations/whatsapp-api'

// Mock do fetch global
global.fetch = vi.fn()

describe('WhatsApp Business API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Configurar variáveis de ambiente para teste
    process.env.WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0'
    process.env.WHATSAPP_ACCESS_TOKEN = 'test-token'
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Envio de Mensagens', () => {
    it('deve enviar mensagem de texto com sucesso', async () => {
      const mockResponse = {
        messaging_product: 'whatsapp',
        contacts: [{ input: '5511999999999', wa_id: '5511999999999' }],
        messages: [{ id: 'wamid.test-message-id' }]
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await whatsappAPI.sendTextMessage('5511999999999', 'Mensagem de teste')

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/test-phone-id/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }
        })
      )
    })

    it('deve falhar ao enviar mensagem com número inválido', async () => {
      const mockError = {
        error: {
          message: 'Invalid phone number',
          type: 'OAuthException',
          code: 100
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockError)
      })

      const result = await whatsappAPI.sendTextMessage('invalid-number', 'Mensagem de teste')

      expect(result).toBe(false)
    })

    it('deve enviar template de lembrete de consulta', async () => {
      const mockResponse = {
        messaging_product: 'whatsapp',
        contacts: [{ input: '5511999999999', wa_id: '5511999999999' }],
        messages: [{ id: 'wamid.test-template-id' }]
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await whatsappAPI.sendAppointmentReminder(
        '5511999999999',
        'João Silva',
        '2025-01-20T14:00:00Z'
      )

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/test-phone-id/messages',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('fisioflow_appointment_reminder')
        })
      )
    })

    it('deve enviar template de confirmação de consulta', async () => {
      const mockResponse = {
        messaging_product: 'whatsapp',
        contacts: [{ input: '5511999999999', wa_id: '5511999999999' }],
        messages: [{ id: 'wamid.test-confirmation-id' }]
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await whatsappAPI.sendAppointmentConfirmation(
        '5511999999999',
        'João Silva',
        '2025-01-20T14:00:00Z',
        'Dr. Maria Santos'
      )

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/test-phone-id/messages',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('fisioflow_appointment_confirmation')
        })
      )
    })
  })

  describe('Webhook Processing', () => {
    it('deve processar webhook de mensagem recebida', async () => {
      const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'test-entry-id',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15551234567',
                phone_number_id: 'test-phone-id'
              },
              messages: [{
                from: '5511999999999',
                id: 'wamid.test-message-id',
                timestamp: '1640995200',
                text: {
                  body: 'Olá, gostaria de confirmar minha consulta'
                },
                type: 'text'
              }]
            },
            field: 'messages'
          }]
        }]
      }

      const result = await whatsappAPI.processWebhook(webhookPayload)

      expect(result).toBeUndefined() // Função não retorna valor
    })

    it('deve processar webhook de status de mensagem', async () => {
      const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'test-entry-id',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15551234567',
                phone_number_id: 'test-phone-id'
              },
              statuses: [{
                id: 'wamid.test-message-id',
                status: 'delivered',
                timestamp: '1640995200',
                recipient_id: '5511999999999'
              }]
            },
            field: 'messages'
          }]
        }]
      }

      const result = await whatsappAPI.processWebhook(webhookPayload)

      expect(result).toBeUndefined()
    })
  })

  describe('Validação de Números', () => {
    it('deve formatar número brasileiro corretamente', () => {
      const testCases = [
        { input: '11999999999', expected: '5511999999999' },
        { input: '(11) 99999-9999', expected: '5511999999999' },
        { input: '+55 11 99999-9999', expected: '5511999999999' },
        { input: '5511999999999', expected: '5511999999999' }
      ]

      testCases.forEach(({ input, expected }) => {
        // @ts-ignore - acessando método privado para teste
        const result = whatsappAPI.formatPhoneNumber(input)
        expect(result).toBe(expected)
      })
    })

    it('deve validar número brasileiro', () => {
      const validNumbers = [
        '5511999999999',
        '5511888888888',
        '5511777777777'
      ]

      const invalidNumbers = [
        '11999999999',
        '123456789',
        'invalid-number'
      ]

      validNumbers.forEach(number => {
        // @ts-ignore - acessando método privado para teste
        const result = whatsappAPI.isValidBrazilianNumber(number)
        expect(result).toBe(true)
      })

      invalidNumbers.forEach(number => {
        // @ts-ignore - acessando método privado para teste
        const result = whatsappAPI.isValidBrazilianNumber(number)
        expect(result).toBe(false)
      })
    })
  })

  describe('Teste de Conexão', () => {
    it('deve testar conexão com sucesso', async () => {
      const mockResponse = {
        display_phone_number: '15551234567',
        verified_name: 'FisioFlow',
        id: 'test-phone-id'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await whatsappAPI.testConnection()

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/test-phone-id',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-token'
          }
        })
      )
    })

    it('deve falhar no teste de conexão com token inválido', async () => {
      const mockError = {
        error: {
          message: 'Invalid access token',
          type: 'OAuthException',
          code: 190
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockError)
      })

      const result = await whatsappAPI.testConnection()

      expect(result).toBe(false)
    })
  })
})
