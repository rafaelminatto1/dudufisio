/**
 * Integração WhatsApp Business API para FisioFlow
 * Envio de lembretes, confirmações e comunicação com pacientes
 */

import { logger } from '@/src/lib/logging/logger'

export interface WhatsAppMessage {
  to: string // Número do telefone no formato +5511999999999
  type: 'text' | 'template' | 'image' | 'document'
  content: {
    text?: string
    templateName?: string
    templateParams?: string[]
    mediaUrl?: string
    documentUrl?: string
    filename?: string
  }
  metadata?: Record<string, any>
}

export interface WhatsAppTemplate {
  name: string
  language: 'pt_BR'
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
    parameters?: Array<{
      type: 'text' | 'currency' | 'date_time'
      text?: string
    }>
  }>
}

class WhatsAppBusinessAPI {
  private apiUrl: string
  private accessToken: string
  private phoneNumberId: string

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0'
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || ''
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || ''
  }

  /**
   * Envia mensagem de texto simples
   */
  async sendTextMessage(phone: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(phone),
          type: 'text',
          text: { body: message }
        })
      })

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.statusText}`)
      }

      logger.info('WhatsApp text message sent', { phone })
      return true
    } catch (error) {
      logger.error('Failed to send WhatsApp text message', { phone }, error as Error)
      return false
    }
  }

  /**
   * Envia mensagem usando template aprovado
   */
  async sendTemplateMessage(
    phone: string,
    templateName: string,
    parameters: string[] = []
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(phone),
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'pt_BR' },
            components: parameters.length > 0 ? [{
              type: 'body',
              parameters: parameters.map(param => ({
                type: 'text',
                text: param
              }))
            }] : []
          }
        })
      })

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.statusText}`)
      }

      logger.info('WhatsApp template message sent', { phone, templateName })
      return true
    } catch (error) {
      logger.error('Failed to send WhatsApp template message',
        { phone, templateName }, error as Error)
      return false
    }
  }

  /**
   * Templates específicos para fisioterapia
   */
  async sendAppointmentReminder(
    phone: string,
    patientName: string,
    appointmentDate: string,
    therapistName: string
  ): Promise<boolean> {
    return this.sendTemplateMessage(
      phone,
      'appointment_reminder',
      [patientName, appointmentDate, therapistName]
    )
  }

  async sendAppointmentConfirmation(
    phone: string,
    patientName: string,
    appointmentDate: string
  ): Promise<boolean> {
    return this.sendTemplateMessage(
      phone,
      'appointment_confirmed',
      [patientName, appointmentDate]
    )
  }

  async sendExerciseReminder(
    phone: string,
    patientName: string,
    exerciseName: string
  ): Promise<boolean> {
    return this.sendTemplateMessage(
      phone,
      'exercise_reminder',
      [patientName, exerciseName]
    )
  }

  async sendPaymentReminder(
    phone: string,
    patientName: string,
    amount: string,
    dueDate: string
  ): Promise<boolean> {
    return this.sendTemplateMessage(
      phone,
      'payment_reminder',
      [patientName, amount, dueDate]
    )
  }

  /**
   * Envia documento (PDF, imagem, etc.)
   */
  async sendDocument(
    phone: string,
    documentUrl: string,
    filename: string,
    caption?: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(phone),
          type: 'document',
          document: {
            link: documentUrl,
            filename: filename,
            caption: caption
          }
        })
      })

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.statusText}`)
      }

      logger.info('WhatsApp document sent', { phone, filename })
      return true
    } catch (error) {
      logger.error('Failed to send WhatsApp document',
        { phone, filename }, error as Error)
      return false
    }
  }

  /**
   * Processa webhooks recebidos
   */
  async processWebhook(payload: any): Promise<void> {
    try {
      if (payload.entry?.[0]?.changes?.[0]?.value?.messages) {
        const messages = payload.entry[0].changes[0].value.messages

        for (const message of messages) {
          await this.handleIncomingMessage(message)
        }
      }

      if (payload.entry?.[0]?.changes?.[0]?.value?.statuses) {
        const statuses = payload.entry[0].changes[0].value.statuses

        for (const status of statuses) {
          await this.handleMessageStatus(status)
        }
      }
    } catch (error) {
      logger.error('Error processing WhatsApp webhook', {}, error as Error)
    }
  }

  /**
   * Processa mensagens recebidas
   */
  private async handleIncomingMessage(message: any): Promise<void> {
    const from = message.from
    const messageType = message.type
    const messageId = message.id

    logger.info('WhatsApp message received', { from, messageType, messageId })

    // Processar diferentes tipos de mensagem
    switch (messageType) {
      case 'text':
        await this.handleTextMessage(from, message.text.body)
        break

      case 'button':
        await this.handleButtonResponse(from, message.button)
        break

      case 'interactive':
        await this.handleInteractiveResponse(from, message.interactive)
        break

      default:
        logger.info('Unhandled WhatsApp message type', { messageType })
    }
  }

  /**
   * Processa status de mensagens
   */
  private async handleMessageStatus(status: any): Promise<void> {
    const messageId = status.id
    const statusType = status.status
    const recipient = status.recipient_id

    logger.info('WhatsApp message status', { messageId, statusType, recipient })

    // Atualizar status no banco de dados
    // Implementar conforme necessário
  }

  /**
   * Processa mensagens de texto recebidas
   */
  private async handleTextMessage(from: string, text: string): Promise<void> {
    const lowerText = text.toLowerCase().trim()

    // Respostas automáticas básicas
    if (lowerText.includes('confirmar') || lowerText === 'sim') {
      await this.sendTextMessage(from,
        'Obrigado pela confirmação! Sua consulta está confirmada. 📅')
    } else if (lowerText.includes('cancelar') || lowerText === 'não') {
      await this.sendTextMessage(from,
        'Entendido. Entre em contato conosco para reagendar. 📞')
    } else if (lowerText.includes('reagendar')) {
      await this.sendTextMessage(from,
        'Para reagendar, entre em contato conosco pelo telefone ou através do nosso site. 🔄')
    } else {
      // Resposta padrão
      await this.sendTextMessage(from,
        'Obrigado pelo contato! Nossa equipe responderá em breve. 😊\n\nPara emergências, ligue: (11) 9999-9999')
    }
  }

  /**
   * Processa respostas de botões
   */
  private async handleButtonResponse(from: string, button: any): Promise<void> {
    const buttonId = button.payload

    switch (buttonId) {
      case 'confirm_appointment':
        await this.sendTextMessage(from, 'Consulta confirmada com sucesso! ✅')
        break

      case 'reschedule_appointment':
        await this.sendTextMessage(from,
          'Para reagendar, entre em contato conosco. Tel: (11) 9999-9999 📞')
        break

      case 'exercise_done':
        await this.sendTextMessage(from, 'Parabéns! Exercício marcado como concluído! 💪')
        break

      default:
        logger.info('Unknown button response', { buttonId })
    }
  }

  /**
   * Processa respostas interativas
   */
  private async handleInteractiveResponse(from: string, interactive: any): Promise<void> {
    if (interactive.type === 'list_reply') {
      const listId = interactive.list_reply.id

      // Processar seleção da lista
      logger.info('List selection received', { from, listId })
    } else if (interactive.type === 'button_reply') {
      const buttonId = interactive.button_reply.id

      // Processar botão interativo
      await this.handleButtonResponse(from, { payload: buttonId })
    }
  }

  /**
   * Formata número de telefone para WhatsApp
   */
  private formatPhoneNumber(phone: string): string {
    // Remove todos os caracteres não numéricos
    let cleanPhone = phone.replace(/\D/g, '')

    // Adiciona código do país se não tiver
    if (!cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone
    }

    // Adiciona + no início
    return '+' + cleanPhone
  }

  /**
   * Verifica se o WhatsApp está configurado
   */
  isConfigured(): boolean {
    return !!(this.accessToken && this.phoneNumberId)
  }

  /**
   * Testa conexão com a API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return response.ok
    } catch (error) {
      logger.error('WhatsApp API connection test failed', {}, error as Error)
      return false
    }
  }
}

// Instância global da API
export const whatsappAPI = new WhatsAppBusinessAPI()

// Templates aprovados do WhatsApp (devem ser criados no Facebook Business Manager)
export const WHATSAPP_TEMPLATES = {
  APPOINTMENT_REMINDER: 'appointment_reminder',
  APPOINTMENT_CONFIRMED: 'appointment_confirmed',
  EXERCISE_REMINDER: 'exercise_reminder',
  PAYMENT_REMINDER: 'payment_reminder',
  WELCOME_MESSAGE: 'welcome_message',
  TREATMENT_UPDATE: 'treatment_update'
}