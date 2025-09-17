/**
 * Temporary Fisioterapeuta Dashboard - FisioFlow
 * Simple version without auth for testing
 */

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

export default function FisioterapeutaDashboard() {
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
                Bem-vindo(a), Fisioterapeuta
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Fisioterapeuta
              </Badge>
              <Badge variant="outline">
                CREFITO: 123456-F/SP
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Consultas Hoje"
            value="8"
            subtitle="2 pendentes"
            icon={Calendar}
            color="blue"
          />
          <StatCard
            title="Pacientes Ativos"
            value="145"
            subtitle="12 novos este mês"
            icon={Users}
            color="green"
          />
          <StatCard
            title="Sessões Completas"
            value="28"
            subtitle="Esta semana"
            icon={Stethoscope}
            color="purple"
          />
          <StatCard
            title="Próxima Consulta"
            value="14:30"
            subtitle="Maria Silva"
            icon={Clock}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <Link href="/patients/new">
                  <User className="mr-2 h-4 w-4" />
                  Novo Paciente
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/sessions/new">
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Nova Sessão
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/patients">
                  <Users className="mr-2 h-4 w-4" />
                  Ver Pacientes
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/exercises">
                  <Activity className="mr-2 h-4 w-4" />
                  Biblioteca de Exercícios
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Agenda de Hoje
                </CardTitle>
                <Button asChild size="sm">
                  <Link href="/appointments/new">
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
              <TodaySchedule />
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
function TodaySchedule() {
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