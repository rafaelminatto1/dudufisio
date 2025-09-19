'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Clock, User, Phone, Calendar, Plus, Trash2, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface WaitingListEntry {
  id: string
  patient_id: string
  practitioner_id: string
  appointment_type: string
  preferred_date?: string
  preferred_time?: string
  notes?: string
  priority: 'low' | 'medium' | 'high'
  status: 'waiting' | 'contacted' | 'scheduled' | 'cancelled'
  created_at: string
  patient: {
    id: string
    name: string
    phone: string
    email?: string
  }
  practitioner: {
    id: string
    full_name: string
  }
}

interface WaitingListModalProps {
  isOpen: boolean
  onClose: () => void
  onSchedule: (entryId: string) => void
}

export function WaitingListModal({ isOpen, onClose, onSchedule }: WaitingListModalProps) {
  const { toast } = useToast()
  const [entries, setEntries] = useState<WaitingListEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    patient_id: '',
    practitioner_id: '',
    appointment_type: '',
    preferred_date: '',
    preferred_time: '',
    notes: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  })
  const [patients, setPatients] = useState<Array<{ id: string; name: string; phone: string }>>([])
  const [practitioners, setPractitioners] = useState<Array<{ id: string; full_name: string }>>([])

  useEffect(() => {
    if (isOpen) {
      fetchWaitingList()
      fetchPatients()
      fetchPractitioners()
    }
  }, [isOpen])

  const fetchWaitingList = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/appointments/waiting-list')
      const data = await response.json()
      
      if (response.ok) {
        setEntries(data.data || [])
      } else {
        throw new Error(data.error || 'Erro ao carregar lista de espera')
      }
    } catch (error: any) {
      console.error('Erro ao carregar lista de espera:', error)
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients?limit=100')
      const data = await response.json()
      
      if (response.ok) {
        setPatients(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
    }
  }

  const fetchPractitioners = async () => {
    try {
      const response = await fetch('/api/practitioners?limit=100')
      const data = await response.json()
      
      if (response.ok) {
        setPractitioners(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error)
    }
  }

  const handleAddEntry = async () => {
    try {
      const response = await fetch('/api/appointments/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Entrada adicionada à lista de espera'
        })
        setShowAddForm(false)
        setFormData({
          patient_id: '',
          practitioner_id: '',
          appointment_type: '',
          preferred_date: '',
          preferred_time: '',
          notes: '',
          priority: 'medium'
        })
        fetchWaitingList()
      } else {
        throw new Error(data.error || 'Erro ao adicionar à lista de espera')
      }
    } catch (error: any) {
      console.error('Erro ao adicionar à lista de espera:', error)
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleRemoveEntry = async (entryId: string) => {
    try {
      const response = await fetch(`/api/appointments/waiting-list/${entryId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Entrada removida da lista de espera'
        })
        fetchWaitingList()
      } else {
        throw new Error(data.error || 'Erro ao remover da lista de espera')
      }
    } catch (error: any) {
      console.error('Erro ao remover da lista de espera:', error)
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'default'
      case 'contacted': return 'secondary'
      case 'scheduled': return 'success'
      case 'cancelled': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lista de Espera
          </DialogTitle>
          <DialogDescription>
            Gerencie pacientes em lista de espera para agendamentos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Entradas da Lista de Espera</h3>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nova Entrada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patient_id">Paciente</Label>
                    <Select value={formData.patient_id} onValueChange={(value) => setFormData(prev => ({ ...prev, patient_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map(patient => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name} - {patient.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="practitioner_id">Profissional</Label>
                    <Select value={formData.practitioner_id} onValueChange={(value) => setFormData(prev => ({ ...prev, practitioner_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um profissional" />
                      </SelectTrigger>
                      <SelectContent>
                        {practitioners.map(practitioner => (
                          <SelectItem key={practitioner.id} value={practitioner.id}>
                            {practitioner.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="appointment_type">Tipo de Atendimento</Label>
                    <Select value={formData.appointment_type} onValueChange={(value) => setFormData(prev => ({ ...prev, appointment_type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consulta">Consulta</SelectItem>
                        <SelectItem value="retorno">Retorno</SelectItem>
                        <SelectItem value="avaliacao">Avaliação</SelectItem>
                        <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                        <SelectItem value="reavaliacao">Reavaliação</SelectItem>
                        <SelectItem value="emergencia">Emergência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="preferred_date">Data Preferida</Label>
                    <Input
                      id="preferred_date"
                      type="date"
                      value={formData.preferred_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferred_date: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="preferred_time">Horário Preferido</Label>
                    <Input
                      id="preferred_time"
                      type="time"
                      value={formData.preferred_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferred_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Observações sobre a preferência do paciente..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddEntry}>
                    Adicionar à Lista
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-4">Carregando lista de espera...</div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma entrada na lista de espera
              </div>
            ) : (
              entries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{entry.patient.name}</span>
                          <Badge variant={getPriorityColor(entry.priority)} className="text-xs">
                            {entry.priority === 'high' && 'Alta'}
                            {entry.priority === 'medium' && 'Média'}
                            {entry.priority === 'low' && 'Baixa'}
                          </Badge>
                          <Badge variant={getStatusColor(entry.status)} className="text-xs">
                            {entry.status === 'waiting' && 'Aguardando'}
                            {entry.status === 'contacted' && 'Contatado'}
                            {entry.status === 'scheduled' && 'Agendado'}
                            {entry.status === 'cancelled' && 'Cancelado'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {entry.patient.phone}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {entry.practitioner.full_name}
                          </div>
                        </div>

                        <div className="text-sm">
                          <span className="font-medium">Tipo:</span> {entry.appointment_type}
                          {entry.preferred_date && (
                            <span className="ml-4">
                              <span className="font-medium">Data preferida:</span> {format(new Date(entry.preferred_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          )}
                          {entry.preferred_time && (
                            <span className="ml-4">
                              <span className="font-medium">Horário preferido:</span> {entry.preferred_time}
                            </span>
                          )}
                        </div>

                        {entry.notes && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Observações:</span> {entry.notes}
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Adicionado em {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {entry.status === 'waiting' && (
                          <Button
                            size="sm"
                            onClick={() => onSchedule(entry.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Agendar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveEntry(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
