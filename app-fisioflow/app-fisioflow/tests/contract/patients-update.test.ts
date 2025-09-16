/**
 * Contract Test: PUT /api/patients/{id}
 * Validates API contract for patient information updates
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

// Test patient IDs for different scenarios
const testPatientIds = {
  valid: '550e8400-e29b-41d4-a716-446655440000',
  nonExistent: '00000000-0000-0000-0000-000000000000',
  invalidUuid: 'invalid-uuid-format',
  patientOwnId: '550e8400-e29b-41d4-a716-446655440001', // ID that belongs to the paciente user
  otherOrgPatient: '550e8400-e29b-41d4-a716-446655440002' // Patient from different organization
}

// Valid update data samples (Brazilian healthcare format)
const validUpdateData = {
  basicInfo: {
    name: 'Maria Silva Santos Atualizada',
    phone: '+55 11 88888-8888',
    email: 'maria.atualizada@email.com',
    emergency_contact_name: 'João Santos Silva',
    emergency_contact_phone: '+55 11 77777-7777'
  },
  addressUpdate: {
    address_line1: 'Rua Nova, 456',
    address_line2: 'Apto 12',
    city: 'Rio de Janeiro',
    state: 'RJ',
    postal_code: '20123456'
  },
  healthcareUpdate: {
    health_insurance: 'Unimed Rio',
    health_insurance_number: 'UR987654321',
    medical_history: 'Hipertensão controlada com medicamento. Histórico de diabetes tipo 2.',
    current_medications: 'Losartana 50mg 1x/dia, Metformina 850mg 2x/dia',
    allergies: 'Penicilina, AAS',
    observations: 'Paciente muito colaborativo, aderiu bem ao tratamento anterior'
  },
  fullUpdate: {
    name: 'Maria Silva Santos Completa',
    phone: '+55 21 99999-8888',
    email: 'maria.completa@email.com',
    emergency_contact_name: 'Pedro Santos',
    emergency_contact_phone: '+55 21 88888-7777',
    address_line1: 'Avenida Principal, 789',
    address_line2: '',
    city: 'Niterói',
    state: 'RJ',
    postal_code: '24567890',
    health_insurance: 'SulAmérica',
    health_insurance_number: 'SA456789123',
    medical_history: 'Sem comorbidades significativas',
    current_medications: 'Sem medicamentos em uso regular',
    allergies: 'Nenhuma alergia conhecida',
    observations: 'Primeira consulta fisioterapêutica'
  }
}

// Invalid update data for validation tests
const invalidUpdateData = {
  invalidEmail: {
    name: 'Maria Silva',
    email: 'email-invalido-formato'
  },
  invalidPhone: {
    name: 'Maria Silva',
    phone: '123456789' // Invalid Brazilian phone format
  },
  invalidCep: {
    name: 'Maria Silva',
    postal_code: '1234567' // Invalid CEP format
  },
  emptyName: {
    name: '',
    phone: '+55 11 99999-9999'
  },
  invalidState: {
    name: 'Maria Silva',
    state: 'XX' // Invalid Brazilian state
  },
  futureDate: {
    name: 'Maria Silva',
    date_of_birth: '2030-05-15' // Future birth date (if allowed to update)
  }
}

describe('PUT /api/patients/{id} - Contract Tests', () => {
  beforeAll(async () => {
    // Setup test organization and patients
    // This will fail until database setup is complete
  })

  afterAll(async () => {
    // Cleanup test data
  })

  describe('Authentication and Authorization Contract', () => {
    test('deve retornar 401 para requisição sem autenticação', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validUpdateData.basicInfo)
      })

      expect(response.status).toBe(401)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const errorData = await response.json()
      expect(errorData).toHaveProperty('error')
      expect(errorData.error).toBe('unauthorized')
      expect(errorData.message).toMatch(/autenticação.*necessária/i)
    })

    test('deve retornar 401 para token inválido', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.invalid
        },
        body: JSON.stringify(validUpdateData.basicInfo)
      })

      expect(response.status).toBe(401)

      const errorData = await response.json()
      expect(errorData.error).toBe('invalid_token')
      expect(errorData.message).toMatch(/token.*inválido/i)
    })

    test('deve permitir atualização para administrador', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validUpdateData.basicInfo)
      })

      // Should return 200, 400 (validation), or 404 (not found), but not 403 (forbidden)
      expect(response.status).toBeOneOf([200, 400, 404])
      expect(response.status).not.toBe(403)
    })

    test('deve permitir atualização para fisioterapeuta', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.fisioterapeuta
        },
        body: JSON.stringify(validUpdateData.basicInfo)
      })

      // Should return 200, 400 (validation), or 404 (not found), but not 403 (forbidden)
      expect(response.status).toBeOneOf([200, 400, 404])
      expect(response.status).not.toBe(403)
    })

    test('deve retornar 403 para estagiário', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.estagiario
        },
        body: JSON.stringify(validUpdateData.basicInfo)
      })

      expect(response.status).toBe(403)

      const errorData = await response.json()
      expect(errorData.error).toBe('insufficient_permissions')
      expect(errorData.message).toMatch(/permissões.*insuficientes.*atualizar/i)
    })

    test('deve permitir atualização limitada para paciente dos próprios dados', async () => {
      const limitedUpdate = {
        phone: '+55 11 88888-8888',
        email: 'paciente.atualizado@email.com',
        address_line1: 'Nova Rua, 123',
        emergency_contact_name: 'Novo Contato',
        emergency_contact_phone: '+55 11 77777-7777'
      }

      const response = await fetch(`/api/patients/${testPatientIds.patientOwnId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.paciente
        },
        body: JSON.stringify(limitedUpdate)
      })

      // Should allow limited updates to own data
      expect(response.status).toBeOneOf([200, 400, 404])
      expect(response.status).not.toBe(403)
    })

    test('deve retornar 403 para paciente tentando atualizar dados médicos', async () => {
      const medicalUpdate = {
        medical_history: 'Tentativa de atualizar histórico médico',
        current_medications: 'Tentativa de atualizar medicamentos'
      }

      const response = await fetch(`/api/patients/${testPatientIds.patientOwnId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.paciente
        },
        body: JSON.stringify(medicalUpdate)
      })

      expect(response.status).toBe(403)

      const errorData = await response.json()
      expect(errorData.error).toBe('insufficient_permissions')
      expect(errorData.message).toMatch(/pacientes.*não.*podem.*atualizar.*dados.*médicos/i)
    })

    test('deve retornar 403 para paciente acessando dados de outro', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.paciente
        },
        body: JSON.stringify(validUpdateData.basicInfo)
      })

      expect(response.status).toBe(403)

      const errorData = await response.json()
      expect(errorData.error).toBe('insufficient_permissions')
      expect(errorData.message).toMatch(/acesso.*negado.*dados.*outro.*paciente/i)
    })
  })

  describe('Path Parameters and Data Validation Contract', () => {
    test('deve rejeitar formato inválido de UUID', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.invalidUuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validUpdateData.basicInfo)
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
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validUpdateData.basicInfo)
      })

      expect(response.status).toBe(404)

      const errorData = await response.json()
      expect(errorData.error).toBe('patient_not_found')
      expect(errorData.message).toMatch(/paciente.*não.*encontrado/i)
    })

    test('deve validar formato do email quando fornecido', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidUpdateData.invalidEmail)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.error).toBe('validation_error')
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.stringMatching(/email.*formato.*inválido/i)
          })
        ])
      )
    })

    test('deve validar formato do telefone brasileiro', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidUpdateData.invalidPhone)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'phone',
            message: expect.stringMatching(/telefone.*formato.*inválido/i)
          })
        ])
      )
    })

    test('deve validar formato do CEP brasileiro', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidUpdateData.invalidCep)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'postal_code',
            message: expect.stringMatching(/cep.*formato.*inválido/i)
          })
        ])
      )
    })

    test('deve rejeitar nome vazio', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidUpdateData.emptyName)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.stringMatching(/nome.*não.*pode.*estar.*vazio/i)
          })
        ])
      )
    })

    test('deve validar estado brasileiro válido', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidUpdateData.invalidState)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'state',
            message: expect.stringMatching(/estado.*inválido/i)
          })
        ])
      )
    })

    test('deve aceitar atualização parcial com campos opcionais', async () => {
      const partialUpdate = {
        phone: '+55 11 88888-8888'
      }

      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(partialUpdate)
      })

      // Should accept partial updates
      expect(response.status).toBeOneOf([200, 404])
      expect(response.status).not.toBe(400)
    })
  })

  describe('Response Contract Validation', () => {
    test('deve retornar 200 com dados atualizados do paciente', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validUpdateData.fullUpdate)
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const patientData = await response.json()

      // Should include updated data
      expect(patientData.name).toBe(validUpdateData.fullUpdate.name)
      expect(patientData.phone).toBe(validUpdateData.fullUpdate.phone)
      expect(patientData.email).toBe(validUpdateData.fullUpdate.email)

      // Core structure validation
      expect(patientData).toHaveProperty('id')
      expect(patientData).toHaveProperty('org_id')
      expect(patientData).toHaveProperty('updated_at')

      // UUID validation
      expect(patientData.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

      // Updated timestamp should be recent
      const updatedAt = new Date(patientData.updated_at)
      const now = new Date()
      const timeDiff = now.getTime() - updatedAt.getTime()
      expect(timeDiff).toBeLessThan(10000) // Updated within last 10 seconds
    })

    test('deve incluir campos não atualizados inalterados', async () => {
      const partialUpdate = {
        phone: '+55 11 99999-8888'
      }

      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(partialUpdate)
      })

      expect(response.status).toBe(200)

      const patientData = await response.json()

      // Updated field
      expect(patientData.phone).toBe(partialUpdate.phone)

      // Unchanged fields should remain
      expect(patientData).toHaveProperty('name')
      expect(patientData).toHaveProperty('cpf')
      expect(patientData).toHaveProperty('date_of_birth')
      expect(patientData).toHaveProperty('gender')

      // Timestamps
      expect(patientData).toHaveProperty('created_at')
      expect(patientData).toHaveProperty('updated_at')
    })

    test('deve incluir metadados de auditoria para profissionais', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.fisioterapeuta,
          'X-Forwarded-For': '192.168.1.100'
        },
        body: JSON.stringify(validUpdateData.basicInfo)
      })

      expect(response.status).toBe(200)

      const patientData = await response.json()

      // Audit metadata for healthcare professionals
      expect(patientData).toHaveProperty('lastModifiedBy')
      expect(patientData).toHaveProperty('modificationReason')
      expect(patientData.lastModifiedBy).toHaveProperty('name')
      expect(patientData.lastModifiedBy).toHaveProperty('role')
    })

    test('deve mascarar dados sensíveis na resposta para pacientes', async () => {
      const limitedUpdate = {
        phone: '+55 11 88888-8888',
        email: 'paciente@email.com'
      }

      const response = await fetch(`/api/patients/${testPatientIds.patientOwnId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.paciente
        },
        body: JSON.stringify(limitedUpdate)
      })

      expect(response.status).toBe(200)

      const patientData = await response.json()

      // Should not include professional metadata
      expect(patientData).not.toHaveProperty('lastModifiedBy')
      expect(patientData).not.toHaveProperty('statistics')
      expect(patientData).not.toHaveProperty('professional_notes')
    })
  })

  describe('Business Logic Contract', () => {
    test('deve aplicar isolamento organizacional', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.otherOrgPatient}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin,
          'X-Org-Id': '550e8400-e29b-41d4-a716-446655440000'
        },
        body: JSON.stringify(validUpdateData.basicInfo)
      })

      // Should not allow updating patients from other organizations
      expect(response.status).toBe(404)
    })

    test('deve recalcular idade se data de nascimento permitida para atualização', async () => {
      // Most systems don't allow birth date updates, but if they do, age should recalculate
      const updateWithBirthDate = {
        name: 'Paciente Teste',
        date_of_birth: '1995-06-15'
      }

      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(updateWithBirthDate)
      })

      if (response.status === 200) {
        const patientData = await response.json()

        // Age should be recalculated
        const birthDate = new Date(updateWithBirthDate.date_of_birth)
        const today = new Date()
        const expectedAge = today.getFullYear() - birthDate.getFullYear()

        expect(patientData.age).toBe(expectedAge)
      } else {
        // If birth date updates are not allowed, should return validation error
        expect(response.status).toBe(400)

        const errorData = await response.json()
        expect(errorData.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'date_of_birth',
              message: expect.stringMatching(/data.*nascimento.*não.*pode.*ser.*alterada/i)
            })
          ])
        )
      }
    })

    test('deve registrar atualização para auditoria LGPD', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin,
          'X-Forwarded-For': '192.168.1.100'
        },
        body: JSON.stringify(validUpdateData.basicInfo)
      })

      expect(response.status).toBe(200)

      // Should log patient update for audit
      expect(response.headers.get('x-audit-logged')).toBe('true')
    })

    test('deve validar unicidade de CPF se permitido alterar', async () => {
      const updateWithCpf = {
        name: 'Teste Duplicação',
        cpf: '98765432100' // Assuming this CPF already exists
      }

      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(updateWithCpf)
      })

      if (response.status === 409) {
        // If CPF updates are allowed and this creates a conflict
        const errorData = await response.json()
        expect(errorData.error).toBe('duplicate_cpf')
        expect(errorData.message).toMatch(/cpf.*já.*cadastrado/i)
      } else if (response.status === 400) {
        // If CPF updates are not allowed
        const errorData = await response.json()
        expect(errorData.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'cpf',
              message: expect.stringMatching(/cpf.*não.*pode.*ser.*alterado/i)
            })
          ])
        )
      }
    })

    test('deve manter histórico de alterações para auditoria', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.fisioterapeuta
        },
        body: JSON.stringify(validUpdateData.healthcareUpdate)
      })

      expect(response.status).toBe(200)

      // Should include change tracking metadata
      expect(response.headers.get('x-changes-tracked')).toBe('true')
    })
  })

  describe('Security Contract', () => {
    test('deve incluir headers de segurança para dados de saúde', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validUpdateData.basicInfo)
      })

      expect(response.status).toBe(200)

      // Security headers for healthcare data
      expect(response.headers.get('x-content-type-options')).toBe('nosniff')
      expect(response.headers.get('x-frame-options')).toBe('DENY')
      expect(response.headers.get('cache-control')).toMatch(/no-cache|no-store/)

      // CORS for healthcare applications
      expect(response.headers.get('access-control-allow-credentials')).toBe('true')
    })

    test('deve sanitizar dados de entrada', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>Maria Silva',
        observations: 'Paciente <img src=x onerror=alert(1)> colaborativo'
      }

      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(maliciousData)
      })

      if (response.status === 200) {
        const patientData = await response.json()
        expect(patientData.name).not.toMatch(/<script>/)
        expect(patientData.observations).not.toMatch(/<img/)
      }
    })

    test('deve limitar tamanho da requisição', async () => {
      const largeData = {
        name: 'Maria Silva',
        observations: 'A'.repeat(10000) // Very large string
      }

      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(largeData)
      })

      expect(response.status).toBe(413)

      const errorData = await response.json()
      expect(errorData.error).toBe('payload_too_large')
      expect(errorData.message).toMatch(/dados.*muito.*grandes/i)
    })

    test('deve validar Content-Type da requisição', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': authTokens.admin
        },
        body: 'invalid content type'
      })

      expect(response.status).toBe(415)

      const errorData = await response.json()
      expect(errorData.error).toBe('unsupported_media_type')
      expect(errorData.message).toMatch(/content-type.*deve.*ser.*application\/json/i)
    })
  })

  describe('Error Handling Contract', () => {
    test('deve retornar estrutura consistente de erro', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidUpdateData.invalidEmail)
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

      // Each detail should have field and message
      const detail = errorData.details[0]
      expect(detail).toHaveProperty('field')
      expect(detail).toHaveProperty('message')

      // Portuguese-BR error messages
      expect(typeof errorData.message).toBe('string')
      expect(errorData.message).toMatch(/[a-záàâãéêíóôõúç]/i)

      // Metadata
      expect(errorData.path).toBe(`/api/patients/${testPatientIds.valid}`)
      expect(errorData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    test('deve tratar erro de banco de dados graciosamente', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin,
          'X-Simulate-Error': 'database_connection'
        },
        body: JSON.stringify(validUpdateData.basicInfo)
      })

      expect(response.status).toBe(500)

      const errorData = await response.json()
      expect(errorData.error).toBe('internal_server_error')
      expect(errorData.message).toMatch(/erro.*interno.*servidor/i)
      expect(errorData).not.toHaveProperty('details') // No sensitive database info
    })

    test('deve tratar conflitos de concorrência', async () => {
      const response = await fetch(`/api/patients/${testPatientIds.valid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin,
          'If-Match': 'outdated-etag-value'
        },
        body: JSON.stringify(validUpdateData.basicInfo)
      })

      expect(response.status).toBe(409)

      const errorData = await response.json()
      expect(errorData.error).toBe('conflict')
      expect(errorData.message).toMatch(/dados.*foram.*modificados.*outro.*usuário/i)
      expect(errorData).toHaveProperty('currentEtag')
    })
  })
})