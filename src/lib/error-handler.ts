/**
 * Enhanced Error Handling for FisioFlow
 * Provides standardized error handling across the application
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { PostgrestError } from '@supabase/supabase-js'
import logger from './logger'

// Error types
export enum ErrorCode {
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',

  // Business Logic
  APPOINTMENT_CONFLICT = 'APPOINTMENT_CONFLICT',
  PATIENT_ALREADY_EXISTS = 'PATIENT_ALREADY_EXISTS',

  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // LGPD Compliance
  DATA_DELETION_PENDING = 'DATA_DELETION_PENDING',
  CONSENT_REQUIRED = 'CONSENT_REQUIRED'
}

export interface AppError {
  code: ErrorCode
  message: string
  details?: unknown
  statusCode: number
  userMessage?: string
  timestamp: string
  requestId?: string
}

export class FisioFlowError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly userMessage?: string
  public readonly details?: unknown
  public readonly timestamp: string
  public readonly requestId?: string

  constructor(
    code: ErrorCode,
    message: string,
    statusCode = 500,
    userMessage?: string,
    details?: unknown,
    requestId?: string
  ) {
    super(message)
    this.name = 'FisioFlowError'
    this.code = code
    this.statusCode = statusCode
    this.userMessage = userMessage
    this.details = details
    this.timestamp = new Date().toISOString()
    this.requestId = requestId
  }
}

/**
 * Handle different types of errors and convert to standardized format
 */
export function handleError(error: unknown, requestId?: string): AppError {
  const timestamp = new Date().toISOString()

  // FisioFlow custom errors
  if (error instanceof FisioFlowError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      statusCode: error.statusCode,
      userMessage: error.userMessage,
      timestamp: error.timestamp,
      requestId: error.requestId || requestId
    }
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return {
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Dados inválidos fornecidos',
      details: error.errors,
      statusCode: 422,
      userMessage: 'Por favor, verifique os dados fornecidos',
      timestamp,
      requestId
    }
  }

  // Supabase/PostgreSQL errors
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError

    // Map common PostgreSQL error codes
    const pgErrorMap: Record<string, { code: ErrorCode; message: string; status: number }> = {
      '23505': {
        code: ErrorCode.CONSTRAINT_VIOLATION,
        message: 'Registro duplicado',
        status: 409
      },
      '23503': {
        code: ErrorCode.CONSTRAINT_VIOLATION,
        message: 'Violação de referência',
        status: 409
      },
      '42P01': {
        code: ErrorCode.DATABASE_ERROR,
        message: 'Tabela não encontrada',
        status: 500
      },
      'PGRST116': {
        code: ErrorCode.RECORD_NOT_FOUND,
        message: 'Registro não encontrado',
        status: 404
      }
    }

    const mappedError = pgErrorMap[pgError.code || '']
    if (mappedError) {
      return {
        code: mappedError.code,
        message: mappedError.message,
        details: { originalError: pgError },
        statusCode: mappedError.status,
        userMessage: mappedError.message,
        timestamp,
        requestId
      }
    }

    return {
      code: ErrorCode.DATABASE_ERROR,
      message: 'Erro no banco de dados',
      details: { originalError: pgError },
      statusCode: 500,
      userMessage: 'Erro interno. Tente novamente.',
      timestamp,
      requestId
    }
  }

  // Generic JavaScript errors
  if (error instanceof Error) {
    // Don't expose internal error messages to users
    const userMessage = error.message.includes('ECONNREFUSED')
      ? 'Serviço temporariamente indisponível'
      : 'Erro interno. Tente novamente.'

    return {
      code: ErrorCode.INTERNAL_ERROR,
      message: error.message,
      details: { stack: error.stack },
      statusCode: 500,
      userMessage,
      timestamp,
      requestId
    }
  }

  // Unknown error type
  return {
    code: ErrorCode.INTERNAL_ERROR,
    message: 'Erro desconhecido',
    details: { originalError: error },
    statusCode: 500,
    userMessage: 'Erro interno. Tente novamente.',
    timestamp,
    requestId
  }
}

/**
 * Create a standardized error response for APIs
 */
export function createErrorResponse(error: unknown, requestId?: string): NextResponse {
  const appError = handleError(error, requestId)

  // Log error for monitoring
  logger.error('API Error', {
    code: appError.code,
    message: appError.message,
    details: appError.details,
    statusCode: appError.statusCode,
    requestId: appError.requestId,
    timestamp: appError.timestamp
  })

  return NextResponse.json(
    {
      success: false,
      error: {
        code: appError.code,
        message: appError.userMessage || appError.message,
        timestamp: appError.timestamp,
        requestId: appError.requestId
      }
    },
    { status: appError.statusCode }
  )
}

/**
 * Common error creators for convenience
 */
export const errors = {
  unauthorized: (message = 'Não autorizado', requestId?: string) =>
    new FisioFlowError(ErrorCode.UNAUTHORIZED, message, 401, message, undefined, requestId),

  forbidden: (message = 'Acesso negado', requestId?: string) =>
    new FisioFlowError(ErrorCode.FORBIDDEN, message, 403, message, undefined, requestId),

  notFound: (resource = 'Registro', requestId?: string) =>
    new FisioFlowError(
      ErrorCode.RECORD_NOT_FOUND,
      `${resource} não encontrado`,
      404,
      `${resource} não encontrado`,
      undefined,
      requestId
    ),

  validation: (message = 'Dados inválidos', details?: unknown, requestId?: string) =>
    new FisioFlowError(
      ErrorCode.VALIDATION_ERROR,
      message,
      422,
      'Por favor, verifique os dados fornecidos',
      details,
      requestId
    ),

  conflict: (message = 'Conflito de dados', requestId?: string) =>
    new FisioFlowError(ErrorCode.CONSTRAINT_VIOLATION, message, 409, message, undefined, requestId),

  internal: (message = 'Erro interno', requestId?: string) =>
    new FisioFlowError(
      ErrorCode.INTERNAL_ERROR,
      message,
      500,
      'Erro interno. Tente novamente.',
      undefined,
      requestId
    ),

  appointmentConflict: (message = 'Conflito de agendamento', requestId?: string) =>
    new FisioFlowError(
      ErrorCode.APPOINTMENT_CONFLICT,
      message,
      409,
      'Horário não disponível para agendamento',
      undefined,
      requestId
    ),

  lgpdConsentRequired: (requestId?: string) =>
    new FisioFlowError(
      ErrorCode.CONSENT_REQUIRED,
      'Consentimento LGPD necessário',
      403,
      'É necessário aceitar os termos de uso e política de privacidade',
      undefined,
      requestId
    )
}

/**
 * Middleware for handling async route errors
 */
export function withErrorHandler<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return createErrorResponse(error)
    }
  }
}