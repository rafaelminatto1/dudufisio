/**
 * API Endpoint - Reports Management - FisioFlow
 * GET /api/reports - List available report templates
 * POST /api/reports - Generate a report
 *
 * Manages report generation and templates
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/src/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/src/lib/auth/server'
import { logAuditEvent } from '@/src/lib/audit/server'
import logger from '../../../lib/logger';

// Schema for report generation
const generateReportSchema = z.object({
  template_id: z.string().min(1, 'Template é obrigatório'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
  format: z.enum(['pdf', 'excel', 'csv']).default('pdf'),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  filters: z.object({
    patient_id: z.string().uuid().optional(),
    therapist_id: z.string().uuid().optional(),
    status: z.string().optional(),
    category: z.string().optional()
  }).optional(),
  schedule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annual']).optional(),
    recipients: z.array(z.string().email()).optional(),
    enabled: z.boolean().default(false)
  }).optional()
})

// Schema for report search/filters
const searchReportsSchema = z.object({
  category: z.enum(['clinical', 'administrative', 'financial', 'quality']).optional(),
  status: z.enum(['generating', 'ready', 'failed', 'expired']).optional(),
  format: z.enum(['pdf', 'excel', 'csv']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(['created_at', 'name', 'category']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
})

// Report templates configuration
const REPORT_TEMPLATES = [
  {
    id: 'clinical-evolution',
    name: 'Relatório de Evolução Clínica',
    description: 'Evolução dos pacientes com resultados de tratamentos e alta',
    category: 'clinical',
    format: 'pdf',
    frequency: 'monthly',
    isSchedulable: true,
    requiredFilters: ['date_from', 'date_to'],
    optionalFilters: ['therapist_id', 'patient_id']
  },
  {
    id: 'attendance-summary',
    name: 'Resumo de Atendimentos',
    description: 'Estatísticas de agendamentos, presenças e faltas por período',
    category: 'administrative',
    format: 'excel',
    frequency: 'weekly',
    isSchedulable: true,
    requiredFilters: ['date_from', 'date_to'],
    optionalFilters: ['therapist_id']
  },
  {
    id: 'financial-revenue',
    name: 'Relatório de Receitas',
    description: 'Análise financeira detalhada com receitas por terapeuta e procedimento',
    category: 'financial',
    format: 'excel',
    frequency: 'monthly',
    isSchedulable: true,
    requiredFilters: ['date_from', 'date_to'],
    optionalFilters: ['therapist_id']
  },
  {
    id: 'patient-satisfaction',
    name: 'Pesquisa de Satisfação',
    description: 'Resultados das avaliações de satisfação dos pacientes',
    category: 'quality',
    format: 'pdf',
    frequency: 'quarterly',
    isSchedulable: true,
    requiredFilters: ['date_from', 'date_to'],
    optionalFilters: []
  },
  {
    id: 'exercise-adherence',
    name: 'Aderência aos Exercícios',
    description: 'Análise da execução e aderência às prescrições de exercícios',
    category: 'clinical',
    format: 'pdf',
    frequency: 'monthly',
    isSchedulable: false,
    requiredFilters: ['date_from', 'date_to'],
    optionalFilters: ['patient_id', 'therapist_id']
  },
  {
    id: 'therapist-performance',
    name: 'Desempenho dos Terapeutas',
    description: 'Produtividade e avaliação dos profissionais',
    category: 'administrative',
    format: 'excel',
    frequency: 'monthly',
    isSchedulable: false,
    requiredFilters: ['date_from', 'date_to'],
    optionalFilters: ['therapist_id']
  },
  {
    id: 'appointment-analysis',
    name: 'Análise de Agendamentos',
    description: 'Padrões de agendamento, taxa de ocupação e otimização',
    category: 'administrative',
    format: 'pdf',
    frequency: 'weekly',
    isSchedulable: false,
    requiredFilters: ['date_from', 'date_to'],
    optionalFilters: ['therapist_id']
  },
  {
    id: 'lgpd-compliance',
    name: 'Relatório LGPD',
    description: 'Controle de acessos e conformidade com proteção de dados',
    category: 'administrative',
    format: 'pdf',
    frequency: 'quarterly',
    isSchedulable: true,
    requiredFilters: ['date_from', 'date_to'],
    optionalFilters: []
  }
]

/**
 * GET /api/reports
 * List available report templates and generated reports
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
    if (!hasPermission(currentUser.role, 'read', 'reports')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para visualizar relatórios' },
        { status: 403 }
      )
    }

    // 3. Parse search parameters
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'

    if (action === 'templates') {
      // Return available templates
      const filteredTemplates = REPORT_TEMPLATES.filter(template => {
        const category = searchParams.get('category')
        return !category || template.category === category
      })

      return NextResponse.json({
        success: true,
        data: filteredTemplates
      })
    }

    // 4. Get generated reports
    const searchData = searchReportsSchema.parse({
      category: searchParams.get('category'),
      status: searchParams.get('status'),
      format: searchParams.get('format'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order')
    })

    // Build query for generated reports
    let query = supabase
      .from('generated_reports')
      .select(`
        id,
        template_id,
        name,
        category,
        format,
        status,
        generated_at,
        expires_at,
        file_size,
        download_url,
        error_message,
        generated_by:profiles!generated_reports_generated_by_fkey(id, full_name),
        scheduled_report_id
      `, { count: 'exact' })
      .eq('org_id', currentUser.org_id)

    // Apply filters
    if (searchData.category) {
      query = query.eq('category', searchData.category)
    }

    if (searchData.status) {
      query = query.eq('status', searchData.status)
    }

    if (searchData.format) {
      query = query.eq('format', searchData.format)
    }

    if (searchData.date_from) {
      query = query.gte('generated_at', searchData.date_from)
    }

    if (searchData.date_to) {
      query = query.lte('generated_at', searchData.date_to)
    }

    // Apply sorting
    query = query.order(searchData.sort_by, { ascending: searchData.sort_order === 'asc' })

    // Apply pagination
    const from = (searchData.page - 1) * searchData.limit
    const to = from + searchData.limit - 1
    query = query.range(from, to)

    // 5. Execute query
    const { data: reports, error, count } = await query

    if (error) {
      logger.error('Erro ao buscar relatórios:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar relatórios' },
        { status: 500 }
      )
    }

    // 6. Enhance reports with template information
    const enhancedReports = reports?.map(report => ({
      ...report,
      template: REPORT_TEMPLATES.find(t => t.id === report.template_id)
    })) || []

    // 7. Return response
    return NextResponse.json({
      success: true,
      data: enhancedReports,
      templates: REPORT_TEMPLATES,
      meta: {
        total: count || 0,
        page: searchData.page,
        limit: searchData.limit,
        total_pages: Math.ceil((count || 0) / searchData.limit)
      }
    })

  } catch (error) {
    logger.error('Erro inesperado ao buscar relatórios:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reports
 * Generate a new report
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
    if (!hasPermission(currentUser.role, 'write', 'reports')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para gerar relatórios' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validatedData = generateReportSchema.parse(body)

    // 4. Validate template exists
    const template = REPORT_TEMPLATES.find(t => t.id === validatedData.template_id)
    if (!template) {
      return NextResponse.json(
        { error: 'Template de relatório não encontrado' },
        { status: 404 }
      )
    }

    // 5. Validate required filters
    const missingFilters = template.requiredFilters.filter(filter => {
      return !validatedData.filters?.[filter as keyof typeof validatedData.filters] && 
             !validatedData[filter as keyof typeof validatedData]
    })

    if (missingFilters.length > 0) {
      return NextResponse.json(
        { 
          error: 'Filtros obrigatórios ausentes',
          details: { missing_filters: missingFilters }
        },
        { status: 400 }
      )
    }

    // 6. Calculate expiration date (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // 7. Create report record
    const { data: newReport, error: createError } = await supabase
      .from('generated_reports')
      .insert({
        org_id: currentUser.org_id,
        template_id: validatedData.template_id,
        name: validatedData.name,
        category: template.category,
        format: validatedData.format,
        status: 'generating',
        parameters: {
          date_from: validatedData.date_from,
          date_to: validatedData.date_to,
          filters: validatedData.filters
        },
        expires_at: expiresAt.toISOString(),
        generated_by: currentUser.id
      })
      .select(`
        id,
        template_id,
        name,
        category,
        format,
        status,
        generated_at,
        expires_at
      `)
      .single()

    if (createError) {
      logger.error('Erro ao criar relatório:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar relatório' },
        { status: 500 }
      )
    }

    // 8. Start async report generation (in a real implementation, this would be a background job)
    // For now, we'll simulate with a timeout and update
    setTimeout(async () => {
      try {
        const mockFileSize = Math.floor(Math.random() * 3000000) + 500000 // 500KB - 3.5MB
        const downloadUrl = `/api/reports/download/${newReport.id}`
        
        await supabase
          .from('generated_reports')
          .update({
            status: 'ready',
            file_size: mockFileSize,
            download_url: downloadUrl,
            completed_at: new Date().toISOString()
          })
          .eq('id', newReport.id)
      } catch (error) {
        logger.error('Erro ao completar geração do relatório:', error)
        await supabase
          .from('generated_reports')
          .update({
            status: 'failed',
            error_message: 'Erro durante a geração do relatório'
          })
          .eq('id', newReport.id)
      }
    }, 3000) // Simulate 3 second generation time

    // 9. Schedule report if requested
    if (validatedData.schedule?.enabled && validatedData.schedule.frequency) {
      await supabase
        .from('scheduled_reports')
        .insert({
          org_id: currentUser.org_id,
          template_id: validatedData.template_id,
          name: `${validatedData.name} (Agendado)`,
          frequency: validatedData.schedule.frequency,
          parameters: {
            format: validatedData.format,
            date_from: validatedData.date_from,
            date_to: validatedData.date_to,
            filters: validatedData.filters
          },
          recipients: validatedData.schedule.recipients || [],
          is_active: true,
          created_by: currentUser.id
        })
    }

    // 10. Log audit event
    await logAuditEvent({
      table_name: 'generated_reports',
      operation: 'CREATE',
      record_id: newReport.id,
      user_id: currentUser.id,
      additional_data: {
        template_id: validatedData.template_id,
        template_name: template.name,
        format: validatedData.format,
        scheduled: validatedData.schedule?.enabled || false
      }
    })

    // 11. Return response
    return NextResponse.json({
      success: true,
      data: {
        ...newReport,
        template
      },
      message: 'Relatório iniciado com sucesso. Você será notificado quando estiver pronto.'
    }, { status: 201 })

  } catch (error) {
    logger.error('Erro inesperado ao gerar relatório:', error)

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

