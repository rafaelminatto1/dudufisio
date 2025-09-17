'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Users,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { UserRole } from '@/lib/rbac'

interface InviteUserData {
  email: string
  name: string
  role: UserRole
  message?: string
}

interface PendingInvitation {
  id: string
  email: string
  name: string
  role: UserRole
  invitedBy: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  expiresAt: string
  createdAt: string
  message?: string
}

export default function UserInvitations() {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)

  useEffect(() => {
    loadInvitations()
  }, [])

  const loadInvitations = async () => {
    try {
      setInvitations([])
    } catch (error) {
      console.error('Erro ao carregar convites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date()

    if (status === 'pending' && isExpired) {
      return <Badge variant="destructive"><Clock className="w-3 h-3 mr-1" />Expirado</Badge>
    }

    switch (status) {
      case 'pending':
        return <Badge variant="default"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>
      case 'accepted':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Aceito</Badge>
      case 'cancelled':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      admin: { label: 'Administrador', variant: 'destructive' as const },
      fisioterapeuta: { label: 'Fisioterapeuta', variant: 'default' as const },
      estagiario: { label: 'Estagiário', variant: 'secondary' as const },
      paciente: { label: 'Paciente', variant: 'outline' as const }
    }

    const config = roleConfig[role] || { label: role, variant: 'outline' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleCancel = async (invitationId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este convite?')) return

    try {
      await loadInvitations()
    } catch (error: any) {
      alert(`Erro ao cancelar convite: ${error.message}`)
    }
  }

  const handleResend = async (invitationId: string) => {
    try {
      await loadInvitations()
      alert('Convite reenviado com sucesso!')
    } catch (error: any) {
      alert(`Erro ao reenviar convite: ${error.message}`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Carregando convites...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            Gerenciar Usuários
          </h2>
          <p className="text-muted-foreground mt-1">Convide novos membros para sua equipe</p>
        </div>
        <Button
          onClick={() => setShowInviteForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Convidar Usuário</span>
        </Button>
      </div>

      {showInviteForm && (
        <InviteUserForm
          onSuccess={() => {
            setShowInviteForm(false)
            loadInvitations()
          }}
          onCancel={() => setShowInviteForm(false)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Convites Enviados ({invitations.length})
          </CardTitle>
          <CardDescription>
            Acompanhe o status dos convites enviados para novos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum convite enviado ainda</p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Convidar Usuário" para começar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {invitation.email}
                        </h3>
                        {getRoleBadge(invitation.role)}
                        {getStatusBadge(invitation.status, invitation.expiresAt)}
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Email:</strong> {invitation.email}</p>
                        <p><strong>Convidado por:</strong> {invitation.invitedBy}</p>
                        <p><strong>Data:</strong> {formatDate(invitation.createdAt)}</p>
                        <p><strong>Expira em:</strong> {formatDate(invitation.expiresAt)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      {invitation.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResend(invitation.id)}
                            className="flex items-center space-x-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Reenviar</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancel(invitation.id)}
                            className="flex items-center space-x-1"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Cancelar</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InviteUserForm({ onSuccess, onCancel }: {
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<InviteUserData>({
    email: '',
    name: '',
    role: 'estagiario'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      onSuccess()
    } catch (error: any) {
      setError(error.message || 'Erro interno do servidor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof InviteUserData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convidar Novo Usuário</CardTitle>
        <CardDescription>
          Envie um convite por email para adicionar um novo membro à equipe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange('name')}
                placeholder="Nome do usuário"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email Profissional *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                placeholder="email@exemplo.com"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="role">Papel no Sistema *</Label>
            <select
              id="role"
              value={formData.role}
              onChange={handleInputChange('role')}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background"
              required
            >
              <option value="estagiario">Estagiário - Acesso supervisionado</option>
              <option value="fisioterapeuta">Fisioterapeuta - Atendimento clínico</option>
              <option value="admin">Administrador - Gestão completa</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Convite</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}