/**
 * API Endpoint - Individual Patient Management - FisioFlow
 * GET /api/patients/[id] - Get patient details
 * PUT /api/patients/[id] - Update patient
 * DELETE /api/patients/[id] - Delete patient (soft delete)
 *
 * Implements Brazilian healthcare compliance, LGPD requirements, and RBAC
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/src/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/src/lib/auth/server'
import { logAuditEvent } from '@/src/lib/audit/server'
// import { validateLGPDConsent } from '@/src/lib/lgpd/server'
import logger from '../../../../lib/logger';

// Schema for patient update
const updatePatientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255, 'Nome muito longo').optional(),
  rg: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['masculino', 'feminino', 'outro']).optional(),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').optional(),
  email: z.string().email('Email inválido').optional(),
  emergency_contact_name: z.string().min(2, 'Nome do contato de emergência é obrigatório').optional(),
  emergency_contact_phone: z.string().min(10, 'Telefone de emergência é obrigatório').optional(),
  
  // Address
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  
  // Health information
  health_insurance: z.string().optional(),
  health_insurance_number: z.string().optional(),
  medical_history: z.string().optional(),
  current_medications: z.string().optional(),
  allergies: z.string().optional(),
  observations: z.string().optional(),
  
  // Status
  status: z.enum(['active', 'inactive', 'discharged']).optional(),
  
  // LGPD consent
  consent_lgpd: z.boolean().optional(),
  consent_version: z.string().optional()
})

/**
 * GET /api/patients/[id]
 * Get patient details
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await context.params
    const supabase = await createServerClient()
    
    // 1. Authentication and authorization
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // 2. Check permissions
    if (!hasPermission(currentUser.role, 'read', 'patients')) {
      await logAuditEvent({
        table_name: 'patients',
        operation: 'READ_DENIED',
        record_id: patientId,
        user_id: currentUser.id,
        additional_data: {
          reason: 'insufficient_permissions',
          attempted_role: currentUser.role
        }
      })

      return NextResponse.json(
        { error: 'Permissão insuficiente para visualizar pacientes' },
        { status: 403 }
      )
    }

    // 3. Get patient details
    const { data: patient, error } = await supabase
      .from('patients')
      .select(`
        id,
        name,
        cpf,
        rg,
        date_of_birth,
        gender,
        phone,
        email,
        emergency_contact_name,
        emergency_contact_phone,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        health_insurance,
        health_insurance_number,
        medical_history,
        current_medications,
        allergies,
        observations,
        status,
        photo_url,
        consent_lgpd,
        consent_date,
        consent_version,
        data_retention_until,
        created_at,
        updated_at,
        created_by:profiles!patients_created_by_fkey(full_name),
        updated_by:profiles!patients_updated_by_fkey(full_name)
      `)
      .eq('id', patientId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Paciente não encontrado' },
          { status: 404 }
        )
      }
      
      logger.error('Erro ao buscar paciente:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar paciente' },
        { status: 500 }
      )
    }

    // 4. Check LGPD consent for sensitive data
    if (!(patient as any).consent_lgpd && currentUser.role !== 'admin') {
      // Return limited data for patients without LGPD consent
      const limitedPatient = {
        id: (patient as any).id,
        name: (patient as any).name,
        status: (patient as any).status,
        created_at: (patient as any).created_at
      }
      
      return NextResponse.json({
        success: true,
        data: limitedPatient,
        message: 'Dados limitados - consentimento LGPD necessário'
      })
    }

    // 5. Log data access
    // Log patient data access - temporarily disabled
    // await supabase
    //   .rpc('log_patient_data_access', {
    //     p_patient_id: patientId,
    //     p_access_type: 'view',
    //     p_accessed_fields: ['all'],
    //     p_access_reason: 'Patient details view'
    //   })

    // 6. Log audit event
    await logAuditEvent({
      table_name: 'patients',
      operation: 'READ',
      record_id: patientId,
      user_id: currentUser.id,
      additional_data: {
        patient_name: (patient as any).name,
        lgpd_consent: (patient as any).consent_lgpd
      }
    })

    // 7. Return response
    return NextResponse.json({
      success: true,
      data: patient
    })

  } catch (error) {
    logger.error('Erro inesperado ao buscar paciente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/patients/[id]
 * Update patient
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await context.params
    const supabase = await createServerClient()
    
    // 1. Authentication and authorization
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // 2. Check permissions
    if (!hasPermission(currentUser.role, 'write', 'patients')) {
      await logAuditEvent({
        table_name: 'patients',
        operation: 'UPDATE_DENIED',
        record_id: patientId,
        user_id: currentUser.id,
        additional_data: {
          reason: 'insufficient_permissions',
          attempted_role: currentUser.role
        }
      })

      return NextResponse.json(
        { error: 'Permissão insuficiente para editar pacientes' },
        { status: 403 }
      )
    }

    // 3. Get current patient data
    const { data: _currentPatient, error: fetchError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Paciente não encontrado' },
          { status: 404 }
        )
      }
      
      logger.error('Erro ao buscar paciente:', fetchError)
      return NextResponse.json(
        { error: 'Erro ao buscar paciente' },
        { status: 500 }
      )
    }

    // 4. Parse and validate request body
    const body = await request.json()
    const validatedData = updatePatientSchema.parse(body)

    // 5. Prepare update data
    const updateData: any = {
      ...validatedData,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString()
    }

    // Handle LGPD consent changes
    if (validatedData.consent_lgpd !== undefined) {
      updateData.consent_lgpd = validatedData.consent_lgpd
      updateData.consent_date = new Date().toISOString()
      updateData.consent_version = validatedData.consent_version || '1.0'
    }

    // 6. Update patient
    const { data: updatedPatient, error: updateError } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', patientId)
      .eq('org_id', currentUser.org_id)
      .select(`
        id,
        name,
        cpf,
        date_of_birth,
        gender,
        phone,
        email,
        status,
        consent_lgpd,
        updated_at,
        updated_by:profiles!patients_updated_by_fkey(full_name)
      `)
      .single()

    if (updateError) {
      logger.error('Erro ao atualizar paciente:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar paciente' },
        { status: 500 }
      )
    }

    // 7. Log consent history if consent changed
    // Temporarily disabled until patient_consent_history table is created
    // if (validatedData.consent_lgpd !== undefined && validatedData.consent_lgpd !== currentPatient.consent_lgpd) {
    //   await supabase
    //     .from('patient_consent_history')
    //     .insert({
    //       patient_id: patientId,
    //       org_id: currentUser.org_id,
    //       consent_type: 'data_processing',
    //       granted: validatedData.consent_lgpd,
    //       consent_text: validatedData.consent_lgpd 
    //         ? 'Consentimento para processamento de dados pessoais conforme LGPD'
    //         : 'Retirada do consentimento para processamento de dados pessoais',
    //       consent_version: validatedData.consent_version || '1.0',
    //       granted_by: currentUser.id
    //     })
    // }

    // 8. Log data access - temporarily disabled
    // await supabase
    //   .rpc('log_patient_data_access', {
    //     p_patient_id: patientId,
    //     p_access_type: 'edit',
    //     p_accessed_fields: Object.keys(validatedData),
    //     p_access_reason: 'Patient data update'
    //   })

    // 9. Log audit event
    await logAuditEvent({
      table_name: 'patients',
      operation: 'UPDATE',
      record_id: patientId,
      user_id: currentUser.id,
      additional_data: {
        patient_name: updatedPatient.name,
        updated_fields: Object.keys(validatedData),
        lgpd_consent_changed: validatedData.consent_lgpd !== undefined
      }
    })

    // 10. Return response
    return NextResponse.json({
      success: true,
      data: updatedPatient,
      message: 'Paciente atualizado com sucesso'
    })

  } catch (error) {
    logger.error('Erro inesperado ao atualizar paciente:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: (error as any).errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/patients/[id]
 * Soft delete patient (archive)
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await context.params
    const supabase = await createServerClient()
    
    // 1. Authentication and authorization
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // 2. Check permissions (only admin can delete)
    if (currentUser.role !== 'admin') {
      await logAuditEvent({
        table_name: 'patients',
        operation: 'DELETE_DENIED',
        record_id: patientId,
        user_id: currentUser.id,
        additional_data: {
          reason: 'insufficient_permissions',
          attempted_role: currentUser.role
        }
      })

      return NextResponse.json(
        { error: 'Apenas administradores podem excluir pacientes' },
        { status: 403 }
      )
    }

    // 3. Check if patient exists
    const { data: patient, error: fetchError } = await supabase
      .from('patients')
      .select('id, name, status')
      .eq('id', patientId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Paciente não encontrado' },
          { status: 404 }
        )
      }
      
      logger.error('Erro ao buscar paciente:', fetchError)
      return NextResponse.json(
        { error: 'Erro ao buscar paciente' },
        { status: 500 }
      )
    }

    // 4. Check if patient has active appointments
    const { data: activeAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .eq('patient_id', patientId)
      .eq('org_id', currentUser.org_id)
      .in('status', ['agendado', 'confirmado', 'em_andamento'])
      .limit(1)

    if (appointmentsError) {
      logger.error('Erro ao verificar agendamentos:', appointmentsError)
      return NextResponse.json(
        { error: 'Erro ao verificar agendamentos' },
        { status: 500 }
      )
    }

    if (activeAppointments && activeAppointments.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir paciente com agendamentos ativos' },
        { status: 409 }
      )
    }

    // 5. Soft delete (archive) patient
    const { data: archivedPatient, error: archiveError } = await supabase
      .from('patients')
      .update({
        status: 'inactive' as any, // archived status not available yet
        updated_by: currentUser.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId)
      .eq('org_id', currentUser.org_id)
      .select('id, name, status')
      .single()

    if (archiveError) {
      logger.error('Erro ao arquivar paciente:', archiveError)
      return NextResponse.json(
        { error: 'Erro ao arquivar paciente' },
        { status: 500 }
      )
    }

    // 6. Log audit event
    await logAuditEvent({
      table_name: 'patients',
      operation: 'DELETE',
      record_id: patientId,
      user_id: currentUser.id,
      additional_data: {
        patient_name: patient.name,
        action: 'soft_delete_archive'
      }
    })

    // 7. Return response
    return NextResponse.json({
      success: true,
      data: archivedPatient,
      message: 'Paciente arquivado com sucesso'
    })

  } catch (error) {
    logger.error('Erro inesperado ao arquivar paciente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
