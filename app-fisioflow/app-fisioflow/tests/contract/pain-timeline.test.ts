/**
 * Contract Test: GET /api/patients/{patientId}/pain-timeline
 * Validates API contract for pain evolution timeline retrieval
 * Must fail before implementation exists
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/testing-library/jest-dom'
import type { Database } from '@/lib/supabase/database.types'

// Test authentication tokens by role
const authTokens = {
  admin: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  fisioterapeuta: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  estagiario: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  paciente: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  invalid: 'Bearer invalid.token.here'
}

// Test patient IDs for pain timeline retrieval
const testPatientIds = {
  valid: '550e8400-e29b-41d4-a716-446655440000',
  withTimeline: '550e8400-e29b-41d4-a716-446655440001',
  noTimeline: '550e8400-e29b-41d4-a716-446655440002',
  invalid: '00000000-0000-0000-0000-000000000000',
  malformed: 'invalid-patient-id'
}

// Valid query parameters for testing
const validQueryParams = {
  dateRange: {
    start_date: '2025-01-01',
    end_date: '2025-01-31'
  },
  regionFilter: {
    region: 'shoulder_left',
    start_date: '2025-01-01',
    end_date: '2025-01-31'
  },
  longRange: {
    start_date: '2024-01-01',
    end_date: '2025-12-31'
  },
  lastMonth: {
    start_date: '2024-12-01',
    end_date: '2024-12-31'
  }
}

// Invalid query parameters for validation
const invalidQueryParams = {
  invalidDateFormat: {
    start_date: '01/01/2025', // Invalid format
    end_date: '31/01/2025'
  },
  futureDates: {
    start_date: '2030-01-01',
    end_date: '2030-01-31'
  },
  invertedRange: {
    start_date: '2025-01-31',
    end_date: '2025-01-01' // End before start
  },
  tooLongRange: {
    start_date: '2020-01-01',
    end_date: '2025-12-31' // More than 5 years
  }
}

describe('GET /api/patients/{patientId}/pain-timeline - Contract Tests', () => {
  beforeAll(async () => {
    // Setup test organization, patients, sessions, and pain points
    // This will fail until database setup is complete
  })

  afterAll(async () => {
    // Cleanup test data
  })

  describe('Authentication and Authorization Contract', () => {
    test('deve retornar 401 para requisição sem autenticação', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline`)

      expect(response.status).toBe(401)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const errorData = await response.json()
      expect(errorData).toHaveProperty('error')
      expect(errorData.error).toBe('unauthorized')
      expect(errorData.message).toMatch(/autenticação.*necessária/i)
    })

    test('deve retornar 401 para token inválido', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.invalid
        }
      })

      expect(response.status).toBe(401)

      const errorData = await response.json()
      expect(errorData.error).toBe('invalid_token')
      expect(errorData.message).toMatch(/token.*inválido/i)
    })

    test('deve permitir acesso para administrador', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      // Should return 200 or 400 (validation), but not 403 (forbidden)
      expect(response.status).toBeOneOf([200, 400, 404])
      expect(response.status).not.toBe(403)
    })

    test('deve permitir acesso para fisioterapeuta', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.fisioterapeuta
        }
      })

      // Should return 200 or 400 (validation), but not 403 (forbidden)
      expect(response.status).toBeOneOf([200, 400, 404])
      expect(response.status).not.toBe(403)
    })

    test('deve permitir acesso limitado para estagiário', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.estagiario
        }
      })

      // Should return 200 or 400 (validation), but not 403 (forbidden)
      expect(response.status).toBeOneOf([200, 400, 404])
      expect(response.status).not.toBe(403)
    })

    test('deve permitir acesso aos próprios dados para paciente', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.paciente,
          'X-Patient-Id': testPatientIds.valid // Patient accessing own data
        }
      })

      // Should return 200 or 400 (validation), but not 403 (forbidden)
      expect(response.status).toBeOneOf([200, 400, 404])
      expect(response.status).not.toBe(403)
    })

    test('deve retornar 403 para paciente acessando dados de outro paciente', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.withTimeline}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.paciente,
          'X-Patient-Id': testPatientIds.valid // Different patient ID
        }
      })

      expect(response.status).toBe(403)

      const errorData = await response.json()
      expect(errorData.error).toBe('insufficient_permissions')
      expect(errorData.message).toMatch(/permissões.*insuficientes/i)
    })
  })

  describe('Path Parameters Contract', () => {
    test('deve retornar 404 para paciente inexistente', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.invalid}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(404)

      const errorData = await response.json()
      expect(errorData.error).toBe('patient_not_found')
      expect(errorData.message).toMatch(/paciente.*não.*encontrado/i)
    })

    test('deve retornar 400 para ID de paciente malformado', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.malformed}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.error).toBe('validation_error')
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'patientId',
            message: expect.stringMatching(/id.*paciente.*formato.*inválido/i)
          })
        ])
      )
    })
  })

  describe('Query Parameters Contract', () => {
    test('deve aceitar parâmetros de filtro de data válidos', async () => {
      const params = new URLSearchParams({
        start_date: validQueryParams.dateRange.start_date,
        end_date: validQueryParams.dateRange.end_date
      })

      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBeOneOf([200, 404])
    })

    test('deve aceitar filtro por região corporal', async () => {
      const params = new URLSearchParams({
        region: validQueryParams.regionFilter.region,
        start_date: validQueryParams.regionFilter.start_date,
        end_date: validQueryParams.regionFilter.end_date
      })

      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBeOneOf([200, 404])
    })

    test('deve rejeitar formato de data inválido', async () => {
      const params = new URLSearchParams({
        start_date: invalidQueryParams.invalidDateFormat.start_date,
        end_date: invalidQueryParams.invalidDateFormat.end_date
      })

      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.error).toBe('validation_error')
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'start_date',
            message: expect.stringMatching(/data.*formato.*inválido.*yyyy-mm-dd/i)
          })
        ])
      )
    })

    test('deve rejeitar datas futuras', async () => {
      const params = new URLSearchParams({
        start_date: invalidQueryParams.futureDates.start_date,
        end_date: invalidQueryParams.futureDates.end_date
      })

      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'start_date',
            message: expect.stringMatching(/data.*início.*não.*pode.*ser.*futura/i)
          })
        ])
      )
    })

    test('deve rejeitar intervalo de datas invertido', async () => {
      const params = new URLSearchParams({
        start_date: invalidQueryParams.invertedRange.start_date,
        end_date: invalidQueryParams.invertedRange.end_date
      })

      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'date_range',
            message: expect.stringMatching(/data.*fim.*deve.*ser.*posterior.*data.*início/i)
          })
        ])
      )
    })

    test('deve rejeitar intervalo muito longo', async () => {
      const params = new URLSearchParams({
        start_date: invalidQueryParams.tooLongRange.start_date,
        end_date: invalidQueryParams.tooLongRange.end_date
      })

      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'date_range',
            message: expect.stringMatching(/intervalo.*máximo.*5.*anos/i)
          })
        ])
      )
    })

    test('deve usar valores padrão quando parâmetros não fornecidos', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBeOneOf([200, 404])

      if (response.status === 200) {
        const responseData = await response.json()
        expect(responseData).toHaveProperty('filters')
        expect(responseData.filters).toHaveProperty('start_date')
        expect(responseData.filters).toHaveProperty('end_date')

        // Should default to last 12 months
        const startDate = new Date(responseData.filters.start_date)
        const endDate = new Date(responseData.filters.end_date)
        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                          (endDate.getMonth() - startDate.getMonth())

        expect(monthsDiff).toBeLessThanOrEqual(12)
      }
    })
  })

  describe('Response Contract Validation', () => {
    test('deve retornar 200 com timeline de dor do paciente', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.withTimeline}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const responseData = await response.json()

      // Timeline structure
      expect(responseData).toHaveProperty('data')
      expect(responseData).toHaveProperty('filters')
      expect(responseData).toHaveProperty('summary')

      // Data array
      expect(Array.isArray(responseData.data)).toBe(true)

      // Filters metadata
      expect(responseData.filters).toHaveProperty('start_date')
      expect(responseData.filters).toHaveProperty('end_date')
      expect(responseData.filters).toHaveProperty('region')
      expect(responseData.filters).toHaveProperty('patient_id')

      // Summary metadata
      expect(responseData.summary).toHaveProperty('total_points')
      expect(responseData.summary).toHaveProperty('date_range_days')
      expect(responseData.summary).toHaveProperty('regions_affected')
      expect(responseData.summary).toHaveProperty('avg_pain_intensity')
    })

    test('deve retornar estrutura correta para cada ponto da timeline', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.withTimeline}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()

      if (responseData.data.length > 0) {
        const timelinePoint = responseData.data[0]

        // Required fields for timeline point
        expect(timelinePoint).toHaveProperty('date')
        expect(timelinePoint).toHaveProperty('session_id')
        expect(timelinePoint).toHaveProperty('region_key')
        expect(timelinePoint).toHaveProperty('pain_intensity')
        expect(timelinePoint).toHaveProperty('description')

        // UUID validation
        expect(timelinePoint.session_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

        // Data types validation
        expect(typeof timelinePoint.date).toBe('string')
        expect(typeof timelinePoint.region_key).toBe('string')
        expect(typeof timelinePoint.pain_intensity).toBe('number')

        // Date format validation (YYYY-MM-DD)
        expect(timelinePoint.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)

        // Pain intensity range validation
        expect(timelinePoint.pain_intensity).toBeGreaterThanOrEqual(0)
        expect(timelinePoint.pain_intensity).toBeLessThanOrEqual(10)

        // Optional fields
        expect(timelinePoint).toHaveProperty('x_coordinate')
        expect(timelinePoint).toHaveProperty('y_coordinate')
        expect(timelinePoint).toHaveProperty('body_side')

        // Should not include sensitive fields
        expect(timelinePoint).not.toHaveProperty('created_by')
        expect(timelinePoint).not.toHaveProperty('updated_by')
        expect(timelinePoint).not.toHaveProperty('patient_id')
      }
    })

    test('deve ordenar timeline cronologicamente (mais recente primeiro)', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.withTimeline}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()

      if (responseData.data.length > 1) {
        for (let i = 1; i < responseData.data.length; i++) {
          const currentDate = new Date(responseData.data[i-1].date)
          const nextDate = new Date(responseData.data[i].date)

          // Should be in descending order (newest first)
          expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime())
        }
      }
    })

    test('deve aplicar filtro por região corretamente', async () => {
      const region = 'shoulder_left'
      const params = new URLSearchParams({ region })

      const response = await fetch(`/api/patients/${testPatientIds.withTimeline}/pain-timeline?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()
      expect(responseData.filters.region).toBe(region)

      // All results should match the region filter
      responseData.data.forEach((point: any) => {
        expect(point.region_key).toBe(region)
      })
    })

    test('deve aplicar filtro de data corretamente', async () => {
      const params = new URLSearchParams({
        start_date: validQueryParams.dateRange.start_date,
        end_date: validQueryParams.dateRange.end_date
      })

      const response = await fetch(`/api/patients/${testPatientIds.withTimeline}/pain-timeline?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()
      expect(responseData.filters.start_date).toBe(validQueryParams.dateRange.start_date)
      expect(responseData.filters.end_date).toBe(validQueryParams.dateRange.end_date)

      // All results should be within the date range
      const startDate = new Date(validQueryParams.dateRange.start_date)
      const endDate = new Date(validQueryParams.dateRange.end_date)

      responseData.data.forEach((point: any) => {
        const pointDate = new Date(point.date)
        expect(pointDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime())
        expect(pointDate.getTime()).toBeLessThanOrEqual(endDate.getTime())
      })
    })

    test('deve retornar timeline vazia para paciente sem dados de dor', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.noTimeline}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()
      expect(responseData.data).toEqual([])
      expect(responseData.summary.total_points).toBe(0)
      expect(responseData.summary.regions_affected).toEqual([])
      expect(responseData.summary.avg_pain_intensity).toBeNull()
    })

    test('deve incluir estatísticas resumidas corretas', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.withTimeline}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()

      // Summary validation
      expect(typeof responseData.summary.total_points).toBe('number')
      expect(typeof responseData.summary.date_range_days).toBe('number')
      expect(Array.isArray(responseData.summary.regions_affected)).toBe(true)

      if (responseData.data.length > 0) {
        expect(typeof responseData.summary.avg_pain_intensity).toBe('number')
        expect(responseData.summary.avg_pain_intensity).toBeGreaterThanOrEqual(0)
        expect(responseData.summary.avg_pain_intensity).toBeLessThanOrEqual(10)
        expect(responseData.summary.total_points).toBe(responseData.data.length)
      }
    })
  })

  describe('Business Logic Contract', () => {
    test('deve aplicar isolamento organizacional', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.admin,
          'X-Org-Id': '550e8400-e29b-41d4-a716-446655440000'
        }
      })

      expect(response.status).toBeOneOf([200, 404])

      if (response.status === 200) {
        // Patient should belong to the same organization
        expect(response.headers.get('x-org-validated')).toBe('true')
      }
    })

    test('deve mascarar dados sensíveis para estagiários', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.withTimeline}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.estagiario
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()

      // Some sensitive information should be limited or masked for estagiarios
      responseData.data.forEach((point: any) => {
        // Detailed pain descriptions might be limited
        if (point.description && point.description.length > 100) {
          expect(point.description).toMatch(/\.\.\.$/) // Truncated indicator
        }
      })
    })

    test('deve registrar acesso para auditoria LGPD', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.admin,
          'X-Forwarded-For': '192.168.1.100'
        }
      })

      expect(response.status).toBeOneOf([200, 404])

      // Should log pain timeline access for audit
      expect(response.headers.get('x-audit-logged')).toBe('true')
    })

    test('deve agrupar pontos por data quando múltiplos na mesma sessão', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.withTimeline}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()

      if (responseData.data.length > 1) {
        // Check for logical grouping - same date entries should be consecutive
        const dateGroups = new Map()
        responseData.data.forEach((point: any) => {
          if (!dateGroups.has(point.date)) {
            dateGroups.set(point.date, [])
          }
          dateGroups.get(point.date).push(point)
        })

        // Each date group should have consistent session data
        dateGroups.forEach((points, date) => {
          if (points.length > 1) {
            const firstSessionId = points[0].session_id
            // All points on same date should be from same session
            points.forEach((point: any) => {
              expect(point.session_id).toBe(firstSessionId)
            })
          }
        })
      }
    })

    test('deve calcular tendência de melhoria/piora', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.withTimeline}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()

      if (responseData.data.length >= 2) {
        expect(responseData.summary).toHaveProperty('pain_trend')
        expect(responseData.summary.pain_trend).toBeOneOf(['improving', 'worsening', 'stable', 'insufficient_data'])

        if (responseData.summary.pain_trend !== 'insufficient_data') {
          expect(responseData.summary).toHaveProperty('trend_percentage')
          expect(typeof responseData.summary.trend_percentage).toBe('number')
        }
      }
    })
  })

  describe('Performance Contract', () => {
    test('deve incluir headers de cache apropriados', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBeOneOf([200, 404])

      // Cache headers for healthcare data
      expect(response.headers.get('cache-control')).toMatch(/private.*max-age=600/)
      expect(response.headers.get('etag')).toBeTruthy()
    })

    test('deve retornar em tempo razoável para longos períodos', async () => {
      const startTime = Date.now()

      const params = new URLSearchParams({
        start_date: validQueryParams.longRange.start_date,
        end_date: validQueryParams.longRange.end_date
      })

      const response = await fetch(`/api/patients/${testPatientIds.withTimeline}/pain-timeline?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBeOneOf([200, 400, 404])
      expect(responseTime).toBeLessThan(3000) // Should respond within 3 seconds
    })

    test('deve limitar quantidade de pontos retornados', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.withTimeline}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()

      // Should limit to reasonable number of points for performance
      expect(responseData.data.length).toBeLessThanOrEqual(1000)

      if (responseData.data.length === 1000) {
        expect(responseData.summary).toHaveProperty('truncated')
        expect(responseData.summary.truncated).toBe(true)
      }
    })
  })

  describe('Security Contract', () => {
    test('deve incluir headers de segurança para dados de saúde', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBeOneOf([200, 404])

      // Security headers for healthcare data
      expect(response.headers.get('x-content-type-options')).toBe('nosniff')
      expect(response.headers.get('x-frame-options')).toBe('DENY')
      expect(response.headers.get('x-xss-protection')).toBe('1; mode=block')

      // CORS for healthcare applications
      expect(response.headers.get('access-control-allow-credentials')).toBe('true')
    })

    test('deve prevenir injeção SQL em parâmetros de filtro', async () => {
      const maliciousRegion = "'; DROP TABLE pain_points; --"

      const params = new URLSearchParams({
        region: maliciousRegion
      })

      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      // Should not cause server error (500)
      expect(response.status).toBeOneOf([200, 400, 404])
    })

    test('deve sanitizar parâmetros de entrada', async () => {
      const maliciousRegion = "<script>alert('xss')</script>"

      const params = new URLSearchParams({
        region: maliciousRegion
      })

      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      // Should validate and reject malicious input
      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.error).toBe('validation_error')
    })
  })

  describe('Error Handling Contract', () => {
    test('deve retornar estrutura consistente de erro', async () => {
      const params = new URLSearchParams({
        start_date: invalidQueryParams.invalidDateFormat.start_date
      })

      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()

      // Standard error structure
      expect(errorData).toHaveProperty('error')
      expect(errorData).toHaveProperty('message')
      expect(errorData).toHaveProperty('details')
      expect(errorData).toHaveProperty('timestamp')
      expect(errorData).toHaveProperty('path')

      // Portuguese-BR error messages
      expect(typeof errorData.message).toBe('string')
      expect(errorData.message).toMatch(/[a-záàâãéêíóôõúç]/i)

      // Metadata
      expect(errorData.path).toBe(`/api/patients/${testPatientIds.valid}/pain-timeline`)
      expect(errorData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    test('deve tratar erro de banco de dados graciosamente', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.admin,
          'X-Simulate-Error': 'database_connection'
        }
      })

      expect(response.status).toBe(500)

      const errorData = await response.json()
      expect(errorData.error).toBe('internal_server_error')
      expect(errorData.message).toMatch(/erro.*interno.*servidor/i)
      expect(errorData).not.toHaveProperty('details') // No sensitive database info
    })

    test('deve manter estrutura consistente de erro em português-BR', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.invalid}/pain-timeline`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(404)

      const errorData = await response.json()

      // Standard error structure
      expect(errorData).toHaveProperty('error')
      expect(errorData).toHaveProperty('message')
      expect(errorData).toHaveProperty('timestamp')
      expect(errorData).toHaveProperty('path')

      // Portuguese-BR messages
      expect(typeof errorData.message).toBe('string')
      expect(errorData.message).toMatch(/[a-záàâãéêíóôõúç]/i) // Contains Portuguese characters

      // ISO timestamp
      expect(errorData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(errorData.path).toBe(`/api/patients/${testPatientIds.invalid}/pain-timeline`)
    })
  })
})