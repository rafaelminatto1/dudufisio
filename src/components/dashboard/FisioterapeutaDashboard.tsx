'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { format, startOfDay, endOfDay, addDays, parseISO, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/src/components/ui/tabs'
import { Progress } from '@/src/components/ui/progress'
import {
  Calendar,
  Clock,
  User,
  Users,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  FileText,
  Phone,
  Mail,
  MapPin,
  Plus,
  Eye,
  Edit,
  ChevronRight,
  CalendarDays,
  Stethoscope,
  ClipboardList,
  Star,
  BarChart3
} from 'lucide-react'
import { cn } from '@/src/lib/utils'
import type { Appointment, Patient, Session, UserRole } from '@/src/lib/supabase/database.types'

interface FisioterapeutaDashboardProps {
  currentUser: {
    id: string
    name: string
    email: string
    role: UserRole
    avatar_url?: string
  }
  appointments: Appointment[]
  patients: Patient[]
  sessions: Session[]
  onNavigate: (path: string) => void
}

interface DashboardStats {
  todayAppointments: number
  weekAppointments: number
  totalPatients: number
  activePatients: number
  completedSessions: number
  pendingAppointments: number
  averageRating: number
  monthlyGrowth: number
}

interface TodaySchedule {
  current?: Appointment
  next?: Appointment
  upcoming: Appointment[]
  completed: Appointment[]
}

const appointmentStatusConfig = {
  agendado: { label: 'Agendado', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Calendar },
  confirmado: { label: 'Confirmado', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  concluido: { label: 'Concluído', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: CheckCircle },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle },
  falta: { label: 'Falta', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertCircle }
}

export default function FisioterapeutaDashboard({
  currentUser,
  appointments,
  patients,
  sessions,
  onNavigate
}: FisioterapeutaDashboardProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Calcular estatísticas do dashboard
  const stats = useMemo((): DashboardStats => {
    const today = new Date()
    const startWeek = startOfDay(addDays(today, -7))
    const endWeek = endOfDay(today)

    const todayAppointments = appointments.filter(apt =>
      isToday(parseISO(apt.appointment_date))
    ).length

    const weekAppointments = appointments.filter(apt => {
      const aptDate = parseISO(apt.appointment_date)
      return aptDate >= startWeek && aptDate <= endWeek
    }).length

    const activePatients = patients.filter(p => p.status === 'active').length

    const completedSessions = sessions.filter(s => s.status === 'completed').length

    const pendingAppointments = appointments.filter(apt =>
      ['agendado', 'confirmado'].includes(apt.status) &&
      parseISO(apt.appointment_date) >= today
    ).length

    // Simular outras métricas
    const averageRating = 4.8
    const monthlyGrowth = 12.5

    return {
      todayAppointments,
      weekAppointments,
      totalPatients: patients.length,
      activePatients,
      completedSessions,
      pendingAppointments,
      averageRating,
      monthlyGrowth
    }
  }, [appointments, patients, sessions])

  // Organizar agenda do dia
  const todaySchedule = useMemo((): TodaySchedule => {
    const now = new Date()
    const todayAppts = appointments
      .filter(apt => isToday(parseISO(apt.appointment_date)))
      .sort((a, b) => a.start_time.localeCompare(b.start_time))

    const currentTime = format(now, 'HH:mm')

    const current = todayAppts.find(apt =>
      apt.start_time <= currentTime && apt.end_time > currentTime
    )

    const upcoming = todayAppts.filter(apt =>
      apt.start_time > currentTime && apt.status !== 'cancelado'
    )

    const next = upcoming[0]

    const completed = todayAppts.filter(apt =>
      apt.status === 'concluido'
    )

    return {
      current,
      next,
      upcoming,
      completed
    }
  }, [appointments])

  // Próximos pacientes
  const upcomingPatients = useMemo(() => {
    const tomorrow = addDays(new Date(), 1)
    return appointments
      .filter(apt =>
        isTomorrow(parseISO(apt.appointment_date)) &&
        apt.status !== 'cancelado'
      )
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .slice(0, 5)
      .map(apt => {
        const patient = patients.find(p => p.id === apt.patient_id)
        return { appointment: apt, patient }
      })
  }, [appointments, patients])

  // Pacientes que precisam de atenção
  const patientsNeedingAttention = useMemo(() => {
    // Simular pacientes que precisam de atenção baseado em critérios
    return patients
      .filter(p => p.status === 'active')
      .slice(0, 3)
      .map(patient => {
        // Simular motivos de atenção
        const reasons = [
          'Sessão em atraso há 2 dias',
          'Não compareceu na última consulta',
          'Relatou aumento da dor',
          'Completou ciclo de tratamento',
          'Precisa de reavaliação'
        ]

        return {
          ...patient,
          reason: reasons[Math.floor(Math.random() * reasons.length)],
          priority: Math.random() > 0.5 ? 'high' : 'medium' as 'high' | 'medium' | 'low'
        }
      })
  }, [patients])

  const getPatientInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Boas-vindas */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Olá, {currentUser.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => onNavigate('/appointments/new')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser.avatar_url} />
            <AvatarFallback>{getPatientInitials(currentUser.name)}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hoje</p>
                <p className="text-3xl font-bold text-blue-600">{stats.todayAppointments}</p>
                <p className="text-xs text-gray-500">Consultas agendadas</p>
              </div>
              <CalendarDays className="h-12 w-12 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pacientes Ativos</p>
                <p className="text-3xl font-bold text-green-600">{stats.activePatients}</p>
                <p className="text-xs text-gray-500">de {stats.totalPatients} total</p>
              </div>
              <Users className="h-12 w-12 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sessões Completas</p>
                <p className="text-3xl font-bold text-purple-600">{stats.completedSessions}</p>
                <p className="text-xs text-gray-500">Este mês</p>
              </div>
              <Stethoscope className="h-12 w-12 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avaliação</p>
                <div className="flex items-center space-x-2">
                  <p className="text-3xl font-bold text-orange-600">{stats.averageRating}</p>
                  <Star className="h-6 w-6 text-yellow-500 fill-current" />
                </div>
                <p className="text-xs text-gray-500">Média dos pacientes</p>
              </div>
              <BarChart3 className="h-12 w-12 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agenda de Hoje */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span>Agenda de Hoje</span>
                  </CardTitle>
                  <CardDescription>
                    {stats.todayAppointments} consulta{stats.todayAppointments !== 1 ? 's' : ''} agendada{stats.todayAppointments !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('/appointments')}
                >
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Consulta Atual */}
              {todaySchedule.current && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-medium text-yellow-800">EM ANDAMENTO</p>
                        <p className="text-sm text-yellow-600">
                          {todaySchedule.current.start_time} - {todaySchedule.current.end_time}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Sessão
                    </Button>
                  </div>
                  {(() => {
                    const patient = patients.find(p => p.id === todaySchedule.current!.patient_id)
                    return patient ? (
                      <div className="mt-3 flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={patient.photo_url} />
                          <AvatarFallback className="text-xs">
                            {getPatientInitials(patient.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{patient.name}</p>
                          <p className="text-xs text-gray-600">{patient.phone}</p>
                        </div>
                      </div>
                    ) : null
                  })()}
                </div>
              )}

              {/* Próxima Consulta */}
              {todaySchedule.next && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-blue-800">PRÓXIMA</p>
                        <p className="text-sm text-blue-600">
                          {todaySchedule.next.start_time} - {todaySchedule.next.end_time}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      {(() => {
                        const now = new Date()
                        const nextTime = new Date(`${format(now, 'yyyy-MM-dd')}T${todaySchedule.next.start_time}`)
                        const diff = Math.ceil((nextTime.getTime() - now.getTime()) / (1000 * 60))
                        return `${diff}min`
                      })()}
                    </Badge>
                  </div>
                  {(() => {
                    const patient = patients.find(p => p.id === todaySchedule.next!.patient_id)
                    return patient ? (
                      <div className="mt-3 flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={patient.photo_url} />
                          <AvatarFallback className="text-xs">
                            {getPatientInitials(patient.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{patient.name}</p>
                          <p className="text-xs text-gray-600">{patient.phone}</p>
                        </div>
                      </div>
                    ) : null
                  })()}
                </div>
              )}

              {/* Lista de Consultas */}
              {todaySchedule.upcoming.length > 1 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Demais Consultas</h4>
                  {todaySchedule.upcoming.slice(1).map((appointment) => {
                    const patient = patients.find(p => p.id === appointment.patient_id)
                    const statusConfig = appointmentStatusConfig[appointment.status as keyof typeof appointmentStatusConfig]

                    return (
                      <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={patient?.photo_url} />
                            <AvatarFallback className="text-xs">
                              {patient ? getPatientInitials(patient.name) : '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{patient?.name}</p>
                            <p className="text-xs text-gray-600">
                              {appointment.start_time} • {appointment.appointment_type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={cn("text-xs", statusConfig.color)}>
                            {statusConfig.label}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {stats.todayAppointments === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma consulta agendada para hoje</p>
                  <Button
                    variant="outline"
                    className="mt-3"
                    onClick={() => onNavigate('/appointments/new')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agendar Consulta
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pacientes que Precisam de Atenção */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span>Requer Atenção</span>
              </CardTitle>
              <CardDescription>
                Pacientes que precisam de acompanhamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {patientsNeedingAttention.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={patient.photo_url} />
                        <AvatarFallback>{getPatientInitials(patient.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-gray-600">{patient.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={patient.priority === 'high' ? 'destructive' : 'secondary'}>
                        {patient.priority === 'high' ? 'Alta' : 'Média'}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Direita */}
        <div className="space-y-6">
          {/* Resumo Semanal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo Semanal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Consultas</span>
                  <span className="font-medium">{stats.weekAppointments}</span>
                </div>
                <Progress value={(stats.weekAppointments / 50) * 100} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sessões Completas</span>
                  <span className="font-medium">{stats.completedSessions}</span>
                </div>
                <Progress value={(stats.completedSessions / 40) * 100} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taxa de Comparecimento</span>
                  <span className="font-medium">94%</span>
                </div>
                <Progress value={94} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Próximos Pacientes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Amanhã</CardTitle>
              <CardDescription>
                {upcomingPatients.length} consulta{upcomingPatients.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingPatients.map(({ appointment, patient }) => (
                  <div key={appointment.id} className="flex items-center space-x-3">
                    <div className="w-12 text-center">
                      <p className="text-xs text-gray-500">
                        {appointment.start_time}
                      </p>
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={patient?.photo_url} />
                      <AvatarFallback className="text-xs">
                        {patient ? getPatientInitials(patient.name) : '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{patient?.name}</p>
                      <p className="text-xs text-gray-600">{appointment.appointment_type}</p>
                    </div>
                  </div>
                ))}

                {upcomingPatients.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <Calendar className="h-8 w-8 mx-auto mb-1 opacity-30" />
                    <p className="text-sm">Nenhuma consulta amanhã</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onNavigate('/patients/new')}
              >
                <User className="h-4 w-4 mr-2" />
                Novo Paciente
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onNavigate('/appointments')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Ver Agenda
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onNavigate('/patients')}
              >
                <Users className="h-4 w-4 mr-2" />
                Lista de Pacientes
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onNavigate('/reports')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Relatórios
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}