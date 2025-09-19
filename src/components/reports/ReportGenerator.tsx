'use client'

import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/src/components/ui/dialog'
import { Badge } from '@/src/components/ui/badge'
import { Calendar } from '@/src/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { Label } from '@/src/components/ui/label'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Separator } from '@/src/components/ui/separator'
import logger from '../../../lib/logger';
import {
  FileText, 
  Download, 
  Calendar as CalendarIcon, 
  User, 
  Settings,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { ClinicalReportGenerator, type PatientReport, type ReportType } from '@/src/lib/reports/clinical-reports'

interface ReportGeneratorProps {
  patientId: string
  patientName: string
  onReportGenerated?: (reportType: ReportType, success: boolean) => void
}

export function ReportGenerator({ patientId, patientName, onReportGenerated }: ReportGeneratorProps) {
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('progress')
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
    to: new Date()
  })
  const [options, setOptions] = useState({
    includeCharts: true,
    includeImages: true,
    includePainPoints: true,
    includeMeasurements: true
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const reportTypes = [
    {
      type: 'initial_assessment' as ReportType,
      name: 'Avaliação Inicial',
      description: 'Relatório completo da primeira avaliação do paciente',
      icon: '📋'
    },
    {
      type: 'progress' as ReportType,
      name: 'Evolução',
      description: 'Relatório de progresso e evolução do tratamento',
      icon: '📈'
    },
    {
      type: 'discharge' as ReportType,
      name: 'Alta',
      description: 'Relatório de alta com resumo do tratamento',
      icon: '✅'
    },
    {
      type: 'medical_certificate' as ReportType,
      name: 'Atestado',
      description: 'Atestado médico para ausência ou limitação',
      icon: '🏥'
    },
    {
      type: 'insurance_report' as ReportType,
      name: 'Convênio',
      description: 'Relatório para planos de saúde e convênios',
      icon: '💳'
    }
  ]

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    
    try {
      // Simular dados do paciente (em produção, buscar do banco)
      const reportData: PatientReport = {
        patient: {
          id: patientId,
          name: patientName,
          cpf: '123.456.789-00',
          dateOfBirth: '1985-03-15',
          phone: '(11) 99999-9999',
          email: 'paciente@email.com'
        },
        therapist: {
          name: 'Dr. João Silva',
          crefito: 'CREFITO 123456-F',
          signature: 'signature.png'
        },
        clinic: {
          name: 'Clínica FisioFlow',
          address: 'Rua das Flores, 123 - São Paulo/SP',
          phone: '(11) 3333-4444',
          email: 'contato@fisioflow.com.br',
          logo: 'logo.png'
        },
        treatment: {
          startDate: format(dateRange.from, 'yyyy-MM-dd'),
          endDate: format(dateRange.to, 'yyyy-MM-dd'),
          diagnosis: 'Dor lombar crônica',
          objectives: [
            'Reduzir intensidade da dor',
            'Melhorar amplitude de movimento',
            'Fortalecer musculatura estabilizadora'
          ],
          plan: 'Fisioterapia manual, exercícios terapêuticos e orientações posturais'
        },
        sessions: [
          {
            date: '2025-01-10',
            duration: 60,
            exercises: ['Mobilização articular', 'Exercícios de fortalecimento'],
            observations: 'Paciente apresentou boa evolução',
            painLevel: { before: 7, after: 5 },
            evolution: 'Melhora na amplitude de movimento'
          }
        ],
        painPoints: [
          {
            date: '2025-01-10',
            region: 'Lombar',
            intensity: 7,
            type: 'Pulsante',
            coordinates: { x: 50, y: 70 }
          }
        ],
        measurements: [
          {
            date: '2025-01-10',
            type: 'Flexão lombar',
            value: 45,
            unit: 'graus',
            observations: 'Limitação inicial'
          }
        ],
        evolution: {
          initialAssessment: 'Paciente apresenta dor lombar crônica com limitação funcional',
          progressNotes: [
            'Redução da intensidade da dor de 8/10 para 5/10',
            'Melhora na amplitude de movimento lombar',
            'Aumento da força muscular'
          ],
          finalAssessment: 'Excelente evolução do quadro',
          recommendations: [
            'Continuar exercícios domiciliares',
            'Manter postura adequada',
            'Retorno em 30 dias'
          ],
          outcome: 'alta'
        }
      }

      const generator = new ClinicalReportGenerator()
      
      // Gerar PDF
      const pdfBuffer = await generator.generatePDF(reportData, selectedReportType, {
        includeCharts: options.includeCharts,
        includeImages: options.includeImages
      })

      // Criar e baixar arquivo
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `relatorio-${selectedReportType}-${patientName}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Relatório gerado e baixado com sucesso!')
      onReportGenerated?.(selectedReportType, true)
      setIsOpen(false)

    } catch (error) {
      logger.error('Erro ao gerar relatório:', error)
      toast.error('Erro ao gerar relatório. Tente novamente.')
      onReportGenerated?.(selectedReportType, false)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <FileText className="mr-2 h-4 w-4" />
          Gerar Relatório
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Relatório Clínico
          </DialogTitle>
          <DialogDescription>
            Configure e gere relatórios profissionais para {patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tipo de Relatório */}
          <div className="space-y-3">
            <Label>Tipo de Relatório</Label>
            <div className="grid gap-3">
              {reportTypes.map((report) => (
                <Card 
                  key={report.type}
                  className={`cursor-pointer transition-colors ${
                    selectedReportType === report.type 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedReportType(report.type)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{report.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium">{report.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {report.description}
                        </div>
                      </div>
                      {selectedReportType === report.type && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Período */}
          <div className="space-y-3">
            <Label>Período do Relatório</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <Separator />

          {/* Opções */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Opções do Relatório
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeCharts"
                  checked={options.includeCharts}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeCharts: !!checked }))
                  }
                />
                <Label htmlFor="includeCharts" className="text-sm">
                  Incluir Gráficos
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeImages"
                  checked={options.includeImages}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeImages: !!checked }))
                  }
                />
                <Label htmlFor="includeImages" className="text-sm">
                  Incluir Imagens
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includePainPoints"
                  checked={options.includePainPoints}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includePainPoints: !!checked }))
                  }
                />
                <Label htmlFor="includePainPoints" className="text-sm">
                  Pontos de Dor
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeMeasurements"
                  checked={options.includeMeasurements}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeMeasurements: !!checked }))
                  }
                />
                <Label htmlFor="includeMeasurements" className="text-sm">
                  Medidas
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerateReport} 
            disabled={isGenerating}
            className="min-w-[140px]"
          >
            {isGenerating ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Gerar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
