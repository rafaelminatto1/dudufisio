'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Users, Filter, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreatePatientDialog } from '@/components/patients/CreatePatientDialog'
import { useToast } from '@/hooks/use-toast'

interface Patient {
  id: string
  name: string
  cpf: string
  email?: string
  phone: string
  date_of_birth: string
  gender: 'masculino' | 'feminino' | 'outro'
  status: 'active' | 'inactive' | 'archived'
  photo_url?: string
  created_at: string
  updated_at: string
}

interface PatientsResponse {
  success: boolean
  data: Patient[]
  meta: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

export default function PatientsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0
  })

  // Carregar pacientes
  const loadPatients = async () => {
    try {
      setLoading(true)

      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort_by: 'name',
        sort_order: 'asc'
      })

      if (searchTerm) {
        searchParams.append('search', searchTerm)
      }

      if (statusFilter !== 'all') {
        searchParams.append('status', statusFilter)
      }

      if (genderFilter !== 'all') {
        searchParams.append('gender', genderFilter)
      }

      const response = await fetch(`/api/patients?${searchParams}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao carregar pacientes')
      }

      const data: PatientsResponse = await response.json()

      setPatients(data.data)
      setPagination({
        page: data.meta.page,
        limit: data.meta.limit,
        total: data.meta.total,
        total_pages: data.meta.total_pages
      })

    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao carregar pacientes',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [searchTerm, statusFilter, genderFilter, pagination.page])

  const handleCreatePatient = async (data: any) => {
    try {
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

      setShowCreateDialog(false)
      loadPatients() // Recarregar lista

    } catch (error) {
      console.error('Erro ao criar paciente:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar paciente',
        variant: 'destructive'
      })
    }
  }

  const handlePatientClick = (patientId: string) => {
    router.push(`/patients/${patientId}`)
  }

  const activePatients = patients.filter(p => p.status === 'active').length

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-600">
            Gerencie todos os pacientes da clínica
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">
              Todos os pacientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePatients}</div>
            <p className="text-xs text-muted-foreground">
              Em tratamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pagination.total > 0 ? Math.round((activePatients / pagination.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Pacientes ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar pacientes por nome, CPF ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="archived">Arquivados</SelectItem>
          </SelectContent>
        </Select>
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Gênero" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os gêneros</SelectItem>
            <SelectItem value="masculino">Masculino</SelectItem>
            <SelectItem value="feminino">Feminino</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Patients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((patient) => (
          <Card
            key={patient.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handlePatientClick(patient.id)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{patient.name}</CardTitle>
                  <CardDescription>{patient.cpf}</CardDescription>
                </div>
                <Badge
                  variant={patient.status === 'active' ? 'default' :
                           patient.status === 'inactive' ? 'secondary' : 'outline'}
                >
                  {patient.status === 'active' ? 'Ativo' :
                   patient.status === 'inactive' ? 'Inativo' : 'Arquivado'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {patient.email && (
                  <div>
                    <span className="font-medium">Email:</span> {patient.email}
                  </div>
                )}
                <div>
                  <span className="font-medium">Telefone:</span> {patient.phone}
                </div>
                <div>
                  <span className="font-medium">Gênero:</span> {
                    patient.gender === 'masculino' ? 'Masculino' :
                    patient.gender === 'feminino' ? 'Feminino' : 'Outro'
                  }
                </div>
                <div>
                  <span className="font-medium">Nascimento:</span> {new Date(patient.date_of_birth).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePatientClick(patient.id)
                  }}
                >
                  Ver Detalhes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    // TODO: Implementar nova sessão
                    toast({
                      title: 'Em desenvolvimento',
                      description: 'Funcionalidade de nova sessão será implementada em breve'
                    })
                  }}
                >
                  Nova Sessão
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando {(pagination.page - 1) * pagination.limit + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} pacientes
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {pagination.page} de {pagination.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.total_pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {patients.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum paciente encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' || genderFilter !== 'all'
              ? 'Tente ajustar os filtros de busca.'
              : 'Comece criando um novo paciente.'}
          </p>
        </div>
      )}

      {/* Create Patient Dialog */}
      <CreatePatientDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreatePatient}
      />
    </div>
  )
}