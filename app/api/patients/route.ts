/**
 * API Endpoint - Patients Management - FisioFlow
 * GET /api/patients - List patients with search and filters
 * POST /api/patients - Create new patient
 *
 * Implements Brazilian healthcare compliance, LGPD requirements, and RBAC
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/src/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/src/lib/auth/server'
import { logAuditEvent } from '@/src/lib/audit/server'
import { validateLGPDConsent } from '@/src/lib/lgpd/server'
import logger from '../../../lib/logger';

// Schema for patient creation
const createPatientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255, 'Nome muito longo'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(14, 'CPF inválido'),
  rg: z.string().optional(),
  date_of_birth: z.string().min(1, 'Data de nascimento é obrigatória'),
  gender: z.enum(['masculino', 'feminino', 'outro']),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  email: z.string().email('Email inválido').optional(),
  emergency_contact_name: z.string().min(2, 'Nome do contato de emergência é obrigatório'),
  emergency_contact_phone: z.string().min(10, 'Telefone de emergência é obrigatório'),
  
  // Address
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  
  // Health information
  health_insurance: z.string().optional(),
  health_insurance_number: z.string().optional(),
  medical_history: z.string().optional(),
  current_medications: z.string().optional(),
  allergies: z.string().optional(),
  observations: z.string().optional(),
  
  // LGPD consent
  consent_lgpd: z.boolean().refine(val => val, 'Consentimento LGPD é obrigatório'),
  consent_version: z.string().default('1.0')
})

// Schema for patient search/filters
const searchPatientsSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  gender: z.enum(['masculino', 'feminino', 'outro']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(['name', 'created_at', 'updated_at']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
})

/**
 * GET /api/patients
 * List patients with search and filters
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
    if (!hasPermission(currentUser.role, 'read', 'patients')) {
      await logAuditEvent({
        table_name: 'patients',
        operation: 'READ_DENIED',
        record_id: null,
        user_id: currentUser.id,
        additional_data: {
          reason: 'insufficient_permissions',
          attempted_role: currentUser.role
        }
      })

      return NextResponse.json(
        { error: 'Permissão insuficiente para visualizar pacientes' },
        { status: 403 }
      )
    }

    // 3. Parse search parameters
    const { searchParams } = new URL(request.url)
    const searchData = searchPatientsSchema.parse({
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      gender: searchParams.get('gender'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order')
    })

    // 4. Build query
    let query = supabase
      .from('patients')
      .select(`
        id,
        name,
        cpf,
        date_of_birth,
        gender,
        phone,
        email,
        status,
        photo_url,
        created_at,
        updated_at,
        created_by:profiles!patients_created_by_fkey(full_name),
        updated_by:profiles!patients_updated_by_fkey(full_name)
      `)
      .eq('org_id', currentUser.org_id)

    // Apply filters
    if (searchData.status) {
      query = query.eq('status', searchData.status)
    }

    if (searchData.gender) {
      query = query.eq('gender', searchData.gender)
    }

    if (searchData.search) {
      query = query.or(`name.ilike.%${searchData.search}%,cpf.ilike.%${searchData.search}%,phone.ilike.%${searchData.search}%`)
    }

    // Apply sorting
    query = query.order(searchData.sort_by, { ascending: searchData.sort_order === 'asc' })

    // Apply pagination
    const from = (searchData.page - 1) * searchData.limit
    const to = from + searchData.limit - 1
    query = query.range(from, to)

    // 5. Execute query
    const { data: patients, error, count } = await query

    if (error) {
      logger.error('Erro ao buscar pacientes:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar pacientes' },
        { status: 500 }
      )
    }

    // 6. Log access
    await logAuditEvent({
      table_name: 'patients',
      operation: 'READ',
      record_id: null,
      user_id: currentUser.id,
      additional_data: {
        search_params: searchData,
        result_count: patients?.length || 0
      }
    })

    // 7. Return response
    return NextResponse.json({
      success: true,
      data: patients || [],
      meta: {
        total: count || 0,
        page: searchData.page,
        limit: searchData.limit,
        total_pages: Math.ceil((count || 0) / searchData.limit)
      }
    })

  } catch (error) {
    logger.error('Erro inesperado ao buscar pacientes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/patients
 * Create new patient
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
    if (!hasPermission(currentUser.role, 'write', 'patients')) {
      await logAuditEvent({
        table_name: 'patients',
        operation: 'CREATE_DENIED',
        record_id: null,
        user_id: currentUser.id,
        additional_data: {
          reason: 'insufficient_permissions',
          attempted_role: currentUser.role
        }
      })

      return NextResponse.json(
        { error: 'Permissão insuficiente para criar pacientes' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validatedData = createPatientSchema.parse(body)

    // 4. Validate CPF using database function
    const { data: cpfValid, error: cpfError } = await supabase
      .rpc('validate_cpf', { cpf_text: validatedData.cpf })

    if (cpfError || !cpfValid) {
      return NextResponse.json(
        { error: 'CPF inválido' },
        { status: 400 }
      )
    }

    // 5. Check if CPF already exists in organization
    const { data: existingPatient, error: checkError } = await supabase
      .from('patients')
      .select('id')
      .eq('org_id', currentUser.org_id)
      .eq('cpf', validatedData.cpf)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      logger.error('Erro ao verificar CPF existente:', checkError)
      return NextResponse.json(
        { error: 'Erro ao verificar CPF' },
        { status: 500 }
      )
    }

    if (existingPatient) {
      return NextResponse.json(
        { error: 'Já existe um paciente com este CPF' },
        { status: 409 }
      )
    }

    // 6. Create patient
    const { data: newPatient, error: createError } = await supabase
      .from('patients')
      .insert({
        org_id: currentUser.org_id,
        name: validatedData.name,
        cpf: validatedData.cpf,
        rg: validatedData.rg,
        date_of_birth: validatedData.date_of_birth,
        gender: validatedData.gender,
        phone: validatedData.phone,
        email: validatedData.email,
        emergency_contact_name: validatedData.emergency_contact_name,
        emergency_contact_phone: validatedData.emergency_contact_phone,
        address_line1: validatedData.address_line1,
        address_line2: validatedData.address_line2,
        city: validatedData.city,
        state: validatedData.state,
        postal_code: validatedData.postal_code,
        health_insurance: validatedData.health_insurance,
        health_insurance_number: validatedData.health_insurance_number,
        medical_history: validatedData.medical_history,
        current_medications: validatedData.current_medications,
        allergies: validatedData.allergies,
        observations: validatedData.observations,
        consent_lgpd: validatedData.consent_lgpd,
        consent_date: new Date().toISOString(),
        consent_version: validatedData.consent_version,
        created_by: currentUser.id,
        updated_by: currentUser.id
      })
      .select(`
        id,
        name,
        cpf,
        date_of_birth,
        gender,
        phone,
        email,
        status,
        created_at,
        created_by:profiles!patients_created_by_fkey(full_name)
      `)
      .single()

    if (createError) {
      logger.error('Erro ao criar paciente:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar paciente' },
        { status: 500 }
      )
    }

    // 7. Log consent history
    if (validatedData.consent_lgpd) {
      await supabase
        .from('patient_consent_history')
        .insert({
          patient_id: newPatient.id,
          org_id: currentUser.org_id,
          consent_type: 'data_processing',
          granted: true,
          consent_text: 'Consentimento para processamento de dados pessoais conforme LGPD',
          consent_version: validatedData.consent_version,
          granted_by: currentUser.id
        })
    }

    // 8. Log audit event
    await logAuditEvent({
      table_name: 'patients',
      operation: 'CREATE',
      record_id: newPatient.id,
      user_id: currentUser.id,
      additional_data: {
        patient_name: newPatient.name,
        cpf: newPatient.cpf,
        lgpd_consent: validatedData.consent_lgpd
      }
    })

    // 9. Return response
    return NextResponse.json({
      success: true,
      data: newPatient,
      message: 'Paciente criado com sucesso'
    }, { status: 201 })

  } catch (error) {
    logger.error('Erro inesperado ao criar paciente:', error)
    
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
