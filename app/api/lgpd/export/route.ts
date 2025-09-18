/**
 * LGPD Data Export API
 * Handles patient data export requests according to LGPD requirements
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'
import { logAuditEvent } from '@/lib/audit/server'

const exportRequestSchema = z.object({
  type: z.enum(['complete', 'specific']),
  categories: z.array(z.string()).optional()
})

/**
 * POST /api/lgpd/export
 * Create new data export request
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // 1. Authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // 2. Only patients can export their own data
    if (currentUser.role !== 'paciente') {
      return NextResponse.json(
        { error: 'Apenas pacientes podem solicitar exportação de dados' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request
    const body = await request.json()
    const validatedData = exportRequestSchema.parse(body)

    // 4. Check for recent export requests (rate limiting)
    const recentRequestsQuery = await supabase
      .from('data_export_requests')
      .select('id')
      .eq('patient_id', currentUser.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (recentRequestsQuery.data && recentRequestsQuery.data.length >= 3) {
      return NextResponse.json(
        { error: 'Limite de solicitações excedido. Tente novamente em 24 horas.' },
        { status: 429 }
      )
    }

    // 5. Create export request
    const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const { data: exportRequest, error: createError } = await supabase
      .from('data_export_requests')
      .insert({
        patient_id: currentUser.id,
        type: validatedData.type,
        categories: validatedData.categories || [],
        status: 'pending',
        expires_at: expirationDate.toISOString(),
        created_by: currentUser.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating export request:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar solicitação de exportação' },
        { status: 500 }
      )
    }

    // 6. Trigger background job to generate export
    // In a real implementation, this would queue a background job
    await processExportRequest(exportRequest.id, currentUser.id, validatedData)

    // 7. Log audit event
    await logAuditEvent({
      table_name: 'data_export_requests',
      operation: 'CREATE',
      record_id: exportRequest.id,
      user_id: currentUser.id,
      additional_data: {
        export_type: validatedData.type,
        categories: validatedData.categories
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: exportRequest.id,
        type: exportRequest.type,
        categories: exportRequest.categories,
        status: exportRequest.status,
        requestedAt: exportRequest.created_at,
        expiresAt: exportRequest.expires_at
      },
      message: 'Solicitação de exportação criada com sucesso'
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in export request:', error)

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
 * GET /api/lgpd/export
 * List user's export requests
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // 1. Authentication
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'paciente') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // 2. Get export requests
    const { data: requests, error } = await supabase
      .from('data_export_requests')
      .select('*')
      .eq('patient_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching export requests:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar solicitações' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: requests.map(request => ({
        id: request.id,
        type: request.type,
        categories: request.categories,
        status: request.status,
        requestedAt: request.created_at,
        expiresAt: request.expires_at,
        downloadUrl: request.status === 'ready' ? `/api/lgpd/export/download/${request.id}` : undefined
      }))
    })

  } catch (error) {
    console.error('Unexpected error in export list:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * Process export request (background job simulation)
 */
async function processExportRequest(requestId: string, patientId: string, requestData: any) {
  try {
    const supabase = await createServerClient()

    // Update status to processing
    await supabase
      .from('data_export_requests')
      .update({ status: 'processing' })
      .eq('id', requestId)

    // Simulate processing time
    setTimeout(async () => {
      try {
        // Generate export data
        const exportData = await generatePatientExport(patientId, requestData)

        // Store export file (in real implementation, this would be in storage)
        const { data: fileData, error: fileError } = await supabase.storage
          .from('lgpd-exports')
          .upload(`${requestId}/patient-data.json`, JSON.stringify(exportData, null, 2), {
            contentType: 'application/json'
          })

        if (fileError) {
          throw fileError
        }

        // Update request as ready
        await supabase
          .from('data_export_requests')
          .update({
            status: 'ready',
            file_path: fileData.path
          })
          .eq('id', requestId)

        console.log(`Export request ${requestId} completed`)

      } catch (error) {
        console.error(`Export request ${requestId} failed:`, error)

        // Mark as failed
        await supabase
          .from('data_export_requests')
          .update({ status: 'failed' })
          .eq('id', requestId)
      }
    }, 5000) // 5 second delay for demo

  } catch (error) {
    console.error('Error processing export request:', error)
  }
}

/**
 * Generate comprehensive patient data export
 */
async function generatePatientExport(patientId: string, requestData: any) {
  const supabase = await createServerClient()

  const exportData: any = {
    exportInfo: {
      requestedAt: new Date().toISOString(),
      patientId,
      type: requestData.type,
      categories: requestData.categories,
      lgpdCompliance: true
    },
    data: {}
  }

  const categories = requestData.type === 'complete'
    ? ['personal', 'medical', 'appointments', 'prescriptions', 'photos', 'communications']
    : requestData.categories

  // Personal data
  if (categories.includes('personal')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', patientId)
      .single()

    exportData.data.personal = profile
  }

  // Medical data
  if (categories.includes('medical')) {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('patient_id', patientId)

    exportData.data.medical = { sessions }
  }

  // Appointments
  if (categories.includes('appointments')) {
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)

    exportData.data.appointments = appointments
  }

  // Prescriptions
  if (categories.includes('prescriptions')) {
    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('*, prescription_exercises(*)')
      .eq('patient_id', patientId)

    exportData.data.prescriptions = prescriptions
  }

  // Photos and documents
  if (categories.includes('photos')) {
    const { data: files } = await supabase.storage
      .from('patient-photos')
      .list(patientId)

    exportData.data.photos = files?.map(file => ({
      name: file.name,
      size: file.metadata?.size,
      lastModified: file.updated_at
    })) || []
  }

  // Communications (simplified)
  if (categories.includes('communications')) {
    exportData.data.communications = {
      note: 'Dados de comunicação serão incluídos em versão futura'
    }
  }

  return exportData
}