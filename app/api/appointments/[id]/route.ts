/**
 * API Endpoint - Single Appointment Management - FisioFlow
 * GET /api/appointments/[id] - Get appointment details
 * PATCH /api/appointments/[id] - Update appointment
 * DELETE /api/appointments/[id] - Cancel appointment
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/lib/auth/server'
import { logAuditEvent } from '@/lib/audit/server'

// Schema for appointment updates
const updateAppointmentSchema = z.object({
  appointment_date: z.string().optional(),
  start_time: z.string().optional(),
  duration_minutes: z.number().min(15).max(240).optional(),
  appointment_type: z.enum(['consulta', 'retorno', 'avaliacao', 'fisioterapia', 'reavaliacao', 'emergencia']).optional(),
  status: z.enum(['agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'falta']).optional(),
  notes: z.string().optional(),
  reminder_enabled: z.boolean().optional()
})

/**
 * GET /api/appointments/[id]
 * Get appointment details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const appointmentId = params.id

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
      await logAuditEvent({
        table_name: 'appointments',
        operation: 'READ_DENIED',
        record_id: appointmentId,
        user_id: currentUser.id,
        additional_data: {
          reason: 'insufficient_permissions'
        }
      })

      return NextResponse.json(
        { error: 'Permissão insuficiente para visualizar agendamento' },
        { status: 403 }
      )
    }

    // 3. Get appointment details
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        practitioner_id,
        appointment_date,
        start_time,
        end_time,
        duration_minutes,
        appointment_type,
        status,
        notes,
        reminder_sent,
        is_recurring,
        recurrence_pattern,
        recurrence_count,
        created_at,
        updated_at,
        patient:patients!appointments_patient_id_fkey(
          id,
          name,
          phone,
          email
        ),
        practitioner:profiles!appointments_practitioner_id_fkey(
          id,
          full_name,
          role
        )
      `)
      .eq('id', appointmentId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (error) {
      console.error('Error fetching appointment:', error)
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      )
    }

    // 4. Log access
    await logAuditEvent({
      table_name: 'appointments',
      operation: 'READ',
      record_id: appointmentId,
      user_id: currentUser.id,
      additional_data: {
        patient_id: appointment.patient_id,
        appointment_date: appointment.appointment_date
      }
    })

    return NextResponse.json({
      success: true,
      data: appointment
    })

  } catch (error) {
    console.error('Unexpected error fetching appointment:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/appointments/[id]
 * Update appointment
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const appointmentId = params.id

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
      await logAuditEvent({
        table_name: 'appointments',
        operation: 'UPDATE_DENIED',
        record_id: appointmentId,
        user_id: currentUser.id,
        additional_data: {
          reason: 'insufficient_permissions'
        }
      })

      return NextResponse.json(
        { error: 'Permissão insuficiente para editar agendamento' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validatedData = updateAppointmentSchema.parse(body)

    // 4. Calculate end time if start time or duration changed
    let updateData: any = {
      ...validatedData,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString()
    }

    if (validatedData.start_time && validatedData.duration_minutes) {
      const startTime = new Date(`2024-01-01T${validatedData.start_time}`)
      const endTime = new Date(startTime.getTime() + validatedData.duration_minutes * 60000)
      updateData.end_time = endTime.toTimeString().slice(0, 5)
    }

    // 5. Check for conflicts if appointment time is being changed
    if (validatedData.appointment_date || validatedData.start_time || validatedData.duration_minutes) {
      // Get current appointment data for conflict checking
      const { data: currentAppointment } = await supabase
        .from('appointments')
        .select('practitioner_id, appointment_date, start_time, duration_minutes')
        .eq('id', appointmentId)
        .single()

      if (currentAppointment) {
        const checkDate = validatedData.appointment_date || currentAppointment.appointment_date
        const checkStartTime = validatedData.start_time || currentAppointment.start_time
        const checkDuration = validatedData.duration_minutes || currentAppointment.duration_minutes

        const startTime = new Date(`${checkDate}T${checkStartTime}`)
        const endTime = new Date(startTime.getTime() + checkDuration * 60000)
        const endTimeString = endTime.toTimeString().slice(0, 5)

        const { data: conflicts } = await supabase
          .rpc('check_appointment_conflicts', {
            p_practitioner_id: currentAppointment.practitioner_id,
            p_appointment_date: checkDate,
            p_start_time: checkStartTime,
            p_end_time: endTimeString,
            p_exclude_appointment_id: appointmentId
          })

        if (conflicts && conflicts.length > 0) {
          return NextResponse.json(
            {
              error: 'Conflito de horário detectado',
              conflicts: conflicts
            },
            { status: 409 }
          )
        }
      }
    }

    // 6. Update appointment
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .eq('org_id', currentUser.org_id)
      .select(`
        id,
        patient_id,
        practitioner_id,
        appointment_date,
        start_time,
        end_time,
        duration_minutes,
        appointment_type,
        status,
        notes,
        updated_at,
        patient:patients!appointments_patient_id_fkey(
          name
        ),
        practitioner:profiles!appointments_practitioner_id_fkey(
          full_name
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating appointment:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar agendamento' },
        { status: 500 }
      )
    }

    // 7. Log audit event
    await logAuditEvent({
      table_name: 'appointments',
      operation: 'UPDATE',
      record_id: appointmentId,
      user_id: currentUser.id,
      additional_data: {
        updated_fields: Object.keys(validatedData),
        old_status: body.old_status,
        new_status: validatedData.status
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedAppointment,
      message: 'Agendamento atualizado com sucesso'
    })

  } catch (error) {
    console.error('Unexpected error updating appointment:', error)

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
 * DELETE /api/appointments/[id]
 * Cancel appointment (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const appointmentId = params.id

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
      await logAuditEvent({
        table_name: 'appointments',
        operation: 'DELETE_DENIED',
        record_id: appointmentId,
        user_id: currentUser.id,
        additional_data: {
          reason: 'insufficient_permissions'
        }
      })

      return NextResponse.json(
        { error: 'Permissão insuficiente para cancelar agendamento' },
        { status: 403 }
      )
    }

    // 3. Get appointment info before deletion for logging
    const { data: appointment } = await supabase
      .from('appointments')
      .select(`
        patient_id,
        appointment_date,
        start_time,
        patient:patients!appointments_patient_id_fkey(name),
        practitioner:profiles!appointments_practitioner_id_fkey(full_name)
      `)
      .eq('id', appointmentId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (!appointment) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      )
    }

    // 4. Soft delete by updating status to cancelled
    const { error: deleteError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelado',
        updated_by: currentUser.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .eq('org_id', currentUser.org_id)

    if (deleteError) {
      console.error('Error cancelling appointment:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao cancelar agendamento' },
        { status: 500 }
      )
    }

    // 5. Log audit event
    await logAuditEvent({
      table_name: 'appointments',
      operation: 'DELETE',
      record_id: appointmentId,
      user_id: currentUser.id,
      additional_data: {
        patient_name: appointment.patient?.name,
        practitioner_name: appointment.practitioner?.full_name,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.start_time
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Agendamento cancelado com sucesso'
    })

  } catch (error) {
    console.error('Unexpected error cancelling appointment:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}