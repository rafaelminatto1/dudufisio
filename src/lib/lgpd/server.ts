/**
 * Server-side LGPD Utilities - FisioFlow
 * Funções para conformidade com a Lei Geral de Proteção de Dados
 */

import { createServerClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit/server'

/**
 * Validar consentimento LGPD de um paciente
 */
export async function validateLGPDConsent(patientId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase.rpc('check_lgpd_consent', {
      target_patient_id: patientId,
    })

    if (error) {
      console.error('Erro ao verificar consentimento LGPD:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Erro ao validar consentimento LGPD:', error)
    return false
  }
}

/**
 * Registrar consentimento LGPD
 */
export async function recordLGPDConsent(
  patientId: string,
  consentGranted: boolean,
  ipAddress?: string,
  userId?: string
): Promise<void> {
  try {
    const supabase = await createServerClient()

    // Atualizar registro do paciente
    const { error: updateError } = await supabase
      .from('patients')
      .update({
        consent_lgpd: consentGranted,
        consent_date: new Date().toISOString(),
        consent_ip_address: ipAddress,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('id', patientId)

    if (updateError) {
      console.error('Erro ao atualizar consentimento LGPD:', updateError)
      throw updateError
    }

    // Log de auditoria
    await logAuditEvent({
      table_name: 'patients',
      operation: 'LGPD_CONSENT_UPDATE',
      record_id: patientId,
      user_id: userId,
      new_values: {
        consent_lgpd: consentGranted,
        consent_date: new Date().toISOString(),
        consent_ip_address: ipAddress,
      },
      additional_data: {
        consent_granted: consentGranted,
        ip_address: ipAddress,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Erro ao registrar consentimento LGPD:', error)
    throw error
  }
}

/**
 * Verificar se dados sensíveis podem ser acessados
 */
export async function canAccessSensitiveData(
  patientId: string,
  dataType: string
): Promise<boolean> {
  try {
    // Primeiro verificar consentimento LGPD
    const hasConsent = await validateLGPDConsent(patientId)
    if (!hasConsent) {
      return false
    }

    const supabase = await createServerClient()

    // Verificar se o paciente está ativo
    const { data: patient, error } = await supabase
      .from('patients')
      .select('status, consent_lgpd')
      .eq('id', patientId)
      .single()

    if (error || !patient) {
      return false
    }

    return patient.status === 'active' && patient.consent_lgpd
  } catch (error) {
    console.error('Erro ao verificar acesso a dados sensíveis:', error)
    return false
  }
}

/**
 * Anonymizar dados de paciente (direito ao esquecimento)
 */
export async function anonymizePatientData(
  patientId: string,
  userId: string,
  reason: string
): Promise<void> {
  try {
    const supabase = await createServerClient()

    // Buscar dados originais para auditoria
    const { data: originalData, error: fetchError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (fetchError || !originalData) {
      throw new Error('Paciente não encontrado para anonimização')
    }

    // Dados anonimizados
    const anonymizedData = {
      name: `[ANONIMIZADO] ${patientId.substring(0, 8)}`,
      cpf: '***.***.***-**',
      rg: null,
      phone: '(***) *****-****',
      email: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      address_line1: null,
      address_line2: null,
      city: null,
      state: null,
      postal_code: null,
      photo_url: null,
      medical_history: '[DADOS REMOVIDOS POR SOLICITAÇÃO DO TITULAR]',
      current_medications: null,
      allergies: null,
      observations: '[DADOS ANONIMIZADOS]',
      status: 'discharged',
      updated_at: new Date().toISOString(),
      updated_by: userId,
    }

    // Atualizar registro
    const { error: updateError } = await supabase
      .from('patients')
      .update(anonymizedData as any)
      .eq('id', patientId)

    if (updateError) {
      throw updateError
    }

    // Log de auditoria
    await logAuditEvent({
      table_name: 'patients',
      operation: 'ANONYMIZE',
      record_id: patientId,
      user_id: userId,
      old_values: originalData,
      new_values: anonymizedData,
      additional_data: {
        reason,
        anonymization_date: new Date().toISOString(),
        lgpd_compliance: true,
      },
    })

    // Anonimizar dados relacionados
    await anonymizeRelatedData(patientId, userId)
  } catch (error) {
    console.error('Erro ao anonimizar dados do paciente:', error)
    throw error
  }
}

/**
 * Anonimizar dados relacionados ao paciente
 */
async function anonymizeRelatedData(
  patientId: string,
  userId: string
): Promise<void> {
  const supabase = await createServerClient()

  try {
    // Anonimizar pontos de dor
    await supabase
      .from('pain_points')
      .update({
        pain_description: '[REMOVIDO]',
        clinical_notes: '[REMOVIDO]',
        improvement_notes: '[REMOVIDO]',
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('patient_id', patientId)

    // Anonimizar sessões
    await supabase
      .from('sessions')
      .update({
        subjective: '[REMOVIDO]',
        objective: '[REMOVIDO]',
        assessment: '[REMOVIDO]',
        plan: '[REMOVIDO]',
        session_notes: '[REMOVIDO]',
        next_session_notes: '[REMOVIDO]',
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('patient_id', patientId)

    // Log das anonimizações relacionadas
    await logAuditEvent({
      table_name: 'related_data',
      operation: 'ANONYMIZE_RELATED',
      record_id: patientId,
      user_id: userId,
      additional_data: {
        tables_affected: ['pain_points', 'sessions'],
        anonymization_date: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Erro ao anonimizar dados relacionados:', error)
    throw error
  }
}

/**
 * Exportar dados do paciente (portabilidade)
 */
export async function exportPatientData(
  patientId: string,
  format: 'json' | 'pdf',
  userId: string
): Promise<any> {
  try {
    // Verificar consentimento
    const hasConsent = await validateLGPDConsent(patientId)
    if (!hasConsent) {
      throw new Error('Paciente não forneceu consentimento para exportação')
    }

    const supabase = await createServerClient()

    // Coletar todos os dados do paciente
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      throw new Error('Paciente não encontrado')
    }

    const { data: painPoints } = await supabase
      .from('pain_points')
      .select('*')
      .eq('patient_id', patientId)

    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('patient_id', patientId)

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)

    const exportData = {
      patient,
      pain_points: painPoints || [],
      sessions: sessions || [],
      appointments: appointments || [],
      export_metadata: {
        exported_at: new Date().toISOString(),
        exported_by: userId,
        format,
        total_records: {
          pain_points: painPoints?.length || 0,
          sessions: sessions?.length || 0,
          appointments: appointments?.length || 0,
        },
      },
    }

    // Log da exportação
    await logAuditEvent({
      table_name: 'patients',
      operation: 'DATA_EXPORT',
      record_id: patientId,
      user_id: userId,
      additional_data: {
        export_format: format,
        export_date: new Date().toISOString(),
        total_records: exportData.export_metadata.total_records,
        lgpd_compliance: true,
      },
    })

    return exportData
  } catch (error) {
    console.error('Erro ao exportar dados do paciente:', error)
    throw error
  }
}