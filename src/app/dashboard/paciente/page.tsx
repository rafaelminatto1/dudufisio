/**
 * Paciente Dashboard - FisioFlow
 * Dashboard para pacientes com acesso ao próprio tratamento
 * Inclui prescrições, exercícios, agenda e evolução
 */

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { Metadata } from 'next'
import { requireRole, getCurrentUser } from '@/src/lib/auth/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import {
  Calendar,
  Activity,
  TrendingUp,
  Clock,
  FileText,
  MapPin,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Meu Portal - FisioFlow',
  description: 'Portal do paciente - Acompanhe seu tratamento e exercícios'
}

export default async function PacienteDashboard() {
  // Ensure user has paciente role
  const user = await requireRole('paciente')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Meu Portal de Tratamento
              </h1>
              <p className="text-gray-600">
                Olá, {user.profile?.name || 'Paciente'}! Acompanhe sua evolução.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Paciente
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Suspense fallback={<StatCardSkeleton />}>
            <StatCard
              title="Próxima Consulta"
              value="15/09"
              subtitle="14:30 - Dr. João"
              icon={Calendar}
              color="blue"
            />
          </Suspense>

          <Suspense fallback={<StatCardSkeleton />}>
            <StatCard
              title="Exercícios Hoje"
              value="5"
              subtitle="3 completos"
              icon={Activity}
              color="green"
            />
          </Suspense>

          <Suspense fallback={<StatCardSkeleton />}>
            <StatCard
              title="Evolução Dor"
              value="6→3"
              subtitle="Redução de 50%"
              icon={TrendingUp}
              color="purple"
            />
          </Suspense>

          <Suspense fallback={<StatCardSkeleton />}>
            <StatCard
              title="Dias de Tratamento"
              value="28"
              subtitle="4 semanas"
              icon={Clock}
              color="orange"
            />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Exercises */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Exercícios de Hoje
              </CardTitle>
              <CardDescription>
                Complete seus exercícios prescritos para acelerar a recuperação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ExercisesSkeleton />}>
                <TodayExercises />
              </Suspense>
            </CardContent>
          </Card>

          {/* Pain Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Registro de Dor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Nível atual de dor</p>
                  <div className="text-3xl font-bold text-orange-600">3/10</div>
                  <p className="text-xs text-gray-500">Última atualização: hoje</p>
                </div>
                <Button className="w-full" variant="outline">
                  Atualizar Nível de Dor
                </Button>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/mapa-corporal">
                    Ver Mapa Corporal
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Próximas Consultas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<AppointmentsSkeleton />}>
                <UpcomingAppointments />
              </Suspense>
            </CardContent>
          </Card>

          {/* Progress Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Evolução do Tratamento
              </CardTitle>
              <CardDescription>
                Acompanhe sua melhora ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ProgressSkeleton />}>
                <ProgressChart />
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

// Today's Exercises Component
async function TodayExercises() {
  // This would fetch real data from the database
  const exercises = [
    {
      id: 1,
      name: 'Alongamento Cervical',
      duration: '10 minutos',
      sets: '3x',
      reps: '15 segundos',
      completed: true,
      difficulty: 'Fácil'
    },
    {
      id: 2,
      name: 'Fortalecimento Core',
      duration: '15 minutos',
      sets: '2x',
      reps: '12 repetições',
      completed: true,
      difficulty: 'Médio'
    },
    {
      id: 3,
      name: 'Mobilização Ombro',
      duration: '8 minutos',
      sets: '3x',
      reps: '10 repetições',
      completed: true,
      difficulty: 'Fácil'
    },
    {
      id: 4,
      name: 'Exercício Respiratório',
      duration: '5 minutos',
      sets: '1x',
      reps: '20 respirações',
      completed: false,
      difficulty: 'Fácil'
    },
    {
      id: 5,
      name: 'Caminhada Leve',
      duration: '20 minutos',
      sets: '1x',
      reps: 'Contínuo',
      completed: false,
      difficulty: 'Médio'
    }
  ]

  return (
    <div className="space-y-4">
      {exercises.map((exercise) => (
        <div key={exercise.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-full ${
              exercise.completed ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {exercise.completed ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{exercise.name}</p>
              <p className="text-sm text-gray-600">
                {exercise.sets} • {exercise.reps} • {exercise.duration}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className={
                exercise.difficulty === 'Fácil' ? 'border-green-500 text-green-700' :
                exercise.difficulty === 'Médio' ? 'border-yellow-500 text-yellow-700' :
                'border-red-500 text-red-700'
              }
            >
              {exercise.difficulty}
            </Badge>
            {!exercise.completed && (
              <Button size="sm">Marcar como Feito</Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Upcoming Appointments Component
async function UpcomingAppointments() {
  // This would fetch real data from the database
  const appointments = [
    {
      id: 1,
      date: '15/09/2025',
      time: '14:30',
      therapist: 'Dr. João Silva',
      type: 'Fisioterapia ortopédica',
      status: 'confirmed'
    },
    {
      id: 2,
      date: '18/09/2025',
      time: '09:00',
      therapist: 'Dra. Maria Santos',
      type: 'Avaliação de progresso',
      status: 'scheduled'
    }
  ]

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="p-4 rounded-lg border">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-medium text-gray-900">{appointment.date}</p>
              <p className="text-sm text-gray-600">{appointment.time}</p>
            </div>
            <Badge
              variant={appointment.status === 'confirmed' ? 'default' : 'outline'}
              className={
                appointment.status === 'confirmed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }
            >
              {appointment.status === 'confirmed' ? 'Confirmada' : 'Agendada'}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{appointment.therapist}</p>
          <p className="text-xs text-gray-500">{appointment.type}</p>
        </div>
      ))}
      <Button asChild variant="outline" className="w-full">
        <Link href="/consultas">Ver todas as consultas</Link>
      </Button>
    </div>
  )
}

// Progress Chart Component
async function ProgressChart() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-green-600">85%</div>
          <div className="text-sm text-gray-600">Exercícios Completos</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">50%</div>
          <div className="text-sm text-gray-600">Redução da Dor</div>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Adesão aos Exercícios</span>
            <span className="text-sm font-medium">85%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Melhora da Mobilidade</span>
            <span className="text-sm font-medium">70%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '70%' }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Redução da Dor</span>
            <span className="text-sm font-medium">50%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '50%' }}></div>
          </div>
        </div>
      </div>
      <Button asChild variant="outline" className="w-full">
        <Link href="/meu-progresso">
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

function ExercisesSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

function AppointmentsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="p-4 rounded-lg border">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ProgressSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="text-center">
            <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <div className="h-3 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-8"></div>
            </div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
  )
}
