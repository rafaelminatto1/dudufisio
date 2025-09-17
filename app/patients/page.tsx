'use client'

import { useState } from 'react'
import { Plus, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreatePatientDialog } from '@/components/patients/CreatePatientDialog'

// Mock patient data for testing
const mockPatients = [
  {
    id: '1',
    name: 'João Silva',
    cpf: '123.456.789-01',
    email: 'joao@email.com',
    phone: '(11) 99999-1234',
    date_of_birth: '1980-05-15',
    status: 'active',
    last_session: '2025-09-15',
    total_sessions: 12
  },
  {
    id: '2',
    name: 'Maria Santos',
    cpf: '987.654.321-09',
    email: 'maria@email.com',
    phone: '(11) 88888-5678',
    date_of_birth: '1975-08-20',
    status: 'active',
    last_session: '2025-09-14',
    total_sessions: 8
  },
  {
    id: '3',
    name: 'Pedro Costa',
    cpf: '456.789.123-45',
    email: 'pedro@email.com',
    phone: '(11) 77777-9876',
    date_of_birth: '1990-12-10',
    status: 'inactive',
    last_session: '2025-08-30',
    total_sessions: 25
  }
]

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [patients] = useState(mockPatients)

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.cpf.includes(searchTerm) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreatePatient = async (data: any) => {
    console.log('Creating patient:', data)
    // In a real app, this would call the API
    setShowCreateDialog(false)
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
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Paciente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 novos este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patients.filter(p => p.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Em tratamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões Totais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patients.reduce((total, p) => total + p.total_sessions, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Todas as sessões
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar pacientes por nome, CPF ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Patients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => (
          <Card key={patient.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{patient.name}</CardTitle>
                  <CardDescription>{patient.cpf}</CardDescription>
                </div>
                <Badge
                  variant={patient.status === 'active' ? 'default' : 'secondary'}
                >
                  {patient.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Email:</span> {patient.email}
                </div>
                <div>
                  <span className="font-medium">Telefone:</span> {patient.phone}
                </div>
                <div>
                  <span className="font-medium">Última sessão:</span> {new Date(patient.last_session).toLocaleDateString('pt-BR')}
                </div>
                <div>
                  <span className="font-medium">Total de sessões:</span> {patient.total_sessions}
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Ver Detalhes
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Nova Sessão
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum paciente encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Tente ajustar sua busca.' : 'Comece criando um novo paciente.'}
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