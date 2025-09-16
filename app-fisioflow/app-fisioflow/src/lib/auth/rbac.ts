/**
 * Role-Based Access Control (RBAC) Utilities for FisioFlow
 * Handles permission management for Brazilian healthcare roles and LGPD compliance
 * Supports hierarchical permissions and fine-grained access control
 */

import type { UserRole } from '@/lib/supabase/database.types'
import type { AuthUser } from './types'

/**
 * Definição de recursos do sistema
 */
export enum Resource {
  // Gerenciamento de pacientes
  PATIENTS = 'patients',
  PATIENT_PERSONAL_DATA = 'patient_personal_data',
  PATIENT_MEDICAL_DATA = 'patient_medical_data',
  PATIENT_PHOTOS = 'patient_photos',
  PATIENT_DOCUMENTS = 'patient_documents',

  // Agendamentos e sessões
  APPOINTMENTS = 'appointments',
  SESSIONS = 'sessions',
  SESSION_NOTES = 'session_notes',

  // Mapeamento corporal e avaliações
  BODY_MAPPING = 'body_mapping',
  PAIN_ASSESSMENTS = 'pain_assessments',
  CLINICAL_ASSESSMENTS = 'clinical_assessments',

  // Exercícios e prescrições
  EXERCISES = 'exercises',
  EXERCISE_LIBRARY = 'exercise_library',
  PRESCRIPTIONS = 'prescriptions',

  // Relatórios e analytics
  REPORTS = 'reports',
  CLINICAL_REPORTS = 'clinical_reports',
  ANALYTICS = 'analytics',

  // Administração organizacional
  ORGANIZATION = 'organization',
  USER_MANAGEMENT = 'user_management',
  SETTINGS = 'settings',
  BILLING = 'billing',
  AUDIT_LOGS = 'audit_logs',

  // LGPD e compliance
  LGPD_EXPORTS = 'lgpd_exports',
  DATA_RETENTION = 'data_retention',
  CONSENT_MANAGEMENT = 'consent_management',
}

/**
 * Definição de ações possíveis
 */
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  MANAGE = 'manage',
  VIEW_ALL = 'view_all',
  APPROVE = 'approve',
  ARCHIVE = 'archive',
}

/**
 * Definição de permissões por papel
 */
const rolePermissions: Record<UserRole, Record<Resource, Action[]>> = {
  admin: {
    // Administradores têm acesso total
    [Resource.PATIENTS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.VIEW_ALL, Action.EXPORT],
    [Resource.PATIENT_PERSONAL_DATA]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.EXPORT],
    [Resource.PATIENT_MEDICAL_DATA]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.EXPORT],
    [Resource.PATIENT_PHOTOS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.EXPORT],
    [Resource.PATIENT_DOCUMENTS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.EXPORT],
    [Resource.APPOINTMENTS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.VIEW_ALL, Action.MANAGE],
    [Resource.SESSIONS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.VIEW_ALL],
    [Resource.SESSION_NOTES]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.BODY_MAPPING]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.VIEW_ALL],
    [Resource.PAIN_ASSESSMENTS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.VIEW_ALL],
    [Resource.CLINICAL_ASSESSMENTS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.APPROVE],
    [Resource.EXERCISES]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.EXERCISE_LIBRARY]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.PRESCRIPTIONS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.VIEW_ALL],
    [Resource.REPORTS]: [Action.CREATE, Action.READ, Action.EXPORT, Action.VIEW_ALL],
    [Resource.CLINICAL_REPORTS]: [Action.CREATE, Action.READ, Action.EXPORT, Action.APPROVE],
    [Resource.ANALYTICS]: [Action.READ, Action.VIEW_ALL, Action.EXPORT],
    [Resource.ORGANIZATION]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.USER_MANAGEMENT]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.SETTINGS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.BILLING]: [Action.CREATE, Action.READ, Action.UPDATE, Action.MANAGE],
    [Resource.AUDIT_LOGS]: [Action.READ, Action.VIEW_ALL, Action.EXPORT],
    [Resource.LGPD_EXPORTS]: [Action.CREATE, Action.READ, Action.MANAGE, Action.EXPORT],
    [Resource.DATA_RETENTION]: [Action.CREATE, Action.READ, Action.UPDATE, Action.MANAGE],
    [Resource.CONSENT_MANAGEMENT]: [Action.CREATE, Action.READ, Action.UPDATE, Action.MANAGE],
  },

  fisioterapeuta: {
    // Fisioterapeutas têm acesso clínico completo
    [Resource.PATIENTS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.VIEW_ALL],
    [Resource.PATIENT_PERSONAL_DATA]: [Action.CREATE, Action.READ, Action.UPDATE],
    [Resource.PATIENT_MEDICAL_DATA]: [Action.CREATE, Action.READ, Action.UPDATE],
    [Resource.PATIENT_PHOTOS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.PATIENT_DOCUMENTS]: [Action.CREATE, Action.READ, Action.UPDATE],
    [Resource.APPOINTMENTS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.VIEW_ALL],
    [Resource.SESSIONS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.VIEW_ALL],
    [Resource.SESSION_NOTES]: [Action.CREATE, Action.READ, Action.UPDATE],
    [Resource.BODY_MAPPING]: [Action.CREATE, Action.READ, Action.UPDATE, Action.VIEW_ALL],
    [Resource.PAIN_ASSESSMENTS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.VIEW_ALL],
    [Resource.CLINICAL_ASSESSMENTS]: [Action.CREATE, Action.READ, Action.UPDATE],
    [Resource.EXERCISES]: [Action.CREATE, Action.READ, Action.UPDATE],
    [Resource.EXERCISE_LIBRARY]: [Action.CREATE, Action.READ, Action.UPDATE],
    [Resource.PRESCRIPTIONS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.VIEW_ALL],
    [Resource.REPORTS]: [Action.CREATE, Action.READ, Action.EXPORT],
    [Resource.CLINICAL_REPORTS]: [Action.CREATE, Action.READ, Action.EXPORT],
    [Resource.ANALYTICS]: [Action.READ],
    [Resource.ORGANIZATION]: [Action.READ],
    [Resource.USER_MANAGEMENT]: [],
    [Resource.SETTINGS]: [Action.READ],
    [Resource.BILLING]: [],
    [Resource.AUDIT_LOGS]: [],
    [Resource.LGPD_EXPORTS]: [Action.CREATE, Action.READ],
    [Resource.DATA_RETENTION]: [],
    [Resource.CONSENT_MANAGEMENT]: [Action.READ, Action.UPDATE],
  },

  estagiario: {
    // Estagiários têm acesso limitado - principalmente leitura
    [Resource.PATIENTS]: [Action.READ],
    [Resource.PATIENT_PERSONAL_DATA]: [Action.READ],
    [Resource.PATIENT_MEDICAL_DATA]: [Action.READ],
    [Resource.PATIENT_PHOTOS]: [Action.READ],
    [Resource.PATIENT_DOCUMENTS]: [Action.READ],
    [Resource.APPOINTMENTS]: [Action.READ],
    [Resource.SESSIONS]: [Action.READ],
    [Resource.SESSION_NOTES]: [Action.READ],
    [Resource.BODY_MAPPING]: [Action.READ],
    [Resource.PAIN_ASSESSMENTS]: [Action.READ],
    [Resource.CLINICAL_ASSESSMENTS]: [Action.READ],
    [Resource.EXERCISES]: [Action.READ],
    [Resource.EXERCISE_LIBRARY]: [Action.READ],
    [Resource.PRESCRIPTIONS]: [Action.READ],
    [Resource.REPORTS]: [Action.READ],
    [Resource.CLINICAL_REPORTS]: [Action.READ],
    [Resource.ANALYTICS]: [],
    [Resource.ORGANIZATION]: [Action.READ],
    [Resource.USER_MANAGEMENT]: [],
    [Resource.SETTINGS]: [Action.READ],
    [Resource.BILLING]: [],
    [Resource.AUDIT_LOGS]: [],
    [Resource.LGPD_EXPORTS]: [],
    [Resource.DATA_RETENTION]: [],
    [Resource.CONSENT_MANAGEMENT]: [Action.READ],
  },

  paciente: {
    // Pacientes só podem acessar seus próprios dados
    [Resource.PATIENTS]: [Action.READ], // Apenas próprios dados
    [Resource.PATIENT_PERSONAL_DATA]: [Action.READ, Action.UPDATE], // Pode atualizar contato
    [Resource.PATIENT_MEDICAL_DATA]: [Action.READ],
    [Resource.PATIENT_PHOTOS]: [Action.READ],
    [Resource.PATIENT_DOCUMENTS]: [Action.READ],
    [Resource.APPOINTMENTS]: [Action.READ], // Apenas próprios agendamentos
    [Resource.SESSIONS]: [Action.READ], // Apenas próprias sessões
    [Resource.SESSION_NOTES]: [Action.READ],
    [Resource.BODY_MAPPING]: [Action.READ], // Próprio mapeamento
    [Resource.PAIN_ASSESSMENTS]: [Action.READ],
    [Resource.CLINICAL_ASSESSMENTS]: [Action.READ],
    [Resource.EXERCISES]: [Action.READ], // Exercícios prescritos
    [Resource.EXERCISE_LIBRARY]: [Action.READ],
    [Resource.PRESCRIPTIONS]: [Action.READ], // Próprias prescrições
    [Resource.REPORTS]: [Action.READ], // Próprios relatórios
    [Resource.CLINICAL_REPORTS]: [Action.READ],
    [Resource.ANALYTICS]: [],
    [Resource.ORGANIZATION]: [],
    [Resource.USER_MANAGEMENT]: [],
    [Resource.SETTINGS]: [Action.READ, Action.UPDATE], // Próprias configurações
    [Resource.BILLING]: [],
    [Resource.AUDIT_LOGS]: [],
    [Resource.LGPD_EXPORTS]: [Action.CREATE, Action.READ], // Próprios dados
    [Resource.DATA_RETENTION]: [],
    [Resource.CONSENT_MANAGEMENT]: [Action.READ, Action.UPDATE], // Próprio consentimento
  },
}

/**
 * Verificar se usuário tem permissão para ação em recurso
 */
export function hasPermission(
  user: AuthUser | null,
  resource: Resource,
  action: Action,
  context?: PermissionContext
): boolean {
  if (!user || !user.currentRole) {
    return false
  }

  const rolePerms = rolePermissions[user.currentRole]
  if (!rolePerms || !rolePerms[resource]) {
    return false
  }

  const allowedActions = rolePerms[resource]
  if (!allowedActions.includes(action)) {
    return false
  }

  // Verificações contextuais adicionais
  if (context) {
    return checkContextualPermissions(user, resource, action, context)
  }

  return true
}

/**
 * Interface para contexto de permissões
 */
interface PermissionContext {
  patientId?: string
  sessionId?: string
  appointmentId?: string
  orgId?: string
  ownerId?: string
}

/**
 * Verificar permissões contextuais (ex: paciente só pode ver próprios dados)
 */
function checkContextualPermissions(
  user: AuthUser,
  resource: Resource,
  action: Action,
  context: PermissionContext
): boolean {
  // Pacientes só podem acessar próprios dados
  if (user.currentRole === 'paciente') {
    // Verificar se está acessando próprios dados
    if (context.patientId && !isOwnPatientData(user, context.patientId)) {
      return false
    }

    if (context.ownerId && context.ownerId !== user.id) {
      return false
    }
  }

  // Verificar isolamento por organização
  if (context.orgId && context.orgId !== user.currentOrg?.id) {
    return false
  }

  return true
}

/**
 * Verificar se dados pertencem ao próprio paciente
 */
function isOwnPatientData(user: AuthUser, patientId: string): boolean {
  // Esta verificação seria feita via CPF matching na base de dados
  // Por enquanto, retornamos true - implementação completa requer consulta DB
  return true
}

/**
 * Obter todas as permissões de um papel
 */
export function getRolePermissions(role: UserRole): Record<Resource, Action[]> {
  return rolePermissions[role] || {}
}

/**
 * Verificar se papel pode executar qualquer ação em recurso
 */
export function canAccessResource(user: AuthUser | null, resource: Resource): boolean {
  if (!user || !user.currentRole) {
    return false
  }

  const rolePerms = rolePermissions[user.currentRole]
  if (!rolePerms || !rolePerms[resource]) {
    return false
  }

  return rolePerms[resource].length > 0
}

/**
 * Verificar múltiplas permissões de uma vez
 */
export function hasAnyPermission(
  user: AuthUser | null,
  permissions: Array<{ resource: Resource; action: Action; context?: PermissionContext }>
): boolean {
  return permissions.some(({ resource, action, context }) =>
    hasPermission(user, resource, action, context)
  )
}

/**
 * Verificar todas as permissões
 */
export function hasAllPermissions(
  user: AuthUser | null,
  permissions: Array<{ resource: Resource; action: Action; context?: PermissionContext }>
): boolean {
  return permissions.every(({ resource, action, context }) =>
    hasPermission(user, resource, action, context)
  )
}

/**
 * Utilitários de conveniência para verificações comuns
 */

// Gerenciamento de pacientes
export const canCreatePatients = (user: AuthUser | null) =>
  hasPermission(user, Resource.PATIENTS, Action.CREATE)

export const canViewAllPatients = (user: AuthUser | null) =>
  hasPermission(user, Resource.PATIENTS, Action.VIEW_ALL)

export const canUpdatePatient = (user: AuthUser | null, patientId?: string) =>
  hasPermission(user, Resource.PATIENTS, Action.UPDATE, { patientId })

export const canDeletePatients = (user: AuthUser | null) =>
  hasPermission(user, Resource.PATIENTS, Action.DELETE)

// Agendamentos
export const canCreateAppointments = (user: AuthUser | null) =>
  hasPermission(user, Resource.APPOINTMENTS, Action.CREATE)

export const canManageAppointments = (user: AuthUser | null) =>
  hasPermission(user, Resource.APPOINTMENTS, Action.MANAGE)

// Sessões clínicas
export const canCreateSessions = (user: AuthUser | null) =>
  hasPermission(user, Resource.SESSIONS, Action.CREATE)

export const canUpdateSessionNotes = (user: AuthUser | null) =>
  hasPermission(user, Resource.SESSION_NOTES, Action.UPDATE)

// Exercícios
export const canManageExercises = (user: AuthUser | null) =>
  hasPermission(user, Resource.EXERCISES, Action.MANAGE)

export const canCreatePrescriptions = (user: AuthUser | null) =>
  hasPermission(user, Resource.PRESCRIPTIONS, Action.CREATE)

// Relatórios
export const canExportReports = (user: AuthUser | null) =>
  hasPermission(user, Resource.REPORTS, Action.EXPORT)

export const canViewAnalytics = (user: AuthUser | null) =>
  hasPermission(user, Resource.ANALYTICS, Action.READ)

// Administração
export const canManageUsers = (user: AuthUser | null) =>
  hasPermission(user, Resource.USER_MANAGEMENT, Action.MANAGE)

export const canViewAuditLogs = (user: AuthUser | null) =>
  hasPermission(user, Resource.AUDIT_LOGS, Action.READ)

export const canManageOrganization = (user: AuthUser | null) =>
  hasPermission(user, Resource.ORGANIZATION, Action.MANAGE)

// LGPD e compliance
export const canExportPatientData = (user: AuthUser | null) =>
  hasPermission(user, Resource.LGPD_EXPORTS, Action.CREATE)

export const canManageConsent = (user: AuthUser | null) =>
  hasPermission(user, Resource.CONSENT_MANAGEMENT, Action.MANAGE)

/**
 * Hook para verificação de permissões em componentes
 */
export function usePermissions(user: AuthUser | null) {
  return {
    hasPermission: (resource: Resource, action: Action, context?: PermissionContext) =>
      hasPermission(user, resource, action, context),

    canAccessResource: (resource: Resource) =>
      canAccessResource(user, resource),

    hasAnyPermission: (permissions: Array<{ resource: Resource; action: Action; context?: PermissionContext }>) =>
      hasAnyPermission(user, permissions),

    hasAllPermissions: (permissions: Array<{ resource: Resource; action: Action; context?: PermissionContext }>) =>
      hasAllPermissions(user, permissions),

    // Utilitários específicos
    canCreatePatients: () => canCreatePatients(user),
    canViewAllPatients: () => canViewAllPatients(user),
    canManageAppointments: () => canManageAppointments(user),
    canCreateSessions: () => canCreateSessions(user),
    canManageExercises: () => canManageExercises(user),
    canExportReports: () => canExportReports(user),
    canViewAnalytics: () => canViewAnalytics(user),
    canManageUsers: () => canManageUsers(user),
    canViewAuditLogs: () => canViewAuditLogs(user),
    canManageOrganization: () => canManageOrganization(user),
    canExportPatientData: () => canExportPatientData(user),
    canManageConsent: () => canManageConsent(user),
  }
}

/**
 * Middleware de verificação de permissões para API routes
 */
export function requirePermissions(permissions: Array<{ resource: Resource; action: Action }>) {
  return async (user: AuthUser | null) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const hasRequiredPermissions = hasAllPermissions(user, permissions)
    if (!hasRequiredPermissions) {
      throw new Error('Permissões insuficientes para realizar esta ação')
    }

    return true
  }
}

/**
 * Filtrar dados baseado em permissões
 */
export function filterByPermissions<T>(
  user: AuthUser | null,
  data: T[],
  resource: Resource,
  action: Action = Action.READ
): T[] {
  if (!user) {
    return []
  }

  if (hasPermission(user, resource, Action.VIEW_ALL)) {
    return data
  }

  // Para pacientes, filtrar apenas próprios dados
  if (user.currentRole === 'paciente') {
    // Implementar lógica de filtro baseada no contexto
    // Por exemplo, filtrar por CPF ou user_id
    return data // Simplificado por enquanto
  }

  // Para outros papéis, verificar permissão básica
  if (hasPermission(user, resource, action)) {
    return data
  }

  return []
}

export default {
  hasPermission,
  getRolePermissions,
  canAccessResource,
  hasAnyPermission,
  hasAllPermissions,
  usePermissions,
  requirePermissions,
  filterByPermissions,
  Resource,
  Action,
}