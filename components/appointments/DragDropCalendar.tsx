'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Clock, User, Stethoscope, Calendar, Move, Trash2, Edit } from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Appointment {
  id: string
  patient_id: string
  practitioner_id: string
  appointment_date: string
  start_time: string
  duration_minutes: number
  appointment_type: string
  status: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado' | 'falta'
  notes?: string
  patient: {
    id: string
    name: string
    phone: string
  }
  practitioner: {
    id: string
    full_name: string
  }
}

interface DragDropCalendarProps {
  appointments: Appointment[]
  onAppointmentMove: (appointmentId: string, newDate: string, newTime: string) => Promise<void>
  onAppointmentEdit: (appointmentId: string) => void
  onAppointmentDelete: (appointmentId: string) => void
  currentWeek: Date
  onWeekChange: (week: Date) => void
}

interface TimeSlot {
  time: string
  appointments: Appointment[]
}

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
]

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function DragDropCalendar({
  appointments,
  onAppointmentMove,
  onAppointmentEdit,
  onAppointmentDelete,
  currentWeek,
  onWeekChange
}: DragDropCalendarProps) {
  const { toast } = useToast()
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Segunda-feira
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(appointment => 
      isSameDay(parseISO(appointment.appointment_date), date)
    )
  }

  const getAppointmentsForTimeSlot = (date: Date, time: string) => {
    return getAppointmentsForDay(date).filter(appointment => 
      appointment.start_time.startsWith(time)
    )
  }

  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    setDraggedAppointment(appointment)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', appointment.id)
  }

  const handleDragOver = (e: React.DragEvent, timeSlot: string, date: Date) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverSlot(`${date.toISOString().split('T')[0]}-${timeSlot}`)
  }

  const handleDragLeave = () => {
    setDragOverSlot(null)
  }

  const handleDrop = async (e: React.DragEvent, timeSlot: string, date: Date) => {
    e.preventDefault()
    setDragOverSlot(null)

    if (!draggedAppointment) return

    const newDate = date.toISOString().split('T')[0]
    const newTime = `${timeSlot}:00`

    // Verificar se o horário já está ocupado
    const existingAppointments = getAppointmentsForTimeSlot(date, timeSlot)
    if (existingAppointments.length > 0) {
      toast({
        title: 'Horário ocupado',
        description: 'Já existe um agendamento neste horário',
        variant: 'destructive'
      })
      return
    }

    try {
      await onAppointmentMove(draggedAppointment.id, newDate, newTime)
      toast({
        title: 'Sucesso',
        description: 'Agendamento movido com sucesso'
      })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao mover agendamento',
        variant: 'destructive'
      })
    } finally {
      setDraggedAppointment(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': return 'default'
      case 'confirmado': return 'secondary'
      case 'em_andamento': return 'destructive'
      case 'concluido': return 'success'
      case 'cancelado': return 'outline'
      case 'falta': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'agendado': return 'Agendado'
      case 'confirmado': return 'Confirmado'
      case 'em_andamento': return 'Em Andamento'
      case 'concluido': return 'Concluído'
      case 'cancelado': return 'Cancelado'
      case 'falta': return 'Falta'
      default: return status
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = addDays(currentWeek, direction === 'next' ? 7 : -7)
    onWeekChange(newWeek)
  }

  return (
    <div className="space-y-4">
      {/* Header com navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigateWeek('prev')}>
            ← Semana anterior
          </Button>
          <h2 className="text-lg font-semibold">
            {format(weekStart, 'dd/MM/yyyy', { locale: ptBR })} - {format(weekEnd, 'dd/MM/yyyy', { locale: ptBR })}
          </h2>
          <Button variant="outline" onClick={() => navigateWeek('next')}>
            Próxima semana →
          </Button>
        </div>
        <Button onClick={() => onWeekChange(new Date())}>
          Hoje
        </Button>
      </div>

      {/* Calendário */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-8 bg-muted/50">
          <div className="p-2 text-sm font-medium text-center">Horário</div>
          {weekDays.map((day, index) => (
            <div key={index} className="p-2 text-sm font-medium text-center">
              <div>{DAYS_OF_WEEK[index]}</div>
              <div className="text-xs text-muted-foreground">
                {format(day, 'dd/MM', { locale: ptBR })}
              </div>
            </div>
          ))}
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          {TIME_SLOTS.map(timeSlot => (
            <div key={timeSlot} className="grid grid-cols-8 border-b">
              <div className="p-2 text-sm font-medium text-center bg-muted/20 border-r">
                {timeSlot}
              </div>
              {weekDays.map((day, dayIndex) => {
                const dayAppointments = getAppointmentsForTimeSlot(day, timeSlot)
                const slotKey = `${day.toISOString().split('T')[0]}-${timeSlot}`
                const isDragOver = dragOverSlot === slotKey

                return (
                  <div
                    key={dayIndex}
                    className={`p-1 min-h-[60px] border-r ${
                      isDragOver ? 'bg-primary/20 border-primary' : 'hover:bg-muted/20'
                    }`}
                    onDragOver={(e) => handleDragOver(e, timeSlot, day)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, timeSlot, day)}
                  >
                    {dayAppointments.map(appointment => (
                      <Card
                        key={appointment.id}
                        className={`mb-1 cursor-move ${
                          draggedAppointment?.id === appointment.id ? 'opacity-50' : ''
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, appointment)}
                      >
                        <CardContent className="p-2">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <Badge 
                                variant={getStatusColor(appointment.status)} 
                                className="text-xs"
                              >
                                {getStatusText(appointment.status)}
                              </Badge>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onAppointmentEdit(appointment.id)
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onAppointmentDelete(appointment.id)
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-xs font-medium truncate">
                              {appointment.patient.name}
                            </div>
                            
                            <div className="text-xs text-muted-foreground truncate">
                              {appointment.practitioner.full_name}
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                              {appointment.appointment_type} • {appointment.duration_minutes}min
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Badge variant="default">Agendado</Badge>
          <Badge variant="secondary">Confirmado</Badge>
          <Badge variant="destructive">Em Andamento</Badge>
          <Badge variant="success">Concluído</Badge>
          <Badge variant="outline">Cancelado</Badge>
        </div>
        <div className="text-muted-foreground">
          Arraste os agendamentos para mover entre horários
        </div>
      </div>
    </div>
  )
}
