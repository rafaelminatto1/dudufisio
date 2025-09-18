/**
 * Configuração do Sentry para monitoramento de erros e performance
 */

import * as Sentry from '@sentry/nextjs'

// Configurar Sentry apenas se a DSN estiver disponível
if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    
    // Configurações de ambiente
    environment: process.env.NODE_ENV,
    release: process.env.npm_package_version || '1.0.0',
    
    // Configurações de performance
    tracesSampleRate: 0.1, // 10% das transações
    profilesSampleRate: 0.1, // 10% dos profiles
    
    // Configurações de erro
    sampleRate: 1.0, // 100% dos erros
    
    // Filtros de erro
    beforeSend(event, hint) {
      // Filtrar erros conhecidos que não são críticos
      if (event.exception) {
        const error = hint.originalException
        if (error instanceof Error) {
          // Filtrar erros de rede comuns
          if (error.message.includes('NetworkError') || 
              error.message.includes('Failed to fetch')) {
            return null
          }
          
          // Filtrar erros de timeout
          if (error.message.includes('timeout')) {
            return null
          }
        }
      }
      
      return event
    },
    
    // Configurações de integração
    integrations: [
      new Sentry.Integrations.Breadcrumbs({
        console: true,
        dom: true,
        fetch: true,
        history: true,
        sentry: true,
        xhr: true,
      }),
    ],
    
    // Configurações de tags padrão
    initialScope: {
      tags: {
        component: 'fisioflow',
        platform: 'web'
      }
    },
    
    // Configurações de contexto
    beforeBreadcrumb(breadcrumb) {
      // Filtrar breadcrumbs sensíveis
      if (breadcrumb.category === 'fetch' && breadcrumb.data?.url) {
        const url = breadcrumb.data.url as string
        
        // Remover dados sensíveis de URLs
        if (url.includes('password') || url.includes('token')) {
          breadcrumb.data.url = '[FILTERED]'
        }
      }
      
      return breadcrumb
    }
  })
}

// Funções utilitárias para logging estruturado
export const sentryLogger = {
  /**
   * Log de erro com contexto adicional
   */
  error: (message: string, error?: Error, context?: Record<string, any>) => {
    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setContext(key, value)
          })
        }
        
        if (error) {
          scope.setLevel('error')
          Sentry.captureException(error)
        } else {
          scope.setLevel('error')
          Sentry.captureMessage(message, 'error')
        }
      })
    }
    
    // Log local também
    console.error(message, error, context)
  },
  
  /**
   * Log de warning com contexto
   */
  warning: (message: string, context?: Record<string, any>) => {
    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setContext(key, value)
          })
        }
        scope.setLevel('warning')
        Sentry.captureMessage(message, 'warning')
      })
    }
    
    console.warn(message, context)
  },
  
  /**
   * Log de informação com contexto
   */
  info: (message: string, context?: Record<string, any>) => {
    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setContext(key, value)
          })
        }
        scope.setLevel('info')
        Sentry.captureMessage(message, 'info')
      })
    }
    
    console.info(message, context)
  },
  
  /**
   * Adicionar usuário ao contexto
   */
  setUser: (user: { id: string; email?: string; role?: string }) => {
    if (process.env.SENTRY_DSN) {
      Sentry.setUser(user)
    }
  },
  
  /**
   * Adicionar tags ao contexto
   */
  setTags: (tags: Record<string, string>) => {
    if (process.env.SENTRY_DSN) {
      Sentry.setTags(tags)
    }
  },
  
  /**
   * Adicionar contexto adicional
   */
  setContext: (key: string, context: any) => {
    if (process.env.SENTRY_DSN) {
      Sentry.setContext(key, context)
    }
  },
  
  /**
   * Capturar transação de performance
   */
  startTransaction: (name: string, op: string) => {
    if (process.env.SENTRY_DSN) {
      return Sentry.startTransaction({ name, op })
    }
    return null
  }
}

// HOC para capturar erros em componentes React
export function withSentryErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  return Sentry.withErrorBoundary(Component, {
    fallback: fallback || (({ error, resetError }) => (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
        <h2 className="text-lg font-semibold text-red-600 mb-2">
          Algo deu errado
        </h2>
        <p className="text-sm text-gray-600 mb-4 text-center">
          Ocorreu um erro inesperado. Tente recarregar a página.
        </p>
        <button
          onClick={resetError}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Tentar novamente
        </button>
      </div>
    )),
    beforeCapture: (scope, error, errorInfo) => {
      scope.setTag('component', Component.displayName || 'Unknown')
      scope.setContext('errorInfo', errorInfo)
    }
  })
}

// Hook para capturar erros em hooks personalizados
export function useSentryErrorCapture() {
  return (error: Error, context?: Record<string, any>) => {
    sentryLogger.error('Hook error captured', error, context)
  }
}

// Middleware para capturar erros em API routes
export function withSentryApiRoute<T extends any[]>(
  handler: (...args: T) => Promise<Response> | Response
) {
  return async (...args: T) => {
    try {
      return await handler(...args)
    } catch (error) {
      sentryLogger.error('API route error', error as Error, {
        route: args[0]?.url || 'unknown',
        method: args[0]?.method || 'unknown'
      })
      
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' 
            ? (error as Error).message 
            : 'Something went wrong'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}

export default Sentry
