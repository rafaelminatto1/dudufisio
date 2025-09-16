/**
 * Contract Test: POST /api/sessions/{sessionId}/pain-points
 * Validates API contract for pain point creation in body mapping
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

// Test session IDs for pain point creation
const testSessionIds = {
  valid: '550e8400-e29b-41d4-a716-446655440000',
  invalid: '00000000-0000-0000-0000-000000000000',
  malformed: 'invalid-session-id'
}

// Valid pain point data samples (Brazilian physiotherapy patterns)
const validPainPointData = {
  shoulderLeft: {
    body_side: 'front',
    region_key: 'shoulder_left',
    x_coordinate: 25.5,
    y_coordinate: 30.8,
    pain_intensity: 7,
    description: 'Dor intensa no ombro esquerdo durante elevação do braço'
  },
  lowerBackRight: {
    body_side: 'back',
    region_key: 'lower_back_right',
    x_coordinate: 65.2,
    y_coordinate: 55.0,
    pain_intensity: 5,
    description: 'Dor lombar direita que irradia para coxa'
  },
  kneeFront: {
    body_side: 'front',
    region_key: 'knee_right',
    x_coordinate: 72.1,
    y_coordinate: 78.9,
    pain_intensity: 3,
    description: 'Dor leve no joelho direito ao subir escadas'
  },
  minimal: {
    body_side: 'front',
    region_key: 'chest_center',
    x_coordinate: 50.0,
    y_coordinate: 40.0,
    pain_intensity: 2
  }
}

// Invalid pain point data for validation tests
const invalidPainPointData = {
  missingBodySide: {
    region_key: 'shoulder_left',
    x_coordinate: 25.5,
    y_coordinate: 30.8,
    pain_intensity: 7
  },
  invalidBodySide: {
    body_side: 'side',
    region_key: 'shoulder_left',
    x_coordinate: 25.5,
    y_coordinate: 30.8,
    pain_intensity: 7
  },
  missingRegionKey: {
    body_side: 'front',
    x_coordinate: 25.5,
    y_coordinate: 30.8,
    pain_intensity: 7
  },
  invalidCoordinates: {
    body_side: 'front',
    region_key: 'shoulder_left',
    x_coordinate: 150.0, // Invalid: > 100
    y_coordinate: -10.0, // Invalid: < 0
    pain_intensity: 7
  },
  invalidPainIntensity: {
    body_side: 'front',
    region_key: 'shoulder_left',
    x_coordinate: 25.5,
    y_coordinate: 30.8,
    pain_intensity: 15 // Invalid: > 10
  },
  stringCoordinates: {
    body_side: 'front',
    region_key: 'shoulder_left',
    x_coordinate: 'invalid',
    y_coordinate: 'invalid',
    pain_intensity: 7
  }
}

describe('POST /api/sessions/{sessionId}/pain-points - Contract Tests', () => {
  beforeAll(async () => {
    // Setup test organization, users, and sessions
    // This will fail until database setup is complete
  })

  afterAll(async () => {
    // Cleanup test data
  })

  describe('Authentication and Authorization Contract', () => {
    test('deve retornar 401 para requisição sem autenticação', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validPainPointData.minimal)
      })

      expect(response.status).toBe(401)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const errorData = await response.json()
      expect(errorData).toHaveProperty('error')
      expect(errorData.error).toBe('unauthorized')
      expect(errorData.message).toMatch(/autenticação.*necessária/i)
    })

    test('deve retornar 401 para token inválido', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.invalid
        },
        body: JSON.stringify(validPainPointData.minimal)
      })

      expect(response.status).toBe(401)

      const errorData = await response.json()
      expect(errorData.error).toBe('invalid_token')
      expect(errorData.message).toMatch(/token.*inválido/i)
    })

    test('deve permitir criação para administrador', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validPainPointData.shoulderLeft)
      })

      // Should return 201 or 400 (validation), but not 403 (forbidden)
      expect(response.status).toBeOneOf([201, 400, 404])
      expect(response.status).not.toBe(403)
    })

    test('deve permitir criação para fisioterapeuta', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.fisioterapeuta
        },
        body: JSON.stringify(validPainPointData.lowerBackRight)
      })

      // Should return 201 or 400 (validation), but not 403 (forbidden)
      expect(response.status).toBeOneOf([201, 400, 404])
      expect(response.status).not.toBe(403)
    })

    test('deve retornar 403 para estagiário', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.estagiario
        },
        body: JSON.stringify(validPainPointData.minimal)
      })

      expect(response.status).toBe(403)

      const errorData = await response.json()
      expect(errorData.error).toBe('insufficient_permissions')
      expect(errorData.message).toMatch(/permissões.*insuficientes/i)
    })

    test('deve retornar 403 para paciente', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.paciente
        },
        body: JSON.stringify(validPainPointData.minimal)
      })

      expect(response.status).toBe(403)

      const errorData = await response.json()
      expect(errorData.error).toBe('insufficient_permissions')
      expect(errorData.message).toMatch(/permissões.*insuficientes/i)
    })
  })

  describe('Path Parameters Contract', () => {
    test('deve retornar 404 para sessão inexistente', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.invalid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validPainPointData.minimal)
      })

      expect(response.status).toBe(404)

      const errorData = await response.json()
      expect(errorData.error).toBe('session_not_found')
      expect(errorData.message).toMatch(/sessão.*não.*encontrada/i)
    })

    test('deve retornar 400 para ID de sessão malformado', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.malformed}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validPainPointData.minimal)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.error).toBe('validation_error')
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'sessionId',
            message: expect.stringMatching(/id.*sessão.*formato.*inválido/i)
          })
        ])
      )
    })
  })

  describe('Request Validation Contract', () => {
    test('deve validar campos obrigatórios', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidPainPointData.missingBodySide)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData).toHaveProperty('error')
      expect(errorData.error).toBe('validation_error')
      expect(errorData).toHaveProperty('details')
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'body_side',
            message: expect.stringMatching(/lado.*corpo.*obrigatório/i)
          })
        ])
      )
    })

    test('deve validar lado do corpo', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidPainPointData.invalidBodySide)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.error).toBe('validation_error')
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'body_side',
            message: expect.stringMatching(/lado.*corpo.*deve.*ser.*front.*back/i)
          })
        ])
      )
    })

    test('deve validar chave da região corporal', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidPainPointData.missingRegionKey)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'region_key',
            message: expect.stringMatching(/região.*corporal.*obrigatória/i)
          })
        ])
      )
    })

    test('deve validar coordenadas dentro dos limites (0-100)', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidPainPointData.invalidCoordinates)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'x_coordinate',
            message: expect.stringMatching(/coordenada.*x.*entre.*0.*100/i)
          }),
          expect.objectContaining({
            field: 'y_coordinate',
            message: expect.stringMatching(/coordenada.*y.*entre.*0.*100/i)
          })
        ])
      )
    })

    test('deve validar intensidade da dor (0-10)', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidPainPointData.invalidPainIntensity)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'pain_intensity',
            message: expect.stringMatching(/intensidade.*dor.*entre.*0.*10/i)
          })
        ])
      )
    })

    test('deve validar tipos de dados das coordenadas', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidPainPointData.stringCoordinates)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'x_coordinate',
            message: expect.stringMatching(/coordenada.*x.*deve.*ser.*número/i)
          }),
          expect.objectContaining({
            field: 'y_coordinate',
            message: expect.stringMatching(/coordenada.*y.*deve.*ser.*número/i)
          })
        ])
      )
    })

    test('deve aceitar descrição opcional', async () => {
      const painPointWithoutDescription = {
        body_side: 'front',
        region_key: 'shoulder_left',
        x_coordinate: 25.5,
        y_coordinate: 30.8,
        pain_intensity: 7
      }

      const painPointWithDescription = {
        ...painPointWithoutDescription,
        description: 'Dor intensa durante movimento específico'
      }

      // Both should be valid requests
      const responseWithout = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(painPointWithoutDescription)
      })

      const responseWith = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(painPointWithDescription)
      })

      // Both should not fail due to missing description
      expect(responseWithout.status).toBeOneOf([201, 400, 404])
      expect(responseWith.status).toBeOneOf([201, 400, 404])
    })

    test('deve validar comprimento máximo da descrição', async () => {
      const longDescription = 'A'.repeat(1001) // Too long
      const painPointWithLongDescription = {
        ...validPainPointData.minimal,
        description: longDescription
      }

      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(painPointWithLongDescription)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'description',
            message: expect.stringMatching(/descrição.*máximo.*1000.*caracteres/i)
          })
        ])
      )
    })
  })

  describe('Response Contract Validation', () => {
    test('deve retornar 201 com dados do ponto de dor criado', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validPainPointData.shoulderLeft)
      })

      expect(response.status).toBe(201)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const painPointData = await response.json()

      // Response structure validation
      expect(painPointData).toHaveProperty('id')
      expect(painPointData).toHaveProperty('session_id')
      expect(painPointData).toHaveProperty('body_side')
      expect(painPointData).toHaveProperty('region_key')
      expect(painPointData).toHaveProperty('x_coordinate')
      expect(painPointData).toHaveProperty('y_coordinate')
      expect(painPointData).toHaveProperty('pain_intensity')
      expect(painPointData).toHaveProperty('description')
      expect(painPointData).toHaveProperty('created_at')

      // UUID validation
      expect(painPointData.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      expect(painPointData.session_id).toBe(testSessionIds.valid)

      // Data validation
      expect(painPointData.body_side).toBe(validPainPointData.shoulderLeft.body_side)
      expect(painPointData.region_key).toBe(validPainPointData.shoulderLeft.region_key)
      expect(painPointData.x_coordinate).toBe(validPainPointData.shoulderLeft.x_coordinate)
      expect(painPointData.y_coordinate).toBe(validPainPointData.shoulderLeft.y_coordinate)
      expect(painPointData.pain_intensity).toBe(validPainPointData.shoulderLeft.pain_intensity)
      expect(painPointData.description).toBe(validPainPointData.shoulderLeft.description)

      // Timestamps
      expect(painPointData.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

      // Should not include sensitive audit fields
      expect(painPointData).not.toHaveProperty('created_by')
      expect(painPointData).not.toHaveProperty('updated_by')
    })

    test('deve incluir header Location com URL do recurso criado', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validPainPointData.kneeFront)
      })

      expect(response.status).toBe(201)

      const locationHeader = response.headers.get('location')
      expect(locationHeader).toMatch(new RegExp(`^/api/sessions/${testSessionIds.valid}/pain-points/[0-9a-f-]{36}$`, 'i'))
    })

    test('deve incluir campo photo_url como null quando não fornecido', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validPainPointData.minimal)
      })

      expect(response.status).toBe(201)

      const painPointData = await response.json()
      expect(painPointData).toHaveProperty('photo_url')
      expect(painPointData.photo_url).toBeNull()
    })
  })

  describe('Business Logic Contract', () => {
    test('deve permitir múltiplos pontos de dor na mesma sessão', async () => {
      // First pain point
      const firstResponse = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validPainPointData.shoulderLeft)
      })

      expect(firstResponse.status).toBe(201)

      // Second pain point in same session
      const secondResponse = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validPainPointData.lowerBackRight)
      })

      expect(secondResponse.status).toBe(201)

      const firstPainPoint = await firstResponse.json()
      const secondPainPoint = await secondResponse.json()

      // Should be different pain points in same session
      expect(firstPainPoint.id).not.toBe(secondPainPoint.id)
      expect(firstPainPoint.session_id).toBe(secondPainPoint.session_id)
    })

    test('deve aplicar isolamento organizacional', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin,
          'X-Org-Id': '550e8400-e29b-41d4-a716-446655440000'
        },
        body: JSON.stringify(validPainPointData.minimal)
      })

      if (response.status === 201) {
        const painPointData = await response.json()
        // Session should belong to the same organization
        expect(response.headers.get('x-org-validated')).toBe('true')
      }
    })

    test('deve registrar criação para auditoria LGPD', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin,
          'X-Forwarded-For': '192.168.1.100'
        },
        body: JSON.stringify(validPainPointData.shoulderLeft)
      })

      expect(response.status).toBe(201)

      // Should log pain point creation for audit
      expect(response.headers.get('x-audit-logged')).toBe('true')
    })

    test('deve arredondar coordenadas para 2 casas decimais', async () => {
      const precisePainPoint = {
        body_side: 'front',
        region_key: 'shoulder_left',
        x_coordinate: 25.123456789,
        y_coordinate: 30.987654321,
        pain_intensity: 7
      }

      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(precisePainPoint)
      })

      expect(response.status).toBe(201)

      const painPointData = await response.json()
      expect(painPointData.x_coordinate).toBe(25.12)
      expect(painPointData.y_coordinate).toBe(30.99)
    })

    test('deve validar consistência entre lado do corpo e região', async () => {
      const inconsistentPainPoint = {
        body_side: 'front',
        region_key: 'spine_lower', // Spine regions are typically on 'back'
        x_coordinate: 50.0,
        y_coordinate: 60.0,
        pain_intensity: 5
      }

      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(inconsistentPainPoint)
      })

      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.error).toBe('validation_error')
      expect(errorData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'region_key',
            message: expect.stringMatching(/região.*não.*compatível.*lado.*corpo/i)
          })
        ])
      )
    })
  })

  describe('Security Contract', () => {
    test('deve incluir headers de segurança para dados de saúde', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validPainPointData.minimal)
      })

      // Security headers for healthcare data
      expect(response.headers.get('x-content-type-options')).toBe('nosniff')
      expect(response.headers.get('x-frame-options')).toBe('DENY')
      expect(response.headers.get('cache-control')).toMatch(/no-cache|no-store/)

      // CORS for healthcare applications
      expect(response.headers.get('access-control-allow-credentials')).toBe('true')
    })

    test('deve sanitizar dados de entrada', async () => {
      const maliciousPainPoint = {
        ...validPainPointData.minimal,
        description: '<script>alert("xss")</script>Dor no ombro',
        region_key: 'shoulder<img src=x onerror=alert(1)>_left'
      }

      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(maliciousPainPoint)
      })

      if (response.status === 201) {
        const painPointData = await response.json()
        expect(painPointData.description).not.toMatch(/<script>/)
        expect(painPointData.region_key).not.toMatch(/<img/)
      }
    })

    test('deve limitar tamanho da requisição', async () => {
      const largePainPoint = {
        ...validPainPointData.minimal,
        description: 'A'.repeat(10000) // Very large string
      }

      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(largePainPoint)
      })

      expect(response.status).toBe(413)

      const errorData = await response.json()
      expect(errorData.error).toBe('payload_too_large')
      expect(errorData.message).toMatch(/dados.*muito.*grandes/i)
    })
  })

  describe('Error Handling Contract', () => {
    test('deve retornar estrutura consistente de erro', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(invalidPainPointData.invalidPainIntensity)
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
      expect(errorData.path).toBe(`/api/sessions/${testSessionIds.valid}/pain-points`)
      expect(errorData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    test('deve tratar erro de banco de dados', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.valid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin,
          'X-Simulate-Error': 'database_connection'
        },
        body: JSON.stringify(validPainPointData.minimal)
      })

      expect(response.status).toBe(500)

      const errorData = await response.json()
      expect(errorData.error).toBe('internal_server_error')
      expect(errorData.message).toMatch(/erro.*interno.*servidor/i)
      expect(errorData).not.toHaveProperty('details') // No sensitive database info
    })

    test('deve manter estrutura consistente de erro em português-BR', async () => {
      const response = await fetch(`/api/sessions/${testSessionIds.invalid}/pain-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authTokens.admin
        },
        body: JSON.stringify(validPainPointData.minimal)
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
      expect(errorData.path).toBe(`/api/sessions/${testSessionIds.invalid}/pain-points`)
    })
  })
})