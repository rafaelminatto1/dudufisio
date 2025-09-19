/**
 * API Endpoint - Smart Appointment Rescheduling - FisioFlow
 * POST /api/appointments/reschedule - Intelligent rescheduling with conflict resolution
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/lib/auth/server'
import { logAuditEvent } from '@/lib/audit/server'

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = 'nodejs'

const rescheduleSchema = z.object({
  appointment_id: z.string().uuid(),
  preferred_dates: z.array(z.string()).min(1, 'Pelo menos uma data preferencial é obrigatória'),
  preferred_times: z.array(z.string()).min(1, 'Pelo menos um horário preferencial é obrigatório'),
  max_wait_days: z.number().min(1).max(30).default(7),
  same_practitioner: z.boolean().default(true),
  reason: z.string().optional(),
  notify_patient: z.boolean().default(true)
})

type RescheduleRequest = z.infer<typeof rescheduleSchema>

interface AvailableSlot {
  date: string
  time: string
  practitioner_id: string
  practitioner_name: string
  score: number // Compatibility score (0-100)
}

/**
 * POST /api/appointments/reschedule
 * Smart rescheduling with automatic conflict resolution
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // 1. Authentication and authorization
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    if (!hasPermission(currentUser.role, 'write', 'appointments')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para reagendar' },
        { status: 403 }
      )
    }

    // 2. Parse and validate request
    const body = await request.json()
    const validatedData = rescheduleSchema.parse(body)

    // 3. Get original appointment
    const { data: originalAppointment, error: fetchError } = await supabase
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
        patient:patients!appointments_patient_id_fkey(
          id,
          name,
          email,
          phone,
          preferred_contact_method
        ),
        practitioner:profiles!appointments_practitioner_id_fkey(
          id,
          name,
          email
        )
      `)
      .eq('id', validatedData.appointment_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (fetchError || !originalAppointment) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      )
    }

    // 4. Find available slots
    const availableSlots = await findAvailableSlots(
      supabase,
      currentUser.org_id,
      originalAppointment,
      validatedData
    )

    if (availableSlots.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhum horário disponível encontrado',
          suggestions: await getSuggestedAlternatives(
            supabase,
            currentUser.org_id,
            originalAppointment,
            validatedData
          )
        },
        { status: 200 }
      )
    }

    // 5. Select best slot (highest score)
    const bestSlot = availableSlots[0]

    // 6. Update appointment
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        appointment_date: bestSlot.date,
        start_time: bestSlot.time,
        practitioner_id: bestSlot.practitioner_id,
        status: 'agendado', // Reset to scheduled
        updated_by: currentUser.id,
        updated_at: new Date().toISOString(),
        notes: originalAppointment.notes ?
          `${originalAppointment.notes}\n\n[Reagendado automaticamente: ${validatedData.reason || 'Sem motivo especificado'}]` :
          `[Reagendado automaticamente: ${validatedData.reason || 'Sem motivo especificado'}]`
      })
      .eq('id', validatedData.appointment_id)
      .eq('org_id', currentUser.org_id)
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        patient:patients!appointments_patient_id_fkey(
          name,
          email,
          phone
        ),
        practitioner:profiles!appointments_practitioner_id_fkey(
          name,
          email
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating appointment:', updateError)
      return NextResponse.json(
        { error: 'Erro ao reagendar' },
        { status: 500 }
      )
    }

    // 7. Log audit event
    await logAuditEvent({
      table_name: 'appointments',
      operation: 'RESCHEDULE',
      record_id: validatedData.appointment_id,
      user_id: currentUser.id,
      additional_data: {
        original_date: originalAppointment.appointment_date,
        original_time: originalAppointment.start_time,
        new_date: bestSlot.date,
        new_time: bestSlot.time,
        reason: validatedData.reason,
        auto_rescheduled: true
      }
    })

    // 8. Send notifications if requested
    if (validatedData.notify_patient && originalAppointment.patient) {
      await sendRescheduleNotification(
        originalAppointment.patient,
        originalAppointment,
        updatedAppointment,
        validatedData.reason
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        appointment: updatedAppointment,
        original_slot: {
          date: originalAppointment.appointment_date,
          time: originalAppointment.start_time
        },
        new_slot: {
          date: bestSlot.date,
          time: bestSlot.time,
          practitioner_name: bestSlot.practitioner_name
        },
        alternatives: availableSlots.slice(1, 4), // Show top 3 alternatives
        notification_sent: validatedData.notify_patient
      },
      message: 'Agendamento reagendado com sucesso'
    })

  } catch (error) {
    console.error('Unexpected error in rescheduling:', error)

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
 * Find available slots based on preferences
 */
async function findAvailableSlots(
  supabase: any,
  orgId: string,
  originalAppointment: any,
  preferences: RescheduleRequest
): Promise<AvailableSlot[]> {
  const availableSlots: AvailableSlot[] = []

  // Get practitioners (original or all if flexible)
  const practitioners = preferences.same_practitioner
    ? [{ id: originalAppointment.practitioner_id, name: originalAppointment.practitioner.name }]
    : await getPractitioners(supabase, orgId)

  // Check each preferred date
  for (const date of preferences.preferred_dates) {
    for (const time of preferences.preferred_times) {
      for (const practitioner of practitioners) {
        // Calculate end time
        const startTime = new Date(`${date}T${time}`)
        const endTime = new Date(startTime.getTime() + originalAppointment.duration_minutes * 60000)
        const endTimeString = endTime.toTimeString().slice(0, 5)

        // Check for conflicts
        const { data: conflicts } = await supabase
          .rpc('check_appointment_conflicts', {
            p_practitioner_id: practitioner.id,
            p_appointment_date: date,
            p_start_time: time,
            p_end_time: endTimeString,
            p_exclude_appointment_id: originalAppointment.id
          })

        if (!conflicts || conflicts.length === 0) {
          // Calculate compatibility score
          const score = calculateCompatibilityScore(
            date,
            time,
            practitioner.id,
            originalAppointment,
            preferences
          )

          availableSlots.push({
            date,
            time,
            practitioner_id: practitioner.id,
            practitioner_name: practitioner.name,
            score
          })
        }
      }
    }
  }

  // Sort by score (highest first)
  return availableSlots.sort((a, b) => b.score - a.score)
}

/**
 * Get available practitioners
 */
async function getPractitioners(supabase: any, orgId: string) {
  const { data: practitioners } = await supabase
    .from('org_memberships')
    .select(`
      user_id,
      profiles!org_memberships_user_id_fkey(
        id,
        name
      )
    `)
    .eq('org_id', orgId)
    .eq('is_active', true)
    .in('role', ['admin', 'fisioterapeuta'])

  return practitioners
    ?.filter((p: any) => p.profiles)
    .map((p: any) => ({
      id: p.profiles.id,
      name: p.profiles.name
    })) || []
}

/**
 * Calculate compatibility score for a slot
 */
function calculateCompatibilityScore(
  date: string,
  time: string,
  practitionerId: string,
  originalAppointment: any,
  preferences: RescheduleRequest
): number {
  let score = 50 // Base score

  // Same practitioner bonus
  if (practitionerId === originalAppointment.practitioner_id) {
    score += 30
  }

  // Time proximity bonus (closer to original time = higher score)
  const originalTime = new Date(`2024-01-01T${originalAppointment.start_time}`)
  const slotTime = new Date(`2024-01-01T${time}`)
  const timeDiff = Math.abs(originalTime.getTime() - slotTime.getTime()) / (1000 * 60 * 60) // hours
  score += Math.max(0, 20 - timeDiff * 2) // Max 20 points for same time

  // Date proximity bonus (sooner = higher score, but not too soon)
  const slotDate = new Date(date)
  const originalDate = new Date(originalAppointment.appointment_date)
  const daysDiff = Math.abs((slotDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24))

  if (daysDiff <= 3) {
    score += 15
  } else if (daysDiff <= 7) {
    score += 10
  }

  // Preferred time slot bonus
  const preferredHours = ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00']
  if (preferredHours.includes(time)) {
    score += 10
  }

  return Math.min(100, Math.max(0, score))
}

/**
 * Get suggested alternatives when no perfect match is found
 */
async function getSuggestedAlternatives(
  supabase: any,
  orgId: string,
  originalAppointment: any,
  preferences: RescheduleRequest
): Promise<any[]> {
  // Expand search to next 14 days
  const suggestions = []
  const today = new Date()

  for (let i = 1; i <= 14; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() + i)
    const dateStr = checkDate.toISOString().split('T')[0]

    for (const time of ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00']) {
      const slots = await findAvailableSlots(
        supabase,
        orgId,
        originalAppointment,
        {
          ...preferences,
          preferred_dates: [dateStr],
          preferred_times: [time]
        }
      )

      if (slots.length > 0) {
        suggestions.push(slots[0])
      }

      if (suggestions.length >= 5) break
    }

    if (suggestions.length >= 5) break
  }

  return suggestions
}

/**
 * Send reschedule notification to patient
 */
async function sendRescheduleNotification(
  patient: any,
  originalAppointment: any,
  newAppointment: any,
  reason?: string
): Promise<void> {
  // Implementation would depend on your notification service
  // This is a placeholder for the notification logic
  console.log('Sending reschedule notification:', {
    patient: patient.name,
    original: `${originalAppointment.appointment_date} ${originalAppointment.start_time}`,
    new: `${newAppointment.appointment_date} ${newAppointment.start_time}`,
    reason
  })

  // TODO: Integrate with email/SMS service
  // Example: await sendEmail(patient.email, rescheduleTemplate, data)
}