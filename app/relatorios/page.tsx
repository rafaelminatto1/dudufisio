'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Download,
  Calendar as CalendarIcon,
  Filter,
  Clock,
  Users,
  Activity,
  Target,
  TrendingUp,
  FileDown,
  Mail,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

interface ReportTemplate {
  id: string
  name: string
  description: string
  category: 'clinical' | 'administrative' | 'financial' | 'quality'
  format: 'pdf' | 'excel' | 'csv'
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'on-demand'
  lastGenerated?: string
  isScheduled: boolean
  recipients?: string[]
}

interface GeneratedReport {
  id: string
  templateId: string
  name: string
  category: string
  format: string
  generatedAt: string
  generatedBy: string
  status: 'generating' | 'ready' | 'failed'
  size?: string
  downloadUrl?: string
}

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState('last_month')
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined
  })
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([])
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([])
  const [loading, setLoading] = useState(false)
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchReportTemplates()
    fetchGeneratedReports()
  }, [])

  const fetchReportTemplates = async () => {
    // Mock data - replace with actual API call
    const mockTemplates: ReportTemplate[] = [
      {
        id: 'clinical-evolution',
        name: 'Relatório de Evolução Clínica',
        description: 'Evolução dos pacientes com resultados de tratamentos e alta',
        category: 'clinical',
        format: 'pdf',
        frequency: 'monthly',
        lastGenerated: '2025-01-15T10:30:00Z',
        isScheduled: true,
        recipients: ['fisioterapeuta@clinica.com']
      },
      {
        id: 'attendance-summary',
        name: 'Resumo de Atendimentos',
        description: 'Estatísticas de agendamentos, presenças e faltas por período',
        category: 'administrative',
        format: 'excel',
        frequency: 'weekly',
        lastGenerated: '2025-01-10T09:00:00Z',
        isScheduled: true
      },
      {
        id: 'financial-revenue',
        name: 'Relatório de Receitas',
        description: 'Análise financeira detalhada com receitas por terapeuta e procedimento',
        category: 'financial',
        format: 'excel',
        frequency: 'monthly',
        lastGenerated: '2025-01-01T08:00:00Z',
        isScheduled: true,
        recipients: ['administracao@clinica.com']
      },
      {
        id: 'patient-satisfaction',
        name: 'Pesquisa de Satisfação',
        description: 'Resultados das avaliações de satisfação dos pacientes',
        category: 'quality',
        format: 'pdf',
        frequency: 'quarterly',
        lastGenerated: '2024-12-31T12:00:00Z',
        isScheduled: true
      },
      {
        id: 'exercise-adherence',
        name: 'Aderência aos Exercícios',
        description: 'Análise da execução e aderência às prescrições de exercícios',
        category: 'clinical',
        format: 'pdf',
        frequency: 'monthly',
        isScheduled: false
      },
      {
        id: 'therapist-performance',
        name: 'Desempenho dos Terapeutas',
        description: 'Produtividade e avaliação dos profissionais',
        category: 'administrative',
        format: 'excel',
        frequency: 'monthly',
        isScheduled: false
      },
      {
        id: 'appointment-analysis',
        name: 'Análise de Agendamentos',
        description: 'Padrões de agendamento, taxa de ocupação e otimização',
        category: 'administrative',
        format: 'pdf',
        frequency: 'weekly',
        isScheduled: false
      },
      {
        id: 'lgpd-compliance',
        name: 'Relatório LGPD',
        description: 'Controle de acessos e conformidade com proteção de dados',
        category: 'administrative',
        format: 'pdf',
        frequency: 'quarterly',
        lastGenerated: '2024-10-01T14:00:00Z',
        isScheduled: true
      }
    ]

    setReportTemplates(mockTemplates)
  }

  const fetchGeneratedReports = async () => {
    // Mock data - replace with actual API call
    const mockGenerated: GeneratedReport[] = [
      {
        id: 'rep-001',
        templateId: 'clinical-evolution',
        name: 'Evolução Clínica - Janeiro 2025',
        category: 'clinical',
        format: 'pdf',
        generatedAt: '2025-01-15T10:30:00Z',
        generatedBy: 'Sistema',
        status: 'ready',
        size: '2.4 MB',
        downloadUrl: '/api/reports/download/rep-001'
      },
      {
        id: 'rep-002',
        templateId: 'attendance-summary',
        name: 'Atendimentos - Semana 02/2025',
        category: 'administrative',
        format: 'excel',
        generatedAt: '2025-01-10T09:00:00Z',
        generatedBy: 'Dr. Silva',
        status: 'ready',
        size: '1.1 MB',
        downloadUrl: '/api/reports/download/rep-002'
      },
      {
        id: 'rep-003',
        templateId: 'financial-revenue',
        name: 'Receitas - Dezembro 2024',
        category: 'financial',
        format: 'excel',
        generatedAt: '2025-01-01T08:00:00Z',
        generatedBy: 'Sistema',
        status: 'ready',
        size: '3.7 MB',
        downloadUrl: '/api/reports/download/rep-003'
      },
      {
        id: 'rep-004',
        templateId: 'exercise-adherence',
        name: 'Aderência Exercícios - Janeiro 2025',
        category: 'clinical',
        format: 'pdf',
        generatedAt: '2025-01-16T11:00:00Z',
        generatedBy: 'Dra. Costa',
        status: 'generating',
        size: undefined
      }
    ]

    setGeneratedReports(mockGenerated)
  }

  const generateReport = async (templateId: string) => {
    setGeneratingReports(prev => new Set(prev).add(templateId))
    setLoading(true)

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      const template = reportTemplates.find(t => t.id === templateId)
      if (template) {
        const newReport: GeneratedReport = {
          id: `rep-${Date.now()}`,
          templateId: templateId,
          name: `${template.name} - ${format(new Date(), 'MMMM yyyy', { locale: pt })}`,
          category: template.category,
          format: template.format,
          generatedAt: new Date().toISOString(),
          generatedBy: 'Usuário Atual',
          status: 'ready',
          size: '1.8 MB',
          downloadUrl: `/api/reports/download/rep-${Date.now()}`
        }

        setGeneratedReports(prev => [newReport, ...prev])
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
    } finally {
      setGeneratingReports(prev => {
        const newSet = new Set(prev)
        newSet.delete(templateId)
        return newSet
      })
      setLoading(false)
    }
  }

  const downloadReport = (report: GeneratedReport) => {
    // Mock download
    console.log('Downloading report:', report.name)
    // window.open(report.downloadUrl, '_blank')
  }

  const scheduleReport = (templateId: string) => {
    // TODO: Implement scheduling modal
    console.log('Scheduling report:', templateId)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: pt })
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'clinical':
        return <Activity className="h-4 w-4" />
      case 'administrative':
        return <Users className="h-4 w-4" />
      case 'financial':
        return <TrendingUp className="h-4 w-4" />
      case 'quality':
        return <Target className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'clinical':
        return 'bg-blue-100 text-blue-800'
      case 'administrative':
        return 'bg-green-100 text-green-800'
      case 'financial':
        return 'bg-yellow-100 text-yellow-800'
      case 'quality':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800'
      case 'generating':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredTemplates = reportTemplates.filter(template =>
    selectedCategory === 'all' || template.category === selectedCategory
  )

  const filteredReports = generatedReports.filter(report =>
    selectedCategory === 'all' || report.category === selectedCategory
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Gere relatórios e acompanhe métricas da clínica
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem value="clinical">Clínico</SelectItem>
              <SelectItem value="administrative">Administrativo</SelectItem>
              <SelectItem value="financial">Financeiro</SelectItem>
              <SelectItem value="quality">Qualidade</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_week">Última semana</SelectItem>
              <SelectItem value="last_month">Último mês</SelectItem>
              <SelectItem value="last_quarter">Último trimestre</SelectItem>
              <SelectItem value="last_year">Último ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">Modelos de Relatório</TabsTrigger>
          <TabsTrigger value="generated">Relatórios Gerados</TabsTrigger>
          <TabsTrigger value="scheduled">Agendamentos</TabsTrigger>
        </TabsList>

        {/* Report Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(template.category)}
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={getCategoryColor(template.category)}>
                          {template.category === 'clinical' && 'Clínico'}
                          {template.category === 'administrative' && 'Administrativo'}
                          {template.category === 'financial' && 'Financeiro'}
                          {template.category === 'quality' && 'Qualidade'}
                        </Badge>
                        <Badge variant="outline">
                          {template.format.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {template.isScheduled && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Agendado
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <CardDescription>{template.description}</CardDescription>

                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Frequência:</span>
                      <span className="capitalize">{template.frequency === 'on-demand' ? 'Sob demanda' : template.frequency}</span>
                    </div>
                    {template.lastGenerated && (
                      <div className="flex justify-between">
                        <span>Último gerado:</span>
                        <span>{formatDate(template.lastGenerated)}</span>
                      </div>
                    )}
                    {template.recipients && template.recipients.length > 0 && (
                      <div className="flex justify-between">
                        <span>Destinatários:</span>
                        <span>{template.recipients.length}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      onClick={() => generateReport(template.id)}
                      disabled={generatingReports.has(template.id)}
                      size="sm"
                      className="flex-1"
                    >
                      {generatingReports.has(template.id) ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <FileDown className="h-4 w-4 mr-2" />
                          Gerar
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => scheduleReport(template.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Generated Reports */}
        <TabsContent value="generated" className="space-y-4">
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum relatório encontrado</h3>
                <p className="text-muted-foreground text-center">
                  Não há relatórios gerados para os filtros selecionados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                          {getCategoryIcon(report.category)}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-medium">{report.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>Gerado por {report.generatedBy}</span>
                            <span>•</span>
                            <span>{formatDate(report.generatedAt)}</span>
                            {report.size && (
                              <>
                                <span>•</span>
                                <span>{report.size}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge
                          variant="secondary"
                          className={getStatusColor(report.status)}
                        >
                          {report.status === 'ready' && 'Pronto'}
                          {report.status === 'generating' && 'Gerando'}
                          {report.status === 'failed' && 'Falhou'}
                        </Badge>

                        <Badge variant="outline">
                          {report.format.toUpperCase()}
                        </Badge>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log('Preview:', report.name)}
                            disabled={report.status !== 'ready'}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReport(report)}
                            disabled={report.status !== 'ready'}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log('Send email:', report.name)}
                            disabled={report.status !== 'ready'}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Scheduled Reports */}
        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Agendados</CardTitle>
              <CardDescription>
                Configure envio automático de relatórios por email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportTemplates
                  .filter(t => t.isScheduled)
                  .map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(template.category)}
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge variant="secondary" className={getCategoryColor(template.category)}>
                            {template.category === 'clinical' && 'Clínico'}
                            {template.category === 'administrative' && 'Administrativo'}
                            {template.category === 'financial' && 'Financeiro'}
                            {template.category === 'quality' && 'Qualidade'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Frequência: {template.frequency} •
                          {template.recipients && ` ${template.recipients.length} destinatário(s)`}
                          {template.lastGenerated && ` • Último: ${formatDate(template.lastGenerated)}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                        <Button variant="outline" size="sm">
                          Pausar
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>

              <Separator className="my-6" />

              <div className="text-center">
                <h3 className="font-medium mb-2">Configurar Novo Agendamento</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Automatize a geração e envio de relatórios importantes
                </p>
                <Button variant="outline">
                  <Clock className="h-4 w-4 mr-2" />
                  Adicionar Agendamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}