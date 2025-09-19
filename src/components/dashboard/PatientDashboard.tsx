"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { LoadingSpinner } from '@/src/components/ui/loading'
import {
  Calendar,
  FileText,
  Heart,
  Activity,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  Download,
  MessageSquare,
  Star
} from 'lucide-react'
import { format, isToday, isFuture, isPast, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PatientDashboardProps {
  patient: any
  appointments: any[]
  sessions: any[]
  prescriptions: any[]
  exerciseProgress: any[]
  isLoading?: boolean
}

interface PatientStats {
  nextAppointment: any | null
  completedSessions: number
  totalPrescriptions: number
  exerciseCompletionRate: number
  treatmentProgress: number
  pendingExercises: number
}

export default function PatientDashboard({
  patient,
  appointments,
  sessions,
  prescriptions,
  exerciseProgress,
  isLoading = false
}: PatientDashboardProps) {
  const [selectedPrescription, setSelectedPrescription] = useState<string | null>(null)

  const stats = useMemo((): PatientStats => {
    const upcomingAppointments = appointments
      .filter(apt => isFuture(parseISO(apt.appointment_date)))
      .sort((a, b) => parseISO(a.appointment_date).getTime() - parseISO(b.appointment_date).getTime())

    const nextAppointment = upcomingAppointments[0] || null

    const completedSessions = sessions.filter(session => session.status === 'completed').length

    const totalExercises = exerciseProgress.length
    const completedExercises = exerciseProgress.filter(ex => ex.completed).length
    const exerciseCompletionRate = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0

    const pendingExercises = exerciseProgress.filter(ex => !ex.completed && isFuture(parseISO(ex.due_date))).length

    // Calcular progresso do tratamento baseado em sessões completadas
    const totalSessions = sessions.length
    const treatmentProgress = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0

    return {
      nextAppointment,
      completedSessions,
      totalPrescriptions: prescriptions.length,
      exerciseCompletionRate,
      treatmentProgress,
      pendingExercises
    }
  }, [appointments, sessions, prescriptions, exerciseProgress])

  const todayExercises = useMemo(() => {
    return exerciseProgress.filter(ex => {
      const dueDate = parseISO(ex.due_date)
      return isToday(dueDate) || isPast(dueDate)
    }).sort((a, b) => parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime())
  }, [exerciseProgress])

  const recentSessions = useMemo(() => {
    return sessions
      .filter(session => session.status === 'completed')
      .sort((a, b) => parseISO(b.session_date).getTime() - parseISO(a.session_date).getTime())
      .slice(0, 3)
  }, [sessions])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Olá, {patient?.name?.split(' ')[0] || 'Paciente'}!
          </h1>
          <p className="text-muted-foreground">
            Acompanhe seu tratamento e exercícios
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Baixar Relatório
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contato
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Consulta</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.nextAppointment ? (
              <>
                <div className="text-2xl font-bold">
                  {format(parseISO(stats.nextAppointment.appointment_date), 'dd/MM', { locale: ptBR })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(stats.nextAppointment.appointment_date), 'EEEE, HH:mm', { locale: ptBR })}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">Nenhuma consulta agendada</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões Realizadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedSessions}</div>
            <p className="text-xs text-muted-foreground">
              {sessions.length} sessões no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exercícios Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingExercises}</div>
            <p className="text-xs text-muted-foreground">
              Para hoje e dias anteriores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso do Tratamento</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.treatmentProgress.toFixed(0)}%</div>
            <Progress value={stats.treatmentProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="exercises" className="space-y-4">
        <TabsList>
          <TabsTrigger value="exercises">Exercícios</TabsTrigger>
          <TabsTrigger value="appointments">Consultas</TabsTrigger>
          <TabsTrigger value="progress">Progresso</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="exercises" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Exercícios de Hoje */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Exercícios para Hoje
                </CardTitle>
                <CardDescription>
                  {todayExercises.length} exercícios programados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {todayExercises.length > 0 ? (
                  todayExercises.map((exercise, index) => (
                    <div key={exercise.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          exercise.completed ? 'bg-green-500' :
                          isPast(parseISO(exercise.due_date)) ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="font-medium">{exercise.exercise_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {exercise.sets}x{exercise.reps} - {exercise.duration}min
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {exercise.completed ? (
                          <Badge variant="secondary">Concluído</Badge>
                        ) : (
                          <Button size="sm" variant="outline">
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Iniciar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum exercício programado para hoje</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progresso dos Exercícios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Progresso Semanal
                </CardTitle>
                <CardDescription>
                  Taxa de conclusão dos exercícios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Exercícios Concluídos</span>
                    <span className="font-medium">{stats.exerciseCompletionRate.toFixed(0)}%</span>
                  </div>
                  <Progress value={stats.exerciseCompletionRate} />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {exerciseProgress.filter(ex => ex.completed).length}
                    </div>
                    <p className="text-xs text-muted-foreground">Concluídos</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.pendingExercises}
                    </div>
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  Ver Todos os Exercícios
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Prescrições Ativas */}
          <Card>
            <CardHeader>
              <CardTitle>Prescrições de Exercícios</CardTitle>
              <CardDescription>
                Planos de exercícios prescritos pelo seu fisioterapeuta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prescriptions.map((prescription) => (
                  <div key={prescription.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{prescription.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Criado em {format(parseISO(prescription.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'}>
                        {prescription.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-sm mb-3">{prescription.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {prescription.exercises?.length || 0} exercícios
                      </span>
                      <Button size="sm" variant="outline">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Próximas Consultas */}
            <Card>
              <CardHeader>
                <CardTitle>Próximas Consultas</CardTitle>
                <CardDescription>
                  Consultas agendadas nos próximos dias
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointments
                  .filter(apt => isFuture(parseISO(apt.appointment_date)))
                  .slice(0, 3)
                  .map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {format(parseISO(appointment.appointment_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(appointment.appointment_date), 'HH:mm', { locale: ptBR })} -
                          {appointment.type === 'consultation' ? ' Consulta' : ' Sessão'}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {appointment.status === 'scheduled' ? 'Agendado' : appointment.status}
                      </Badge>
                    </div>
                  ))}

                {appointments.filter(apt => isFuture(parseISO(apt.appointment_date))).length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma consulta agendada</p>
                    <Button size="sm" className="mt-2" variant="outline">
                      Agendar Consulta
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Histórico Recente */}
            <Card>
              <CardHeader>
                <CardTitle>Sessões Recentes</CardTitle>
                <CardDescription>
                  Últimas sessões realizadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentSessions.map((session) => (
                  <div key={session.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">
                          {format(parseISO(session.session_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.duration} minutos
                        </p>
                      </div>
                      <Badge variant="secondary">Concluída</Badge>
                    </div>
                    {session.notes && (
                      <p className="text-sm text-muted-foreground">{session.notes}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Tratamento</CardTitle>
              <CardDescription>
                Acompanhe seu progresso ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.completedSessions}</div>
                  <p className="text-sm text-muted-foreground">Sessões Realizadas</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {stats.exerciseCompletionRate.toFixed(0)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Taxa de Exercícios</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {stats.treatmentProgress.toFixed(0)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Progresso Geral</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Metas do Tratamento</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Frequência semanal de exercícios</span>
                    <span className="text-sm font-medium">5/7 dias</span>
                  </div>
                  <Progress value={71} />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Adesão ao tratamento</span>
                    <span className="text-sm font-medium">90%</span>
                  </div>
                  <Progress value={90} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentos e Relatórios</CardTitle>
              <CardDescription>
                Seus documentos médicos e relatórios de progresso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Relatório de Avaliação Inicial</p>
                      <p className="text-sm text-muted-foreground">01/09/2024</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Baixar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Plano de Tratamento</p>
                      <p className="text-sm text-muted-foreground">05/09/2024</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Baixar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Relatório de Progresso</p>
                      <p className="text-sm text-muted-foreground">15/09/2024</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Baixar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}