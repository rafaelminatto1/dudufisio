/**
 * Contract Test: GET /api/patients/{id}
 * Validates API contract for individual patient retrieval
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

// Test patient IDs for different scenarios
const testPatientIds = {
  valid: '550e8400-e29b-41d4-a716-446655440000',
  nonExistent: '00000000-0000-0000-0000-000000000000',
  invalidUuid: 'invalid-uuid-format',
  patientOwnId: '550e8400-e29b-41d4-a716-446655440001', // ID that belongs to the paciente user
  otherOrgPatient: '550e8400-e29b-41d4-a716-446655440002', // Patient from different organization
  inactivePatient: '550e8400-e29b-41d4-a716-446655440003' // Inactive patient
}

describe('GET /api/patients/{id} - Contract Tests', () => {
  beforeAll(async () => {
    // Setup test organization and patients
    // This will fail until database setup is complete
  })

  afterAll(async () => {
    // Cleanup test data
  })

  describe('Authentication and Authorization Contract', () => {
    test('deve retornar 401 para requisição sem autenticação', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`)

      expect(response.status).toBe(401)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const errorData = await response.json()
      expect(errorData).toHaveProperty('error')
      expect(errorData.error).toBe('unauthorized')
      expect(errorData.message).toMatch(/autenticação.*necessária/i)
    })

    test('deve retornar 401 para token inválido', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
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
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      // Should return 200 or 404 (not found), but not 403 (forbidden)
      expect(response.status).toBeOneOf([200, 404])
      expect(response.status).not.toBe(403)
    })

    test('deve permitir acesso para fisioterapeuta', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.fisioterapeuta
        }
      })

      // Should return 200 or 404 (not found), but not 403 (forbidden)
      expect(response.status).toBeOneOf([200, 404])
      expect(response.status).not.toBe(403)
    })

    test('deve permitir acesso para estagiário', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.estagiario
        }
      })

      // Should return 200 or 404 (not found), but not 403 (forbidden)
      expect(response.status).toBeOneOf([200, 404])
      expect(response.status).not.toBe(403)
    })

    test('deve permitir acesso para paciente aos próprios dados', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.patientOwnId}`, {
        headers: {
          'Authorization': authTokens.paciente
        }
      })

      // Should return 200 or 404 (not found), but not 403 (forbidden)
      expect(response.status).toBeOneOf([200, 404])
      expect(response.status).not.toBe(403)
    })

    test('deve retornar 403 para paciente acessando dados de outro', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.paciente
        }
      })

      expect(response.status).toBe(403)

      const errorData = await response.json()
      expect(errorData.error).toBe('insufficient_permissions')
      expect(errorData.message).toMatch(/acesso.*negado.*dados.*outro.*paciente/i)
    })
  })

  describe('Path Parameters Contract', () => {
    test('deve aceitar UUID válido como ID do paciente', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      // Should process the request (200 or 404), not reject format
      expect(response.status).toBeOneOf([200, 404])
      expect(response.status).not.toBe(400)
    })

    test('deve rejeitar formato inválido de UUID', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.invalidUuid}`, {
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
            field: 'id',
            message: expect.stringMatching(/id.*formato.*uuid.*inválido/i)
          })
        ])
      )
    })

    test('deve retornar 404 para paciente inexistente', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.nonExistent}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(404)

      const errorData = await response.json()
      expect(errorData.error).toBe('patient_not_found')
      expect(errorData.message).toMatch(/paciente.*não.*encontrado/i)
      expect(errorData).toHaveProperty('requestedId')
      expect(errorData.requestedId).toBe(testPatientIds.nonExistent)
    })

    test('deve retornar 404 para paciente de outra organização', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.otherOrgPatient}`, {
        headers: {
          'Authorization': authTokens.admin,
          'X-Org-Id': '550e8400-e29b-41d4-a716-446655440000'
        }
      })

      expect(response.status).toBe(404)

      const errorData = await response.json()
      expect(errorData.error).toBe('patient_not_found')
      expect(errorData.message).toMatch(/paciente.*não.*encontrado.*organização/i)
    })
  })

  describe('Response Contract Validation', () => {
    test('deve retornar 200 com dados completos do paciente', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const patientData = await response.json()

      // Core required fields
      expect(patientData).toHaveProperty('id')
      expect(patientData).toHaveProperty('org_id')
      expect(patientData).toHaveProperty('name')
      expect(patientData).toHaveProperty('cpf')
      expect(patientData).toHaveProperty('date_of_birth')
      expect(patientData).toHaveProperty('age')
      expect(patientData).toHaveProperty('gender')
      expect(patientData).toHaveProperty('phone')
      expect(patientData).toHaveProperty('status')

      // Optional demographic fields
      expect(patientData).toHaveProperty('email')
      expect(patientData).toHaveProperty('rg')
      expect(patientData).toHaveProperty('emergency_contact_name')
      expect(patientData).toHaveProperty('emergency_contact_phone')

      // Address fields
      expect(patientData).toHaveProperty('address_line1')
      expect(patientData).toHaveProperty('address_line2')
      expect(patientData).toHaveProperty('city')
      expect(patientData).toHaveProperty('state')
      expect(patientData).toHaveProperty('postal_code')

      // Healthcare fields
      expect(patientData).toHaveProperty('health_insurance')
      expect(patientData).toHaveProperty('health_insurance_number')
      expect(patientData).toHaveProperty('medical_history')
      expect(patientData).toHaveProperty('current_medications')
      expect(patientData).toHaveProperty('allergies')
      expect(patientData).toHaveProperty('observations')

      // LGPD compliance fields
      expect(patientData).toHaveProperty('consent_lgpd')
      expect(patientData).toHaveProperty('consent_date')

      // Metadata fields
      expect(patientData).toHaveProperty('created_at')
      expect(patientData).toHaveProperty('updated_at')

      // UUID validation
      expect(patientData.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      expect(patientData.org_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

      // Data types validation
      expect(typeof patientData.name).toBe('string')
      expect(typeof patientData.cpf).toBe('string')
      expect(typeof patientData.age).toBe('number')
      expect(typeof patientData.status).toBe('string')
      expect(typeof patientData.consent_lgpd).toBe('boolean')

      // Brazilian formats validation
      expect(patientData.cpf).toMatch(/^\d{11}$/)
      expect(patientData.phone).toMatch(/^\+55\s\d{2}\s\d{4,5}-\d{4}$/)

      // Timestamps
      expect(patientData.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(patientData.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

      // Should not include sensitive audit fields
      expect(patientData).not.toHaveProperty('created_by')
      expect(patientData).not.toHaveProperty('updated_by')
    })

    test('deve incluir estatísticas do paciente para profissionais', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.fisioterapeuta
        }
      })

      expect(response.status).toBe(200)

      const patientData = await response.json()

      // Patient statistics
      expect(patientData).toHaveProperty('statistics')
      expect(patientData.statistics).toHaveProperty('totalAppointments')
      expect(patientData.statistics).toHaveProperty('totalSessions')
      expect(patientData.statistics).toHaveProperty('lastAppointment')
      expect(patientData.statistics).toHaveProperty('nextAppointment')
      expect(patientData.statistics).toHaveProperty('activePrescriptions')

      // Data types for statistics
      expect(typeof patientData.statistics.totalAppointments).toBe('number')
      expect(typeof patientData.statistics.totalSessions).toBe('number')
      expect(typeof patientData.statistics.activePrescriptions).toBe('number')
    })

    test('deve mascarar dados sensíveis para estagiários', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.estagiario
        }
      })

      expect(response.status).toBe(200)

      const patientData = await response.json()

      // CPF should be masked for estagiarios
      expect(patientData.cpf).toMatch(/\*\*\*\.\*\*\*\.\*\*\*-\d{2}/)

      // Contact info should be masked
      if (patientData.phone) {
        expect(patientData.phone).toMatch(/\+55\s\*\*\s\*\*\*\*\*-\d{4}/)
      }

      // Medical information should be limited
      expect(patientData).not.toHaveProperty('current_medications')
      expect(patientData).not.toHaveProperty('allergies')
      expect(patientData.medical_history).toBeNull()
    })

    test('deve retornar apenas dados próprios para pacientes', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.patientOwnId}`, {
        headers: {
          'Authorization': authTokens.paciente
        }
      })

      expect(response.status).toBe(200)

      const patientData = await response.json()

      // Should include all personal data
      expect(patientData).toHaveProperty('name')
      expect(patientData).toHaveProperty('cpf')
      expect(patientData).toHaveProperty('medical_history')
      expect(patientData).toHaveProperty('current_medications')
      expect(patientData).toHaveProperty('allergies')

      // Should not include clinical statistics
      expect(patientData).not.toHaveProperty('statistics')

      // Should not include professional notes
      expect(patientData).not.toHaveProperty('professional_notes')
      expect(patientData).not.toHaveProperty('clinical_assessment')
    })

    test('deve incluir informações de cache para otimização', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      // ETag for caching
      expect(response.headers.get('etag')).toBeTruthy()
      expect(response.headers.get('last-modified')).toBeTruthy()

      // Cache control for healthcare data
      expect(response.headers.get('cache-control')).toMatch(/private.*max-age=/)
    })
  })

  describe('Business Logic Contract', () => {
    test('deve aplicar isolamento organizacional', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.admin,
          'X-Org-Id': '550e8400-e29b-41d4-a716-446655440000'
        }
      })

      if (response.status === 200) {
        const patientData = await response.json()
        expect(patientData.org_id).toBe('550e8400-e29b-41d4-a716-446655440000')
      }
    })

    test('deve calcular idade corretamente', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      const patientData = await response.json()
      expect(typeof patientData.age).toBe('number')
      expect(patientData.age).toBeGreaterThan(0)
      expect(patientData.age).toBeLessThan(150)

      // Verify age calculation
      const birthDate = new Date(patientData.date_of_birth)
      const today = new Date()
      const calculatedAge = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        expect(patientData.age).toBe(calculatedAge - 1)
      } else {
        expect(patientData.age).toBe(calculatedAge)
      }
    })

    test('deve registrar acesso para auditoria LGPD', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.admin,
          'X-Forwarded-For': '192.168.1.100'
        }
      })

      expect(response.status).toBe(200)

      // Should log patient access for audit
      expect(response.headers.get('x-audit-logged')).toBe('true')
    })

    test('deve incluir histórico de dores quando disponível', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.fisioterapeuta
        }
      })

      expect(response.status).toBe(200)

      const patientData = await response.json()

      if (patientData.painHistory) {
        expect(Array.isArray(patientData.painHistory)).toBe(true)

        if (patientData.painHistory.length > 0) {
          const painPoint = patientData.painHistory[0]
          expect(painPoint).toHaveProperty('bodyPart')
          expect(painPoint).toHaveProperty('intensity')
          expect(painPoint).toHaveProperty('date')
          expect(typeof painPoint.intensity).toBe('number')
          expect(painPoint.intensity).toBeGreaterThanOrEqual(0)
          expect(painPoint.intensity).toBeLessThanOrEqual(10)
        }
      }
    })

    test('deve verificar status ativo/inativo do paciente', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.inactivePatient}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      if (response.status === 200) {
        const patientData = await response.json()
        expect(['active', 'inactive', 'suspended']).toContain(patientData.status)

        if (patientData.status === 'inactive') {
          expect(patientData).toHaveProperty('inactivatedAt')
          expect(patientData).toHaveProperty('inactivationReason')
        }
      }
    })
  })

  describe('Security Contract', () => {
    test('deve incluir headers de segurança para dados de saúde', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(response.status).toBe(200)

      // Security headers for healthcare data
      expect(response.headers.get('x-content-type-options')).toBe('nosniff')
      expect(response.headers.get('x-frame-options')).toBe('DENY')
      expect(response.headers.get('x-xss-protection')).toBe('1; mode=block')
      expect(response.headers.get('cache-control')).toMatch(/private/)

      // CORS for healthcare applications
      expect(response.headers.get('access-control-allow-credentials')).toBe('true')
    })

    test('deve prevenir acesso direto via URL manipulation', async () => {
      // Try to access patient from another organization
      const response = await fetch(`/api/patients/${testPatientIds.otherOrgPatient}`, {
        headers: {
          'Authorization': authTokens.admin,
          'X-Org-Id': '550e8400-e29b-41d4-a716-446655440000'
        }
      })

      expect(response.status).toBe(404)
    })

    test('deve validar permissões de acesso cross-organizacional', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.admin,
          'X-Org-Id': 'different-org-id'
        }
      })

      // Should not allow access to patients from different organizations
      expect(response.status).toBeOneOf([404, 403])
    })
  })

  describe('Performance Contract', () => {
    test('deve retornar resposta em tempo razoável', async () => {
      const startTime = Date.now()

      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(2000) // Should respond within 2 seconds
    })

    test('deve suportar cache condicional com ETag', async () => {
      const firstResponse = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.admin
        }
      })

      expect(firstResponse.status).toBe(200)
      const etag = firstResponse.headers.get('etag')
      expect(etag).toBeTruthy()

      // Second request with If-None-Match should return 304
      const secondResponse = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.admin,
          'If-None-Match': etag!
        }
      })

      expect(secondResponse.status).toBe(304)
    })
  })

  describe('Error Handling Contract', () => {
    test('deve retornar estrutura consistente de erro', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.invalidUuid}`, {
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
      expect(errorData.path).toBe(`/api/patients/${testPatientIds.invalidUuid}`)
      expect(errorData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    test('deve tratar erro de banco de dados graciosamente', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
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

    test('deve incluir contexto específico em erros de autorização', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        headers: {
          'Authorization': authTokens.paciente
        }
      })

      expect(response.status).toBe(403)

      const errorData = await response.json()
      expect(errorData).toHaveProperty('resourceId')
      expect(errorData).toHaveProperty('resourceType')
      expect(errorData.resourceId).toBe(testPatientIds.valid)
      expect(errorData.resourceType).toBe('patient')
    })
  })
})