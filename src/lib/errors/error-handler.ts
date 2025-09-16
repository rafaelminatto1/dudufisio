/**
 * Error Handler - FisioFlow
 * Sistema de tratamento de erros com mensagens em português
 * Compliance LGPD e integração com auditoria
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createAuditLogger, AuditEventType, AuditSeverity } from '@/lib/audit/audit-logger'

/**
 * Tipos de erro específicos do sistema de saúde
 */
export enum ErrorType {
  // Erros de autenticação
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_DENIED = 'AUTHORIZATION_DENIED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Erros de validação
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_CPF = 'INVALID_CPF',
  INVALID_CREFITO = 'INVALID_CREFITO',
  INVALID_PHONE = 'INVALID_PHONE',
  INVALID_EMAIL = 'INVALID_EMAIL',

  // Erros de dados de pacientes
  PATIENT_NOT_FOUND = 'PATIENT_NOT_FOUND',
  PATIENT_ACCESS_DENIED = 'PATIENT_ACCESS_DENIED',
  PATIENT_DATA_INCONSISTENT = 'PATIENT_DATA_INCONSISTENT',
  PATIENT_ALREADY_EXISTS = 'PATIENT_ALREADY_EXISTS',

  // Erros LGPD
  LGPD_CONSENT_REQUIRED = 'LGPD_CONSENT_REQUIRED',
  LGPD_CONSENT_EXPIRED = 'LGPD_CONSENT_EXPIRED',
  LGPD_DATA_EXPORT_FAILED = 'LGPD_DATA_EXPORT_FAILED',
  LGPD_DELETION_DENIED = 'LGPD_DELETION_DENIED',

  // Erros de banco de dados
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  DATABASE_CONSTRAINT_VIOLATION = 'DATABASE_CONSTRAINT_VIOLATION',

  // Erros de API externa
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  SUPABASE_ERROR = 'SUPABASE_ERROR',

  // Erros de sistema
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Erros de negócio
  APPOINTMENT_CONFLICT = 'APPOINTMENT_CONFLICT',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  PRESCRIPTION_EXPIRED = 'PRESCRIPTION_EXPIRED',
  EXERCISE_NOT_AVAILABLE = 'EXERCISE_NOT_AVAILABLE',

  // Erros de supervisão
  SUPERVISION_REQUIRED = 'SUPERVISION_REQUIRED',
  INTERN_PERMISSION_DENIED = 'INTERN_PERMISSION_DENIED',
  SUPERVISOR_NOT_AVAILABLE = 'SUPERVISOR_NOT_AVAILABLE'
}

/**
 * Interface para erro customizado
 */
export interface CustomError extends Error {
  type: ErrorType
  code: string
  statusCode: number
  userMessage: string
  technicalMessage: string
  suggestions?: string[]
  metadata?: Record<string, any>
  shouldAudit: boolean
  auditSeverity: AuditSeverity
}

/**
 * Mensagens de erro em português brasileiro
 */
const ERROR_MESSAGES: Record<ErrorType, {
  userMessage: string
  technicalMessage: string
  statusCode: number
  suggestions?: string[]
  auditSeverity: AuditSeverity
}> = {
  // Autenticação
  [ErrorType.AUTHENTICATION_FAILED]: {
    userMessage: 'Falha na autenticação. Verifique suas credenciais.',
    technicalMessage: 'Authentication failed - invalid credentials provided',
    statusCode: 401,
    suggestions: ['Verifique se o email está correto', 'Confirme se a senha está correta', 'Tente redefinir sua senha'],
    auditSeverity: AuditSeverity.MEDIUM
  },

  [ErrorType.AUTHORIZATION_DENIED]: {
    userMessage: 'Você não tem permissão para realizar esta ação.',
    technicalMessage: 'User lacks required permissions for this operation',
    statusCode: 403,
    suggestions: ['Entre em contato com o administrador', 'Verifique se você tem o papel correto'],
    auditSeverity: AuditSeverity.HIGH
  },

  [ErrorType.SESSION_EXPIRED]: {
    userMessage: 'Sua sessão expirou. Faça login novamente.',
    technicalMessage: 'User session has expired or is invalid',
    statusCode: 401,
    suggestions: ['Clique em "Fazer Login" para continuar'],
    auditSeverity: AuditSeverity.LOW
  },

  [ErrorType.INVALID_CREDENTIALS]: {
    userMessage: 'Email ou senha incorretos.',
    technicalMessage: 'Invalid email or password provided',
    statusCode: 401,
    suggestions: ['Verifique se o email está correto', 'Confirme se a senha está correta'],
    auditSeverity: AuditSeverity.MEDIUM
  },

  // Validação
  [ErrorType.VALIDATION_ERROR]: {
    userMessage: 'Dados inválidos fornecidos.',
    technicalMessage: 'Validation failed for provided data',
    statusCode: 422,
    suggestions: ['Verifique todos os campos obrigatórios', 'Confirme se os dados estão no formato correto'],
    auditSeverity: AuditSeverity.LOW
  },

  [ErrorType.INVALID_CPF]: {
    userMessage: 'CPF inválido. Verifique o formato: 000.000.000-00',
    technicalMessage: 'Invalid CPF format or checksum',
    statusCode: 422,
    suggestions: ['Use apenas números', 'Verifique se todos os 11 dígitos foram inseridos'],
    auditSeverity: AuditSeverity.LOW
  },

  [ErrorType.INVALID_CREFITO]: {
    userMessage: 'Número CREFITO inválido.',
    technicalMessage: 'Invalid CREFITO professional registration number',
    statusCode: 422,
    suggestions: ['Verifique o número com o conselho regional', 'Confirme se está ativo e regular'],
    auditSeverity: AuditSeverity.MEDIUM
  },

  [ErrorType.INVALID_PHONE]: {
    userMessage: 'Número de telefone inválido. Use o formato: (11) 99999-9999',
    technicalMessage: 'Invalid Brazilian phone number format',
    statusCode: 422,
    suggestions: ['Inclua o DDD', 'Use o formato correto com parênteses e hífen'],
    auditSeverity: AuditSeverity.LOW
  },

  [ErrorType.INVALID_EMAIL]: {
    userMessage: 'Email inválido. Verifique o formato.',
    technicalMessage: 'Invalid email address format',
    statusCode: 422,
    suggestions: ['Verifique se contém @ e domínio válido'],
    auditSeverity: AuditSeverity.LOW
  },

  // Pacientes
  [ErrorType.PATIENT_NOT_FOUND]: {
    userMessage: 'Paciente não encontrado.',
    technicalMessage: 'Patient record not found in database',
    statusCode: 404,
    suggestions: ['Verifique se o CPF está correto', 'Confirme se o paciente está cadastrado'],
    auditSeverity: AuditSeverity.MEDIUM
  },

  [ErrorType.PATIENT_ACCESS_DENIED]: {
    userMessage: 'Acesso negado aos dados deste paciente.',
    technicalMessage: 'User lacks permission to access this patient data',
    statusCode: 403,
    suggestions: ['Verifique se o paciente pertence à sua organização', 'Entre em contato com o supervisor'],
    auditSeverity: AuditSeverity.HIGH
  },

  [ErrorType.PATIENT_DATA_INCONSISTENT]: {
    userMessage: 'Dados do paciente inconsistentes. Verifique as informações.',
    technicalMessage: 'Patient data validation failed - inconsistent information',
    statusCode: 422,
    suggestions: ['Confirme se todos os dados estão corretos', 'Verifique se não há conflitos'],
    auditSeverity: AuditSeverity.MEDIUM
  },

  [ErrorType.PATIENT_ALREADY_EXISTS]: {
    userMessage: 'Já existe um paciente cadastrado com este CPF.',
    technicalMessage: 'Patient with this CPF already exists in the system',
    statusCode: 409,
    suggestions: ['Verifique se o paciente já não está cadastrado', 'Use a função de busca'],
    auditSeverity: AuditSeverity.MEDIUM
  },

  // LGPD
  [ErrorType.LGPD_CONSENT_REQUIRED]: {
    userMessage: 'Consentimento LGPD necessário para processar dados pessoais.',
    technicalMessage: 'LGPD consent required for personal data processing',
    statusCode: 403,
    suggestions: ['Solicite consentimento do paciente', 'Verifique se o termo foi assinado'],
    auditSeverity: AuditSeverity.HIGH
  },

  [ErrorType.LGPD_CONSENT_EXPIRED]: {
    userMessage: 'Consentimento LGPD expirado. Renovação necessária.',
    technicalMessage: 'LGPD consent has expired and needs renewal',
    statusCode: 403,
    suggestions: ['Renove o consentimento com o paciente', 'Atualize o termo de consentimento'],
    auditSeverity: AuditSeverity.HIGH
  },

  [ErrorType.LGPD_DATA_EXPORT_FAILED]: {
    userMessage: 'Falha na exportação de dados. Tente novamente.',
    technicalMessage: 'LGPD data export process failed',
    statusCode: 500,
    suggestions: ['Tente novamente em alguns minutos', 'Entre em contato com suporte se persistir'],
    auditSeverity: AuditSeverity.MEDIUM
  },

  [ErrorType.LGPD_DELETION_DENIED]: {
    userMessage: 'Exclusão negada. Dados necessários para cumprimento legal.',
    technicalMessage: 'Data deletion denied due to legal retention requirements',
    statusCode: 403,
    suggestions: ['Verifique se não há obrigação legal de retenção', 'Consulte o jurídico'],
    auditSeverity: AuditSeverity.HIGH
  },

  // Banco de dados
  [ErrorType.DATABASE_CONNECTION_ERROR]: {
    userMessage: 'Erro de conexão com o banco de dados. Tente novamente.',
    technicalMessage: 'Database connection failed',
    statusCode: 503,
    suggestions: ['Aguarde alguns minutos e tente novamente', 'Verifique sua conexão com a internet'],
    auditSeverity: AuditSeverity.CRITICAL
  },

  [ErrorType.DATABASE_QUERY_ERROR]: {
    userMessage: 'Erro ao processar dados. Tente novamente.',
    technicalMessage: 'Database query execution failed',
    statusCode: 500,
    suggestions: ['Tente novamente', 'Entre em contato com suporte se persistir'],
    auditSeverity: AuditSeverity.HIGH
  },

  [ErrorType.DATABASE_CONSTRAINT_VIOLATION]: {
    userMessage: 'Violação de regra de dados. Verifique as informações.',
    technicalMessage: 'Database constraint violation',
    statusCode: 422,
    suggestions: ['Verifique se todos os dados são únicos', 'Confirme relacionamentos entre dados'],
    auditSeverity: AuditSeverity.MEDIUM
  },

  // API Externa
  [ErrorType.EXTERNAL_API_ERROR]: {
    userMessage: 'Erro em serviço externo. Tente novamente.',
    technicalMessage: 'External API service error',
    statusCode: 502,
    suggestions: ['Aguarde alguns minutos', 'Verifique se o serviço está disponível'],
    auditSeverity: AuditSeverity.MEDIUM
  },

  [ErrorType.SUPABASE_ERROR]: {
    userMessage: 'Erro no sistema de dados. Tente novamente.',
    technicalMessage: 'Supabase service error',
    statusCode: 502,
    suggestions: ['Aguarde alguns minutos', 'Verifique sua conexão'],
    auditSeverity: AuditSeverity.HIGH
  },

  // Sistema
  [ErrorType.INTERNAL_SERVER_ERROR]: {
    userMessage: 'Erro interno do servidor. Nossa equipe foi notificada.',
    technicalMessage: 'Internal server error occurred',
    statusCode: 500,
    suggestions: ['Tente novamente em alguns minutos', 'Entre em contato com suporte se persistir'],
    auditSeverity: AuditSeverity.CRITICAL
  },

  [ErrorType.SERVICE_UNAVAILABLE]: {
    userMessage: 'Serviço temporariamente indisponível. Tente novamente.',
    technicalMessage: 'Service temporarily unavailable',
    statusCode: 503,
    suggestions: ['Aguarde alguns minutos', 'Verifique se há manutenção programada'],
    auditSeverity: AuditSeverity.HIGH
  },

  [ErrorType.RATE_LIMIT_EXCEEDED]: {
    userMessage: 'Muitas tentativas. Aguarde antes de tentar novamente.',
    technicalMessage: 'Rate limit exceeded for this user/IP',
    statusCode: 429,
    suggestions: ['Aguarde alguns minutos', 'Evite fazer muitas requisições rapidamente'],
    auditSeverity: AuditSeverity.MEDIUM
  },

  // Negócio
  [ErrorType.APPOINTMENT_CONFLICT]: {
    userMessage: 'Conflito de agendamento. Horário já ocupado.',
    technicalMessage: 'Appointment scheduling conflict detected',
    statusCode: 409,
    suggestions: ['Escolha outro horário', 'Verifique a agenda do profissional'],
    auditSeverity: AuditSeverity.LOW
  },

  [ErrorType.SESSION_NOT_FOUND]: {
    userMessage: 'Sessão de tratamento não encontrada.',
    technicalMessage: 'Treatment session not found',
    statusCode: 404,
    suggestions: ['Verifique se a sessão existe', 'Confirme se tem acesso a esta sessão'],
    auditSeverity: AuditSeverity.LOW
  },

  [ErrorType.PRESCRIPTION_EXPIRED]: {
    userMessage: 'Prescrição expirada. Solicite nova avaliação.',
    technicalMessage: 'Exercise prescription has expired',
    statusCode: 410,
    suggestions: ['Agende nova consulta', 'Solicite reavaliação com fisioterapeuta'],
    auditSeverity: AuditSeverity.LOW
  },

  [ErrorType.EXERCISE_NOT_AVAILABLE]: {
    userMessage: 'Exercício não disponível ou removido.',
    technicalMessage: 'Exercise not found or has been removed',
    statusCode: 404,
    suggestions: ['Consulte exercícios alternativos', 'Entre em contato com fisioterapeuta'],
    auditSeverity: AuditSeverity.LOW
  },

  // Supervisão
  [ErrorType.SUPERVISION_REQUIRED]: {
    userMessage: 'Supervisão necessária para esta ação.',
    technicalMessage: 'Supervised access required for intern actions',
    statusCode: 403,
    suggestions: ['Solicite supervisão', 'Entre em contato com seu supervisor'],
    auditSeverity: AuditSeverity.MEDIUM
  },

  [ErrorType.INTERN_PERMISSION_DENIED]: {
    userMessage: 'Estagiários não podem realizar esta ação.',
    technicalMessage: 'Action not permitted for intern role',
    statusCode: 403,
    suggestions: ['Solicite ajuda do supervisor', 'Esta ação requer fisioterapeuta qualificado'],
    auditSeverity: AuditSeverity.MEDIUM
  },

  [ErrorType.SUPERVISOR_NOT_AVAILABLE]: {
    userMessage: 'Supervisor não disponível no momento.',
    technicalMessage: 'Assigned supervisor is not currently available',
    statusCode: 503,
    suggestions: ['Tente novamente mais tarde', 'Entre em contato com outro supervisor'],
    auditSeverity: AuditSeverity.LOW
  }
}

/**
 * Classe principal para tratamento de erros
 */
export class ErrorHandler {
  /**
   * Criar erro customizado
   */
  static createError(
    type: ErrorType,
    technicalDetails?: string,
    metadata?: Record<string, any>
  ): CustomError {
    const errorConfig = ERROR_MESSAGES[type]

    const error = new Error(errorConfig.userMessage) as CustomError
    error.type = type
    error.code = type
    error.statusCode = errorConfig.statusCode
    error.userMessage = errorConfig.userMessage
    error.technicalMessage = technicalDetails || errorConfig.technicalMessage
    error.suggestions = errorConfig.suggestions
    error.metadata = metadata
    error.shouldAudit = true
    error.auditSeverity = errorConfig.auditSeverity

    return error
  }

  /**
   * Manipular erro de validação Zod
   */
  static handleZodError(zodError: ZodError): CustomError {
    const firstError = zodError.issues[0]
    const fieldName = firstError.path.join('.')
    const message = firstError.message

    return this.createError(
      ErrorType.VALIDATION_ERROR,
      `Validation failed for field ${fieldName}: ${message}`,
      {
        field: fieldName,
        zodErrors: zodError.issues,
        originalMessage: message
      }
    )
  }

  /**
   * Manipular erro de Supabase
   */
  static handleSupabaseError(supabaseError: any): CustomError {
    // Mapear códigos de erro específicos do Supabase
    const errorCode = supabaseError.code

    if (errorCode === '23505') { // Unique violation
      return this.createError(
        ErrorType.DATABASE_CONSTRAINT_VIOLATION,
        `Unique constraint violation: ${supabaseError.message}`,
        { supabaseCode: errorCode, supabaseMessage: supabaseError.message }
      )
    }

    if (errorCode === 'PGRST116') { // Row not found
      return this.createError(
        ErrorType.PATIENT_NOT_FOUND,
        `Resource not found: ${supabaseError.message}`,
        { supabaseCode: errorCode }
      )
    }

    // Erro genérico do Supabase
    return this.createError(
      ErrorType.SUPABASE_ERROR,
      supabaseError.message,
      { supabaseCode: errorCode, supabaseDetails: supabaseError.details }
    )
  }

  /**
   * Manipular resposta HTTP para APIs
   */
  static async handleApiError(
    error: unknown,
    request?: NextRequest,
    userId?: string,
    orgId?: string
  ): Promise<NextResponse> {
    let customError: CustomError

    // Determinar tipo de erro
    if (error instanceof ZodError) {
      customError = this.handleZodError(error)
    } else if (this.isSupabaseError(error)) {
      customError = this.handleSupabaseError(error)
    } else if (this.isCustomError(error)) {
      customError = error as CustomError
    } else {
      // Erro desconhecido
      customError = this.createError(
        ErrorType.INTERNAL_SERVER_ERROR,
        error instanceof Error ? error.message : 'Unknown error occurred',
        { originalError: error }
      )
    }

    // Registrar auditoria se necessário
    if (customError.shouldAudit && userId && orgId) {
      await this.logErrorToAudit(customError, userId, orgId, request)
    }

    // Resposta da API
    const response = {
      error: {
        type: customError.type,
        code: customError.code,
        message: customError.userMessage,
        suggestions: customError.suggestions,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && {
          technicalMessage: customError.technicalMessage,
          metadata: customError.metadata
        })
      }
    }

    return NextResponse.json(response, { status: customError.statusCode })
  }

  /**
   * Registrar erro no sistema de auditoria
   */
  private static async logErrorToAudit(
    error: CustomError,
    userId: string,
    orgId: string,
    request?: NextRequest
  ): Promise<void> {
    try {
      const logger = await createAuditLogger(userId, orgId)

      await logger.log({
        event_type: AuditEventType.SECURITY_BREACH_ATTEMPT,
        table_name: 'error_logs',
        operation: 'error_occurred',
        severity: error.auditSeverity,
        success: false,
        error_message: error.technicalMessage,
        additional_data: {
          errorType: error.type,
          errorCode: error.code,
          userMessage: error.userMessage,
          statusCode: error.statusCode,
          url: request?.url,
          method: request?.method,
          userAgent: request?.headers.get('user-agent'),
          metadata: error.metadata
        }
      })
    } catch (auditError) {
      console.error('Failed to log error to audit system:', auditError)
    }
  }

  /**
   * Verificar se é erro do Supabase
   */
  private static isSupabaseError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      ('code' in error || 'message' in error) &&
      ('details' in error || 'hint' in error)
    )
  }

  /**
   * Verificar se é erro customizado
   */
  static isCustomError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      'code' in error &&
      'statusCode' in error
    )
  }
}

/**
 * Middleware para capturar erros não tratados
 */
export function withErrorHandler(handler: (...args: any[]) => Promise<any>) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      return await handler(request, ...args)
    } catch (error) {
      console.error('Unhandled error in API route:', error)
      return ErrorHandler.handleApiError(error, request)
    }
  }
}

/**
 * Hook para tratamento de erros em React
 */
export function useErrorHandler() {
  const handleError = (error: unknown) => {
    if (ErrorHandler.isCustomError(error)) {
      const customError = error as CustomError
      return {
        message: customError.userMessage,
        suggestions: customError.suggestions,
        type: customError.type
      }
    }

    // Erro genérico
    return {
      message: 'Ocorreu um erro inesperado. Tente novamente.',
      suggestions: ['Recarregue a página', 'Tente novamente em alguns minutos'],
      type: ErrorType.INTERNAL_SERVER_ERROR
    }
  }

  return { handleError }
}

export default ErrorHandler