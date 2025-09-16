/**
 * Contract Test: POST /api/appointments
 * Validates API contract for appointment creation and scheduling
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

// Test IDs for appointments
const testIds = {
  validPatientId: '550e8400-e29b-41d4-a716-446655440000',
  validFisioterapeutaId: '550e8400-e29b-41d4-a716-446655440001',
  nonExistentPatient: '00000000-0000-0000-0000-000000000000',
  invalidUuid: 'invalid-uuid-format',
  otherOrgPatient: '550e8400-e29b-41d4-a716-446655440002'
}

// Valid appointment data samples (Brazilian healthcare format)
const validAppointmentData = {
  basic: {
    patient_id: testIds.validPatientId,
    fisioterapeuta_id: testIds.validFisioterapeutaId,
    scheduled_date: '2025-09-20',
    scheduled_time: '14:30',
    duration_minutes: 60,
    appointment_type: 'consulta_inicial',
    notes: 'Primeira consulta - avaliação geral'
  },
  follow_up: {
    patient_id: testIds.validPatientId,
    fisioterapeuta_id: testIds.validFisioterapeutaId,
    scheduled_date: '2025-09-25',
    scheduled_time: '15:00',
    duration_minutes: 45,
    appointment_type: 'retorno',
    notes: 'Retorno para acompanhamento do quadro de lombalgia'
  },
  group_session: {
    patient_id: testIds.validPatientId,
    fisioterapeuta_id: testIds.validFisioterapeutaId,
    scheduled_date: '2025-09-30',
    scheduled_time: '09:00',
    duration_minutes: 90,
    appointment_type: 'sessao_grupo',
    notes: 'Sessão em grupo - exercícios funcionais'
  },
  emergency: {
    patient_id: testIds.validPatientId,
    fisioterapeuta_id: testIds.validFisioterapeutaId,
    scheduled_date: '2025-09-16', // Tomorrow
    scheduled_time: '08:00',
    duration_minutes: 30,
    appointment_type: 'emergencia',
    priority: 'alta',
    notes: 'Paciente com dor aguda pós-trauma'
  },
  home_visit: {
    patient_id: testIds.validPatientId,
    fisioterapeuta_id: testIds.validFisioterapeutaId,
    scheduled_date: '2025-09-22',
    scheduled_time: '16:30',
    duration_minutes: 75,
    appointment_type: 'domiciliar',
    location: 'Rua das Flores, 123 - Apto 45 - São Paulo/SP',
    notes: 'Atendimento domiciliar - paciente com mobilidade reduzida'
  }
}

// Invalid appointment data for validation tests
const invalidAppointmentData = {
  missingPatient: {
    fisioterapeuta_id: testIds.validFisioterapeutaId,
    scheduled_date: '2025-09-20',
    scheduled_time: '14:30',
    duration_minutes: 60,
    appointment_type: 'consulta_inicial'
  },
  missingFisioterapeuta: {
    patient_id: testIds.validPatientId,
    scheduled_date: '2025-09-20',
    scheduled_time: '14:30',
    duration_minutes: 60,
    appointment_type: 'consulta_inicial'
  },
  pastDate: {
    patient_id: testIds.validPatientId,
    fisioterapeuta_id: testIds.validFisioterapeutaId,
    scheduled_date: '2025-09-10', // Past date
    scheduled_time: '14:30',
    duration_minutes: 60,
    appointment_type: 'consulta_inicial'
  },
  invalidTime: {
    patient_id: testIds.validPatientId,
    fisioterapeuta_id: testIds.validFisioterapeutaId,
    scheduled_date: '2025-09-20',
    scheduled_time: '25:70', // Invalid time format
    duration_minutes: 60,
    appointment_type: 'consulta_inicial'
  },
  invalidDuration: {
    patient_id: testIds.validPatientId,
    fisioterapeuta_id: testIds.validFisioterapeutaId,
    scheduled_date: '2025-09-20',
    scheduled_time: '14:30',
    duration_minutes: 0, // Invalid duration
    appointment_type: 'consulta_inicial'
  },
  invalidType: {
    patient_id: testIds.validPatientId,
    fisioterapeuta_id: testIds.validFisioterapeutaId,
    scheduled_date: '2025-09-20',
    scheduled_time: '14:30',
    duration_minutes: 60,
    appointment_type: 'tipo_inexistente'
  },
  weekendAppointment: {
    patient_id: testIds.validPatientId,
    fisioterapeuta_id: testIds.validFisioterapeutaId,
    scheduled_date: '2025-09-21', // Sunday
    scheduled_time: '14:30',
    duration_minutes: 60,
    appointment_type: 'consulta_inicial'
  },
  outsideBusinessHours: {
    patient_id: testIds.validPatientId,
    fisioterapeuta_id: testIds.validFisioterapeutaId,
    scheduled_date: '2025-09-20',
    scheduled_time: '22:00', // Outside business hours
    duration_minutes: 60,
    appointment_type: 'consulta_inicial'
  },
  conflictingTime: {
    patient_id: testIds.validPatientId,
    fisioterapeuta_id: testIds.validFisioterapeutaId,
    scheduled_date: '2025-09-20',
    scheduled_time: '14:30', // Same as validAppointmentData.basic
    duration_minutes: 60,
    appointment_type: 'retorno'
  }
}

describe('POST /api/appointments - Contract Tests', () => {
  beforeAll(async () => {
    // Setup test organization, patients, and fisioterapeutas
    // This will fail until database setup is complete
  })

  afterAll(async () => {
    // Cleanup test data
  })

  describe('Authentication and Authorization Contract', () => {
    test('deve retornar 401 para requisição sem autenticação', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validAppointmentData.basic)
      })

      expect(response.status).toBe(401)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const errorData = await response.json()
      expect(errorData).toHaveProperty('error')
      expect(errorData.error).toBe('unauthorized')
      expect(errorData.message).toMatch(/autenticação.*necessária/i)
    })

    test('deve retornar 401 para token inválido', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.invalid
        },
        body: JSON.stringify(validAppointmentData.basic)
      })

      expect(response.status).toBe(401)

      const errorData = await response.json()
      expect(errorData.error).toBe('invalid_token')
      expect(errorData.message).toMatch(/token.*inválido/i)
    })

    test('deve permitir agendamento para administrador', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validAppointmentData.basic)
      })

      // Should return 201 or 400 (validation), but not 403 (forbidden)
      expect(response.status).toBeOneOf([201, 400, 409])
      expect(response.status).not.toBe(403)
    })

    test('deve permitir agendamento para fisioterapeuta', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.fisioterapeuta
        },
        body: JSON.stringify(validAppointmentData.follow_up)
      })

      // Should return 201 or 400 (validation), but not 403 (forbidden)
      expect(response.status).toBeOneOf([201, 400, 409])
      expect(response.status).not.toBe(403)
    })

    test('deve permitir agendamento limitado para estagiário', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.estagiario
        },
        body: JSON.stringify(validAppointmentData.follow_up)
      })

      // Estagiários podem agendar apenas retornos/acompanhamentos
      expect(response.status).toBeOneOf([201, 400, 409])
      expect(response.status).not.toBe(403)
    })

    test('deve retornar 403 para estagiário tentando agendar consulta inicial', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.estagiario
        },
        body: JSON.stringify(validAppointmentData.basic) // consulta_inicial
      })

      expect(response.status).toBe(403)

      const errorData = await response.json()
      expect(errorData.error).toBe('insufficient_permissions')
      expect(errorData.message).toMatch(/estagiários.*não.*podem.*agendar.*consultas.*iniciais/i)
    })

    test('deve retornar 403 para paciente', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.paciente
        },
        body: JSON.stringify(validAppointmentData.basic)
      })

      expect(response.status).toBe(403)

      const errorData = await response.json()
      expect(errorData.error).toBe('insufficient_permissions')
      expect(errorData.message).toMatch(/pacientes.*não.*podem.*agendar.*consultas.*diretamente/i)
    })
  })

  describe('Request Validation Contract', () => {
    test('deve validar campos obrigatórios', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidAppointmentData.missingPatient)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData).toHaveProperty('error')
      expect(errorData.error).toBe('validation_error')
      expect(errorData).toHaveProperty('details')
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'patient_id',
            message: expect.stringMatching(/paciente.*obrigatório/i)
          })
        ])
      )
    })

    test('deve validar formato UUID para patient_id', async () => {
      const invalidData = {
        ...validAppointmentData.basic,
        patient_id: testIds.invalidUuid
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'patient_id',
            message: expect.stringMatching(/patient_id.*formato.*uuid.*inválido/i)
          })
        ])
      )
    })

    test('deve validar formato UUID para fisioterapeuta_id', async () => {
      const invalidData = {
        ...validAppointmentData.basic,
        fisioterapeuta_id: testIds.invalidUuid
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'fisioterapeuta_id',
            message: expect.stringMatching(/fisioterapeuta_id.*formato.*uuid.*inválido/i)
          })
        ])
      )
    })

    test('deve validar data não pode ser no passado', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidAppointmentData.pastDate)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'scheduled_date',
            message: expect.stringMatching(/data.*não.*pode.*ser.*passado/i)
          })
        ])
      )
    })

    test('deve validar formato da hora', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidAppointmentData.invalidTime)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'scheduled_time',
            message: expect.stringMatching(/hora.*formato.*inválido/i)
          })
        ])
      )
    })

    test('deve validar duração mínima e máxima', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidAppointmentData.invalidDuration)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'duration_minutes',
            message: expect.stringMatching(/duração.*deve.*ser.*entre.*15.*180.*minutos/i)
          })
        ])
      )
    })

    test('deve validar tipo de consulta', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidAppointmentData.invalidType)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'appointment_type',
            message: expect.stringMatching(/tipo.*consulta.*inválido/i)
          })
        ])
      )
    })

    test('deve validar horário comercial', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidAppointmentData.outsideBusinessHours)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'scheduled_time',
            message: expect.stringMatching(/horário.*fora.*funcionamento.*clínica/i)
          })
        ])
      )
    })

    test('deve validar dias úteis para consultas normais', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidAppointmentData.weekendAppointment)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'scheduled_date',
            message: expect.stringMatching(/consultas.*normais.*apenas.*dias.*úteis/i)
          })
        ])
      )
    })

    test('deve aceitar endereço para consulta domiciliar', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validAppointmentData.home_visit)
      })

      expect(response.status).toBeOneOf([201, 409])
    })

    test('deve exigir endereço para consulta domiciliar', async () => {
      const homeVisitWithoutAddress = {
        ...validAppointmentData.home_visit,
        location: undefined
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(homeVisitWithoutAddress)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'location',
            message: expect.stringMatching(/endereço.*obrigatório.*consulta.*domiciliar/i)
          })
        ])
      )
    })
  })

  describe('Business Logic Contract', () => {
    test('deve verificar existência do paciente', async () => {
      const invalidData = {
        ...validAppointmentData.basic,
        patient_id: testIds.nonExistentPatient
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(404)

      const errorData = await response.json()
      expect(errorData.error).toBe('patient_not_found')
      expect(errorData.message).toMatch(/paciente.*não.*encontrado/i)
    })

    test('deve verificar disponibilidade do fisioterapeuta', async () => {
      // First appointment
      const firstResponse = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validAppointmentData.basic)
      })

      expect(firstResponse.status).toBe(201)

      // Conflicting appointment
      const conflictResponse = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidAppointmentData.conflictingTime)
      })

      expect(conflictResponse.status).toBe(409)

      const errorData = await conflictResponse.json()
      expect(errorData.error).toBe('schedule_conflict')
      expect(errorData.message).toMatch(/fisioterapeuta.*não.*disponível.*horário/i)
      expect(errorData).toHaveProperty('conflictingAppointment')
    })

    test('deve aplicar isolamento organizacional', async () => {
      const crossOrgData = {
        ...validAppointmentData.basic,
        patient_id: testIds.otherOrgPatient
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin,
          'X-Org-Id': '550e8400-e29b-41d4-a716-446655440000'
        },
        body: JSON.stringify(crossOrgData)
      })

      expect(response.status).toBe(404)

      const errorData = await response.json()
      expect(errorData.error).toBe('patient_not_found')
      expect(errorData.message).toMatch(/paciente.*não.*encontrado.*organização/i)
    })

    test('deve permitir agendamento de emergência fora do horário normal', async () => {
      const emergencyAfterHours = {
        ...validAppointmentData.emergency,
        scheduled_time: '20:00' // After normal hours
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(emergencyAfterHours)
      })

      // Emergency appointments should be allowed outside normal hours
      expect(response.status).toBeOneOf([201, 409])
      expect(response.status).not.toBe(400)
    })

    test('deve permitir agendamento de emergência em fins de semana', async () => {
      const emergencyWeekend = {
        ...validAppointmentData.emergency,
        scheduled_date: '2025-09-21' // Sunday
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(emergencyWeekend)
      })

      // Emergency appointments should be allowed on weekends
      expect(response.status).toBeOneOf([201, 409])
      expect(response.status).not.toBe(400)
    })

    test('deve calcular horário de término automaticamente', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validAppointmentData.basic)
      })

      expect(response.status).toBe(201)

      const appointmentData = await response.json()
      expect(appointmentData).toHaveProperty('end_time')

      // Calculate expected end time
      const startTime = validAppointmentData.basic.scheduled_time
      const [startHour, startMinute] = startTime.split(':').map(Number)
      const durationMinutes = validAppointmentData.basic.duration_minutes

      const endDate = new Date()
      endDate.setHours(startHour, startMinute + durationMinutes, 0, 0)

      const expectedEndTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
      expect(appointmentData.end_time).toBe(expectedEndTime)
    })

    test('deve definir status inicial como agendado', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validAppointmentData.basic)
      })

      expect(response.status).toBe(201)

      const appointmentData = await response.json()
      expect(appointmentData.status).toBe('agendado')
    })
  })

  describe('Response Contract Validation', () => {
    test('deve retornar 201 com dados da consulta criada', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validAppointmentData.basic)
      })

      expect(response.status).toBe(201)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const appointmentData = await response.json()

      // Core required fields
      expect(appointmentData).toHaveProperty('id')
      expect(appointmentData).toHaveProperty('org_id')
      expect(appointmentData).toHaveProperty('patient_id')
      expect(appointmentData).toHaveProperty('fisioterapeuta_id')
      expect(appointmentData).toHaveProperty('scheduled_date')
      expect(appointmentData).toHaveProperty('scheduled_time')
      expect(appointmentData).toHaveProperty('end_time')
      expect(appointmentData).toHaveProperty('duration_minutes')
      expect(appointmentData).toHaveProperty('appointment_type')
      expect(appointmentData).toHaveProperty('status')
      expect(appointmentData).toHaveProperty('created_at')
      expect(appointmentData).toHaveProperty('updated_at')

      // UUID validation
      expect(appointmentData.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      expect(appointmentData.org_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

      // Data validation
      expect(appointmentData.patient_id).toBe(validAppointmentData.basic.patient_id)
      expect(appointmentData.fisioterapeuta_id).toBe(validAppointmentData.basic.fisioterapeuta_id)
      expect(appointmentData.scheduled_date).toBe(validAppointmentData.basic.scheduled_date)
      expect(appointmentData.scheduled_time).toBe(validAppointmentData.basic.scheduled_time)
      expect(appointmentData.duration_minutes).toBe(validAppointmentData.basic.duration_minutes)
      expect(appointmentData.appointment_type).toBe(validAppointmentData.basic.appointment_type)
      expect(appointmentData.status).toBe('agendado')

      // Timestamps
      expect(appointmentData.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(appointmentData.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    test('deve incluir informações do paciente e fisioterapeuta', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validAppointmentData.basic)
      })

      expect(response.status).toBe(201)

      const appointmentData = await response.json()

      // Patient information
      expect(appointmentData).toHaveProperty('patient')
      expect(appointmentData.patient).toHaveProperty('name')
      expect(appointmentData.patient).toHaveProperty('phone')

      // Fisioterapeuta information
      expect(appointmentData).toHaveProperty('fisioterapeuta')
      expect(appointmentData.fisioterapeuta).toHaveProperty('name')
      expect(appointmentData.fisioterapeuta).toHaveProperty('crefito_number')

      // Should not include sensitive information
      expect(appointmentData.patient).not.toHaveProperty('cpf')
      expect(appointmentData.patient).not.toHaveProperty('medical_history')
    })

    test('deve incluir header Location com URL do recurso criado', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validAppointmentData.basic)
      })

      expect(response.status).toBe(201)

      const locationHeader = response.headers.get('location')
      expect(locationHeader).toMatch(/^\/api\/appointments\/[0-9a-f-]{36}$/i)
    })

    test('deve incluir informações de localização para consulta domiciliar', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validAppointmentData.home_visit)
      })

      expect(response.status).toBe(201)

      const appointmentData = await response.json()
      expect(appointmentData).toHaveProperty('location')
      expect(appointmentData.location).toBe(validAppointmentData.home_visit.location)
      expect(appointmentData.appointment_type).toBe('domiciliar')
    })
  })

  describe('Security Contract', () => {
    test('deve incluir headers de segurança para dados de saúde', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validAppointmentData.basic)
      })

      expect(response.status).toBe(201)

      // Security headers for healthcare data
      expect(response.headers.get('x-content-type-options')).toBe('nosniff')
      expect(response.headers.get('x-frame-options')).toBe('DENY')
      expect(response.headers.get('cache-control')).toMatch(/no-cache|no-store/)

      // CORS for healthcare applications
      expect(response.headers.get('access-control-allow-credentials')).toBe('true')
    })

    test('deve registrar criação para auditoria', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin,
          'X-Forwarded-For': '192.168.1.100'
        },
        body: JSON.stringify(validAppointmentData.basic)
      })

      expect(response.status).toBe(201)

      // Should log appointment creation for audit
      expect(response.headers.get('x-audit-logged')).toBe('true')
    })

    test('deve sanitizar notas de entrada', async () => {
      const maliciousData = {
        ...validAppointmentData.basic,
        notes: 'Consulta normal <script>alert("xss")</script> para avaliação'
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(maliciousData)
      })

      if (response.status === 201) {
        const appointmentData = await response.json()
        expect(appointmentData.notes).not.toMatch(/<script>/)
      }
    })
  })

  describe('Error Handling Contract', () => {
    test('deve retornar estrutura consistente de erro', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidAppointmentData.missingPatient)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()

      // Standard error structure
      expect(errorData).toHaveProperty('error')
      expect(errorData).toHaveProperty('message')
      expect(errorData).toHaveProperty('details')
      expect(errorData).toHaveProperty('timestamp')
      expect(errorData).toHaveProperty('path')

      // Details array for validation errors
      expect(Array.isArray(errorData.details)).toBe(true)
      expect(errorData.details.length).toBeGreaterThan(0)

      // Portuguese-BR error messages
      expect(typeof errorData.message).toBe('string')
      expect(errorData.message).toMatch(/[a-záàâãéêíóôõúç]/i)

      // Metadata
      expect(errorData.path).toBe('/api/appointments')
      expect(errorData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    test('deve tratar erro de conflito de agendamento', async () => {
      // First appointment
      await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validAppointmentData.basic)
      })

      // Conflicting appointment
      const conflictResponse = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidAppointmentData.conflictingTime)
      })

      expect(conflictResponse.status).toBe(409)

      const errorData = await conflictResponse.json()
      expect(errorData.error).toBe('schedule_conflict')
      expect(errorData.message).toMatch(/conflito.*agendamento/i)
      expect(errorData).toHaveProperty('conflictingAppointment')
      expect(errorData).toHaveProperty('suggestedTimes')

      // Suggested alternative times
      expect(Array.isArray(errorData.suggestedTimes)).toBe(true)
      expect(errorData.suggestedTimes.length).toBeGreaterThan(0)
    })

    test('deve tratar erro de banco de dados graciosamente', async () => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin,
          'X-Simulate-Error': 'database_connection'
        },
        body: JSON.stringify(validAppointmentData.basic)
      })

      expect(response.status).toBe(500)

      const errorData = await response.json()
      expect(errorData.error).toBe('internal_server_error')
      expect(errorData.message).toMatch(/erro.*interno.*servidor/i)
      expect(errorData).not.toHaveProperty('details') // No sensitive database info
    })
  })
})