/**
 * API Endpoint - Report Download - FisioFlow
 * GET /api/reports/download/[id] - Download a generated report
 *
 * Handles secure report downloads with expiration
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/src/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/src/lib/auth/server'
import { logAuditEvent } from '@/src/lib/audit/server'
import logger from '../../../../../lib/logger';

/**
 * GET /api/reports/download/[id]
 * Download a generated report
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await context.params
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
        { error: 'Permissão insuficiente para baixar relatórios' },
        { status: 403 }
      )
    }

    // 3. Get report details
    const { data: report, error: reportError } = await supabase
      .from('generated_reports')
      .select(`
        id,
        template_id,
        name,
        category,
        format,
        status,
        file_size,
        download_url,
        expires_at,
        generated_at,
        generated_by
      `)
      .eq('id', reportId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (reportError) {
      if (reportError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Relatório não encontrado' },
          { status: 404 }
        )
      }

      logger.error('Erro ao buscar relatório:', reportError)
      return NextResponse.json(
        { error: 'Erro ao buscar relatório' },
        { status: 500 }
      )
    }

    // 4. Check if report is ready
    if (report.status !== 'ready') {
      return NextResponse.json(
        { 
          error: 'Relatório não está pronto para download',
          status: report.status
        },
        { status: 400 }
      )
    }

    // 5. Check if report has expired
    if (report.expires_at && new Date(report.expires_at) < new Date()) {
      await supabase
        .from('generated_reports')
        .update({ status: 'expired' })
        .eq('id', reportId)

      return NextResponse.json(
        { error: 'Relatório expirado. Gere um novo relatório.' },
        { status: 410 }
      )
    }

    // 6. Generate mock report content based on format
    let content: string | Buffer
    let mimeType: string
    let filename: string

    const reportName = report.name.replace(/[^a-zA-Z0-9\-_\s]/g, '').replace(/\s+/g, '_')
    const timestamp = new Date().toISOString().split('T')[0]

    switch (report.format) {
      case 'pdf':
        // Mock PDF content
        content = Buffer.from(`%PDF-1.4
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
/Resources <<
  /Font <<
    /F1 5 0 R
  >>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
100 700 Td
(${report.name}) Tj
0 -20 Td
(Gerado em: ${new Date().toLocaleString('pt-BR')}) Tj
0 -20 Td
(Relatório gerado pelo FisioFlow) Tj
0 -40 Td
(Este é um relatório de demonstração.) Tj
0 -20 Td
(Em um ambiente de produção, este seria) Tj
0 -20 Td
(substituído pelo conteúdo real do relatório.) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
0000000274 00000 n 
0000000523 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
590
%%EOF`)
        mimeType = 'application/pdf'
        filename = `${reportName}_${timestamp}.pdf`
        break

      case 'excel':
        // Mock Excel content (simplified CSV format for demonstration)
        const csvContent = [
          'Relatório,Valor',
          `${report.name},Dados de demonstração`,
          'Gerado em,' + new Date().toLocaleString('pt-BR'),
          '',
          'Este é um relatório de demonstração',
          'Em produção seria substituído por dados reais'
        ].join('\n')

        content = Buffer.from('\ufeff' + csvContent, 'utf8') // Add BOM for Excel
        mimeType = 'application/vnd.ms-excel'
        filename = `${reportName}_${timestamp}.csv`
        break

      case 'csv':
        // Mock CSV content
        const csvData = [
          'Campo,Valor',
          `Nome do Relatório,"${report.name}"`,
          `Data de Geração,"${new Date().toLocaleString('pt-BR')}"`,
          'Status,Ativo',
          'Observações,"Relatório de demonstração gerado pelo FisioFlow"'
        ].join('\n')

        content = Buffer.from(csvData, 'utf8')
        mimeType = 'text/csv'
        filename = `${reportName}_${timestamp}.csv`
        break

      default:
        return NextResponse.json(
          { error: 'Formato de relatório não suportado' },
          { status: 400 }
        )
    }

    // 7. Log download event
    await logAuditEvent({
      table_name: 'generated_reports',
      operation: 'DOWNLOAD',
      record_id: report.id,
      user_id: currentUser.id,
      additional_data: {
        report_name: report.name,
        format: report.format,
        file_size: content.length
      }
    })

    // 8. Update download count
    await supabase
      .from('generated_reports')
      .update({ 
        download_count: supabase.sql`COALESCE(download_count, 0) + 1`,
        last_downloaded_at: new Date().toISOString()
      })
      .eq('id', reportId)

    // 9. Return file response
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': content.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    logger.error('Erro inesperado ao baixar relatório:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

