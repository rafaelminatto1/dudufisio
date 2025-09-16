/**
 * Fisioterapeuta Dashboard - FisioFlow
 * Dashboard focado no atendimento clínico para fisioterapeutas
 * Inclui agenda, pacientes, sessões e ferramentas de avaliação
 */

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { Metadata } from 'next'
import { requireRole, getCurrentUser } from '@/lib/auth/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Users,
  Stethoscope,
  Clock,
  FileText,
  TrendingUp,
  Plus,
  CalendarPlus,
  User,
  Activity
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Dashboard Fisioterapeuta - FisioFlow',
  description: 'Painel clínico para fisioterapeutas - Gestão de pacientes e sessões'
}

export default async function FisioterapeutaDashboard() {
  // Ensure user has fisioterapeuta role
  const user = await requireRole('fisioterapeuta')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Clínico
              </h1>
              <p className="text-gray-600">
                Bem-vindo(a), {user.profile?.name || 'Fisioterapeuta'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Fisioterapeuta
              </Badge>
              <Badge variant="outline">
                CREFITO: {user.profile?.crefito_number || 'N/A'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Suspense fallback={<StatCardSkeleton />}>
            <StatCard
              title="Consultas Hoje"
              value="8"
              subtitle="2 pendentes"
              icon={Calendar}
              color="blue"
            />
          </Suspense>

          <Suspense fallback={<StatCardSkeleton />}>
            <StatCard
              title="Pacientes Ativos"
              value="145"
              subtitle="12 novos este mês"
              icon={Users}
              color="green"
            />
          </Suspense>

          <Suspense fallback={<StatCardSkeleton />}>
            <StatCard
              title="Sessões Completas"
              value="28"
              subtitle="Esta semana"
              icon={Stethoscope}
              color="purple"
            />
          </Suspense>

          <Suspense fallback={<StatCardSkeleton />}>
            <StatCard
              title="Próxima Consulta"
              value="14:30"
              subtitle="Maria Silva"
              icon={Clock}
              color="orange"
            />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Agenda de Hoje
                </CardTitle>
                <Button asChild size="sm">
                  <Link href="/agendamentos/novo">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Nova Consulta
                  </Link>
                </Button>
              </div>
              <CardDescription>
                {new Date().toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ScheduleSkeleton />}>
                <TodaySchedule />
              </Suspense>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start">
                <Link href="/pacientes/novo">
                  <User className="mr-2 h-4 w-4" />
                  Novo Paciente
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/sessoes/nova">
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Nova Sessão
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/pacientes">
                  <Users className="mr-2 h-4 w-4" />
                  Ver Pacientes
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/exercicios">
                  <Activity className="mr-2 h-4 w-4" />
                  Biblioteca de Exercícios
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Pacientes Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<PatientsSkeleton />}>
                <RecentPatientsList />
              </Suspense>
            </CardContent>
          </Card>

          {/* Treatment Progress */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Progresso dos Tratamentos
              </CardTitle>
              <CardDescription>
                Resumo de evolução dos pacientes esta semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ProgressSkeleton />}>
                <TreatmentProgressChart />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
interface StatCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  color: 'blue' | 'green' | 'purple' | 'orange'
}

function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Today's Schedule Component
async function TodaySchedule() {
  // This would fetch real data from the database
  const appointments = [
    {
      id: 1,
      time: '08:00',
      patient: 'João Silva',
      type: 'Avaliação inicial',
      status: 'completed',
      duration: '60min'
    },
    {
      id: 2,
      time: '09:30',
      patient: 'Maria Santos',
      type: 'Fisioterapia ortopédica',
      status: 'completed',
      duration: '45min'
    },
    {
      id: 3,
      time: '11:00',
      patient: 'Pedro Costa',
      type: 'Sessão de reabilitação',
      status: 'in_progress',
      duration: '60min'
    },
    {
      id: 4,
      time: '14:30',
      patient: 'Ana Oliveira',
      type: 'Fisioterapia respiratória',
      status: 'scheduled',
      duration: '45min'
    },
    {
      id: 5,
      time: '16:00',
      patient: 'Carlos Mendes',
      type: 'Avaliação de retorno',
      status: 'scheduled',
      duration: '30min'
    }
  ]

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="font-semibold text-sm">{appointment.time}</div>
              <div className="text-xs text-gray-500">{appointment.duration}</div>
            </div>
            <div>
              <p className="font-medium text-gray-900">{appointment.patient}</p>
              <p className="text-sm text-gray-600">{appointment.type}</p>
            </div>
          </div>
          <Badge
            variant={
              appointment.status === 'completed' ? 'default' :
              appointment.status === 'in_progress' ? 'secondary' :
              'outline'
            }
            className={
              appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
              appointment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }
          >
            {appointment.status === 'completed' ? 'Concluída' :
             appointment.status === 'in_progress' ? 'Em andamento' :
             'Agendada'}
          </Badge>
        </div>
      ))}
    </div>
  )
}

// Recent Patients Component
async function RecentPatientsList() {
  // This would fetch real data from the database
  const patients = [
    {
      id: 1,
      name: 'Maria Silva',
      lastSession: '2 dias atrás',
      condition: 'Lombalgia',
      progress: 'Melhorando'
    },
    {
      id: 2,
      name: 'João Costa',
      lastSession: '1 semana atrás',
      condition: 'Tendinite',
      progress: 'Estável'
    },
    {
      id: 3,
      name: 'Ana Santos',
      lastSession: 'Ontem',
      condition: 'Pós-cirurgia',
      progress: 'Excelente'
    }
  ]

  return (
    <div className="space-y-4">
      {patients.map((patient) => (
        <div key={patient.id} className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">{patient.name}</p>
            <p className="text-sm text-gray-600">{patient.condition}</p>
            <p className="text-xs text-gray-500">Última sessão: {patient.lastSession}</p>
          </div>
          <Badge
            variant="outline"
            className={
              patient.progress === 'Excelente' ? 'border-green-500 text-green-700' :
              patient.progress === 'Melhorando' ? 'border-blue-500 text-blue-700' :
              'border-yellow-500 text-yellow-700'
            }
          >
            {patient.progress}
          </Badge>
        </div>
      ))}
      <Button asChild variant="outline" className="w-full">
        <Link href="/pacientes">Ver todos os pacientes</Link>
      </Button>
    </div>
  )
}

// Treatment Progress Chart Component
async function TreatmentProgressChart() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-green-600">23</div>
          <div className="text-sm text-gray-600">Melhoraram</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">12</div>
          <div className="text-sm text-gray-600">Estáveis</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-yellow-600">3</div>
          <div className="text-sm text-gray-600">Necessitam atenção</div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Taxa de Melhora</span>
          <span className="text-sm font-medium">76%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-green-600 h-2 rounded-full" style={{ width: '76%' }}></div>
        </div>
      </div>
      <Button asChild variant="outline" className="w-full">
        <Link href="/relatorios/progresso">
          <FileText className="mr-2 h-4 w-4" />
          Ver Relatório Completo
        </Link>
      </Button>
    </div>
  )
}

// Loading Skeletons
function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </CardContent>
    </Card>
  )
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center space-x-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-12 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-8"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
      ))}
    </div>
  )
}

function PatientsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
      ))}
    </div>
  )
}

function ProgressSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className="h-8 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="h-3 bg-gray-200 rounded w-8"></div>
        </div>
        <div className="h-2 bg-gray-200 rounded w-full"></div>
      </div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
  )
}
