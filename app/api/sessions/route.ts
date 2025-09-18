/**
 * API Endpoint - Sessions Management - FisioFlow
 * GET /api/sessions - List sessions with filters
 * POST /api/sessions - Create new session
 *
 * Implements Brazilian healthcare compliance, LGPD requirements, and RBAC
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/lib/auth/server'
import { logAuditEvent } from '@/lib/audit/server'

// Schema for session creation
const createSessionSchema = z.object({
  patient_id: z.string().uuid('ID do paciente deve ser um UUID válido'),
  session_type: z.enum(['avaliacao', 'evolucao', 'alta', 'retorno']),
  session_date: z.string().min(1, 'Data da sessão é obrigatória'),
  duration_minutes: z.number().min(15, 'Duração mínima de 15 minutos').max(240, 'Duração máxima de 4 horas'),

  // Clinical data
  chief_complaint: z.string().optional(),
  pain_assessment_before: z.number().min(0).max(10).optional(),
  pain_assessment_after: z.number().min(0).max(10).optional(),
  procedures: z.string().optional(),
  techniques_used: z.string().optional(),
  patient_response: z.string().optional(),
  objective_findings: z.string().optional(),
  treatment_plan: z.string().optional(),
  homework_exercises: z.string().optional(),

  // Progress tracking
  functional_improvement: z.enum(['nenhuma', 'leve', 'moderada', 'significativa']).optional(),
  patient_satisfaction: z.number().min(1).max(5).optional(),
  next_appointment_recommendation: z.string().optional(),

  // Clinical notes
  clinical_notes: z.string().optional(),
  observations: z.string().optional(),

  // Goals and outcomes
  short_term_goals: z.string().optional(),
  long_term_goals: z.string().optional(),

  status: z.enum(['agendada', 'em_andamento', 'concluida', 'cancelada']).default('concluida')
})

// Schema for session search/filters
const searchSessionsSchema = z.object({
  patient_id: z.string().uuid().optional(),
  therapist_id: z.string().uuid().optional(),
  session_type: z.enum(['avaliacao', 'evolucao', 'alta', 'retorno']).optional(),
  status: z.enum(['agendada', 'em_andamento', 'concluida', 'cancelada']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(['session_date', 'created_at']).default('session_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
})

/**
 * GET /api/sessions
 * List sessions with filters
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
    if (!hasPermission(currentUser.role, 'read', 'sessions')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para visualizar sessões' },
        { status: 403 }
      )
    }

    // 3. Parse search parameters
    const { searchParams } = new URL(request.url)
    const searchData = searchSessionsSchema.parse({
      patient_id: searchParams.get('patient_id'),
      therapist_id: searchParams.get('therapist_id'),
      session_type: searchParams.get('session_type'),
      status: searchParams.get('status'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order')
    })

    // 4. Build query
    let query = supabase
      .from('sessions')
      .select(`
        id,
        patient_id,
        session_type,
        session_date,
        duration_minutes,
        pain_assessment_before,
        pain_assessment_after,
        procedures,
        techniques_used,
        functional_improvement,
        patient_satisfaction,
        status,
        created_at,
        updated_at,
        patient:patients!sessions_patient_id_fkey(id, name, cpf),
        therapist:profiles!sessions_created_by_fkey(id, full_name)
      `)
      .eq('org_id', currentUser.org_id)

    // Apply filters
    if (searchData.patient_id) {
      query = query.eq('patient_id', searchData.patient_id)
    }

    if (searchData.therapist_id) {
      query = query.eq('created_by', searchData.therapist_id)
    }

    if (searchData.session_type) {
      query = query.eq('session_type', searchData.session_type)
    }

    if (searchData.status) {
      query = query.eq('status', searchData.status)
    }

    if (searchData.date_from) {
      query = query.gte('session_date', searchData.date_from)
    }

    if (searchData.date_to) {
      query = query.lte('session_date', searchData.date_to)
    }

    // Apply sorting
    query = query.order(searchData.sort_by, { ascending: searchData.sort_order === 'asc' })

    // Apply pagination
    const from = (searchData.page - 1) * searchData.limit
    const to = from + searchData.limit - 1
    query = query.range(from, to)

    // 5. Execute query
    const { data: sessions, error, count } = await query

    if (error) {
      console.error('Erro ao buscar sessões:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar sessões' },
        { status: 500 }
      )
    }

    // 6. Return response
    return NextResponse.json({
      success: true,
      data: sessions || [],
      meta: {
        total: count || 0,
        page: searchData.page,
        limit: searchData.limit,
        total_pages: Math.ceil((count || 0) / searchData.limit)
      }
    })

  } catch (error) {
    console.error('Erro inesperado ao buscar sessões:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sessions
 * Create new session
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
    if (!hasPermission(currentUser.role, 'write', 'sessions')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para criar sessões' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validatedData = createSessionSchema.parse(body)

    // 4. Check if patient exists and belongs to the organization
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, name, consent_lgpd')
      .eq('id', validatedData.patient_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (patientError) {
      if (patientError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Paciente não encontrado' },
          { status: 404 }
        )
      }

      console.error('Erro ao verificar paciente:', patientError)
      return NextResponse.json(
        { error: 'Erro ao verificar paciente' },
        { status: 500 }
      )
    }

    // 5. Check LGPD consent
    if (!patient.consent_lgpd) {
      return NextResponse.json(
        { error: 'Paciente não forneceu consentimento LGPD para criação de sessões' },
        { status: 403 }
      )
    }

    // 6. Create session
    const { data: newSession, error: createError } = await supabase
      .from('sessions')
      .insert({
        org_id: currentUser.org_id,
        patient_id: validatedData.patient_id,
        session_type: validatedData.session_type,
        session_date: validatedData.session_date,
        duration_minutes: validatedData.duration_minutes,
        chief_complaint: validatedData.chief_complaint,
        pain_assessment_before: validatedData.pain_assessment_before,
        pain_assessment_after: validatedData.pain_assessment_after,
        procedures: validatedData.procedures,
        techniques_used: validatedData.techniques_used,
        patient_response: validatedData.patient_response,
        objective_findings: validatedData.objective_findings,
        treatment_plan: validatedData.treatment_plan,
        homework_exercises: validatedData.homework_exercises,
        functional_improvement: validatedData.functional_improvement,
        patient_satisfaction: validatedData.patient_satisfaction,
        next_appointment_recommendation: validatedData.next_appointment_recommendation,
        clinical_notes: validatedData.clinical_notes,
        observations: validatedData.observations,
        short_term_goals: validatedData.short_term_goals,
        long_term_goals: validatedData.long_term_goals,
        status: validatedData.status,
        created_by: currentUser.id,
        updated_by: currentUser.id
      })
      .select(`
        id,
        patient_id,
        session_type,
        session_date,
        duration_minutes,
        status,
        created_at,
        patient:patients!sessions_patient_id_fkey(name),
        therapist:profiles!sessions_created_by_fkey(full_name)
      `)
      .single()

    if (createError) {
      console.error('Erro ao criar sessão:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar sessão' },
        { status: 500 }
      )
    }

    // 7. Log audit event
    await logAuditEvent({
      table_name: 'sessions',
      operation: 'CREATE',
      record_id: newSession.id,
      user_id: currentUser.id,
      additional_data: {
        patient_id: validatedData.patient_id,
        session_type: validatedData.session_type,
        session_date: validatedData.session_date
      }
    })

    // 8. Return response
    return NextResponse.json({
      success: true,
      data: newSession,
      message: 'Sessão criada com sucesso'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro inesperado ao criar sessão:', error)

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