/**
 * API Endpoint - User Profile - FisioFlow
 * GET /api/auth/profile
 *
 * Get current user profile information
 * Implements Brazilian healthcare compliance and RBAC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'
import { logAuditEvent } from '@/lib/audit/server'

/**
 * GET /api/auth/profile
 * Get current user profile information
 */
export async function GET(request: NextRequest) {
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

    // 2. Get detailed profile information
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        org_id,
        email,
        full_name,
        role,
        crefito_number,
        phone,
        avatar_url,
        is_active,
        last_login_at,
        created_at,
        updated_at,
        org:orgs!profiles_org_id_fkey(
          id,
          name,
          slug,
          cnpj,
          phone,
          email,
          address_line1,
          city,
          state,
          postal_code,
          timezone,
          status,
          subscription_type
        )
      `)
      .eq('id', currentUser.id)
      .single()

    if (error) {
      console.error('Erro ao buscar perfil:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar perfil do usuário' },
        { status: 500 }
      )
    }

    // 3. Get user permissions based on role
    const permissions = getUserPermissions(profile.role)

    // 4. Get organization memberships for multi-tenant access
    const { data: memberships, error: membershipsError } = await supabase
      .from('org_memberships')
      .select(`
        id,
        org_id,
        role,
        permissions,
        is_active,
        joined_at,
        org:orgs!org_memberships_org_id_fkey(
          id,
          name,
          slug,
          status
        )
      `)
      .eq('user_id', currentUser.id)
      .eq('is_active', true)

    if (membershipsError) {
      console.error('Erro ao buscar membros de organizações:', membershipsError)
    }

    // 5. Log profile access
    await logAuditEvent({
      table_name: 'profiles',
      operation: 'READ',
      record_id: currentUser.id,
      user_id: currentUser.id,
      additional_data: {
        profile_role: profile.role,
        org_id: profile.org_id
      }
    })

    // 6. Return profile data
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          crefito_number: profile.crefito_number,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          is_active: profile.is_active,
          last_login_at: profile.last_login_at,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        },
        organization: profile.org ? {
          id: profile.org.id,
          name: profile.org.name,
          slug: profile.org.slug,
          cnpj: profile.org.cnpj,
          phone: profile.org.phone,
          email: profile.org.email,
          address: {
            line1: profile.org.address_line1,
            city: profile.org.city,
            state: profile.org.state,
            postal_code: profile.org.postal_code
          },
          timezone: profile.org.timezone,
          status: profile.org.status,
          subscription_type: profile.org.subscription_type
        } : null,
        permissions,
        memberships: memberships?.map(membership => ({
          id: membership.id,
          org_id: membership.org_id,
          role: membership.role,
          permissions: membership.permissions,
          is_active: membership.is_active,
          joined_at: membership.joined_at,
          org_name: membership.org?.name,
          org_slug: membership.org?.slug,
          org_status: membership.org?.status
        })) || []
      }
    })

  } catch (error) {
    console.error('Erro inesperado ao buscar perfil:', error)
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
    const updateData = {
      full_name: body.full_name,
      phone: body.phone,
      crefito_number: body.crefito_number,
      avatar_url: body.avatar_url,
      updated_at: new Date().toISOString()
    }

    // 3. Update profile
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', currentUser.id)
      .select(`
        id,
        email,
        full_name,
        role,
        crefito_number,
        phone,
        avatar_url,
        updated_at
      `)
      .single()

    if (error) {
      console.error('Erro ao atualizar perfil:', error)
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
    console.error('Erro inesperado ao atualizar perfil:', error)
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
