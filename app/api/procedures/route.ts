/**
 * API Endpoint - Procedures Management - FisioFlow
 * GET /api/procedures - List procedures with filters
 * POST /api/procedures - Create new procedure
 *
 * Manages medical procedures and billing codes
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/src/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/src/lib/auth/server'
import { logAuditEvent } from '@/src/lib/audit/server'
import logger from '../../../lib/logger';

// Schema for procedure creation
const createProcedureSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório').max(20),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
  description: z.string().optional(),
  category: z.enum(['fisioterapia', 'avaliacao', 'reeducacao_postural', 'terapia_manual', 'eletroterapia', 'hidroterapia', 'outros']),
  base_price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  duration_minutes: z.number().min(1).max(480),
  requires_authorization: z.boolean().default(false),
  health_insurance_codes: z.array(z.string()).optional(),
  is_active: z.boolean().default(true)
})

// Schema for procedure search/filters
const searchProceduresSchema = z.object({
  search: z.string().optional(),
  category: z.enum(['fisioterapia', 'avaliacao', 'reeducacao_postural', 'terapia_manual', 'eletroterapia', 'hidroterapia', 'outros']).optional(),
  is_active: z.boolean().optional(),
  price_min: z.coerce.number().optional(),
  price_max: z.coerce.number().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(['name', 'code', 'base_price', 'created_at']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
})

/**
 * GET /api/procedures
 * List procedures with filters
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
    if (!hasPermission(currentUser.role, 'read', 'procedures')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para visualizar procedimentos' },
        { status: 403 }
      )
    }

    // 3. Parse search parameters
    const { searchParams } = new URL(request.url)
    const searchData = searchProceduresSchema.parse({
      search: searchParams.get('search'),
      category: searchParams.get('category'),
      is_active: searchParams.get('is_active') === 'true',
      price_min: searchParams.get('price_min'),
      price_max: searchParams.get('price_max'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order')
    })

    // 4. Build query
    let query = supabase
      .from('procedures')
      .select(`
        id,
        code,
        name,
        description,
        category,
        base_price,
        duration_minutes,
        requires_authorization,
        health_insurance_codes,
        is_active,
        created_at,
        updated_at,
        created_by:profiles!procedures_created_by_fkey(id, full_name)
      `, { count: 'exact' })
      .eq('org_id', currentUser.org_id)

    // Apply filters
    if (searchData.category) {
      query = query.eq('category', searchData.category)
    }

    if (searchData.is_active !== undefined) {
      query = query.eq('is_active', searchData.is_active)
    }

    if (searchData.price_min !== undefined) {
      query = query.gte('base_price', searchData.price_min)
    }

    if (searchData.price_max !== undefined) {
      query = query.lte('base_price', searchData.price_max)
    }

    if (searchData.search) {
      query = query.or(`name.ilike.%${searchData.search}%,code.ilike.%${searchData.search}%,description.ilike.%${searchData.search}%`)
    }

    // Apply sorting
    query = query.order(searchData.sort_by, { ascending: searchData.sort_order === 'asc' })

    // Apply pagination
    const from = (searchData.page - 1) * searchData.limit
    const to = from + searchData.limit - 1
    query = query.range(from, to)

    // 5. Execute query
    const { data: procedures, error, count } = await query

    if (error) {
      logger.error('Erro ao buscar procedimentos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar procedimentos' },
        { status: 500 }
      )
    }

    // 6. Return response
    return NextResponse.json({
      success: true,
      data: procedures || [],
      meta: {
        total: count || 0,
        page: searchData.page,
        limit: searchData.limit,
        total_pages: Math.ceil((count || 0) / searchData.limit)
      }
    })

  } catch (error) {
    logger.error('Erro inesperado ao buscar procedimentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/procedures
 * Create new procedure
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
    if (!hasPermission(currentUser.role, 'write', 'procedures')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para criar procedimentos' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validatedData = createProcedureSchema.parse(body)

    // 4. Check if procedure code already exists
    const { data: existingProcedure, error: checkError } = await supabase
      .from('procedures')
      .select('id')
      .eq('org_id', currentUser.org_id)
      .eq('code', validatedData.code)
      .eq('is_active', true)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      logger.error('Erro ao verificar procedimento existente:', checkError)
      return NextResponse.json(
        { error: 'Erro ao verificar procedimento' },
        { status: 500 }
      )
    }

    if (existingProcedure) {
      return NextResponse.json(
        { error: 'Já existe um procedimento com este código' },
        { status: 409 }
      )
    }

    // 5. Create procedure
    const { data: newProcedure, error: createError } = await supabase
      .from('procedures')
      .insert({
        org_id: currentUser.org_id,
        code: validatedData.code,
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        base_price: validatedData.base_price,
        duration_minutes: validatedData.duration_minutes,
        requires_authorization: validatedData.requires_authorization,
        health_insurance_codes: validatedData.health_insurance_codes,
        is_active: validatedData.is_active,
        created_by: currentUser.id,
        updated_by: currentUser.id
      })
      .select(`
        id,
        code,
        name,
        category,
        base_price,
        duration_minutes,
        created_at,
        created_by:profiles!procedures_created_by_fkey(full_name)
      `)
      .single()

    if (createError) {
      logger.error('Erro ao criar procedimento:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar procedimento' },
        { status: 500 }
      )
    }

    // 6. Log audit event
    await logAuditEvent({
      table_name: 'procedures',
      operation: 'CREATE',
      record_id: newProcedure.id,
      user_id: currentUser.id,
      additional_data: {
        procedure_code: newProcedure.code,
        procedure_name: newProcedure.name,
        base_price: validatedData.base_price
      }
    })

    // 7. Return response
    return NextResponse.json({
      success: true,
      data: newProcedure,
      message: 'Procedimento criado com sucesso'
    }, { status: 201 })

  } catch (error) {
    logger.error('Erro inesperado ao criar procedimento:', error)

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