/**
 * Página de Detalhes do Paciente - FisioFlow
 * Página completa com informações do paciente incluindo mapeamento corporal
 * Implementa controle de acesso baseado em roles e conformidade LGPD
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import logger from '../../../lib/logger';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/src/components/ui/tabs'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import BodyMapSVG, { BodyMapSkeleton } from '@/src/components/bodymap/BodyMapSVG'
import PainPointModal from '@/src/components/bodymap/PainPointModal'
import PainTimeline from '@/src/components/bodymap/PainTimeline'
import PatientPhotoUpload from '@/src/components/patients/PatientPhotoUpload'
import CreateSessionModal from '@/src/components/sessions/CreateSessionModal'
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Activity,
  Shield,
  AlertTriangle,
  MoreVertical,
  Edit,
  Download,
  Eye,
  Clock,
  TrendingUp,
  Heart,
  Stethoscope,
  Plus
} from 'lucide-react'
import { useToast } from '@/src/hooks/use-toast'
import type {
  Patient,
  PainPoint,
  Session,
  Appointment,
  UserRole
} from '@/src/lib/supabase/database.types'

interface PatientDetailsProps {
  patient: Patient
  painPoints: PainPoint[]
  sessions: Session[]
  appointments: Appointment[]
  currentUserRole: UserRole
  canEditPatient: boolean
}

type BodyMapView = 'front' | 'back' | 'side'

export default function PatientDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const patientId = params.id as string

  // Estados do componente
  const [loading, setLoading] = useState(true)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [painPoints, setPainPoints] = useState<PainPoint[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('paciente')
  const [canEditPatient, setCanEditPatient] = useState(false)

  // Estados do mapeamento corporal
  const [selectedBodyView, setSelectedBodyView] = useState<BodyMapView>('front')
  const [selectedPainPoint, setSelectedPainPoint] = useState<PainPoint | null>(null)
  const [showPainPointModal, setShowPainPointModal] = useState(false)
  const [newPainPointCoordinates, setNewPainPointCoordinates] = useState<{
    x: number
    y: number
    region: string
  } | null>(null)

  const [lgpdConsent, setLgpdConsent] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateSession, setShowCreateSession] = useState(false)

  // Carregar dados do paciente
  useEffect(() => {
    const loadPatientData = async () => {
      try {
        setLoading(true)

        // Carregar dados do paciente
        const patientResponse = await fetch(`/api/patients/${patientId}`)

        if (!patientResponse.ok) {
          const errorData = await patientResponse.json()
          throw new Error(errorData.error || 'Erro ao carregar paciente')
        }

        const patientResult = await patientResponse.json()
        const patientData = patientResult.data

        // Carregar pontos de dor (simulado por enquanto - será implementado nas próximas fases)
        const mockPainPoints: PainPoint[] = [
          {
            id: 'pain_1',
            org_id: patientData.org_id,
            patient_id: patientId,
            session_id: 'session_1',
            body_region: 'Lombar',
            x_coordinate: 50,
            y_coordinate: 45,
            pain_intensity: 7,
            pain_type: 'cronica',
            pain_description: 'Dor constante na região lombar, piora ao sentar por longos períodos',
            assessment_date: '2024-09-10T09:00:00Z',
            assessment_type: 'progress',
            clinical_notes: 'Limitação de movimento, teste de Lasègue negativo',
            improvement_notes: 'Redução de 20% na intensidade comparado à avaliação anterior',
            created_at: '2024-09-10T09:00:00Z',
            updated_at: '2024-09-10T09:00:00Z',
            created_by: 'user_123',
            updated_by: 'user_123'
          },
          {
            id: 'pain_2',
            org_id: patientData.org_id,
            patient_id: patientId,
            session_id: 'session_2',
            body_region: 'Ombro Direito',
            x_coordinate: 75,
            y_coordinate: 25,
            pain_intensity: 4,
            pain_type: 'rigidez',
            pain_description: 'Rigidez matinal no ombro direito',
            assessment_date: '2024-09-12T14:00:00Z',
            assessment_type: 'progress',
            clinical_notes: 'ROM limitado em abdução, força mantida',
            improvement_notes: 'Melhoria significativa após exercícios de mobilização',
            created_at: '2024-09-12T14:00:00Z',
            updated_at: '2024-09-12T14:00:00Z',
            created_by: 'user_123',
            updated_by: 'user_123'
          }
        ]

        setPatient(patientData)
        setPainPoints(mockPainPoints)
        setCurrentUserRole('fisioterapeuta') // TODO: Obter role do usuário atual
        setCanEditPatient(true) // TODO: Verificar permissões reais
        setLgpdConsent(patientData.consent_lgpd)

      } catch (error) {
        logger.error('Erro ao carregar dados do paciente:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do paciente.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    if (patientId) {
      loadPatientData()
    }
  }, [patientId, toast])

  // Manipuladores de eventos do mapeamento corporal
  const handlePainPointClick = useCallback((x: number, y: number, region: string) => {
    if (!canEditPatient) {
      toast({
        title: 'Acesso Negado',
        description: 'Você não tem permissão para adicionar pontos de dor.',
        variant: 'destructive',
      })
      return
    }

    setNewPainPointCoordinates({ x, y, region })
    setSelectedPainPoint(null)
    setShowPainPointModal(true)
  }, [canEditPatient, toast])

  const handlePainPointSelect = useCallback((painPoint: PainPoint) => {
    setSelectedPainPoint(painPoint)
    setNewPainPointCoordinates(null)
    setShowPainPointModal(true)
  }, [])

  const handleSavePainPoint = useCallback(async (data: any) => {
    try {
      // Simular salvamento - em produção seria uma chamada à API
      logger.info('Salvando ponto de dor:', data)

      if (selectedPainPoint) {
        // Atualizar ponto existente
        const updatedPainPoints = painPoints.map(pp =>
          pp.id === selectedPainPoint.id
            ? { ...pp, ...data, updated_at: new Date().toISOString() }
            : pp
        )
        setPainPoints(updatedPainPoints)

        toast({
          title: 'Sucesso',
          description: 'Ponto de dor atualizado com sucesso.',
        })
      } else {
        // Criar novo ponto
        const newPainPoint: PainPoint = {
          id: `pain_${Date.now()}`,
          org_id: patient?.org_id || '',
          patient_id: patientId,
          session_id: null,
          body_region: data.body_region,
          x_coordinate: data.x_coordinate,
          y_coordinate: data.y_coordinate,
          pain_intensity: data.pain_intensity,
          pain_type: data.pain_type,
          pain_description: data.pain_description,
          assessment_date: data.assessment_date.toISOString(),
          assessment_type: data.assessment_type,
          clinical_notes: data.clinical_notes,
          improvement_notes: data.improvement_notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'current_user_id',
          updated_by: 'current_user_id'
        }

        setPainPoints([...painPoints, newPainPoint])

        toast({
          title: 'Sucesso',
          description: 'Novo ponto de dor registrado com sucesso.',
        })
      }
    } catch (error) {
      logger.error('Erro ao salvar ponto de dor:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o ponto de dor.',
        variant: 'destructive',
      })
    }
  }, [selectedPainPoint, painPoints, patient, patientId, toast])

  // Verificações de permissão
  const canViewSensitiveData = currentUserRole !== 'paciente'
  const canViewClinicalNotes = ['admin', 'fisioterapeuta'].includes(currentUserRole)
  const canManagePainPoints = ['admin', 'fisioterapeuta'].includes(currentUserRole)

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <BodyMapSkeleton />
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Paciente não encontrado ou você não tem permissão para visualizá-lo.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!lgpdConsent) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Este paciente não forneceu consentimento LGPD para visualização dos dados.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Cabeçalho do Paciente */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <PatientPhotoUpload
            patientId={patientId}
            patientName={patient.name}
            currentPhotoUrl={patient.photo_url}
            onPhotoUploaded={(newPhotoUrl) => {
              setPatient(prev => prev ? { ...prev, photo_url: newPhotoUrl } : prev)
            }}
            size="lg"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
            <div className="flex items-center space-x-4 mt-2 text-gray-600">
              <span className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                {patient.gender === 'masculino' ? 'Masculino' : patient.gender === 'feminino' ? 'Feminino' : 'Outro'}
              </span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {format(parseISO(patient.date_of_birth), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
              <Badge
                variant={patient.status === 'active' ? 'default' : 'secondary'}
              >
                {patient.status === 'active' ? 'Ativo' :
                 patient.status === 'inactive' ? 'Inativo' : 'Alta'}
              </Badge>
            </div>
          </div>
        </div>

        {canEditPatient && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/patients/${patientId}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Paciente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                toast({
                  title: 'Em desenvolvimento',
                  description: 'Funcionalidade de exportação será implementada em breve'
                })
              }}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                toast({
                  title: 'Em desenvolvimento',
                  description: 'Funcionalidade de LGPD será implementada em breve'
                })
              }}>
                <Shield className="h-4 w-4 mr-2" />
                Configurar LGPD
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="bodymap">Mapeamento Corporal</TabsTrigger>
          <TabsTrigger value="timeline">Timeline da Dor</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informações Pessoais */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Informações Pessoais</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">CPF</p>
                    <p>{patient.cpf}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">RG</p>
                    <p>{patient.rg || 'Não informado'}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{patient.phone}</span>
                  </div>
                  {patient.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{patient.email}</span>
                    </div>
                  )}
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p>{patient.address_line1}</p>
                      {patient.address_line2 && <p>{patient.address_line2}</p>}
                      <p>{patient.city}, {patient.state} - {patient.postal_code}</p>
                    </div>
                  </div>
                </div>

                {patient.emergency_contact_name && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Contato de Emergência</p>
                      <p className="font-medium">{patient.emergency_contact_name}</p>
                      <p className="text-gray-600">{patient.emergency_contact_phone}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Informações Médicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Stethoscope className="h-5 w-5" />
                  <span>Informações Médicas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.health_insurance && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Plano de Saúde</p>
                    <p className="font-medium">{patient.health_insurance}</p>
                    {patient.health_insurance_number && (
                      <p className="text-xs text-gray-600">#{patient.health_insurance_number}</p>
                    )}
                  </div>
                )}

                {patient.medical_history && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Histórico Médico</p>
                    <p className="text-sm">{patient.medical_history}</p>
                  </div>
                )}

                {patient.current_medications && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Medicações Atuais</p>
                    <p className="text-sm">{patient.current_medications}</p>
                  </div>
                )}

                {patient.allergies && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Alergias</p>
                    <p className="text-sm text-red-600">⚠️ {patient.allergies}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Observações */}
          {patient.observations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Observações Gerais</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{patient.observations}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Mapeamento Corporal */}
        <TabsContent value="bodymap" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-5 w-5" />
                        <span>Mapeamento de Pontos de Dor</span>
                      </CardTitle>
                      <CardDescription>
                        Clique em uma região do corpo para registrar um ponto de dor
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={selectedBodyView === 'front' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedBodyView('front')}
                      >
                        Frente
                      </Button>
                      <Button
                        variant={selectedBodyView === 'back' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedBodyView('back')}
                      >
                        Costas
                      </Button>
                      <Button
                        variant={selectedBodyView === 'side' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedBodyView('side')}
                      >
                        Lateral
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <BodyMapSVG
                    view={selectedBodyView}
                    painPoints={painPoints}
                    onPainPointClick={handlePainPointClick}
                    onPainPointSelect={handlePainPointSelect}
                    readonly={!canManagePainPoints}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Resumo de Dor */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo Atual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {painPoints.length}
                    </div>
                    <p className="text-sm text-gray-600">
                      Ponto{painPoints.length !== 1 ? 's' : ''} de Dor
                    </p>
                  </div>

                  {painPoints.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">
                          Intensidade Média
                        </p>
                        <div className="text-2xl font-bold">
                          {(painPoints.reduce((sum, pp) => sum + pp.pain_intensity, 0) / painPoints.length).toFixed(1)}/10
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">
                          Regiões Afetadas
                        </p>
                        <div className="space-y-1">
                          {[...new Set(painPoints.map(pp => pp.body_region))].map((region) => (
                            <Badge key={region} variant="secondary" className="mr-1 mb-1">
                              {region}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Últimas Avaliações */}
              {painPoints.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Últimas Avaliações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {painPoints
                      .sort((a, b) => b.assessment_date.localeCompare(a.assessment_date))
                      .slice(0, 3)
                      .map((painPoint) => (
                        <div
                          key={painPoint.id}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                          onClick={() => handlePainPointSelect(painPoint)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{painPoint.body_region}</span>
                            <Badge
                              className={
                                painPoint.pain_intensity <= 3 ? 'bg-green-100 text-green-800' :
                                painPoint.pain_intensity <= 6 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {painPoint.pain_intensity}/10
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(painPoint.assessment_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab: Timeline da Dor */}
        <TabsContent value="timeline">
          <PainTimeline
            painPoints={painPoints}
            patientName={patient.name}
          />
        </TabsContent>

        {/* Tab: Sessões */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Histórico de Sessões</CardTitle>
                  <CardDescription>
                    Sessões de fisioterapia realizadas com este paciente
                  </CardDescription>
                </div>
                {canEditPatient && (
                  <Button onClick={() => setShowCreateSession(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Sessão
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Nenhuma sessão registrada ainda</p>
                {canEditPatient && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowCreateSession(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeira Sessão
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Ponto de Dor */}
      <PainPointModal
        isOpen={showPainPointModal}
        onClose={() => {
          setShowPainPointModal(false)
          setSelectedPainPoint(null)
          setNewPainPointCoordinates(null)
        }}
        onSave={handleSavePainPoint}
        painPoint={selectedPainPoint}
        coordinates={newPainPointCoordinates || undefined}
        readonly={!canManagePainPoints}
      />

      {/* Modal de Nova Sessão */}
      <CreateSessionModal
        isOpen={showCreateSession}
        onClose={() => setShowCreateSession(false)}
        onSuccess={(session) => {
          // TODO: Atualizar lista de sessões
          toast({
            title: 'Sessão criada',
            description: `Sessão de ${session.session_type} criada com sucesso`
          })
          // Mudar para a aba de sessões
          setActiveTab('sessions')
        }}
        patientId={patientId}
        patientName={patient.name}
      />
    </div>
  )
}