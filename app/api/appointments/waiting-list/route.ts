import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/lib/auth/server'
import { logAuditEvent } from '@/lib/audit/server'

const createWaitingListEntrySchema = z.object({
  patient_id: z.string().uuid('ID do paciente é obrigatório'),
  practitioner_id: z.string().uuid('ID do profissional é obrigatório'),
  appointment_type: z.enum(['consulta', 'retorno', 'avaliacao', 'fisioterapia', 'reavaliacao', 'emergencia']),
  preferred_date: z.string().optional(),
  preferred_time: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
})

const searchWaitingListSchema = z.object({
  search: z.string().optional(),
  practitioner_id: z.string().uuid().optional(),
  appointment_type: z.enum(['consulta', 'retorno', 'avaliacao', 'fisioterapia', 'reavaliacao', 'emergencia']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['waiting', 'contacted', 'scheduled', 'cancelled']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(['created_at', 'priority', 'preferred_date']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!hasPermission(currentUser.role, 'read', 'appointments')) {
      await logAuditEvent({
        table_name: 'appointment_waiting_list',
        operation: 'READ_DENIED',
        record_id: null,
        user_id: currentUser.id,
        additional_data: { reason: 'insufficient_permissions', attempted_role: currentUser.role }
      })
      return NextResponse.json({ error: 'Permissão insuficiente para visualizar lista de espera' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const searchData = searchWaitingListSchema.parse({
      search: searchParams.get('search'),
      practitioner_id: searchParams.get('practitioner_id'),
      appointment_type: searchParams.get('appointment_type'),
      priority: searchParams.get('priority'),
      status: searchParams.get('status'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order')
    })

    let query = supabase
      .from('appointment_waiting_list')
      .select(`
        id,
        patient_id,
        practitioner_id,
        appointment_type,
        preferred_date,
        preferred_time,
        notes,
        priority,
        status,
        created_at,
        patient:patients!appointment_waiting_list_patient_id_fkey(id, name, phone, email),
        practitioner:profiles!appointment_waiting_list_practitioner_id_fkey(id, full_name)
      `, { count: 'exact' })
      .eq('org_id', currentUser.org_id)

    if (searchData.practitioner_id) {
      query = query.eq('practitioner_id', searchData.practitioner_id)
    }
    if (searchData.appointment_type) {
      query = query.eq('appointment_type', searchData.appointment_type)
    }
    if (searchData.priority) {
      query = query.eq('priority', searchData.priority)
    }
    if (searchData.status) {
      query = query.eq('status', searchData.status)
    }
    if (searchData.search) {
      query = query.or(`patient.name.ilike.%${searchData.search}%,patient.phone.ilike.%${searchData.search}%,notes.ilike.%${searchData.search}%`)
    }

    query = query.order(searchData.sort_by, { ascending: searchData.sort_order === 'asc' })
    
    const from = (searchData.page - 1) * searchData.limit
    const to = from + searchData.limit - 1
    query = query.range(from, to)

    const { data: entries, error, count } = await query

    if (error) {
      console.error('Erro ao buscar lista de espera:', error)
      return NextResponse.json({ error: 'Erro ao buscar lista de espera' }, { status: 500 })
    }

    await logAuditEvent({
      table_name: 'appointment_waiting_list',
      operation: 'READ',
      record_id: null,
      user_id: currentUser.id,
      additional_data: { search_params: searchData, result_count: entries?.length || 0 }
    })

    return NextResponse.json({
      success: true,
      data: entries || [],
      meta: {
        total: count || 0,
        page: searchData.page,
        limit: searchData.limit,
        total_pages: Math.ceil((count || 0) / searchData.limit)
      }
    })
  } catch (error) {
    console.error('Erro inesperado ao buscar lista de espera:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!hasPermission(currentUser.role, 'write', 'appointments')) {
      await logAuditEvent({
        table_name: 'appointment_waiting_list',
        operation: 'CREATE_DENIED',
        record_id: null,
        user_id: currentUser.id,
        additional_data: { reason: 'insufficient_permissions', attempted_role: currentUser.role }
      })
      return NextResponse.json({ error: 'Permissão insuficiente para adicionar à lista de espera' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createWaitingListEntrySchema.parse(body)

    // Verificar se o paciente existe
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', validatedData.patient_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (patientError) {
      if (patientError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })
      }
      console.error('Erro ao verificar paciente:', patientError)
      return NextResponse.json({ error: 'Erro ao verificar paciente' }, { status: 500 })
    }

    // Verificar se o profissional existe
    const { data: practitioner, error: practitionerError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', validatedData.practitioner_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (practitionerError) {
      if (practitionerError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 })
      }
      console.error('Erro ao verificar profissional:', practitionerError)
      return NextResponse.json({ error: 'Erro ao verificar profissional' }, { status: 500 })
    }

    // Verificar se já existe uma entrada ativa para este paciente e profissional
    const { data: existingEntry } = await supabase
      .from('appointment_waiting_list')
      .select('id')
      .eq('patient_id', validatedData.patient_id)
      .eq('practitioner_id', validatedData.practitioner_id)
      .eq('org_id', currentUser.org_id)
      .in('status', ['waiting', 'contacted'])
      .single()

    if (existingEntry) {
      return NextResponse.json({ error: 'Já existe uma entrada ativa na lista de espera para este paciente e profissional' }, { status: 409 })
    }

    const { data: newEntry, error: createError } = await supabase
      .from('appointment_waiting_list')
      .insert({
        org_id: currentUser.org_id,
        patient_id: validatedData.patient_id,
        practitioner_id: validatedData.practitioner_id,
        appointment_type: validatedData.appointment_type,
        preferred_date: validatedData.preferred_date,
        preferred_time: validatedData.preferred_time,
        notes: validatedData.notes,
        priority: validatedData.priority,
        status: 'waiting',
        created_by: currentUser.id,
        updated_by: currentUser.id
      })
      .select('id, patient_id, practitioner_id, appointment_type, priority, status')
      .single()

    if (createError) {
      console.error('Erro ao criar entrada na lista de espera:', createError)
      return NextResponse.json({ error: 'Erro ao criar entrada na lista de espera' }, { status: 500 })
    }

    await logAuditEvent({
      table_name: 'appointment_waiting_list',
      operation: 'CREATE',
      record_id: newEntry.id,
      user_id: currentUser.id,
      additional_data: {
        patient_id: validatedData.patient_id,
        practitioner_id: validatedData.practitioner_id,
        appointment_type: validatedData.appointment_type,
        priority: validatedData.priority
      }
    })

    return NextResponse.json({
      success: true,
      data: newEntry,
      message: 'Entrada adicionada à lista de espera com sucesso'
    }, { status: 201 })
  } catch (error) {
    console.error('Erro inesperado ao criar entrada na lista de espera:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
