/**
 * Dashboard Router - FisioFlow
 * Roteamento baseado em papéis para dashboards específicos
 * Redireciona usuários para o dashboard apropriado baseado no seu papel
 */

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/auth'
import { UserRole } from '@/lib/supabase/database.types'

export const dynamic = 'force-dynamic'

/**
 * Main dashboard page that acts as a router
 * Redirects users to their role-specific dashboard
 */
export default async function DashboardPage() {
  // Get current user and role
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?callbackUrl=/dashboard')
  }

  if (!user.currentRole) {
    redirect('/unauthorized?reason=no_role')
  }

  // Redirect based on user role
  switch (user.currentRole) {
    case 'admin':
      redirect('/dashboard/admin')

    case 'fisioterapeuta':
      redirect('/dashboard/fisioterapeuta')

    case 'estagiario':
      redirect('/dashboard/estagiario')

    case 'paciente':
      redirect('/dashboard/paciente')

    default:
      redirect('/unauthorized?reason=invalid_role')
  }
}

/**
 * Metadata for the dashboard router page
 */
export const metadata = {
  title: 'Dashboard - FisioFlow',
  description: 'Sistema de gestão para fisioterapia - Dashboard principal'
}
