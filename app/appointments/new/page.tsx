'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form'
import { Checkbox } from '@/src/components/ui/checkbox'
import { LoadingSpinner } from '@/src/components/ui/loading-spinner'
import { Calendar, Clock, User, ArrowLeft, Save, Plus } from 'lucide-react'
import { useToast } from '@/src/hooks/use-toast'
import logger from '../../../lib/logger';

const createAppointmentSchema = z.object({
  patient_id: z.string().min(1, 'Selecione um paciente'),
  practitioner_id: z.string().min(1, 'Selecione um profissional'),
  appointment_date: z.string().min(1, 'Data é obrigatória'),
  start_time: z.string().min(1, 'Horário é obrigatório'),
  duration_minutes: z.coerce.number().min(15, 'Mínimo 15 minutos').max(240, 'Máximo 4 horas'),
  appointment_type: z.enum(['consulta', 'retorno', 'avaliacao', 'fisioterapia', 'reavaliacao', 'emergencia']),
  notes: z.string().optional(),
  reminder_enabled: z.boolean().default(true),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recurrence_count: z.coerce.number().min(1).max(52).optional()
})

type CreateAppointmentForm = z.infer<typeof createAppointmentSchema>

interface Patient {
  id: string
  name: string
  phone?: string
}

interface Practitioner {
  id: string
  full_name: string
  role: string
}

const APPOINTMENT_TYPES = [
  { value: 'consulta', label: 'Consulta' },
  { value: 'retorno', label: 'Retorno' },
  { value: 'avaliacao', label: 'Avaliação' },
  { value: 'fisioterapia', label: 'Fisioterapia' },
  { value: 'reavaliacao', label: 'Reavaliação' },
  { value: 'emergencia', label: 'Emergência' }
]

const RECURRENCE_PATTERNS = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' }
]

export default function NewAppointmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [patients, setPatients] = useState<Patient[]>([])
  const [practitioners, setPractitioners] = useState<Practitioner[]>([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  // Get initial values from URL params
  const initialPatientId = searchParams.get('patient_id')
  const initialDate = searchParams.get('date')
  const initialTime = searchParams.get('time')

  const form = useForm<CreateAppointmentForm>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      patient_id: initialPatientId || '',
      practitioner_id: '',
      appointment_date: initialDate || '',
      start_time: initialTime || '',
      duration_minutes: 60,
      appointment_type: 'consulta',
      notes: '',
      reminder_enabled: true,
      is_recurring: false
    }
  })

  const isRecurring = form.watch('is_recurring')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [patientsRes, practitionersRes] = await Promise.all([
        fetch('/api/patients?limit=100'),
        fetch('/api/practitioners')
      ])

      const [patientsData, practitionersData] = await Promise.all([
        patientsRes.json(),
        practitionersRes.json()
      ])

      if (patientsData.success) {
        setPatients(patientsData.data)
      }

      if (practitionersData.success) {
        setPractitioners(practitionersData.data)
      }
    } catch (error) {
      logger.error('Error fetching data:', error)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar pacientes e profissionais',
        variant: 'destructive'
      })
    } finally {
      setDataLoading(false)
    }
  }

  const onSubmit = async (data: CreateAppointmentForm) => {
    setLoading(true)

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Agendamento criado',
          description: 'O agendamento foi criado com sucesso'
        })
        router.push(`/appointments/${result.data.id}`)
      } else {
        throw new Error(result.error || 'Erro ao criar agendamento')
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao criar agendamento',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading) {
    return (
      <div className="container mx-auto py-8">
        <LoadingSpinner size="lg" text="Carregando dados..." />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Novo Agendamento</h1>
          <p className="text-muted-foreground">
            Crie um novo agendamento de forma rápida
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Informações do Agendamento
          </CardTitle>
          <CardDescription>
            Preencha os dados para criar um novo agendamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Patient Selection */}
              <FormField
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Paciente
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um paciente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name}
                            {patient.phone && (
                              <span className="text-sm text-muted-foreground ml-2">
                                • {patient.phone}
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Practitioner Selection */}
              <FormField
                control={form.control}
                name="practitioner_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profissional</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um profissional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {practitioners.map((practitioner) => (
                          <SelectItem key={practitioner.id} value={practitioner.id}>
                            {practitioner.full_name}
                            <span className="text-sm text-muted-foreground ml-2">
                              • {practitioner.role}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="appointment_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Data
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Horário
                      </FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Duration and Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (minutos)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="15"
                          max="240"
                          step="15"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appointment_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Agendamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {APPOINTMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações adicionais sobre o agendamento..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Options */}
              <div className="space-y-4">
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
                        <FormLabel>
                          Enviar lembrete
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Enviar lembrete por e-mail/SMS antes do agendamento
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_recurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Agendamento recorrente
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Criar múltiplos agendamentos com base em um padrão
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Recurrence Options */}
              {isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                  <FormField
                    control={form.control}
                    name="recurrence_pattern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Padrão de Recorrência</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o padrão" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RECURRENCE_PATTERNS.map((pattern) => (
                              <SelectItem key={pattern.value} value={pattern.value}>
                                {pattern.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                            placeholder="Ex: 4"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" text="" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Criar Agendamento
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}