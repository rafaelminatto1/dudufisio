/**
 * Configuração do LogRocket para monitoramento de sessões e analytics
 */

// Importar LogRocket apenas no cliente
let LogRocket: any = null

if (typeof window !== 'undefined') {
  // Carregar LogRocket dinamicamente
  import('logrocket').then((module) => {
    LogRocket = module.default
  })
}

/**
 * Inicializar LogRocket
 */
export function initLogRocket() {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_LOGROCKET_APP_ID) {
    return
  }

  try {
    LogRocket.init(process.env.NEXT_PUBLIC_LOGROCKET_APP_ID, {
      // Configurações de privacidade para LGPD
      sanitizeAllInputs: true,
      maskAllInputs: true,
      maskAllText: false,
      maskTextSelector: '[data-sensitive]',
      
      // Configurações de performance
      capturePerformance: true,
      captureNetworkRequests: true,
      captureConsoleLogs: ['error', 'warn'],
      captureNetworkResponseHeaders: false,
      captureNetworkResponseBody: false,
      
      // Configurações de sessão
      mergeIframes: true,
      shouldCaptureConsoleErrors: true,
      shouldCaptureNetworkErrors: true,
      
      // Configurações de privacidade específicas para saúde
      maskInputOptions: {
        password: true,
        email: true,
        phone: true,
        cpf: true,
        rg: true,
        'data-sensitive': true
      },
      
      // Filtros para dados sensíveis
      shouldCaptureConsoleLog: (logLevel: string, logMessage: string) => {
        // Filtrar logs que podem conter dados sensíveis
        const sensitiveKeywords = [
          'password', 'token', 'secret', 'key', 'auth',
          'cpf', 'rg', 'email', 'phone', 'address'
        ]
        
        const message = logMessage.toLowerCase()
        return !sensitiveKeywords.some(keyword => message.includes(keyword))
      },
      
      // Configurações de rede
      network: {
        requestSanitizer: (request: any) => {
          // Sanitizar requests que podem conter dados sensíveis
          if (request.url?.includes('/api/auth/') || 
              request.url?.includes('/api/patients/') ||
              request.body) {
            
            return {
              ...request,
              body: '[SANITIZED]'
            }
          }
          return request
        }
      }
    })
    
    // Configurar identificação de usuário
    LogRocket.identify = (userId: string, traits?: any) => {
      if (LogRocket && LogRocket.identify) {
        LogRocket.identify(userId, {
          ...traits,
          environment: process.env.NODE_ENV,
          version: process.env.npm_package_version || '1.0.0'
        })
      }
    }
    
    console.log('LogRocket initialized successfully')
    
  } catch (error) {
    console.error('Failed to initialize LogRocket:', error)
  }
}

/**
 * Utilitários do LogRocket
 */
export const logRocketUtils = {
  /**
   * Identificar usuário na sessão
   */
  identify: (userId: string, userTraits?: {
    email?: string
    name?: string
    role?: string
    organization?: string
  }) => {
    if (typeof window !== 'undefined' && LogRocket?.identify) {
      LogRocket.identify(userId, {
        ...userTraits,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      })
    }
  },
  
  /**
   * Adicionar evento customizado
   */
  track: (eventName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && LogRocket?.track) {
      LogRocket.track(eventName, {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href
      })
    }
  },
  
  /**
   * Capturar erro específico
   */
  captureException: (error: Error, context?: Record<string, any>) => {
    if (typeof window !== 'undefined' && LogRocket?.captureException) {
      LogRocket.captureException(error, {
        ...context,
        timestamp: new Date().toISOString(),
        url: window.location.href
      })
    }
  },
  
  /**
   * Capturar mensagem
   */
  captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
    if (typeof window !== 'undefined' && LogRocket?.captureMessage) {
      LogRocket.captureMessage(message, {
        level,
        timestamp: new Date().toISOString(),
        url: window.location.href
      })
    }
  },
  
  /**
   * Iniciar transação de performance
   */
  startTransaction: (name: string, op: string) => {
    if (typeof window !== 'undefined' && LogRocket?.startTransaction) {
      return LogRocket.startTransaction(name, op)
    }
    return null
  },
  
  /**
   * Adicionar breadcrumb
   */
  addBreadcrumb: (breadcrumb: {
    message: string
    category: string
    level?: 'info' | 'warning' | 'error'
    data?: Record<string, any>
  }) => {
    if (typeof window !== 'undefined' && LogRocket?.addBreadcrumb) {
      LogRocket.addBreadcrumb({
        ...breadcrumb,
        timestamp: new Date().toISOString()
      })
    }
  },
  
  /**
   * Configurar contexto global
   */
  setContext: (key: string, context: any) => {
    if (typeof window !== 'undefined' && LogRocket?.setContext) {
      LogRocket.setContext(key, context)
    }
  },
  
  /**
   * Obter ID da sessão atual
   */
  getSessionURL: () => {
    if (typeof window !== 'undefined' && LogRocket?.sessionURL) {
      return LogRocket.sessionURL
    }
    return null
  }
}

/**
 * Eventos específicos do FisioFlow
 */
export const fisioFlowEvents = {
  // Autenticação
  userLogin: (userId: string, method: string) => {
    logRocketUtils.track('user_login', { userId, method })
  },
  
  userLogout: (userId: string) => {
    logRocketUtils.track('user_logout', { userId })
  },
  
  // Pacientes
  patientCreated: (patientId: string, userId: string) => {
    logRocketUtils.track('patient_created', { patientId, userId })
  },
  
  patientViewed: (patientId: string, userId: string) => {
    logRocketUtils.track('patient_viewed', { patientId, userId })
  },
  
  patientUpdated: (patientId: string, userId: string, fields: string[]) => {
    logRocketUtils.track('patient_updated', { patientId, userId, fields })
  },
  
  // Consultas
  appointmentScheduled: (appointmentId: string, userId: string) => {
    logRocketUtils.track('appointment_scheduled', { appointmentId, userId })
  },
  
  appointmentCompleted: (appointmentId: string, userId: string) => {
    logRocketUtils.track('appointment_completed', { appointmentId, userId })
  },
  
  // Relatórios
  reportGenerated: (reportType: string, userId: string) => {
    logRocketUtils.track('report_generated', { reportType, userId })
  },
  
  // Notificações
  notificationSent: (type: string, channel: string, success: boolean) => {
    logRocketUtils.track('notification_sent', { type, channel, success })
  },
  
  // Performance
  pageLoad: (page: string, loadTime: number) => {
    logRocketUtils.track('page_load', { page, loadTime })
  },
  
  apiCall: (endpoint: string, method: string, duration: number, status: number) => {
    logRocketUtils.track('api_call', { endpoint, method, duration, status })
  }
}

/**
 * Hook para usar LogRocket em componentes React
 */
export function useLogRocket() {
  return {
    identify: logRocketUtils.identify,
    track: logRocketUtils.track,
    captureException: logRocketUtils.captureException,
    captureMessage: logRocketUtils.captureMessage,
    addBreadcrumb: logRocketUtils.addBreadcrumb,
    setContext: logRocketUtils.setContext,
    getSessionURL: logRocketUtils.getSessionURL,
    events: fisioFlowEvents
  }
}

// Inicializar automaticamente quando o módulo for carregado
if (typeof window !== 'undefined') {
  // Aguardar um pouco para garantir que o DOM esteja pronto
  setTimeout(() => {
    initLogRocket()
  }, 100)
}
