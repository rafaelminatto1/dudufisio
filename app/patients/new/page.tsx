'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { CreatePatientDialog } from '@/src/components/patients/CreatePatientDialog'
import { useToast } from '@/src/hooks/use-toast'
import logger from '../../../lib/logger';

export default function NewPatientPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleCreatePatient = async (data: any) => {
    try {
      setLoading(true)

      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar paciente')
      }

      const result = await response.json()

      toast({
        title: 'Sucesso',
        description: result.message || 'Paciente criado com sucesso'
      })

      // Redirecionar para a página de detalhes do paciente
      router.push(`/patients/${result.data.id}`)

    } catch (error) {
      logger.error('Erro ao criar paciente:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar paciente',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Novo Paciente</h1>
          <p className="text-gray-600">
            Adicione um novo paciente ao sistema
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Informações do Paciente</CardTitle>
          <CardDescription>
            Preencha os dados do novo paciente. Os campos marcados com * são obrigatórios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreatePatientDialog
            open={true}
            onOpenChange={(open) => {
              if (!open && !loading) {
                router.back()
              }
            }}
            onSubmit={handleCreatePatient}
            embedded={true}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}