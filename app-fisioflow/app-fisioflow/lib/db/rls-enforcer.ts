/**
 * Row Level Security (RLS) Enforcer - FisioFlow
 * Implementa isolamento organizacional em todos os endpoints da API
 * Garante multi-tenancy seguro para dados de saúde brasileiros
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database, UserRole } from '@/lib/supabase/database.types'

/**
 * Interface para contexto de isolamento organizacional
 */
export interface OrgIsolationContext {
  userId: string
  userRole: UserRole
  orgId: string
  orgName: string
  permissions: string[]
}

/**
 * Interface para configuração de consulta RLS
 */
export interface RLSQueryConfig {
  table: string
  operation: 'select' | 'insert' | 'update' | 'delete'
  enforceOrgIsolation: boolean
  allowCrossOrgAccess?: boolean
  requiredRole?: UserRole[]
  additionalFilters?: Record<string, any>
}

/**
 * Classe para enforcement de RLS
 */
export class RLSEnforcer {
  private supabase: ReturnType<typeof createServerClient>
  private context: OrgIsolationContext

  constructor(context: OrgIsolationContext) {
    this.context = context
    this.supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            const cookieStore = await cookies()
            return cookieStore.get(name)?.value
          },
        },
      }
    )
  }

  /**
   * Valida acesso a uma operação baseada em RLS
   */
  async validateAccess(config: RLSQueryConfig): Promise<{
    allowed: boolean
    reason?: string
    additionalContext?: any
  }> {
    try {
      // Verificar papel necessário
      if (config.requiredRole && !config.requiredRole.includes(this.context.userRole)) {
        return {
          allowed: false,
          reason: `Papel '${this.context.userRole}' não tem permissão para operação '${config.operation}' na tabela '${config.table}'`
        }
      }

      // Verificar isolamento organizacional
      if (config.enforceOrgIsolation && !config.allowCrossOrgAccess) {
        const hasOrgAccess = await this.validateOrganizationAccess()
        if (!hasOrgAccess) {
          return {
            allowed: false,
            reason: 'Usuário não tem acesso à organização especificada'
          }
        }
      }

      // Verificações específicas por tabela
      const tableValidation = await this.validateTableSpecificAccess(config)
      if (!tableValidation.allowed) {
        return tableValidation
      }

      // Log de acesso para auditoria
      await this.logDataAccess(config)

      return { allowed: true }

    } catch (error) {
      console.error('Erro na validação de acesso RLS:', error)
      return {
        allowed: false,
        reason: 'Erro interno na validação de acesso'
      }
    }
  }

  /**
   * Constrói query com enforcement de RLS
   */
  buildRLSQuery(config: RLSQueryConfig) {
    let query = this.supabase.from(config.table)

    // Aplicar isolamento organizacional
    if (config.enforceOrgIsolation) {
      query = query.eq('org_id', this.context.orgId)
    }

    // Aplicar filtros adicionais
    if (config.additionalFilters) {
      Object.entries(config.additionalFilters).forEach(([column, value]) => {
        query = query.eq(column, value)
      })
    }

    // Aplicar filtros específicos por papel
    query = this.applyRoleBasedFilters(query, config)

    return query
  }

  /**
   * Aplica filtros baseados no papel do usuário
   */
  private applyRoleBasedFilters(query: any, config: RLSQueryConfig) {
    switch (this.context.userRole) {
      case 'paciente':
        // Pacientes só podem ver próprios dados
        query = this.applyPatientFilters(query, config.table)
        break

      case 'estagiario':
        // Estagiários têm acesso limitado
        query = this.applyInternFilters(query, config.table, config.operation)
        break

      case 'fisioterapeuta':
        // Fisioterapeutas têm acesso clínico completo
        query = this.applyTherapistFilters(query, config.table)
        break

      case 'admin':
        // Admins têm acesso total dentro da organização
        break
    }

    return query
  }

  /**
   * Filtros para pacientes (apenas próprios dados)
   */
  private applyPatientFilters(query: any, table: string) {
    switch (table) {
      case 'patients':
        // Pacientes só podem ver próprio registro
        return query.eq('cpf', this.getUserCPF())

      case 'appointments':
      case 'sessions':
      case 'pain_points':
      case 'body_assessments':
        // Acessar apenas através do próprio patient_id
        return query.eq('patient_id', this.getPatientId())

      default:
        return query
    }
  }

  /**
   * Filtros para estagiários (acesso supervisionado)
   */
  private applyInternFilters(query: any, table: string, operation: string) {
    // Estagiários só podem fazer leitura
    if (operation !== 'select') {
      throw new Error('Estagiários não podem modificar dados')
    }

    // Aplicar filtros de supervisão se necessário
    return query
  }

  /**
   * Filtros para fisioterapeutas
   */
  private applyTherapistFilters(query: any, table: string) {
    // Fisioterapeutas têm acesso a todos os pacientes da organização
    // mas podem ter restrições específicas
    return query
  }

  /**
   * Valida acesso organizacional
   */
  private async validateOrganizationAccess(): Promise<boolean> {
    try {
      const { data: membership, error } = await this.supabase
        .from('org_memberships')
        .select('status')
        .eq('user_id', this.context.userId)
        .eq('org_id', this.context.orgId)
        .eq('status', 'active')
        .single()

      return !error && !!membership
    } catch (error) {
      console.error('Erro na validação de acesso organizacional:', error)
      return false
    }
  }

  /**
   * Validações específicas por tabela
   */
  private async validateTableSpecificAccess(config: RLSQueryConfig): Promise<{
    allowed: boolean
    reason?: string
  }> {
    switch (config.table) {
      case 'patients':
        return await this.validatePatientAccess(config)

      case 'audit_logs':
        return await this.validateAuditLogAccess(config)

      case 'org_memberships':
        return await this.validateOrgMembershipAccess(config)

      default:
        return { allowed: true }
    }
  }

  /**
   * Validação de acesso a dados de pacientes
   */
  private async validatePatientAccess(config: RLSQueryConfig): Promise<{
    allowed: boolean
    reason?: string
  }> {
    // Verificar consentimento LGPD para acesso a dados de pacientes
    if (this.context.userRole === 'paciente') {
      const hasValidConsent = await this.checkLgpdConsent()
      if (!hasValidConsent) {
        return {
          allowed: false,
          reason: 'Consentimento LGPD expirado ou inexistente'
        }
      }
    }

    // Verificar se operação de escrita requer permissões especiais
    if (['insert', 'update', 'delete'].includes(config.operation)) {
      if (!['admin', 'fisioterapeuta'].includes(this.context.userRole)) {
        return {
          allowed: false,
          reason: 'Papel insuficiente para modificação de dados de pacientes'
        }
      }
    }

    return { allowed: true }
  }

  /**
   * Validação de acesso a logs de auditoria
   */
  private async validateAuditLogAccess(config: RLSQueryConfig): Promise<{
    allowed: boolean
    reason?: string
  }> {
    // Apenas admins podem acessar logs de auditoria
    if (this.context.userRole !== 'admin') {
      return {
        allowed: false,
        reason: 'Apenas administradores podem acessar logs de auditoria'
      }
    }

    // Apenas leitura permitida
    if (config.operation !== 'select') {
      return {
        allowed: false,
        reason: 'Modificação de logs de auditoria não permitida'
      }
    }

    return { allowed: true }
  }

  /**
   * Validação de acesso a memberships organizacionais
   */
  private async validateOrgMembershipAccess(config: RLSQueryConfig): Promise<{
    allowed: boolean
    reason?: string
  }> {
    // Apenas admins podem gerenciar memberships
    if (['insert', 'update', 'delete'].includes(config.operation)) {
      if (this.context.userRole !== 'admin') {
        return {
          allowed: false,
          reason: 'Apenas administradores podem gerenciar memberships'
        }
      }
    }

    return { allowed: true }
  }

  /**
   * Verificar consentimento LGPD
   */
  private async checkLgpdConsent(): Promise<boolean> {
    try {
      // Buscar dados de consentimento do paciente
      const { data: patient, error } = await this.supabase
        .from('patients')
        .select('consent_lgpd, consent_date')
        .eq('cpf', this.getUserCPF())
        .single()

      if (error || !patient) {
        return false
      }

      // Verificar se consentimento é válido (dentro de 2 anos)
      const consentDate = new Date(patient.consent_date)
      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

      return patient.consent_lgpd && consentDate > twoYearsAgo
    } catch (error) {
      console.error('Erro ao verificar consentimento LGPD:', error)
      return false
    }
  }

  /**
   * Log de acesso a dados para auditoria
   */
  private async logDataAccess(config: RLSQueryConfig): Promise<void> {
    try {
      await this.supabase
        .from('audit_logs')
        .insert({
          table_name: config.table,
          operation: config.operation,
          user_id: this.context.userId,
          org_id: this.context.orgId,
          additional_data: {
            user_role: this.context.userRole,
            access_type: 'rls_enforced',
            timestamp: new Date().toISOString(),
            enforce_org_isolation: config.enforceOrgIsolation
          }
        })
    } catch (error) {
      // Log de auditoria não deve impedir operação principal
      console.error('Erro ao registrar log de auditoria:', error)
    }
  }

  /**
   * Obter CPF do usuário atual
   */
  private getUserCPF(): string {
    // Esta implementação seria complementada com dados reais do contexto
    return ''
  }

  /**
   * Obter ID do paciente atual
   */
  private getPatientId(): string {
    // Esta implementação seria complementada com dados reais do contexto
    return ''
  }
}

/**
 * Factory function para criar enforcer RLS
 */
export async function createRLSEnforcer(
  userId: string,
  userRole: UserRole,
  orgId: string
): Promise<RLSEnforcer> {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies()
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  // Buscar informações da organização
  const { data: org, error } = await supabase
    .from('orgs')
    .select('name')
    .eq('id', orgId)
    .single()

  if (error || !org) {
    throw new Error('Organização não encontrada')
  }

  const context: OrgIsolationContext = {
    userId,
    userRole,
    orgId,
    orgName: org.name,
    permissions: [] // Seria preenchido com permissões específicas
  }

  return new RLSEnforcer(context)
}

/**
 * Middleware helper para enforcement de RLS em APIs
 */
export async function enforceRLSMiddleware(
  request: Request,
  context: OrgIsolationContext,
  config: RLSQueryConfig
): Promise<{
  allowed: boolean
  enforcer?: RLSEnforcer
  error?: string
}> {
  try {
    const enforcer = new RLSEnforcer(context)
    const validation = await enforcer.validateAccess(config)

    if (!validation.allowed) {
      return {
        allowed: false,
        error: validation.reason || 'Acesso negado'
      }
    }

    return {
      allowed: true,
      enforcer
    }
  } catch (error) {
    console.error('Erro no enforcement de RLS:', error)
    return {
      allowed: false,
      error: 'Erro interno na validação de acesso'
    }
  }
}

/**
 * Configurações padrão de RLS por tabela
 */
export const RLS_CONFIGS = {
  patients: {
    enforceOrgIsolation: true,
    requiredRole: ['admin', 'fisioterapeuta', 'estagiario', 'paciente'] as UserRole[]
  },
  appointments: {
    enforceOrgIsolation: true,
    requiredRole: ['admin', 'fisioterapeuta', 'estagiario', 'paciente'] as UserRole[]
  },
  sessions: {
    enforceOrgIsolation: true,
    requiredRole: ['admin', 'fisioterapeuta', 'estagiario', 'paciente'] as UserRole[]
  },
  pain_points: {
    enforceOrgIsolation: true,
    requiredRole: ['admin', 'fisioterapeuta', 'paciente'] as UserRole[]
  },
  audit_logs: {
    enforceOrgIsolation: true,
    requiredRole: ['admin'] as UserRole[]
  },
  org_memberships: {
    enforceOrgIsolation: true,
    requiredRole: ['admin', 'fisioterapeuta', 'estagiario'] as UserRole[]
  }
} as const

export default RLSEnforcer