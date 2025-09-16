/**
 * Visualização de Timeline de Dor - FisioFlow
 * Componente para visualizar a progressão da dor ao longo do tempo
 * Inclui formatação brasileira e funcionalidades de exportação
 */

'use client'

import React, { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  ReferenceLine,
  Dot
} from 'recharts'
import { format as formatDate, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Calendar,
  Download,
  TrendingDown,
  TrendingUp,
  Minus,
  Activity,
  BarChart3,
  LineChart as LineChartIcon,
  AreaChart as AreaIcon,
  FileText,
  Filter
} from 'lucide-react'
import type { PainPoint } from '@/lib/supabase/database.types'

interface PainTimelineProps {
  painPoints: PainPoint[]
  patientName?: string
  className?: string
}

interface TimelineData {
  date: string
  dateFormatted: string
  averagePain: number
  maxPain: number
  minPain: number
  totalPoints: number
  regions: string[]
  assessmentType: string
  improvements?: string[]
}

interface RegionTrendData {
  region: string
  trend: 'improving' | 'stable' | 'worsening'
  currentPain: number
  initialPain: number
  changePercentage: number
  lastUpdate: string
}

type ChartType = 'line' | 'area' | 'bar'
type TimeRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'all'

const timeRangeOptions = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1y', label: 'Último ano' },
  { value: 'all', label: 'Todo período' },
]

const chartTypeOptions = [
  { value: 'line', label: 'Linha', icon: LineChartIcon },
  { value: 'area', label: 'Área', icon: AreaIcon },
  { value: 'bar', label: 'Barras', icon: BarChart3 },
]

export default function PainTimeline({
  painPoints,
  patientName,
  className = ''
}: PainTimelineProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('30d')
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('line')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')

  // Processar dados para timeline
  const timelineData = useMemo(() => {
    if (!painPoints.length) return []

    // Agrupar pontos por data
    const groupedByDate = painPoints.reduce((acc, point) => {
      const date = point.created_at ? point.created_at.split('T')[0] : new Date().toISOString().split('T')[0] // Extrair apenas a data
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(point)
      return acc
    }, {} as Record<string, PainPoint[]>)

    // Converter para array de dados da timeline
    return Object.entries(groupedByDate)
      .map(([date, points]) => {
        const intensities = points.map(p => p.pain_intensity)
        const regions = [...new Set(points.map(p => p.body_region))]
        const improvements: string[] = []

        return {
          date,
          dateFormatted: formatDate(parseISO(date), 'dd/MM/yyyy', { locale: ptBR }),
          averagePain: Math.round((intensities.reduce((sum, val) => sum + val, 0) / intensities.length) * 10) / 10,
          maxPain: Math.max(...intensities),
          minPain: Math.min(...intensities),
          totalPoints: points.length,
          regions,
          assessmentType: 'progress',
          improvements
        } as TimelineData
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [painPoints])

  // Filtrar dados por período selecionado
  const filteredTimelineData = useMemo(() => {
    if (selectedTimeRange === 'all') return timelineData

    const now = new Date()
    const cutoffDate = new Date()

    switch (selectedTimeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case '30d':
        cutoffDate.setDate(now.getDate() - 30)
        break
      case '90d':
        cutoffDate.setDate(now.getDate() - 90)
        break
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6)
        break
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1)
        break
    }

    return timelineData.filter(item =>
      parseISO(item.date) >= cutoffDate
    )
  }, [timelineData, selectedTimeRange])

  // Filtrar por região se selecionada
  const finalTimelineData = useMemo(() => {
    if (selectedRegion === 'all') return filteredTimelineData

    return filteredTimelineData.filter(item =>
      item.regions.includes(selectedRegion)
    )
  }, [filteredTimelineData, selectedRegion])

  // Calcular análise de tendências por região
  const regionTrends = useMemo(() => {
    const regions = [...new Set(painPoints.map(p => p.body_region))]

    return regions.map(region => {
      const regionPoints = painPoints
        .filter(p => p.body_region === region)
        .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))

      if (regionPoints.length < 2) {
        return {
          region,
          trend: 'stable' as const,
          currentPain: regionPoints[0]?.pain_intensity || 0,
          initialPain: regionPoints[0]?.pain_intensity || 0,
          changePercentage: 0,
          lastUpdate: regionPoints[0]?.created_at || ''
        }
      }

      const initial = regionPoints[0].pain_intensity
      const current = regionPoints[regionPoints.length - 1].pain_intensity
      const changePercentage = Math.round(((initial - current) / initial) * 100)

      let trend: 'improving' | 'stable' | 'worsening'
      if (changePercentage > 10) trend = 'improving'
      else if (changePercentage < -10) trend = 'worsening'
      else trend = 'stable'

      return {
        region,
        trend,
        currentPain: current,
        initialPain: initial,
        changePercentage: Math.abs(changePercentage),
        lastUpdate: regionPoints[regionPoints.length - 1].created_at || ''
      } as RegionTrendData
    })
  }, [painPoints])

  // Obter lista de regiões únicas
  const uniqueRegions = useMemo(() => {
    return [...new Set(painPoints.map(p => p.body_region).filter(Boolean))] as string[]
  }, [painPoints])

  // Calcular estatísticas gerais
  const stats = useMemo(() => {
    if (!finalTimelineData.length) return null

    const totalAssessments = finalTimelineData.length
    const avgPainOverall = finalTimelineData.reduce((sum, item) => sum + item.averagePain, 0) / totalAssessments
    const highestPain = Math.max(...finalTimelineData.map(item => item.maxPain))
    const lowestPain = Math.min(...finalTimelineData.map(item => item.minPain))

    // Calcular tendência geral
    const firstAvg = finalTimelineData[0]?.averagePain || 0
    const lastAvg = finalTimelineData[finalTimelineData.length - 1]?.averagePain || 0
    const overallTrend = firstAvg > lastAvg ? 'improving' : firstAvg < lastAvg ? 'worsening' : 'stable'
    const trendPercentage = firstAvg !== 0 ? Math.abs(Math.round(((firstAvg - lastAvg) / firstAvg) * 100)) : 0

    return {
      totalAssessments,
      avgPainOverall: Math.round(avgPainOverall * 10) / 10,
      highestPain,
      lowestPain,
      overallTrend,
      trendPercentage
    }
  }, [finalTimelineData])

  const handleExport = async (format: 'pdf' | 'json' | 'csv') => {
    try {
      const exportData = {
        patientName,
        generatedAt: new Date().toISOString(),
        timeRange: selectedTimeRange,
        selectedRegion,
        statistics: stats,
        timeline: finalTimelineData,
        regionTrends
      }

      switch (format) {
        case 'json':
          const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
          })
          const jsonUrl = URL.createObjectURL(jsonBlob)
          const jsonLink = document.createElement('a')
          jsonLink.href = jsonUrl
          jsonLink.download = `timeline-dor-${patientName}-${formatDate(new Date(), 'yyyy-MM-dd')}.json`
          jsonLink.click()
          break

        case 'csv':
          const csvHeaders = [
            'Data',
            'Dor Média',
            'Dor Máxima',
            'Dor Mínima',
            'Total Pontos',
            'Regiões',
            'Tipo Avaliação'
          ].join(',')

          const csvRows = finalTimelineData.map(item => [
            item.dateFormatted,
            item.averagePain,
            item.maxPain,
            item.minPain,
            item.totalPoints,
            `"${item.regions.join(', ')}"`,
            item.assessmentType
          ].join(','))

          const csvContent = [csvHeaders, ...csvRows].join('\n')
          const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          const csvUrl = URL.createObjectURL(csvBlob)
          const csvLink = document.createElement('a')
          csvLink.href = csvUrl
          csvLink.download = `timeline-dor-${patientName}-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`
          csvLink.click()
          break

        case 'pdf':
          // Implementar exportação PDF (pode usar jsPDF ou chamar API)
          console.log('PDF export não implementado ainda')
          break
      }
    } catch (error) {
      console.error('Erro ao exportar dados:', error)
    }
  }

  // Componente de tooltip customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null

    const data = payload[0].payload as TimelineData

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{data.dateFormatted}</p>
        <div className="space-y-1 mt-2">
          <p className="text-sm">
            <span className="text-blue-600">Dor Média:</span> {data.averagePain}/10
          </p>
          {data.maxPain !== data.minPain && (
            <>
              <p className="text-sm">
                <span className="text-red-600">Máxima:</span> {data.maxPain}/10
              </p>
              <p className="text-sm">
                <span className="text-green-600">Mínima:</span> {data.minPain}/10
              </p>
            </>
          )}
          <p className="text-sm">
            <span className="text-gray-600">Regiões:</span> {data.regions.join(', ')}
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Pontos:</span> {data.totalPoints}
          </p>
        </div>
        {data.improvements && data.improvements.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-green-600 font-medium">Melhorias registradas</p>
          </div>
        )}
      </div>
    )
  }

  const renderChart = () => {
    if (!finalTimelineData.length) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nenhum dado disponível para o período selecionado</p>
          </div>
        </div>
      )
    }

    const commonProps = {
      data: finalTimelineData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (selectedChartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="dateFormatted"
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => {
                  const [day, month] = value.split('/')
                  return `${day}/${month}`
                }}
              />
              <YAxis
                domain={[0, 10]}
                stroke="#666"
                fontSize={12}
                label={{ value: 'Intensidade da Dor', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={5} stroke="#ff9800" strokeDasharray="5 5" />
              <Area
                type="monotone"
                dataKey="averagePain"
                stroke="#2563eb"
                fill="#3b82f6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="maxPain"
                stroke="#dc2626"
                fill="#ef4444"
                fillOpacity={0.2}
                strokeWidth={1}
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="dateFormatted"
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => {
                  const [day, month] = value.split('/')
                  return `${day}/${month}`
                }}
              />
              <YAxis
                domain={[0, 10]}
                stroke="#666"
                fontSize={12}
                label={{ value: 'Intensidade da Dor', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine y={5} stroke="#ff9800" strokeDasharray="5 5" />
              <Bar dataKey="averagePain" fill="#3b82f6" name="Dor Média" />
              <Bar dataKey="maxPain" fill="#ef4444" name="Dor Máxima" />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
      default:
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="dateFormatted"
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => {
                  const [day, month] = value.split('/')
                  return `${day}/${month}`
                }}
              />
              <YAxis
                domain={[0, 10]}
                stroke="#666"
                fontSize={12}
                label={{ value: 'Intensidade da Dor', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine y={5} stroke="#ff9800" strokeDasharray="5 5" />
              <Line
                type="monotone"
                dataKey="averagePain"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Dor Média"
              />
              <Line
                type="monotone"
                dataKey="maxPain"
                stroke="#dc2626"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Dor Máxima"
              />
              <Line
                type="monotone"
                dataKey="minPain"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Dor Mínima"
              />
            </LineChart>
          </ResponsiveContainer>
        )
    }
  }

  if (!painPoints.length) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nenhum ponto de dor registrado ainda</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho e Controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span>Timeline da Evolução da Dor</span>
              </CardTitle>
              <CardDescription>
                Acompanhamento da intensidade da dor ao longo do tempo
              </CardDescription>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
              >
                <Download className="h-4 w-4 mr-1" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
              >
                <FileText className="h-4 w-4 mr-1" />
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={selectedTimeRange} onValueChange={(value: TimeRange) => setSelectedTimeRange(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeRangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Região:</span>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as regiões</SelectItem>
                  {uniqueRegions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-1">
              {chartTypeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedChartType === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedChartType(option.value as ChartType)}
                >
                  <option.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>

          {/* Estatísticas Resumidas */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Dor Média</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.avgPainOverall}/10</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 font-medium">Pico Máximo</p>
                    <p className="text-2xl font-bold text-red-900">{stats.highestPain}/10</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-500" />
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Menor Registro</p>
                    <p className="text-2xl font-bold text-green-900">{stats.lowestPain}/10</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Avaliações</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.totalAssessments}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>
          )}

          {/* Gráfico Principal */}
          <div className="bg-white border rounded-lg p-4">
            {renderChart()}
          </div>
        </CardContent>
      </Card>

      {/* Análise de Tendências por Região */}
      <Card>
        <CardHeader>
          <CardTitle>Tendências por Região</CardTitle>
          <CardDescription>
            Análise da evolução da dor por região corporal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {regionTrends.map((trend) => (
              <div key={trend.region} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge
                    className={
                      trend.trend === 'improving'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : trend.trend === 'worsening'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }
                  >
                    {trend.trend === 'improving' && <TrendingDown className="h-3 w-3 mr-1" />}
                    {trend.trend === 'worsening' && <TrendingUp className="h-3 w-3 mr-1" />}
                    {trend.trend === 'stable' && <Minus className="h-3 w-3 mr-1" />}
                    {trend.trend === 'improving' ? 'Melhorando' :
                     trend.trend === 'worsening' ? 'Piorando' : 'Estável'}
                  </Badge>
                  <div>
                    <p className="font-medium text-gray-900">{trend.region}</p>
                    <p className="text-sm text-gray-500">
                      De {trend.initialPain}/10 para {trend.currentPain}/10
                      {trend.changePercentage > 0 && (
                        <span className="ml-1">
                          ({trend.changePercentage}% {trend.trend === 'improving' ? 'redução' : 'aumento'})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Última atualização</p>
                  <p className="text-sm font-medium">
                    {formatDate(parseISO(trend.lastUpdate), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}