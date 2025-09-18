/**
 * API Endpoint - Exercise Library - FisioFlow
 * GET /api/exercises - List exercises with filters
 * POST /api/exercises - Create new exercise
 *
 * Implements Brazilian healthcare compliance and RBAC
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/lib/auth/server'
import { logAuditEvent } from '@/lib/audit/server'

// Schema for exercise creation
const createExerciseSchema = z.object({
  category_id: z.string().uuid('ID da categoria inválido'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(200, 'Nome muito longo'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  instructions: z.string().min(20, 'Instruções devem ter pelo menos 20 caracteres'),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  duration_minutes: z.number().min(1, 'Duração deve ser pelo menos 1 minuto').max(120, 'Duração máxima de 2 horas'),
  repetitions: z.number().min(1).max(100).optional(),
  sets: z.number().min(1).max(20).optional(),
  rest_seconds: z.number().min(0).max(300).default(30),
  equipment_needed: z.array(z.string()).default([]),
  contraindications: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  muscle_groups: z.array(z.string()).default([]),
  body_parts: z.array(z.string()).default([]),
  video_url: z.string().url('URL do vídeo inválida').optional(),
  thumbnail_url: z.string().url('URL da thumbnail inválida').optional(),
  is_public: z.boolean().default(false)
})

// Schema for exercise search/filters
const searchExercisesSchema = z.object({
  category_id: z.string().uuid().optional(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  muscle_groups: z.string().optional(),
  body_parts: z.string().optional(),
  equipment: z.string().optional(),
  search: z.string().optional(),
  is_public: z.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(['name', 'created_at', 'difficulty_level']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
})

/**
 * GET /api/exercises
 * List exercises with filters
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
    if (!hasPermission(currentUser.role, 'read', 'exercises')) {
      await logAuditEvent({
        table_name: 'exercises',
        operation: 'READ_DENIED',
        record_id: null,
        user_id: currentUser.id,
        additional_data: {
          reason: 'insufficient_permissions',
          attempted_role: currentUser.role
        }
      })

      return NextResponse.json(
        { error: 'Permissão insuficiente para visualizar exercícios' },
        { status: 403 }
      )
    }

    // 3. Parse search parameters
    const { searchParams } = new URL(request.url)
    const searchData = searchExercisesSchema.parse({
      category_id: searchParams.get('category_id'),
      difficulty_level: searchParams.get('difficulty_level'),
      muscle_groups: searchParams.get('muscle_groups'),
      body_parts: searchParams.get('body_parts'),
      equipment: searchParams.get('equipment'),
      search: searchParams.get('search'),
      is_public: searchParams.get('is_public'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order')
    })

    // 4. Build query
    let query = supabase
      .from('exercises')
      .select(`
        id,
        name,
        description,
        instructions,
        difficulty_level,
        duration_minutes,
        repetitions,
        sets,
        rest_seconds,
        equipment_needed,
        contraindications,
        benefits,
        muscle_groups,
        body_parts,
        video_url,
        thumbnail_url,
        is_public,
        created_at,
        updated_at,
        category:exercise_categories!exercises_category_id_fkey(
          id,
          name,
          color,
          icon
        ),
        created_by:profiles!exercises_created_by_fkey(full_name)
      `)
      .or(`org_id.eq.${currentUser.org_id},is_public.eq.true`)

    // Apply filters
    if (searchData.category_id) {
      query = query.eq('category_id', searchData.category_id)
    }

    if (searchData.difficulty_level) {
      query = query.eq('difficulty_level', searchData.difficulty_level)
    }

    if (searchData.muscle_groups) {
      query = query.contains('muscle_groups', [searchData.muscle_groups])
    }

    if (searchData.body_parts) {
      query = query.contains('body_parts', [searchData.body_parts])
    }

    if (searchData.equipment) {
      query = query.contains('equipment_needed', [searchData.equipment])
    }

    if (searchData.search) {
      query = query.or(`name.ilike.%${searchData.search}%,description.ilike.%${searchData.search}%`)
    }

    if (searchData.is_public !== undefined) {
      query = query.eq('is_public', searchData.is_public)
    }

    // Apply sorting
    query = query.order(searchData.sort_by, { ascending: searchData.sort_order === 'asc' })

    // Apply pagination
    const from = (searchData.page - 1) * searchData.limit
    const to = from + searchData.limit - 1
    query = query.range(from, to)

    // 5. Execute query
    const { data: exercises, error, count } = await query

    if (error) {
      console.error('Erro ao buscar exercícios:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar exercícios' },
        { status: 500 }
      )
    }

    // 6. Log access
    await logAuditEvent({
      table_name: 'exercises',
      operation: 'READ',
      record_id: null,
      user_id: currentUser.id,
      additional_data: {
        search_params: searchData,
        result_count: exercises?.length || 0
      }
    })

    // 7. Return response
    return NextResponse.json({
      success: true,
      data: exercises || [],
      meta: {
        total: count || 0,
        page: searchData.page,
        limit: searchData.limit,
        total_pages: Math.ceil((count || 0) / searchData.limit)
      }
    })

  } catch (error) {
    console.error('Erro inesperado ao buscar exercícios:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/exercises
 * Create new exercise
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
    if (!hasPermission(currentUser.role, 'write', 'exercises')) {
      await logAuditEvent({
        table_name: 'exercises',
        operation: 'CREATE_DENIED',
        record_id: null,
        user_id: currentUser.id,
        additional_data: {
          reason: 'insufficient_permissions',
          attempted_role: currentUser.role
        }
      })

      return NextResponse.json(
        { error: 'Permissão insuficiente para criar exercícios' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validatedData = createExerciseSchema.parse(body)

    // 4. Verify category exists and belongs to organization
    const { data: category, error: categoryError } = await supabase
      .from('exercise_categories')
      .select('id, name')
      .eq('id', validatedData.category_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // 5. Create exercise
    const { data: newExercise, error: createError } = await supabase
      .from('exercises')
      .insert({
        org_id: currentUser.org_id,
        category_id: validatedData.category_id,
        name: validatedData.name,
        description: validatedData.description,
        instructions: validatedData.instructions,
        difficulty_level: validatedData.difficulty_level,
        duration_minutes: validatedData.duration_minutes,
        repetitions: validatedData.repetitions,
        sets: validatedData.sets,
        rest_seconds: validatedData.rest_seconds,
        equipment_needed: validatedData.equipment_needed,
        contraindications: validatedData.contraindications,
        benefits: validatedData.benefits,
        muscle_groups: validatedData.muscle_groups,
        body_parts: validatedData.body_parts,
        video_url: validatedData.video_url,
        thumbnail_url: validatedData.thumbnail_url,
        is_public: validatedData.is_public,
        created_by: currentUser.id,
        updated_by: currentUser.id
      })
      .select(`
        id,
        name,
        description,
        instructions,
        difficulty_level,
        duration_minutes,
        repetitions,
        sets,
        rest_seconds,
        equipment_needed,
        contraindications,
        benefits,
        muscle_groups,
        body_parts,
        video_url,
        thumbnail_url,
        is_public,
        created_at,
        category:exercise_categories!exercises_category_id_fkey(
          id,
          name,
          color,
          icon
        ),
        created_by:profiles!exercises_created_by_fkey(full_name)
      `)
      .single()

    if (createError) {
      console.error('Erro ao criar exercício:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar exercício' },
        { status: 500 }
      )
    }

    // 6. Log audit event
    await logAuditEvent({
      table_name: 'exercises',
      operation: 'CREATE',
      record_id: newExercise.id,
      user_id: currentUser.id,
      additional_data: {
        exercise_name: newExercise.name,
        category_name: category.name,
        difficulty_level: validatedData.difficulty_level,
        is_public: validatedData.is_public
      }
    })

    // 7. Return response
    return NextResponse.json({
      success: true,
      data: newExercise,
      message: 'Exercício criado com sucesso'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro inesperado ao criar exercício:', error)
    
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
