/**
 * Contract Test: GET /api/appointments
 * Validates API contract for appointment listing with filtering and calendar views
 * Must fail before implementation exists
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/testing-library/jest-dom'
import type { Database } from '@/src/lib/supabase/database.types'

// Test authentication tokens by role
const authTokens = {
  admin: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  fisioterapeuta: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  estagiario: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  paciente: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  invalid: 'Bearer invalid.token.here'
}

// Valid query parameters for different appointment views
const validQueryParams = {
  basicPagination: {
    page: 1,
    limit: 20
  },
  dateFilter: {
    startDate: '2025-09-15',
    endDate: '2025-09-30',
    page: 1,
    limit: 50
  },
  statusFilter: {
    status: 'agendado',
    page: 1,
    limit: 30
  },
  fisioterapeutaFilter: {
    fisioterapeutaId: '550e8400-e29b-41d4-a716-446655440001',
    startDate: '2025-09-15',
    endDate: '2025-09-22',
    page: 1,
    limit: 25
  },
  patientFilter: {
    patientId: '550e8400-e29b-41d4-a716-446655440000',
    page: 1,
    limit: 10
  },
  typeFilter: {
    appointmentType: 'consulta_inicial',
    status: 'agendado',
    page: 1,
    limit: 15
  },
  todayView: {
    view: 'today',
    fisioterapeutaId: '550e8400-e29b-41d4-a716-446655440001'
  },
  weekView: {
    view: 'week',
    weekStart: '2025-09-15'
  },
  monthView: {
    view: 'month',
    month: '2025-09'
  },
  calendarView: {
    view: 'calendar',
    startDate: '2025-09-01',
    endDate: '2025-09-30',
    fisioterapeutaId: '550e8400-e29b-41d4-a716-446655440001'
  }
}

// Invalid query parameters for validation
const invalidQueryParams = {
  invalidPage: {
    page: 0,
    limit: 20
  },
  invalidLimit: {
    page: 1,
    limit: 1000 // Too large
  },
  invalidDateFormat: {
    startDate: '2025/09/15', // Wrong format
    endDate: '2025-09-30'
  },
  invalidDateRange: {
    startDate: '2025-09-30',
    endDate: '2025-09-15' // End before start
  },
  invalidStatus: {
    status: 'status_inexistente'
  },
  invalidUuid: {
    fisioterapeutaId: 'invalid-uuid-format'
  },
  invalidView: {
    view: 'view_inexistente'
  },
  missingWeekStart: {
    view: 'week'
    // Missing weekStart parameter
  },
  invalidMonth: {
    view: 'month',
    month: '2025-13' // Invalid month
  }
}

describe('GET /api/appointments - Contract Tests', () => {
  beforeAll(async () => {
    // Setup test organization with sample appointments
    // This will fail until database setup is complete
  })

  afterAll(async () => {
    // Cleanup test data
  })

  describe('Authentication and Authorization Contract', () => {
    test('deve retornar 401 para requisição sem autenticação', async () => {
      const response = await fetch('/api/appointments')

      expect(response.status).toBe(401)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const errorData = await response.json()
      expect(errorData).toHaveProperty('error')
      expect(errorData.error).toBe('unauthorized')
      expect(errorData.message).toMatch(/autenticação.*necessária/i)
    })

    test('deve retornar 401 para token inválido', async () => {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': authTokens.invalid
        }
      })

      expect(response.status).toBe(401)

      const errorData = await response.json()
      expect(errorData.error).toBe('invalid_token')
      expect(errorData.message).toMatch(/token.*inválido/i)
    })

    test('deve permitir listagem para administrador', async () => {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      // Should return 200 or 400 (validation), but not 403 (forbidden)
      expect(response.status).toBeOneOf([200, 400])
      expect(response.status).not.toBe(403)
    })

    test('deve permitir listagem para fisioterapeuta', async () => {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': authTokens.fisioterapeuta
        }
      })

      // Should return 200 or 400 (validation), but not 403 (forbidden)
      expect(response.status).toBeOneOf([200, 400])
      expect(response.status).not.toBe(403)
    })

    test('deve permitir listagem limitada para estagiário', async () => {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': authTokens.estagiario
        }
      })

      // Should return 200 or 400 (validation), but not 403 (forbidden)
      expect(response.status).toBeOneOf([200, 400])
      expect(response.status).not.toBe(403)
    })

    test('deve permitir listagem própria para paciente', async () => {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': authTokens.paciente
        }
      })

      // Patients should only see their own appointments
      expect(response.status).toBeOneOf([200, 400])
      expect(response.status).not.toBe(403)
    })
  })

  describe('Query Parameters Contract', () => {
    test('deve aceitar parâmetros de paginação válidos', async () => {
      const params = new URLSearchParams({
        page: validQueryParams.basicPagination.page.toString(),
        limit: validQueryParams.basicPagination.limit.toString()
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBeOneOf([200, 400])
    })

    test('deve rejeitar página inválida (menor que 1)', async () => {
      const params = new URLSearchParams({
        page: invalidQueryParams.invalidPage.page.toString(),
        limit: invalidQueryParams.invalidPage.limit.toString()
      })

      const response = await fetch(`/api/appointments?${params}`, {
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
            field: 'page',
            message: expect.stringMatching(/página.*deve.*ser.*maior.*que.*zero/i)
          })
        ])
      )
    })

    test('deve rejeitar limite muito alto', async () => {
      const params = new URLSearchParams({
        page: invalidQueryParams.invalidLimit.page.toString(),
        limit: invalidQueryParams.invalidLimit.limit.toString()
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'limit',
            message: expect.stringMatching(/limite.*máximo.*100.*registros/i)
          })
        ])
      )
    })

    test('deve aceitar filtro por intervalo de datas', async () => {
      const params = new URLSearchParams({
        startDate: validQueryParams.dateFilter.startDate,
        endDate: validQueryParams.dateFilter.endDate,
        page: validQueryParams.dateFilter.page.toString(),
        limit: validQueryParams.dateFilter.limit.toString()
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBeOneOf([200, 400])
    })

    test('deve validar formato de data', async () => {
      const params = new URLSearchParams({
        startDate: invalidQueryParams.invalidDateFormat.startDate,
        endDate: invalidQueryParams.invalidDateFormat.endDate
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'startDate',
            message: expect.stringMatching(/data.*formato.*inválido.*yyyy-mm-dd/i)
          })
        ])
      )
    })

    test('deve validar intervalo de datas lógico', async () => {
      const params = new URLSearchParams({
        startDate: invalidQueryParams.invalidDateRange.startDate,
        endDate: invalidQueryParams.invalidDateRange.endDate
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'dateRange',
            message: expect.stringMatching(/data.*fim.*deve.*ser.*posterior.*data.*início/i)
          })
        ])
      )
    })

    test('deve aceitar filtro por status', async () => {
      const params = new URLSearchParams({
        status: validQueryParams.statusFilter.status,
        page: validQueryParams.statusFilter.page.toString(),
        limit: validQueryParams.statusFilter.limit.toString()
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBeOneOf([200, 400])
    })

    test('deve validar status válido', async () => {
      const params = new URLSearchParams({
        status: invalidQueryParams.invalidStatus.status
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'status',
            message: expect.stringMatching(/status.*inválido/i)
          })
        ])
      )
    })

    test('deve aceitar filtro por fisioterapeuta', async () => {
      const params = new URLSearchParams({
        fisioterapeutaId: validQueryParams.fisioterapeutaFilter.fisioterapeutaId,
        startDate: validQueryParams.fisioterapeutaFilter.startDate,
        endDate: validQueryParams.fisioterapeutaFilter.endDate,
        page: validQueryParams.fisioterapeutaFilter.page.toString(),
        limit: validQueryParams.fisioterapeutaFilter.limit.toString()
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBeOneOf([200, 400])
    })

    test('deve validar UUID do fisioterapeuta', async () => {
      const params = new URLSearchParams({
        fisioterapeutaId: invalidQueryParams.invalidUuid.fisioterapeutaId
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'fisioterapeutaId',
            message: expect.stringMatching(/fisioterapeuta.*id.*formato.*uuid.*inválido/i)
          })
        ])
      )
    })

    test('deve aceitar diferentes tipos de visualização', async () => {
      const views = ['today', 'week', 'month', 'calendar']

      for (const view of views) {
        let params = new URLSearchParams({ view })

        if (view === 'week') {
          params.append('weekStart', validQueryParams.weekView.weekStart)
        } else if (view === 'month') {
          params.append('month', validQueryParams.monthView.month)
        } else if (view === 'calendar') {
          params.append('startDate', validQueryParams.calendarView.startDate)
          params.append('endDate', validQueryParams.calendarView.endDate)
        }

        const response = await fetch(`/api/appointments?${params}`, {
          headers: {
            'Authorization': authTokens.admin
          }
        })

        expect(response.status).toBeOneOf([200, 400])
      }
    })

    test('deve validar tipo de visualização', async () => {
      const params = new URLSearchParams({
        view: invalidQueryParams.invalidView.view
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'view',
            message: expect.stringMatching(/tipo.*visualização.*inválido/i)
          })
        ])
      )
    })

    test('deve exigir parâmetros específicos para visualização semanal', async () => {
      const params = new URLSearchParams({
        view: invalidQueryParams.missingWeekStart.view
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'weekStart',
            message: expect.stringMatching(/início.*semana.*obrigatório.*visualização.*semanal/i)
          })
        ])
      )
    })
  })

  describe('Response Contract Validation', () => {
    test('deve retornar 200 com lista paginada de consultas', async () => {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const responseData = await response.json()

      // Basic pagination structure
      expect(responseData).toHaveProperty('data')
      expect(responseData).toHaveProperty('pagination')
      expect(responseData).toHaveProperty('filters')

      // Data array
      expect(Array.isArray(responseData.data)).toBe(true)

      // Pagination metadata
      expect(responseData.pagination).toHaveProperty('page')
      expect(responseData.pagination).toHaveProperty('limit')
      expect(responseData.pagination).toHaveProperty('total')
      expect(responseData.pagination).toHaveProperty('totalPages')
      expect(responseData.pagination).toHaveProperty('hasNext')
      expect(responseData.pagination).toHaveProperty('hasPrevious')

      // Filters metadata
      expect(responseData.filters).toHaveProperty('startDate')
      expect(responseData.filters).toHaveProperty('endDate')
      expect(responseData.filters).toHaveProperty('status')
      expect(responseData.filters).toHaveProperty('view')
    })

    test('deve retornar estrutura correta para cada consulta', async () => {
      const response = await fetch('/api/appointments?limit=1', {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()

      if (responseData.data.length > 0) {
        const appointment = responseData.data[0]

        // Core appointment fields
        expect(appointment).toHaveProperty('id')
        expect(appointment).toHaveProperty('org_id')
        expect(appointment).toHaveProperty('patient_id')
        expect(appointment).toHaveProperty('fisioterapeuta_id')
        expect(appointment).toHaveProperty('scheduled_date')
        expect(appointment).toHaveProperty('scheduled_time')
        expect(appointment).toHaveProperty('end_time')
        expect(appointment).toHaveProperty('duration_minutes')
        expect(appointment).toHaveProperty('appointment_type')
        expect(appointment).toHaveProperty('status')
        expect(appointment).toHaveProperty('created_at')

        // Patient information
        expect(appointment).toHaveProperty('patient')
        expect(appointment.patient).toHaveProperty('name')
        expect(appointment.patient).toHaveProperty('phone')

        // Fisioterapeuta information
        expect(appointment).toHaveProperty('fisioterapeuta')
        expect(appointment.fisioterapeuta).toHaveProperty('name')
        expect(appointment.fisioterapeuta).toHaveProperty('crefito_number')

        // UUID validation
        expect(appointment.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

        // Data types validation
        expect(typeof appointment.duration_minutes).toBe('number')
        expect(typeof appointment.status).toBe('string')

        // Date format validation
        expect(appointment.scheduled_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(appointment.scheduled_time).toMatch(/^\d{2}:\d{2}$/)

        // Should not include sensitive patient data in list view
        expect(appointment.patient).not.toHaveProperty('cpf')
        expect(appointment.patient).not.toHaveProperty('medical_history')
        expect(appointment).not.toHaveProperty('session_notes')
      }
    })

    test('deve aplicar filtros de data corretamente', async () => {
      const params = new URLSearchParams({
        startDate: validQueryParams.dateFilter.startDate,
        endDate: validQueryParams.dateFilter.endDate
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()
      expect(responseData.filters.startDate).toBe(validQueryParams.dateFilter.startDate)
      expect(responseData.filters.endDate).toBe(validQueryParams.dateFilter.endDate)

      // All appointments should be within the date range
      responseData.data.forEach((appointment: any) => {
        const appointmentDate = appointment.scheduled_date
        expect(appointmentDate).toBeGreaterThanOrEqual(validQueryParams.dateFilter.startDate)
        expect(appointmentDate).toBeLessThanOrEqual(validQueryParams.dateFilter.endDate)
      })
    })

    test('deve aplicar filtro de status corretamente', async () => {
      const params = new URLSearchParams({
        status: validQueryParams.statusFilter.status
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()
      expect(responseData.filters.status).toBe(validQueryParams.statusFilter.status)

      // All appointments should match the status filter
      responseData.data.forEach((appointment: any) => {
        expect(appointment.status).toBe(validQueryParams.statusFilter.status)
      })
    })

    test('deve retornar estrutura específica para visualização de calendário', async () => {
      const params = new URLSearchParams({
        view: 'calendar',
        startDate: validQueryParams.calendarView.startDate,
        endDate: validQueryParams.calendarView.endDate
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()

      // Calendar view should organize data by date
      expect(responseData).toHaveProperty('calendar')
      expect(responseData).toHaveProperty('view')
      expect(responseData.view).toBe('calendar')

      // Calendar structure
      expect(typeof responseData.calendar).toBe('object')

      // Each date should have an array of appointments
      Object.keys(responseData.calendar).forEach(date => {
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(Array.isArray(responseData.calendar[date])).toBe(true)
      })
    })

    test('deve retornar estrutura específica para visualização de hoje', async () => {
      const params = new URLSearchParams({
        view: 'today'
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()

      expect(responseData).toHaveProperty('view')
      expect(responseData.view).toBe('today')
      expect(responseData).toHaveProperty('date')

      // Should include today's date
      const today = new Date().toISOString().split('T')[0]
      expect(responseData.date).toBe(today)

      // All appointments should be for today
      responseData.data.forEach((appointment: any) => {
        expect(appointment.scheduled_date).toBe(today)
      })
    })

    test('deve ordenar consultas por data e hora', async () => {
      const response = await fetch('/api/appointments?limit=10', {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()

      if (responseData.data.length > 1) {
        for (let i = 1; i < responseData.data.length; i++) {
          const prev = responseData.data[i-1]
          const curr = responseData.data[i]

          const prevDateTime = new Date(`${prev.scheduled_date}T${prev.scheduled_time}`)
          const currDateTime = new Date(`${curr.scheduled_date}T${curr.scheduled_time}`)

          expect(prevDateTime.getTime()).toBeLessThanOrEqual(currDateTime.getTime())
        }
      }
    })
  })

  describe('Business Logic Contract', () => {
    test('deve aplicar isolamento organizacional', async () => {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': authTokens.admin,
          'X-Org-Id': '550e8400-e29b-41d4-a716-446655440000'
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()

      // All appointments should belong to the same organization
      responseData.data.forEach((appointment: any) => {
        expect(appointment.org_id).toBe('550e8400-e29b-41d4-a716-446655440000')
      })
    })

    test('deve limitar visualização para pacientes aos próprios agendamentos', async () => {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': authTokens.paciente
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()

      // All appointments should belong to the authenticated patient
      responseData.data.forEach((appointment: any) => {
        expect(appointment.patient_id).toBe('550e8400-e29b-41d4-a716-446655440001') // Patient's own ID
      })
    })

    test('deve mascarar dados para estagiários', async () => {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': authTokens.estagiario
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()

      // Patient phone should be masked for estagiarios
      responseData.data.forEach((appointment: any) => {
        if (appointment.patient.phone) {
          expect(appointment.patient.phone).toMatch(/\+55\s\*\*\s\*\*\*\*\*-\d{4}/)
        }
      })
    })

    test('deve incluir indicadores de status visual', async () => {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()

      responseData.data.forEach((appointment: any) => {
        expect(appointment).toHaveProperty('statusColor')
        expect(appointment).toHaveProperty('statusLabel')

        // Status mapping validation
        const validStatuses = ['agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'faltou']
        expect(validStatuses).toContain(appointment.status)

        // Color codes for different statuses
        expect(typeof appointment.statusColor).toBe('string')
        expect(appointment.statusColor).toMatch(/^#[0-9a-f]{6}$/i)
      })
    })

    test('deve registrar acesso para auditoria LGPD', async () => {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': authTokens.admin,
          'X-Forwarded-For': '192.168.1.100'
        }
      })

      expect(response.status).toBe(200)

      // Should log appointment access for audit
      expect(response.headers.get('x-audit-logged')).toBe('true')
    })

    test('deve calcular estatísticas da agenda', async () => {
      const params = new URLSearchParams({
        view: 'today'
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.fisioterapeuta
        }
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()

      // Should include agenda statistics
      expect(responseData).toHaveProperty('statistics')
      expect(responseData.statistics).toHaveProperty('totalToday')
      expect(responseData.statistics).toHaveProperty('completedToday')
      expect(responseData.statistics).toHaveProperty('cancelledToday')
      expect(responseData.statistics).toHaveProperty('nextAppointment')

      // Data types validation
      expect(typeof responseData.statistics.totalToday).toBe('number')
      expect(typeof responseData.statistics.completedToday).toBe('number')
      expect(typeof responseData.statistics.cancelledToday).toBe('number')
    })
  })

  describe('Performance Contract', () => {
    test('deve incluir headers de cache apropriados', async () => {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      // Cache headers for appointment data
      expect(response.headers.get('cache-control')).toMatch(/private.*max-age=60/)
      expect(response.headers.get('etag')).toBeTruthy()
    })

    test('deve retornar em tempo razoável para grandes volumes', async () => {
      const startTime = Date.now()

      const response = await fetch('/api/appointments?limit=100', {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(3000) // Should respond within 3 seconds
    })

    test('deve otimizar consultas para visualização de calendário', async () => {
      const startTime = Date.now()

      const params = new URLSearchParams({
        view: 'calendar',
        startDate: '2025-09-01',
        endDate: '2025-09-30'
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(2000) // Calendar view should be optimized
    })
  })

  describe('Security Contract', () => {
    test('deve incluir headers de segurança para dados de saúde', async () => {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      // Security headers for healthcare data
      expect(response.headers.get('x-content-type-options')).toBe('nosniff')
      expect(response.headers.get('x-frame-options')).toBe('DENY')
      expect(response.headers.get('x-xss-protection')).toBe('1; mode=block')

      // CORS for healthcare applications
      expect(response.headers.get('access-control-allow-credentials')).toBe('true')
    })

    test('deve prevenir injeção SQL em parâmetros de filtro', async () => {
      const maliciousStatus = "'; DROP TABLE appointments; --"

      const params = new URLSearchParams({
        status: maliciousStatus
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      // Should not cause server error (500)
      expect(response.status).toBeOneOf([200, 400])
    })

    test('deve sanitizar parâmetros de entrada', async () => {
      const maliciousParam = "<script>alert('xss')</script>"

      const params = new URLSearchParams({
        view: maliciousParam
      })

      const response = await fetch(`/api/appointments?${params}`, {
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
        page: '0'
      })

      const response = await fetch(`/api/appointments?${params}`, {
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
      expect(errorData.path).toBe('/api/appointments')
      expect(errorData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    test('deve tratar erro de banco de dados graciosamente', async () => {
      const response = await fetch('/api/appointments', {
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

    test('deve fornecer sugestões para parâmetros inválidos', async () => {
      const params = new URLSearchParams({
        view: 'calendario' // Portuguese typo for 'calendar'
      })

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData).toHaveProperty('suggestions')
      expect(Array.isArray(errorData.suggestions)).toBe(true)
      expect(errorData.suggestions).toContain('calendar')
    })
  })
})