/**
 * Server-side Audit Utilities - FisioFlow
 * Funções para logging de auditoria e conformidade LGPD
 */

import { createServerClient } from '@/lib/supabase/server'

export interface AuditEventData {
  table_name: string
  operation: string
  record_id?: string | null
  org_id?: string | null
  old_values?: Record<string, any> | null
  new_values?: Record<string, any> | null
  additional_data?: Record<string, any> | null
  user_id?: string | null
}

/**
 * Registrar evento de auditoria
 */
export async function logAuditEvent(eventData: AuditEventData): Promise<void> {
  try {
    const supabase = await createServerClient()

    const auditLogEntry = {
      table_name: eventData.table_name,
      operation: eventData.operation,
      record_id: eventData.record_id,
      org_id: eventData.org_id,
      old_values: eventData.old_values,
      new_values: eventData.new_values,
      additional_data: eventData.additional_data,
      user_id: eventData.user_id,
      timestamp: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('audit_logs')
      .insert(auditLogEntry)

    if (error) {
      console.error('Erro ao registrar log de auditoria:', error)
      // Não propagar erro para não afetar a operação principal
    }
  } catch (error) {
    console.error('Erro inesperado ao registrar log de auditoria:', error)
    // Não propagar erro para não afetar a operação principal
  }
}

/**
 * Registrar acesso a dados de paciente (LGPD)
 */
export async function logPatientDataAccess(
  patientId: string,
  accessType: string,
  accessedFields: string[],
  userId?: string
): Promise<void> {
  try {
    const supabase = await createServerClient()

    await supabase.rpc('log_patient_data_access', {
      patient_id: patientId,
      access_type: accessType,
      accessed_fields: accessedFields,
    })
  } catch (error) {
    console.error('Erro ao registrar acesso aos dados do paciente:', error)
    // Não propagar erro para não afetar a operação principal
  }
}

/**
 * Registrar operação CRUD com auditoria automática
 */
export async function logCRUDOperation(
  tableName: string,
  operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
  recordId: string,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  userId?: string,
  orgId?: string
): Promise<void> {
  await logAuditEvent({
    table_name: tableName,
    operation,
    record_id: recordId,
    org_id: orgId,
    old_values: oldValues,
    new_values: newValues,
    user_id: userId,
    additional_data: {
      timestamp: new Date().toISOString(),
      source: 'api_endpoint',
    },
  })
}

/**
 * Registrar tentativa de acesso negado
 */
export async function logAccessDenied(
  resource: string,
  reason: string,
  userId?: string,
  additionalContext?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    table_name: resource,
    operation: 'ACCESS_DENIED',
    user_id: userId,
    additional_data: {
      reason,
      timestamp: new Date().toISOString(),
      ...additionalContext,
    },
  })
}

/**
 * Registrar erro de validação
 */
export async function logValidationError(
  resource: string,
  validationErrors: any[],
  userId?: string,
  recordData?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    table_name: resource,
    operation: 'VALIDATION_ERROR',
    user_id: userId,
    additional_data: {
      validation_errors: validationErrors,
      attempted_data: recordData,
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * Registrar exportação de dados (LGPD)
 */
export async function logDataExport(
  exportType: string,
  exportedRecords: number,
  userId: string,
  orgId: string,
  additionalInfo?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    table_name: 'data_exports',
    operation: 'EXPORT',
    user_id: userId,
    org_id: orgId,
    additional_data: {
      export_type: exportType,
      exported_records: exportedRecords,
      timestamp: new Date().toISOString(),
      ...additionalInfo,
    },
  })
}

/**
 * Registrar alteração de consentimento LGPD
 */
export async function logLGPDConsentChange(
  patientId: string,
  previousConsent: boolean,
  newConsent: boolean,
  userId: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    table_name: 'patients',
    operation: 'LGPD_CONSENT_CHANGE',
    record_id: patientId,
    user_id: userId,
    old_values: { consent_lgpd: previousConsent },
    new_values: { consent_lgpd: newConsent },
    additional_data: {
      ip_address: ipAddress,
      timestamp: new Date().toISOString(),
      consent_granted: newConsent,
    },
  })
}