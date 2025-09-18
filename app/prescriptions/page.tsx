'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Calendar, User, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CreatePrescriptionModal } from '@/components/prescriptions/CreatePrescriptionModal'
import { PrescriptionDetailsModal } from '@/components/prescriptions/PrescriptionDetailsModal'
import { Skeleton } from '@/components/ui/skeleton'

interface Prescription {
  id: string
  patient_id: string
  session_id?: string
  name: string
  description?: string
  goals: string
  start_date: string
  expected_end_date?: string
  frequency_description: string
  general_instructions?: string
  precautions?: string
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  is_template: boolean
  created_at: string
  updated_at: string
  patient: {
    id: string
    name: string
    cpf: string
  }
  therapist: {
    id: string
    full_name: string
  }
  prescription_exercises: Array<{
    id: string
    exercise_id: string
    sets: number
    repetitions?: number
    frequency_per_week: number
    duration_weeks: number
    priority_order: number
    exercise: {
      id: string
      name: string
      category: string
      difficulty_level: string
    }
  }>
}

interface PrescriptionsResponse {
  success: boolean
  data: Prescription[]
  meta: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo', color: 'bg-green-100 text-green-800' },
  { value: 'paused', label: 'Pausado', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Concluído', color: 'bg-blue-100 text-blue-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
]

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [isTemplateFilter, setIsTemplateFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)

  const fetchPrescriptions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedStatus) params.append('status', selectedStatus)
      if (isTemplateFilter) params.append('is_template', isTemplateFilter)

      const response = await fetch(`/api/prescriptions?${params}`)
      const data: PrescriptionsResponse = await response.json()

      if (data.success) {
        setPrescriptions(data.data)
        setTotalPages(data.meta.total_pages)
      }
    } catch (error) {
      console.error('Erro ao buscar prescrições:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrescriptions()
  }, [currentPage, searchTerm, selectedStatus, isTemplateFilter])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedStatus('')
    setIsTemplateFilter('')
    setCurrentPage(1)
  }

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.label || status
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getDaysRemaining = (endDate: string) => {
    const today = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescrições de Exercícios</h1>
          <p className="text-muted-foreground">
            Gerencie prescrições e acompanhe o progresso dos pacientes
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Prescrição
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar prescrições..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={isTemplateFilter} onValueChange={setIsTemplateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Prescrições</SelectItem>
                <SelectItem value="true">Templates</SelectItem>
              </SelectContent>
            </Select>

            <div></div> {/* Spacer */}

            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <Card
                key={prescription.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedPrescription(prescription)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{prescription.name}</CardTitle>
                        {prescription.is_template && (
                          <Badge variant="secondary">Template</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {prescription.patient.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(prescription.start_date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {prescription.prescription_exercises.length} exercícios
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={getStatusColor(prescription.status)}
                      >
                        {getStatusLabel(prescription.status)}
                      </Badge>
                      {prescription.expected_end_date && prescription.status === 'active' && (
                        <Badge variant="outline">
                          {getDaysRemaining(prescription.expected_end_date) > 0
                            ? `${getDaysRemaining(prescription.expected_end_date)} dias restantes`
                            : 'Vencida'
                          }
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Description */}
                  {prescription.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {prescription.description}
                    </p>
                  )}

                  {/* Goals */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Objetivos:</p>
                    <p className="text-sm line-clamp-2">{prescription.goals}</p>
                  </div>

                  {/* Frequency */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Frequência:</p>
                    <p className="text-sm">{prescription.frequency_description}</p>
                  </div>

                  {/* Exercise Preview */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Exercícios:</p>
                    <div className="flex flex-wrap gap-1">
                      {prescription.prescription_exercises
                        .sort((a, b) => a.priority_order - b.priority_order)
                        .slice(0, 3)
                        .map((exercise) => (
                          <Badge key={exercise.id} variant="outline" className="text-xs">
                            {exercise.exercise.name}
                          </Badge>
                        ))}
                      {prescription.prescription_exercises.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{prescription.prescription_exercises.length - 3} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-3">
                  <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                    <span>Criado por {prescription.therapist.full_name}</span>
                    <span>Atualizado em {formatDate(prescription.updated_at)}</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}

          {/* Empty State */}
          {prescriptions.length === 0 && !loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma prescrição encontrada</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Não há prescrições que correspondam aos filtros selecionados.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Modals */}
      <CreatePrescriptionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => {
          setShowCreateModal(false)
          fetchPrescriptions()
        }}
      />

      {selectedPrescription && (
        <PrescriptionDetailsModal
          prescription={selectedPrescription}
          open={!!selectedPrescription}
          onOpenChange={(open) => !open && setSelectedPrescription(null)}
          onUpdate={fetchPrescriptions}
        />
      )}
    </div>
  )
}