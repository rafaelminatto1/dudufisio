'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { format, addMinutes, parseISO, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  CalendarIcon,
  Clock,
  User,
  Search,
  AlertTriangle,
  CheckCircle,
  Repeat,
  X,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { Patient, Appointment, UserRole } from '@/lib/supabase/database.types'

// Schema de validação
const appointmentSchema = z.object({
  patient_id: z.string().min(1, 'Selecione um paciente'),
  appointment_date: z.date({
    required_error: 'Selecione uma data',
  }),
  start_time: z.string().min(1, 'Selecione um horário'),
  duration_minutes: z.number().min(15, 'Duração mínima de 15 minutos').max(240, 'Duração máxima de 4 horas'),
  appointment_type: z.enum(['consulta', 'retorno', 'avaliacao', 'fisioterapia', 'reavaliacao'], {
    required_error: 'Selecione o tipo de consulta',
  }),
  notes: z.string().optional(),
  reminder_enabled: z.boolean().default(true),
  recurring: z.boolean().default(false),
  recurrence_pattern: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recurrence_count: z.number().min(1).max(52).optional(),
  recurrence_days: z.array(z.number()).optional(),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface AppointmentBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (appointment: AppointmentFormData) => Promise<void>
  patients: Patient[]
  existingAppointments: Appointment[]
  appointment?: Appointment // Para edição
  selectedDate?: Date
  selectedTime?: string
  currentUserRole: UserRole
}

interface TimeSlot {
  time: string
  available: boolean
  conflict?: Appointment[]
}

interface ConflictInfo {
  hasConflict: boolean
  conflictingAppointments: Appointment[]
  suggestedTimes: string[]
}

const appointmentTypes = [
  { value: 'consulta', label: 'Consulta', duration: 60 },
  { value: 'retorno', label: 'Retorno', duration: 30 },
  { value: 'avaliacao', label: 'Avaliação', duration: 90 },
  { value: 'fisioterapia', label: 'Fisioterapia', duration: 60 },
  { value: 'reavaliacao', label: 'Reavaliação', duration: 60 },
]

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
]

const weekDays = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

export default function AppointmentBookingModal({
  isOpen,
  onClose,
  onSave,
  patients,
  existingAppointments,
  appointment,
  selectedDate,
  selectedTime,
  currentUserRole
}: AppointmentBookingModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchPatient, setSearchPatient] = useState('')
  const [patientSearchOpen, setPatientSearchOpen] = useState(false)
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo>({
    hasConflict: false,
    conflictingAppointments: [],
    suggestedTimes: []
  })

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: '',
      appointment_date: selectedDate || new Date(),
      start_time: selectedTime || '',
      duration_minutes: 60,
      appointment_type: 'consulta',
      notes: '',
      reminder_enabled: true,
      recurring: false,
    },
  })

  const watchedValues = form.watch(['appointment_date', 'start_time', 'duration_minutes', 'patient_id'])

  // Resetar formulário quando abrir/fechar
  useEffect(() => {
    if (isOpen) {
      if (appointment) {
        // Modo edição
        form.reset({
          patient_id: appointment.patient_id,
          appointment_date: parseISO(appointment.appointment_date),
          start_time: appointment.start_time,
          duration_minutes: appointment.duration_minutes,
          appointment_type: appointment.appointment_type as any,
          notes: appointment.notes || '',
          reminder_enabled: appointment.reminder_enabled || true,
          recurring: false, // Não suportar edição de recorrência por enquanto
        })
      } else {
        // Modo criação
        form.reset({
          patient_id: '',
          appointment_date: selectedDate || new Date(),
          start_time: selectedTime || '',
          duration_minutes: 60,
          appointment_type: 'consulta',
          notes: '',
          reminder_enabled: true,
          recurring: false,
        })
      }
    }
  }, [isOpen, appointment, selectedDate, selectedTime, form])

  // Filtrar pacientes para busca
  const filteredPatients = useMemo(() => {
    if (!searchPatient) return patients.slice(0, 20) // Limitar para performance

    return patients.filter(patient =>
      patient.name.toLowerCase().includes(searchPatient.toLowerCase()) ||
      patient.cpf.includes(searchPatient) ||
      patient.phone.includes(searchPatient)
    ).slice(0, 20)
  }, [patients, searchPatient])

  // Verificar conflitos quando mudar data/hora/duração/paciente
  useEffect(() => {
    const [date, time, duration, patientId] = watchedValues

    if (!date || !time || !duration) {
      setConflictInfo({ hasConflict: false, conflictingAppointments: [], suggestedTimes: [] })
      return
    }

    const startDateTime = setMinutes(setHours(date, parseInt(time.split(':')[0])), parseInt(time.split(':')[1]))
    const endDateTime = addMinutes(startDateTime, duration)

    // Buscar conflitos
    const conflicts = existingAppointments.filter(apt => {
      // Ignorar o próprio agendamento se estiver editando
      if (appointment && apt.id === appointment.id) return false

      // Verificar se é o mesmo dia
      if (!parseISO(apt.appointment_date).toDateString() === date.toDateString()) return false

      const aptStart = setMinutes(setHours(parseISO(apt.appointment_date), parseInt(apt.start_time.split(':')[0])), parseInt(apt.start_time.split(':')[1]))
      const aptEnd = addMinutes(aptStart, apt.duration_minutes)

      // Verificar sobreposição de horários
      return (startDateTime < aptEnd && endDateTime > aptStart)
    })

    // Gerar sugestões de horários alternativos
    const suggestedTimes = timeSlots.filter(slot => {
      const slotStart = setMinutes(setHours(date, parseInt(slot.split(':')[0])), parseInt(slot.split(':')[1]))
      const slotEnd = addMinutes(slotStart, duration)

      // Verificar se não há conflito neste horário
      const hasConflict = existingAppointments.some(apt => {
        if (appointment && apt.id === appointment.id) return false
        if (!parseISO(apt.appointment_date).toDateString() === date.toDateString()) return false

        const aptStart = setMinutes(setHours(parseISO(apt.appointment_date), parseInt(apt.start_time.split(':')[0])), parseInt(apt.start_time.split(':')[1]))
        const aptEnd = addMinutes(aptStart, apt.duration_minutes)

        return (slotStart < aptEnd && slotEnd > aptStart)
      })

      return !hasConflict && slot !== time
    }).slice(0, 3)

    setConflictInfo({
      hasConflict: conflicts.length > 0,
      conflictingAppointments: conflicts,
      suggestedTimes
    })
  }, [watchedValues, existingAppointments, appointment])

  // Gerar slots de tempo disponíveis
  const availableTimeSlots = useMemo(() => {
    const date = form.getValues('appointment_date')
    const duration = form.getValues('duration_minutes')

    if (!date || !duration) return []

    return timeSlots.map(time => {
      const startDateTime = setMinutes(setHours(date, parseInt(time.split(':')[0])), parseInt(time.split(':')[1]))
      const endDateTime = addMinutes(startDateTime, duration)

      // Verificar conflitos para este slot
      const conflicts = existingAppointments.filter(apt => {
        if (appointment && apt.id === appointment.id) return false
        if (!parseISO(apt.appointment_date).toDateString() === date.toDateString()) return false

        const aptStart = setMinutes(setHours(parseISO(apt.appointment_date), parseInt(apt.start_time.split(':')[0])), parseInt(apt.start_time.split(':')[1]))
        const aptEnd = addMinutes(aptStart, apt.duration_minutes)

        return (startDateTime < aptEnd && endDateTime > aptStart)
      })

      return {
        time,
        available: conflicts.length === 0,
        conflict: conflicts
      }
    })
  }, [form.watch('appointment_date'), form.watch('duration_minutes'), existingAppointments, appointment])

  const handleSubmit = async (data: AppointmentFormData) => {
    if (conflictInfo.hasConflict) {
      toast({
        title: 'Conflito de Horário',
        description: 'Resolva os conflitos antes de agendar',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      await onSave(data)
      toast({
        title: 'Sucesso',
        description: appointment ? 'Agendamento atualizado com sucesso' : 'Agendamento criado com sucesso',
      })
      onClose()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o agendamento',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedPatient = patients.find(p => p.id === form.watch('patient_id'))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="appointment-booking-modal">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
          <DialogDescription>
            {appointment ? 'Altere as informações do agendamento' : 'Preencha os dados para criar um novo agendamento'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="appointment-form">
            {/* Seleção de Paciente */}
            <FormField
              control={form.control}
              name="patient_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente *</FormLabel>
                  <FormControl>
                    <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={patientSearchOpen}
                          className="w-full justify-between"
                          data-testid="patient-search"
                        >
                          {selectedPatient ? (
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>{selectedPatient.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 text-gray-500">
                              <Search className="h-4 w-4" />
                              <span>Buscar paciente...</span>
                            </div>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Buscar por nome, CPF ou telefone..."
                            value={searchPatient}
                            onValueChange={setSearchPatient}
                          />
                          <CommandEmpty>Nenhum paciente encontrado</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-y-auto">
                            {filteredPatients.map((patient) => (
                              <CommandItem
                                key={patient.id}
                                value={patient.id}
                                onSelect={() => {
                                  field.onChange(patient.id)
                                  setPatientSearchOpen(false)
                                }}
                                data-testid={`patient-option-${patient.id}`}
                              >
                                <div className="flex flex-col space-y-1">
                                  <span className="font-medium">{patient.name}</span>
                                  <span className="text-sm text-gray-500">
                                    {patient.cpf} • {patient.phone}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  {selectedPatient && (
                    <div className="p-2 bg-blue-50 rounded border" data-testid="selected-patient">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{selectedPatient.name}</p>
                          <p className="text-sm text-gray-600">
                            {selectedPatient.phone} • {selectedPatient.email}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => field.onChange('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data do Agendamento */}
              <FormField
                control={form.control}
                name="appointment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            data-testid="appointment-date"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Horário */}
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange} data-testid="appointment-time">
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um horário" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTimeSlots.map((slot) => (
                            <SelectItem
                              key={slot.time}
                              value={slot.time}
                              disabled={!slot.available}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{slot.time}</span>
                                {!slot.available && (
                                  <Badge variant="destructive" className="ml-2">
                                    Ocupado
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de Consulta */}
              <FormField
                control={form.control}
                name="appointment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Consulta *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange} data-testid="appointment-type">
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {appointmentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center justify-between w-full">
                                <span>{type.label}</span>
                                <span className="text-sm text-gray-500 ml-2">
                                  {type.duration} min
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duração */}
              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (minutos) *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        data-testid="appointment-duration"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Duração" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutos</SelectItem>
                          <SelectItem value="45">45 minutos</SelectItem>
                          <SelectItem value="60">1 hora</SelectItem>
                          <SelectItem value="90">1h 30min</SelectItem>
                          <SelectItem value="120">2 horas</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Observações */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione observações sobre o agendamento..."
                      {...field}
                      data-testid="appointment-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conflitos de Horário */}
            {conflictInfo.hasConflict && (
              <Alert variant="destructive" data-testid="conflict-error">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Conflito de horário detectado!</p>
                    <div data-testid="conflict-details">
                      {conflictInfo.conflictingAppointments.map((apt) => {
                        const patient = patients.find(p => p.id === apt.patient_id)
                        return (
                          <p key={apt.id} className="text-sm">
                            {apt.start_time} - {patient?.name} ({apt.appointment_type})
                          </p>
                        )
                      })}
                    </div>
                    {conflictInfo.suggestedTimes.length > 0 && (
                      <div className="space-y-2" data-testid="suggested-times">
                        <p className="text-sm font-medium">Horários alternativos:</p>
                        <div className="flex space-x-2">
                          {conflictInfo.suggestedTimes.map((time) => (
                            <Button
                              key={time}
                              variant="outline"
                              size="sm"
                              onClick={() => form.setValue('start_time', time)}
                              data-testid={`suggestion-${time}`}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Opções Adicionais */}
            <div className="space-y-4">
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Opções Adicionais</h4>

                <FormField
                  control={form.control}
                  name="reminder_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Enviar lembrete por SMS/Email</FormLabel>
                        <FormDescription>
                          O paciente receberá um lembrete 24h antes da consulta
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {!appointment && (
                  <FormField
                    control={form.control}
                    name="recurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="recurring-appointment"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Agendamento recorrente</FormLabel>
                          <FormDescription>
                            Criar múltiplos agendamentos seguindo um padrão
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Configurações de Recorrência */}
              {form.watch('recurring') && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <h5 className="font-medium">Configurar Recorrência</h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="recurrence_pattern"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Padrão</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange} data-testid="recurrence-pattern">
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o padrão" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="weekly">Semanal</SelectItem>
                                <SelectItem value="monthly">Mensal</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recurrence_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="52"
                              placeholder="Ex: 8"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              data-testid="recurrence-count"
                            />
                          </FormControl>
                          <FormDescription>
                            Número de agendamentos a criar
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch('recurrence_pattern') === 'weekly' && (
                    <FormField
                      control={form.control}
                      name="recurrence_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dias da Semana</FormLabel>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {weekDays.map((day) => (
                              <div key={day.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`weekday-${day.value}`}
                                  checked={field.value?.includes(day.value)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || []
                                    if (checked) {
                                      field.onChange([...current, day.value])
                                    } else {
                                      field.onChange(current.filter(d => d !== day.value))
                                    }
                                  }}
                                  data-testid={`weekday-${day.label.toLowerCase().replace('-feira', '')}`}
                                />
                                <label
                                  htmlFor={`weekday-${day.value}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {day.label.replace('-feira', '')}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || conflictInfo.hasConflict}
                data-testid="save-appointment"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {appointment ? 'Atualizar' : 'Agendar'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}