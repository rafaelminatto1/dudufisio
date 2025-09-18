/**
 * API Endpoint - Appointments Management - FisioFlow
 * GET /api/appointments - List appointments with filters
 * POST /api/appointments - Create new appointment
 *
 * Implements conflict prevention, Brazilian business rules, and RBAC
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/lib/auth/server'
import { logAuditEvent } from '@/lib/audit/server'

// Schema for appointment creation
const createAppointmentSchema = z.object({
  patient_id: z.string().uuid('ID do paciente inválido'),
  practitioner_id: z.string().uuid('ID do profissional inválido'),
  appointment_date: z.string().min(1, 'Data do agendamento é obrigatória'),
  start_time: z.string().min(1, 'Horário de início é obrigatório'),
  duration_minutes: z.number().min(15, 'Duração mínima de 15 minutos').max(240, 'Duração máxima de 4 horas'),
  appointment_type: z.enum(['consulta', 'retorno', 'avaliacao', 'fisioterapia', 'reavaliacao', 'emergencia']),
  notes: z.string().optional(),
  reminder_enabled: z.boolean().default(true),
  
  // Recurring appointments
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recurrence_count: z.number().min(1).max(52).optional(),
  recurrence_days: z.array(z.number().min(0).max(6)).optional(),
  
  // Conflict resolution
  conflict_resolution: z.enum(['prevent', 'allow', 'suggest_alternative']).default('prevent')
})

// Schema for appointment search/filters
const searchAppointmentsSchema = z.object({
  patient_id: z.string().uuid().optional(),
  practitioner_id: z.string().uuid().optional(),
  appointment_date: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'falta']).optional(),
  appointment_type: z.enum(['consulta', 'retorno', 'avaliacao', 'fisioterapia', 'reavaliacao', 'emergencia']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(['appointment_date', 'start_time', 'created_at']).default('appointment_date'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
})

/**
 * GET /api/appointments
 * List appointments with filters
 */
export async function GET(request: NextRequest) {
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

    // 2. Check permissions
    if (!hasPermission(currentUser.role, 'read', 'appointments')) {
      await logAuditEvent({
        table_name: 'appointments',
        operation: 'READ_DENIED',
        record_id: null,
        user_id: currentUser.id,
        additional_data: {
          reason: 'insufficient_permissions',
          attempted_role: currentUser.role
        }
      })

      return NextResponse.json(
        { error: 'Permissão insuficiente para visualizar agendamentos' },
        { status: 403 }
      )
    }

    // 3. Parse search parameters
    const { searchParams } = new URL(request.url)
    const searchData = searchAppointmentsSchema.parse({
      patient_id: searchParams.get('patient_id'),
      practitioner_id: searchParams.get('practitioner_id'),
      appointment_date: searchParams.get('appointment_date'),
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
      status: searchParams.get('status'),
      appointment_type: searchParams.get('appointment_type'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order')
    })

    // 4. Build query
    let query = supabase
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
      .eq('org_id', currentUser.org_id)

    // Apply filters
    if (searchData.patient_id) {
      query = query.eq('patient_id', searchData.patient_id)
    }

    if (searchData.practitioner_id) {
      query = query.eq('practitioner_id', searchData.practitioner_id)
    }

    if (searchData.appointment_date) {
      query = query.eq('appointment_date', searchData.appointment_date)
    }

    if (searchData.start_date && searchData.end_date) {
      query = query.gte('appointment_date', searchData.start_date)
      query = query.lte('appointment_date', searchData.end_date)
    }

    if (searchData.status) {
      query = query.eq('status', searchData.status)
    }

    if (searchData.appointment_type) {
      query = query.eq('appointment_type', searchData.appointment_type)
    }

    // Apply sorting
    query = query.order(searchData.sort_by, { ascending: searchData.sort_order === 'asc' })

    // Apply pagination
    const from = (searchData.page - 1) * searchData.limit
    const to = from + searchData.limit - 1
    query = query.range(from, to)

    // 5. Execute query
    const { data: appointments, error, count } = await query

    if (error) {
      console.error('Erro ao buscar agendamentos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar agendamentos' },
        { status: 500 }
      )
    }

    // 6. Log access
    await logAuditEvent({
      table_name: 'appointments',
      operation: 'READ',
      record_id: null,
      user_id: currentUser.id,
      additional_data: {
        search_params: searchData,
        result_count: appointments?.length || 0
      }
    })

    // 7. Return response
    return NextResponse.json({
      success: true,
      data: appointments || [],
      meta: {
        total: count || 0,
        page: searchData.page,
        limit: searchData.limit,
        total_pages: Math.ceil((count || 0) / searchData.limit)
      }
    })

  } catch (error) {
    console.error('Erro inesperado ao buscar agendamentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/appointments
 * Create new appointment
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

    // 2. Check permissions
    if (!hasPermission(currentUser.role, 'write', 'appointments')) {
      await logAuditEvent({
        table_name: 'appointments',
        operation: 'CREATE_DENIED',
        record_id: null,
        user_id: currentUser.id,
        additional_data: {
          reason: 'insufficient_permissions',
          attempted_role: currentUser.role
        }
      })

      return NextResponse.json(
        { error: 'Permissão insuficiente para criar agendamentos' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validatedData = createAppointmentSchema.parse(body)

    // 4. Calculate end time
    const startTime = new Date(`${validatedData.appointment_date}T${validatedData.start_time}`)
    const endTime = new Date(startTime.getTime() + validatedData.duration_minutes * 60000)
    const endTimeString = endTime.toTimeString().slice(0, 5)

    // 5. Check for conflicts if prevention is enabled
    if (validatedData.conflict_resolution === 'prevent') {
      const { data: conflicts, error: conflictError } = await supabase
        .rpc('check_appointment_conflicts', {
          p_practitioner_id: validatedData.practitioner_id,
          p_appointment_date: validatedData.appointment_date,
          p_start_time: validatedData.start_time,
          p_end_time: endTimeString
        })

      if (conflictError) {
        console.error('Erro ao verificar conflitos:', conflictError)
        return NextResponse.json(
          { error: 'Erro ao verificar conflitos de horário' },
          { status: 500 }
        )
      }

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          { 
            error: 'Conflito de horário detectado',
            conflicts: conflicts,
            suggestion: 'Tente outro horário ou habilite a opção de permitir conflitos'
          },
          { status: 409 }
        )
      }
    }

    // 6. Verify patient exists and belongs to organization
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, name, status')
      .eq('id', validatedData.patient_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      )
    }

    if (patient.status !== 'active') {
      return NextResponse.json(
        { error: 'Paciente não está ativo' },
        { status: 400 }
      )
    }

    // 7. Verify practitioner exists and belongs to organization
    const { data: practitioner, error: practitionerError } = await supabase
      .from('org_memberships')
      .select('user_id, role, profiles!org_memberships_user_id_fkey(id, name)')
      .eq('user_id', validatedData.practitioner_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (practitionerError || !practitioner) {
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      )
    }

    // 8. Create appointment
    const { data: newAppointment, error: createError } = await supabase
      .from('appointments')
      .insert({
        org_id: currentUser.org_id,
        patient_id: validatedData.patient_id,
        practitioner_id: validatedData.practitioner_id,
        appointment_date: validatedData.appointment_date,
        start_time: validatedData.start_time,
        end_time: endTimeString,
        duration_minutes: validatedData.duration_minutes,
        appointment_type: validatedData.appointment_type,
        status: 'agendado',
        notes: validatedData.notes,
        reminder_sent: false,
        is_recurring: validatedData.is_recurring,
        recurrence_pattern: validatedData.recurrence_pattern,
        recurrence_count: validatedData.recurrence_count,
        recurrence_days: validatedData.recurrence_days,
        conflict_resolution: validatedData.conflict_resolution,
        created_by: currentUser.id,
        updated_by: currentUser.id
      })
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
        is_recurring,
        recurrence_pattern,
        recurrence_count,
        created_at,
        patient:patients!appointments_patient_id_fkey(
          id,
          name,
          phone
        ),
        practitioner:profiles!appointments_practitioner_id_fkey(
          id,
          full_name
        )
      `)
      .single()

    if (createError) {
      console.error('Erro ao criar agendamento:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar agendamento' },
        { status: 500 }
      )
    }

    // 9. Generate reminders if enabled
    if (validatedData.reminder_enabled && newAppointment) {
      await supabase
        .rpc('generate_appointment_reminders', {
          p_appointment_id: newAppointment.id
        })
    }

    // 10. Log audit event
    await logAuditEvent({
      table_name: 'appointments',
      operation: 'CREATE',
      record_id: newAppointment.id,
      user_id: currentUser.id,
      additional_data: {
        patient_name: patient.name,
        practitioner_name: practitioner.profiles.name,
        appointment_date: validatedData.appointment_date,
        appointment_type: validatedData.appointment_type,
        is_recurring: validatedData.is_recurring
      }
    })

    // 11. Return response
    return NextResponse.json({
      success: true,
      data: newAppointment,
      message: 'Agendamento criado com sucesso'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro inesperado ao criar agendamento:', error)
    
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
