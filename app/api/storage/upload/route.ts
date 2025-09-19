/**
 * API Endpoint - File Upload - FisioFlow
 * POST /api/storage/upload
 *
 * Handles file uploads to Supabase Storage
 * Implements Brazilian healthcare compliance and LGPD
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/src/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/src/lib/auth/server'
import { logAuditEvent } from '@/src/lib/audit/server'
import logger from '../../../../lib/logger';

// Schema for upload request
const uploadSchema = z.object({
  bucket: z.enum([
    'patient-photos',
    'patient-documents', 
    'exercise-videos',
    'exercise-thumbnails',
    'clinical-reports',
    'org-logos',
    'data-exports'
  ]),
  patient_id: z.string().uuid().optional(),
  file_type: z.string().optional(),
  description: z.string().optional()
})

/**
 * POST /api/storage/upload
 * Upload file to Supabase Storage
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
    if (!hasPermission(currentUser.role, 'write', 'storage')) {
      await logAuditEvent({
        table_name: 'storage',
        operation: 'UPLOAD_DENIED',
        record_id: null,
        user_id: currentUser.id,
        additional_data: {
          reason: 'insufficient_permissions',
          attempted_role: currentUser.role
        }
      })

      return NextResponse.json(
        { error: 'Permissão insuficiente para fazer upload de arquivos' },
        { status: 403 }
      )
    }

    // 3. Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string
    const patientId = formData.get('patient_id') as string
    const fileType = formData.get('file_type') as string
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo é obrigatório' },
        { status: 400 }
      )
    }

    // 4. Validate upload data
    const validatedData = uploadSchema.parse({
      bucket,
      patient_id: patientId,
      file_type: fileType,
      description
    })

    // 5. Validate file using database function
    const { data: isValid, error: validationError } = await supabase
      .rpc('validate_file_upload', {
        p_bucket_id: validatedData.bucket,
        p_file_size: file.size,
        p_mime_type: file.type
      })

    if (validationError || !isValid) {
      return NextResponse.json(
        { error: 'Arquivo inválido. Verifique o tamanho e tipo do arquivo.' },
        { status: 400 }
      )
    }

    // 6. Generate file path
    const fileName = `${Date.now()}-${file.name}`
    const { data: filePath, error: pathError } = await supabase
      .rpc('generate_file_path', {
        p_bucket_id: validatedData.bucket,
        p_org_id: currentUser.org_id,
        p_patient_id: validatedData.patient_id || null,
        p_file_name: fileName
      })

    if (pathError) {
      logger.error('Erro ao gerar caminho do arquivo:', pathError)
      return NextResponse.json(
        { error: 'Erro ao processar arquivo' },
        { status: 500 }
      )
    }

    // 7. Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(validatedData.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      logger.error('Erro no upload:', uploadError)
      return NextResponse.json(
        { error: 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      )
    }

    // 8. Get public URL or signed URL
    const { data: urlData } = supabase.storage
      .from(validatedData.bucket)
      .getPublicUrl(filePath)

    // 9. Log file upload in database if it's a patient file
    if (validatedData.patient_id && (validatedData.bucket === 'patient-photos' || validatedData.bucket === 'patient-documents')) {
      const tableName = validatedData.bucket === 'patient-photos' ? 'patient_photos' : 'patient_documents'
      
      await supabase
        .from(tableName)
        .insert({
          patient_id: validatedData.patient_id,
          org_id: currentUser.org_id,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: currentUser.id
        })
    }

    // 10. Log audit event
    await logAuditEvent({
      table_name: 'storage',
      operation: 'UPLOAD',
      record_id: uploadData.path,
      user_id: currentUser.id,
      additional_data: {
        bucket: validatedData.bucket,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        patient_id: validatedData.patient_id
      }
    })

    // 11. Return success response
    return NextResponse.json({
      success: true,
      data: {
        file_path: uploadData.path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        public_url: urlData.publicUrl,
        bucket: validatedData.bucket
      },
      message: 'Arquivo enviado com sucesso'
    })

  } catch (error) {
    logger.error('Erro inesperado no upload:', error)
    
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
