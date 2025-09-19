/**
 * API Endpoint - User Profile - FisioFlow
 * GET /api/auth/profile
 *
 * Get current user profile information
 * Implements Brazilian healthcare compliance and RBAC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/src/lib/supabase/server'
import { getCurrentUser } from '@/src/lib/auth/server'
import { logAuditEvent } from '@/src/lib/audit/server'
import logger from '../../../../lib/logger';

/**
 * GET /api/auth/profile
 * Get current user profile information
 */
export async function GET() {
  try {
    const supabase = await createServerClient()
    
    // 1. Get current user
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // 2. Get basic profile information (only fields that exist in current schema)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        created_at,
        updated_at
      `)
      .eq('id', currentUser.id)
      .single()

    if (error) {
      logger.error('Erro ao buscar perfil:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar perfil do usuário' },
        { status: 500 }
      )
    }

    // 3. Get user permissions based on role (fallback to default)
    const userRole = (profile as any).role || 'paciente'
    const permissions = getUserPermissions(userRole)

    // 4. Skip organization memberships for now to avoid TypeScript issues
    const memberships: any[] = []

    // 5. Log profile access
    await logAuditEvent({
      table_name: 'profiles',
      operation: 'READ',
      record_id: currentUser.id,
      user_id: currentUser.id,
      additional_data: {
        profile_role: userRole,
        org_id: (profile as any).org_id || null
      }
    })

    // 6. Return profile data
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          name: (profile as any).name || profile.email,
          role: userRole,
          crefito_number: (profile as any).crefito_number || null,
          phone: (profile as any).phone || null,
          avatar_url: (profile as any).avatar_url || null,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        },
        organization: null, // Will be implemented when org_id field is available
        permissions,
        memberships: memberships?.map(membership => ({
          id: membership.id,
          org_id: membership.org_id,
          role: membership.role,
          permissions: membership.permissions,
          is_active: membership.is_active,
          joined_at: membership.joined_at
        })) || []
      }
    })

  } catch (error) {
    logger.error('Erro inesperado ao buscar perfil:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/auth/profile
 * Update current user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // 1. Get current user
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await request.json()
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    // Only update fields that exist in the current schema
    if (body.name !== undefined) updateData.name = body.name
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.crefito_number !== undefined) updateData.crefito_number = body.crefito_number
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url

    // 3. Update profile
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', currentUser.id)
      .select(`
        id,
        email,
        updated_at
      `)
      .single()

    if (error) {
      logger.error('Erro ao atualizar perfil:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil' },
        { status: 500 }
      )
    }

    // 4. Log profile update
    await logAuditEvent({
      table_name: 'profiles',
      operation: 'UPDATE',
      record_id: currentUser.id,
      user_id: currentUser.id,
      additional_data: {
        updated_fields: Object.keys(updateData),
        old_values: body.old_values || {},
        new_values: updateData
      }
    })

    // 5. Return updated profile
    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Perfil atualizado com sucesso'
    })

  } catch (error) {
    logger.error('Erro inesperado ao atualizar perfil:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * Get user permissions based on role
 */
function getUserPermissions(role: string) {
  const permissions = {
    admin: {
      patients: ['read', 'write', 'delete'],
      appointments: ['read', 'write', 'delete'],
      sessions: ['read', 'write', 'delete'],
      pain_points: ['read', 'write', 'delete'],
      reports: ['read', 'write', 'delete'],
      users: ['read', 'write', 'delete'],
      settings: ['read', 'write', 'delete'],
      analytics: ['read', 'write']
    },
    fisioterapeuta: {
      patients: ['read', 'write', 'delete'],
      appointments: ['read', 'write', 'delete'],
      sessions: ['read', 'write', 'delete'],
      pain_points: ['read', 'write', 'delete'],
      reports: ['read', 'write'],
      users: ['read'],
      settings: ['read'],
      analytics: ['read']
    },
    estagiario: {
      patients: ['read', 'write'],
      appointments: ['read', 'write'],
      sessions: ['read', 'write'],
      pain_points: ['read', 'write'],
      reports: ['read'],
      users: ['read'],
      settings: ['read'],
      analytics: ['read']
    },
    paciente: {
      patients: ['read'],
      appointments: ['read'],
      sessions: ['read'],
      pain_points: ['read'],
      reports: ['read'],
      users: [],
      settings: [],
      analytics: []
    }
  }

  return permissions[role as keyof typeof permissions] || permissions.paciente
}
