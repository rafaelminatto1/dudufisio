/**
 * API Endpoint - Pontos de Dor da Sessão - FisioFlow
 * POST /api/sessions/{id}/pain-points
 *
 * Endpoint para criar/atualizar pontos de dor associados a uma sessão específica
 * Implementa validação de permissões, conformidade LGPD e auditoria brasileira
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/lib/auth/server'
import { logAuditEvent } from '@/lib/audit/server'
import { validateLGPDConsent } from '@/lib/lgpd/server'

// Schema de validação para criação de ponto de dor
const painPointSchema = z.object({
  body_region: z
    .string()
    .min(2, 'Região corporal é obrigatória')
    .max(50, 'Nome da região muito longo'),
  x_coordinate: z
    .number()
    .min(0, 'Coordenada X deve ser positiva')
    .max(100, 'Coordenada X deve ser menor que 100'),
  y_coordinate: z
    .number()
    .min(0, 'Coordenada Y deve ser positiva')
    .max(100, 'Coordenada Y deve ser menor que 100'),
  pain_intensity: z
    .number()
    .int('Intensidade deve ser um número inteiro')
    .min(0, 'Intensidade mínima é 0')
    .max(10, 'Intensidade máxima é 10'),
  pain_type: z
    .enum([
      'aguda',
      'cronica',
      'latejante',
      'queimacao',
      'formigamento',
      'dormencia',
      'rigidez',
      'outro'
    ])
    .optional()
    .nullable(),
  pain_description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional()
    .nullable(),
  clinical_notes: z
    .string()
    .max(1000, 'Observações clínicas devem ter no máximo 1000 caracteres')
    .optional()
    .nullable(),
  assessment_type: z.enum(['initial', 'progress', 'discharge', 'followup'], {
    message: 'Tipo de avaliação é obrigatório',
  }),
  improvement_notes: z
    .string()
    .max(500, 'Notas de melhoria devem ter no máximo 500 caracteres')
    .optional()
    .nullable(),
  assessment_date: z
    .string()
    .datetime('Data de avaliação deve ser um datetime válido')
    .optional()
})

// Schema para atualização em lote
const batchPainPointsSchema = z.object({
  pain_points: z.array(painPointSchema).min(1, 'Pelo menos um ponto de dor é obrigatório')
})

/**
 * POST /api/sessions/{id}/pain-points
 * Criar novos pontos de dor para uma sessão
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await context.params
    const supabase = await createServerClient()

    // 1. Autenticação e autorização
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // 2. Verificar permissões para gerenciar pontos de dor
    if (!hasPermission(currentUser.role, 'write', 'pain_points')) {
      await logAuditEvent({
        table_name: 'pain_points',
        operation: 'CREATE_DENIED',
        record_id: sessionId,
        user_id: currentUser.id,
        additional_data: {
          reason: 'insufficient_permissions',
          attempted_role: currentUser.role
        }
      })

      return NextResponse.json(
        { error: 'Permissão insuficiente para gerenciar pontos de dor' },
        { status: 403 }
      )
    }

    // 3. Validar se a sessão existe e pertence à organização do usuário
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id,
        org_id,
        patient_id,
        therapist_id,
        session_date,
        status,
        patient:patients!sessions_patient_id_fkey (
          id,
          name,
          consent_lgpd,
          status
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 404 }
      )
    }

    // 4. Verificar se o usuário tem acesso à organização da sessão
    if (session.org_id !== currentUser.org_id) {
      await logAuditEvent({
        table_name: 'sessions',
        operation: 'ACCESS_DENIED',
        record_id: sessionId,
        user_id: currentUser.id,
        additional_data: {
          reason: 'org_mismatch',
          session_org: session.org_id,
          user_org: currentUser.org_id
        }
      })

      return NextResponse.json(
        { error: 'Acesso negado a esta sessão' },
        { status: 403 }
      )
    }

    // 5. Verificar conformidade LGPD
    if (!session.patient?.consent_lgpd) {
      await logAuditEvent({
        table_name: 'pain_points',
        operation: 'CREATE_DENIED',
        record_id: sessionId,
        user_id: currentUser.id,
        additional_data: {
          reason: 'no_lgpd_consent',
          patient_id: session.patient_id
        }
      })

      return NextResponse.json(
        { error: 'Paciente não forneceu consentimento LGPD para manipulação de dados' },
        { status: 403 }
      )
    }

    // 6. Verificar se o paciente está ativo
    if (session.patient?.status !== 'active') {
      return NextResponse.json(
        { error: 'Não é possível registrar dor para paciente inativo' },
        { status: 400 }
      )
    }

    // 7. Parse e validação do corpo da requisição
    let requestBody
    try {
      requestBody = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'JSON inválido no corpo da requisição' },
        { status: 400 }
      )
    }

    // Verificar se é um array de pontos de dor ou um único ponto
    let painPointsData: any[]

    if (Array.isArray(requestBody)) {
      // Array de pontos de dor
      const validationResult = batchPainPointsSchema.safeParse({
        pain_points: requestBody
      })

      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Dados inválidos',
            details: validationResult.error.issues
          },
          { status: 422 }
        )
      }

      painPointsData = validationResult.data.pain_points
    } else {
      // Único ponto de dor
      const validationResult = painPointSchema.safeParse(requestBody)

      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Dados inválidos',
            details: validationResult.error.issues
          },
          { status: 422 }
        )
      }

      painPointsData = [validationResult.data]
    }

    // 8. Preparar dados para inserção
    const painPointsToInsert = painPointsData.map((painPointData) => ({
      org_id: currentUser.org_id,
      patient_id: session.patient_id,
      session_id: sessionId,
      body_region: painPointData.body_region,
      x_coordinate: painPointData.x_coordinate,
      y_coordinate: painPointData.y_coordinate,
      pain_intensity: painPointData.pain_intensity,
      pain_type: painPointData.pain_type,
      pain_description: painPointData.pain_description,
      assessment_date: painPointData.assessment_date || new Date().toISOString(),
      assessment_type: painPointData.assessment_type,
      clinical_notes: painPointData.clinical_notes,
      improvement_notes: painPointData.improvement_notes,
      created_by: currentUser.id,
      updated_by: currentUser.id
    }))

    // 9. Validações específicas do domínio
    for (const painPoint of painPointsToInsert) {
      // Validar região corporal (pode implementar lista válida)
      if (!['head', 'neck', 'chest', 'back', 'arm_left', 'arm_right', 'leg_left', 'leg_right', 'Lombar', 'Ombro Direito'].includes(painPoint.body_region)) {
        // Log para auditoria mas não bloqueia (aceita regiões customizadas)
        console.warn(`Região corporal não padrão: ${painPoint.body_region}`)
      }

      // Validar coordenadas estão dentro do SVG
      if (painPoint.x_coordinate < 0 || painPoint.x_coordinate > 100 ||
          painPoint.y_coordinate < 0 || painPoint.y_coordinate > 100) {
        return NextResponse.json(
          { error: `Coordenadas inválidas para região ${painPoint.body_region}` },
          { status: 400 }
        )
      }
    }

    // 10. Inserir pontos de dor no banco
    const { data: insertedPainPoints, error: insertError } = await supabase
      .from('pain_points')
      .insert(painPointsToInsert)
      .select(`
        id,
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
        created_at,
        updated_at
      `)

    if (insertError) {
      console.error('Erro ao inserir pontos de dor:', insertError)

      await logAuditEvent({
        table_name: 'pain_points',
        operation: 'CREATE_ERROR',
        record_id: sessionId,
        user_id: currentUser.id,
        additional_data: {
          error: insertError.message,
          attempted_data: painPointsToInsert
        }
      })

      return NextResponse.json(
        { error: 'Erro interno ao salvar pontos de dor' },
        { status: 500 }
      )
    }

    // 11. Log de auditoria para conformidade LGPD
    for (const painPoint of insertedPainPoints) {
      await logAuditEvent({
        table_name: 'pain_points',
        operation: 'CREATE',
        record_id: painPoint.id,
        user_id: currentUser.id,
        additional_data: {
          patient_id: session.patient_id,
          session_id: sessionId,
          body_region: painPoint.body_region,
          pain_intensity: painPoint.pain_intensity,
          assessment_type: painPoint.assessment_type,
          created_via: 'api_endpoint'
        }
      })
    }

    // 12. Log de acesso aos dados do paciente (LGPD)
    await supabase
      .rpc('log_patient_data_access', {
        patient_id: session.patient_id,
        access_type: 'pain_points_create',
        accessed_fields: [
          'body_region',
          'pain_intensity',
          'pain_type',
          'pain_description',
          'clinical_notes'
        ]
      })

    // 13. Resposta de sucesso
    const responseData = {
      success: true,
      message: `${insertedPainPoints.length} ponto${insertedPainPoints.length !== 1 ? 's' : ''} de dor criado${insertedPainPoints.length !== 1 ? 's' : ''} com sucesso`,
      data: {
        pain_points: insertedPainPoints,
        session: {
          id: session.id,
          patient_name: session.patient?.name,
          session_date: session.session_date
        }
      },
      meta: {
        total_created: insertedPainPoints.length,
        session_id: sessionId,
        created_by: currentUser.name || currentUser.email,
        created_at: new Date().toISOString()
      }
    }

    return NextResponse.json(responseData, { status: 201 })

  } catch (error) {
    console.error('Erro inesperado na criação de pontos de dor:', error)

    // Log de erro para monitoramento
    try {
      const currentUser = await getCurrentUser()
      await logAuditEvent({
        table_name: 'pain_points',
        operation: 'CREATE_EXCEPTION',
        record_id: null,
        user_id: currentUser?.id || null,
        additional_data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          endpoint: '/api/sessions/[id]/pain-points',
          method: 'POST'
        }
      })
    } catch (logError) {
      console.error('Erro ao fazer log de auditoria:', logError)
    }

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        message: 'Ocorreu um erro inesperado ao processar a solicitação'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sessions/{id}/pain-points
 * Listar pontos de dor de uma sessão
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await context.params
    const supabase = await createServerClient()

    // Autenticação
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar permissões
    if (!hasPermission(currentUser.role, 'read', 'pain_points')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para visualizar pontos de dor' },
        { status: 403 }
      )
    }

    // Buscar pontos de dor da sessão
    const { data: painPoints, error } = await supabase
      .from('pain_points')
      .select(`
        id,
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
        created_at,
        updated_at,
        created_by,
        session:sessions!pain_points_session_id_fkey (
          id,
          session_date,
          patient:patients!sessions_patient_id_fkey (
            id,
            name,
            consent_lgpd
          )
        )
      `)
      .eq('session_id', sessionId)
      .eq('org_id', currentUser.org_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar pontos de dor:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar pontos de dor' },
        { status: 500 }
      )
    }

    // Verificar LGPD consent se houver dados
    if (painPoints.length > 0 && !painPoints[0]?.session?.patient?.consent_lgpd) {
      return NextResponse.json(
        { error: 'Paciente não forneceu consentimento LGPD' },
        { status: 403 }
      )
    }

    // Log de acesso aos dados
    if (painPoints.length > 0) {
      await supabase
        .rpc('log_patient_data_access', {
          patient_id: painPoints[0]?.session?.patient?.id || '',
          access_type: 'pain_points_read',
          accessed_fields: ['pain_intensity', 'body_region', 'assessment_date']
        })
    }

    return NextResponse.json({
      success: true,
      data: painPoints,
      meta: {
        total: painPoints.length,
        session_id: sessionId
      }
    })

  } catch (error) {
    console.error('Erro inesperado ao buscar pontos de dor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}