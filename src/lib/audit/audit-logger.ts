/**
 * Audit Logger - FisioFlow
 * Sistema de auditoria para compliance LGPD e CFM
 * Registra todos os acessos e modificações de dados de saúde
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database, UserRole } from '@/lib/supabase/database.types'

/**
 * Tipos de eventos auditáveis segundo LGPD Art. 37
 */
export enum AuditEventType {
  // Autenticação e autorização
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_ACCESS_DENIED = 'user_access_denied',
  SESSION_EXPIRED = 'session_expired',
  PASSWORD_CHANGED = 'password_changed',

  // Operações CRUD em dados de pacientes
  PATIENT_CREATED = 'patient_created',
  PATIENT_VIEWED = 'patient_viewed',
  PATIENT_UPDATED = 'patient_updated',
  PATIENT_DELETED = 'patient_deleted',
  PATIENT_EXPORTED = 'patient_exported',

  // Avaliações e prontuários
  ASSESSMENT_CREATED = 'assessment_created',
  ASSESSMENT_VIEWED = 'assessment_viewed',
  ASSESSMENT_UPDATED = 'assessment_updated',
  ASSESSMENT_DELETED = 'assessment_deleted',

  // Sessões de tratamento
  SESSION_CREATED = 'session_created',
  SESSION_VIEWED = 'session_viewed',
  SESSION_UPDATED = 'session_updated',
  SESSION_COMPLETED = 'session_completed',

  // Prescrições e exercícios
  PRESCRIPTION_CREATED = 'prescription_created',
  PRESCRIPTION_VIEWED = 'prescription_viewed',
  PRESCRIPTION_UPDATED = 'prescription_updated',
  PRESCRIPTION_COMPLETED = 'prescription_completed',

  // Mapeamento corporal e dor
  PAIN_POINT_CREATED = 'pain_point_created',
  PAIN_POINT_VIEWED = 'pain_point_viewed',
  PAIN_POINT_UPDATED = 'pain_point_updated',

  // Relatórios e exportações
  REPORT_GENERATED = 'report_generated',
  REPORT_EXPORTED = 'report_exported',
  DATA_EXPORTED = 'data_exported',

  // Eventos LGPD específicos
  LGPD_CONSENT_GIVEN = 'lgpd_consent_given',
  LGPD_CONSENT_WITHDRAWN = 'lgpd_consent_withdrawn',
  LGPD_DATA_REQUEST = 'lgpd_data_request',
  LGPD_DATA_CORRECTION = 'lgpd_data_correction',
  LGPD_DATA_DELETION = 'lgpd_data_deletion',
  LGPD_DATA_PORTABILITY = 'lgpd_data_portability',

  // Eventos de segurança
  SECURITY_BREACH_ATTEMPT = 'security_breach_attempt',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_LEAK_DETECTED = 'data_leak_detected',

  // Administração organizacional
  ORG_USER_INVITED = 'org_user_invited',
  ORG_USER_REMOVED = 'org_user_removed',
  ORG_SETTINGS_CHANGED = 'org_settings_changed',
  ORG_DATA_BACKUP = 'org_data_backup',

  // Supervisão educacional
  INTERN_ACTIVITY_SUPERVISED = 'intern_activity_supervised',
  INTERN_EVALUATION_COMPLETED = 'intern_evaluation_completed'
}

/**
 * Níveis de criticidade do evento
 */
export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Interface para entrada de auditoria
 */
export interface AuditLogEntry {
  event_type: AuditEventType
  table_name: string
  operation: string
  user_id: string
  org_id: string
  resource_id?: string
  patient_id?: string
  ip_address?: string
  user_agent?: string
  severity: AuditSeverity
  success: boolean
  error_message?: string
  additional_data?: Record<string, any>
  lgpd_basis?: LgpdLegalBasis
  retention_period?: number // em anos
}

/**
 * Base legal LGPD para processamento de dados
 */
export enum LgpdLegalBasis {
  CONSENT = 'consent', // Art. 7, I
  CONTRACT = 'contract', // Art. 7, V
  LEGAL_OBLIGATION = 'legal_obligation', // Art. 7, II
  VITAL_INTERESTS = 'vital_interests', // Art. 7, IV
  PUBLIC_INTEREST = 'public_interest', // Art. 7, III
  LEGITIMATE_INTERESTS = 'legitimate_interests', // Art. 7, IX
  HEALTH_PROTECTION = 'health_protection' // Art. 11, II, a
}

/**
 * Classe principal do audit logger
 */
export class AuditLogger {
  private supabase: ReturnType<typeof createServerClient>
  private userId?: string
  private orgId?: string
  private userRole?: UserRole

  constructor(userId?: string, orgId?: string, userRole?: UserRole) {
    this.supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            const cookieStore = await cookies()
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    this.userId = userId
    this.orgId = orgId
    this.userRole = userRole
  }

  /**
   * Registrar evento de auditoria
   */
  async log(entry: Partial<AuditLogEntry> & {
    event_type: AuditEventType
    table_name: string
    operation: string
  }): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        user_id: this.userId || 'system',
        org_id: this.orgId || 'unknown',
        severity: AuditSeverity.MEDIUM,
        success: true,
        ip_address: await this.getClientIP(),
        user_agent: await this.getUserAgent(),
        lgpd_basis: this.determineLgpdBasis(entry.event_type),
        retention_period: this.getRetentionPeriod(entry.event_type),
        additional_data: {
          timestamp: new Date().toISOString(),
          user_role: this.userRole,
          environment: process.env.NODE_ENV,
          ...entry.additional_data
        },
        ...entry
      }

      // Inserir no banco de dados
      const { error } = await this.supabase
        .from('audit_logs')
        .insert(auditEntry)

      if (error) {
        console.error('Erro ao registrar audit log:', error)
        // Em produção, usar sistema de alertas
        await this.handleAuditError(error, auditEntry)
      }

      // Para eventos críticos, enviar alertas imediatos
      if (auditEntry.severity === AuditSeverity.CRITICAL) {
        await this.sendCriticalAlert(auditEntry)
      }

    } catch (error) {
      console.error('Falha crítica no audit logger:', error)
      // Fallback: log local para investigação
      await this.logToFile(entry)
    }
  }

  /**
   * Logs específicos para diferentes tipos de eventos
   */

  // Autenticação
  async logLogin(success: boolean, errorMessage?: string): Promise<void> {
    await this.log({
      event_type: AuditEventType.USER_LOGIN,
      table_name: 'auth_sessions',
      operation: 'login',
      severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      success,
      error_message: errorMessage,
      lgpd_basis: LgpdLegalBasis.LEGITIMATE_INTERESTS
    })
  }

  async logLogout(): Promise<void> {
    await this.log({
      event_type: AuditEventType.USER_LOGOUT,
      table_name: 'auth_sessions',
      operation: 'logout',
      severity: AuditSeverity.LOW,
      success: true,
      lgpd_basis: LgpdLegalBasis.LEGITIMATE_INTERESTS
    })
  }

  // Operações de pacientes
  async logPatientAccess(patientId: string, operation: 'create' | 'read' | 'update' | 'delete'): Promise<void> {
    const eventTypeMap = {
      create: AuditEventType.PATIENT_CREATED,
      read: AuditEventType.PATIENT_VIEWED,
      update: AuditEventType.PATIENT_UPDATED,
      delete: AuditEventType.PATIENT_DELETED
    }

    await this.log({
      event_type: eventTypeMap[operation],
      table_name: 'patients',
      operation,
      patient_id: patientId,
      resource_id: patientId,
      severity: operation === 'delete' ? AuditSeverity.HIGH : AuditSeverity.MEDIUM,
      success: true,
      lgpd_basis: LgpdLegalBasis.HEALTH_PROTECTION
    })
  }

  // Eventos LGPD
  async logLgpdEvent(
    eventType: AuditEventType,
    patientId: string,
    details: Record<string, any>
  ): Promise<void> {
    await this.log({
      event_type: eventType,
      table_name: 'lgpd_events',
      operation: 'lgpd_action',
      patient_id: patientId,
      resource_id: patientId,
      severity: AuditSeverity.HIGH,
      success: true,
      lgpd_basis: LgpdLegalBasis.LEGAL_OBLIGATION,
      additional_data: details
    })
  }

  // Eventos de segurança
  async logSecurityEvent(
    eventType: AuditEventType,
    details: Record<string, any>,
    severity: AuditSeverity = AuditSeverity.HIGH
  ): Promise<void> {
    await this.log({
      event_type: eventType,
      table_name: 'security_events',
      operation: 'security_alert',
      severity,
      success: false,
      additional_data: details,
      lgpd_basis: LgpdLegalBasis.LEGITIMATE_INTERESTS
    })
  }

  // Supervisão educacional
  async logSupervisionEvent(
    internUserId: string,
    activity: string,
    evaluation?: Record<string, any>
  ): Promise<void> {
    await this.log({
      event_type: AuditEventType.INTERN_ACTIVITY_SUPERVISED,
      table_name: 'supervision_logs',
      operation: 'supervision',
      severity: AuditSeverity.MEDIUM,
      success: true,
      additional_data: {
        intern_user_id: internUserId,
        activity,
        evaluation,
        supervisor_id: this.userId
      },
      lgpd_basis: LgpdLegalBasis.LEGITIMATE_INTERESTS
    })
  }

  /**
   * Métodos utilitários
   */

  private determineLgpdBasis(eventType: AuditEventType): LgpdLegalBasis {
    const lgpdMapping: Partial<Record<AuditEventType, LgpdLegalBasis>> = {
      [AuditEventType.PATIENT_CREATED]: LgpdLegalBasis.HEALTH_PROTECTION,
      [AuditEventType.PATIENT_VIEWED]: LgpdLegalBasis.HEALTH_PROTECTION,
      [AuditEventType.PATIENT_UPDATED]: LgpdLegalBasis.HEALTH_PROTECTION,
      [AuditEventType.PATIENT_DELETED]: LgpdLegalBasis.LEGAL_OBLIGATION,
      [AuditEventType.LGPD_CONSENT_GIVEN]: LgpdLegalBasis.CONSENT,
      [AuditEventType.LGPD_CONSENT_WITHDRAWN]: LgpdLegalBasis.LEGAL_OBLIGATION,
      [AuditEventType.LGPD_DATA_REQUEST]: LgpdLegalBasis.LEGAL_OBLIGATION,
      [AuditEventType.USER_LOGIN]: LgpdLegalBasis.LEGITIMATE_INTERESTS,
      [AuditEventType.SECURITY_BREACH_ATTEMPT]: LgpdLegalBasis.LEGITIMATE_INTERESTS
    }

    return lgpdMapping[eventType] || LgpdLegalBasis.LEGITIMATE_INTERESTS
  }

  private getRetentionPeriod(eventType: AuditEventType): number {
    // Períodos de retenção em anos conforme LGPD e CFM
    const retentionMapping: Partial<Record<AuditEventType, number>> = {
      [AuditEventType.PATIENT_CREATED]: 20, // Prontuários: 20 anos (CFM)
      [AuditEventType.PATIENT_VIEWED]: 20,
      [AuditEventType.PATIENT_UPDATED]: 20,
      [AuditEventType.ASSESSMENT_CREATED]: 20,
      [AuditEventType.SESSION_CREATED]: 20,
      [AuditEventType.LGPD_CONSENT_GIVEN]: 5, // Consentimentos: 5 anos
      [AuditEventType.LGPD_DATA_REQUEST]: 5,
      [AuditEventType.USER_LOGIN]: 2, // Logs de acesso: 2 anos
      [AuditEventType.SECURITY_BREACH_ATTEMPT]: 10 // Eventos de segurança: 10 anos
    }

    return retentionMapping[eventType] || 5 // Padrão: 5 anos
  }

  private async getClientIP(): Promise<string> {
    try {
      // Em Next.js middleware, o IP estará nos headers
      return 'unknown' // Implementação específica para middleware
    } catch {
      return 'unknown'
    }
  }

  private async getUserAgent(): Promise<string> {
    try {
      // Obter user agent dos headers da requisição
      return 'unknown' // Implementação específica para middleware
    } catch {
      return 'unknown'
    }
  }

  private async handleAuditError(error: any, entry: AuditLogEntry): Promise<void> {
    // Em caso de falha no audit log, usar sistema de backup
    console.error('Audit log failed, using backup system:', error)

    // Salvar em arquivo local para investigação
    await this.logToFile(entry)

    // Enviar alerta para administradores
    if (entry.severity === AuditSeverity.CRITICAL) {
      // Implementar sistema de alertas
    }
  }

  private async logToFile(entry: any): Promise<void> {
    // Fallback para arquivo local em caso de falha do banco
    try {
      const fs = await import('fs/promises')
      const path = await import('path')

      const logDir = path.join(process.cwd(), 'logs', 'audit')
      const logFile = path.join(logDir, `audit-${new Date().toISOString().split('T')[0]}.log`)

      await fs.mkdir(logDir, { recursive: true })
      await fs.appendFile(logFile, JSON.stringify(entry) + '\n')
    } catch (error) {
      console.error('Failed to write audit log to file:', error)
    }
  }

  private async sendCriticalAlert(entry: AuditLogEntry): Promise<void> {
    // Implementar sistema de alertas para eventos críticos
    console.log('CRITICAL AUDIT EVENT:', entry)

    // Em produção, integrar com:
    // - Sistema de notificações por email
    // - Webhook para Slack/Teams
    // - SMS para administradores
    // - Sistema de tickets
  }
}

/**
 * Factory function para criar audit logger com contexto
 */
export async function createAuditLogger(
  userId?: string,
  orgId?: string,
  userRole?: UserRole
): Promise<AuditLogger> {
  return new AuditLogger(userId, orgId, userRole)
}

/**
 * Middleware helper para audit logging automático
 */
export function withAuditLogging(
  eventType: AuditEventType,
  tableName: string,
  operation: string
) {
  return async (
    userId: string,
    orgId: string,
    userRole: UserRole,
    resourceId?: string,
    patientId?: string
  ) => {
    const logger = await createAuditLogger(userId, orgId, userRole)

    await logger.log({
      event_type: eventType,
      table_name: tableName,
      operation,
      resource_id: resourceId,
      patient_id: patientId,
      severity: AuditSeverity.MEDIUM,
      success: true
    })
  }
}

/**
 * Hook para audit logging em React components
 */
export function useAuditLogger(userId?: string, orgId?: string, userRole?: UserRole) {
  const logger = new AuditLogger(userId, orgId, userRole)

  return {
    logPatientAccess: (patientId: string, operation: 'create' | 'read' | 'update' | 'delete') =>
      logger.logPatientAccess(patientId, operation),

    logLgpdEvent: (eventType: AuditEventType, patientId: string, details: Record<string, any>) =>
      logger.logLgpdEvent(eventType, patientId, details),

    logSecurityEvent: (eventType: AuditEventType, details: Record<string, any>, severity?: AuditSeverity) =>
      logger.logSecurityEvent(eventType, details, severity),

    logSupervisionEvent: (internUserId: string, activity: string, evaluation?: Record<string, any>) =>
      logger.logSupervisionEvent(internUserId, activity, evaluation),

    log: (entry: Partial<AuditLogEntry> & { event_type: AuditEventType, table_name: string, operation: string }) =>
      logger.log(entry)
  }
}

export default AuditLogger