'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO, addDays, startOfWeek, endOfWeek } from 'date-fns'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/src/components/ui/popover'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Plus,
  Filter,
  Eye,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  StopCircle
} from 'lucide-react'
import { cn } from '@/src/lib/utils'
import type { Appointment, Patient, UserRole } from '@/src/lib/supabase/database.types'

interface AppointmentCalendarProps {
  appointments: Appointment[]
  patients: Patient[]
  currentUserRole: UserRole
  onAppointmentClick?: (appointment: Appointment) => void
  onDateClick?: (date: Date) => void
  onNewAppointment?: () => void
  className?: string
}

type CalendarView = 'month' | 'week' | 'day'
type AppointmentStatus = 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado' | 'falta'

const appointmentStatusConfig = {
  agendado: { label: 'Agendado', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Calendar },
  confirmado: { label: 'Confirmado', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: PlayCircle },
  concluido: { label: 'Concluído', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: StopCircle },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200', icon: X },
  falta: { label: 'Falta', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertCircle }
}

const appointmentTypeConfig = {
  consulta: { label: 'Consulta', color: 'bg-blue-50 border-blue-200' },
  retorno: { label: 'Retorno', color: 'bg-green-50 border-green-200' },
  avaliacao: { label: 'Avaliação', color: 'bg-purple-50 border-purple-200' },
  fisioterapia: { label: 'Fisioterapia', color: 'bg-orange-50 border-orange-200' },
  reavaliacao: { label: 'Reavaliação', color: 'bg-pink-50 border-pink-200' }
}

export default function AppointmentCalendar({
  appointments,
  patients,
  currentUserRole,
  onAppointmentClick,
  onDateClick,
  onNewAppointment,
  className = ''
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [view, setView] = useState<CalendarView>('month')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Navegação do calendário
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1))
  }, [])

  // Filtrar agendamentos
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      if (statusFilter !== 'all' && appointment.status !== statusFilter) return false
      if (typeFilter !== 'all' && appointment.appointment_type !== typeFilter) return false
      return true
    })
  }, [appointments, statusFilter, typeFilter])

  // Obter agendamentos do dia
  const getAppointmentsForDate = useCallback((date: Date) => {
    return filteredAppointments.filter(appointment =>
      isSameDay(parseISO(appointment.appointment_date), date)
    ).sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [filteredAppointments])

  // Gerar dias do calendário mensal
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Gerar dias da semana
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 })
    const end = endOfWeek(currentDate, { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Renderizar célula do dia no calendário mensal
  const renderDayCell = (date: Date) => {
    const dayAppointments = getAppointmentsForDate(date)
    const isCurrentMonth = isSameMonth(date, currentDate)
    const isSelected = selectedDate && isSameDay(date, selectedDate)
    const isTodayDate = isToday(date)

    return (
      <div
        key={date.toISOString()}
        className={cn(
          'min-h-20 p-1 border border-gray-100 cursor-pointer transition-colors',
          {
            'bg-gray-50 text-gray-400': !isCurrentMonth,
            'bg-blue-50 ring-2 ring-blue-500': isSelected,
            'bg-yellow-50 ring-1 ring-yellow-300': isTodayDate && !isSelected,
            'hover:bg-gray-50': isCurrentMonth && !isSelected
          }
        )}
        onClick={() => {
          setSelectedDate(date)
          onDateClick?.(date)
        }}
        data-testid={`calendar-day-${date.getDate()}`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            'text-sm font-medium',
            {
              'text-blue-600': isTodayDate,
              'font-bold': isTodayDate
            }
          )}>
            {date.getDate()}
          </span>
          {dayAppointments.length > 0 && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              {dayAppointments.length}
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          {dayAppointments.slice(0, 3).map((appointment) => {
            const patient = patients.find(p => p.id === appointment.patient_id)
            const statusConfig = appointmentStatusConfig[appointment.status as AppointmentStatus]

            return (
              <Popover key={appointment.id}>
                <PopoverTrigger asChild>
                  <div
                    className={cn(
                      'text-xs p-1 rounded border cursor-pointer hover:shadow-sm transition-all',
                      statusConfig.color
                    )}
                    data-testid={`appointment-${appointment.start_time}`}
                  >
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span className="truncate">
                        {appointment.start_time} - {patient?.name || 'Paciente'}
                      </span>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80" data-testid="appointment-popover">
                  <AppointmentPopover
                    appointment={appointment}
                    patient={patient}
                    onEdit={() => onAppointmentClick?.(appointment)}
                  />
                </PopoverContent>
              </Popover>
            )
          })}

          {dayAppointments.length > 3 && (
            <div className="text-xs text-gray-500 text-center">
              +{dayAppointments.length - 3} mais
            </div>
          )}
        </div>
      </div>
    )
  }

  // Renderizar vista semanal
  const renderWeekView = () => {
    const timeSlots = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 8 // 8h às 19h
      return `${hour.toString().padStart(2, '0')}:00`
    })

    return (
      <div className="grid grid-cols-8 gap-0 border">
        {/* Header com dias da semana */}
        <div className="bg-gray-50 p-4 border-r border-b font-medium">Horário</div>
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="bg-gray-50 p-4 border-r border-b text-center">
            <div className="font-medium">{format(day, 'EEE', { locale: ptBR })}</div>
            <div className={cn(
              'text-sm',
              { 'text-blue-600 font-bold': isToday(day) }
            )}>
              {format(day, 'dd/MM', { locale: ptBR })}
            </div>
          </div>
        ))}

        {/* Slots de tempo */}
        {timeSlots.map((time) => (
          <React.Fragment key={time}>
            <div className="bg-gray-50 p-2 border-r border-b text-sm text-center font-medium">
              {time}
            </div>
            {weekDays.map((day) => {
              const dayAppointments = getAppointmentsForDate(day).filter(apt =>
                apt.start_time === time
              )

              return (
                <div key={`${day.toISOString()}-${time}`} className="border-r border-b p-1 min-h-16">
                  {dayAppointments.map((appointment) => {
                    const patient = patients.find(p => p.id === appointment.patient_id)
                    const statusConfig = appointmentStatusConfig[appointment.status as AppointmentStatus]
                    const typeConfig = appointmentTypeConfig[appointment.appointment_type as keyof typeof appointmentTypeConfig]

                    return (
                      <div
                        key={appointment.id}
                        className={cn(
                          'p-2 rounded border cursor-pointer hover:shadow-sm transition-all text-xs',
                          statusConfig.color,
                          typeConfig?.color
                        )}
                        onClick={() => onAppointmentClick?.(appointment)}
                      >
                        <div className="font-medium truncate">{patient?.name}</div>
                        <div className="flex items-center space-x-1">
                          <statusConfig.icon className="h-3 w-3" />
                          <span>{typeConfig?.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    )
  }

  // Renderizar vista diária
  const renderDayView = () => {
    const selectedDay = selectedDate || new Date()
    const dayAppointments = getAppointmentsForDate(selectedDay)

    const timeSlots = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 8
      return `${hour.toString().padStart(2, '0')}:00`
    })

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {format(selectedDay, 'EEEE, dd MMMM yyyy', { locale: ptBR })}
          </h3>
          <p className="text-sm text-gray-600">
            {dayAppointments.length} agendamento{dayAppointments.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-2">
          {timeSlots.map((time) => {
            const timeAppointments = dayAppointments.filter(apt => apt.start_time === time)

            return (
              <div key={time} className="grid grid-cols-12 gap-4 min-h-16">
                <div className="col-span-2 text-center font-medium text-gray-600 pt-2">
                  {time}
                </div>
                <div className="col-span-10">
                  {timeAppointments.length === 0 ? (
                    <div
                      className="h-full border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-300 transition-colors"
                      onClick={() => {
                        // Abrir modal para novo agendamento neste horário
                        onNewAppointment?.()
                      }}
                    >
                      <Plus className="h-4 w-4 text-gray-400" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {timeAppointments.map((appointment) => {
                        const patient = patients.find(p => p.id === appointment.patient_id)
                        const statusConfig = appointmentStatusConfig[appointment.status as AppointmentStatus]
                        const typeConfig = appointmentTypeConfig[appointment.appointment_type as keyof typeof appointmentTypeConfig]

                        return (
                          <Card key={appointment.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <User className="h-5 w-5 text-blue-600" />
                                  <div>
                                    <p className="font-medium" data-testid="patient-name">
                                      {patient?.name}
                                    </p>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <span>{typeConfig?.label}</span>
                                      <span>•</span>
                                      <span>{appointment.duration_minutes} min</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge className={statusConfig.color}>
                                    <statusConfig.icon className="h-3 w-3 mr-1" />
                                    {statusConfig.label}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onAppointmentClick?.(appointment)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              {appointment.notes && (
                                <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <Card className={className} data-testid="appointment-calendar">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Agenda de Consultas</span>
            </CardTitle>
            <CardDescription>
              Gerencie seus agendamentos e visualize a agenda
            </CardDescription>
          </div>

          <div className="flex items-center space-x-2">
            {/* Filtros */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(appointmentStatusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(appointmentTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Seletor de vista */}
            <div className="flex items-center border rounded-md">
              {(['month', 'week', 'day'] as CalendarView[]).map((viewType) => (
                <Button
                  key={viewType}
                  variant={view === viewType ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView(viewType)}
                  className="rounded-none first:rounded-l-md last:rounded-r-md"
                >
                  {viewType === 'month' && 'Mês'}
                  {viewType === 'week' && 'Semana'}
                  {viewType === 'day' && 'Dia'}
                </Button>
              ))}
            </div>

            {/* Novo agendamento */}
            <Button onClick={onNewAppointment} data-testid="new-appointment-button">
              <Plus className="h-4 w-4 mr-2" />
              Novo
            </Button>
          </div>
        </div>

        {/* Navegação do calendário */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            data-testid="today-button"
          >
            Hoje
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {view === 'month' && (
          <div className="space-y-2">
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 gap-0">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="p-2 text-center font-medium text-gray-600 bg-gray-50">
                  {day}
                </div>
              ))}
            </div>

            {/* Dias do calendário */}
            <div className="grid grid-cols-7 gap-0 border">
              {calendarDays.map(renderDayCell)}
            </div>
          </div>
        )}

        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </CardContent>
    </Card>
  )
}

// Componente auxiliar para o popover de agendamento
function AppointmentPopover({
  appointment,
  patient,
  onEdit
}: {
  appointment: Appointment
  patient?: Patient
  onEdit: () => void
}) {
  const statusConfig = appointmentStatusConfig[appointment.status as AppointmentStatus]
  const typeConfig = appointmentTypeConfig[appointment.appointment_type as keyof typeof appointmentTypeConfig]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{patient?.name}</h4>
        <Badge className={statusConfig.color}>
          <statusConfig.icon className="h-3 w-3 mr-1" />
          {statusConfig.label}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span>{appointment.start_time} - {appointment.end_time}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>{typeConfig?.label} ({appointment.duration_minutes} min)</span>
        </div>
        {patient?.phone && (
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <span>{patient.phone}</span>
          </div>
        )}
      </div>

      {appointment.notes && (
        <div className="p-2 bg-gray-50 rounded text-sm">
          <p className="text-gray-700">{appointment.notes}</p>
        </div>
      )}

      <div className="flex space-x-2">
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Editar
        </Button>
        <Button size="sm" variant="outline">
          <Eye className="h-3 w-3 mr-1" />
          Ver Detalhes
        </Button>
      </div>
    </div>
  )
}