/**
 * Server-side Authentication Utilities - FisioFlow
 * Funções para autenticação e autorização no servidor
 */

import { createServerClient } from '@/src/lib/supabase/server'
import { type UserRole } from '@/src/lib/supabase/database.types'
import logger from '../../../lib/logger';

export interface CurrentUser {
  id: string
  email: string
  name?: string
  role: UserRole
  org_id: string
}

/**
 * Obter usuário atual autenticado
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createServerClient()

    // Obter sessão atual
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return null
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        org_id
      `)
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return null
    }

    // Retornar dados do perfil
    return {
      id: profile.id,
      email: profile.email,
      name: profile.full_name || undefined,
      role: (profile.role || 'paciente') as UserRole,
      org_id: profile.org_id || 'default-org-id',
    }
  } catch (error) {
    logger.error('Erro ao obter usuário atual:', error)
    return null
  }
}

/**
 * Verificar se o usuário tem uma permissão específica
 */
export function hasPermission(
  userRole: UserRole,
  action: string,
  resource: string
): boolean {
  const permissions = {
    admin: ['*:*'],
    fisioterapeuta: [
      'patients:read',
      'patients:write',
      'sessions:read',
      'sessions:write',
      'pain_points:read',
      'pain_points:write',
      'appointments:read',
      'appointments:write',
    ],
    estagiario: [
      'patients:read',
      'sessions:read',
      'pain_points:read',
      'appointments:read',
    ],
    paciente: [
      'own:read',
      'prescriptions:read',
      'appointments:read',
    ],
  }

  const userPermissions = permissions[userRole] || []

  // Verificar permissão de admin (acesso total)
  if (userPermissions.includes('*:*')) {
    return true
  }

  // Verificar permissão específica
  const requiredPermission = `${resource}:${action}`
  return userPermissions.includes(requiredPermission)
}

/**
 * Verificar se o usuário pode acessar um paciente específico
 */
export async function canAccessPatient(
  userId: string,
  patientId: string
): Promise<boolean> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase.rpc('can_access_patient', {
      target_patient_id: patientId,
    })

    if (error) {
      logger.error('Erro ao verificar acesso ao paciente:', error)
      return false
    }

    return data === true
  } catch (error) {
    logger.error('Erro ao verificar acesso ao paciente:', error)
    return false
  }
}

/**
 * Verificar se o usuário tem acesso a uma organização
 */
export async function hasOrgAccess(
  userId: string,
  orgId: string
): Promise<boolean> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase.rpc('user_has_org_access', {
      target_org_id: orgId,
    })

    if (error) {
      logger.error('Erro ao verificar acesso à organização:', error)
      return false
    }

    return data === true
  } catch (error) {
    logger.error('Erro ao verificar acesso à organização:', error)
    return false
  }
}

/**
 * Obter role do usuário em uma organização específica
 */
export async function getUserRoleInOrg(
  userId: string,
  orgId: string
): Promise<UserRole | null> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase.rpc('get_user_role_in_org', {
      target_org_id: orgId,
    })

    if (error) {
      logger.error('Erro ao obter role do usuário:', error)
      return null
    }

    return data as UserRole
  } catch (error) {
    logger.error('Erro ao obter role do usuário:', error)
    return null
  }
}