'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Download, Users } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import logger from '../../../lib/logger';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { LoadingSpinner } from '@/src/components/ui/loading'
import { PatientCard } from './PatientCard'
import { CreatePatientDialog } from './CreatePatientDialog'
import { PatientFilters } from './PatientFilters'
import { usePatients } from '@/src/hooks/usePatients'
import { formatCPF, formatPhone } from '@/src/lib/utils/brazilian-formatting'
import type { Patient } from '@/src/lib/supabase/database.types'

export function PatientsListPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const {
    patients,
    loading,
    error,
    totalCount,
    fetchPatients,
    createPatient,
    updatePatient,
    deletePatient
  } = usePatients()

  useEffect(() => {
    fetchPatients({
      search: searchTerm,
      status: statusFilter === 'all' ? undefined : statusFilter,
    })
  }, [searchTerm, statusFilter, fetchPatients])

  const handleCreatePatient = async (patientData: any) => {
    try {
      await createPatient(patientData)
      setShowCreateDialog(false)
    } catch (error) {
      logger.error('Error creating patient:', error)
    }
  }

  const filteredPatients = patients?.filter(patient => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.cpf.includes(searchTerm.replace(/\D/g, '')) ||
      patient.phone.includes(searchTerm.replace(/\D/g, ''))

    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter

    return matchesSearch && matchesStatus
  }) || []

  const getStatusBadge = (status: Patient['status']) => {
    const statusConfig = {
      active: { label: 'Ativo', variant: 'default' as const },
      inactive: { label: 'Inativo', variant: 'secondary' as const },
      discharged: { label: 'Alta', variant: 'outline' as const }
    }

    const config = statusConfig[status] || statusConfig.active
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar pacientes</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => fetchPatients()}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">
            Gerencie os pacientes da clínica
            {totalCount !== undefined && ` • ${totalCount} pacientes`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Formato</DropdownMenuLabel>
              <DropdownMenuItem>Excel (.xlsx)</DropdownMenuItem>
              <DropdownMenuItem>CSV (.csv)</DropdownMenuItem>
              <DropdownMenuItem>PDF</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Relatório LGPD</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="discharged">Alta</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <Users className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filtros Avançados</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientFilters onFiltersChange={(filters) => {
              // Handle advanced filters
              logger.info('Advanced filters:', filters)
            }} />
          </CardContent>
        </Card>
      )}

      {/* Patients List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      ) : filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum paciente encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece adicionando seu primeiro paciente'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeiro Paciente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              viewMode={viewMode}
              onEdit={(patient) => {
                // Handle edit
                logger.info('Edit patient:', patient)
              }}
              onDelete={(patientId) => {
                // Handle delete
                deletePatient(patientId)
              }}
            />
          ))}
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