'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  Check,
  X,
  AlertTriangle,
  MessageCircle,
  FileText,
  Plus,
  History,
  Target,
  Activity
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

interface Appointment {
  id: string
  patient_id: string
  practitioner_id: string
  appointment_date: string
  start_time: string
  duration_minutes: number
  appointment_type: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  reminder_sent: boolean
  is_recurring: boolean
  recurrence_pattern?: string
  created_at: string
  updated_at: string
  patient: {
    id: string
    name: string
    cpf: string
    phone?: string
    email?: string
    photo_url?: string
  }
  practitioner: {
    id: string
    full_name: string
    role: string
    phone?: string
    email?: string
  }
  sessions?: Array<{
    id: string
    session_type: string
    duration_minutes: number
    status: string
    created_at: string
  }>
}

interface AppointmentNote {
  id: string
  note: string
  note_type: 'general' | 'medical' | 'administrative'
  created_at: string
  created_by: {
    full_name: string
    role: string
  }
}

const STATUS_CONFIG = {
  scheduled: { label: 'Agendado', color: 'bg-blue-100 text-blue-800' },
  confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
  in_progress: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  no_show: { label: 'Faltou', color: 'bg-gray-100 text-gray-800' }
}

const APPOINTMENT_TYPES = {
  consulta: 'Consulta',
  retorno: 'Retorno',
  avaliacao: 'Avaliação',
  fisioterapia: 'Fisioterapia',
  reavaliacao: 'Reavaliação',
  emergencia: 'Emergência'
}

export default function AppointmentDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const appointmentId = params.id as string

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [notes, setNotes] = useState<AppointmentNote[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetails()
      fetchAppointmentNotes()
    }
  }, [appointmentId])

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/appointments/${appointmentId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Agendamento não encontrado',
            description: 'O agendamento solicitado não foi encontrado',
            variant: 'destructive'
          })
          router.push('/appointments')
          return
        }
        throw new Error('Erro ao carregar agendamento')
      }

      const data = await response.json()
      setAppointment(data.data)
    } catch (error) {
      console.error('Erro ao buscar detalhes do agendamento:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes do agendamento',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAppointmentNotes = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/notes`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar notas:', error)
    }
  }

  const updateAppointmentStatus = async (newStatus: string) => {
    try {
      setUpdating(true)
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        const data = await response.json()
        setAppointment(data.data)
        toast({
          title: 'Status atualizado',
          description: `Agendamento marcado como ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label}`
        })
      } else {
        throw new Error('Erro ao atualizar status')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive'
      })
    } finally {
      setUpdating(false)
    }
  }

  const addNote = async () => {
    if (!newNote.trim()) return

    try {
      const response = await fetch(`/api/appointments/${appointmentId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: newNote,
          note_type: 'general'
        })
      })

      if (response.ok) {
        setNewNote('')
        fetchAppointmentNotes()
        toast({
          title: 'Nota adicionada',
          description: 'A nota foi salva com sucesso'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a nota',
        variant: 'destructive'
      })
    }
  }

  const cancelAppointment = async () => {
    await updateAppointmentStatus('cancelled')
    setShowCancelDialog(false)
  }

  const createSession = () => {
    if (appointment) {
      router.push(`/patients/${appointment.patient_id}?create_session=true&appointment_id=${appointmentId}`)
    }
  }

  const formatDateTime = (date: string, time: string) => {
    const dateTime = new Date(`${date}T${time}`)
    return {
      date: dateTime.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: dateTime.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  }

  const getStatusActions = (status: string) => {
    switch (status) {
      case 'scheduled':
        return [
          { label: 'Confirmar', action: () => updateAppointmentStatus('confirmed'), variant: 'default' },
          { label: 'Cancelar', action: () => setShowCancelDialog(true), variant: 'destructive' }
        ]
      case 'confirmed':
        return [
          { label: 'Iniciar Atendimento', action: () => updateAppointmentStatus('in_progress'), variant: 'default' },
          { label: 'Reagendar', action: () => setShowRescheduleDialog(true), variant: 'outline' },
          { label: 'Cancelar', action: () => setShowCancelDialog(true), variant: 'destructive' }
        ]
      case 'in_progress':
        return [
          { label: 'Finalizar', action: () => updateAppointmentStatus('completed'), variant: 'default' },
          { label: 'Nova Sessão', action: createSession, variant: 'outline' }
        ]
      case 'completed':
        return [
          { label: 'Nova Sessão', action: createSession, variant: 'outline' }
        ]
      default:
        return []
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-20" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Agendamento não encontrado ou você não tem permissão para visualizá-lo.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const dateTime = formatDateTime(appointment.appointment_date, appointment.start_time)
  const statusConfig = STATUS_CONFIG[appointment.status]
  const appointmentTypeLabel = APPOINTMENT_TYPES[appointment.appointment_type as keyof typeof APPOINTMENT_TYPES]
  const actions = getStatusActions(appointment.status)

  return (
    <div className="container mx-auto py-6 space-y-6">
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
            <h1 className="text-3xl font-bold">Detalhes do Agendamento</h1>
            <p className="text-muted-foreground">
              {appointmentTypeLabel} • {appointment.patient.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className={statusConfig?.color}>
            {statusConfig?.label}
          </Badge>
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant as any}
              size="sm"
              onClick={action.action}
              disabled={updating}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informações do Agendamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Data</Label>
                  <p className="text-lg font-medium">{dateTime.date}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Horário</Label>
                  <p className="text-lg font-medium">{dateTime.time}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Duração</Label>
                  <p className="text-lg font-medium">{appointment.duration_minutes} minutos</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tipo</Label>
                  <p className="text-lg font-medium">{appointmentTypeLabel}</p>
                </div>
              </div>

              {appointment.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">
                    {appointment.notes}
                  </p>
                </div>
              )}

              {appointment.is_recurring && (
                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    Este é um agendamento recorrente ({appointment.recurrence_pattern}).
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Sessões Relacionadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointment.sessions && appointment.sessions.length > 0 ? (
                <div className="space-y-3">
                  {appointment.sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium capitalize">{session.session_type}</h4>
                        <p className="text-sm text-muted-foreground">
                          {session.duration_minutes} min • {new Date(session.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{session.status}</Badge>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma sessão registrada</p>
                  {appointment.status === 'in_progress' || appointment.status === 'completed' ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={createSession}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Sessão
                    </Button>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes and Communication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Notas e Comunicações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new note */}
              <div className="space-y-2">
                <Label htmlFor="new-note">Adicionar Nota</Label>
                <Textarea
                  id="new-note"
                  placeholder="Escreva uma nota sobre este agendamento..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={addNote}
                  disabled={!newNote.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Nota
                </Button>
              </div>

              <Separator />

              {/* Notes list */}
              <div className="space-y-3">
                {notes.length > 0 ? (
                  notes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <p className="text-sm">{note.note}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{note.created_by.full_name}</span>
                            <span>•</span>
                            <span>{note.created_by.role}</span>
                            <span>•</span>
                            <span>{new Date(note.created_at).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {note.note_type}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhuma nota adicionada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                {appointment.patient.photo_url ? (
                  <img
                    src={appointment.patient.photo_url}
                    alt={appointment.patient.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-500" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{appointment.patient.name}</h3>
                  <p className="text-sm text-muted-foreground">{appointment.patient.cpf}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                {appointment.patient.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{appointment.patient.phone}</span>
                  </div>
                )}
                {appointment.patient.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{appointment.patient.email}</span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push(`/patients/${appointment.patient_id}`)}
              >
                Ver Prontuário
              </Button>
            </CardContent>
          </Card>

          {/* Practitioner Info */}
          <Card>
            <CardHeader>
              <CardTitle>Profissional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-medium">{appointment.practitioner.full_name}</h3>
                <p className="text-sm text-muted-foreground capitalize">{appointment.practitioner.role}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                {appointment.practitioner.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{appointment.practitioner.phone}</span>
                  </div>
                )}
                {appointment.practitioner.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{appointment.practitioner.email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push(`/appointments/new?patient_id=${appointment.patient_id}`)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Agendamento
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push(`/appointments?patient_id=${appointment.patient_id}`)}
              >
                <History className="h-4 w-4 mr-2" />
                Histórico do Paciente
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push(`/patients/${appointment.patient_id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Paciente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Agendamento</DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Não, manter
            </Button>
            <Button variant="destructive" onClick={cancelAppointment} disabled={updating}>
              Sim, cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reagendar</DialogTitle>
            <DialogDescription>
              Funcionalidade de reagendamento será implementada em breve.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowRescheduleDialog(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}