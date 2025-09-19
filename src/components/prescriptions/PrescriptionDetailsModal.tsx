'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import logger from '../../../lib/logger';
import {
  User,
  Calendar,
  Target,
  Activity,
  AlertTriangle,
  Edit,
  Copy,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Repeat
} from 'lucide-react'

interface Prescription {
  id: string
  patient_id: string
  session_id?: string
  name: string
  description?: string
  goals: string
  start_date: string
  expected_end_date?: string
  frequency_description: string
  general_instructions?: string
  precautions?: string
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  is_template: boolean
  created_at: string
  updated_at: string
  patient: {
    id: string
    name: string
    cpf: string
  }
  therapist: {
    id: string
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
    }
  }>
}

interface PrescriptionDetailsModalProps {
  prescription: Prescription
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

const STATUS_CONFIG = {
  active: { label: 'Ativo', color: 'bg-green-100 text-green-800', icon: Play },
  paused: { label: 'Pausado', color: 'bg-yellow-100 text-yellow-800', icon: Pause },
  completed: { label: 'Concluído', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle }
}

const DIFFICULTY_CONFIG = {
  'iniciante': { label: 'Iniciante', color: 'bg-green-100 text-green-800' },
  'intermediario': { label: 'Intermediário', color: 'bg-yellow-100 text-yellow-800' },
  'avancado': { label: 'Avançado', color: 'bg-red-100 text-red-800' }
}

export function PrescriptionDetailsModal({ prescription, open, onOpenChange, onUpdate }: PrescriptionDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState('overview')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getDaysRemaining = (endDate: string) => {
    const today = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getTotalWeeks = () => {
    if (!prescription.expected_end_date) return null

    const start = new Date(prescription.start_date)
    const end = new Date(prescription.expected_end_date)
    const diffTime = end.getTime() - start.getTime()
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7))
    return diffWeeks
  }

  const getProgressPercentage = () => {
    if (!prescription.expected_end_date || prescription.status !== 'active') {
      return prescription.status === 'completed' ? 100 : 0
    }

    const start = new Date(prescription.start_date)
    const end = new Date(prescription.expected_end_date)
    const today = new Date()

    if (today < start) return 0
    if (today > end) return 100

    const totalTime = end.getTime() - start.getTime()
    const elapsedTime = today.getTime() - start.getTime()

    return Math.round((elapsedTime / totalTime) * 100)
  }

  const handleStatusChange = async (newStatus: string) => {
    // TODO: Implement status update API call
    logger.info('Mudando status para:', newStatus)
  }

  const handleEdit = () => {
    // TODO: Open edit modal
    logger.info('Editando prescrição:', prescription.id)
  }

  const handleDuplicate = () => {
    // TODO: Duplicate prescription
    logger.info('Duplicando prescrição:', prescription.id)
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta prescrição?')) return

    setLoading(true)
    try {
      // TODO: Implement delete API call
      logger.info('Excluindo prescrição:', prescription.id)
    } catch (error) {
      logger.error('Erro ao excluir prescrição:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusConfig = STATUS_CONFIG[prescription.status]
  const StatusIcon = statusConfig.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-2xl">{prescription.name}</DialogTitle>
                {prescription.is_template && (
                  <Badge variant="secondary">Template</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {prescription.patient.name}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(prescription.start_date)}
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  {prescription.prescription_exercises.length} exercícios
                </div>
              </div>
              {prescription.description && (
                <DialogDescription className="text-base">
                  {prescription.description}
                </DialogDescription>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={`${statusConfig.color} flex items-center gap-1`}
              >
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
              <Button onClick={handleEdit} variant="outline" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
              <Button onClick={handleDuplicate} variant="outline" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                size="sm"
                disabled={loading}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="exercises">Exercícios</TabsTrigger>
            <TabsTrigger value="progress">Progresso</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <TabsContent value="overview" className="space-y-6">
              {/* Progress Card */}
              {prescription.expected_end_date && prescription.status === 'active' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Progresso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Progresso da prescrição</span>
                        <span>{getProgressPercentage()}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage()}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <p className="font-medium">{formatDate(prescription.start_date)}</p>
                          <p className="text-muted-foreground">Início</p>
                        </div>
                        <div>
                          <p className="font-medium">
                            {prescription.expected_end_date &&
                              getDaysRemaining(prescription.expected_end_date) > 0
                              ? `${getDaysRemaining(prescription.expected_end_date)} dias`
                              : 'Vencida'
                            }
                          </p>
                          <p className="text-muted-foreground">Restantes</p>
                        </div>
                        <div>
                          <p className="font-medium">{formatDate(prescription.expected_end_date)}</p>
                          <p className="text-muted-foreground">Término</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações da Prescrição</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Nome: </span>
                      <span className="font-medium">{prescription.name}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Paciente: </span>
                      <span className="font-medium">{prescription.patient.name}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Frequência: </span>
                      <span>{prescription.frequency_description}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Fisioterapeuta: </span>
                      <span>{prescription.therapist.full_name}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Criado em: </span>
                      <span>{formatDate(prescription.created_at)}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Última atualização: </span>
                      <span>{formatDate(prescription.updated_at)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Objetivos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {prescription.goals}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Instructions and Precautions */}
              {(prescription.general_instructions || prescription.precautions) && (
                <div className="space-y-4">
                  {prescription.general_instructions && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Instruções Gerais</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {prescription.general_instructions}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {prescription.precautions && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
                          <AlertTriangle className="h-5 w-5" />
                          Precauções
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {prescription.precautions}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="exercises" className="space-y-4">
              <div className="space-y-4">
                {prescription.prescription_exercises
                  .sort((a, b) => a.priority_order - b.priority_order)
                  .map((prescriptionExercise, index) => (
                    <Card key={prescriptionExercise.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                {index + 1}
                              </span>
                              <CardTitle className="text-lg">
                                {prescriptionExercise.exercise.name}
                              </CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {prescriptionExercise.exercise.category}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className={DIFFICULTY_CONFIG[prescriptionExercise.exercise.difficulty_level as keyof typeof DIFFICULTY_CONFIG]?.color}
                              >
                                {DIFFICULTY_CONFIG[prescriptionExercise.exercise.difficulty_level as keyof typeof DIFFICULTY_CONFIG]?.label}
                              </Badge>
                            </div>
                          </div>

                          {prescriptionExercise.exercise.video_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(prescriptionExercise.exercise.video_url, '_blank')}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Vídeo
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Exercise Description */}
                        <p className="text-sm text-muted-foreground">
                          {prescriptionExercise.exercise.description}
                        </p>

                        {/* Exercise Parameters */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted rounded-lg">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Séries</span>
                            </div>
                            <p className="font-semibold">{prescriptionExercise.sets}</p>
                          </div>

                          {prescriptionExercise.repetitions && (
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Repeat className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Repetições</span>
                              </div>
                              <p className="font-semibold">{prescriptionExercise.repetitions}</p>
                            </div>
                          )}

                          {prescriptionExercise.hold_time_seconds && (
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Sustentação</span>
                              </div>
                              <p className="font-semibold">{prescriptionExercise.hold_time_seconds}s</p>
                            </div>
                          )}

                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Frequência</span>
                            </div>
                            <p className="font-semibold">{prescriptionExercise.frequency_per_week}x/sem</p>
                          </div>
                        </div>

                        {/* Custom Instructions */}
                        {prescriptionExercise.custom_instructions && (
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                            <h4 className="font-medium text-blue-900 mb-1">Instruções Específicas</h4>
                            <p className="text-sm text-blue-800 whitespace-pre-wrap">
                              {prescriptionExercise.custom_instructions}
                            </p>
                          </div>
                        )}

                        {/* Exercise Instructions */}
                        <div>
                          <h4 className="font-medium mb-2">Como Executar</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {prescriptionExercise.exercise.instructions}
                          </p>
                        </div>

                        {/* Precautions */}
                        {prescriptionExercise.exercise.precautions && (
                          <div className="bg-amber-50 border-l-4 border-amber-400 p-3">
                            <h4 className="font-medium text-amber-900 mb-1">Precauções</h4>
                            <p className="text-sm text-amber-800 whitespace-pre-wrap">
                              {prescriptionExercise.exercise.precautions}
                            </p>
                          </div>
                        )}

                        {/* Contraindications */}
                        {prescriptionExercise.exercise.contraindications && (
                          <div className="bg-red-50 border-l-4 border-red-400 p-3">
                            <h4 className="font-medium text-red-900 mb-1">Contraindicações</h4>
                            <p className="text-sm text-red-800 whitespace-pre-wrap">
                              {prescriptionExercise.exercise.contraindications}
                            </p>
                          </div>
                        )}

                        {/* Progression Notes */}
                        {prescriptionExercise.progression_notes && (
                          <div className="bg-green-50 border-l-4 border-green-400 p-3">
                            <h4 className="font-medium text-green-900 mb-1">Notas de Progressão</h4>
                            <p className="text-sm text-green-800 whitespace-pre-wrap">
                              {prescriptionExercise.progression_notes}
                            </p>
                          </div>
                        )}

                        {/* Duration */}
                        <div className="text-sm text-muted-foreground text-center pt-2 border-t">
                          Duração do exercício: {prescriptionExercise.duration_weeks} semana(s)
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Acompanhamento de Progresso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Funcionalidade em Desenvolvimento</h3>
                    <p className="text-sm">
                      O acompanhamento de progresso será implementado na próxima versão.
                      <br />
                      Aqui você poderá ver o histórico de execução dos exercícios pelo paciente.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}