'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Button } from '@/src/components/ui/button'
import { Calendar } from '@/src/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { Badge } from '@/src/components/ui/badge'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar as CalendarIcon,
  Activity,
  Heart,
  Brain,
  Target,
  Clock,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AnalyticsData {
  // Métricas de Pacientes
  totalPatients: number
  activePatients: number
  newPatients: number
  dischargedPatients: number
  patientGrowthRate: number

  // Métricas de Tratamento
  totalSessions: number
  averageSessionsPerPatient: number
  treatmentEffectiveness: number
  averagePainReduction: number
  recoveryRate: number

  // Métricas de Dor
  painEvolution: Array<{
    date: string
    averagePain: number
    patientCount: number
  }>

  // Métricas por Região Corporal
  painByRegion: Array<{
    region: string
    count: number
    averageIntensity: number
    improvementRate: number
  }>

  // Métricas de Agendamentos
  appointmentMetrics: {
    total: number
    completed: number
    cancelled: number
    noShow: number
    utilizationRate: number
  }

  // Efetividade por Tipo de Tratamento
  treatmentTypes: Array<{
    type: string
    patientCount: number
    successRate: number
    averageDuration: number
  }>

  // Dados Temporais
  timeSeriesData: Array<{
    date: string
    newPatients: number
    sessions: number
    revenue: number
    painReduction: number
  }>
}

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

export function ClinicalAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 3),
    to: new Date()
  })
  const [selectedMetric, setSelectedMetric] = useState('overview')
  const [comparisonPeriod, setComparisonPeriod] = useState<'month' | 'quarter' | 'year'>('month')

  // Simulação de dados (substituir por chamada real à API)
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Dados simulados
      const mockData: AnalyticsData = {
        totalPatients: 744,
        activePatients: 612,
        newPatients: 45,
        dischargedPatients: 23,
        patientGrowthRate: 12.5,

        totalSessions: 2156,
        averageSessionsPerPatient: 3.5,
        treatmentEffectiveness: 87.3,
        averagePainReduction: 4.2,
        recoveryRate: 78.9,

        painEvolution: Array.from({ length: 30 }, (_, i) => ({
          date: format(subDays(new Date(), 29 - i), 'dd/MM'),
          averagePain: Math.max(1, 8 - (i * 0.15) + Math.random() * 0.8),
          patientCount: Math.floor(50 + Math.random() * 20)
        })),

        painByRegion: [
          { region: 'Lombar', count: 156, averageIntensity: 6.8, improvementRate: 82.4 },
          { region: 'Cervical', count: 134, averageIntensity: 5.9, improvementRate: 78.9 },
          { region: 'Joelho', count: 98, averageIntensity: 7.2, improvementRate: 85.1 },
          { region: 'Ombro', count: 87, averageIntensity: 6.3, improvementRate: 79.3 },
          { region: 'Tornozelo', count: 65, averageIntensity: 5.8, improvementRate: 88.7 },
          { region: 'Punho', count: 43, averageIntensity: 5.2, improvementRate: 91.2 }
        ],

        appointmentMetrics: {
          total: 2456,
          completed: 2145,
          cancelled: 198,
          noShow: 113,
          utilizationRate: 87.3
        },

        treatmentTypes: [
          { type: 'Fisioterapia Manual', patientCount: 245, successRate: 89.4, averageDuration: 8.5 },
          { type: 'Exercícios Terapêuticos', patientCount: 198, successRate: 85.7, averageDuration: 12.3 },
          { type: 'Eletroterapia', patientCount: 156, successRate: 78.9, averageDuration: 6.8 },
          { type: 'Hidroterapia', patientCount: 89, successRate: 91.2, averageDuration: 10.7 },
          { type: 'Pilates Clínico', patientCount: 67, successRate: 93.1, averageDuration: 15.2 }
        ],

        timeSeriesData: Array.from({ length: 90 }, (_, i) => ({
          date: format(subDays(new Date(), 89 - i), 'dd/MM'),
          newPatients: Math.floor(2 + Math.random() * 4),
          sessions: Math.floor(20 + Math.random() * 15),
          revenue: Math.floor(1500 + Math.random() * 800),
          painReduction: Number((Math.random() * 2 + 0.5).toFixed(1))
        }))
      }

      setData(mockData)
      setLoading(false)
    }

    fetchAnalytics()
  }, [dateRange, comparisonPeriod])

  // Cores para gráficos
  const chartColors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    destructive: '#ef4444',
    muted: '#6b7280'
  }

  const painRegionColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando analytics...</span>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Analytics Clínicos</h1>
          <p className="text-muted-foreground">
            Insights e métricas avançadas para otimização do atendimento
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[260px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd 'de' LLL", { locale: ptBR })} -{" "}
                    {format(dateRange.to, "dd 'de' LLL 'de' y", { locale: ptBR })}
                  </>
                ) : (
                  <span>Selecionar período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Select value={comparisonPeriod} onValueChange={setComparisonPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mensal</SelectItem>
              <SelectItem value="quarter">Trimestral</SelectItem>
              <SelectItem value="year">Anual</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activePatients}</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="outline" className="text-green-600 border-green-200">
                <TrendingUp className="mr-1 h-3 w-3" />
                +{data.patientGrowthRate}%
              </Badge>
              {" "}vs. período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efetividade do Tratamento</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.treatmentEffectiveness}%</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="outline" className="text-green-600 border-green-200">
                <TrendingUp className="mr-1 h-3 w-3" />
                +3.2%
              </Badge>
              {" "}melhoria contínua
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redução Média da Dor</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averagePainReduction} pts</div>
            <p className="text-xs text-muted-foreground">
              Escala 0-10, média por tratamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Recuperação</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.recoveryRate}%</div>
            <p className="text-xs text-muted-foreground">
              Alta com objetivos atingidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
          <TabsTrigger value="treatments">Tratamentos</TabsTrigger>
          <TabsTrigger value="pain">Análise da Dor</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Evolução Temporal</CardTitle>
                <CardDescription>Principais métricas ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.timeSeriesData.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="newPatients"
                      stroke={chartColors.primary}
                      name="Novos Pacientes"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="sessions"
                      stroke={chartColors.secondary}
                      name="Sessões"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="painReduction"
                      stroke={chartColors.destructive}
                      name="Redução da Dor"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dor por Região Corporal</CardTitle>
                <CardDescription>Distribuição e intensidade</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.painByRegion}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ region, count }) => `${region}: ${count}`}
                    >
                      {data.painByRegion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={painRegionColors[index % painRegionColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Efetividade por Tipo de Tratamento</CardTitle>
              <CardDescription>Taxa de sucesso e duração média</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.treatmentTypes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="successRate"
                    fill={chartColors.secondary}
                    name="Taxa de Sucesso (%)"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="averageDuration"
                    fill={chartColors.accent}
                    name="Duração Média (sessões)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análise de Pacientes */}
        <TabsContent value="patients" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Crescimento de Pacientes</CardTitle>
                <CardDescription>Novos pacientes por período</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.timeSeriesData.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="newPatients"
                      stroke={chartColors.primary}
                      fill={chartColors.primary}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status dos Pacientes</CardTitle>
                <CardDescription>Distribuição atual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Ativos</span>
                    <Badge variant="outline">{data.activePatients}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Novos (mês)</span>
                    <Badge variant="outline">{data.newPatients}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Alta (mês)</span>
                    <Badge variant="outline">{data.dischargedPatients}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total</span>
                    <Badge>{data.totalPatients}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Análise de Tratamentos */}
        <TabsContent value="treatments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Radar de Efetividade</CardTitle>
              <CardDescription>Comparação entre modalidades terapêuticas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={data.treatmentTypes}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="type" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Taxa de Sucesso"
                    dataKey="successRate"
                    stroke={chartColors.primary}
                    fill={chartColors.primary}
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análise da Dor */}
        <TabsContent value="pain" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Evolução da Dor</CardTitle>
                <CardDescription>Intensidade média ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.painEvolution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="averagePain"
                      stroke={chartColors.destructive}
                      strokeWidth={3}
                      dot={{ fill: chartColors.destructive }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Melhoria por Região</CardTitle>
                <CardDescription>Taxa de melhoria por área tratada</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.painByRegion.map((region, index) => (
                    <div key={region.region} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{region.region}</span>
                        <span className="font-medium">{region.improvementRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${region.improvementRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}