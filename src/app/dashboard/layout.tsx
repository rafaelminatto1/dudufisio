/**
 * Dashboard Layout - FisioFlow
 * Layout compartilhado para todas as páginas do dashboard
 * Inclui navegação, header e estrutura base
 */

import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verify user is authenticated
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?callbackUrl=/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<DashboardSkeleton />}>
        {children}
      </Suspense>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600">Carregando dashboard...</p>
      </div>
    </div>
  )
}
