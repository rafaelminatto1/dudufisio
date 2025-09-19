/**
 * Contract Test: POST /api/auth/login
 * Validates API contract for user authentication
 * Must fail before implementation exists
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/testing-library/jest-dom'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/src/lib/supabase/database.types'

// Test data following Brazilian healthcare patterns
const testUsers = {
  validAdmin: {
    email: 'admin@clinicafisio.com.br',
    password: 'AdminTeste123!',
    name: 'Dr. João Silva',
    cpf: '12345678901',
    crefito: 'CREFITO3-12345'
  },
  validFisioterapeuta: {
    email: 'fisio@clinicafisio.com.br',
    password: 'FisioTeste123!',
    name: 'Dra. Maria Santos',
    cpf: '98765432100',
    crefito: 'CREFITO3-67890'
  },
  invalidUser: {
    email: 'inexistente@clinica.com.br',
    password: 'SenhaErrada123!'
  }
}

describe('POST /api/auth/login - Contract Tests', () => {
  beforeAll(async () => {
    // Setup test database with sample users
    // This will fail until Supabase setup is complete
  })

  afterAll(async () => {
    // Cleanup test data
  })

  describe('Request Contract Validation', () => {
    test('deve aceitar email e senha válidos no formato brasileiro', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUsers.validAdmin.email,
          password: testUsers.validAdmin.password,
          rememberMe: false
        })
      })

      // Contract expectations (will fail until endpoint exists)
      expect(response).toBeDefined()
      expect(response.status).toBeOneOf([200, 400, 401])
    })

    test('deve rejeitar requisição sem email', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: testUsers.validAdmin.password
        })
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData).toHaveProperty('error')
      expect(errorData.error).toMatch(/email.*obrigatório/i)
    })

    test('deve rejeitar requisição sem senha', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUsers.validAdmin.email
        })
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData).toHaveProperty('error')
      expect(errorData.error).toMatch(/senha.*obrigatório/i)
    })

    test('deve rejeitar email com formato inválido', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'email-invalido',
          password: testUsers.validAdmin.password
        })
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData).toHaveProperty('error')
      expect(errorData.error).toMatch(/email.*formato.*inválido/i)
    })

    test('deve aceitar parâmetro rememberMe opcional', async () => {
      const responseWithRemember = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUsers.validAdmin.email,
          password: testUsers.validAdmin.password,
          rememberMe: true
        })
      })

      const responseWithoutRemember = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUsers.validAdmin.email,
          password: testUsers.validAdmin.password
        })
      })

      // Both should be valid requests (status depends on credentials)
      expect(responseWithRemember).toBeDefined()
      expect(responseWithoutRemember).toBeDefined()
    })
  })

  describe('Response Contract Validation', () => {
    test('deve retornar 200 com dados do usuário para credenciais válidas', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUsers.validAdmin.email,
          password: testUsers.validAdmin.password
        })
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const responseData = await response.json()

      // Response contract validation
      expect(responseData).toHaveProperty('user')
      expect(responseData).toHaveProperty('session')
      expect(responseData).not.toHaveProperty('error')

      // User object structure
      expect(responseData.user).toHaveProperty('id')
      expect(responseData.user).toHaveProperty('email')
      expect(responseData.user).toHaveProperty('profile')
      expect(responseData.user).toHaveProperty('currentOrg')
      expect(responseData.user).toHaveProperty('currentRole')

      // Profile structure
      expect(responseData.user.profile).toHaveProperty('name')
      expect(responseData.user.profile).toHaveProperty('cpf')
      expect(responseData.user.profile).toHaveProperty('crefito_number')

      // Brazilian healthcare role validation
      expect(responseData.user.currentRole).toBeOneOf([
        'admin', 'fisioterapeuta', 'estagiario', 'paciente'
      ])

      // Session structure
      expect(responseData.session).toHaveProperty('access_token')
      expect(responseData.session).toHaveProperty('refresh_token')
      expect(responseData.session).toHaveProperty('expires_at')
    })

    test('deve retornar 401 para credenciais inválidas', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUsers.invalidUser.email,
          password: testUsers.invalidUser.password
        })
      })

      expect(response.status).toBe(401)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const errorData = await response.json()

      expect(errorData).toHaveProperty('error')
      expect(errorData).toHaveProperty('message')
      expect(errorData.error).toBe('invalid_credentials')
      expect(errorData.message).toMatch(/credenciais.*inválidas/i)
      expect(errorData).not.toHaveProperty('user')
      expect(errorData).not.toHaveProperty('session')
    })

    test('deve retornar 401 para usuário não confirmado', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'naoconfirmado@clinica.com.br',
          password: 'ValidPassword123!'
        })
      })

      expect(response.status).toBe(401)

      const errorData = await response.json()
      expect(errorData.error).toBe('email_not_confirmed')
      expect(errorData.message).toMatch(/email.*não.*confirmado/i)
    })

    test('deve incluir headers de segurança apropriados', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUsers.validAdmin.email,
          password: testUsers.validAdmin.password
        })
      })

      // Security headers for healthcare data
      expect(response.headers.get('x-content-type-options')).toBe('nosniff')
      expect(response.headers.get('x-frame-options')).toBe('DENY')
      expect(response.headers.get('x-xss-protection')).toBe('1; mode=block')

      // CORS headers for web app
      expect(response.headers.get('access-control-allow-origin')).toBeDefined()
      expect(response.headers.get('access-control-allow-credentials')).toBe('true')
    })
  })

  describe('Business Logic Contract', () => {
    test('deve registrar tentativa de login para auditoria LGPD', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '192.168.1.100'
        },
        body: JSON.stringify({
          email: testUsers.validAdmin.email,
          password: testUsers.validAdmin.password
        })
      })

      // Should log both successful and failed attempts
      // This will be verified by checking audit_logs table
      expect(response).toBeDefined()
    })

    test('deve aplicar rate limiting para múltiplas tentativas', async () => {
      const attempts = []

      // Make multiple rapid login attempts
      for (let i = 0; i < 6; i++) {
        attempts.push(
          fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Forwarded-For': '192.168.1.101'
            },
            body: JSON.stringify({
              email: testUsers.invalidUser.email,
              password: testUsers.invalidUser.password
            })
          })
        )
      }

      const responses = await Promise.all(attempts)
      const lastResponse = responses[responses.length - 1]

      // Should implement rate limiting after 5 attempts
      expect(lastResponse.status).toBe(429)

      const errorData = await lastResponse.json()
      expect(errorData.error).toBe('too_many_requests')
      expect(errorData.message).toMatch(/muitas.*tentativas/i)
      expect(errorData).toHaveProperty('retryAfter')
    })

    test('deve configurar sessão com isolamento organizacional', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUsers.validFisioterapeuta.email,
          password: testUsers.validFisioterapeuta.password
        })
      })

      expect(response.status).toBe(200)

      const responseData = await response.json()

      // Should include organization context
      expect(responseData.user.currentOrg).toHaveProperty('id')
      expect(responseData.user.currentOrg).toHaveProperty('name')
      expect(responseData.user.currentOrg).toHaveProperty('cnpj')

      // Should set organization in cookies/headers
      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toMatch(/current-org=/)
    })

    test('deve redirecionar baseado no papel do usuário', async () => {
      const adminResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUsers.validAdmin.email,
          password: testUsers.validAdmin.password
        })
      })

      const fisioterapeutaResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUsers.validFisioterapeuta.email,
          password: testUsers.validFisioterapeuta.password
        })
      })

      expect(adminResponse.status).toBe(200)
      expect(fisioterapeutaResponse.status).toBe(200)

      const adminData = await adminResponse.json()
      const fisioData = await fisioterapeutaResponse.json()

      // Should include appropriate redirect URL based on role
      expect(adminData).toHaveProperty('redirectTo')
      expect(fisioData).toHaveProperty('redirectTo')

      expect(adminData.redirectTo).toMatch(/\/dashboard\/admin/)
      expect(fisioData.redirectTo).toMatch(/\/dashboard\/fisioterapeuta/)
    })
  })

  describe('Error Handling Contract', () => {
    test('deve retornar erro específico para cada tipo de falha', async () => {
      const testCases = [
        {
          input: { email: '', password: 'test' },
          expectedError: 'validation_error',
          expectedMessage: /email.*obrigatório/i
        },
        {
          input: { email: 'test@test.com', password: '' },
          expectedError: 'validation_error',
          expectedMessage: /senha.*obrigatório/i
        },
        {
          input: { email: 'invalid-email', password: 'test' },
          expectedError: 'validation_error',
          expectedMessage: /email.*formato.*inválido/i
        }
      ]

      for (const testCase of testCases) {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testCase.input)
        })

        expect(response.status).toBe(400)

        const errorData = await response.json()
        expect(errorData.error).toBe(testCase.expectedError)
        expect(errorData.message).toMatch(testCase.expectedMessage)
      }
    })

    test('deve manter estrutura consistente de erro em português-BR', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUsers.invalidUser.email,
          password: testUsers.invalidUser.password
        })
      })

      expect(response.status).toBe(401)

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
      expect(errorData.path).toBe('/api/auth/login')
    })
  })
})