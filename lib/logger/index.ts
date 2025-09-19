/**
 * Sistema de Logging Profissional
 * Substitui console.log com logging estruturado e seguro
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';
  private logLevel: LogLevel = this.isDevelopment ? 'debug' : 'info';

  /**
   * Sanitiza dados sensíveis antes de logar
   */
  private sanitize(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveKeys = [
      'password',
      'senha',
      'token',
      'apiKey',
      'secret',
      'cpf',
      'rg',
      'email',
      'telefone',
      'phone',
      'creditCard',
      'cartao',
      'cvv',
      'pin'
    ];

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      
      // Verifica se a chave contém informação sensível
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Formata a mensagem de log
   */
  private format(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(context && { context: this.sanitize(context) }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined
        }
      })
    };

    return JSON.stringify(logEntry);
  }

  /**
   * Verifica se deve logar baseado no nível
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Envia log para serviço externo em produção
   */
  private async sendToLogService(logMessage: string): Promise<void> {
    if (!this.isProduction) return;

    try {
      // TODO: Implementar envio para serviço de logging (ex: LogRocket, Sentry, DataDog)
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: logMessage
      // });
    } catch (error) {
      // Falha silenciosa para não quebrar a aplicação
      if (this.isDevelopment) {
        console.error('Failed to send log:', error);
      }
    }
  }

  /**
   * Log de debug (apenas desenvolvimento)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    
    const formatted = this.format('debug', message, context);
    
    if (this.isDevelopment) {
      console.debug('🐛', message, context || '');
    }
    
    this.sendToLogService(formatted);
  }

  /**
   * Log informativo
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    
    const formatted = this.format('info', message, context);
    
    if (this.isDevelopment) {
      console.info('ℹ️', message, context || '');
    }
    
    this.sendToLogService(formatted);
  }

  /**
   * Log de aviso
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    
    const formatted = this.format('warn', message, context);
    
    if (this.isDevelopment) {
      console.warn('⚠️', message, context || '');
    }
    
    this.sendToLogService(formatted);
  }

  /**
   * Log de erro
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog('error')) return;
    
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const formatted = this.format('error', message, context, errorObj);
    
    if (this.isDevelopment) {
      console.error('❌', message, errorObj, context || '');
    }
    
    this.sendToLogService(formatted);
  }

  /**
   * Log de erro fatal
   */
  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog('fatal')) return;
    
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const formatted = this.format('fatal', message, context, errorObj);
    
    // Sempre loga erros fatais no console
    console.error('💀 FATAL:', message, errorObj, context || '');
    
    this.sendToLogService(formatted);
    
    // Em produção, pode notificar administradores
    if (this.isProduction) {
      // TODO: Enviar notificação urgente para administradores
    }
  }

  /**
   * Log de performance
   */
  performance(operation: string, duration: number, context?: LogContext): void {
    const message = `Performance: ${operation} took ${duration}ms`;
    const perfContext = {
      ...context,
      operation,
      duration,
      slow: duration > 1000 // Marca como lento se > 1s
    };
    
    if (duration > 1000) {
      this.warn(message, perfContext);
    } else {
      this.info(message, perfContext);
    }
  }

  /**
   * Log de auditoria (sempre registrado)
   */
  audit(action: string, userId: string, details: any): void {
    const auditLog = {
      timestamp: new Date().toISOString(),
      action,
      userId,
      details: this.sanitize(details),
      ip: typeof window !== 'undefined' ? 'client' : 'server'
    };
    
    // Sempre registra logs de auditoria
    const formatted = JSON.stringify(auditLog);
    
    if (this.isDevelopment) {
      console.log('📝 AUDIT:', auditLog);
    }
    
    // Em produção, salvar no banco de dados
    this.sendToLogService(formatted);
  }

  /**
   * Medidor de tempo para performance
   */
  time(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.performance(label, Math.round(duration));
    };
  }

  /**
   * Cria um logger com contexto fixo
   */
  withContext(context: LogContext): Logger {
    const childLogger = Object.create(this);
    const originalMethods = ['debug', 'info', 'warn', 'error', 'fatal'];
    
    originalMethods.forEach(method => {
      const original = this[method as keyof Logger] as Function;
      childLogger[method] = (message: string, additionalContext?: LogContext) => {
        original.call(this, message, { ...context, ...additionalContext });
      };
    });
    
    return childLogger;
  }
}

// Exporta instância singleton
const logger = new Logger();

// Sobrescreve console.log em produção para evitar vazamentos
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.warn = (...args) => logger.warn('Console warning:', { args });
  console.error = (...args) => logger.error('Console error:', undefined, { args });
}

export default logger;
export { Logger, type LogLevel, type LogContext };