/**
 * API Endpoint - Practitioners Management - FisioFlow
 * GET /api/practitioners - List all practitioners for appointments
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, hasPermission } from '@/lib/auth/server'

/**
 * GET /api/practitioners
 * List all practitioners that can handle appointments
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // 1. Authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // 2. Check permissions
    if (!hasPermission(currentUser.role, 'read', 'appointments')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente' },
        { status: 403 }
      )
    }

    // 3. Get practitioners from org memberships
    const { data: practitioners, error } = await supabase
      .from('org_memberships')
      .select(`
        user_id,
        role,
        profiles!org_memberships_user_id_fkey(
          id,
          name,
          email,
          phone,
          crefito_number
        )
      `)
      .eq('org_id', currentUser.org_id)
      .eq('is_active', true)
      .in('role', ['admin', 'fisioterapeuta', 'estagiario'])

    if (error) {
      console.error('Error fetching practitioners:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar profissionais' },
        { status: 500 }
      )
    }

    // 4. Format response
    const formattedPractitioners = practitioners
      .filter(p => p.profiles)
      .map(p => ({
        id: p.profiles.id,
        full_name: p.profiles.name,
        email: p.profiles.email,
        phone: p.profiles.phone,
        crefito_number: p.profiles.crefito_number,
        role: p.role
      }))

    return NextResponse.json({
      success: true,
      data: formattedPractitioners
    })

  } catch (error) {
    console.error('Unexpected error fetching practitioners:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}