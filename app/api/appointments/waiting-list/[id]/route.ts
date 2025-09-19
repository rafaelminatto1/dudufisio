import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/lib/auth/server'
import { logAuditEvent } from '@/lib/audit/server'

const updateWaitingListEntrySchema = z.object({
  status: z.enum(['waiting', 'contacted', 'scheduled', 'cancelled']).optional(),
  notes: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  preferred_date: z.string().optional(),
  preferred_time: z.string().optional()
})

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: entryId } = await context.params
    const supabase = await createServerClient()
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!hasPermission(currentUser.role, 'write', 'appointments')) {
      await logAuditEvent({
        table_name: 'appointment_waiting_list',
        operation: 'UPDATE_DENIED',
        record_id: entryId,
        user_id: currentUser.id,
        additional_data: { reason: 'insufficient_permissions', attempted_role: currentUser.role }
      })
      return NextResponse.json({ error: 'Permissão insuficiente para atualizar lista de espera' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateWaitingListEntrySchema.parse(body)

    // Verificar se a entrada existe
    const { data: existingEntry, error: fetchError } = await supabase
      .from('appointment_waiting_list')
      .select('id, org_id, status')
      .eq('id', entryId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Entrada não encontrada na lista de espera' }, { status: 404 })
      }
      console.error('Erro ao buscar entrada da lista de espera:', fetchError)
      return NextResponse.json({ error: 'Erro ao buscar entrada da lista de espera' }, { status: 500 })
    }

    const { data: updatedEntry, error: updateError } = await supabase
      .from('appointment_waiting_list')
      .update({
        ...validatedData,
        updated_by: currentUser.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .select('id, status, notes, priority, preferred_date, preferred_time')
      .single()

    if (updateError) {
      console.error('Erro ao atualizar entrada da lista de espera:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar entrada da lista de espera' }, { status: 500 })
    }

    await logAuditEvent({
      table_name: 'appointment_waiting_list',
      operation: 'UPDATE',
      record_id: entryId,
      user_id: currentUser.id,
      additional_data: { updated_fields: Object.keys(validatedData) }
    })

    return NextResponse.json({
      success: true,
      data: updatedEntry,
      message: 'Entrada da lista de espera atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro inesperado ao atualizar entrada da lista de espera:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: entryId } = await context.params
    const supabase = await createServerClient()
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!hasPermission(currentUser.role, 'write', 'appointments')) {
      await logAuditEvent({
        table_name: 'appointment_waiting_list',
        operation: 'DELETE_DENIED',
        record_id: entryId,
        user_id: currentUser.id,
        additional_data: { reason: 'insufficient_permissions', attempted_role: currentUser.role }
      })
      return NextResponse.json({ error: 'Permissão insuficiente para remover da lista de espera' }, { status: 403 })
    }

    // Verificar se a entrada existe
    const { data: existingEntry, error: fetchError } = await supabase
      .from('appointment_waiting_list')
      .select('id, org_id, patient_id, practitioner_id, appointment_type')
      .eq('id', entryId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Entrada não encontrada na lista de espera' }, { status: 404 })
      }
      console.error('Erro ao buscar entrada da lista de espera:', fetchError)
      return NextResponse.json({ error: 'Erro ao buscar entrada da lista de espera' }, { status: 500 })
    }

    const { error: deleteError } = await supabase
      .from('appointment_waiting_list')
      .delete()
      .eq('id', entryId)

    if (deleteError) {
      console.error('Erro ao remover entrada da lista de espera:', deleteError)
      return NextResponse.json({ error: 'Erro ao remover entrada da lista de espera' }, { status: 500 })
    }

    await logAuditEvent({
      table_name: 'appointment_waiting_list',
      operation: 'DELETE',
      record_id: entryId,
      user_id: currentUser.id,
      additional_data: {
        patient_id: existingEntry.patient_id,
        practitioner_id: existingEntry.practitioner_id,
        appointment_type: existingEntry.appointment_type
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Entrada removida da lista de espera com sucesso'
    })
  } catch (error) {
    console.error('Erro inesperado ao remover entrada da lista de espera:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
