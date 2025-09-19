/**
 * Contract Test: POST /api/patients
 * Validates API contract for patient creation
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

// Valid patient data samples (Brazilian healthcare format)
const validPatientData = {
  complete: {
    name: 'Maria Silva Santos',
    cpf: '12345678901',
    rg: '123456789',
    date_of_birth: '1990-05-15',
    gender: 'feminino',
    phone: '+55 11 99999-9999',
    email: 'maria.santos@email.com',
    emergency_contact_name: 'João Santos',
    emergency_contact_phone: '+55 11 88888-8888',
    address_line1: 'Rua das Flores, 123',
    address_line2: 'Apto 45',
    city: 'São Paulo',
    state: 'SP',
    postal_code: '01234567',
    health_insurance: 'Bradesco Saúde',
    health_insurance_number: 'BS123456789',
    medical_history: 'Hipertensão controlada com medicamento',
    current_medications: 'Losartana 50mg 1x/dia',
    allergies: 'Penicilina',
    observations: 'Paciente colaborativo, histórico de lesão no joelho esquerdo',
    consent_lgpd: true
  },
  minimal: {
    name: 'João da Silva',
    cpf: '98765432100',
    date_of_birth: '1985-03-20',
    gender: 'masculino',
    phone: '+55 21 77777-7777',
    consent_lgpd: true
  }
}

// Invalid patient data for validation tests
const invalidPatientData = {
  missingName: {
    cpf: '12345678901',
    date_of_birth: '1990-05-15',
    gender: 'feminino',
    phone: '+55 11 99999-9999',
    consent_lgpd: true
  },
  invalidCpf: {
    name: 'Maria Silva',
    cpf: '11111111111', // Invalid CPF
    date_of_birth: '1990-05-15',
    gender: 'feminino',
    phone: '+55 11 99999-9999',
    consent_lgpd: true
  },
  invalidEmail: {
    name: 'Maria Silva',
    cpf: '12345678901',
    date_of_birth: '1990-05-15',
    gender: 'feminino',
    phone: '+55 11 99999-9999',
    email: 'email-invalido',
    consent_lgpd: true
  },
  missingConsent: {
    name: 'Maria Silva',
    cpf: '12345678901',
    date_of_birth: '1990-05-15',
    gender: 'feminino',
    phone: '+55 11 99999-9999',
    consent_lgpd: false
  },
  futureBirthDate: {
    name: 'Maria Silva',
    cpf: '12345678901',
    date_of_birth: '2030-05-15', // Future date
    gender: 'feminino',
    phone: '+55 11 99999-9999',
    consent_lgpd: true
  }
}

describe('POST /api/patients - Contract Tests', () => {
  beforeAll(async () => {
    // Setup test organization and users
    // This will fail until database setup is complete
  })

  afterAll(async () => {
    // Cleanup test data
  })

  describe('Authentication and Authorization Contract', () => {
    test('deve retornar 401 para requisição sem autenticação', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validPatientData.minimal)
      })

      expect(response.status).toBe(401)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const errorData = await response.json()
      expect(errorData).toHaveProperty('error')
      expect(errorData.error).toBe('unauthorized')
      expect(errorData.message).toMatch(/autenticação.*necessária/i)
    })

    test('deve retornar 401 para token inválido', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.invalid
        },
        body: JSON.stringify(validPatientData.minimal)
      })

      expect(response.status).toBe(401)

      const errorData = await response.json()
      expect(errorData.error).toBe('invalid_token')
      expect(errorData.message).toMatch(/token.*inválido/i)
    })

    test('deve permitir criação para administrador', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validPatientData.complete)
      })

      // Should return 201 or 400 (validation), but not 403 (forbidden)
      expect(response.status).toBeOneOf([201, 400])
      expect(response.status).not.toBe(403)
    })

    test('deve permitir criação para fisioterapeuta', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.fisioterapeuta
        },
        body: JSON.stringify(validPatientData.minimal)
      })

      // Should return 201 or 400 (validation), but not 403 (forbidden)
      expect(response.status).toBeOneOf([201, 400])
      expect(response.status).not.toBe(403)
    })

    test('deve retornar 403 para estagiário', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.estagiario
        },
        body: JSON.stringify(validPatientData.minimal)
      })

      expect(response.status).toBe(403)

      const errorData = await response.json()
      expect(errorData.error).toBe('insufficient_permissions')
      expect(errorData.message).toMatch(/permissões.*insuficientes/i)
    })

    test('deve retornar 403 para paciente', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.paciente
        },
        body: JSON.stringify(validPatientData.minimal)
      })

      expect(response.status).toBe(403)

      const errorData = await response.json()
      expect(errorData.error).toBe('insufficient_permissions')
      expect(errorData.message).toMatch(/permissões.*insuficientes/i)
    })
  })

  describe('Request Validation Contract', () => {
    test('deve validar campos obrigatórios', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidPatientData.missingName)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData).toHaveProperty('error')
      expect(errorData.error).toBe('validation_error')
      expect(errorData).toHaveProperty('details')
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.stringMatching(/nome.*obrigatório/i)
          })
        ])
      )
    })

    test('deve validar formato do CPF brasileiro', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidPatientData.invalidCpf)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.error).toBe('validation_error')
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'cpf',
            message: expect.stringMatching(/cpf.*inválido/i)
          })
        ])
      )
    })

    test('deve validar formato do email', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidPatientData.invalidEmail)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.stringMatching(/email.*formato.*inválido/i)
          })
        ])
      )
    })

    test('deve validar data de nascimento', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidPatientData.futureBirthDate)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'date_of_birth',
            message: expect.stringMatching(/data.*nascimento.*inválida/i)
          })
        ])
      )
    })

    test('deve exigir consentimento LGPD', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidPatientData.missingConsent)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'consent_lgpd',
            message: expect.stringMatching(/consentimento.*lgpd.*obrigatório/i)
          })
        ])
      )
    })

    test('deve validar telefone brasileiro', async () => {
      const invalidPhoneData = {
        ...validPatientData.minimal,
        phone: '123456789' // Invalid format
      }

      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidPhoneData)
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

    test('deve validar CEP brasileiro quando fornecido', async () => {
      const invalidCepData = {
        ...validPatientData.complete,
        postal_code: '1234567' // Invalid CEP format
      }

      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidCepData)
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
  })

  describe('Response Contract Validation', () => {
    test('deve retornar 201 com dados do paciente criado', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validPatientData.complete)
      })

      expect(response.status).toBe(201)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const patientData = await response.json()

      // Response structure validation
      expect(patientData).toHaveProperty('id')
      expect(patientData).toHaveProperty('org_id')
      expect(patientData).toHaveProperty('name')
      expect(patientData).toHaveProperty('cpf')
      expect(patientData).toHaveProperty('date_of_birth')
      expect(patientData).toHaveProperty('gender')
      expect(patientData).toHaveProperty('phone')
      expect(patientData).toHaveProperty('status')
      expect(patientData).toHaveProperty('created_at')
      expect(patientData).toHaveProperty('updated_at')

      // UUID validation
      expect(patientData.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      expect(patientData.org_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

      // Data validation
      expect(patientData.name).toBe(validPatientData.complete.name)
      expect(patientData.cpf).toBe(validPatientData.complete.cpf)
      expect(patientData.status).toBe('active')

      // Timestamps
      expect(patientData.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(patientData.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

      // Should not include sensitive audit fields
      expect(patientData).not.toHaveProperty('created_by')
      expect(patientData).not.toHaveProperty('updated_by')
    })

    test('deve incluir header Location com URL do recurso criado', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validPatientData.minimal)
      })

      expect(response.status).toBe(201)

      const locationHeader = response.headers.get('location')
      expect(locationHeader).toMatch(/^\/api\/patients\/[0-9a-f-]{36}$/i)
    })

    test('deve incluir metadados LGPD na resposta', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validPatientData.complete)
      })

      expect(response.status).toBe(201)

      const patientData = await response.json()

      // LGPD metadata
      expect(patientData).toHaveProperty('consent_lgpd')
      expect(patientData).toHaveProperty('consent_date')
      expect(patientData.consent_lgpd).toBe(true)
      expect(patientData.consent_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('Business Logic Contract', () => {
    test('deve verificar duplicação de CPF na organização', async () => {
      // First creation should succeed
      const firstResponse = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validPatientData.complete)
      })

      expect(firstResponse.status).toBe(201)

      // Second creation with same CPF should fail
      const secondResponse = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify({
          ...validPatientData.complete,
          name: 'Maria Silva Santos Duplicate'
        })
      })

      expect(secondResponse.status).toBe(409)

      const errorData = await secondResponse.json()
      expect(errorData.error).toBe('duplicate_cpf')
      expect(errorData.message).toMatch(/cpf.*já.*cadastrado/i)
    })

    test('deve aplicar isolamento organizacional', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin,
          'X-Org-Id': '550e8400-e29b-41d4-a716-446655440000'
        },
        body: JSON.stringify(validPatientData.minimal)
      })

      if (response.status === 201) {
        const patientData = await response.json()
        expect(patientData.org_id).toBe('550e8400-e29b-41d4-a716-446655440000')
      }
    })

    test('deve registrar criação para auditoria LGPD', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin,
          'X-Forwarded-For': '192.168.1.100'
        },
        body: JSON.stringify(validPatientData.complete)
      })

      expect(response.status).toBe(201)

      // Should log patient creation for audit
      expect(response.headers.get('x-audit-logged')).toBe('true')
    })

    test('deve calcular idade automaticamente', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validPatientData.complete)
      })

      expect(response.status).toBe(201)

      const patientData = await response.json()
      expect(patientData).toHaveProperty('age')
      expect(typeof patientData.age).toBe('number')
      expect(patientData.age).toBeGreaterThan(0)
      expect(patientData.age).toBeLessThan(150)
    })
  })

  describe('Security Contract', () => {
    test('deve incluir headers de segurança para dados de saúde', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validPatientData.minimal)
      })

      // Security headers for healthcare data
      expect(response.headers.get('x-content-type-options')).toBe('nosniff')
      expect(response.headers.get('x-frame-options')).toBe('DENY')
      expect(response.headers.get('cache-control')).toMatch(/no-cache|no-store/)

      // CORS for healthcare applications
      expect(response.headers.get('access-control-allow-credentials')).toBe('true')
    })

    test('deve sanitizar dados de entrada', async () => {
      const maliciousData = {
        ...validPatientData.minimal,
        name: '<script>alert("xss")</script>Maria Silva',
        observations: 'Paciente <img src=x onerror=alert(1)> colaborativo'
      }

      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(maliciousData)
      })

      if (response.status === 201) {
        const patientData = await response.json()
        expect(patientData.name).not.toMatch(/<script>/)
        expect(patientData.observations).not.toMatch(/<img/)
      }
    })

    test('deve limitar tamanho da requisição', async () => {
      const largeData = {
        ...validPatientData.complete,
        observations: 'A'.repeat(10000) // Very large string
      }

      const response = await fetch('/api/patients', {
        method: 'POST',
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
  })

  describe('Error Handling Contract', () => {
    test('deve retornar estrutura consistente de erro', async () => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidPatientData.invalidCpf)
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
      expect(errorData.path).toBe('/api/patients')
      expect(errorData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    test('deve tratar erro de banco de dados', async () => {
      // Simulate database connection error
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin,
          'X-Simulate-Error': 'database_connection'
        },
        body: JSON.stringify(validPatientData.minimal)
      })

      expect(response.status).toBe(500)

      const errorData = await response.json()
      expect(errorData.error).toBe('internal_server_error')
      expect(errorData.message).toMatch(/erro.*interno.*servidor/i)
      expect(errorData).not.toHaveProperty('details') // No sensitive database info
    })
  })
})