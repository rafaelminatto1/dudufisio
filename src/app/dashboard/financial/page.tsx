import { Metadata } from 'next'
import { FinancialDashboard } from '@/components/financial/FinancialDashboard'

export const metadata: Metadata = {
  title: 'Gestão Financeira | FisioFlow',
  description: 'Sistema completo de gestão financeira para clínicas de fisioterapia',
}

export default function FinancialPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <FinancialDashboard />
    </div>
  )
}