import { NextRequest, NextResponse } from 'next/server'
import { mlPredictionEngine, type PatientData } from '@/lib/ml/prediction-engine'
import { logger } from '@/lib/logging/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, patientData } = body

    if (!type || !patientData) {
      return NextResponse.json(
        { error: 'Missing required fields: type and patientData' },
        { status: 400 }
      )
    }

    // Validar dados do paciente
    const validationError = validatePatientData(patientData)
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case 'treatment_outcome':
        result = await mlPredictionEngine.predictTreatmentOutcome(patientData)
        break
        
      case 'evolution':
        const currentWeek = body.currentWeek || 0
        result = await mlPredictionEngine.predictEvolution(patientData, currentWeek)
        break
        
      case 'risk_assessment':
        result = await mlPredictionEngine.assessRisk(patientData)
        break
        
      case 'treatment_protocol':
        result = await mlPredictionEngine.suggestTreatmentProtocol(patientData)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid prediction type. Valid types: treatment_outcome, evolution, risk_assessment, treatment_protocol' },
          { status: 400 }
        )
    }

    logger.info('ML prediction completed', {
      type,
      patientId: patientData.id,
      confidence: result.confidence || 'N/A'
    })

    return NextResponse.json({
      success: true,
      type,
      patientId: patientData.id,
      timestamp: new Date().toISOString(),
      result
    })

  } catch (error) {
    logger.error('Failed to generate ML prediction', {}, error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function validatePatientData(patientData: any): string | null {
  const requiredFields = [
    'id', 'age', 'gender', 'diagnosis', 'painLevel', 
    'mobilityScore', 'treatmentDuration', 'sessionFrequency', 'adherence'
  ]

  for (const field of requiredFields) {
    if (patientData[field] === undefined || patientData[field] === null) {
      return `Missing required field: ${field}`
    }
  }

  // Validar tipos
  if (typeof patientData.age !== 'number' || patientData.age < 0 || patientData.age > 120) {
    return 'Invalid age: must be a number between 0 and 120'
  }

  if (!['male', 'female', 'other'].includes(patientData.gender)) {
    return 'Invalid gender: must be male, female, or other'
  }

  if (typeof patientData.painLevel !== 'number' || patientData.painLevel < 0 || patientData.painLevel > 10) {
    return 'Invalid painLevel: must be a number between 0 and 10'
  }

  if (typeof patientData.mobilityScore !== 'number' || patientData.mobilityScore < 0 || patientData.mobilityScore > 100) {
    return 'Invalid mobilityScore: must be a number between 0 and 100'
  }

  if (typeof patientData.adherence !== 'number' || patientData.adherence < 0 || patientData.adherence > 1) {
    return 'Invalid adherence: must be a number between 0 and 1'
  }

  return null
}
