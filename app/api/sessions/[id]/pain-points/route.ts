/**
 * API Endpoint - Session Pain Points - FisioFlow
 * GET /api/sessions/[id]/pain-points - Get pain points for a session
 * POST /api/sessions/[id]/pain-points - Add pain point to session
 *
 * Integrates body mapping with clinical sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/src/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/src/lib/auth/server'
import { logAuditEvent } from '@/src/lib/audit/server'
import logger from '../../../../../lib/logger';

// Schema for pain point creation
const createPainPointSchema = z.object({
  body_region: z.string().min(1, 'Região do corpo é obrigatória'),
  x_coordinate: z.number().min(0).max(100),
  y_coordinate: z.number().min(0).max(100),
  pain_intensity: z.number().min(0, 'Intensidade mínima é 0').max(10, 'Intensidade máxima é 10'),
  pain_type: z.enum(['aguda', 'cronica', 'latejante', 'queimacao', 'formigamento', 'rigidez', 'fraqueza']),
  pain_description: z.string().min(1, 'Descrição da dor é obrigatória'),
  assessment_type: z.enum(['initial', 'progress', 'final']).default('progress'),
  clinical_notes: z.string().optional(),
  improvement_notes: z.string().optional(),
  photo_url: z.string().url().optional()
})

/**
 * GET /api/sessions/[id]/pain-points
 * Get pain points for a session
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await context.params
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
        { error: 'Permissão insuficiente para visualizar pontos de dor' },
        { status: 403 }
      )
    }

    // 3. Verify session exists and belongs to organization
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, patient_id, org_id')
      .eq('id', sessionId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (sessionError) {
      if (sessionError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Sessão não encontrada' },
          { status: 404 }
        )
      }

      logger.error('Erro ao verificar sessão:', sessionError)
      return NextResponse.json(
        { error: 'Erro ao verificar sessão' },
        { status: 500 }
      )
    }

    // 4. Get pain points for session
    const { data: painPoints, error } = await supabase
      .from('pain_points')
      .select(`
        id,
        patient_id,
        session_id,
        body_region,
        x_coordinate,
        y_coordinate,
        pain_intensity,
        pain_type,
        pain_description,
        assessment_date,
        assessment_type,
        clinical_notes,
        improvement_notes,
        photo_url,
        created_at,
        updated_at,
        created_by:profiles!pain_points_created_by_fkey(full_name)
      `)
      .eq('session_id', sessionId)
      .eq('org_id', currentUser.org_id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Erro ao buscar pontos de dor:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar pontos de dor' },
        { status: 500 }
      )
    }

    // 5. Return response
    return NextResponse.json({
      success: true,
      data: painPoints || []
    })

  } catch (error) {
    logger.error('Erro inesperado ao buscar pontos de dor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sessions/[id]/pain-points
 * Add pain point to session
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await context.params
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
        { error: 'Permissão insuficiente para registrar pontos de dor' },
        { status: 403 }
      )
    }

    // 3. Verify session exists and belongs to organization
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, patient_id, org_id, session_date')
      .eq('id', sessionId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (sessionError) {
      if (sessionError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Sessão não encontrada' },
          { status: 404 }
        )
      }

      logger.error('Erro ao verificar sessão:', sessionError)
      return NextResponse.json(
        { error: 'Erro ao verificar sessão' },
        { status: 500 }
      )
    }

    // 4. Parse and validate request body
    const body = await request.json()
    const validatedData = createPainPointSchema.parse(body)

    // 5. Create pain point
    const { data: newPainPoint, error: createError } = await supabase
      .from('pain_points')
      .insert({
        org_id: currentUser.org_id,
        patient_id: session.patient_id,
        session_id: sessionId,
        body_region: validatedData.body_region,
        x_coordinate: validatedData.x_coordinate,
        y_coordinate: validatedData.y_coordinate,
        pain_intensity: validatedData.pain_intensity,
        pain_type: validatedData.pain_type,
        pain_description: validatedData.pain_description,
        assessment_date: session.session_date,
        assessment_type: validatedData.assessment_type,
        clinical_notes: validatedData.clinical_notes,
        improvement_notes: validatedData.improvement_notes,
        photo_url: validatedData.photo_url,
        created_by: currentUser.id,
        updated_by: currentUser.id
      })
      .select(`
        id,
        body_region,
        x_coordinate,
        y_coordinate,
        pain_intensity,
        pain_type,
        pain_description,
        assessment_type,
        clinical_notes,
        improvement_notes,
        created_at,
        created_by:profiles!pain_points_created_by_fkey(full_name)
      `)
      .single()

    if (createError) {
      logger.error('Erro ao criar ponto de dor:', createError)
      return NextResponse.json(
        { error: 'Erro ao registrar ponto de dor' },
        { status: 500 }
      )
    }

    // 6. Log audit event
    await logAuditEvent({
      table_name: 'pain_points',
      operation: 'CREATE',
      record_id: newPainPoint.id,
      user_id: currentUser.id,
      additional_data: {
        session_id: sessionId,
        patient_id: session.patient_id,
        body_region: validatedData.body_region,
        pain_intensity: validatedData.pain_intensity
      }
    })

    // 7. Return response
    return NextResponse.json({
      success: true,
      data: newPainPoint,
      message: 'Ponto de dor registrado com sucesso'
    }, { status: 201 })

  } catch (error) {
    logger.error('Erro inesperado ao criar ponto de dor:', error)

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