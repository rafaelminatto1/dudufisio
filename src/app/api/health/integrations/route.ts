import { NextRequest, NextResponse } from 'next/server'
import { whatsappAPI } from '@/src/lib/integrations/whatsapp-api'
import { pushNotificationService } from '@/src/lib/notifications/push-service'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Verificar integrações externas
    const integrations = await Promise.allSettled([
      checkWhatsAppIntegration(),
      checkVAPIDConfiguration(),
      checkEmailConfiguration()
    ])
    
    const results = integrations.map((integration, index) => {
      const status = integration.status === 'fulfilled' ? 'healthy' : 'unhealthy'
      const details = integration.status === 'fulfilled' 
        ? integration.value 
        : { error: integration.reason?.message || 'Unknown error' }
      
      return {
        service: ['whatsapp', 'vapid', 'email'][index],
        status,
        details
      }
    })
    
    const allHealthy = results.every(result => result.status === 'healthy')
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      integrations: results
    }, {
      status: allHealthy ? 200 : 503
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    })
  }
}

async function checkWhatsAppIntegration() {
  try {
    // Verificar se as credenciais estão configuradas
    const hasCredentials = !!(
      process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_API_URL
    )
    
    if (!hasCredentials) {
      return {
        configured: false,
        message: 'WhatsApp credentials not configured'
      }
    }
    
    // Testar conexão com a API
    const isConnected = await whatsappAPI.testConnection()
    
    if (!isConnected) {
      return {
        configured: true,
        connected: false,
        message: 'WhatsApp API connection failed'
      }
    }
    
    return {
      configured: true,
      connected: true,
      message: 'WhatsApp integration is working'
    }
    
  } catch (error) {
    throw new Error(`WhatsApp integration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function checkVAPIDConfiguration() {
  try {
    const hasPublicKey = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const hasPrivateKey = !!process.env.VAPID_PRIVATE_KEY
    
    if (!hasPublicKey || !hasPrivateKey) {
      return {
        configured: false,
        message: 'VAPID keys not configured'
      }
    }
    
    // Validar formato das chaves VAPID
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
    const privateKey = process.env.VAPID_PRIVATE_KEY!
    
    const isValidFormat = (
      publicKey.startsWith('B') && publicKey.length === 87 &&
      privateKey.startsWith('B') && privateKey.length === 43
    )
    
    if (!isValidFormat) {
      return {
        configured: true,
        valid: false,
        message: 'VAPID keys have invalid format'
      }
    }
    
    return {
      configured: true,
      valid: true,
      message: 'VAPID configuration is valid'
    }
    
  } catch (error) {
    throw new Error(`VAPID configuration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function checkEmailConfiguration() {
  try {
    // Verificar se as credenciais de email estão configuradas
    const hasSmtpConfig = !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
    )
    
    if (!hasSmtpConfig) {
      return {
        configured: false,
        message: 'Email SMTP configuration not found (optional)'
      }
    }
    
    // Aqui você poderia testar uma conexão SMTP real
    // Por agora, apenas verificar se as variáveis estão presentes
    
    return {
      configured: true,
      message: 'Email SMTP configuration is present'
    }
    
  } catch (error) {
    throw new Error(`Email configuration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
