"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading'
import {
  Shield,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  UserX
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ConsentType, ConsentRecord, DataExportRequest, DataDeletionRequest, lgpdCompliance, lgpdUtils } from '@/lib/lgpd'

interface ConsentManagerProps {
  userId: string
  isOwnData?: boolean
  onConsentChange?: (consentType: ConsentType, granted: boolean) => void
}

interface ConsentStatus {
  type: ConsentType
  granted: boolean
  grantedAt?: Date
  revokedAt?: Date
  description: string
  required: boolean
}

export default function ConsentManager({
  userId,
  isOwnData = true,
  onConsentChange
}: ConsentManagerProps) {
  const [consents, setConsents] = useState<ConsentStatus[]>([])
  const [exportRequests, setExportRequests] = useState<DataExportRequest[]>([])
  const [deletionRequests, setDeletionRequests] = useState<DataDeletionRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const consentTypes: Array<{
    type: ConsentType
    title: string
    description: string
    required: boolean
  }> = [
    {
      type: 'data_processing',
      title: 'Processamento de Dados',
      description: 'Permite o processamento dos seus dados pessoais para prestação dos serviços de fisioterapia.',
      required: true
    },
    {
      type: 'medical_treatment',
      title: 'Tratamento Médico',
      description: 'Autoriza o tratamento médico e documentação do seu histórico de saúde.',
      required: true
    },
    {
      type: 'photo_video_recording',
      title: 'Fotos e Vídeos',
      description: 'Permite a captura de fotos e vídeos para documentação médica e exercícios.',
      required: false
    },
    {
      type: 'marketing_communications',
      title: 'Comunicações de Marketing',
      description: 'Autoriza o envio de comunicações promocionais e informativos sobre saúde.',
      required: false
    },
    {
      type: 'data_sharing',
      title: 'Compartilhamento de Dados',
      description: 'Permite o compartilhamento de dados com outros profissionais de saúde quando necessário.',
      required: false
    },
    {
      type: 'analytics',
      title: 'Análises e Melhorias',
      description: 'Permite o uso de dados anonimizados para análises e melhorias do serviço.',
      required: false
    }
  ]

  useEffect(() => {
    loadConsentData()
  }, [userId])

  const loadConsentData = async () => {
    setIsLoading(true)
    try {
      // Load current consents (this would come from your API)
      const consentData: ConsentStatus[] = await Promise.all(
        consentTypes.map(async (consentType) => {
          const hasConsent = await lgpdCompliance.hasValidConsent(userId, consentType.type)
          return {
            type: consentType.type,
            granted: hasConsent,
            description: consentType.description,
            required: consentType.required
          }
        })
      )

      setConsents(consentData)

      // Load export requests (mock data for demo)
      setExportRequests([
        {
          id: '1',
          user_id: userId,
          requested_by: userId,
          request_date: new Date('2024-09-10'),
          completion_date: new Date('2024-09-11'),
          status: 'completed',
          export_format: 'json',
          data_types: ['profile', 'appointments', 'sessions'],
          download_url: 'https://example.com/export.json',
          expires_at: new Date('2024-10-11')
        }
      ])

      // Load deletion requests (mock data for demo)
      setDeletionRequests([])

    } catch (error) {
      console.error('Failed to load consent data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConsentChange = async (consentType: ConsentType, granted: boolean) => {
    setActionLoading(consentType)
    try {
      if (granted) {
        const purpose = consentTypes.find(c => c.type === consentType)?.description || 'Prestação de serviços'
        await lgpdCompliance.recordConsent(
          userId,
          consentType,
          true,
          purpose,
          'consent'
        )
      } else {
        await lgpdCompliance.revokeConsent(userId, consentType)
      }

      // Update local state
      setConsents(prev => prev.map(consent =>
        consent.type === consentType
          ? { ...consent, granted, grantedAt: granted ? new Date() : consent.grantedAt, revokedAt: granted ? undefined : new Date() }
          : consent
      ))

      onConsentChange?.(consentType, granted)
    } catch (error) {
      console.error('Failed to update consent:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDataExport = async (format: 'json' | 'pdf' | 'csv' = 'json') => {
    setActionLoading('export')
    try {
      await lgpdCompliance.requestDataExport(userId, userId, format)
      await loadConsentData() // Reload to show new request
    } catch (error) {
      console.error('Failed to request data export:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDataDeletion = async () => {
    setActionLoading('delete')
    try {
      await lgpdCompliance.requestDataDeletion(
        userId,
        userId,
        'User requested account deletion'
      )
      await loadConsentData() // Reload to show new request
    } catch (error) {
      console.error('Failed to request data deletion:', error)
    } finally {
      setActionLoading(null)
    }
  }

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
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold">Privacidade e Proteção de Dados</h2>
          <p className="text-muted-foreground">
            Gerencie suas preferências de privacidade conforme a Lei Geral de Proteção de Dados (LGPD)
          </p>
        </div>
      </div>

      {/* Important Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Alguns consentimentos são obrigatórios para a prestação dos serviços de fisioterapia e não podem ser revogados.
          Você pode revogar consentimentos opcionais a qualquer momento.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="consents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="consents">Consentimentos</TabsTrigger>
          <TabsTrigger value="data-requests">Solicitações de Dados</TabsTrigger>
          <TabsTrigger value="privacy-notice">Aviso de Privacidade</TabsTrigger>
        </TabsList>

        <TabsContent value="consents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consentimentos Ativos</CardTitle>
              <CardDescription>
                Gerencie quais dados você autoriza que sejam processados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {consents.map((consent) => {
                const consentInfo = consentTypes.find(c => c.type === consent.type)
                if (!consentInfo) return null

                return (
                  <div key={consent.type} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{consentInfo.title}</h4>
                        {consent.required && (
                          <Badge variant="secondary">Obrigatório</Badge>
                        )}
                        {consent.granted ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {consent.description}
                      </p>
                      {consent.grantedAt && (
                        <p className="text-xs text-muted-foreground">
                          Autorizado em: {format(consent.grantedAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      )}
                      {consent.revokedAt && (
                        <p className="text-xs text-red-600">
                          Revogado em: {format(consent.revokedAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={consent.granted}
                        disabled={consent.required || actionLoading === consent.type}
                        onCheckedChange={(checked) => handleConsentChange(consent.type, checked)}
                      />
                      {actionLoading === consent.type && (
                        <LoadingSpinner size="sm" />
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-requests" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Data Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Exportar Dados
                </CardTitle>
                <CardDescription>
                  Solicite uma cópia de todos os seus dados pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Você tem o direito de receber uma cópia de todos os seus dados pessoais que processamos.
                  O arquivo será disponibilizado por 30 dias.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDataExport('json')}
                    disabled={actionLoading === 'export'}
                  >
                    {actionLoading === 'export' ? <LoadingSpinner size="sm" /> : <Download className="h-4 w-4" />}
                    JSON
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDataExport('pdf')}
                    disabled={actionLoading === 'export'}
                  >
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDataExport('csv')}
                    disabled={actionLoading === 'export'}
                  >
                    CSV
                  </Button>
                </div>

                {/* Export History */}
                {exportRequests.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium">Exportações Recentes</h5>
                    {exportRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="text-sm font-medium">
                            {format(request.request_date, 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {request.export_format.toUpperCase()} - {request.status}
                          </p>
                        </div>
                        {request.download_url && request.status === 'completed' && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={request.download_url} target="_blank" rel="noopener noreferrer">
                              Baixar
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data Deletion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  Excluir Dados
                </CardTitle>
                <CardDescription>
                  Solicite a exclusão dos seus dados pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Atenção:</strong> Dados médicos podem ser mantidos por período legal obrigatório.
                    Alguns dados serão anonimizados ao invés de excluídos.
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground">
                  Você tem o direito de solicitar a exclusão dos seus dados pessoais.
                  Esta ação não pode ser desfeita.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDataDeletion}
                  disabled={actionLoading === 'delete'}
                >
                  {actionLoading === 'delete' ? <LoadingSpinner size="sm" /> : <UserX className="h-4 w-4" />}
                  Solicitar Exclusão
                </Button>

                {/* Deletion History */}
                {deletionRequests.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium">Solicitações de Exclusão</h5>
                    {deletionRequests.map((request) => (
                      <div key={request.id} className="p-3 border rounded">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {format(request.request_date, 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                          <Badge variant={
                            request.status === 'completed' ? 'default' :
                            request.status === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {request.status}
                          </Badge>
                        </div>
                        {request.reason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {request.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="privacy-notice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Aviso de Privacidade
              </CardTitle>
              <CardDescription>
                Como coletamos, usamos e protegemos seus dados pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(() => {
                const notice = lgpdCompliance.getPrivacyNotice()
                return (
                  <>
                    <div>
                      <h4 className="font-semibold mb-2">Finalidade do Tratamento</h4>
                      <p className="text-sm text-muted-foreground">{notice.purpose}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Base Legal</h4>
                      <p className="text-sm text-muted-foreground">{notice.legalBasis}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Tipos de Dados Coletados</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {notice.dataTypes.map((dataType, index) => (
                          <li key={index} className="text-sm text-muted-foreground">{dataType}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Período de Retenção</h4>
                      <p className="text-sm text-muted-foreground">{notice.retention}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Seus Direitos</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {notice.rights.map((right, index) => (
                          <li key={index} className="text-sm text-muted-foreground">{right}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Contato</h4>
                      <p className="text-sm text-muted-foreground">{notice.contact}</p>
                    </div>

                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Esta aplicação está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)
                        e as regulamentações do Conselho Federal de Fisioterapia e Terapia Ocupacional (COFFITO).
                      </AlertDescription>
                    </Alert>
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}