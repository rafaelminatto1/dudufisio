/**
 * LGPD Self-Service Portal
 * Allows patients to manage their data according to LGPD rights
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import logger from '../../../lib/logger';
import {
  Download,
  Shield,
  FileText,
  Trash2,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info
} from 'lucide-react'

interface DataExportRequest {
  id: string
  type: 'complete' | 'specific'
  categories: string[]
  status: 'pending' | 'processing' | 'ready' | 'expired'
  requestedAt: string
  expiresAt: string
  downloadUrl?: string
}

interface DataDeletionRequest {
  id: string
  reason: string
  status: 'pending' | 'confirmed' | 'processing' | 'completed'
  requestedAt: string
  completionDate?: string
}

export default function LGPDPortalPage() {
  const [exportRequests, setExportRequests] = useState<DataExportRequest[]>([
    {
      id: '1',
      type: 'complete',
      categories: [],
      status: 'ready',
      requestedAt: '2025-01-10T10:00:00Z',
      expiresAt: '2025-01-17T10:00:00Z',
      downloadUrl: '/api/lgpd/export/download/1'
    }
  ])

  const [deletionRequests, setDeletionRequests] = useState<DataDeletionRequest[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [deletionReason, setDeletionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const dataCategories = [
    { id: 'personal', name: 'Dados Pessoais', description: 'Nome, CPF, endereço, telefone' },
    { id: 'medical', name: 'Dados Médicos', description: 'Prontuário, histórico de consultas, diagnósticos' },
    { id: 'appointments', name: 'Agendamentos', description: 'Histórico de agendamentos e consultas' },
    { id: 'prescriptions', name: 'Prescrições', description: 'Exercícios prescritos e evolução' },
    { id: 'photos', name: 'Fotos e Imagens', description: 'Fotos do paciente e documentos' },
    { id: 'communications', name: 'Comunicações', description: 'E-mails e mensagens trocadas' }
  ]

  const handleExportRequest = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/lgpd/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedCategories.length === 0 ? 'complete' : 'specific',
          categories: selectedCategories
        })
      })

      if (response.ok) {
        const newRequest = await response.json()
        setExportRequests(prev => [newRequest, ...prev])
        setSelectedCategories([])
      }
    } catch (error) {
      logger.error('Export request failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletionRequest = async () => {
    if (!deletionReason.trim()) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/lgpd/deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: deletionReason
        })
      })

      if (response.ok) {
        const newRequest = await response.json()
        setDeletionRequests(prev => [newRequest, ...prev])
        setDeletionReason('')
      }
    } catch (error) {
      logger.error('Deletion request failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      processing: 'secondary',
      ready: 'default',
      expired: 'destructive',
      completed: 'default',
      confirmed: 'secondary'
    } as const

    const labels = {
      pending: 'Pendente',
      processing: 'Processando',
      ready: 'Pronto',
      expired: 'Expirado',
      completed: 'Concluído',
      confirmed: 'Confirmado'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          Portal LGPD
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seus dados pessoais conforme seus direitos na Lei Geral de Proteção de Dados
        </p>
      </div>

      {/* LGPD Rights Information */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Seus Direitos LGPD
          </CardTitle>
          <CardDescription>
            A Lei Geral de Proteção de Dados (LGPD) garante os seguintes direitos sobre seus dados pessoais:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Acesso aos Dados</h4>
                  <p className="text-sm text-muted-foreground">
                    Consultar quais dados pessoais são tratados
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Download className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Portabilidade</h4>
                  <p className="text-sm text-muted-foreground">
                    Receber seus dados em formato estruturado
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Correção</h4>
                  <p className="text-sm text-muted-foreground">
                    Solicitar correção de dados incompletos ou incorretos
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Trash2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Eliminação</h4>
                  <p className="text-sm text-muted-foreground">
                    Solicitar a exclusão de dados desnecessários
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Export Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportação de Dados
          </CardTitle>
          <CardDescription>
            Solicite uma cópia de seus dados pessoais em formato estruturado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Category Selection */}
          <div>
            <Label className="text-base font-medium">Categorias de Dados</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Selecione as categorias específicas ou deixe em branco para exportar todos os dados
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {dataCategories.map((category) => (
                <div key={category.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCategories(prev => [...prev, category.id])
                      } else {
                        setSelectedCategories(prev => prev.filter(id => id !== category.id))
                      }
                    }}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor={category.id} className="font-medium cursor-pointer">
                      {category.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleExportRequest}
            disabled={isSubmitting}
            className="w-full md:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Processando...' : 'Solicitar Exportação'}
          </Button>

          {/* Export Requests History */}
          {exportRequests.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Solicitações de Exportação</h4>
              <div className="space-y-3">
                {exportRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {request.type === 'complete' ? 'Dados Completos' : 'Dados Específicos'}
                          </span>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Solicitado em {new Date(request.requestedAt).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Expira em {new Date(request.expiresAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {request.status === 'ready' && request.downloadUrl && (
                        <Button size="sm" asChild>
                          <a href={request.downloadUrl} download>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Deletion Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Eliminação de Dados
          </CardTitle>
          <CardDescription>
            Solicite a exclusão de seus dados pessoais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> A eliminação de dados é irreversível. Dados necessários para
              cumprimento de obrigações legais ou regulamentares serão mantidos conforme exigido por lei.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="deletion-reason">Motivo da Solicitação</Label>
            <Textarea
              id="deletion-reason"
              placeholder="Descreva o motivo para a eliminação de seus dados..."
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            onClick={handleDeletionRequest}
            disabled={isSubmitting || !deletionReason.trim()}
            variant="destructive"
            className="w-full md:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Processando...' : 'Solicitar Eliminação'}
          </Button>

          {/* Deletion Requests History */}
          {deletionRequests.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Solicitações de Eliminação</h4>
              <div className="space-y-3">
                {deletionRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Eliminação de Dados</span>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Solicitado em {new Date(request.requestedAt).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-sm">
                          <strong>Motivo:</strong> {request.reason}
                        </p>
                        {request.completionDate && (
                          <p className="text-sm text-muted-foreground">
                            Concluído em {new Date(request.completionDate).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Precisa de Ajuda?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Se você tiver dúvidas sobre seus direitos LGPD ou precisar de assistência, entre em contato:
          </p>
          <div className="space-y-2 text-sm">
            <p><strong>E-mail:</strong> lgpd@fisioflow.com.br</p>
            <p><strong>Telefone:</strong> (11) 1234-5678</p>
            <p><strong>Horário:</strong> Segunda a sexta, 8h às 18h</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}