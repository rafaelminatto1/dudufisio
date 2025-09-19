import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/lib/auth/server'
import { logAuditEvent } from '@/lib/audit/server'

const updateNotesSchema = z.object({
  notes: z.string().optional()
})

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await context.params
    const supabase = await createServerClient()

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!hasPermission(currentUser.role, 'write', 'appointments')) {
      await logAuditEvent({
        table_name: 'appointments',
        operation: 'UPDATE_DENIED',
        record_id: appointmentId,
        user_id: currentUser.id,
        additional_data: { reason: 'insufficient_permissions', attempted_role: currentUser.role }
      })
      return NextResponse.json({ error: 'Permissão insuficiente para atualizar notas do agendamento' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateNotesSchema.parse(body)

    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, org_id')
      .eq('id', appointmentId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
      }
      console.error('Erro ao buscar agendamento para atualização de notas:', fetchError)
      return NextResponse.json({ error: 'Erro ao buscar agendamento' }, { status: 500 })
    }

    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        notes: validatedData.notes,
        updated_by: currentUser.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select('id, notes')
      .single()

    if (updateError) {
      console.error('Erro ao atualizar notas do agendamento:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar notas do agendamento' }, { status: 500 })
    }

    await logAuditEvent({
      table_name: 'appointments',
      operation: 'UPDATE',
      record_id: appointmentId,
      user_id: currentUser.id,
      additional_data: { field: 'notes', new_value_length: validatedData.notes?.length || 0 }
    })

    return NextResponse.json({
      success: true,
      data: updatedAppointment,
      message: 'Notas do agendamento atualizadas com sucesso'
    })
  } catch (error) {
    console.error('Erro inesperado ao atualizar notas do agendamento:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
