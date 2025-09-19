/**
 * Testes de integração para o sistema de relatórios clínicos
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ClinicalReportGenerator, type PatientReport, type ReportType } from '@/src/lib/reports/clinical-reports'

// Mock do puppeteer
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setContent: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content'))
      }),
      close: vi.fn().mockResolvedValue(undefined)
    })
  }
}))

describe('Clinical Report Generator - Integration Tests', () => {
  let generator: ClinicalReportGenerator
  let mockPatientData: PatientReport

  beforeEach(() => {
    generator = new ClinicalReportGenerator()
    
    mockPatientData = {
      patient: {
        id: 'patient-123',
        name: 'João Silva',
        cpf: '123.456.789-00',
        dateOfBirth: '1985-03-15',
        phone: '(11) 99999-9999',
        email: 'joao@email.com'
      },
      therapist: {
        name: 'Dr. Maria Santos',
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
        startDate: '2025-01-01',
        endDate: '2025-01-31',
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
          date: '2025-01-05',
          duration: 60,
          exercises: ['Mobilização articular', 'Exercícios de fortalecimento'],
          observations: 'Paciente apresentou boa evolução',
          painLevel: { before: 8, after: 6 },
          evolution: 'Redução da dor e melhora na mobilidade'
        },
        {
          date: '2025-01-12',
          duration: 60,
          exercises: ['Alongamentos', 'Exercícios de estabilização'],
          observations: 'Progresso mantido',
          painLevel: { before: 6, after: 4 },
          evolution: 'Melhora contínua'
        }
      ],
      painPoints: [
        {
          date: '2025-01-05',
          region: 'Lombar',
          intensity: 8,
          type: 'Pulsante',
          coordinates: { x: 50, y: 70 }
        },
        {
          date: '2025-01-12',
          region: 'Lombar',
          intensity: 4,
          type: 'Leve',
          coordinates: { x: 50, y: 70 }
        }
      ],
      measurements: [
        {
          date: '2025-01-05',
          type: 'Flexão lombar',
          value: 30,
          unit: 'graus',
          observations: 'Limitação inicial'
        },
        {
          date: '2025-01-12',
          type: 'Flexão lombar',
          value: 45,
          unit: 'graus',
          observations: 'Melhora significativa'
        }
      ],
      evolution: {
        initialAssessment: 'Paciente apresenta dor lombar crônica com limitação funcional significativa',
        progressNotes: [
          'Redução da intensidade da dor de 8/10 para 4/10',
          'Melhora na amplitude de movimento lombar',
          'Aumento da força muscular estabilizadora'
        ],
        finalAssessment: 'Excelente evolução do quadro com redução significativa da dor',
        recommendations: [
          'Continuar exercícios domiciliares prescritos',
          'Manter postura adequada durante atividades diárias',
          'Retorno em 30 dias para reavaliação'
        ],
        outcome: 'alta'
      }
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Geração de Relatórios HTML', () => {
    const reportTypes: ReportType[] = [
      'initial_assessment',
      'progress',
      'discharge',
      'medical_certificate',
      'insurance_report'
    ]

    reportTypes.forEach(reportType => {
      it(`deve gerar relatório HTML para ${reportType}`, async () => {
        const htmlContent = await generator.generateReport(mockPatientData, reportType)

        expect(htmlContent).toBeDefined()
        expect(typeof htmlContent).toBe('string')
        expect(htmlContent.length).toBeGreaterThan(100)
        expect(htmlContent).toContain('<!DOCTYPE html>')
        expect(htmlContent).toContain('João Silva')
        expect(htmlContent).toContain('Dr. Maria Santos')
        expect(htmlContent).toContain('Clínica FisioFlow')
      })

      it(`deve gerar relatório HTML com gráficos para ${reportType}`, async () => {
        const htmlContent = await generator.generateReport(mockPatientData, reportType, {
          includeCharts: true
        })

        expect(htmlContent).toContain('svg') // Gráficos SVG
        expect(htmlContent).toContain('chart') // Elementos de gráfico
      })

      it(`deve gerar relatório HTML com imagens para ${reportType}`, async () => {
        const htmlContent = await generator.generateReport(mockPatientData, reportType, {
          includeImages: true
        })

        expect(htmlContent).toContain('<img') // Tags de imagem
      })
    })
  })

  describe('Geração de PDF', () => {
    const reportTypes: ReportType[] = [
      'initial_assessment',
      'progress',
      'discharge',
      'medical_certificate',
      'insurance_report'
    ]

    reportTypes.forEach(reportType => {
      it(`deve gerar PDF para ${reportType}`, async () => {
        const pdfBuffer = await generator.generatePDF(mockPatientData, reportType)

        expect(pdfBuffer).toBeDefined()
        expect(Buffer.isBuffer(pdfBuffer)).toBe(true)
        expect(pdfBuffer.length).toBeGreaterThan(0)
      })

      it(`deve gerar PDF com opções customizadas para ${reportType}`, async () => {
        const pdfBuffer = await generator.generatePDF(mockPatientData, reportType, {
          includeCharts: true,
          includeImages: true
        })

        expect(pdfBuffer).toBeDefined()
        expect(Buffer.isBuffer(pdfBuffer)).toBe(true)
      })
    })

    it('deve lidar com erro na geração de PDF', async () => {
      // Mock puppeteer para lançar erro
      const { default: puppeteer } = await import('puppeteer')
      vi.mocked(puppeteer.launch).mockRejectedValueOnce(new Error('Puppeteer error'))

      await expect(
        generator.generatePDF(mockPatientData, 'progress')
      ).rejects.toThrow('Erro ao gerar PDF: Puppeteer error')
    })
  })

  describe('Validação de Dados', () => {
    it('deve validar dados obrigatórios do paciente', async () => {
      const invalidData = { ...mockPatientData }
      delete invalidData.patient.name

      await expect(
        generator.generateReport(invalidData, 'progress')
      ).rejects.toThrow()
    })

    it('deve validar dados obrigatórios do fisioterapeuta', async () => {
      const invalidData = { ...mockPatientData }
      delete invalidData.therapist.crefito

      await expect(
        generator.generateReport(invalidData, 'progress')
      ).rejects.toThrow()
    })

    it('deve validar dados obrigatórios da clínica', async () => {
      const invalidData = { ...mockPatientData }
      delete invalidData.clinic.name

      await expect(
        generator.generateReport(invalidData, 'progress')
      ).rejects.toThrow()
    })
  })

  describe('Templates de Relatório', () => {
    it('deve ter template específico para avaliação inicial', async () => {
      const htmlContent = await generator.generateReport(mockPatientData, 'initial_assessment')

      expect(htmlContent).toContain('AVALIAÇÃO INICIAL')
      expect(htmlContent).toContain('Anamnese')
      expect(htmlContent).toContain('Exame Físico')
    })

    it('deve ter template específico para relatório de evolução', async () => {
      const htmlContent = await generator.generateReport(mockPatientData, 'progress')

      expect(htmlContent).toContain('RELATÓRIO DE EVOLUÇÃO')
      expect(htmlContent).toContain('Sessões Realizadas')
      expect(htmlContent).toContain('Gráfico de Evolução')
    })

    it('deve ter template específico para relatório de alta', async () => {
      const htmlContent = await generator.generateReport(mockPatientData, 'discharge')

      expect(htmlContent).toContain('RELATÓRIO DE ALTA')
      expect(htmlContent).toContain('Resumo do Tratamento')
      expect(htmlContent).toContain('Recomendações')
    })

    it('deve ter template específico para atestado médico', async () => {
      const htmlContent = await generator.generateReport(mockPatientData, 'medical_certificate')

      expect(htmlContent).toContain('ATESTADO MÉDICO')
      expect(htmlContent).toContain('CREFITO')
      expect(htmlContent).toContain('Assinatura')
    })

    it('deve ter template específico para relatório de convênio', async () => {
      const htmlContent = await generator.generateReport(mockPatientData, 'insurance_report')

      expect(htmlContent).toContain('RELATÓRIO PARA CONVÊNIO')
      expect(htmlContent).toContain('CID')
      expect(htmlContent).toContain('Procedimentos')
    })
  })

  describe('Performance e Otimização', () => {
    it('deve gerar relatório em tempo razoável', async () => {
      const startTime = Date.now()
      
      await generator.generateReport(mockPatientData, 'progress')
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Deve gerar em menos de 5 segundos
      expect(duration).toBeLessThan(5000)
    })

    it('deve gerar PDF em tempo razoável', async () => {
      const startTime = Date.now()
      
      await generator.generatePDF(mockPatientData, 'progress')
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Deve gerar em menos de 10 segundos
      expect(duration).toBeLessThan(10000)
    })
  })
})
