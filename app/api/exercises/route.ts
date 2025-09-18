/**
 * API Endpoint - Exercise Library Management - FisioFlow
 * GET /api/exercises - List exercises with search and filters
 * POST /api/exercises - Create new exercise
 *
 * Implements exercise library for physiotherapy treatments
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/lib/auth/server'
import { logAuditEvent } from '@/lib/audit/server'

// Schema for exercise creation
const createExerciseSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  category: z.enum(['fortalecimento', 'alongamento', 'mobilizacao', 'equilibrio', 'coordenacao', 'respiratorio', 'cardiovascular', 'propriocepcao']),
  body_regions: z.array(z.string()).min(1, 'Pelo menos uma região corporal é obrigatória'),
  difficulty_level: z.enum(['iniciante', 'intermediario', 'avancado']),
  duration_minutes: z.number().min(1, 'Duração mínima de 1 minuto').max(120, 'Duração máxima de 2 horas'),
  repetitions: z.number().min(1).max(100).optional(),
  sets: z.number().min(1).max(10).optional(),
  hold_time_seconds: z.number().min(1).max(300).optional(),
  equipment_needed: z.array(z.string()).optional(),
  instructions: z.string().min(20, 'Instruções devem ter pelo menos 20 caracteres'),
  precautions: z.string().optional(),
  contraindications: z.string().optional(),
  video_url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
  is_template: z.boolean().default(false)
})

// Schema for exercise search/filters
const searchExercisesSchema = z.object({
  search: z.string().optional(),
  category: z.enum(['fortalecimento', 'alongamento', 'mobilizacao', 'equilibrio', 'coordenacao', 'respiratorio', 'cardiovascular', 'propriocepcao']).optional(),
  body_region: z.string().optional(),
  difficulty_level: z.enum(['iniciante', 'intermediario', 'avancado']).optional(),
  equipment: z.string().optional(),
  tags: z.string().optional(),
  is_template: z.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(['name', 'category', 'created_at', 'updated_at']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
})

/**
 * GET /api/exercises
 * List exercises with search and filters
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
      return NextResponse.json(
        { error: 'Permissão insuficiente para visualizar exercícios' },
        { status: 403 }
      )
    }

    // 3. Parse search parameters
    const { searchParams } = new URL(request.url)
    const searchData = searchExercisesSchema.parse({
      search: searchParams.get('search'),
      category: searchParams.get('category'),
      body_region: searchParams.get('body_region'),
      difficulty_level: searchParams.get('difficulty_level'),
      equipment: searchParams.get('equipment'),
      tags: searchParams.get('tags'),
      is_template: searchParams.get('is_template') === 'true',
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
        category,
        body_regions,
        difficulty_level,
        duration_minutes,
        repetitions,
        sets,
        hold_time_seconds,
        equipment_needed,
        instructions,
        precautions,
        contraindications,
        video_url,
        thumbnail_url,
        tags,
        is_active,
        is_template,
        created_at,
        updated_at,
        created_by:profiles!exercises_created_by_fkey(full_name)
      `)
      .eq('org_id', currentUser.org_id)
      .eq('is_active', true)

    // Apply filters
    if (searchData.category) {
      query = query.eq('category', searchData.category)
    }

    if (searchData.body_region) {
      query = query.contains('body_regions', [searchData.body_region])
    }

    if (searchData.difficulty_level) {
      query = query.eq('difficulty_level', searchData.difficulty_level)
    }

    if (searchData.equipment) {
      query = query.contains('equipment_needed', [searchData.equipment])
    }

    if (searchData.tags) {
      query = query.contains('tags', [searchData.tags])
    }

    if (searchData.is_template !== undefined) {
      query = query.eq('is_template', searchData.is_template)
    }

    if (searchData.search) {
      query = query.or(`name.ilike.%${searchData.search}%,description.ilike.%${searchData.search}%,instructions.ilike.%${searchData.search}%`)
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

    // 6. Return response
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
      return NextResponse.json(
        { error: 'Permissão insuficiente para criar exercícios' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validatedData = createExerciseSchema.parse(body)

    // 4. Check if exercise name already exists
    const { data: existingExercise, error: checkError } = await supabase
      .from('exercises')
      .select('id')
      .eq('org_id', currentUser.org_id)
      .eq('name', validatedData.name)
      .eq('is_active', true)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar exercício existente:', checkError)
      return NextResponse.json(
        { error: 'Erro ao verificar exercício' },
        { status: 500 }
      )
    }

    if (existingExercise) {
      return NextResponse.json(
        { error: 'Já existe um exercício com este nome' },
        { status: 409 }
      )
    }

    // 5. Create exercise
    const { data: newExercise, error: createError } = await supabase
      .from('exercises')
      .insert({
        org_id: currentUser.org_id,
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        body_regions: validatedData.body_regions,
        difficulty_level: validatedData.difficulty_level,
        duration_minutes: validatedData.duration_minutes,
        repetitions: validatedData.repetitions,
        sets: validatedData.sets,
        hold_time_seconds: validatedData.hold_time_seconds,
        equipment_needed: validatedData.equipment_needed,
        instructions: validatedData.instructions,
        precautions: validatedData.precautions,
        contraindications: validatedData.contraindications,
        video_url: validatedData.video_url,
        thumbnail_url: validatedData.thumbnail_url,
        tags: validatedData.tags,
        is_active: validatedData.is_active,
        is_template: validatedData.is_template,
        created_by: currentUser.id,
        updated_by: currentUser.id
      })
      .select(`
        id,
        name,
        category,
        difficulty_level,
        duration_minutes,
        created_at,
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
        category: validatedData.category,
        difficulty_level: validatedData.difficulty_level
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