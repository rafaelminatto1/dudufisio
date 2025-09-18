'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarIcon, Clock, FileText, Save, X } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const sessionSchema = z.object({
  patient_id: z.string().min(1, 'Paciente é obrigatório'),
  session_type: z.enum(['avaliacao', 'evolucao', 'alta', 'retorno']),
  session_date: z.date({ required_error: 'Data da sessão é obrigatória' }),
  session_time: z.string().min(1, 'Horário é obrigatório'),
  duration_minutes: z.number().min(15, 'Duração mínima de 15 minutos').max(240, 'Duração máxima de 4 horas'),

  // Clinical data
  chief_complaint: z.string().optional(),
  pain_assessment_before: z.number().min(0).max(10).optional(),
  pain_assessment_after: z.number().min(0).max(10).optional(),
  procedures: z.string().optional(),
  techniques_used: z.string().optional(),
  patient_response: z.string().optional(),
  objective_findings: z.string().optional(),
  treatment_plan: z.string().optional(),
  homework_exercises: z.string().optional(),

  // Progress tracking
  functional_improvement: z.enum(['nenhuma', 'leve', 'moderada', 'significativa']).optional(),
  patient_satisfaction: z.number().min(1).max(5).optional(),
  next_appointment_recommendation: z.string().optional(),

  // Notes
  clinical_notes: z.string().optional(),
  observations: z.string().optional(),

  // Goals
  short_term_goals: z.string().optional(),
  long_term_goals: z.string().optional(),

  status: z.enum(['agendada', 'em_andamento', 'concluida', 'cancelada']).default('concluida')
})

type SessionFormData = z.infer<typeof sessionSchema>

interface CreateSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (session: any) => void
  patientId: string
  patientName: string
}

const sessionTypeLabels = {
  avaliacao: 'Avaliação Inicial',
  evolucao: 'Sessão de Evolução',
  alta: 'Sessão de Alta',
  retorno: 'Sessão de Retorno'
}

const functionalImprovementLabels = {
  nenhuma: 'Nenhuma melhoria',
  leve: 'Melhoria leve',
  moderada: 'Melhoria moderada',
  significativa: 'Melhoria significativa'
}

export default function CreateSessionModal({
  isOpen,
  onClose,
  onSuccess,
  patientId,
  patientName
}: CreateSessionModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      patient_id: patientId,
      session_type: 'evolucao',
      duration_minutes: 60,
      status: 'concluida'
    }
  })

  const onSubmit = async (data: SessionFormData) => {
    try {
      setLoading(true)

      // Combinar data e horário
      const sessionDateTime = new Date(data.session_date)
      const [hours, minutes] = data.session_time.split(':')
      sessionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      const payload = {
        ...data,
        session_date: sessionDateTime.toISOString(),
        // Remover campos temporários
        session_time: undefined
      }

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.details) {
          errorData.details.forEach((detail: any) => {
            form.setError(detail.field as any, {
              type: 'server',
              message: detail.message
            })
          })
          return
        }
        throw new Error(errorData.error || 'Erro ao criar sessão')
      }

      const result = await response.json()

      toast({
        title: 'Sucesso',
        description: result.message || 'Sessão criada com sucesso'
      })

      onSuccess(result.data)
      onClose()
      form.reset()
      setCurrentStep(1)

    } catch (error) {
      console.error('Erro ao criar sessão:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar sessão',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      form.reset()
      setCurrentStep(1)
    }
  }

  const nextStep = async () => {
    const fieldsToValidate = currentStep === 1
      ? ['session_type', 'session_date', 'session_time', 'duration_minutes']
      : []

    const isValid = await form.trigger(fieldsToValidate as any)
    if (isValid) {
      setCurrentStep(2)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Sessão - {patientName}</DialogTitle>
          <DialogDescription>
            Registre uma nova sessão de fisioterapia para este paciente
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            )}>
              1
            </div>
            <span className="text-sm">Dados Básicos</span>
          </div>
          <div className="h-px bg-gray-300 w-12"></div>
          <div className="flex items-center space-x-2">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            )}>
              2
            </div>
            <span className="text-sm">Avaliação Clínica</span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações da Sessão</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="session_type">Tipo de Sessão *</Label>
                    <Select
                      value={form.watch('session_type')}
                      onValueChange={(value) => form.setValue('session_type', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(sessionTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.session_type && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.session_type.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data da Sessão *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !form.watch('session_date') && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.watch('session_date') ? (
                              format(form.watch('session_date'), 'PPP', { locale: ptBR })
                            ) : (
                              'Selecione a data'
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={form.watch('session_date')}
                            onSelect={(date) => date && form.setValue('session_date', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {form.formState.errors.session_date && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.session_date.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="session_time">Horário *</Label>
                      <Input
                        id="session_time"
                        type="time"
                        {...form.register('session_time')}
                      />
                      {form.formState.errors.session_time && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.session_time.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="duration_minutes">Duração (minutos) *</Label>
                    <Select
                      value={form.watch('duration_minutes')?.toString()}
                      onValueChange={(value) => form.setValue('duration_minutes', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="45">45 minutos</SelectItem>
                        <SelectItem value="60">60 minutos</SelectItem>
                        <SelectItem value="90">90 minutos</SelectItem>
                        <SelectItem value="120">120 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.duration_minutes && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.duration_minutes.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="chief_complaint">Queixa Principal</Label>
                    <Textarea
                      id="chief_complaint"
                      {...form.register('chief_complaint')}
                      placeholder="Descreva a principal queixa do paciente..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button type="button" onClick={nextStep} disabled={loading}>
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Avaliação de Dor */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Avaliação de Dor</CardTitle>
                  <CardDescription>Escala de 0 a 10</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pain_assessment_before">Dor antes da sessão</Label>
                      <Select
                        value={form.watch('pain_assessment_before')?.toString()}
                        onValueChange={(value) => form.setValue('pain_assessment_before', value ? parseInt(value) : undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(11)].map((_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i} {i === 0 ? '(sem dor)' : i === 10 ? '(dor máxima)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="pain_assessment_after">Dor após a sessão</Label>
                      <Select
                        value={form.watch('pain_assessment_after')?.toString()}
                        onValueChange={(value) => form.setValue('pain_assessment_after', value ? parseInt(value) : undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(11)].map((_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i} {i === 0 ? '(sem dor)' : i === 10 ? '(dor máxima)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Procedimentos e Técnicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Procedimentos e Técnicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="procedures">Procedimentos Realizados</Label>
                    <Textarea
                      id="procedures"
                      {...form.register('procedures')}
                      placeholder="Ex: Mobilização articular, alongamentos, exercícios terapêuticos..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="techniques_used">Técnicas Utilizadas</Label>
                    <Textarea
                      id="techniques_used"
                      {...form.register('techniques_used')}
                      placeholder="Ex: Terapia manual, eletroterapia, hidroterapia..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="objective_findings">Achados Objetivos</Label>
                    <Textarea
                      id="objective_findings"
                      {...form.register('objective_findings')}
                      placeholder="Observações objetivas durante a sessão..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Evolução e Metas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Evolução e Metas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="functional_improvement">Melhoria Funcional</Label>
                      <Select
                        value={form.watch('functional_improvement')}
                        onValueChange={(value) => form.setValue('functional_improvement', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(functionalImprovementLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="patient_satisfaction">Satisfação do Paciente (1-5)</Label>
                      <Select
                        value={form.watch('patient_satisfaction')?.toString()}
                        onValueChange={(value) => form.setValue('patient_satisfaction', value ? parseInt(value) : undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i} {i === 1 ? '(muito insatisfeito)' : i === 5 ? '(muito satisfeito)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="short_term_goals">Metas de Curto Prazo</Label>
                    <Textarea
                      id="short_term_goals"
                      {...form.register('short_term_goals')}
                      placeholder="Objetivos para as próximas sessões..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="homework_exercises">Exercícios Domiciliares</Label>
                    <Textarea
                      id="homework_exercises"
                      {...form.register('homework_exercises')}
                      placeholder="Exercícios recomendados para casa..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Observações */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Observações e Notas Clínicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="clinical_notes">Notas Clínicas</Label>
                    <Textarea
                      id="clinical_notes"
                      {...form.register('clinical_notes')}
                      placeholder="Anotações técnicas e observações clínicas..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="observations">Observações Gerais</Label>
                    <Textarea
                      id="observations"
                      {...form.register('observations')}
                      placeholder="Outras observações relevantes..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="next_appointment_recommendation">Recomendação para Próxima Consulta</Label>
                    <Textarea
                      id="next_appointment_recommendation"
                      {...form.register('next_appointment_recommendation')}
                      placeholder="Orientações para a próxima sessão..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  disabled={loading}
                >
                  Voltar
                </Button>
                <div className="space-x-2">
                  <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Salvando...' : 'Salvar Sessão'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}