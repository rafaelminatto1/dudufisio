/**
 * Admin Dashboard - FisioFlow
 * Dashboard completo para administradores do sistema
 * Inclui KPIs, gestão de usuários, analytics e configurações organizacionais
 */

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { Metadata } from 'next'
import { requireRole, getCurrentUser } from '@/lib/auth/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  Settings,
  Shield,
  FileText,
  Bell,
  BarChart3,
  UserPlus
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Dashboard Admin - FisioFlow',
  description: 'Painel administrativo completo para gestão da clínica de fisioterapia'
}

export default async function AdminDashboard() {
  // Ensure user has admin role
  const user = await requireRole('admin')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Administrativo
              </h1>
              <p className="text-gray-600">
                Bem-vindo(a), {user.profile?.name || 'Administrador'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Admin
              </Badge>
              <Badge variant="outline">
                {user.currentOrg?.name}
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
              title="Total de Pacientes"
              value="744"
              change="+12%"
              changeType="positive"
              icon={Users}
            />
          </Suspense>

          <Suspense fallback={<StatCardSkeleton />}>
            <StatCard
              title="Consultas este Mês"
              value="669"
              change="+8%"
              changeType="positive"
              icon={Calendar}
            />
          </Suspense>

          <Suspense fallback={<StatCardSkeleton />}>
            <StatCard
              title="Taxa de Satisfação"
              value="94%"
              change="+2%"
              changeType="positive"
              icon={TrendingUp}
            />
          </Suspense>

          <Suspense fallback={<StatCardSkeleton />}>
            <StatCard
              title="Receita Mensal"
              value="R$ 45.280"
              change="+15%"
              changeType="positive"
              icon={DollarSign}
            />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start">
                <Link href="/admin/usuarios/novo">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar Usuário
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/admin/organizacao">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/admin/relatorios">
                  <FileText className="mr-2 h-4 w-4" />
                  Relatórios
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/admin/auditoria">
                  <Shield className="mr-2 h-4 w-4" />
                  Logs de Auditoria
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Atividade Recente
              </CardTitle>
              <CardDescription>
                Últimas ações realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ActivitySkeleton />}>
                <RecentActivityList />
              </Suspense>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Status do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Banco de Dados</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Online
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">API Supabase</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Operacional
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Storage</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  98% Livre
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Backup</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Diário
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* User Management Summary */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Resumo de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">5</div>
                  <div className="text-sm text-gray-600">Administradores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">12</div>
                  <div className="text-sm text-gray-600">Fisioterapeutas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">8</div>
                  <div className="text-sm text-gray-600">Estagiários</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">744</div>
                  <div className="text-sm text-gray-600">Pacientes</div>
                </div>
              </div>
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
  change: string
  changeType: 'positive' | 'negative'
  icon: React.ElementType
}

function StatCard({ title, value, change, changeType, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className={`text-sm ${
              changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {change} vs mês anterior
            </p>
          </div>
          <div className={`p-3 rounded-full ${
            changeType === 'positive' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Icon className={`h-6 w-6 ${
              changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Recent Activity Component
async function RecentActivityList() {
  // This would fetch real data from the database
  const activities = [
    {
      id: 1,
      action: 'Novo paciente cadastrado',
      user: 'Dr. João Silva',
      time: '2 minutos atrás',
      type: 'create'
    },
    {
      id: 2,
      action: 'Consulta agendada',
      user: 'Dra. Maria Santos',
      time: '15 minutos atrás',
      type: 'schedule'
    },
    {
      id: 3,
      action: 'Relatório gerado',
      user: 'Admin Sistema',
      time: '1 hora atrás',
      type: 'report'
    },
    {
      id: 4,
      action: 'Backup realizado',
      user: 'Sistema',
      time: '2 horas atrás',
      type: 'system'
    }
  ]

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center space-x-4 pb-4 border-b last:border-b-0">
          <div className={`w-2 h-2 rounded-full ${
            activity.type === 'create' ? 'bg-green-500' :
            activity.type === 'schedule' ? 'bg-blue-500' :
            activity.type === 'report' ? 'bg-yellow-500' :
            'bg-gray-500'
          }`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{activity.action}</p>
            <p className="text-sm text-gray-500">{activity.user}</p>
          </div>
          <div className="text-sm text-gray-400">{activity.time}</div>
        </div>
      ))}
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

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center space-x-4 pb-4 border-b">
          <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-1 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
      ))}
    </div>
  )
}
