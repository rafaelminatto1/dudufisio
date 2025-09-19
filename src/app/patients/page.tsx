import { Suspense } from 'react'
import { PatientsListPage } from '@/src/components/patients/PatientsListPage'
import { LoadingSpinner } from '@/src/components/ui/loading'

export default function PatientsPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingSpinner />}>
        <PatientsListPage />
      </Suspense>
    </div>
  )
}