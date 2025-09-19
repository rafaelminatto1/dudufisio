'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form'
import { LoadingSpinner } from '@/src/components/ui/loading-spinner'
import {
  Calendar,
  Clock,
  User,
  Zap,
  CheckCircle,
  AlertTriangle,
  Calendar as CalendarIcon,
  Settings,
  Star,
  ArrowRight,
  Phone,
  Mail
} from 'lucide-react'
import { useToast } from '@/src/hooks/use-toast'
import { cn } from '@/src/lib/utils'

const rescheduleSchema = z.object({
  preferred_dates: z.array(z.string()).min(1, 'Selecione pelo menos uma data'),
  preferred_times: z.array(z.string()).min(1, 'Selecione pelo menos um horário'),
  max_wait_days: z.coerce.number().min(1).max(30).default(7),
  same_practitioner: z.boolean().default(true),
  reason: z.string().optional(),
  notify_patient: z.boolean().default(true)
})

type RescheduleForm = z.infer<typeof rescheduleSchema>

interface Appointment {
  id: string
  patient_id: string
  practitioner_id: string
  appointment_date: string
  start_time: string
  duration_minutes: number
  appointment_type: string
  patient: {
    name: string
    phone?: string
    email?: string
  }
  practitioner: {
    name: string
  }
}

interface RescheduleResult {
  success: boolean
  data?: {
    appointment: any
    original_slot: { date: string; time: string }
    new_slot: { date: string; time: string; practitioner_name: string }
    alternatives: Array<{ date: string; time: string; practitioner_name: string; score: number }>
    notification_sent: boolean
  }
  error?: string
  suggestions?: Array<{ date: string; time: string; practitioner_name: string; score: number }>
}

interface SmartRescheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment | null
  onSuccess: () => void
}

const COMMON_TIMES = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
]

export function SmartRescheduleModal({
  open,
  onOpenChange,
  appointment,
  onSuccess
}: SmartRescheduleModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RescheduleResult | null>(null)
  const [step, setStep] = useState<'form' | 'result'>('form')

  const form = useForm<RescheduleForm>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      preferred_dates: [],
      preferred_times: [],
      max_wait_days: 7,
      same_practitioner: true,
      reason: '',
      notify_patient: true
    }
  })

  const { fields: dateFields, append: appendDate, remove: removeDate } = useFieldArray({
    control: form.control,
    name: 'preferred_dates'
  })

  const { fields: timeFields, append: appendTime, remove: removeTime } = useFieldArray({
    control: form.control,
    name: 'preferred_times'
  })

  useEffect(() => {
    if (open && appointment) {
      // Reset form and state when modal opens
      setStep('form')
      setResult(null)
      form.reset({
        preferred_dates: [],
        preferred_times: [],
        max_wait_days: 7,
        same_practitioner: true,
        reason: '',
        notify_patient: true
      })
    }
  }, [open, appointment, form])

  const onSubmit = async (data: RescheduleForm) => {
    if (!appointment) return

    setLoading(true)
    try {
      const response = await fetch('/api/appointments/reschedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointment_id: appointment.id,
          ...data
        })
      })

      const result = await response.json()
      setResult(result)
      setStep('result')

      if (result.success) {
        toast({
          title: 'Reagendamento realizado',
          description: 'O agendamento foi reagendado automaticamente'
        })
      }

    } catch (error: any) {
      toast({
        title: 'Erro no reagendamento',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const addQuickDate = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    const dateStr = date.toISOString().split('T')[0]

    const currentDates = form.getValues('preferred_dates')
    if (!currentDates.includes(dateStr)) {
      appendDate(dateStr)
    }
  }

  const addQuickTime = (time: string) => {
    const currentTimes = form.getValues('preferred_times')
    if (!currentTimes.includes(time)) {
      appendTime(time)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    if (result?.success) {
      onSuccess()
    }
  }

  if (!appointment) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-blue-600" />
            Reagendamento Inteligente
          </DialogTitle>
          <DialogDescription>
            Use IA para encontrar o melhor horário disponível automaticamente
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-6">
            {/* Original Appointment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Agendamento Atual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{appointment.patient.name}</span>
                  </div>
                  <Badge variant="outline">{appointment.appointment_type}</Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(appointment.appointment_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{appointment.start_time}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{appointment.practitioner.name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Preferred Dates */}
                <div className="space-y-3">
                  <FormLabel>Datas Preferenciais</FormLabel>
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addQuickDate(1)}
                    >
                      Amanhã
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addQuickDate(2)}
                    >
                      +2 dias
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addQuickDate(7)}
                    >
                      +1 semana
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const date = new Date()
                        const input = document.createElement('input')
                        input.type = 'date'
                        input.min = date.toISOString().split('T')[0]
                        input.onchange = (e) => {
                          const value = (e.target as HTMLInputElement).value
                          if (value) appendDate(value)
                        }
                        input.click()
                      }}
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dateFields.map((field, index) => (
                      <Badge
                        key={field.id}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100"
                        onClick={() => removeDate(index)}
                      >
                        {new Date(field.value).toLocaleDateString('pt-BR')} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Preferred Times */}
                <div className="space-y-3">
                  <FormLabel>Horários Preferenciais</FormLabel>
                  <div className="grid grid-cols-6 gap-2">
                    {COMMON_TIMES.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addQuickTime(time)}
                        className="text-xs"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {timeFields.map((field, index) => (
                      <Badge
                        key={field.id}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100"
                        onClick={() => removeTime(index)}
                      >
                        {field.value} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="max_wait_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aguardar até (dias)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="same_practitioner"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm">
                            Mesmo profissional
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notify_patient"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm">
                            Notificar paciente
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Reason */}
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Motivo do reagendamento..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" text="" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Reagendar Automaticamente
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {step === 'result' && result && (
          <div className="space-y-6">
            {result.success ? (
              <>
                {/* Success Message */}
                <div className="text-center py-6">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-900">
                    Reagendamento Realizado!
                  </h3>
                  <p className="text-green-700">
                    Encontramos o melhor horário disponível
                  </p>
                </div>

                {/* Before/After Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-gray-600">Antes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(result.data!.original_slot.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{result.data!.original_slot.time}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-green-800 flex items-center">
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Depois
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-green-800">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(result.data!.new_slot.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-green-800">
                        <Clock className="h-4 w-4" />
                        <span>{result.data!.new_slot.time}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-green-800">
                        <User className="h-4 w-4" />
                        <span>{result.data!.new_slot.practitioner_name}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Alternatives */}
                {result.data!.alternatives.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Outras opções encontradas:</h4>
                    <div className="space-y-2">
                      {result.data!.alternatives.map((alt, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-4 text-sm">
                            <span>{new Date(alt.date).toLocaleDateString('pt-BR')}</span>
                            <span>{alt.time}</span>
                            <span className="text-gray-600">{alt.practitioner_name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">{alt.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notification Status */}
                {result.data!.notification_sent && (
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Notificação enviada para o paciente
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* No slots found */}
                <div className="text-center py-6">
                  <AlertTriangle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-yellow-900">
                    Nenhum Horário Encontrado
                  </h3>
                  <p className="text-yellow-700">
                    Não foi possível encontrar horários que atendam às suas preferências
                  </p>
                </div>

                {/* Suggestions */}
                {result.suggestions && result.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Sugestões alternativas:</h4>
                    <div className="space-y-2">
                      {result.suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-4 text-sm">
                            <span>{new Date(suggestion.date).toLocaleDateString('pt-BR')}</span>
                            <span>{suggestion.time}</span>
                            <span className="text-gray-600">{suggestion.practitioner_name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">{suggestion.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setStep('form')}
              >
                Tentar Novamente
              </Button>
              <Button onClick={handleClose}>
                {result.success ? 'Concluído' : 'Fechar'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}