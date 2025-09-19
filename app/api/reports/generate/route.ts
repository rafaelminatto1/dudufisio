/**
 * API Endpoint - Report Generation - FisioFlow
 * POST /api/reports/generate
 *
 * Generate PDF reports for patients, sessions, and progress
 * Implements Brazilian healthcare compliance and LGPD
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/src/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/src/lib/auth/server'
import { logAuditEvent } from '@/src/lib/audit/server'
import logger from '../../../../lib/logger';

// Schema for report generation request
const generateReportSchema = z.object({
  report_type: z.enum([
    'patient_summary',
    'session_report', 
    'progress_report',
    'discharge_summary',
    'appointment_summary',
    'financial_report',
    'custom'
  ]),
  template_id: z.string().uuid().optional(),
  patient_id: z.string().uuid().optional(),
  session_id: z.string().uuid().optional(),
  appointment_id: z.string().uuid().optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  custom_data: z.record(z.any()).optional(),
  format: z.enum(['pdf', 'html', 'json']).default('pdf'),
  include_attachments: z.boolean().default(false)
})

/**
 * POST /api/reports/generate
 * Generate report
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
    if (!hasPermission(currentUser.role, 'read', 'reports')) {
      await logAuditEvent({
        table_name: 'reports',
        operation: 'GENERATE_DENIED',
        record_id: null,
        user_id: currentUser.id,
        additional_data: {
          reason: 'insufficient_permissions',
          attempted_role: currentUser.role
        }
      })

      return NextResponse.json(
        { error: 'Permissão insuficiente para gerar relatórios' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validatedData = generateReportSchema.parse(body)

    // 4. Get report template
    let template = null
    if (validatedData.template_id) {
      const { data: templateData, error: templateError } = await supabase
        .from('report_templates')
        .select('*')
        .eq('id', validatedData.template_id)
        .eq('org_id', currentUser.org_id)
        .single()

      if (templateError || !templateData) {
        return NextResponse.json(
          { error: 'Template de relatório não encontrado' },
          { status: 404 }
        )
      }
      template = templateData
    } else {
      // Get default template for report type
      const { data: defaultTemplate, error: defaultError } = await supabase
        .from('report_templates')
        .select('*')
        .eq('template_type', validatedData.report_type)
        .eq('org_id', currentUser.org_id)
        .eq('is_default', true)
        .single()

      if (defaultError || !defaultTemplate) {
        return NextResponse.json(
          { error: 'Template padrão não encontrado para este tipo de relatório' },
          { status: 404 }
        )
      }
      template = defaultTemplate
    }

    // 5. Generate report data based on type
    let reportData = null
    let reportTitle = ''

    switch (validatedData.report_type) {
      case 'patient_summary':
        if (!validatedData.patient_id) {
          return NextResponse.json(
            { error: 'ID do paciente é obrigatório para relatório de resumo' },
            { status: 400 }
          )
        }
        
        const { data: patientSummaryData, error: patientError } = await supabase
          .rpc('generate_patient_summary_report', {
            p_patient_id: validatedData.patient_id,
            p_start_date: validatedData.start_date || null,
            p_end_date: validatedData.end_date || null
          })

        if (patientError) {
          logger.error('Erro ao gerar dados do relatório de paciente:', patientError)
          return NextResponse.json(
            { error: 'Erro ao gerar dados do relatório' },
            { status: 500 }
          )
        }

        reportData = patientSummaryData
        reportTitle = `Relatório de Resumo - ${patientSummaryData.patient?.name || 'Paciente'}`
        break

      case 'session_report':
        if (!validatedData.session_id) {
          return NextResponse.json(
            { error: 'ID da sessão é obrigatório para relatório de sessão' },
            { status: 400 }
          )
        }

        const { data: sessionReportData, error: sessionError } = await supabase
          .rpc('generate_session_report', {
            p_session_id: validatedData.session_id
          })

        if (sessionError) {
          logger.error('Erro ao gerar dados do relatório de sessão:', sessionError)
          return NextResponse.json(
            { error: 'Erro ao gerar dados do relatório' },
            { status: 500 }
          )
        }

        reportData = sessionReportData
        reportTitle = `Relatório de Sessão - ${sessionReportData.session?.patient_name || 'Paciente'}`
        break

      case 'progress_report':
        if (!validatedData.patient_id || !validatedData.start_date || !validatedData.end_date) {
          return NextResponse.json(
            { error: 'ID do paciente, data inicial e data final são obrigatórios para relatório de progresso' },
            { status: 400 }
          )
        }

        const { data: progressReportData, error: progressError } = await supabase
          .rpc('generate_progress_report', {
            p_patient_id: validatedData.patient_id,
            p_start_date: validatedData.start_date,
            p_end_date: validatedData.end_date
          })

        if (progressError) {
          logger.error('Erro ao gerar dados do relatório de progresso:', progressError)
          return NextResponse.json(
            { error: 'Erro ao gerar dados do relatório' },
            { status: 500 }
          )
        }

        reportData = progressReportData
        reportTitle = `Relatório de Progresso - ${progressReportData.patient?.name || 'Paciente'}`
        break

      default:
        return NextResponse.json(
          { error: 'Tipo de relatório não suportado' },
          { status: 400 }
        )
    }

    // 6. Generate report file
    let filePath = null
    let fileSize = 0

    if (validatedData.format === 'pdf') {
      // Generate PDF using a PDF generation library
      // This would typically use puppeteer, jsPDF, or similar
      const pdfBuffer = await generatePDF(reportData, template, validatedData)
      
      // Upload to storage
      const fileName = `relatorio_${validatedData.report_type}_${Date.now()}.pdf`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('clinical-reports')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600'
        })

      if (uploadError) {
        logger.error('Erro ao fazer upload do relatório:', uploadError)
        return NextResponse.json(
          { error: 'Erro ao salvar relatório' },
          { status: 500 }
        )
      }

      filePath = uploadData.path
      fileSize = pdfBuffer.length
    }

    // 7. Save report record
    const { data: reportRecord, error: saveError } = await supabase
      .from('generated_reports')
      .insert({
        org_id: currentUser.org_id,
        template_id: template.id,
        patient_id: validatedData.patient_id,
        session_id: validatedData.session_id,
        appointment_id: validatedData.appointment_id,
        report_type: validatedData.report_type,
        report_title: reportTitle,
        report_data: reportData,
        file_path: filePath,
        file_size: fileSize,
        generated_by: currentUser.id,
        status: 'generated',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      })
      .select('*')
      .single()

    if (saveError) {
      logger.error('Erro ao salvar registro do relatório:', saveError)
      return NextResponse.json(
        { error: 'Erro ao salvar relatório' },
        { status: 500 }
      )
    }

    // 8. Log audit event
    await logAuditEvent({
      table_name: 'reports',
      operation: 'GENERATE',
      record_id: reportRecord.id,
      user_id: currentUser.id,
      additional_data: {
        report_type: validatedData.report_type,
        patient_id: validatedData.patient_id,
        session_id: validatedData.session_id,
        format: validatedData.format,
        file_size: fileSize
      }
    })

    // 9. Return response
    return NextResponse.json({
      success: true,
      data: {
        report_id: reportRecord.id,
        report_title: reportTitle,
        report_type: validatedData.report_type,
        format: validatedData.format,
        file_path: filePath,
        file_size: fileSize,
        generated_at: reportRecord.generated_at,
        download_url: filePath ? `/api/reports/download/${reportRecord.id}` : null
      },
      message: 'Relatório gerado com sucesso'
    })

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

/**
 * Generate PDF from report data and template
 */
async function generatePDF(reportData: any, template: any, options: any): Promise<Buffer> {
  // This is a placeholder implementation
  // In a real implementation, you would use a PDF generation library like:
  // - Puppeteer for HTML to PDF conversion
  // - jsPDF for client-side PDF generation
  // - PDFKit for server-side PDF generation
  
  // For now, return a simple text-based PDF
  const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Relatório FisioFlow) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF
  `

  return Buffer.from(pdfContent, 'utf-8')
}
