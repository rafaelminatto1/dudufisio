/**
 * API Endpoint - Appointment Details Management - FisioFlow
 * GET /api/appointments/[id] - Get appointment details
 * PATCH /api/appointments/[id] - Update appointment
 * DELETE /api/appointments/[id] - Cancel appointment
 *
 * Manages individual appointment operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/src/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/src/lib/auth/server'
import { logAuditEvent } from '@/src/lib/audit/server'
import logger from '../../../../lib/logger';

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = 'nodejs'

// Schema for appointment updates
const updateAppointmentSchema = z.object({
  appointment_date: z.string().optional(),
  start_time: z.string().optional(),
  duration_minutes: z.number().min(15).max(240).optional(),
  appointment_type: z.enum(['consulta', 'retorno', 'avaliacao', 'fisioterapia', 'reavaliacao', 'emergencia']).optional(),
  status: z.enum(['agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'falta']).optional(),
  notes: z.string().optional(),
  cancellation_reason: z.string().optional()
})

/**
 * GET /api/appointments/[id]
 * Get appointment details with related data
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await context.params
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
    if (!hasPermission(currentUser.role, 'read', 'appointments')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para visualizar agendamentos' },
        { status: 403 }
      )
    }

    // 3. Get appointment with related data
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        practitioner_id,
        appointment_date,
        start_time,
        duration_minutes,
        appointment_type,
        status,
        notes,
        reminder_sent,
        is_recurring,
        recurrence_pattern,
        created_at,
        updated_at,
        patient:patients!appointments_patient_id_fkey(
          id,
          name,
          cpf,
          phone,
          email,
          photo_url
        ),
        practitioner:profiles!appointments_practitioner_id_fkey(
          id,
          full_name,
          role,
          phone,
          email
        ),
        sessions:sessions!sessions_appointment_id_fkey(
          id,
          session_type,
          duration_minutes,
          status,
          created_at
        )
      `)
      .eq('id', appointmentId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Agendamento não encontrado' },
          { status: 404 }
        )
      }

      logger.error('Erro ao buscar agendamento:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar agendamento' },
        { status: 500 }
      )
    }

    // 4. Log access
    await logAuditEvent({
      table_name: 'appointments',
      operation: 'READ',
      record_id: appointmentId,
      user_id: currentUser.id,
      additional_data: {
        appointment_date: appointment.appointment_date,
        patient_name: appointment.patient.name
      }
    })

    // 5. Return response
    return NextResponse.json({
      success: true,
      data: appointment
    })

  } catch (error) {
    logger.error('Erro inesperado ao buscar agendamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/appointments/[id]
 * Update appointment details
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await context.params
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
    if (!hasPermission(currentUser.role, 'write', 'appointments')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para editar agendamentos' },
        { status: 403 }
      )
    }

    // 3. Get current appointment
    const { data: currentAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, status, appointment_date, start_time, patient_id, practitioner_id')
      .eq('id', appointmentId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Agendamento não encontrado' },
          { status: 404 }
        )
      }

      logger.error('Erro ao buscar agendamento atual:', fetchError)
      return NextResponse.json(
        { error: 'Erro ao buscar agendamento' },
        { status: 500 }
      )
    }

    // 4. Parse and validate request body
    const body = await request.json()
    const validatedData = updateAppointmentSchema.parse(body)

    // 5. Check for conflicts if date/time is being changed
    if (validatedData.appointment_date || validatedData.start_time) {
      const newDate = validatedData.appointment_date || currentAppointment.appointment_date
      const newTime = validatedData.start_time || currentAppointment.start_time
      
      // Check for conflicts (exclude current appointment)
      const { data: conflictingAppointments } = await supabase
        .rpc('check_appointment_conflicts', {
          p_practitioner_id: currentAppointment.practitioner_id,
          p_appointment_date: newDate,
          p_start_time: newTime,
          p_end_time: newTime ? `${parseInt(newTime.split(':')[0] || '0') + 1}:${newTime.split(':')[1] || '00'}:00` : '00:00:00',
          p_exclude_appointment_id: appointmentId
        })

      if (conflictingAppointments && conflictingAppointments.length > 0) {
        return NextResponse.json(
          { 
            error: 'Conflito de horário detectado',
            conflicts: conflictingAppointments
          },
          { status: 409 }
        )
      }
    }

    // 6. Prepare update data
    const updateData: any = {
      updated_by: currentUser.id,
      updated_at: new Date().toISOString()
    }

    // Add fields that were provided
    Object.keys(validatedData).forEach(key => {
      const value = validatedData[key as keyof typeof validatedData]
      if (value !== undefined) {
        updateData[key] = value
      }
    })

    // 7. Update appointment
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .select(`
        id,
        patient_id,
        practitioner_id,
        appointment_date,
        start_time,
        duration_minutes,
        appointment_type,
        status,
        notes,
        reminder_sent,
        reminder_enabled,
        is_recurring,
        cancellation_reason,
        updated_at,
        patient:patients!appointments_patient_id_fkey(
          id,
          name,
          cpf,
          phone,
          email
        ),
        practitioner:profiles!appointments_practitioner_id_fkey(
          id,
          full_name,
          role
        )
      `)
      .single()

    if (updateError) {
      logger.error('Erro ao atualizar agendamento:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar agendamento' },
        { status: 500 }
      )
    }

    // 8. Log audit event
    await logAuditEvent({
      table_name: 'appointments',
      operation: 'UPDATE',
      record_id: appointmentId,
      user_id: currentUser.id,
      additional_data: {
        old_status: currentAppointment.status,
        new_status: validatedData.status,
        changes: Object.keys(validatedData),
        patient_id: currentAppointment.patient_id
      }
    })

    // 9. Send notification if status changed to cancelled
    if (validatedData.status === 'cancelado') {
      // TODO: Implement notification sending
      logger.info('Appointment cancelled, should send notification')
    }

    // 10. Return response
    return NextResponse.json({
      success: true,
      data: updatedAppointment,
      message: 'Agendamento atualizado com sucesso'
    })

  } catch (error) {
    logger.error('Erro inesperado ao atualizar agendamento:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: error.issues.map(e => ({
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
 * DELETE /api/appointments/[id]
 * Cancel appointment (soft delete)
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await context.params
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
    if (!hasPermission(currentUser.role, 'delete', 'appointments')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para cancelar agendamentos' },
        { status: 403 }
      )
    }

    // 3. Get appointment details
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, status, patient_id, appointment_date, start_time')
      .eq('id', appointmentId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Agendamento não encontrado' },
          { status: 404 }
        )
      }

      logger.error('Erro ao buscar agendamento:', fetchError)
      return NextResponse.json(
        { error: 'Erro ao buscar agendamento' },
        { status: 500 }
      )
    }

    // 4. Check if appointment can be cancelled
    if (appointment.status === 'concluido') {
      return NextResponse.json(
        { error: 'Não é possível cancelar um agendamento já concluído' },
        { status: 400 }
      )
    }

    if (appointment.status === 'cancelado') {
      return NextResponse.json(
        { error: 'Agendamento já está cancelado' },
        { status: 400 }
      )
    }

    // 5. Cancel appointment
    const { data: cancelledAppointment, error: cancelError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelado',
        cancellation_reason: 'Cancelado pelo usuário',
        cancelled_at: new Date().toISOString(),
        cancelled_by: currentUser.id,
        updated_by: currentUser.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select('id, status, appointment_date, start_time')
      .single()

    if (cancelError) {
      logger.error('Erro ao cancelar agendamento:', cancelError)
      return NextResponse.json(
        { error: 'Erro ao cancelar agendamento' },
        { status: 500 }
      )
    }

    // 6. Log audit event
    await logAuditEvent({
      table_name: 'appointments',
      operation: 'CANCEL',
      record_id: appointmentId,
      user_id: currentUser.id,
      additional_data: {
        old_status: appointment.status,
        patient_id: appointment.patient_id,
        appointment_date: appointment.appointment_date,
        start_time: appointment.start_time
      }
    })

    // 7. Return response
    return NextResponse.json({
      success: true,
      data: cancelledAppointment,
      message: 'Agendamento cancelado com sucesso'
    })

  } catch (error) {
    logger.error('Erro inesperado ao cancelar agendamento:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: error.issues.map(e => ({
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