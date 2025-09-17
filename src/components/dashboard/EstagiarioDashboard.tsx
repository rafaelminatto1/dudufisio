"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading'
import {
  Calendar,
  Users,
  GraduationCap,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Target,
  Award,
  Eye,
  FileText,
  MessageSquare
} from 'lucide-react'
import { format, isToday, isThisWeek, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface EstagiarioDashboardProps {
  patients: any[]
  appointments: any[]
  sessions: any[]
  supervisor: any
  evaluations: any[]
  learningModules: any[]
  isLoading?: boolean
}

interface EstagiarioStats {
  assignedPatients: number
  todayAppointments: number
  completedSessions: number
  pendingEvaluations: number
  supervisorFeedback: number
  learningProgress: number
}

export default function EstagiarioDashboard({
  patients,
  appointments,
  sessions,
  supervisor,
  evaluations,
  learningModules,
  isLoading = false
}: EstagiarioDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const stats = useMemo((): EstagiarioStats => {
    const todayAppointments = appointments.filter(apt =>
      isToday(parseISO(apt.appointment_date)) && apt.status === 'scheduled'
    ).length

    const completedSessions = sessions.filter(session => session.status === 'completed').length

    const pendingEvaluations = evaluations.filter(eval => eval.status === 'pending').length

    const supervisorFeedback = evaluations.filter(eval =>
      eval.supervisor_feedback && eval.status === 'completed'
    ).length

    const completedModules = learningModules.filter(module => module.completed).length
    const learningProgress = learningModules.length > 0 ? (completedModules / learningModules.length) * 100 : 0

    return {
      assignedPatients: patients.length,
      todayAppointments,
      completedSessions,
      pendingEvaluations,
      supervisorFeedback,
      learningProgress
    }
  }, [patients, appointments, sessions, evaluations, learningModules])

  const todaySchedule = useMemo(() => {
    return appointments
      .filter(apt => isToday(parseISO(apt.appointment_date)))
      .sort((a, b) => parseISO(a.appointment_date).getTime() - parseISO(b.appointment_date).getTime())
  }, [appointments])

  const recentFeedback = useMemo(() => {
    return evaluations
      .filter(eval => eval.supervisor_feedback && eval.status === 'completed')
      .sort((a, b) => parseISO(b.updated_at).getTime() - parseISO(a.updated_at).getTime())
      .slice(0, 3)
  }, [evaluations])

  const learningTasks = useMemo(() => {
    return learningModules
      .filter(module => !module.completed)
      .sort((a, b) => parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime())
      .slice(0, 5)
  }, [learningModules])

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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard do Estagiário</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu ambiente de aprendizado - {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
          </p>
          {supervisor && (
            <p className="text-sm text-muted-foreground mt-1">
              Supervisor: {supervisor.name}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contatar Supervisor
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Relatório de Estágio
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Atribuídos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignedPatients}</div>
            <p className="text-xs text-muted-foreground">
              Sob supervisão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedSessions} sessões concluídas no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingEvaluations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.supervisorFeedback} feedbacks recebidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso de Aprendizado</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.learningProgress.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              {learningModules.filter(m => m.completed).length}/{learningModules.length} módulos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
          <TabsTrigger value="learning">Aprendizado</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Agenda de Hoje */}
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Agenda de Hoje
                </CardTitle>
                <CardDescription>
                  {todaySchedule.length} atendimentos programados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {todaySchedule.length > 0 ? (
                  todaySchedule.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {format(parseISO(appointment.appointment_date), 'HH:mm', { locale: ptBR })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {patients.find(p => p.id === appointment.patient_id)?.name}
                        </p>
                      </div>
                      <Badge variant={
                        appointment.status === 'completed' ? 'default' :
                        appointment.status === 'scheduled' ? 'secondary' : 'destructive'
                      }>
                        {appointment.status === 'scheduled' ? 'Agendado' :
                         appointment.status === 'completed' ? 'Concluído' : 'Cancelado'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum atendimento hoje</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tarefas de Aprendizado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Tarefas Pendentes
                </CardTitle>
                <CardDescription>
                  Módulos de aprendizado a completar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {learningTasks.map((task) => (
                  <div key={task.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-sm">{task.title}</p>
                      <Badge variant="outline" className="text-xs">
                        {format(parseISO(task.due_date), 'dd/MM', { locale: ptBR })}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${task.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
                {learningTasks.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <CheckCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Todas as tarefas concluídas!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feedback Recente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Feedback Recente
                </CardTitle>
                <CardDescription>
                  Avaliações do supervisor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentFeedback.map((feedback) => (
                  <div key={feedback.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-sm">{feedback.patient_name}</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div key={star} className={`w-3 h-3 rounded-full ${
                            star <= feedback.rating ? 'bg-yellow-400' : 'bg-gray-200'
                          }`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {feedback.supervisor_feedback?.substring(0, 80)}...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(parseISO(feedback.updated_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                ))}
                {recentFeedback.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum feedback ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pacientes Atribuídos</CardTitle>
              <CardDescription>
                Pacientes sob sua responsabilidade (com supervisão)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patients.map((patient) => {
                  const patientAppointments = appointments.filter(apt => apt.patient_id === patient.id)
                  const nextAppointment = patientAppointments
                    .filter(apt => parseISO(apt.appointment_date) > new Date())
                    .sort((a, b) => parseISO(a.appointment_date).getTime() - parseISO(b.appointment_date).getTime())[0]

                  return (
                    <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {patient.diagnosis || 'Diagnóstico não informado'}
                          </p>
                          {nextAppointment && (
                            <p className="text-xs text-muted-foreground">
                              Próxima consulta: {format(parseISO(nextAppointment.appointment_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {patientAppointments.filter(apt => apt.status === 'completed').length} sessões
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learning" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Módulos de Aprendizado</CardTitle>
                <CardDescription>
                  Seu progresso no programa de estágio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {learningModules.map((module) => (
                  <div key={module.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{module.title}</h4>
                      <Badge variant={module.completed ? 'default' : 'secondary'}>
                        {module.completed ? 'Concluído' : 'Em Progresso'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>{module.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${module.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    {module.due_date && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Prazo: {format(parseISO(module.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Competências em Desenvolvimento</CardTitle>
                <CardDescription>
                  Habilidades avaliadas durante o estágio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { skill: 'Avaliação Postural', level: 75 },
                  { skill: 'Técnicas Manuais', level: 60 },
                  { skill: 'Prescrição de Exercícios', level: 80 },
                  { skill: 'Comunicação com Pacientes', level: 85 },
                  { skill: 'Documentação Clínica', level: 70 }
                ].map((competency) => (
                  <div key={competency.skill} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{competency.skill}</span>
                      <span className="text-sm text-muted-foreground">{competency.level}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${competency.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Avaliações</CardTitle>
              <CardDescription>
                Feedback detalhado do supervisor sobre seu desempenho
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evaluations.map((evaluation) => (
                  <div key={evaluation.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium">{evaluation.patient_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(evaluation.evaluation_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div key={star} className={`w-4 h-4 rounded-full ${
                              star <= evaluation.rating ? 'bg-yellow-400' : 'bg-gray-200'
                            }`} />
                          ))}
                        </div>
                        <Badge variant={evaluation.status === 'completed' ? 'default' : 'secondary'}>
                          {evaluation.status === 'completed' ? 'Avaliado' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>

                    {evaluation.supervisor_feedback && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium mb-1">Feedback do Supervisor:</h5>
                        <p className="text-sm text-muted-foreground">{evaluation.supervisor_feedback}</p>
                      </div>
                    )}

                    {evaluation.areas_improvement && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium mb-1">Áreas para Melhoria:</h5>
                        <p className="text-sm text-muted-foreground">{evaluation.areas_improvement}</p>
                      </div>
                    )}

                    {evaluation.strengths && (
                      <div>
                        <h5 className="text-sm font-medium mb-1">Pontos Fortes:</h5>
                        <p className="text-sm text-muted-foreground">{evaluation.strengths}</p>
                      </div>
                    )}
                  </div>
                ))}

                {evaluations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma avaliação ainda</p>
                    <p className="text-sm">As avaliações aparecerão após seus primeiros atendimentos</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}