'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Play,
  CheckCircle,
  Calendar,
  Target,
  Clock,
  Repeat,
  Timer,
  Heart,
  AlertTriangle,
  Activity,
  TrendingUp
} from 'lucide-react'
import { ExerciseExecutionModal } from '@/components/patient-portal/ExerciseExecutionModal'
import { Skeleton } from '@/components/ui/skeleton'

interface PatientPrescription {
  id: string
  name: string
  description?: string
  goals: string
  start_date: string
  expected_end_date?: string
  frequency_description: string
  general_instructions?: string
  precautions?: string
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  created_at: string
  therapist: {
    full_name: string
  }
  prescription_exercises: Array<{
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
  }>
}

interface ExerciseLog {
  id: string
  exercise_id: string
  completed_sets: number
  completed_repetitions?: number
  hold_time_used?: number
  difficulty_rating: number
  pain_level_before?: number
  pain_level_after?: number
  notes?: string
  completed_at: string
}

export default function PatientExercisesPage() {
  const [prescriptions, setPrescriptions] = useState<PatientPrescription[]>([])
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExercise, setSelectedExercise] = useState<any>(null)
  const [currentTab, setCurrentTab] = useState('active')

  useEffect(() => {
    fetchPatientPrescriptions()
    fetchExerciseLogs()
  }, [])

  const fetchPatientPrescriptions = async () => {
    try {
      // TODO: Replace with actual API call for patient's prescriptions
      const response = await fetch('/api/prescriptions?patient_only=true')
      const data = await response.json()

      if (data.success) {
        setPrescriptions(data.data.filter((p: PatientPrescription) => p.status === 'active'))
      }
    } catch (error) {
      console.error('Erro ao buscar prescrições:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExerciseLogs = async () => {
    try {
      // TODO: Replace with actual API call for patient's exercise logs
      const response = await fetch('/api/patient/exercise-logs')
      const data = await response.json()

      if (data.success) {
        setExerciseLogs(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar logs de exercícios:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getDaysRemaining = (endDate: string) => {
    const today = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const getProgressPercentage = (prescription: PatientPrescription) => {
    if (!prescription.expected_end_date) return 0

    const start = new Date(prescription.start_date)
    const end = new Date(prescription.expected_end_date)
    const today = new Date()

    if (today < start) return 0
    if (today > end) return 100

    const totalTime = end.getTime() - start.getTime()
    const elapsedTime = today.getTime() - start.getTime()

    return Math.round((elapsedTime / totalTime) * 100)
  }

  const getExerciseCompletionToday = (exerciseId: string) => {
    const today = new Date().toDateString()
    return exerciseLogs.filter(
      log => log.exercise_id === exerciseId &&
      new Date(log.completed_at).toDateString() === today
    ).length
  }

  const getExerciseCompletionThisWeek = (exerciseId: string) => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())

    return exerciseLogs.filter(
      log => log.exercise_id === exerciseId &&
      new Date(log.completed_at) >= weekStart
    ).length
  }

  const getTotalMinutesToday = () => {
    const today = new Date().toDateString()
    const todayLogs = exerciseLogs.filter(
      log => new Date(log.completed_at).toDateString() === today
    )

    return todayLogs.reduce((total, log) => {
      const exercise = prescriptions
        .flatMap(p => p.prescription_exercises)
        .find(pe => pe.exercise_id === log.exercise_id)

      return total + (exercise?.exercise.duration_minutes || 0)
    }, 0)
  }

  const getStreakDays = () => {
    // TODO: Implement streak calculation
    return 5 // Mock data
  }

  const activePrescriptions = prescriptions.filter(p => p.status === 'active')
  const completedPrescriptions = prescriptions.filter(p => p.status === 'completed')

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Exercícios</h1>
          <p className="text-muted-foreground">
            Acompanhe suas prescrições e execute seus exercícios diários
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Hoje</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalMinutesToday()}min</div>
            <p className="text-xs text-muted-foreground">
              exercícios realizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sequência</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStreakDays()}</div>
            <p className="text-xs text-muted-foreground">
              dias consecutivos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescrições Ativas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePrescriptions.length}</div>
            <p className="text-xs text-muted-foreground">
              em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedPrescriptions.length}</div>
            <p className="text-xs text-muted-foreground">
              finalizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="active">Prescrições Ativas</TabsTrigger>
          <TabsTrigger value="completed">Concluídas</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {activePrescriptions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma prescrição ativa</h3>
                <p className="text-muted-foreground text-center">
                  Você não possui prescrições ativas no momento.
                  <br />
                  Entre em contato com seu fisioterapeuta.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {activePrescriptions.map((prescription) => (
                <Card key={prescription.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{prescription.name}</CardTitle>
                        <CardDescription>
                          Prescrição criada por {prescription.therapist.full_name}
                        </CardDescription>
                        {prescription.description && (
                          <p className="text-sm text-muted-foreground">
                            {prescription.description}
                          </p>
                        )}
                      </div>

                      {prescription.expected_end_date && (
                        <div className="text-right">
                          <Badge variant="outline">
                            {getDaysRemaining(prescription.expected_end_date)} dias restantes
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Progress */}
                    {prescription.expected_end_date && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso da prescrição</span>
                          <span>{getProgressPercentage(prescription)}%</span>
                        </div>
                        <Progress value={getProgressPercentage(prescription)} className="h-2" />
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Goals */}
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Objetivos
                      </h4>
                      <p className="text-sm text-muted-foreground">{prescription.goals}</p>
                    </div>

                    {/* Frequency */}
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Frequência
                      </h4>
                      <p className="text-sm text-muted-foreground">{prescription.frequency_description}</p>
                    </div>

                    {/* General Instructions */}
                    {prescription.general_instructions && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Instruções Gerais</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {prescription.general_instructions}
                        </p>
                      </div>
                    )}

                    {/* Precautions */}
                    {prescription.precautions && (
                      <div className="bg-amber-50 border-l-4 border-amber-400 p-3">
                        <h4 className="font-medium text-amber-900 mb-1 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Precauções Importantes
                        </h4>
                        <p className="text-sm text-amber-800 whitespace-pre-wrap">
                          {prescription.precautions}
                        </p>
                      </div>
                    )}

                    <Separator />

                    {/* Exercises */}
                    <div>
                      <h4 className="font-medium mb-3">Exercícios ({prescription.prescription_exercises.length})</h4>
                      <div className="space-y-3">
                        {prescription.prescription_exercises
                          .sort((a, b) => a.priority_order - b.priority_order)
                          .map((prescriptionExercise, index) => {
                            const completedToday = getExerciseCompletionToday(prescriptionExercise.exercise_id)
                            const completedThisWeek = getExerciseCompletionThisWeek(prescriptionExercise.exercise_id)
                            const isCompletedToday = completedToday > 0

                            return (
                              <Card key={prescriptionExercise.id} className={`${isCompletedToday ? 'border-green-200 bg-green-50' : ''}`}>
                                <CardContent className="pt-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 space-y-2">
                                      <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                          {index + 1}
                                        </span>
                                        <h5 className="font-medium">{prescriptionExercise.exercise.name}</h5>
                                        {isCompletedToday && (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        )}
                                      </div>

                                      <p className="text-sm text-muted-foreground">
                                        {prescriptionExercise.exercise.description}
                                      </p>

                                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <Target className="h-4 w-4" />
                                          {prescriptionExercise.sets} séries
                                        </div>
                                        {prescriptionExercise.repetitions && (
                                          <div className="flex items-center gap-1">
                                            <Repeat className="h-4 w-4" />
                                            {prescriptionExercise.repetitions} rep.
                                          </div>
                                        )}
                                        {prescriptionExercise.hold_time_seconds && (
                                          <div className="flex items-center gap-1">
                                            <Timer className="h-4 w-4" />
                                            {prescriptionExercise.hold_time_seconds}s
                                          </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                          <Calendar className="h-4 w-4" />
                                          {prescriptionExercise.frequency_per_week}x/semana
                                        </div>
                                      </div>

                                      <div className="text-sm">
                                        <span className="text-muted-foreground">Esta semana: </span>
                                        <span className="font-medium">
                                          {completedThisWeek}/{prescriptionExercise.frequency_per_week}
                                        </span>
                                      </div>

                                      {prescriptionExercise.custom_instructions && (
                                        <div className="bg-blue-50 border-l-4 border-blue-400 p-2 text-sm">
                                          <strong>Instruções especiais:</strong> {prescriptionExercise.custom_instructions}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                      {prescriptionExercise.exercise.video_url && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(prescriptionExercise.exercise.video_url, '_blank')}
                                        >
                                          <Play className="h-4 w-4" />
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        onClick={() => setSelectedExercise(prescriptionExercise)}
                                        disabled={isCompletedToday}
                                      >
                                        {isCompletedToday ? 'Concluído' : 'Executar'}
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedPrescriptions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma prescrição concluída</h3>
                <p className="text-muted-foreground text-center">
                  Você ainda não finalizou nenhuma prescrição.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedPrescriptions.map((prescription) => (
                <Card key={prescription.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{prescription.name}</CardTitle>
                        <CardDescription>
                          Concluída em {formatDate(prescription.created_at)}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Concluída
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{prescription.goals}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Exercise Execution Modal */}
      {selectedExercise && (
        <ExerciseExecutionModal
          exercise={selectedExercise}
          open={!!selectedExercise}
          onOpenChange={(open) => !open && setSelectedExercise(null)}
          onComplete={(logData) => {
            // TODO: Save exercise log
            console.log('Exercise completed:', logData)
            setSelectedExercise(null)
            fetchExerciseLogs() // Refresh logs
          }}
        />
      )}
    </div>
  )
}