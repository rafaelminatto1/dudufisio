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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import BodyMapSVG, { BodyMapSkeleton } from '@/components/bodymap/BodyMapSVG'
import PainPointModal from '@/components/bodymap/PainPointModal'
import PainTimeline from '@/components/bodymap/PainTimeline'
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
  Stethoscope
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type {
  Patient,
  PainPoint,
  Session,
  Appointment,
  UserRole
} from '@/lib/supabase/database.types'

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

  // Carregar dados do paciente
  useEffect(() => {
    const loadPatientData = async () => {
      try {
        setLoading(true)

        // Simular carregamento de dados - em produção seria uma chamada à API
        // const response = await fetch(`/api/patients/${patientId}`)
        // const data = await response.json()

        // Dados simulados para demonstração
        const mockPatient: Patient = {
          id: patientId,
          org_id: 'org_123',
          name: 'João Silva Santos',
          cpf: '123.456.789-00',
          date_of_birth: '1985-03-15',
          gender: 'masculino',
          phone: '(31) 99876-5432',
          email: 'joao.santos@email.com',
          emergency_contact_name: 'Maria Silva Santos',
          emergency_contact_phone: '(31) 98765-4321',
          address_line1: 'Rua das Flores, 123',
          address_line2: 'Apt 45',
          city: 'Belo Horizonte',
          state: 'MG',
          postal_code: '30130-000',
          photo_url: null,
          insurance_provider: 'Unimed',
          insurance_number: '123456789',
          medical_history: 'Histórico de dores nas costas, sem cirurgias prévias',
          medications: 'Nenhuma medicação contínua',
          allergies: 'Alergia a dipirona',
          consent_lgpd: true,
          consent_photos: true,
          consent_treatment: true,
          occupation: 'Engenheiro',
          status: 'active',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-09-15T14:30:00Z',
          created_by: 'user_123',
          user_id: 'user_123'
        }

        const mockPainPoints: PainPoint[] = [
          {
            id: 'pain_1',
            patient_id: patientId,
            session_id: 'session_1',
            body_part: 'Lombar',
            body_region: 'Lombar',
            pain_level: 7,
            pain_intensity: 7,
            pain_type: 'cronica',
            pain_description: 'Dor constante na região lombar, piora ao sentar por longos períodos',
            coordinates_x: 50,
            coordinates_y: 45,
            x_coordinate: 50,
            y_coordinate: 45,
            created_at: '2024-09-10T09:00:00Z'
          },
          {
            id: 'pain_2',
            patient_id: patientId,
            session_id: 'session_2',
            body_part: 'Ombro Direito',
            body_region: 'Ombro Direito',
            pain_level: 4,
            pain_intensity: 4,
            pain_type: 'rigidez',
            pain_description: 'Rigidez matinal no ombro direito',
            coordinates_x: 75,
            coordinates_y: 25,
            x_coordinate: 75,
            y_coordinate: 25,
            created_at: '2024-09-12T14:00:00Z'
          }
        ]

        setPatient(mockPatient)
        setPainPoints(mockPainPoints)
        setCurrentUserRole('fisioterapeuta') // Simular role do usuário
        setCanEditPatient(true)
        setLgpdConsent(mockPatient.consent_lgpd || false)

      } catch (error) {
        console.error('Erro ao carregar dados do paciente:', error)
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
      console.log('Salvando ponto de dor:', data)

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
          patient_id: patientId,
          session_id: 'temp-session',
          body_part: data.body_region,
          body_region: data.body_region,
          pain_level: data.pain_intensity,
          pain_intensity: data.pain_intensity,
          pain_type: data.pain_type,
          pain_description: data.pain_description,
          coordinates_x: data.x_coordinate,
          coordinates_y: data.y_coordinate,
          x_coordinate: data.x_coordinate,
          y_coordinate: data.y_coordinate,
          created_at: new Date().toISOString()
        }

        setPainPoints([...painPoints, newPainPoint])

        toast({
          title: 'Sucesso',
          description: 'Novo ponto de dor registrado com sucesso.',
        })
      }
    } catch (error) {
      console.error('Erro ao salvar ponto de dor:', error)
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
          <Avatar className="h-16 w-16">
            <AvatarImage src={patient.photo_url || undefined} />
            <AvatarFallback className="text-lg">
              {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
            <div className="flex items-center space-x-4 mt-2 text-gray-600">
              <span className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                {patient.gender === 'masculino' ? 'Masculino' : patient.gender === 'feminino' ? 'Feminino' : 'Outro'}
              </span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {patient.date_of_birth ? format(parseISO(patient.date_of_birth), 'dd/MM/yyyy', { locale: ptBR }) : 'Não informado'}
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
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Editar Paciente
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
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
                {patient.insurance_provider && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Plano de Saúde</p>
                    <p className="font-medium">{patient.insurance_provider}</p>
                    {patient.insurance_number && (
                      <p className="text-xs text-gray-600">#{patient.insurance_number}</p>
                    )}
                  </div>
                )}

                {patient.medical_history && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Histórico Médico</p>
                    <p className="text-sm">{patient.medical_history}</p>
                  </div>
                )}

                {patient.medications && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Medicações Atuais</p>
                    <p className="text-sm">{patient.medications}</p>
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
                      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
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
                            {painPoint.created_at ? format(parseISO(painPoint.created_at), 'dd/MM/yyyy', { locale: ptBR }) : 'Data não disponível'}
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
              <CardTitle>Histórico de Sessões</CardTitle>
              <CardDescription>
                Sessões de fisioterapia realizadas com este paciente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Nenhuma sessão registrada ainda</p>
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
    </div>
  )
}