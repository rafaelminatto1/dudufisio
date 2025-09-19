'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfWeek, endOfWeek, addDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DraggableCalendar } from '@/components/appointments/DraggableCalendar'
import { DragDropCalendar } from '@/components/appointments/DragDropCalendar'
import { WaitingListModal } from '@/components/appointments/WaitingListModal'
import AppointmentBookingModal from '@/components/appointments/AppointmentBookingModal'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import {
  Calendar,
  Clock,
  User,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  X,
  Eye,
  Edit,
  Calendar as CalendarIcon,
  List,
  TrendingUp,
  Users,
  CalendarDays,
  Clock as ClockIcon,
  Users as UsersIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Appointment, Patient, UserRole } from '@/lib/supabase/database.types'

type AppointmentView = 'calendar' | 'list'
type AppointmentStatus = 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado' | 'falta'

const appointmentStatusConfig = {
  agendado: { label: 'Agendado', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Calendar },
  confirmado: { label: 'Confirmado', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: PlayCircle },
  concluido: { label: 'Concluído', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: CheckCircle },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200', icon: X },
  falta: { label: 'Falta', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertCircle }
}

export default function AppointmentsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<AppointmentView>('calendar')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('fisioterapeuta')

  // Estados do modal de agendamento
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showWaitingListModal, setShowWaitingListModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string | undefined>()
  const [currentWeek, setCurrentWeek] = useState(new Date())

  // Estados de filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('today')

  // Função para carregar dados
  const loadData = async () => {
      try {
        setLoading(true)

        // Carregar pacientes
        const patientsResponse = await fetch('/api/patients?limit=100')
        if (patientsResponse.ok) {
          const patientsResult = await patientsResponse.json()
          setPatients(patientsResult.data || [])
        } else {
          console.error('Erro ao carregar pacientes')
        }

        // Carregar agendamentos
        const appointmentsResponse = await fetch('/api/appointments')
        if (appointmentsResponse.ok) {
          const appointmentsResult = await appointmentsResponse.json()
          setAppointments(appointmentsResult.data || [])
        } else {
          // Se a API não existir ainda, usar dados mock
          console.warn('API de agendamentos não implementada, usando dados simulados')

          const mockAppointments: Appointment[] = [
            {
              id: 'apt_1',
              org_id: 'org_123',
              patient_id: 'patient_1',
              therapist_id: 'user_123',
              appointment_date: format(new Date(), 'yyyy-MM-dd'),
              start_time: '09:00',
              end_time: '10:00',
              duration_minutes: 60,
              type: 'consulta',
              status: 'scheduled',
              notes: 'Primeira consulta - avaliação inicial',
              reminder_sent: false,
              created_at: '2024-09-15T08:00:00Z',
              updated_at: '2024-09-15T08:00:00Z',
              created_by: 'user_123',
              updated_by: 'user_123'
            },
            {
              id: 'apt_2',
              org_id: 'org_123',
              patient_id: 'patient_2',
              therapist_id: 'user_123',
              appointment_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
              start_time: '14:00',
              end_time: '15:00',
              duration_minutes: 60,
              type: 'sessao',
              status: 'confirmed',
              notes: 'Sessão de fisioterapia - fortalecimento',
              reminder_sent: true,
              created_at: '2024-09-15T08:00:00Z',
              updated_at: '2024-09-15T08:00:00Z',
              created_by: 'user_123',
              updated_by: 'user_123'
            }
          ]

          setAppointments(mockAppointments)
        }

        setCurrentUserRole('fisioterapeuta')

      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os agendamentos.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
  }

  // Carregar dados iniciais
  useEffect(() => {
    loadData()
  }, [toast])

  // Filtrar agendamentos
  const filteredAppointments = useMemo(() => {
    let filtered = appointments

    // Filtro por busca
    if (searchQuery) {
      filtered = filtered.filter(apt => {
        const patient = patients.find(p => p.id === apt.patient_id)
        return (
          patient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient?.cpf.includes(searchQuery) ||
          patient?.phone.includes(searchQuery) ||
          apt.notes?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter)
    }

    // Filtro por data
    const today = new Date()
    if (dateFilter === 'today') {
      filtered = filtered.filter(apt =>
        format(parseISO(apt.appointment_date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
      )
    } else if (dateFilter === 'week') {
      const startWeek = startOfWeek(today, { weekStartsOn: 0 })
      const endWeek = endOfWeek(today, { weekStartsOn: 0 })
      filtered = filtered.filter(apt => {
        const aptDate = parseISO(apt.appointment_date)
        return aptDate >= startWeek && aptDate <= endWeek
      })
    } else if (dateFilter === 'upcoming') {
      filtered = filtered.filter(apt =>
        parseISO(apt.appointment_date) >= today &&
        ['agendado', 'confirmado'].includes(apt.status)
      )
    }

    return filtered.sort((a, b) => {
      const dateA = parseISO(`${a.appointment_date}T${a.start_time}`)
      const dateB = parseISO(`${b.appointment_date}T${b.start_time}`)
      return dateA.getTime() - dateB.getTime()
    })
  }, [appointments, patients, searchQuery, statusFilter, dateFilter])

  // Estatísticas dos agendamentos
  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const todayAppointments = appointments.filter(apt => apt.appointment_date === today)

    return {
      total: appointments.length,
      today: todayAppointments.length,
      pending: appointments.filter(apt => apt.status === 'scheduled').length,
      confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
      completed: appointments.filter(apt => apt.status === 'completed').length,
    }
  }, [appointments])

  // Manipuladores de eventos
  const handleNewAppointment = (date?: Date, time?: string) => {
    setSelectedAppointment(undefined)
    setSelectedDate(date)
    setSelectedTime(time)
    setShowBookingModal(true)
  }

  const handleEditAppointment = (appointment: Appointment) => {
    // Navigate to appointment details page
    router.push(`/appointments/${appointment.id}`)
  }

  const handleSaveAppointment = async (appointmentData: any) => {
    // Simular salvamento
    console.log('Salvando agendamento:', appointmentData)

    if (selectedAppointment) {
      // Atualizar agendamento existente
      setAppointments(prev => prev.map(apt =>
        apt.id === selectedAppointment.id
          ? { ...apt, ...appointmentData, updated_at: new Date().toISOString() }
          : apt
      ))
    } else {
      // Criar novo agendamento
      const newAppointment: Appointment = {
        id: `apt_${Date.now()}`,
        org_id: 'org_123',
        practitioner_id: 'user_123',
        appointment_date: format(appointmentData.appointment_date, 'yyyy-MM-dd'),
        end_time: format(
          new Date(`${format(appointmentData.appointment_date, 'yyyy-MM-dd')}T${appointmentData.start_time}`).getTime() +
          appointmentData.duration_minutes * 60000,
          'HH:mm'
        ),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'user_123',
        updated_by: 'user_123',
        status: 'agendado',
        ...appointmentData
      }

      setAppointments(prev => [...prev, newAppointment])
    }
  }

  const handleAppointmentMove = async (appointmentId: string, newDate: string, newTime: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointment_date: newDate,
          start_time: newTime
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao mover agendamento')
      }

      // Atualizar lista local
      setAppointments(prev => prev.map(apt =>
        apt.id === appointmentId
          ? { ...apt, appointment_date: newDate, start_time: newTime, updated_at: new Date().toISOString() }
          : apt
      ))
    } catch (error: any) {
      throw error
    }
  }

  const handleAppointmentEdit = (appointmentId: string) => {
    router.push(`/appointments/${appointmentId}`)
  }

  const handleAppointmentDelete = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao cancelar agendamento')
      }

      // Atualizar lista local
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId))
      
      toast({
        title: 'Sucesso',
        description: 'Agendamento cancelado com sucesso'
      })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao cancelar agendamento',
        variant: 'destructive'
      })
    }
  }

  const handleScheduleFromWaitingList = (entryId: string) => {
    // Implementar lógica para agendar a partir da lista de espera
    console.log('Agendando a partir da lista de espera:', entryId)
    setShowWaitingListModal(false)
    setShowBookingModal(true)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Loading message="Carregando agendamentos..." />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-gray-600">Gerencie sua agenda e agendamentos de pacientes</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowWaitingListModal(true)} variant="outline">
            <ClockIcon className="h-4 w-4 mr-2" />
            Lista de Espera
          </Button>
          <Button onClick={() => router.push('/appointments/new')} data-testid="new-appointment-button">
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Hoje</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Agendados</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Confirmados</p>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Concluídos</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Filtre e busque agendamentos</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={view === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('calendar')}
                data-testid="calendar-view"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendário
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('list')}
              >
                <List className="h-4 w-4 mr-2" />
                Lista
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por paciente, CPF ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(appointmentStatusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="upcoming">Próximos</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || statusFilter !== 'all' || dateFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setDateFilter('all')
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo Principal */}
      {view === 'calendar' ? (
        <DragDropCalendar
          appointments={filteredAppointments}
          onAppointmentMove={handleAppointmentMove}
          onAppointmentEdit={handleAppointmentEdit}
          onAppointmentDelete={handleAppointmentDelete}
          currentWeek={currentWeek}
          onWeekChange={setCurrentWeek}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Agendamentos</CardTitle>
            <CardDescription>
              {filteredAppointments.length} agendamento{filteredAppointments.length !== 1 ? 's' : ''} encontrado{filteredAppointments.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Nenhum agendamento encontrado</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => handleNewAppointment()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Agendamento
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => {
                    const patient = patients.find(p => p.id === appointment.patient_id)
                    const statusConfig = appointmentStatusConfig[appointment.status as AppointmentStatus]

                    return (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="font-medium">{patient?.name}</p>
                              <p className="text-sm text-gray-500">{patient?.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(parseISO(appointment.appointment_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>{appointment.start_time}</span>
                            <span className="text-gray-500">({appointment.duration_minutes}min)</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {appointment.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>
                            <statusConfig.icon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAppointment(appointment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/appointments/${appointment.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Agendamento */}
      <AppointmentBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSave={handleSaveAppointment}
        patients={patients}
        existingAppointments={appointments}
        appointment={selectedAppointment}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        currentUserRole={currentUserRole}
      />

      {/* Modal de Lista de Espera */}
      <WaitingListModal
        isOpen={showWaitingListModal}
        onClose={() => setShowWaitingListModal(false)}
        onSchedule={handleScheduleFromWaitingList}
      />
    </div>
  )
}