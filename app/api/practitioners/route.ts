/**
 * API Endpoint - Practitioners Management - FisioFlow
 * GET /api/practitioners - List practitioners (therapists and staff)
 *
 * Lists active healthcare professionals for appointment scheduling
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/src/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/src/lib/auth/server'
import logger from '../../../lib/logger';

// Schema for practitioner search/filters
const searchPractitionersSchema = z.object({
  role: z.enum(['fisioterapeuta', 'estagiario', 'admin']).optional(),
  is_active: z.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  sort_by: z.enum(['full_name', 'role', 'created_at']).default('full_name'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
})

/**
 * GET /api/practitioners
 * List active practitioners for appointments
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
      return NextResponse.json(
        { error: 'Permissão insuficiente para visualizar profissionais' },
        { status: 403 }
      )
    }

    // 3. Parse search parameters
    const { searchParams } = new URL(request.url)
    const searchData = searchPractitionersSchema.parse({
      role: searchParams.get('role'),
      is_active: searchParams.get('is_active') === 'false' ? false : true, // Default to active
      search: searchParams.get('search'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order')
    })

    // 4. Build query
    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        role,
        phone,
        avatar_url,
        crefito_number,
        is_active,
        created_at,
        last_login_at
      `, { count: 'exact' })
      .eq('org_id', currentUser.org_id)
      .in('role', ['fisioterapeuta', 'estagiario', 'admin']) // Only practitioners

    // Apply filters
    if (searchData.role) {
      query = query.eq('role', searchData.role)
    }

    if (searchData.is_active !== undefined) {
      query = query.eq('is_active', searchData.is_active)
    }

    if (searchData.search) {
      query = query.or(`email.ilike.%${searchData.search}%,crefito_number.ilike.%${searchData.search}%`)
    }

    // Apply sorting
    query = query.order(searchData.sort_by, { ascending: searchData.sort_order === 'asc' })

    // Apply pagination
    const from = (searchData.page - 1) * searchData.limit
    const to = from + searchData.limit - 1
    query = query.range(from, to)

    // 5. Execute query
    const { data: practitioners, error, count } = await query

    if (error) {
      logger.error('Erro ao buscar profissionais:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar profissionais' },
        { status: 500 }
      )
    }

    // 6. Get additional statistics for each practitioner
    const practitionersWithStats = await Promise.all(
      (practitioners && Array.isArray(practitioners) ? practitioners : []).map(async (practitioner) => {
        // Get appointment count for last 30 days
        const { count: appointmentCount } = await supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('practitioner_id', practitioner.id)
          .eq('org_id', currentUser.org_id)
          .gte('appointment_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

        // Get average session rating
        const { data: sessionRatings } = await supabase
          .from('sessions')
          .select('patient_satisfaction')
          .eq('created_by', practitioner.id)
          .eq('org_id', currentUser.org_id)
          .not('patient_satisfaction', 'is', null)
          .limit(100)

        const averageRating = sessionRatings && sessionRatings.length > 0
          ? sessionRatings.reduce((sum, session) => sum + (session.patient_satisfaction || 0), 0) / sessionRatings.length
          : null

        return {
          ...practitioner,
          stats: {
            appointments_last_30_days: appointmentCount || 0,
            average_rating: averageRating ? Math.round(averageRating * 10) / 10 : null
          }
        }
      })
    )

    // 7. Return response
    return NextResponse.json({
      success: true,
      data: practitionersWithStats,
      meta: {
        total: count || 0,
        page: searchData.page,
        limit: searchData.limit,
        total_pages: Math.ceil((count || 0) / searchData.limit)
      }
    })

  } catch (error) {
    logger.error('Erro inesperado ao buscar profissionais:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/appointments/[id]/notes
 * Add note to appointment
 */
export async function POST(
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
        { error: 'Permissão insuficiente para adicionar notas' },
        { status: 403 }
      )
    }

    // 3. Verify appointment exists and belongs to organization
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, patient_id')
      .eq('id', appointmentId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (appointmentError) {
      if (appointmentError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Agendamento não encontrado' },
          { status: 404 }
        )
      }

      logger.error('Erro ao verificar agendamento:', appointmentError)
      return NextResponse.json(
        { error: 'Erro ao verificar agendamento' },
        { status: 500 }
      )
    }

    // 4. Parse and validate request body
    const body = await request.json()
    const validatedData = createNoteSchema.parse(body)

    // 5. Create note
    const { data: newNote, error: createError } = await supabase
      .from('appointment_notes')
      .insert({
        org_id: currentUser.org_id,
        appointment_id: appointmentId,
        patient_id: appointment.patient_id,
        note: validatedData.note,
        note_type: validatedData.note_type,
        is_private: validatedData.is_private,
        created_by: currentUser.id
      })
      .select(`
        id,
        note,
        note_type,
        is_private,
        created_at,
        created_by:profiles!appointment_notes_created_by_fkey(
          id,
          full_name,
          role
        )
      `)
      .single()

    if (createError) {
      logger.error('Erro ao criar nota:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar nota' },
        { status: 500 }
      )
    }

    // 6. Log audit event
    await logAuditEvent({
      table_name: 'appointment_notes',
      operation: 'CREATE',
      record_id: newNote.id,
      user_id: currentUser.id,
      additional_data: {
        appointment_id: appointmentId,
        patient_id: appointment.patient_id,
        note_type: validatedData.note_type
      }
    })

    // 7. Return response
    return NextResponse.json({
      success: true,
      data: newNote,
      message: 'Nota adicionada com sucesso'
    }, { status: 201 })

  } catch (error) {
    logger.error('Erro inesperado ao criar nota:', error)

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