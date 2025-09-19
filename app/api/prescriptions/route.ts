/**
 * API Endpoint - Exercise Prescriptions Management - FisioFlow
 * GET /api/prescriptions - List prescriptions with filters
 * POST /api/prescriptions - Create new prescription
 *
 * Implements personalized exercise prescriptions for patients
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/src/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/src/lib/auth/server'
import { logAuditEvent } from '@/src/lib/audit/server'
import logger from '../../../lib/logger';

// Schema for exercise prescription item
const prescriptionExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  sets: z.number().min(1).max(10),
  repetitions: z.number().min(1).max(100).optional(),
  hold_time_seconds: z.number().min(1).max(300).optional(),
  rest_time_seconds: z.number().min(10).max(300).optional(),
  frequency_per_week: z.number().min(1).max(7),
  duration_weeks: z.number().min(1).max(52),
  progression_notes: z.string().optional(),
  custom_instructions: z.string().optional(),
  priority_order: z.number().min(1).max(100)
})

// Schema for prescription creation
const createPrescriptionSchema = z.object({
  patient_id: z.string().uuid('ID do paciente deve ser um UUID válido'),
  session_id: z.string().uuid().optional(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
  description: z.string().optional(),
  goals: z.string().min(10, 'Objetivos devem ter pelo menos 10 caracteres'),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  expected_end_date: z.string().optional(),
  frequency_description: z.string().min(5, 'Descrição da frequência é obrigatória'),
  general_instructions: z.string().optional(),
  precautions: z.string().optional(),
  exercises: z.array(prescriptionExerciseSchema).min(1, 'Pelo menos um exercício é obrigatório'),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).default('active'),
  is_template: z.boolean().default(false)
})

// Schema for prescription search/filters
const searchPrescriptionsSchema = z.object({
  patient_id: z.string().uuid().optional(),
  therapist_id: z.string().uuid().optional(),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
  is_template: z.boolean().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(['name', 'start_date', 'created_at']).default('start_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
})

/**
 * GET /api/prescriptions
 * List prescriptions with filters
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
    if (!hasPermission(currentUser.role, 'read', 'prescriptions')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para visualizar prescrições' },
        { status: 403 }
      )
    }

    // 3. Parse search parameters
    const { searchParams } = new URL(request.url)
    const searchData = searchPrescriptionsSchema.parse({
      patient_id: searchParams.get('patient_id'),
      therapist_id: searchParams.get('therapist_id'),
      status: searchParams.get('status'),
      is_template: searchParams.get('is_template') === 'true',
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
      search: searchParams.get('search'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order')
    })

    // 4. Build query
    let query = supabase
      .from('prescriptions')
      .select(`
        id,
        patient_id,
        session_id,
        name,
        description,
        goals,
        start_date,
        expected_end_date,
        frequency_description,
        status,
        is_template,
        created_at,
        updated_at,
        patient:patients!prescriptions_patient_id_fkey(id, name, cpf),
        therapist:profiles!prescriptions_created_by_fkey(id, full_name),
        prescription_exercises!inner(
          id,
          exercise_id,
          sets,
          repetitions,
          frequency_per_week,
          duration_weeks,
          priority_order,
          exercise:exercises!prescription_exercises_exercise_id_fkey(id, name, category, difficulty_level)
        )
      `)
      .eq('org_id', currentUser.org_id)

    // Apply filters
    if (searchData.patient_id) {
      query = query.eq('patient_id', searchData.patient_id)
    }

    if (searchData.therapist_id) {
      query = query.eq('created_by', searchData.therapist_id)
    }

    if (searchData.status) {
      query = query.eq('status', searchData.status)
    }

    if (searchData.is_template !== undefined) {
      query = query.eq('is_template', searchData.is_template)
    }

    if (searchData.date_from) {
      query = query.gte('start_date', searchData.date_from)
    }

    if (searchData.date_to) {
      query = query.lte('start_date', searchData.date_to)
    }

    if (searchData.search) {
      query = query.or(`name.ilike.%${searchData.search}%,description.ilike.%${searchData.search}%,goals.ilike.%${searchData.search}%`)
    }

    // Apply sorting
    query = query.order(searchData.sort_by, { ascending: searchData.sort_order === 'asc' })

    // Apply pagination
    const from = (searchData.page - 1) * searchData.limit
    const to = from + searchData.limit - 1
    query = query.range(from, to)

    // 5. Execute query
    const { data: prescriptions, error, count } = await query

    if (error) {
      logger.error('Erro ao buscar prescrições:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar prescrições' },
        { status: 500 }
      )
    }

    // 6. Return response
    return NextResponse.json({
      success: true,
      data: prescriptions || [],
      meta: {
        total: count || 0,
        page: searchData.page,
        limit: searchData.limit,
        total_pages: Math.ceil((count || 0) / searchData.limit)
      }
    })

  } catch (error) {
    logger.error('Erro inesperado ao buscar prescrições:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/prescriptions
 * Create new prescription
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
    if (!hasPermission(currentUser.role, 'write', 'prescriptions')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para criar prescrições' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validatedData = createPrescriptionSchema.parse(body)

    // 4. Check if patient exists and belongs to organization
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

      logger.error('Erro ao verificar paciente:', patientError)
      return NextResponse.json(
        { error: 'Erro ao verificar paciente' },
        { status: 500 }
      )
    }

    // 5. Check LGPD consent
    if (!patient.consent_lgpd) {
      return NextResponse.json(
        { error: 'Paciente não forneceu consentimento LGPD para criação de prescrições' },
        { status: 403 }
      )
    }

    // 6. Validate exercises exist
    const exerciseIds = validatedData.exercises.map(ex => ex.exercise_id)
    const { data: exercises, error: exercisesError } = await supabase
      .from('exercises')
      .select('id')
      .eq('org_id', currentUser.org_id)
      .in('id', exerciseIds)

    if (exercisesError || !exercises || exercises.length !== exerciseIds.length) {
      return NextResponse.json(
        { error: 'Um ou mais exercícios não foram encontrados' },
        { status: 400 }
      )
    }

    // 7. Create prescription (transaction)
    const { data: newPrescription, error: createError } = await supabase
      .from('prescriptions')
      .insert({
        org_id: currentUser.org_id,
        patient_id: validatedData.patient_id,
        session_id: validatedData.session_id,
        name: validatedData.name,
        description: validatedData.description,
        goals: validatedData.goals,
        start_date: validatedData.start_date,
        expected_end_date: validatedData.expected_end_date,
        frequency_description: validatedData.frequency_description,
        general_instructions: validatedData.general_instructions,
        precautions: validatedData.precautions,
        status: validatedData.status,
        is_template: validatedData.is_template,
        created_by: currentUser.id,
        updated_by: currentUser.id
      })
      .select('id, name, patient_id')
      .single()

    if (createError) {
      logger.error('Erro ao criar prescrição:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar prescrição' },
        { status: 500 }
      )
    }

    // 8. Create prescription exercises
    const prescriptionExercises = validatedData.exercises.map(ex => ({
      org_id: currentUser.org_id,
      prescription_id: newPrescription.id,
      exercise_id: ex.exercise_id,
      sets: ex.sets,
      repetitions: ex.repetitions,
      hold_time_seconds: ex.hold_time_seconds,
      rest_time_seconds: ex.rest_time_seconds,
      frequency_per_week: ex.frequency_per_week,
      duration_weeks: ex.duration_weeks,
      progression_notes: ex.progression_notes,
      custom_instructions: ex.custom_instructions,
      priority_order: ex.priority_order,
      created_by: currentUser.id,
      updated_by: currentUser.id
    }))

    const { error: exercisesInsertError } = await supabase
      .from('prescription_exercises')
      .insert(prescriptionExercises)

    if (exercisesInsertError) {
      // Rollback: delete prescription if exercises insert failed
      await supabase
        .from('prescriptions')
        .delete()
        .eq('id', newPrescription.id)

      logger.error('Erro ao criar exercícios da prescrição:', exercisesInsertError)
      return NextResponse.json(
        { error: 'Erro ao criar exercícios da prescrição' },
        { status: 500 }
      )
    }

    // 9. Log audit event
    await logAuditEvent({
      table_name: 'prescriptions',
      operation: 'CREATE',
      record_id: newPrescription.id,
      user_id: currentUser.id,
      additional_data: {
        patient_id: validatedData.patient_id,
        prescription_name: newPrescription.name,
        exercises_count: validatedData.exercises.length
      }
    })

    // 10. Return response
    return NextResponse.json({
      success: true,
      data: {
        id: newPrescription.id,
        name: newPrescription.name,
        patient_id: newPrescription.patient_id,
        exercises_count: validatedData.exercises.length
      },
      message: 'Prescrição criada com sucesso'
    }, { status: 201 })

  } catch (error) {
    logger.error('Erro inesperado ao criar prescrição:', error)

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