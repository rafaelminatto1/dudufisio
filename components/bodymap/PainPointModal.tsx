/**
 * Modal de Registro de Ponto de Dor - FisioFlow
 * Modal para registrar ou editar pontos de dor no mapeamento corporal
 * Inclui validação com padrões de saúde brasileiros e LGPD
 */

'use client'

import React, { useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, AlertTriangle, Save, X, MapPin } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { PainPoint, PainType, AssessmentType } from '@/lib/supabase/database.types'

// Schema de validação para pontos de dor
const painPointSchema = z.object({
  pain_intensity: z
    .number()
    .min(0, 'Intensidade mínima é 0')
    .max(10, 'Intensidade máxima é 10'),
  pain_type: z
    .enum([
      'aguda',
      'cronica',
      'latejante',
      'queimacao',
      'formigamento',
      'dormencia',
      'rigidez',
      'outro'
    ])
    .optional()
    .nullable(),
  pain_description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional()
    .nullable(),
  clinical_notes: z
    .string()
    .max(1000, 'Observações clínicas devem ter no máximo 1000 caracteres')
    .optional()
    .nullable(),
  assessment_date: z.date({
    message: 'Data da avaliação é obrigatória',
  }),
  assessment_type: z.enum(['initial', 'progress', 'discharge', 'followup'], {
    message: 'Tipo de avaliação é obrigatório',
  }),
  improvement_notes: z
    .string()
    .max(500, 'Notas de melhoria devem ter no máximo 500 caracteres')
    .optional()
    .nullable(),
})

type PainPointFormData = z.infer<typeof painPointSchema>

interface PainPointModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: PainPointFormData & {
    x_coordinate: number
    y_coordinate: number
    body_region: string
  }) => Promise<void>
  painPoint?: PainPoint | null
  coordinates?: { x: number; y: number; region: string }
  readonly?: boolean
}

// Opções de tipos de dor em português
const painTypeOptions = [
  { value: 'aguda', label: 'Aguda', description: 'Dor súbita e intensa' },
  { value: 'cronica', label: 'Crônica', description: 'Dor persistente por mais de 3 meses' },
  { value: 'latejante', label: 'Latejante', description: 'Dor pulsátil, tipo pontadas' },
  { value: 'queimacao', label: 'Queimação', description: 'Sensação de ardor ou queimadura' },
  { value: 'formigamento', label: 'Formigamento', description: 'Sensação de agulhadas' },
  { value: 'dormencia', label: 'Dormência', description: 'Perda de sensibilidade' },
  { value: 'rigidez', label: 'Rigidez', description: 'Sensação de enrijecimento' },
  { value: 'outro', label: 'Outro', description: 'Especificar na descrição' },
] as const

// Opções de tipos de avaliação
const assessmentTypeOptions = [
  { value: 'initial', label: 'Avaliação Inicial', description: 'Primeira consulta do paciente' },
  { value: 'progress', label: 'Evolução', description: 'Acompanhamento do tratamento' },
  { value: 'discharge', label: 'Alta', description: 'Finalização do tratamento' },
  { value: 'followup', label: 'Retorno', description: 'Consulta de retorno' },
] as const

// Labels de intensidade de dor
const intensityLabels = [
  'Sem dor',
  'Dor muito leve',
  'Dor leve',
  'Dor moderada',
  'Dor moderada',
  'Dor moderada',
  'Dor intensa',
  'Dor intensa',
  'Dor muito intensa',
  'Dor insuportável',
  'Pior dor possível'
]

export default function PainPointModal({
  isOpen,
  onClose,
  onSave,
  painPoint,
  coordinates,
  readonly = false
}: PainPointModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  const form = useForm<PainPointFormData>({
    resolver: zodResolver(painPointSchema),
    defaultValues: {
      pain_intensity: 0,
      pain_type: null,
      pain_description: '',
      clinical_notes: '',
      assessment_date: new Date(),
      assessment_type: 'progress',
      improvement_notes: '',
    },
  })

  // Resetar form quando modal abrir/fechar ou dados mudarem
  useEffect(() => {
    if (isOpen) {
      if (painPoint) {
        // Editando ponto existente
        form.reset({
          pain_intensity: painPoint.pain_intensity,
          pain_type: painPoint.pain_type,
          pain_description: painPoint.pain_description || '',
          clinical_notes: painPoint.clinical_notes || '',
          assessment_date: parseISO(painPoint.assessment_date),
          assessment_type: painPoint.assessment_type,
          improvement_notes: painPoint.improvement_notes || '',
        })
      } else {
        // Novo ponto de dor
        form.reset({
          pain_intensity: 0,
          pain_type: null,
          pain_description: '',
          clinical_notes: '',
          assessment_date: new Date(),
          assessment_type: 'progress',
          improvement_notes: '',
        })
      }
    }
  }, [isOpen, painPoint, form])

  const handleSubmit = async (data: PainPointFormData) => {
    if (!coordinates && !painPoint) {
      console.error('Coordenadas ou ponto de dor existente são obrigatórios')
      return
    }

    setIsLoading(true)

    try {
      const submitData = {
        ...data,
        x_coordinate: coordinates?.x ?? painPoint?.x_coordinate ?? 0,
        y_coordinate: coordinates?.y ?? painPoint?.y_coordinate ?? 0,
        body_region: coordinates?.region ?? painPoint?.body_region ?? '',
      }

      await onSave(submitData)
      form.reset()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar ponto de dor:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      form.reset()
      onClose()
    }
  }

  const currentIntensity = form.watch('pain_intensity')
  const currentPainType = form.watch('pain_type')

  const getIntensityColor = (intensity: number): string => {
    if (intensity <= 2) return 'text-green-600'
    if (intensity <= 5) return 'text-yellow-600'
    if (intensity <= 7) return 'text-orange-600'
    return 'text-red-600'
  }

  const getIntensityBadgeColor = (intensity: number): string => {
    if (intensity <= 2) return 'bg-green-100 text-green-800 border-green-200'
    if (intensity <= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (intensity <= 7) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span>
              {painPoint ? 'Editar Ponto de Dor' : 'Registrar Ponto de Dor'}
            </span>
          </DialogTitle>

          <DialogDescription>
            {painPoint
              ? 'Edite as informações do ponto de dor selecionado.'
              : 'Registre um novo ponto de dor no mapeamento corporal.'}
          </DialogDescription>

          {coordinates && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Região:</strong> {coordinates.region} |
                <strong> Coordenadas:</strong> ({coordinates.x.toFixed(1)}%, {coordinates.y.toFixed(1)}%)
              </p>
            </div>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Intensidade da Dor */}
            <FormField
              control={form.control}
              name="pain_intensity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">
                    Intensidade da Dor
                  </FormLabel>
                  <FormDescription>
                    Use a escala de 0 a 10, onde 0 = sem dor e 10 = pior dor possível
                  </FormDescription>
                  <FormControl>
                    <div className="space-y-4">
                      <Slider
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        max={10}
                        step={1}
                        className="w-full"
                        disabled={readonly}
                      />
                      <div className="flex items-center justify-between">
                        <Badge
                          className={`${getIntensityBadgeColor(currentIntensity)} border`}
                          variant="outline"
                        >
                          Intensidade: {currentIntensity}/10
                        </Badge>
                        <span className={`text-sm font-medium ${getIntensityColor(currentIntensity)}`}>
                          {intensityLabels[currentIntensity]}
                        </span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de Dor */}
            <FormField
              control={form.control}
              name="pain_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Dor</FormLabel>
                  <FormDescription>
                    Selecione o tipo que melhor descreve a dor
                  </FormDescription>
                  <Select
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    disabled={readonly}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de dor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {painTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição da Dor */}
            <FormField
              control={form.control}
              name="pain_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição da Dor</FormLabel>
                  <FormDescription>
                    Descreva as características da dor em detalhes
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="Ex: Dor constante que piora com movimentos, irradia para o braço..."
                      rows={3}
                      maxLength={500}
                      disabled={readonly}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <FormMessage />
                    <span className="text-xs text-muted-foreground">
                      {(field.value || '').length}/500
                    </span>
                  </div>
                </FormItem>
              )}
            />

            <Separator />

            {/* Data da Avaliação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assessment_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da Avaliação</FormLabel>
                    <FormDescription>
                      Data em que a dor foi avaliada
                    </FormDescription>
                    <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                      <PopoverTrigger asChild disabled={readonly}>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                            ) : (
                              <span>Selecionar data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date)
                            setShowCalendar(false)
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assessment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Avaliação</FormLabel>
                    <FormDescription>
                      Contexto da avaliação
                    </FormDescription>
                    <Select value={field.value} onValueChange={field.onChange} disabled={readonly}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assessmentTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{option.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {option.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Observações Clínicas */}
            <FormField
              control={form.control}
              name="clinical_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Clínicas</FormLabel>
                  <FormDescription>
                    Anotações técnicas e observações do profissional
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="Ex: Teste de Lasègue positivo, limitação ROM flexão..."
                      rows={3}
                      maxLength={1000}
                      disabled={readonly}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <FormMessage />
                    <span className="text-xs text-muted-foreground">
                      {(field.value || '').length}/1000
                    </span>
                  </div>
                </FormItem>
              )}
            />

            {/* Notas de Melhoria (apenas para evolução) */}
            {(form.watch('assessment_type') === 'progress' || form.watch('assessment_type') === 'followup') && (
              <FormField
                control={form.control}
                name="improvement_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas de Melhoria</FormLabel>
                    <FormDescription>
                      Descreva a evolução e melhoria da dor
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Ex: Redução de 30% na intensidade, maior amplitude de movimento..."
                        rows={2}
                        maxLength={500}
                        disabled={readonly}
                      />
                    </FormControl>
                    <div className="flex justify-between items-center">
                      <FormMessage />
                      <span className="text-xs text-muted-foreground">
                        {(field.value || '').length}/500
                      </span>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* Alertas de Intensidade Alta */}
            {currentIntensity >= 8 && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Dor de Alta Intensidade Detectada
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Considere avaliação imediata e intervenções para alívio da dor.
                      Documente cuidadosamente e considere encaminhamentos se necessário.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </Form>

        <DialogFooter className="space-x-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            type="button"
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>

          {!readonly && (
            <Button
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  {painPoint ? 'Atualizar' : 'Salvar'} Ponto de Dor
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Componente para exibição de resumo do ponto de dor
export function PainPointSummary({ painPoint }: { painPoint: PainPoint }) {
  const intensityColor = painPoint.pain_intensity <= 2
    ? 'text-green-600'
    : painPoint.pain_intensity <= 5
    ? 'text-yellow-600'
    : painPoint.pain_intensity <= 7
    ? 'text-orange-600'
    : 'text-red-600'

  const painTypeLabel = painTypeOptions.find(
    opt => opt.value === painPoint.pain_type
  )?.label || 'Não especificado'

  return (
    <div className="bg-white p-4 rounded-lg border space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">
          {painPoint.body_region}
        </h4>
        <Badge className={`${
          painPoint.pain_intensity <= 2 ? 'bg-green-100 text-green-800' :
          painPoint.pain_intensity <= 5 ? 'bg-yellow-100 text-yellow-800' :
          painPoint.pain_intensity <= 7 ? 'bg-orange-100 text-orange-800' :
          'bg-red-100 text-red-800'
        }`}>
          {painPoint.pain_intensity}/10
        </Badge>
      </div>

      {painPoint.pain_type && (
        <p className="text-sm text-gray-600">
          <strong>Tipo:</strong> {painTypeLabel}
        </p>
      )}

      {painPoint.pain_description && (
        <p className="text-sm text-gray-600">
          <strong>Descrição:</strong> {painPoint.pain_description}
        </p>
      )}

      <p className="text-xs text-gray-500">
        Avaliado em {format(parseISO(painPoint.assessment_date), 'dd/MM/yyyy', { locale: ptBR })}
      </p>
    </div>
  )
}