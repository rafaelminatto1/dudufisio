'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Slider } from '@/components/ui/slider'
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Target,
  Repeat,
  Timer,
  Clock,
  AlertTriangle,
  XCircle,
  Star,
  Activity
} from 'lucide-react'

const exerciseLogSchema = z.object({
  completed_sets: z.number().min(1, 'Deve completar pelo menos 1 série'),
  completed_repetitions: z.number().optional(),
  hold_time_used: z.number().optional(),
  difficulty_rating: z.number().min(1).max(5),
  pain_level_before: z.number().min(0).max(10).optional(),
  pain_level_after: z.number().min(0).max(10).optional(),
  notes: z.string().optional()
})

type ExerciseLogForm = z.infer<typeof exerciseLogSchema>

interface PrescriptionExercise {
  id: string
  exercise_id: string
  sets: number
  repetitions?: number
  hold_time_seconds?: number
  rest_time_seconds?: number
  frequency_per_week: number
  duration_weeks: number
  progression_notes?: string
  custom_instructions?: string
  priority_order: number
  exercise: {
    id: string
    name: string
    category: string
    difficulty_level: string
    description: string
    instructions: string
    precautions?: string
    contraindications?: string
    video_url?: string
    thumbnail_url?: string
    duration_minutes: number
  }
}

interface ExerciseExecutionModalProps {
  exercise: PrescriptionExercise
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (logData: ExerciseLogForm & { exercise_id: string }) => void
}

export function ExerciseExecutionModal({ exercise, open, onOpenChange, onComplete }: ExerciseExecutionModalProps) {
  const [currentPhase, setCurrentPhase] = useState<'preparation' | 'execution' | 'completion'>('preparation')
  const [currentSet, setCurrentSet] = useState(1)
  const [currentRep, setCurrentRep] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [restTimer, setRestTimer] = useState(0)
  const [holdTimer, setHoldTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [completedSets, setCompletedSets] = useState<number[]>([])

  const form = useForm<ExerciseLogForm>({
    resolver: zodResolver(exerciseLogSchema),
    defaultValues: {
      completed_sets: exercise.sets,
      completed_repetitions: exercise.repetitions,
      hold_time_used: exercise.hold_time_seconds,
      difficulty_rating: 3,
      pain_level_before: 0,
      pain_level_after: 0,
      notes: ''
    }
  })

  // Timer effects would go here (useEffect for countdown timers)

  const handleStartExercise = () => {
    setCurrentPhase('execution')
    setCurrentSet(1)
    setCurrentRep(0)
  }

  const handleNextRep = () => {
    if (exercise.repetitions && currentRep < exercise.repetitions) {
      setCurrentRep(currentRep + 1)
    }
  }

  const handleCompleteSet = () => {
    setCompletedSets([...completedSets, currentSet])

    if (currentSet < exercise.sets) {
      setCurrentSet(currentSet + 1)
      setCurrentRep(0)
      if (exercise.rest_time_seconds) {
        setIsResting(true)
        setRestTimer(exercise.rest_time_seconds)
        // Start rest timer
      }
    } else {
      setCurrentPhase('completion')
    }
  }

  const handleSubmit = (data: ExerciseLogForm) => {
    onComplete({
      ...data,
      exercise_id: exercise.exercise_id
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'iniciante':
        return 'bg-green-100 text-green-800'
      case 'intermediario':
        return 'bg-yellow-100 text-yellow-800'
      case 'avancado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPainLevelColor = (level: number) => {
    if (level <= 3) return 'text-green-600'
    if (level <= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{exercise.exercise.name}</DialogTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{exercise.exercise.category}</Badge>
            <Badge variant="secondary" className={getDifficultyColor(exercise.exercise.difficulty_level)}>
              {exercise.exercise.difficulty_level}
            </Badge>
          </div>
          <DialogDescription>
            {exercise.exercise.description}
          </DialogDescription>
        </DialogHeader>

        {/* Preparation Phase */}
        {currentPhase === 'preparation' && (
          <div className="space-y-6">
            {/* Exercise Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visão Geral do Exercício</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Séries</span>
                    </div>
                    <p className="font-semibold text-lg">{exercise.sets}</p>
                  </div>

                  {exercise.repetitions && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Repeat className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Repetições</span>
                      </div>
                      <p className="font-semibold text-lg">{exercise.repetitions}</p>
                    </div>
                  )}

                  {exercise.hold_time_seconds && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Sustentação</span>
                      </div>
                      <p className="font-semibold text-lg">{exercise.hold_time_seconds}s</p>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Duração</span>
                    </div>
                    <p className="font-semibold text-lg">~{exercise.exercise.duration_minutes}min</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como Executar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {exercise.exercise.instructions}
                </p>
              </CardContent>
            </Card>

            {/* Custom Instructions */}
            {exercise.custom_instructions && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-900">Instruções Específicas para Você</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
                    {exercise.custom_instructions}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Safety Information */}
            {(exercise.exercise.precautions || exercise.exercise.contraindications) && (
              <div className="space-y-3">
                {exercise.exercise.precautions && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-amber-900 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Precauções
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-wrap">
                        {exercise.exercise.precautions}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {exercise.exercise.contraindications && (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-red-900 flex items-center gap-2">
                        <XCircle className="h-5 w-5" />
                        Contraindicações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-red-800 leading-relaxed whitespace-pre-wrap">
                        {exercise.exercise.contraindications}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Video */}
            {exercise.exercise.video_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vídeo Demonstrativo</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(exercise.exercise.video_url, '_blank')}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Assistir Demonstração
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Pain Assessment Before */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Avaliação Inicial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Nível de dor antes do exercício (0-10):</Label>
                  <div className="px-3">
                    <Slider
                      value={[form.watch('pain_level_before') || 0]}
                      onValueChange={(value) => form.setValue('pain_level_before', value[0])}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0 - Sem dor</span>
                      <span className={getPainLevelColor(form.watch('pain_level_before') || 0)}>
                        {form.watch('pain_level_before') || 0}
                      </span>
                      <span>10 - Dor máxima</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleStartExercise} className="w-full" size="lg">
              <Play className="h-4 w-4 mr-2" />
              Iniciar Exercício
            </Button>
          </div>
        )}

        {/* Execution Phase */}
        {currentPhase === 'execution' && (
          <div className="space-y-6">
            {/* Current Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progresso Atual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{currentSet}</p>
                    <p className="text-sm text-muted-foreground">Série Atual</p>
                  </div>
                  {exercise.repetitions && (
                    <div>
                      <p className="text-2xl font-bold">{currentRep}</p>
                      <p className="text-sm text-muted-foreground">Repetições</p>
                    </div>
                  )}
                  <div>
                    <p className="text-2xl font-bold text-green-600">{completedSets.length}</p>
                    <p className="text-sm text-muted-foreground">Concluídas</p>
                  </div>
                </div>

                {/* Rest Timer */}
                {isResting && (
                  <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-lg font-semibold">Descanso</p>
                    <p className="text-3xl font-bold text-yellow-600 my-2">
                      {formatTime(restTimer)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsResting(false)}
                    >
                      Pular Descanso
                    </Button>
                  </div>
                )}

                {/* Hold Timer */}
                {exercise.hold_time_seconds && !isResting && (
                  <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-lg font-semibold">Sustentação</p>
                    <p className="text-3xl font-bold text-blue-600 my-2">
                      {formatTime(holdTimer)}
                    </p>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                      >
                        {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {isTimerRunning ? 'Pausar' : 'Iniciar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHoldTimer(exercise.hold_time_seconds!)}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reiniciar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exercise Controls */}
            <div className="grid grid-cols-1 gap-3">
              {exercise.repetitions && !isResting && (
                <Button
                  onClick={handleNextRep}
                  disabled={currentRep >= exercise.repetitions}
                  variant="outline"
                  size="lg"
                >
                  <Repeat className="h-4 w-4 mr-2" />
                  Próxima Repetição ({currentRep + 1}/{exercise.repetitions})
                </Button>
              )}

              <Button
                onClick={handleCompleteSet}
                disabled={isResting}
                size="lg"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Concluir Série {currentSet}
              </Button>

              <Button
                onClick={() => setCurrentPhase('completion')}
                variant="secondary"
                size="lg"
              >
                Finalizar Exercício
              </Button>
            </div>
          </div>
        )}

        {/* Completion Phase */}
        {currentPhase === 'completion' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold">Exercício Concluído!</h3>
                <p className="text-muted-foreground">
                  Parabéns! Você completou {completedSets.length} de {exercise.sets} séries.
                </p>
              </div>

              {/* Final Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Avaliação Final</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Sets Completed */}
                  <FormField
                    control={form.control}
                    name="completed_sets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Séries completadas</FormLabel>
                        <div className="px-3">
                          <Slider
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            max={exercise.sets}
                            min={1}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-muted-foreground mt-1">
                            <span>1</span>
                            <span className="font-medium">{field.value}</span>
                            <span>{exercise.sets}</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Difficulty Rating */}
                  <FormField
                    control={form.control}
                    name="difficulty_rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Como você avalia a dificuldade? (1-5)</FormLabel>
                        <div className="flex justify-center gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Button
                              key={rating}
                              type="button"
                              variant={field.value === rating ? "default" : "outline"}
                              size="sm"
                              onClick={() => field.onChange(rating)}
                              className="w-10 h-10 p-0"
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  field.value >= rating ? 'fill-current' : ''
                                }`}
                              />
                            </Button>
                          ))}
                        </div>
                        <div className="text-center text-xs text-muted-foreground">
                          {field.value === 1 && 'Muito fácil'}
                          {field.value === 2 && 'Fácil'}
                          {field.value === 3 && 'Moderado'}
                          {field.value === 4 && 'Difícil'}
                          {field.value === 5 && 'Muito difícil'}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Pain After */}
                  <FormField
                    control={form.control}
                    name="pain_level_after"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nível de dor após o exercício (0-10)</FormLabel>
                        <div className="px-3">
                          <Slider
                            value={[field.value || 0]}
                            onValueChange={(value) => field.onChange(value[0])}
                            max={10}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0 - Sem dor</span>
                            <span className={getPainLevelColor(field.value || 0)}>
                              {field.value || 0}
                            </span>
                            <span>10 - Dor máxima</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Como você se sentiu? Teve alguma dificuldade específica?"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentPhase('execution')}
                  className="flex-1"
                >
                  Voltar ao Exercício
                </Button>
                <Button type="submit" className="flex-1">
                  <Activity className="h-4 w-4 mr-2" />
                  Registrar Execução
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}