/**
 * Auth Layout for FisioFlow
 * Layout for authentication pages (login, register, forgot-password)
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Autenticação | FisioFlow',
  description: 'Sistema de Gestão Fisioterapêutica - Acesso Profissional',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-layout">
      {children}
    </div>
  )
}