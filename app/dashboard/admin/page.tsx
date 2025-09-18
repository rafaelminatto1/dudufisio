'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Download, Filter, TrendingUp, TrendingDown, Users, Calendar as CalendarSchedule, Activity, DollarSign, Clock, Target } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

interface DashboardMetrics {
  totalPatients: number
  totalPatientsGrowth: number
  activePatients: number
  activePatientsGrowth: number
  totalAppointments: number
  totalAppointmentsGrowth: number
  completedSessions: number
  completedSessionsGrowth: number
  totalRevenue: number
  totalRevenueGrowth: number
  averageSessionDuration: number
  patientSatisfactionScore: number
  exerciseCompletionRate: number
}

interface ChartData {
  appointmentsByMonth: Array<{
    month: string
    appointments: number
    completedSessions: number
    canceledAppointments: number
  }>
  revenueByMonth: Array<{
    month: string
    revenue: number
    projectedRevenue: number
  }>
  patientsByAge: Array<{
    ageGroup: string
    count: number
  }>
  sessionsByTherapist: Array<{
    therapist: string
    sessions: number
    averageRating: number
  }>
  exerciseCategories: Array<{
    category: string
    prescriptions: number
    completionRate: number
  }>
  treatmentOutcomes: Array<{
    outcome: string
    count: number
    percentage: number
  }>
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('last_30_days')
  const [selectedTherapist, setSelectedTherapist] = useState('all')
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  })

  useEffect(() => {
    fetchDashboardData()
  }, [selectedPeriod, selectedTherapist, dateRange])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API calls
      const mockMetrics: DashboardMetrics = {
        totalPatients: 744,
        totalPatientsGrowth: 8.2,
        activePatients: 312,
        activePatientsGrowth: 5.7,
        totalAppointments: 669,
        totalAppointmentsGrowth: -2.1,
        completedSessions: 587,
        completedSessionsGrowth: 12.3,
        totalRevenue: 89650,
        totalRevenueGrowth: 15.8,
        averageSessionDuration: 52,
        patientSatisfactionScore: 4.6,
        exerciseCompletionRate: 78.5
      }

      const mockChartData: ChartData = {
        appointmentsByMonth: [
          { month: 'Jan', appointments: 120, completedSessions: 108, canceledAppointments: 12 },
          { month: 'Fev', appointments: 135, completedSessions: 118, canceledAppointments: 17 },
          { month: 'Mar', appointments: 142, completedSessions: 125, canceledAppointments: 17 },
          { month: 'Abr', appointments: 158, completedSessions: 142, canceledAppointments: 16 },
          { month: 'Mai', appointments: 169, completedSessions: 151, canceledAppointments: 18 },
          { month: 'Jun', appointments: 175, completedSessions: 158, canceledAppointments: 17 }
        ],
        revenueByMonth: [
          { month: 'Jan', revenue: 12850, projectedRevenue: 13000 },
          { month: 'Fev', revenue: 14200, projectedRevenue: 14000 },
          { month: 'Mar', revenue: 15100, projectedRevenue: 15500 },
          { month: 'Abr', revenue: 16800, projectedRevenue: 16200 },
          { month: 'Mai', revenue: 17900, projectedRevenue: 17800 },
          { month: 'Jun', revenue: 18650, projectedRevenue: 18900 }
        ],
        patientsByAge: [
          { ageGroup: '18-30', count: 89 },
          { ageGroup: '31-45', count: 156 },
          { ageGroup: '46-60', count: 234 },
          { ageGroup: '61-75', count: 187 },
          { ageGroup: '75+', count: 78 }
        ],
        sessionsByTherapist: [
          { therapist: 'Dr. Silva', sessions: 142, averageRating: 4.8 },
          { therapist: 'Dra. Costa', sessions: 128, averageRating: 4.7 },
          { therapist: 'Dr. Santos', sessions: 98, averageRating: 4.5 },
          { therapist: 'Dra. Lima', sessions: 89, averageRating: 4.6 },
          { therapist: 'Dr. Oliveira', sessions: 76, averageRating: 4.4 }
        ],
        exerciseCategories: [
          { category: 'Fortalecimento', prescriptions: 156, completionRate: 82.3 },
          { category: 'Alongamento', prescriptions: 142, completionRate: 89.1 },
          { category: 'Mobilização', prescriptions: 98, completionRate: 75.8 },
          { category: 'Equilíbrio', prescriptions: 76, completionRate: 68.4 },
          { category: 'Coordenação', prescriptions: 54, completionRate: 73.2 }
        ],
        treatmentOutcomes: [
          { outcome: 'Alta por melhora', count: 234, percentage: 65.2 },
          { outcome: 'Tratamento em andamento', count: 89, percentage: 24.8 },
          { outcome: 'Abandono de tratamento', count: 24, percentage: 6.7 },
          { outcome: 'Transferência', count: 12, percentage: 3.3 }
        ]
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))

      setMetrics(mockMetrics)
      setChartData(mockChartData)
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']

  if (loading || !metrics || !chartData) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h1>
            <p className="text-muted-foreground">Acompanhe o desempenho da clínica</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho da clínica</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Últimos 7 dias</SelectItem>
              <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
              <SelectItem value="last_90_days">Últimos 90 dias</SelectItem>
              <SelectItem value="last_year">Último ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTherapist} onValueChange={setSelectedTherapist}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os terapeutas</SelectItem>
              <SelectItem value="dr_silva">Dr. Silva</SelectItem>
              <SelectItem value="dra_costa">Dra. Costa</SelectItem>
              <SelectItem value="dr_santos">Dr. Santos</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalPatients.toLocaleString()}</div>
            <div className="flex items-center text-xs">
              {metrics.totalPatientsGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={metrics.totalPatientsGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(metrics.totalPatientsGrowth)}%
              </span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activePatients.toLocaleString()}</div>
            <div className="flex items-center text-xs">
              {metrics.activePatientsGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={metrics.activePatientsGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(metrics.activePatientsGrowth)}%
              </span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
            <CalendarSchedule className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAppointments.toLocaleString()}</div>
            <div className="flex items-center text-xs">
              {metrics.totalAppointmentsGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={metrics.totalAppointmentsGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(metrics.totalAppointmentsGrowth)}%
              </span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <div className="flex items-center text-xs">
              {metrics.totalRevenueGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={metrics.totalRevenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(metrics.totalRevenueGrowth)}%
              </span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões Concluídas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completedSessions.toLocaleString()}</div>
            <div className="flex items-center text-xs">
              {metrics.completedSessionsGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={metrics.completedSessionsGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(metrics.completedSessionsGrowth)}%
              </span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageSessionDuration}min</div>
            <p className="text-xs text-muted-foreground">por sessão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.patientSatisfactionScore}/5.0</div>
            <p className="text-xs text-muted-foreground">avaliação média</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exercícios</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.exerciseCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">taxa de conclusão</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="appointments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
          <TabsTrigger value="therapists">Terapeutas</TabsTrigger>
          <TabsTrigger value="exercises">Exercícios</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Agendamentos por Mês</CardTitle>
                <CardDescription>Comparação entre agendados e realizados</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.appointmentsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="appointments" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="completedSessions" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="canceledAppointments" stackId="3" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultados dos Tratamentos</CardTitle>
                <CardDescription>Distribuição dos desfechos clínicos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.treatmentOutcomes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ outcome, percentage }) => `${outcome}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {chartData.treatmentOutcomes.map((entry, index) => (
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

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Receita Mensal</CardTitle>
              <CardDescription>Receita real vs projetada</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Receita Real" />
                  <Line type="monotone" dataKey="projectedRevenue" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" name="Receita Projetada" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Faixa Etária</CardTitle>
              <CardDescription>Perfil demográfico dos pacientes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData.patientsByAge}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ageGroup" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="therapists" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Terapeuta</CardTitle>
              <CardDescription>Número de sessões e avaliação média</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData.sessionsByTherapist}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="therapist" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="sessions" fill="#3B82F6" name="Sessões" />
                  <Line yAxisId="right" type="monotone" dataKey="averageRating" stroke="#F59E0B" name="Avaliação Média" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exercises" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Categorias de Exercícios</CardTitle>
              <CardDescription>Prescrições e taxa de conclusão por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chartData.exerciseCategories.map((category) => (
                  <div key={category.category} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{category.category}</h4>
                      <p className="text-sm text-muted-foreground">
                        {category.prescriptions} prescrições
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{category.completionRate}%</div>
                      <p className="text-xs text-muted-foreground">conclusão</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}