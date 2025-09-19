import logger from '../../../lib/logger';

/**
 * Sistema de Logging Profissional para FisioFlow
 * Centraliza todos os logs com níveis apropriados e formatação consistente
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

interface LogContext {
  userId?: string
  sessionId?: string
  patientId?: string
  organizationId?: string
  action?: string
  module?: string
  ipAddress?: string
  userAgent?: string
}

interface LogEntry {
  level: LogLevel
  message: string
  context?: LogContext
  timestamp: string
  error?: Error
  stack?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString()
    const level = LogLevel[entry.level]
    const prefix = `[${timestamp}] ${level}:`

    if (entry.context) {
      const contextStr = Object.entries(entry.context)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ')

      return `${prefix} ${entry.message} | ${contextStr}`
    }

    return `${prefix} ${entry.message}`
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      error,
      stack: error?.stack
    }

    // Em produção, apenas logs WARN ou superiores
    if (this.isProduction && level < LogLevel.WARN) {
      return
    }

    const formattedMessage = this.formatMessage(entry)

    // Console output apenas em desenvolvimento
    if (this.isDevelopment) {
      switch (level) {
        case LogLevel.DEBUG:
          logger.debug(formattedMessage)
          break
        case LogLevel.INFO:
          logger.info(formattedMessage)
          break
        case LogLevel.WARN:
          logger.warn(formattedMessage)
          break
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
          logger.error(formattedMessage, error)
          break
      }
    }

    // Em produção, enviar para sistema de logging externo
    if (this.isProduction) {
      this.sendToExternalLogger(entry)
    }

    // Logs críticos sempre vão para auditoria
    if (level >= LogLevel.ERROR) {
      this.sendToAuditSystem(entry)
    }
  }

  private async sendToExternalLogger(entry: LogEntry) {
    try {
      // Integração com serviços como Sentry, LogRocket, etc.
      // Por enquanto, mantém em arquivo local
      if (typeof window === 'undefined') {
        const fs = await import('fs')
        const path = await import('path')

        const logDir = path.join(process.cwd(), 'logs')
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true })
        }

        const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`)
        const logLine = JSON.stringify(entry) + '\n'

        fs.appendFileSync(logFile, logLine)
      }
    } catch (error) {
      // Fallback silencioso para não quebrar a aplicação
    }
  }

  private async sendToAuditSystem(entry: LogEntry) {
    try {
      // Integração com sistema de auditoria LGPD
      // Será implementado junto com o módulo de auditoria
    } catch (error) {
      // Fallback silencioso
    }
  }

  // Métodos públicos
  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: LogContext, error?: Error) {
    this.log(LogLevel.WARN, message, context, error)
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error)
  }

  critical(message: string, context?: LogContext, error?: Error) {
    this.log(LogLevel.CRITICAL, message, context, error)
  }

  // Métodos específicos para domínios da aplicação
  auth(message: string, context?: LogContext) {
    this.info(`[AUTH] ${message}`, { ...context, module: 'auth' })
  }

  patient(message: string, context?: LogContext) {
    this.info(`[PATIENT] ${message}`, { ...context, module: 'patient' })
  }

  lgpd(message: string, context?: LogContext) {
    this.info(`[LGPD] ${message}`, { ...context, module: 'lgpd' })
  }

  audit(message: string, context?: LogContext) {
    this.info(`[AUDIT] ${message}`, { ...context, module: 'audit' })
  }

  api(message: string, context?: LogContext) {
    this.info(`[API] ${message}`, { ...context, module: 'api' })
  }

  security(message: string, context?: LogContext, error?: Error) {
    this.warn(`[SECURITY] ${message}`, { ...context, module: 'security' }, error)
  }
}

// Instância global do logger
export const logger = new Logger()

// Helpers para contexto comum
export const createLogContext = (req?: Request): LogContext => {
  const context: LogContext = {}

  if (req) {
    context.ipAddress = req.headers.get('x-forwarded-for') ||
                       req.headers.get('x-real-ip') ||
                       'unknown'
    context.userAgent = req.headers.get('user-agent') || 'unknown'
  }

  return context
}

export const withUserContext = (context: LogContext, user: any): LogContext => ({
  ...context,
  userId: user?.id,
  organizationId: user?.org_id
})

export const withPatientContext = (context: LogContext, patientId: string): LogContext => ({
  ...context,
  patientId
})