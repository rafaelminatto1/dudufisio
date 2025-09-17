import { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'fisioterapeuta' | 'estagiario' | 'paciente'

export interface Permission {
  resource: string
  action: string
}

export interface RolePermissions {
  [key: string]: Permission[]
}

export const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    { resource: '*', action: '*' }, // Admin has access to everything
  ],
  fisioterapeuta: [
    // Patient management
    { resource: 'patients', action: 'read' },
    { resource: 'patients', action: 'write' },
    { resource: 'patients', action: 'create' },
    { resource: 'patients', action: 'update' },
    // Appointments
    { resource: 'appointments', action: 'read' },
    { resource: 'appointments', action: 'write' },
    { resource: 'appointments', action: 'create' },
    { resource: 'appointments', action: 'update' },
    { resource: 'appointments', action: 'cancel' },
    // Sessions and treatments
    { resource: 'sessions', action: 'read' },
    { resource: 'sessions', action: 'write' },
    { resource: 'sessions', action: 'create' },
    { resource: 'sessions', action: 'update' },
    // Exercise prescriptions
    { resource: 'prescriptions', action: 'read' },
    { resource: 'prescriptions', action: 'write' },
    { resource: 'prescriptions', action: 'create' },
    { resource: 'prescriptions', action: 'update' },
    // Exercise library
    { resource: 'exercises', action: 'read' },
    { resource: 'exercises', action: 'write' },
    { resource: 'exercises', action: 'create' },
    { resource: 'exercises', action: 'update' },
    // Reports and analytics
    { resource: 'reports', action: 'read' },
    { resource: 'reports', action: 'create' },
    // Dashboard access
    { resource: 'dashboard', action: 'read' },
    // Estagiario supervision
    { resource: 'estagiarios', action: 'read' },
    { resource: 'estagiarios', action: 'supervise' },
    { resource: 'evaluations', action: 'read' },
    { resource: 'evaluations', action: 'write' },
  ],
  estagiario: [
    // Limited patient access (only assigned patients)
    { resource: 'patients', action: 'read' },
    { resource: 'patients', action: 'update' }, // Can update patient info under supervision
    // Appointments (only for assigned patients)
    { resource: 'appointments', action: 'read' },
    { resource: 'appointments', action: 'create' }, // Under supervision
    { resource: 'appointments', action: 'update' }, // Under supervision
    // Sessions (under supervision)
    { resource: 'sessions', action: 'read' },
    { resource: 'sessions', action: 'write' }, // Under supervision
    { resource: 'sessions', action: 'create' }, // Under supervision
    // Exercise prescriptions (under supervision)
    { resource: 'prescriptions', action: 'read' },
    { resource: 'prescriptions', action: 'create' }, // Under supervision
    // Exercise library (read only)
    { resource: 'exercises', action: 'read' },
    // Learning modules
    { resource: 'learning', action: 'read' },
    { resource: 'learning', action: 'update' }, // Can update their own progress
    // Dashboard access
    { resource: 'dashboard', action: 'read' },
    // Evaluations (can see their own)
    { resource: 'evaluations', action: 'read' },
  ],
  paciente: [
    // Own data access only
    { resource: 'own', action: 'read' },
    { resource: 'own', action: 'update' }, // Can update their own basic info
    // Own appointments
    { resource: 'own:appointments', action: 'read' },
    { resource: 'own:appointments', action: 'create' }, // Can request appointments
    { resource: 'own:appointments', action: 'cancel' }, // Can cancel their own appointments
    // Own sessions
    { resource: 'own:sessions', action: 'read' },
    // Own prescriptions and exercises
    { resource: 'own:prescriptions', action: 'read' },
    { resource: 'own:exercises', action: 'read' },
    { resource: 'own:exercises', action: 'update' }, // Can mark exercises as completed
    // Dashboard access
    { resource: 'dashboard', action: 'read' },
    // Own documents
    { resource: 'own:documents', action: 'read' },
    { resource: 'own:documents', action: 'download' },
  ],
}

export const hasPermission = (
  userRole: UserRole | null,
  resource: string,
  action: string
): boolean => {
  if (!userRole) return false

  const rolePermissions = ROLE_PERMISSIONS[userRole]
  if (!rolePermissions) return false

  // Check for wildcard admin permissions
  if (rolePermissions.some(p => p.resource === '*' && p.action === '*')) {
    return true
  }

  // Check for specific permission
  return rolePermissions.some(p => {
    const resourceMatch = p.resource === resource || p.resource === '*'
    const actionMatch = p.action === action || p.action === '*'
    return resourceMatch && actionMatch
  })
}

export const hasAnyPermission = (
  userRole: UserRole | null,
  permissions: { resource: string; action: string }[]
): boolean => {
  return permissions.some(p => hasPermission(userRole, p.resource, p.action))
}

export const requirePermission = (
  userRole: UserRole | null,
  resource: string,
  action: string
): void => {
  if (!hasPermission(userRole, resource, action)) {
    throw new Error(`Insufficient permissions: ${userRole} cannot ${action} ${resource}`)
  }
}

export const canAccessPatient = (
  userRole: UserRole | null,
  userId: string,
  patientId: string,
  assignedPatients?: string[]
): boolean => {
  if (!userRole) return false

  // Admin and fisioterapeuta can access all patients
  if (userRole === 'admin' || userRole === 'fisioterapeuta') {
    return true
  }

  // Estagiario can only access assigned patients
  if (userRole === 'estagiario') {
    return assignedPatients ? assignedPatients.includes(patientId) : false
  }

  // Paciente can only access their own data
  if (userRole === 'paciente') {
    return userId === patientId
  }

  return false
}

export const canSuperviseUser = (
  supervisorRole: UserRole | null,
  targetRole: UserRole | null
): boolean => {
  if (!supervisorRole || !targetRole) return false

  // Admin can supervise everyone
  if (supervisorRole === 'admin') return true

  // Fisioterapeuta can supervise estagiarios
  if (supervisorRole === 'fisioterapeuta' && targetRole === 'estagiario') {
    return true
  }

  return false
}

export const getAccessibleResources = (userRole: UserRole | null): string[] => {
  if (!userRole) return []

  const rolePermissions = ROLE_PERMISSIONS[userRole]
  if (!rolePermissions) return []

  return [...new Set(rolePermissions.map(p => p.resource))]
}

export const getResourceActions = (
  userRole: UserRole | null,
  resource: string
): string[] => {
  if (!userRole) return []

  const rolePermissions = ROLE_PERMISSIONS[userRole]
  if (!rolePermissions) return []

  return rolePermissions
    .filter(p => p.resource === resource || p.resource === '*')
    .map(p => p.action)
}

// Navigation permissions based on role
export const getNavigationItems = (userRole: UserRole | null) => {
  const baseItems = [
    { href: '/dashboard', label: 'Dashboard', resource: 'dashboard', action: 'read' }
  ]

  const conditionalItems = [
    // Patient management
    {
      href: '/patients',
      label: 'Pacientes',
      resource: 'patients',
      action: 'read',
      roles: ['admin', 'fisioterapeuta', 'estagiario']
    },
    // Appointments
    {
      href: '/appointments',
      label: 'Consultas',
      resource: 'appointments',
      action: 'read',
      roles: ['admin', 'fisioterapeuta', 'estagiario']
    },
    // Exercise library
    {
      href: '/exercises',
      label: 'Exercícios',
      resource: 'exercises',
      action: 'read',
      roles: ['admin', 'fisioterapeuta', 'estagiario']
    },
    // Reports (admin and fisioterapeuta only)
    {
      href: '/reports',
      label: 'Relatórios',
      resource: 'reports',
      action: 'read',
      roles: ['admin', 'fisioterapeuta']
    },
    // User management (admin only)
    {
      href: '/users',
      label: 'Usuários',
      resource: 'users',
      action: 'read',
      roles: ['admin']
    },
    // Settings
    {
      href: '/settings',
      label: 'Configurações',
      resource: 'settings',
      action: 'read',
      roles: ['admin', 'fisioterapeuta']
    },
    // Patient specific items
    {
      href: '/my-appointments',
      label: 'Minhas Consultas',
      resource: 'own:appointments',
      action: 'read',
      roles: ['paciente']
    },
    {
      href: '/my-exercises',
      label: 'Meus Exercícios',
      resource: 'own:exercises',
      action: 'read',
      roles: ['paciente']
    },
    {
      href: '/my-documents',
      label: 'Meus Documentos',
      resource: 'own:documents',
      action: 'read',
      roles: ['paciente']
    },
    // Learning (estagiario only)
    {
      href: '/learning',
      label: 'Aprendizado',
      resource: 'learning',
      action: 'read',
      roles: ['estagiario']
    }
  ]

  return [
    ...baseItems,
    ...conditionalItems.filter(item =>
      !item.roles || (userRole && item.roles.includes(userRole))
    )
  ].filter(item => hasPermission(userRole, item.resource, item.action))
}

// LGPD specific permissions
export const canExportPersonalData = (
  userRole: UserRole | null,
  userId: string,
  targetUserId: string
): boolean => {
  if (!userRole) return false

  // Users can export their own data
  if (userId === targetUserId) return true

  // Admin can export any data (for compliance requests)
  if (userRole === 'admin') return true

  // Healthcare providers can export their patients' data
  if (userRole === 'fisioterapeuta') return true

  return false
}

export const canDeletePersonalData = (
  userRole: UserRole | null,
  userId: string,
  targetUserId: string
): boolean => {
  if (!userRole) return false

  // Only admin can delete data (for LGPD compliance)
  if (userRole === 'admin') return true

  // Users can request deletion of their own data
  if (userRole === 'paciente' && userId === targetUserId) return true

  return false
}

export default {
  hasPermission,
  hasAnyPermission,
  requirePermission,
  canAccessPatient,
  canSuperviseUser,
  getAccessibleResources,
  getResourceActions,
  getNavigationItems,
  canExportPersonalData,
  canDeletePersonalData,
  ROLE_PERMISSIONS
}