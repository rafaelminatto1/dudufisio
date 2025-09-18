/**
 * Sistema de Geração de Relatórios Clínicos
 * Gera relatórios em PDF para evolução de pacientes, alta e progresso
 */

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface PatientReport {
  patient: {
    id: string
    name: string
    cpf: string
    dateOfBirth: string
    phone: string
    email?: string
  }
  therapist: {
    name: string
    crefito: string
    signature?: string
  }
  clinic: {
    name: string
    address: string
    phone: string
    email: string
    logo?: string
  }
  treatment: {
    startDate: string
    endDate?: string
    diagnosis: string
    objectives: string[]
    plan: string
  }
  sessions: Array<{
    date: string
    duration: number
    exercises: string[]
    observations: string
    painLevel: {
      before: number
      after: number
    }
    evolution: string
  }>
  painPoints: Array<{
    date: string
    region: string
    intensity: number
    type: string
    coordinates: { x: number; y: number }
  }>
  measurements: Array<{
    date: string
    type: string
    value: number
    unit: string
    observations?: string
  }>
  evolution: {
    initialAssessment: string
    progressNotes: string[]
    finalAssessment?: string
    recommendations: string[]
    outcome: 'alta' | 'continuidade' | 'encaminhamento'
  }
}

export type ReportType =
  | 'initial_assessment'  // Avaliação inicial
  | 'progress'           // Evolução do tratamento
  | 'discharge'          // Relatório de alta
  | 'medical_certificate' // Atestado médico
  | 'insurance_report'   // Relatório para convênio

export interface ReportTemplate {
  type: ReportType
  title: string
  sections: ReportSection[]
  footer?: string
  watermark?: string
}

export interface ReportSection {
  title: string
  content: string | ReportChart | ReportTable
  pageBreak?: boolean
}

export interface ReportChart {
  type: 'line' | 'bar' | 'pie'
  data: any[]
  title: string
  xAxis?: string
  yAxis?: string
}

export interface ReportTable {
  headers: string[]
  rows: string[][]
  title?: string
}

class ClinicalReportGenerator {
  /**
   * Gera relatório clínico completo
   */
  async generateReport(
    reportData: PatientReport,
    reportType: ReportType,
    options?: {
      includeCharts?: boolean
      includeImages?: boolean
      template?: string
    }
  ): Promise<string> {
    const template = this.getTemplate(reportType)
    const htmlContent = await this.buildHtmlReport(reportData, template, options)

    return htmlContent
  }

  /**
   * Gera PDF do relatório
   */
  async generatePDF(
    reportData: PatientReport,
    reportType: ReportType,
    options?: {
      includeCharts?: boolean
      includeImages?: boolean
      template?: string
    }
  ): Promise<Buffer> {
    const htmlContent = await this.generateReport(reportData, reportType, options)

    // Em produção, usar biblioteca como puppeteer ou jsPDF
    // Por enquanto, retorna mock
    return Buffer.from(htmlContent, 'utf-8')
  }

  /**
   * Obtém template por tipo de relatório
   */
  private getTemplate(reportType: ReportType): ReportTemplate {
    switch (reportType) {
      case 'initial_assessment':
        return this.getInitialAssessmentTemplate()

      case 'progress':
        return this.getProgressTemplate()

      case 'discharge':
        return this.getDischargeTemplate()

      case 'medical_certificate':
        return this.getMedicalCertificateTemplate()

      case 'insurance_report':
        return this.getInsuranceReportTemplate()

      default:
        throw new Error(`Tipo de relatório não suportado: ${reportType}`)
    }
  }

  /**
   * Template de avaliação inicial
   */
  private getInitialAssessmentTemplate(): ReportTemplate {
    return {
      type: 'initial_assessment',
      title: 'RELATÓRIO DE AVALIAÇÃO FISIOTERAPÊUTICA INICIAL',
      sections: [
        {
          title: 'DADOS DO PACIENTE',
          content: `
            <div class="patient-info">
              <p><strong>Nome:</strong> {{patient.name}}</p>
              <p><strong>CPF:</strong> {{patient.cpf}}</p>
              <p><strong>Data de Nascimento:</strong> {{patient.dateOfBirth}}</p>
              <p><strong>Telefone:</strong> {{patient.phone}}</p>
              <p><strong>Email:</strong> {{patient.email}}</p>
            </div>
          `
        },
        {
          title: 'DIAGNÓSTICO CLÍNICO',
          content: '{{treatment.diagnosis}}'
        },
        {
          title: 'OBJETIVOS DO TRATAMENTO',
          content: `
            <ul>
              {{#each treatment.objectives}}
              <li>{{this}}</li>
              {{/each}}
            </ul>
          `
        },
        {
          title: 'AVALIAÇÃO INICIAL',
          content: '{{evolution.initialAssessment}}'
        },
        {
          title: 'PLANO TERAPÊUTICO',
          content: '{{treatment.plan}}'
        },
        {
          title: 'MAPA CORPORAL DE DOR',
          content: {
            type: 'line',
            data: [],
            title: 'Pontos de Dor Identificados'
          } as ReportChart
        }
      ],
      footer: `
        <div class="signature">
          <p>{{therapist.name}}</p>
          <p>CREFITO: {{therapist.crefito}}</p>
          <p>Data: {{currentDate}}</p>
        </div>
      `
    }
  }

  /**
   * Template de evolução
   */
  private getProgressTemplate(): ReportTemplate {
    return {
      type: 'progress',
      title: 'RELATÓRIO DE EVOLUÇÃO FISIOTERAPÊUTICA',
      sections: [
        {
          title: 'DADOS DO PACIENTE',
          content: `
            <div class="patient-info">
              <p><strong>Nome:</strong> {{patient.name}}</p>
              <p><strong>Período:</strong> {{treatment.startDate}} a {{currentDate}}</p>
              <p><strong>Diagnóstico:</strong> {{treatment.diagnosis}}</p>
            </div>
          `
        },
        {
          title: 'EVOLUÇÃO DO TRATAMENTO',
          content: `
            <div class="progress-notes">
              {{#each evolution.progressNotes}}
              <p>• {{this}}</p>
              {{/each}}
            </div>
          `
        },
        {
          title: 'GRÁFICO DE EVOLUÇÃO DA DOR',
          content: {
            type: 'line',
            data: [],
            title: 'Intensidade da Dor ao Longo do Tempo',
            xAxis: 'Data',
            yAxis: 'Intensidade (0-10)'
          } as ReportChart
        },
        {
          title: 'RESUMO DAS SESSÕES',
          content: {
            headers: ['Data', 'Duração', 'Dor Antes', 'Dor Depois', 'Observações'],
            rows: [],
            title: 'Sessões Realizadas'
          } as ReportTable
        },
        {
          title: 'RECOMENDAÇÕES',
          content: `
            <ul>
              {{#each evolution.recommendations}}
              <li>{{this}}</li>
              {{/each}}
            </ul>
          `
        }
      ]
    }
  }

  /**
   * Template de alta
   */
  private getDischargeTemplate(): ReportTemplate {
    return {
      type: 'discharge',
      title: 'RELATÓRIO DE ALTA FISIOTERAPÊUTICA',
      sections: [
        {
          title: 'DADOS DO PACIENTE',
          content: `
            <div class="patient-info">
              <p><strong>Nome:</strong> {{patient.name}}</p>
              <p><strong>Período de Tratamento:</strong> {{treatment.startDate}} a {{treatment.endDate}}</p>
              <p><strong>Total de Sessões:</strong> {{totalSessions}}</p>
            </div>
          `
        },
        {
          title: 'DIAGNÓSTICO INICIAL',
          content: '{{treatment.diagnosis}}'
        },
        {
          title: 'OBJETIVOS ALCANÇADOS',
          content: `
            <ul>
              {{#each treatment.objectives}}
              <li class="achieved">{{this}} ✓</li>
              {{/each}}
            </ul>
          `
        },
        {
          title: 'AVALIAÇÃO FINAL',
          content: '{{evolution.finalAssessment}}'
        },
        {
          title: 'COMPARATIVO DE EVOLUÇÃO',
          content: {
            type: 'bar',
            data: [],
            title: 'Antes vs Depois do Tratamento'
          } as ReportChart
        },
        {
          title: 'RECOMENDAÇÕES PÓS-ALTA',
          content: `
            <div class="recommendations">
              {{#each evolution.recommendations}}
              <p>• {{this}}</p>
              {{/each}}
            </div>
          `
        },
        {
          title: 'PROGNÓSTICO',
          content: `
            <p><strong>Resultado do Tratamento:</strong> {{evolution.outcome}}</p>
            <p>Paciente apresentou evolução satisfatória durante o período de tratamento, atingindo os objetivos propostos.</p>
          `
        }
      ]
    }
  }

  /**
   * Template de atestado médico
   */
  private getMedicalCertificateTemplate(): ReportTemplate {
    return {
      type: 'medical_certificate',
      title: 'ATESTADO FISIOTERAPÊUTICO',
      sections: [
        {
          title: '',
          content: `
            <div class="certificate">
              <p>Atesto para os devidos fins que o(a) Sr(a). <strong>{{patient.name}}</strong>,
              portador(a) do CPF {{patient.cpf}}, esteve sob meus cuidados fisioterapêuticos
              no período de {{treatment.startDate}} a {{currentDate}}.</p>

              <p>Diagnóstico: {{treatment.diagnosis}}</p>

              <p>O paciente necessita de afastamento das atividades laborais/escolares por
              um período de _____ dias para continuidade do tratamento fisioterapêutico.</p>

              <p>Por ser verdade, firmo o presente atestado.</p>
            </div>
          `
        }
      ],
      footer: `
        <div class="signature-certificate">
          <br><br>
          <div style="text-align: center;">
            <hr style="width: 300px; margin: 0 auto;">
            <p>{{therapist.name}}</p>
            <p>Fisioterapeuta - CREFITO: {{therapist.crefito}}</p>
            <p>{{clinic.name}}</p>
            <p>{{currentDate}}</p>
          </div>
        </div>
      `
    }
  }

  /**
   * Template para convênio
   */
  private getInsuranceReportTemplate(): ReportTemplate {
    return {
      type: 'insurance_report',
      title: 'RELATÓRIO PARA CONVÊNIO MÉDICO',
      sections: [
        {
          title: 'IDENTIFICAÇÃO DO PACIENTE',
          content: `
            <div class="patient-info">
              <p><strong>Nome:</strong> {{patient.name}}</p>
              <p><strong>CPF:</strong> {{patient.cpf}}</p>
              <p><strong>Data de Nascimento:</strong> {{patient.dateOfBirth}}</p>
              <p><strong>Número da Carteirinha:</strong> {{insurance.cardNumber}}</p>
            </div>
          `
        },
        {
          title: 'DADOS DO TRATAMENTO',
          content: `
            <p><strong>CID:</strong> {{treatment.cid}}</p>
            <p><strong>Diagnóstico:</strong> {{treatment.diagnosis}}</p>
            <p><strong>Data de Início:</strong> {{treatment.startDate}}</p>
            <p><strong>Previsão de Término:</strong> {{treatment.expectedEndDate}}</p>
            <p><strong>Frequência:</strong> {{treatment.frequency}} sessões por semana</p>
          `
        },
        {
          title: 'PROCEDIMENTOS REALIZADOS',
          content: {
            headers: ['Data', 'Procedimento', 'Código TUSS', 'Observações'],
            rows: [],
            title: 'Sessões de Fisioterapia'
          } as ReportTable
        },
        {
          title: 'EVOLUÇÃO CLÍNICA',
          content: '{{evolution.progressNotes}}'
        },
        {
          title: 'JUSTIFICATIVA PARA CONTINUIDADE',
          content: `
            <p>O paciente apresenta evolução clínica satisfatória, porém necessita de
            continuidade do tratamento fisioterapêutico para consolidação dos ganhos
            obtidos e prevenção de recidivas.</p>

            <p><strong>Sessões Solicitadas:</strong> {{requestedSessions}} sessões</p>
            <p><strong>Período:</strong> {{requestedPeriod}}</p>
          `
        }
      ]
    }
  }

  /**
   * Constrói HTML do relatório
   */
  private async buildHtmlReport(
    data: PatientReport,
    template: ReportTemplate,
    options?: any
  ): Promise<string> {
    const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

    // Template base do HTML
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.title}</title>
        <style>
          ${this.getReportStyles()}
        </style>
      </head>
      <body>
        <div class="report-container">
          <header class="report-header">
            <div class="clinic-info">
              <h1>${data.clinic.name}</h1>
              <p>${data.clinic.address}</p>
              <p>Tel: ${data.clinic.phone} | Email: ${data.clinic.email}</p>
            </div>
          </header>

          <div class="report-title">
            <h2>${template.title}</h2>
          </div>

          <div class="report-content">
            ${this.renderSections(template.sections, data)}
          </div>

          ${template.footer ? `
            <footer class="report-footer">
              ${this.renderTemplate(template.footer, { ...data, currentDate })}
            </footer>
          ` : ''}
        </div>
      </body>
      </html>
    `

    return htmlTemplate
  }

  /**
   * Renderiza seções do relatório
   */
  private renderSections(sections: ReportSection[], data: PatientReport): string {
    return sections.map(section => {
      let content = ''

      if (typeof section.content === 'string') {
        content = this.renderTemplate(section.content, data)
      } else if ('type' in section.content) {
        // Renderizar gráfico
        content = this.renderChart(section.content as ReportChart)
      } else if ('headers' in section.content) {
        // Renderizar tabela
        content = this.renderTable(section.content as ReportTable, data)
      }

      return `
        <section class="report-section${section.pageBreak ? ' page-break' : ''}">
          <h3>${section.title}</h3>
          <div class="section-content">
            ${content}
          </div>
        </section>
      `
    }).join('')
  }

  /**
   * Renderiza template com dados
   */
  private renderTemplate(template: string, data: any): string {
    // Implementação simples de template engine
    let result = template

    // Substituir variáveis simples
    result = result.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path.trim())
      return value !== undefined ? String(value) : match
    })

    // Processar loops each
    result = result.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, path, content) => {
      const array = this.getNestedValue(data, path.trim())
      if (Array.isArray(array)) {
        return array.map(item => {
          return content.replace(/\{\{this\}\}/g, String(item))
        }).join('')
      }
      return ''
    })

    return result
  }

  /**
   * Obtém valor aninhado de objeto
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Renderiza gráfico como SVG
   */
  private renderChart(chart: ReportChart): string {
    // Implementação básica de gráfico SVG
    return `
      <div class="chart-container">
        <h4>${chart.title}</h4>
        <svg width="600" height="300" class="chart">
          <!-- Gráfico será implementado com dados reais -->
          <text x="300" y="150" text-anchor="middle" class="chart-placeholder">
            Gráfico: ${chart.title}
          </text>
        </svg>
      </div>
    `
  }

  /**
   * Renderiza tabela
   */
  private renderTable(table: ReportTable, data: PatientReport): string {
    const headers = table.headers.map(h => `<th>${h}</th>`).join('')

    // Para dados dinâmicos, extrair de sessions ou outros arrays
    let rows = ''
    if (table.title?.includes('Sessões')) {
      rows = data.sessions.map(session => `
        <tr>
          <td>${format(new Date(session.date), 'dd/MM/yyyy')}</td>
          <td>${session.duration}min</td>
          <td>${session.painLevel.before}</td>
          <td>${session.painLevel.after}</td>
          <td>${session.observations}</td>
        </tr>
      `).join('')
    } else {
      rows = table.rows.map(row =>
        `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
      ).join('')
    }

    return `
      <div class="table-container">
        ${table.title ? `<h4>${table.title}</h4>` : ''}
        <table class="report-table">
          <thead>
            <tr>${headers}</tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `
  }

  /**
   * Estilos CSS para o relatório
   */
  private getReportStyles(): string {
    return `
      body {
        font-family: 'Times New Roman', serif;
        line-height: 1.6;
        color: #333;
        max-width: 210mm;
        margin: 0 auto;
        padding: 20px;
        background: white;
      }

      .report-container {
        background: white;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        padding: 40px;
      }

      .report-header {
        text-align: center;
        border-bottom: 2px solid #3b82f6;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }

      .clinic-info h1 {
        margin: 0 0 10px 0;
        color: #3b82f6;
        font-size: 24px;
      }

      .clinic-info p {
        margin: 5px 0;
        font-size: 14px;
        color: #666;
      }

      .report-title {
        text-align: center;
        margin: 30px 0;
      }

      .report-title h2 {
        font-size: 18px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin: 0;
      }

      .report-section {
        margin: 30px 0;
      }

      .report-section h3 {
        font-size: 16px;
        font-weight: bold;
        text-transform: uppercase;
        color: #3b82f6;
        margin: 0 0 15px 0;
        padding-bottom: 5px;
        border-bottom: 1px solid #e5e5e5;
      }

      .section-content {
        font-size: 14px;
        text-align: justify;
      }

      .patient-info p {
        margin: 8px 0;
      }

      .patient-info strong {
        font-weight: bold;
        min-width: 150px;
        display: inline-block;
      }

      .report-table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        font-size: 12px;
      }

      .report-table th,
      .report-table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }

      .report-table th {
        background-color: #f8f9fa;
        font-weight: bold;
      }

      .chart-container {
        text-align: center;
        margin: 20px 0;
      }

      .chart {
        border: 1px solid #ddd;
        background: #f8f9fa;
      }

      .chart-placeholder {
        font-size: 14px;
        fill: #666;
      }

      .signature {
        text-align: center;
        margin-top: 50px;
        page-break-inside: avoid;
      }

      .signature p {
        margin: 5px 0;
      }

      .signature-certificate {
        margin-top: 80px;
      }

      .recommendations ul {
        padding-left: 20px;
      }

      .recommendations li {
        margin: 10px 0;
      }

      .achieved {
        color: #10b981;
      }

      .page-break {
        page-break-before: always;
      }

      @media print {
        body {
          margin: 0;
          padding: 0;
        }

        .report-container {
          box-shadow: none;
          padding: 20px;
        }

        .page-break {
          page-break-before: always;
        }
      }
    `
  }
}

// Instância global do gerador
export const clinicalReportGenerator = new ClinicalReportGenerator()

// Funções utilitárias
export const reportUtils = {
  formatCurrency: (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100),

  formatDate: (date: string | Date) =>
    format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),

  calculateTreatmentDuration: (startDate: string, endDate?: string) => {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  },

  calculatePainReduction: (sessions: any[]) => {
    if (sessions.length === 0) return 0
    const firstSession = sessions[0]
    const lastSession = sessions[sessions.length - 1]
    return firstSession.painLevel.before - lastSession.painLevel.after
  }
}