import { Metadata } from 'next'
import { ClinicalAnalyticsDashboard } from '@/src/components/analytics/ClinicalAnalyticsDashboard'

export const metadata: Metadata = {
  title: 'Analytics Clínicos | FisioFlow',
  description: 'Dashboard avançado com métricas e insights clínicos para otimização do atendimento fisioterapêutico.',
}

export default function AnalyticsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <ClinicalAnalyticsDashboard />
    </div>
  )
}