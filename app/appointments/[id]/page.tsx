'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Calendar, Clock, User, MapPin, Phone, Mail, FileText, Edit, Trash2, ArrowLeft, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AppointmentBookingModal } from '@/components/appointments/AppointmentBookingModal'
import { SmartRescheduleModal } from '@/components/appointments/SmartRescheduleModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Appointment {
  id: string
  patient_id: string
  practitioner_id: string
  appointment_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  appointment_type: string
  status: string
  notes?: string
  reminder_sent: boolean
  is_recurring: boolean
  recurrence_pattern?: string
  recurrence_count?: number
  created_at: string
  updated_at: string
  patient: {
    id: string
    name: string
    phone?: string
    email?: string
  }
  practitioner: {
    id: string
    full_name: string
    role: string
  }
}

const STATUS_LABELS = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  falta: 'Falta'
}

const STATUS_COLORS = {
  agendado: 'bg-blue-100 text-blue-800',
  confirmado: 'bg-green-100 text-green-800',
  em_andamento: 'bg-yellow-100 text-yellow-800',
  concluido: 'bg-gray-100 text-gray-800',
  cancelado: 'bg-red-100 text-red-800',
  falta: 'bg-orange-100 text-orange-800'
}

const TYPE_LABELS = {
  consulta: 'Consulta',
  retorno: 'Retorno',
  avaliacao: 'Avaliação',
  fisioterapia: 'Fisioterapia',
  reavaliacao: 'Reavaliação',
  emergencia: 'Emergência'
}

export default function AppointmentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const appointmentId = params.id as string

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchAppointment()
  }, [appointmentId])

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setAppointment(result.data)
      } else {
        toast({
          title: 'Erro ao carregar agendamento',
          description: result.error || 'Não foi possível carregar os dados',
          variant: 'destructive'
        })
        router.push('/appointments')
      }
    } catch (error) {
      console.error('Error fetching appointment:', error)
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor',
        variant: 'destructive'
      })
      router.push('/appointments')
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (status: string) => {
    if (!appointment) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setAppointment(prev => prev ? { ...prev, status } : null)
        toast({
          title: 'Status atualizado',
          description: `Agendamento marcado como ${STATUS_LABELS[status as keyof typeof STATUS_LABELS]}`
        })
      } else {
        throw new Error(result.error || 'Erro ao atualizar status')
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setUpdating(false)
    }
  }

  const deleteAppointment = async () => {
    if (!appointment) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Agendamento cancelado',
          description: 'O agendamento foi cancelado com sucesso'
        })
        router.push('/appointments')
      } else {
        throw new Error(result.error || 'Erro ao cancelar agendamento')
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao cancelar agendamento',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <LoadingSpinner size="lg" text="Carregando agendamento..." />
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Agendamento não encontrado</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.start_time}`)
  const canEdit = ['agendado', 'confirmado'].includes(appointment.status)
  const canComplete = ['confirmado', 'em_andamento'].includes(appointment.status)
  const canStart = appointment.status === 'confirmado'

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalhes do Agendamento</h1>
            <p className="text-muted-foreground">
              {TYPE_LABELS[appointment.appointment_type as keyof typeof TYPE_LABELS]} • {appointment.patient.name}
            </p>
          </div>
        </div>
        <Badge className={STATUS_COLORS[appointment.status as keyof typeof STATUS_COLORS]}>
          {STATUS_LABELS[appointment.status as keyof typeof STATUS_LABELS]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Informações do Agendamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data</label>
                  <p className="text-lg">{appointmentDateTime.toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Horário</label>
                  <p className="text-lg flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {appointment.start_time} - {appointment.end_time}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Duração</label>
                  <p className="text-lg">{appointment.duration_minutes} minutos</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <p className="text-lg">{TYPE_LABELS[appointment.appointment_type as keyof typeof TYPE_LABELS]}</p>
                </div>
              </div>

              {appointment.is_recurring && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Agendamento Recorrente</p>
                  <p className="text-sm text-blue-700">
                    Padrão: {appointment.recurrence_pattern} •
                    {appointment.recurrence_count} ocorrências
                  </p>
                </div>
              )}

              {appointment.notes && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-muted-foreground">Observações</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">{appointment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informações do Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="text-lg">{appointment.patient.name}</p>
                </div>
                {appointment.patient.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{appointment.patient.phone}</span>
                  </div>
                )}
                {appointment.patient.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{appointment.patient.email}</span>
                  </div>
                )}
              </div>
              <Separator className="my-4" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/patients/${appointment.patient.id}`)}
              >
                Ver Prontuário Completo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canStart && (
                <Button
                  className="w-full"
                  onClick={() => updateAppointmentStatus('em_andamento')}
                  disabled={updating}
                >
                  Iniciar Atendimento
                </Button>
              )}

              {canComplete && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => updateAppointmentStatus('concluido')}
                  disabled={updating}
                >
                  Marcar como Concluído
                </Button>
              )}

              {canEdit && (
                <>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setEditModalOpen(true)}
                    disabled={updating}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Agendamento
                  </Button>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setRescheduleModalOpen(true)}
                    disabled={updating}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Reagendamento Inteligente
                  </Button>
                </>
              )}

              {appointment.status === 'agendado' && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => updateAppointmentStatus('confirmado')}
                  disabled={updating}
                >
                  Confirmar Agendamento
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full"
                    variant="destructive"
                    disabled={updating}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancelar Agendamento
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteAppointment}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Sim, Cancelar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Practitioner Info */}
          <Card>
            <CardHeader>
              <CardTitle>Profissional Responsável</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{appointment.practitioner.full_name}</p>
                <Badge variant="secondary">{appointment.practitioner.role}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Reminder Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status de Lembrete</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${appointment.reminder_sent ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm">
                  {appointment.reminder_sent ? 'Lembrete enviado' : 'Lembrete não enviado'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <AppointmentBookingModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => {
          setEditModalOpen(false)
          fetchAppointment()
        }}
        editingAppointment={appointment}
      />

      {/* Smart Reschedule Modal */}
      <SmartRescheduleModal
        open={rescheduleModalOpen}
        onOpenChange={setRescheduleModalOpen}
        appointment={appointment}
        onSuccess={() => {
          setRescheduleModalOpen(false)
          fetchAppointment()
        }}
      />
    </div>
  )
}