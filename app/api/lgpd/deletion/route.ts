/**
 * LGPD Data Deletion API
 * Handles patient data deletion requests according to LGPD requirements
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/src/lib/supabase/server'
import { getCurrentUser } from '@/src/lib/auth/server'
import { logAuditEvent } from '@/src/lib/audit/server'
import logger from '../../../../lib/logger';

const deletionRequestSchema = z.object({
  reason: z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres').max(1000)
})

/**
 * POST /api/lgpd/deletion
 * Create new data deletion request
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // 1. Authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // 2. Only patients can request deletion of their own data
    if (currentUser.role !== 'paciente') {
      return NextResponse.json(
        { error: 'Apenas pacientes podem solicitar eliminação de dados' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request
    const body = await request.json()
    const validatedData = deletionRequestSchema.parse(body)

    // 4. Check for existing pending deletion requests
    const { data: existingRequest } = await supabase
      .from('data_deletion_requests')
      .select('id')
      .eq('patient_id', currentUser.id)
      .in('status', ['pending', 'confirmed', 'processing'])
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Já existe uma solicitação de eliminação pendente' },
        { status: 409 }
      )
    }

    // 5. Check for legal retention requirements
    const retentionCheck = await checkLegalRetentionRequirements(currentUser.id)
    if (retentionCheck.hasActiveRequirements) {
      return NextResponse.json(
        {
          error: 'Alguns dados não podem ser eliminados devido a obrigações legais',
          details: retentionCheck.requirements,
          warning: 'Dados sujeitos a retenção legal serão mantidos conforme exigido por lei'
        },
        { status: 422 }
      )
    }

    // 6. Create deletion request
    const { data: deletionRequest, error: createError } = await supabase
      .from('data_deletion_requests')
      .insert({
        patient_id: currentUser.id,
        reason: validatedData.reason,
        status: 'pending',
        created_by: currentUser.id
      })
      .select()
      .single()

    if (createError) {
      logger.error('Error creating deletion request:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar solicitação de eliminação' },
        { status: 500 }
      )
    }

    // 7. Log audit event
    await logAuditEvent({
      table_name: 'data_deletion_requests',
      operation: 'CREATE',
      record_id: deletionRequest.id,
      user_id: currentUser.id,
      additional_data: {
        reason: validatedData.reason
      }
    })

    // 8. Notify administrators about deletion request
    await notifyAdministrators(deletionRequest)

    return NextResponse.json({
      success: true,
      data: {
        id: deletionRequest.id,
        reason: deletionRequest.reason,
        status: deletionRequest.status,
        requestedAt: deletionRequest.created_at
      },
      message: 'Solicitação de eliminação criada com sucesso. Nossa equipe analisará o pedido.'
    }, { status: 201 })

  } catch (error) {
    logger.error('Unexpected error in deletion request:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: error.errors.map(e => ({
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
 * GET /api/lgpd/deletion
 * List user's deletion requests
 */
export async function GET() {
  try {
    const supabase = await createServerClient()

    // 1. Authentication
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'paciente') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // 2. Get deletion requests
    const { data: requests, error } = await supabase
      .from('data_deletion_requests')
      .select('*')
      .eq('patient_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching deletion requests:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar solicitações' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: requests.map(request => ({
        id: request.id,
        reason: request.reason,
        status: request.status,
        requestedAt: request.created_at,
        completionDate: request.completed_at
      }))
    })

  } catch (error) {
    logger.error('Unexpected error in deletion list:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * Check legal retention requirements
 */
async function checkLegalRetentionRequirements(patientId: string) {
  const supabase = await createServerClient()

  const requirements = []

  // Check for active medical treatments
  const { data: activeTreatments } = await supabase
    .from('sessions')
    .select('id')
    .eq('patient_id', patientId)
    .eq('status', 'in_progress')

  if (activeTreatments && activeTreatments.length > 0) {
    requirements.push({
      type: 'active_treatment',
      description: 'Tratamento médico ativo em andamento',
      retentionPeriod: 'Até conclusão do tratamento'
    })
  }

  // Check for recent appointments (within legal retention period)
  const fiveYearsAgo = new Date()
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)

  const { data: recentAppointments } = await supabase
    .from('appointments')
    .select('id')
    .eq('patient_id', patientId)
    .gte('appointment_date', fiveYearsAgo.toISOString())

  if (recentAppointments && recentAppointments.length > 0) {
    requirements.push({
      type: 'medical_records',
      description: 'Prontuário médico deve ser mantido por 5 anos (CFM)',
      retentionPeriod: '5 anos a partir da última consulta'
    })
  }

  // Check for pending payments or legal obligations
  const { data: pendingPayments } = await supabase
    .from('billing')
    .select('id')
    .eq('patient_id', patientId)
    .neq('status', 'paid')

  if (pendingPayments && pendingPayments.length > 0) {
    requirements.push({
      type: 'financial_obligations',
      description: 'Obrigações financeiras pendentes',
      retentionPeriod: 'Até quitação das pendências'
    })
  }

  return {
    hasActiveRequirements: requirements.length > 0,
    requirements
  }
}

/**
 * Notify administrators about deletion request
 */
async function notifyAdministrators(deletionRequest: any) {
  const supabase = await createServerClient()

  // Get all administrators
  const { data: admins } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('role', 'admin')
    .eq('is_active', true)

  if (!admins || admins.length === 0) return

  // Create notifications for admins
  const notifications = admins.map(admin => ({
    user_id: admin.id,
    type: 'lgpd_deletion_request',
    title: 'Nova Solicitação LGPD',
    message: `Paciente solicitou eliminação de dados. Solicitação ID: ${deletionRequest.id}`,
    data: {
      requestId: deletionRequest.id,
      patientId: deletionRequest.patient_id,
      action_url: `/admin/lgpd/deletion/${deletionRequest.id}`
    },
    created_at: new Date().toISOString()
  }))

  await supabase
    .from('notifications')
    .insert(notifications)

  // In a real implementation, also send emails
  logger.info(`LGPD deletion request ${deletionRequest.id} notifications sent to ${admins.length} administrators`)
}

/**
 * PATCH /api/lgpd/deletion/[id]
 * Update deletion request status (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // 1. Authentication and authorization
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // 2. Parse request
    const body = await request.json()
    const { id, status, adminNotes } = body

    if (!['confirmed', 'rejected', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    // 3. Update deletion request
    const updateData: any = {
      status,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString()
    }

    if (adminNotes) {
      updateData.admin_notes = adminNotes
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data: updatedRequest, error } = await supabase
      .from('data_deletion_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating deletion request:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar solicitação' },
        { status: 500 }
      )
    }

    // 4. If confirmed, start deletion process
    if (status === 'confirmed') {
      await processDeletionRequest(updatedRequest)
    }

    // 5. Log audit event
    await logAuditEvent({
      table_name: 'data_deletion_requests',
      operation: 'UPDATE',
      record_id: id,
      user_id: currentUser.id,
      additional_data: {
        new_status: status,
        admin_notes: adminNotes
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: `Solicitação ${status === 'confirmed' ? 'confirmada' : status === 'rejected' ? 'rejeitada' : 'concluída'}`
    })

  } catch (error) {
    logger.error('Unexpected error updating deletion request:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * Process confirmed deletion request
 */
async function processDeletionRequest(deletionRequest: any) {
  const supabase = await createServerClient()
  const patientId = deletionRequest.patient_id

  try {
    // Start processing
    await supabase
      .from('data_deletion_requests')
      .update({ status: 'processing' })
      .eq('id', deletionRequest.id)

    // Delete patient data according to legal requirements
    // Note: In a real implementation, this would be more sophisticated
    // and respect legal retention requirements

    // 1. Anonymize profile data (keep for legal requirements)
    await supabase
      .from('profiles')
      .update({
        full_name: 'DADOS REMOVIDOS - LGPD',
        email: `deleted-${patientId}@anonymized.com`,
        phone: null,
        cpf: null,
        is_active: false,
        deleted_at: new Date().toISOString(),
        deletion_reason: 'LGPD_REQUEST'
      })
      .eq('id', patientId)

    // 2. Delete photos and documents
    const { data: files } = await supabase.storage
      .from('patient-photos')
      .list(patientId)

    if (files && files.length > 0) {
      await supabase.storage
        .from('patient-photos')
        .remove(files.map(file => `${patientId}/${file.name}`))
    }

    // 3. Anonymize sessions but keep for medical record requirements
    await supabase
      .from('sessions')
      .update({
        notes: 'DADOS ANONIMIZADOS - LGPD',
        updated_at: new Date().toISOString()
      })
      .eq('patient_id', patientId)

    // 4. Mark deletion as completed
    await supabase
      .from('data_deletion_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', deletionRequest.id)

    logger.info(`Patient data deletion completed for ID: ${patientId}`)

  } catch (error) {
    logger.error('Error processing deletion request:', error)

    // Mark as failed
    await supabase
      .from('data_deletion_requests')
      .update({
        status: 'failed',
        admin_notes: `Erro no processamento: ${error.message}`
      })
      .eq('id', deletionRequest.id)
  }
}