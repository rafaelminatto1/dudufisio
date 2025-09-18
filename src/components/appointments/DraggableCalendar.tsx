'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Phone, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { cn } from '@/lib/utils'

interface Appointment {
  id: string
  patient_id: string
  practitioner_id: string
  appointment_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  appointment_type: string
  status: string
  notes?: string
  patient: {
    id: string
    name: string
    phone?: string
  }
  practitioner: {
    id: string
    full_name: string
  }
}

interface Practitioner {
  id: string
  full_name: string
  role: string
}

interface DraggableCalendarProps {
  onAppointmentClick?: (appointment: Appointment) => void
  onTimeSlotClick?: (date: string, time: string, practitionerId: string) => void
  onAppointmentDrop?: (appointmentId: string, newDate: string, newTime: string, newPractitionerId: string) => void
}

const STATUS_COLORS = {
  agendado: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmado: 'bg-green-100 text-green-800 border-green-200',
  em_andamento: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  concluido: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
  falta: 'bg-orange-100 text-orange-800 border-orange-200'
}

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
]

export function DraggableCalendar({
  onAppointmentClick,
  onTimeSlotClick,
  onAppointmentDrop
}: DraggableCalendarProps) {
  const { toast } = useToast()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [practitioners, setPractitioners] = useState<Practitioner[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Generate week dates
  const getWeekDates = useCallback((date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Monday start
    startOfWeek.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek)
      currentDate.setDate(startOfWeek.getDate() + i)
      week.push(currentDate)
    }
    return week
  }, [])

  const weekDates = getWeekDates(currentWeek)

  useEffect(() => {
    fetchData()
  }, [currentWeek])

  const fetchData = async () => {
    setLoading(true)
    try {
      const startDate = weekDates[0].toISOString().split('T')[0]
      const endDate = weekDates[6].toISOString().split('T')[0]

      const [appointmentsRes, practitionersRes] = await Promise.all([
        fetch(`/api/appointments?start_date=${startDate}&end_date=${endDate}`),
        fetch('/api/practitioners')
      ])

      const [appointmentsData, practitionersData] = await Promise.all([
        appointmentsRes.json(),
        practitionersRes.json()
      ])

      if (appointmentsData.success) {
        setAppointments(appointmentsData.data)
      }

      if (practitionersData.success) {
        setPractitioners(practitionersData.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os agendamentos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const goToToday = () => {
    setCurrentWeek(new Date())
  }

  const getAppointmentsForSlot = (date: Date, time: string, practitionerId: string) => {
    const dateStr = date.toISOString().split('T')[0]
    return appointments.filter(apt =>
      apt.appointment_date === dateStr &&
      apt.start_time === time &&
      apt.practitioner_id === practitionerId
    )
  }

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result

    if (!destination) {
      return
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    // Parse destination info: "date-time-practitionerId"
    const [newDate, newTime, newPractitionerId] = destination.droppableId.split('-')

    if (onAppointmentDrop) {
      setUpdating(true)
      try {
        await onAppointmentDrop(draggableId, newDate, newTime, newPractitionerId)
        await fetchData() // Refresh data
        toast({
          title: 'Agendamento reagendado',
          description: 'O agendamento foi movido com sucesso'
        })
      } catch (error) {
        toast({
          title: 'Erro ao reagendar',
          description: 'Não foi possível mover o agendamento',
          variant: 'destructive'
        })
      } finally {
        setUpdating(false)
      }
    }
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPastTimeSlot = (date: Date, time: string) => {
    const now = new Date()
    const slotDateTime = new Date(`${date.toISOString().split('T')[0]}T${time}`)
    return slotDateTime < now
  }

  if (loading) {
    return <LoadingSpinner size="lg" text="Carregando calendário..." />
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Calendar className="h-5 w-5" />
              <CardTitle>
                Calendário de Agendamentos
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {weekDates[0].toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long'
            })} - {weekDates[6].toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })}
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="bg-white rounded-lg border">
          {/* Header Row */}
          <div className="grid grid-cols-8 border-b bg-gray-50">
            <div className="p-3 text-sm font-medium text-gray-600">
              Horário
            </div>
            {weekDates.map((date) => (
              <div key={date.toISOString()} className="p-3 text-center">
                <div className={cn(
                  "text-sm font-medium",
                  isToday(date) ? "text-blue-600" : "text-gray-900"
                )}>
                  {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                </div>
                <div className={cn(
                  "text-xs",
                  isToday(date) ? "text-blue-600 font-medium" : "text-gray-500"
                )}>
                  {date.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Practitioners Sections */}
          {practitioners.map((practitioner) => (
            <div key={practitioner.id} className="border-b last:border-b-0">
              {/* Practitioner Header */}
              <div className="grid grid-cols-8 bg-gray-25 border-b">
                <div className="col-span-8 p-2 bg-blue-50">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      {practitioner.full_name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {practitioner.role}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              {TIME_SLOTS.map((time) => (
                <div key={`${practitioner.id}-${time}`} className="grid grid-cols-8 border-b last:border-b-0">
                  <div className="p-2 text-sm text-gray-600 bg-gray-50 border-r flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {time}
                  </div>
                  {weekDates.map((date) => {
                    const dateStr = date.toISOString().split('T')[0]
                    const slotAppointments = getAppointmentsForSlot(date, time, practitioner.id)
                    const isPast = isPastTimeSlot(date, time)
                    const droppableId = `${dateStr}-${time}-${practitioner.id}`

                    return (
                      <Droppable key={droppableId} droppableId={droppableId}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              "p-1 min-h-[60px] border-r last:border-r-0 relative",
                              isPast ? "bg-gray-50" : "bg-white hover:bg-gray-50",
                              snapshot.isDraggingOver && "bg-blue-50 border-blue-200",
                              isToday(date) && "bg-blue-25"
                            )}
                            onClick={() => {
                              if (!isPast && slotAppointments.length === 0 && onTimeSlotClick) {
                                onTimeSlotClick(dateStr, time, practitioner.id)
                              }
                            }}
                          >
                            {slotAppointments.map((appointment, index) => (
                              <Draggable
                                key={appointment.id}
                                draggableId={appointment.id}
                                index={index}
                                isDragDisabled={isPast || updating}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={cn(
                                      "mb-1 p-1 rounded text-xs border cursor-pointer",
                                      STATUS_COLORS[appointment.status as keyof typeof STATUS_COLORS],
                                      snapshot.isDragging && "rotate-2 shadow-lg",
                                      isPast && "opacity-60"
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (onAppointmentClick) {
                                        onAppointmentClick(appointment)
                                      }
                                    }}
                                  >
                                    <div className="font-medium truncate">
                                      {appointment.patient.name}
                                    </div>
                                    <div className="text-xs opacity-75 truncate">
                                      {appointment.appointment_type}
                                    </div>
                                    {appointment.patient.phone && (
                                      <div className="flex items-center text-xs opacity-60">
                                        <Phone className="h-2 w-2 mr-1" />
                                        {appointment.patient.phone.slice(-4)}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}

                            {slotAppointments.length === 0 && !isPast && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <Plus className="h-4 w-4 text-gray-400" />
                              </div>
                            )}

                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Legend */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-blue-100 border-blue-200"></div>
              <span>Agendado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-green-100 border-green-200"></div>
              <span>Confirmado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-yellow-100 border-yellow-200"></div>
              <span>Em Andamento</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-gray-100 border-gray-200"></div>
              <span>Concluído</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-red-100 border-red-200"></div>
              <span>Cancelado</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Arraste os agendamentos para reagendar rapidamente ou clique em slots vazios para criar novos
          </p>
        </CardContent>
      </Card>
    </div>
  )
}