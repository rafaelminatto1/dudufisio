/**
 * Sistema de Convites - FisioFlow
 * Gerencia convites para novos usuários com controle de papéis
 */

'use server'

import { createServerClient } from '@/lib/supabase/client'
import { getCurrentUser } from './auth'
import type { UserRole } from '@/lib/supabase/database.types'

export interface InviteUserData {
  email: string
  name: string
  role: UserRole
  permissions?: Record<string, boolean>
  message?: string
}

export interface PendingInvitation {
  id: string
  email: string
  name: string
  role: UserRole
  invited_by: string
  invited_by_name: string
  org_id: string
  org_name: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  expires_at: string
  created_at: string
  message?: string
}

/**
 * Convidar novo usuário para organização
 */
export async function inviteUser(data: InviteUserData) {
  const supabase = createServerClient()
  const currentUser = await getCurrentUser()

  if (!currentUser || !currentUser.currentOrg) {
    throw new Error('Usuário não autenticado ou sem organização')
  }

  // Verificar se o usuário atual tem permissão para convidar
  if (currentUser.currentRole !== 'admin' && currentUser.currentRole !== 'fisioterapeuta') {
    throw new Error('Você não tem permissão para convidar usuários')
  }

  try {
    // Verificar se o email já existe no sistema
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', data.email.toLowerCase())
      .single()

    if (existingUser) {
      // Verificar se já é membro da organização
      const { data: existingMembership } = await supabase
        .from('org_memberships')
        .select('*')
        .eq('user_id', existingUser.id)
        .eq('org_id', currentUser.currentOrg.id)
        .single()

      if (existingMembership) {
        throw new Error('Este usuário já faz parte da organização')
      }
    }

    // Verificar se já existe convite pendente
    const { data: existingInvite } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('email', data.email.toLowerCase())
      .eq('org_id', currentUser.currentOrg.id)
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      throw new Error('Já existe um convite pendente para este email')
    }

    // Criar convite
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expira em 7 dias

    const { data: invitation, error } = await supabase
      .from('user_invitations')
      .insert({
        email: data.email.toLowerCase(),
        name: data.name,
        role: data.role,
        invited_by: currentUser.id,
        org_id: currentUser.currentOrg.id,
        permissions: data.permissions || null,
        message: data.message || null,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar convite: ${error.message}`)
    }

    // Enviar email de convite via Supabase Auth
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      data.email.toLowerCase(),
      {
        data: {
          name: data.name,
          role: data.role,
          org_id: currentUser.currentOrg.id,
          org_name: currentUser.currentOrg.name,
          invited_by: currentUser.profile?.name || currentUser.email,
          invitation_id: invitation.id
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?invitation=${invitation.id}`
      }
    )

    if (inviteError) {
      // Se falhar o envio do email, marcar convite como erro mas não falhar
      await supabase
        .from('user_invitations')
        .update({ status: 'error', error_message: inviteError.message })
        .eq('id', invitation.id)

      console.error('Erro ao enviar email de convite:', inviteError)
    }

    // Log de auditoria
    await supabase.from('audit_log').insert({
      table_name: 'user_invitations',
      action: 'invite_sent',
      record_id: invitation.id,
      user_id: currentUser.id,
      new_values: {
        email: data.email,
        role: data.role,
        org_id: currentUser.currentOrg.id
      }
    })

    return {
      success: true,
      invitation: invitation
    }

  } catch (error: any) {
    console.error('Erro no sistema de convites:', error)
    return {
      success: false,
      error: error.message || 'Erro interno do servidor'
    }
  }
}

/**
 * Listar convites pendentes da organização
 */
export async function getPendingInvitations(): Promise<PendingInvitation[]> {
  const supabase = createServerClient()
  const currentUser = await getCurrentUser()

  if (!currentUser || !currentUser.currentOrg) {
    return []
  }

  const { data: invitations, error } = await supabase
    .from('user_invitations')
    .select(`
      id,
      email,
      name,
      role,
      invited_by,
      org_id,
      status,
      expires_at,
      created_at,
      message,
      profiles!user_invitations_invited_by_fkey(name),
      orgs!user_invitations_org_id_fkey(name)
    `)
    .eq('org_id', currentUser.currentOrg.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar convites:', error)
    return []
  }

  return invitations.map(inv => ({
    id: inv.id,
    email: inv.email,
    name: inv.name,
    role: inv.role,
    invited_by: inv.invited_by,
    invited_by_name: (inv.profiles as any)?.name || 'Usuário desconhecido',
    org_id: inv.org_id,
    org_name: (inv.orgs as any)?.name || 'Organização',
    status: inv.status,
    expires_at: inv.expires_at,
    created_at: inv.created_at,
    message: inv.message
  }))
}

/**
 * Cancelar convite pendente
 */
export async function cancelInvitation(invitationId: string) {
  const supabase = createServerClient()
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error('Usuário não autenticado')
  }

  const { error } = await supabase
    .from('user_invitations')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: currentUser.id
    })
    .eq('id', invitationId)
    .eq('org_id', currentUser.currentOrg?.id)

  if (error) {
    throw new Error(`Erro ao cancelar convite: ${error.message}`)
  }

  // Log de auditoria
  await supabase.from('audit_log').insert({
    table_name: 'user_invitations',
    action: 'invite_cancelled',
    record_id: invitationId,
    user_id: currentUser.id
  })

  return { success: true }
}

/**
 * Reenviar convite
 */
export async function resendInvitation(invitationId: string) {
  const supabase = createServerClient()
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error('Usuário não autenticado')
  }

  // Buscar convite
  const { data: invitation, error } = await supabase
    .from('user_invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('org_id', currentUser.currentOrg?.id)
    .single()

  if (error || !invitation) {
    throw new Error('Convite não encontrado')
  }

  if (invitation.status !== 'pending') {
    throw new Error('Convite não está pendente')
  }

  // Estender data de expiração
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await supabase
    .from('user_invitations')
    .update({
      expires_at: expiresAt.toISOString(),
      resent_count: (invitation.resent_count || 0) + 1,
      last_resent_at: new Date().toISOString()
    })
    .eq('id', invitationId)

  // Reenviar email
  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    invitation.email,
    {
      data: {
        name: invitation.name,
        role: invitation.role,
        org_id: currentUser.currentOrg?.id,
        org_name: currentUser.currentOrg?.name,
        invited_by: currentUser.profile?.name || currentUser.email,
        invitation_id: invitation.id
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?invitation=${invitation.id}`
    }
  )

  if (inviteError) {
    throw new Error(`Erro ao reenviar convite: ${inviteError.message}`)
  }

  return { success: true }
}