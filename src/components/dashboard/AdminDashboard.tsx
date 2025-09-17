"use client"

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading'
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Clock,
  Target,
  BarChart3,
  FileText,
  Settings,
  Shield
} from 'lucide-react'
import { format, isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface AdminDashboardProps {
  patients: any[]
  appointments: any[]
  sessions: any[]
  payments: any[]
  users: any[]
  isLoading?: boolean
}

interface AdminStats {
  totalPatients: number
  activePatients: number
  totalUsers: number
  todayAppointments: number
  weeklyAppointments: number
  monthlyRevenue: number
  completionRate: number
  averageSessionDuration: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function AdminDashboard({
  patients,
  appointments,
  sessions,
  payments,
  users,
  isLoading = false
}: AdminDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month')

  const stats = useMemo((): AdminStats => {
    const todayAppointments = appointments.filter(apt =>
      isToday(parseISO(apt.appointment_date))
    ).length

    const weeklyAppointments = appointments.filter(apt =>
      isThisWeek(parseISO(apt.appointment_date))
    ).length

    const monthlyPayments = payments.filter(payment =>
      isThisMonth(parseISO(payment.created_at))
    )
    const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0)

    const completedAppointments = appointments.filter(apt => apt.status === 'completed').length
    const completionRate = appointments.length > 0 ? (completedAppointments / appointments.length) * 100 : 0

    const totalSessionTime = sessions.reduce((sum, session) => sum + (session.duration || 60), 0)
    const averageSessionDuration = sessions.length > 0 ? totalSessionTime / sessions.length : 0

    const activePatients = patients.filter(patient => {
      const hasRecentAppointment = appointments.some(apt =>
        apt.patient_id === patient.id &&
        isThisMonth(parseISO(apt.appointment_date))
      )
      return hasRecentAppointment
    }).length

    return {
      totalPatients: patients.length,
      activePatients,
      totalUsers: users.length,
      todayAppointments,
      weeklyAppointments,
      monthlyRevenue,
      completionRate,
      averageSessionDuration
    }
  }, [patients, appointments, sessions, payments, users])

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date
    })

    return last7Days.map(date => {
      const dayAppointments = appointments.filter(apt => {
        const aptDate = parseISO(apt.appointment_date)
        return aptDate.toDateString() === date.toDateString()
      }).length

      const dayRevenue = payments.filter(payment => {
        const paymentDate = parseISO(payment.created_at)
        return paymentDate.toDateString() === date.toDateString()
      }).reduce((sum, payment) => sum + payment.amount, 0)

      return {
        date: format(date, 'dd/MM', { locale: ptBR }),
        appointments: dayAppointments,
        revenue: dayRevenue / 100
      }
    })
  }, [appointments, payments])

  const userRoleData = useMemo(() => {
    const roleCounts = users.reduce((acc, user) => {
      const role = user.role || 'Não definido'
      acc[role] = (acc[role] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(roleCounts).map(([role, count]) => ({
      name: role,
      value: count
    }))
  }, [users])

  const paymentMethodData = useMemo(() => {
    const methodCounts = payments.reduce((acc, payment) => {
      const method = payment.payment_method || 'Não informado'
      acc[method] = (acc[method] || 0) + payment.amount
      return acc
    }, {} as Record<string, number>)

    return Object.entries(methodCounts).map(([method, total]) => ({
      name: method,
      value: total / 100
    }))
  }, [payments])

  const recentAlerts = useMemo(() => {
    const alerts = []

    // Pacientes sem consulta recente
    const inactivePatients = patients.filter(patient => {
      const hasRecentAppointment = appointments.some(apt =>
        apt.patient_id === patient.id &&
        isThisWeek(parseISO(apt.appointment_date))
      )
      return !hasRecentAppointment
    })

    if (inactivePatients.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${inactivePatients.length} pacientes sem consulta esta semana`,
        action: 'Ver pacientes'
      })
    }

    // Usuários inativos
    const inactiveUsers = users.filter(user =>
      user.last_sign_in_at &&
      new Date(user.last_sign_in_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )

    if (inactiveUsers.length > 0) {
      alerts.push({
        type: 'info',
        message: `${inactiveUsers.length} usuários inativos nos últimos 7 dias`,
        action: 'Gerenciar usuários'
      })
    }

    // Taxa de cancelamento alta
    const canceledAppointments = appointments.filter(apt => apt.status === 'canceled').length
    const cancelationRate = appointments.length > 0 ? (canceledAppointments / appointments.length) * 100 : 0

    if (cancelationRate > 15) {
      alerts.push({
        type: 'error',
        message: `Taxa de cancelamento alta: ${cancelationRate.toFixed(1)}%`,
        action: 'Analisar cancelamentos'
      })
    }

    return alerts
  }, [patients, appointments, users])

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">
            Visão geral da clínica em {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {recentAlerts.length > 0 && (
        <div className="space-y-2">
          {recentAlerts.map((alert, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                alert.type === 'error' ? 'bg-red-50 border-red-200' :
                alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${
                  alert.type === 'error' ? 'text-red-600' :
                  alert.type === 'warning' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
              <Button variant="ghost" size="sm">
                {alert.action}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activePatients} ativos este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.weeklyAppointments} esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(stats.monthlyRevenue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.3% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.averageSessionDuration.toFixed(0)} min média/sessão
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Consultas e Receita - Últimos 7 Dias</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="appointments"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Consultas"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="Receita (R$)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Distribuição de Usuários</CardTitle>
                <CardDescription>Por tipo de perfil</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={userRoleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {userRoleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receita por Método de Pagamento</CardTitle>
                <CardDescription>Distribuição dos valores recebidos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={paymentMethodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Valor']} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas Financeiras</CardTitle>
                <CardDescription>Indicadores do mês atual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Receita Total</span>
                  <span className="text-lg font-bold">
                    R$ {(stats.monthlyRevenue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Ticket Médio</span>
                  <span className="text-lg font-bold">
                    R$ {payments.length > 0 ?
                      ((stats.monthlyRevenue / payments.length) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                      : '0,00'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total de Transações</span>
                  <span className="text-lg font-bold">{payments.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Usuários</CardTitle>
              <CardDescription>Controle de acesso e permissões</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium">Total de Usuários</h4>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <Button>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Adicionar Usuário
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {userRoleData.map((role, index) => (
                    <div key={role.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">{role.name}</h5>
                        <Badge variant="outline">{role.value}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {((role.value / stats.totalUsers) * 100).toFixed(1)}% do total
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>KPIs Operacionais</CardTitle>
                <CardDescription>Indicadores de performance da clínica</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Taxa de Ocupação</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Taxa de Retenção</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Satisfação do Paciente</span>
                    <span className="font-medium">4.8/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Ferramentas administrativas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Backup dos Dados
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Gerar Relatório Mensal
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Importar Pacientes
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Sistema
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}