'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, X, Search, Move, Target, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const prescriptionExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  sets: z.number().min(1).max(10),
  repetitions: z.number().min(1).max(100).optional(),
  hold_time_seconds: z.number().min(1).max(300).optional(),
  rest_time_seconds: z.number().min(10).max(300).optional(),
  frequency_per_week: z.number().min(1).max(7),
  duration_weeks: z.number().min(1).max(52),
  progression_notes: z.string().optional(),
  custom_instructions: z.string().optional(),
  priority_order: z.number().min(1).max(100)
})

const createPrescriptionSchema = z.object({
  patient_id: z.string().uuid('Selecione um paciente'),
  session_id: z.string().uuid().optional(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
  description: z.string().optional(),
  goals: z.string().min(10, 'Objetivos devem ter pelo menos 10 caracteres'),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  expected_end_date: z.string().optional(),
  frequency_description: z.string().min(5, 'Descrição da frequência é obrigatória'),
  general_instructions: z.string().optional(),
  precautions: z.string().optional(),
  exercises: z.array(prescriptionExerciseSchema).min(1, 'Pelo menos um exercício é obrigatório'),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).default('active'),
  is_template: z.boolean().default(false)
})

type CreatePrescriptionForm = z.infer<typeof createPrescriptionSchema>

interface CreatePrescriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Patient {
  id: string
  name: string
  cpf: string
}

interface Exercise {
  id: string
  name: string
  description: string
  category: string
  difficulty_level: string
  duration_minutes: number
  repetitions?: number
  sets?: number
  hold_time_seconds?: number
  equipment_needed?: string[]
}

export function CreatePrescriptionModal({ open, onOpenChange, onSuccess }: CreatePrescriptionModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState('basic')

  // Data states
  const [patients, setPatients] = useState<Patient[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [loadingExercises, setLoadingExercises] = useState(false)

  // Search states
  const [patientSearch, setPatientSearch] = useState('')
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const form = useForm<CreatePrescriptionForm>({
    resolver: zodResolver(createPrescriptionSchema),
    defaultValues: {
      patient_id: '',
      session_id: undefined,
      name: '',
      description: '',
      goals: '',
      start_date: new Date().toISOString().split('T')[0],
      expected_end_date: '',
      frequency_description: '',
      general_instructions: '',
      precautions: '',
      exercises: [],
      status: 'active',
      is_template: false
    }
  })

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'exercises'
  })

  // Fetch patients
  const fetchPatients = async (search = '') => {
    setLoadingPatients(true)
    try {
      const params = new URLSearchParams({
        limit: '50',
        sort_by: 'name'
      })
      if (search) params.append('search', search)

      const response = await fetch(`/api/patients?${params}`)
      const data = await response.json()

      if (data.success) {
        setPatients(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error)
    } finally {
      setLoadingPatients(false)
    }
  }

  // Fetch exercises
  const fetchExercises = async (search = '', category = '') => {
    setLoadingExercises(true)
    try {
      const params = new URLSearchParams({
        limit: '100',
        sort_by: 'name'
      })
      if (search) params.append('search', search)
      if (category) params.append('category', category)

      const response = await fetch(`/api/exercises?${params}`)
      const data = await response.json()

      if (data.success) {
        setExercises(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar exercícios:', error)
    } finally {
      setLoadingExercises(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchPatients()
      fetchExercises()
    }
  }, [open])

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchPatients(patientSearch)
    }, 300)
    return () => clearTimeout(debounce)
  }, [patientSearch])

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchExercises(exerciseSearch, selectedCategory)
    }, 300)
    return () => clearTimeout(debounce)
  }, [exerciseSearch, selectedCategory])

  const handleSubmit = async (data: CreatePrescriptionForm) => {
    setLoading(true)
    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Prescrição criada com sucesso',
          description: `${data.name} foi criada para o paciente`
        })
        form.reset()
        setCurrentTab('basic')
        onSuccess()
      } else {
        throw new Error(result.error || 'Erro ao criar prescrição')
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao criar prescrição',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const addExercise = (exercise: Exercise) => {
    const isAlreadyAdded = fields.some(field => field.exercise_id === exercise.id)
    if (isAlreadyAdded) {
      toast({
        title: 'Exercício já adicionado',
        description: 'Este exercício já está na prescrição',
        variant: 'destructive'
      })
      return
    }

    append({
      exercise_id: exercise.id,
      sets: exercise.sets || 3,
      repetitions: exercise.repetitions,
      hold_time_seconds: exercise.hold_time_seconds,
      rest_time_seconds: 60,
      frequency_per_week: 3,
      duration_weeks: 4,
      progression_notes: '',
      custom_instructions: '',
      priority_order: fields.length + 1
    })
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    move(sourceIndex, destinationIndex)

    // Update priority order
    const updatedExercises = [...form.getValues('exercises')]
    updatedExercises.forEach((exercise, index) => {
      exercise.priority_order = index + 1
    })
    form.setValue('exercises', updatedExercises)
  }

  const getSelectedExercise = (exerciseId: string) => {
    return exercises.find(e => e.id === exerciseId)
  }

  const canProceedToExercises = () => {
    const values = form.getValues()
    return values.patient_id && values.name && values.goals && values.start_date && values.frequency_description
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Nova Prescrição de Exercícios</DialogTitle>
          <DialogDescription>
            Crie uma prescrição personalizada para o paciente
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Informações Básicas
            </TabsTrigger>
            <TabsTrigger value="exercises" disabled={!canProceedToExercises()} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Exercícios
            </TabsTrigger>
            <TabsTrigger value="review" disabled={fields.length === 0} className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Revisão
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <TabsContent value="basic" className="space-y-6">
                  {/* Patient Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Seleção do Paciente</h3>

                    <FormField
                      control={form.control}
                      name="patient_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Paciente *</FormLabel>
                          <div className="space-y-2">
                            <div className="relative">
                              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Buscar paciente..."
                                value={patientSearch}
                                onChange={(e) => setPatientSearch(e.target.value)}
                                className="pl-9"
                              />
                            </div>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o paciente" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {patients.map((patient) => (
                                  <SelectItem key={patient.id} value={patient.id}>
                                    {patient.name} - {patient.cpf}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informações da Prescrição</h3>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Prescrição *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Fortalecimento Lombar - Fase 1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descrição opcional da prescrição"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="goals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Objetivos *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva os objetivos terapêuticos desta prescrição"
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Início *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="expected_end_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Prevista de Término</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="frequency_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequência *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: 3x por semana, dias alternados"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="general_instructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instruções Gerais</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Instruções gerais para execução dos exercícios"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="precautions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precauções</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Precauções específicas para este paciente"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_template"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Salvar como template</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Esta prescrição ficará disponível como modelo para reutilização
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setCurrentTab('exercises')}
                      disabled={!canProceedToExercises()}
                    >
                      Próximo: Exercícios
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="exercises" className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Exercise Library */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Biblioteca de Exercícios</h3>

                      {/* Search and Filters */}
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar exercícios..."
                            value={exerciseSearch}
                            onChange={(e) => setExerciseSearch(e.target.value)}
                            className="pl-9"
                          />
                        </div>

                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filtrar por categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todas as categorias</SelectItem>
                            <SelectItem value="fortalecimento">Fortalecimento</SelectItem>
                            <SelectItem value="alongamento">Alongamento</SelectItem>
                            <SelectItem value="mobilizacao">Mobilização</SelectItem>
                            <SelectItem value="equilibrio">Equilíbrio</SelectItem>
                            <SelectItem value="coordenacao">Coordenação</SelectItem>
                            <SelectItem value="respiratorio">Respiratório</SelectItem>
                            <SelectItem value="cardiovascular">Cardiovascular</SelectItem>
                            <SelectItem value="propriocepcao">Propriocepção</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Exercise List */}
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {exercises.map((exercise) => (
                          <Card
                            key={exercise.id}
                            className="cursor-pointer hover:shadow-sm transition-shadow"
                            onClick={() => addExercise(exercise)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{exercise.name}</h4>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {exercise.description}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {exercise.category}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {exercise.difficulty_level}
                                    </Badge>
                                  </div>
                                </div>
                                <Button size="sm" variant="ghost">
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Selected Exercises */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Exercícios Selecionados ({fields.length})</h3>

                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="exercises">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-2 max-h-96 overflow-y-auto"
                            >
                              {fields.map((field, index) => {
                                const exercise = getSelectedExercise(field.exercise_id)
                                return (
                                  <Draggable key={field.id} draggableId={field.id} index={index}>
                                    {(provided) => (
                                      <Card
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="relative"
                                      >
                                        <CardHeader className="pb-2">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <div {...provided.dragHandleProps}>
                                                <Move className="h-4 w-4 text-muted-foreground" />
                                              </div>
                                              <h4 className="font-medium text-sm">
                                                {exercise?.name}
                                              </h4>
                                            </div>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => remove(index)}
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3 pt-0">
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <label className="text-xs text-muted-foreground">Séries</label>
                                              <Input
                                                type="number"
                                                min="1"
                                                max="10"
                                                {...form.register(`exercises.${index}.sets`, { valueAsNumber: true })}
                                                className="h-8"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-xs text-muted-foreground">Repetições</label>
                                              <Input
                                                type="number"
                                                min="1"
                                                max="100"
                                                {...form.register(`exercises.${index}.repetitions`, { valueAsNumber: true })}
                                                className="h-8"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-xs text-muted-foreground">Freq/Semana</label>
                                              <Input
                                                type="number"
                                                min="1"
                                                max="7"
                                                {...form.register(`exercises.${index}.frequency_per_week`, { valueAsNumber: true })}
                                                className="h-8"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-xs text-muted-foreground">Duração (sem)</label>
                                              <Input
                                                type="number"
                                                min="1"
                                                max="52"
                                                {...form.register(`exercises.${index}.duration_weeks`, { valueAsNumber: true })}
                                                className="h-8"
                                              />
                                            </div>
                                          </div>
                                          <Textarea
                                            placeholder="Instruções específicas para este exercício..."
                                            {...form.register(`exercises.${index}.custom_instructions`)}
                                            className="min-h-[60px] text-xs"
                                          />
                                        </CardContent>
                                      </Card>
                                    )}
                                  </Draggable>
                                )
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>

                      {fields.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          <Target className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Nenhum exercício selecionado</p>
                          <p className="text-xs">Clique nos exercícios da biblioteca para adicionar</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentTab('basic')}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentTab('review')}
                      disabled={fields.length === 0}
                    >
                      Próximo: Revisão
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="review" className="space-y-6">
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Revisão da Prescrição</h3>

                    {/* Summary Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Resumo</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Paciente: </span>
                            {patients.find(p => p.id === form.watch('patient_id'))?.name}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Nome: </span>
                            {form.watch('name')}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Data de Início: </span>
                            {form.watch('start_date')}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Exercícios: </span>
                            {fields.length}
                          </div>
                        </div>
                        {form.watch('description') && (
                          <div>
                            <span className="text-muted-foreground">Descrição: </span>
                            {form.watch('description')}
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Objetivos: </span>
                          {form.watch('goals')}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Frequência: </span>
                          {form.watch('frequency_description')}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Exercise List */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Lista de Exercícios</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {fields.map((field, index) => {
                            const exercise = getSelectedExercise(field.exercise_id)
                            return (
                              <div key={field.id} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">{index + 1}. {exercise?.name}</h4>
                                  <Badge variant="outline">{exercise?.category}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {field.sets} séries
                                  {field.repetitions && ` × ${field.repetitions} repetições`}
                                  {field.hold_time_seconds && ` (${field.hold_time_seconds}s sustentação)`}
                                  <br />
                                  Frequência: {field.frequency_per_week}x/semana por {field.duration_weeks} semanas
                                  {field.custom_instructions && (
                                    <>
                                      <br />
                                      <span className="italic">{field.custom_instructions}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentTab('exercises')}
                    >
                      Voltar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Criando...' : 'Criar Prescrição'}
                    </Button>
                  </div>
                </TabsContent>
              </form>
            </Form>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}