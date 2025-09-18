/**
 * API Endpoint - Billing Management - FisioFlow
 * GET /api/billing - List billing records with filters
 * POST /api/billing - Create new billing record
 *
 * Manages patient billing and payment tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/lib/auth/server'
import { logAuditEvent } from '@/lib/audit/server'

// Schema for billing creation
const createBillingSchema = z.object({
  patient_id: z.string().uuid('ID do paciente deve ser um UUID válido'),
  session_id: z.string().uuid().optional(),
  procedure_id: z.string().uuid('ID do procedimento é obrigatório'),
  service_date: z.string().min(1, 'Data do serviço é obrigatória'),
  quantity: z.number().min(1).max(10).default(1),
  unit_price: z.number().min(0.01, 'Preço unitário deve ser maior que zero'),
  discount_percentage: z.number().min(0).max(100).default(0),
  discount_amount: z.number().min(0).default(0),
  total_amount: z.number().min(0.01, 'Valor total deve ser maior que zero'),
  payment_method: z.enum(['pix', 'credit_card', 'debit_card', 'cash', 'bank_transfer', 'health_insurance', 'installment']),
  payment_status: z.enum(['pending', 'paid', 'partially_paid', 'overdue', 'cancelled']).default('pending'),
  due_date: z.string().min(1, 'Data de vencimento é obrigatória'),
  installments: z.number().min(1).max(12).optional(),
  notes: z.string().optional(),
  health_insurance_info: z.object({
    provider: z.string(),
    policy_number: z.string(),
    authorization_code: z.string().optional()
  }).optional()
})

// Schema for payment registration
const registerPaymentSchema = z.object({
  billing_id: z.string().uuid(),
  amount_paid: z.number().min(0.01),
  payment_method: z.enum(['pix', 'credit_card', 'debit_card', 'cash', 'bank_transfer', 'health_insurance']),
  payment_date: z.string().min(1),
  transaction_id: z.string().optional(),
  notes: z.string().optional()
})

// Schema for billing search/filters
const searchBillingSchema = z.object({
  patient_id: z.string().uuid().optional(),
  therapist_id: z.string().uuid().optional(),
  payment_status: z.enum(['pending', 'paid', 'partially_paid', 'overdue', 'cancelled']).optional(),
  payment_method: z.enum(['pix', 'credit_card', 'debit_card', 'cash', 'bank_transfer', 'health_insurance', 'installment']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  due_from: z.string().optional(),
  due_to: z.string().optional(),
  amount_min: z.coerce.number().optional(),
  amount_max: z.coerce.number().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(['service_date', 'due_date', 'total_amount', 'created_at']).default('due_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
})

/**
 * GET /api/billing
 * List billing records with filters
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
    if (!hasPermission(currentUser.role, 'read', 'billing')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para visualizar cobranças' },
        { status: 403 }
      )
    }

    // 3. Parse search parameters
    const { searchParams } = new URL(request.url)
    const searchData = searchBillingSchema.parse({
      patient_id: searchParams.get('patient_id'),
      therapist_id: searchParams.get('therapist_id'),
      payment_status: searchParams.get('payment_status'),
      payment_method: searchParams.get('payment_method'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
      due_from: searchParams.get('due_from'),
      due_to: searchParams.get('due_to'),
      amount_min: searchParams.get('amount_min'),
      amount_max: searchParams.get('amount_max'),
      search: searchParams.get('search'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order')
    })

    // 4. Build query
    let query = supabase
      .from('billing')
      .select(`
        id,
        patient_id,
        session_id,
        procedure_id,
        service_date,
        quantity,
        unit_price,
        discount_percentage,
        discount_amount,
        total_amount,
        payment_method,
        payment_status,
        due_date,
        installments,
        notes,
        health_insurance_info,
        created_at,
        updated_at,
        patient:patients!billing_patient_id_fkey(id, name, cpf, phone),
        procedure:procedures!billing_procedure_id_fkey(id, code, name, category),
        session:sessions!billing_session_id_fkey(id, date),
        payments:payments!inner(id, amount_paid, payment_date, payment_method),
        therapist:profiles!billing_created_by_fkey(id, full_name)
      `, { count: 'exact' })
      .eq('org_id', currentUser.org_id)

    // Apply filters
    if (searchData.patient_id) {
      query = query.eq('patient_id', searchData.patient_id)
    }

    if (searchData.therapist_id) {
      query = query.eq('created_by', searchData.therapist_id)
    }

    if (searchData.payment_status) {
      query = query.eq('payment_status', searchData.payment_status)
    }

    if (searchData.payment_method) {
      query = query.eq('payment_method', searchData.payment_method)
    }

    if (searchData.date_from) {
      query = query.gte('service_date', searchData.date_from)
    }

    if (searchData.date_to) {
      query = query.lte('service_date', searchData.date_to)
    }

    if (searchData.due_from) {
      query = query.gte('due_date', searchData.due_from)
    }

    if (searchData.due_to) {
      query = query.lte('due_date', searchData.due_to)
    }

    if (searchData.amount_min) {
      query = query.gte('total_amount', searchData.amount_min)
    }

    if (searchData.amount_max) {
      query = query.lte('total_amount', searchData.amount_max)
    }

    if (searchData.search) {
      query = query.or(`notes.ilike.%${searchData.search}%`)
    }

    // Apply sorting
    query = query.order(searchData.sort_by, { ascending: searchData.sort_order === 'asc' })

    // Apply pagination
    const from = (searchData.page - 1) * searchData.limit
    const to = from + searchData.limit - 1
    query = query.range(from, to)

    // 5. Execute query
    const { data: billingRecords, error, count } = await query

    if (error) {
      console.error('Erro ao buscar cobranças:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar cobranças' },
        { status: 500 }
      )
    }

    // 6. Calculate summary statistics
    const summaryQuery = supabase
      .from('billing')
      .select('total_amount, payment_status')
      .eq('org_id', currentUser.org_id)

    // Apply same filters for summary
    if (searchData.date_from) summaryQuery.gte('service_date', searchData.date_from)
    if (searchData.date_to) summaryQuery.lte('service_date', searchData.date_to)
    if (searchData.payment_status) summaryQuery.eq('payment_status', searchData.payment_status)

    const { data: summaryData } = await summaryQuery

    const summary = {
      total_billed: summaryData?.reduce((sum, record) => sum + record.total_amount, 0) || 0,
      total_paid: summaryData?.filter(r => r.payment_status === 'paid').reduce((sum, record) => sum + record.total_amount, 0) || 0,
      total_pending: summaryData?.filter(r => r.payment_status === 'pending').reduce((sum, record) => sum + record.total_amount, 0) || 0,
      total_overdue: summaryData?.filter(r => r.payment_status === 'overdue').reduce((sum, record) => sum + record.total_amount, 0) || 0,
      count_paid: summaryData?.filter(r => r.payment_status === 'paid').length || 0,
      count_pending: summaryData?.filter(r => r.payment_status === 'pending').length || 0,
      count_overdue: summaryData?.filter(r => r.payment_status === 'overdue').length || 0
    }

    // 7. Return response
    return NextResponse.json({
      success: true,
      data: billingRecords || [],
      summary,
      meta: {
        total: count || 0,
        page: searchData.page,
        limit: searchData.limit,
        total_pages: Math.ceil((count || 0) / searchData.limit)
      }
    })

  } catch (error) {
    console.error('Erro inesperado ao buscar cobranças:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/billing
 * Create new billing record
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
    if (!hasPermission(currentUser.role, 'write', 'billing')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para criar cobranças' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validatedData = createBillingSchema.parse(body)

    // 4. Validate patient exists
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, name')
      .eq('id', validatedData.patient_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (patientError) {
      if (patientError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Paciente não encontrado' },
          { status: 404 }
        )
      }

      console.error('Erro ao verificar paciente:', patientError)
      return NextResponse.json(
        { error: 'Erro ao verificar paciente' },
        { status: 500 }
      )
    }

    // 5. Validate procedure exists
    const { data: procedure, error: procedureError } = await supabase
      .from('procedures')
      .select('id, name, base_price')
      .eq('id', validatedData.procedure_id)
      .eq('org_id', currentUser.org_id)
      .eq('is_active', true)
      .single()

    if (procedureError) {
      if (procedureError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Procedimento não encontrado' },
          { status: 404 }
        )
      }

      console.error('Erro ao verificar procedimento:', procedureError)
      return NextResponse.json(
        { error: 'Erro ao verificar procedimento' },
        { status: 500 }
      )
    }

    // 6. Create billing record
    const { data: newBilling, error: createError } = await supabase
      .from('billing')
      .insert({
        org_id: currentUser.org_id,
        patient_id: validatedData.patient_id,
        session_id: validatedData.session_id,
        procedure_id: validatedData.procedure_id,
        service_date: validatedData.service_date,
        quantity: validatedData.quantity,
        unit_price: validatedData.unit_price,
        discount_percentage: validatedData.discount_percentage,
        discount_amount: validatedData.discount_amount,
        total_amount: validatedData.total_amount,
        payment_method: validatedData.payment_method,
        payment_status: validatedData.payment_status,
        due_date: validatedData.due_date,
        installments: validatedData.installments,
        notes: validatedData.notes,
        health_insurance_info: validatedData.health_insurance_info,
        created_by: currentUser.id,
        updated_by: currentUser.id
      })
      .select(`
        id,
        patient_id,
        procedure_id,
        service_date,
        total_amount,
        payment_status,
        due_date
      `)
      .single()

    if (createError) {
      console.error('Erro ao criar cobrança:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar cobrança' },
        { status: 500 }
      )
    }

    // 7. Create installment records if needed
    if (validatedData.installments && validatedData.installments > 1) {
      const installmentAmount = Math.round((validatedData.total_amount / validatedData.installments) * 100) / 100
      const installmentRecords = []

      for (let i = 1; i <= validatedData.installments; i++) {
        const dueDate = new Date(validatedData.due_date)
        dueDate.setMonth(dueDate.getMonth() + (i - 1))

        installmentRecords.push({
          org_id: currentUser.org_id,
          billing_id: newBilling.id,
          installment_number: i,
          amount: i === validatedData.installments
            ? validatedData.total_amount - (installmentAmount * (validatedData.installments - 1)) // Adjust last installment for rounding
            : installmentAmount,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'pending',
          created_by: currentUser.id
        })
      }

      const { error: installmentError } = await supabase
        .from('installments')
        .insert(installmentRecords)

      if (installmentError) {
        console.error('Erro ao criar parcelas:', installmentError)
        // Don't fail the main operation, but log the error
      }
    }

    // 8. Log audit event
    await logAuditEvent({
      table_name: 'billing',
      operation: 'CREATE',
      record_id: newBilling.id,
      user_id: currentUser.id,
      additional_data: {
        patient_id: validatedData.patient_id,
        patient_name: patient.name,
        procedure_name: procedure.name,
        total_amount: validatedData.total_amount,
        payment_method: validatedData.payment_method
      }
    })

    // 9. Return response
    return NextResponse.json({
      success: true,
      data: {
        id: newBilling.id,
        patient_id: newBilling.patient_id,
        procedure_id: newBilling.procedure_id,
        total_amount: newBilling.total_amount,
        payment_status: newBilling.payment_status,
        due_date: newBilling.due_date
      },
      message: 'Cobrança criada com sucesso'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro inesperado ao criar cobrança:', error)

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
 * PUT /api/billing/[id]/payment
 * Register payment for billing record
 */
export async function PUT(request: NextRequest) {
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
    if (!hasPermission(currentUser.role, 'write', 'billing')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para registrar pagamentos' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validatedData = registerPaymentSchema.parse(body)

    // 4. Get billing record
    const { data: billing, error: billingError } = await supabase
      .from('billing')
      .select('id, total_amount, payment_status')
      .eq('id', validatedData.billing_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (billingError) {
      if (billingError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Cobrança não encontrada' },
          { status: 404 }
        )
      }

      console.error('Erro ao buscar cobrança:', billingError)
      return NextResponse.json(
        { error: 'Erro ao buscar cobrança' },
        { status: 500 }
      )
    }

    // 5. Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        org_id: currentUser.org_id,
        billing_id: validatedData.billing_id,
        amount_paid: validatedData.amount_paid,
        payment_method: validatedData.payment_method,
        payment_date: validatedData.payment_date,
        transaction_id: validatedData.transaction_id,
        notes: validatedData.notes,
        created_by: currentUser.id
      })
      .select('id, amount_paid')
      .single()

    if (paymentError) {
      console.error('Erro ao registrar pagamento:', paymentError)
      return NextResponse.json(
        { error: 'Erro ao registrar pagamento' },
        { status: 500 }
      )
    }

    // 6. Calculate total payments
    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount_paid')
      .eq('billing_id', validatedData.billing_id)

    const totalPaid = allPayments?.reduce((sum, p) => sum + p.amount_paid, 0) || 0

    // 7. Update billing payment status
    let newStatus = 'partially_paid'
    if (totalPaid >= billing.total_amount) {
      newStatus = 'paid'
    }

    const { error: updateError } = await supabase
      .from('billing')
      .update({
        payment_status: newStatus,
        updated_by: currentUser.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.billing_id)

    if (updateError) {
      console.error('Erro ao atualizar status da cobrança:', updateError)
    }

    // 8. Log audit event
    await logAuditEvent({
      table_name: 'payments',
      operation: 'CREATE',
      record_id: payment.id,
      user_id: currentUser.id,
      additional_data: {
        billing_id: validatedData.billing_id,
        amount_paid: validatedData.amount_paid,
        payment_method: validatedData.payment_method,
        new_status: newStatus
      }
    })

    // 9. Return response
    return NextResponse.json({
      success: true,
      data: {
        payment_id: payment.id,
        amount_paid: payment.amount_paid,
        total_paid: totalPaid,
        billing_status: newStatus
      },
      message: 'Pagamento registrado com sucesso'
    })

  } catch (error) {
    console.error('Erro inesperado ao registrar pagamento:', error)

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