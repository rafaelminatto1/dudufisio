import { NextRequest, NextResponse } from 'next/server'
import { iotDeviceManager } from '@/src/lib/iot/device-manager'
import { logger } from '@/src/lib/logging/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const capability = searchParams.get('capability')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId is required' },
        { status: 400 }
      )
    }

    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined

    const readings = iotDeviceManager.getPatientReadings(
      patientId,
      capability || undefined,
      start,
      end
    )

    return NextResponse.json({
      readings,
      total: readings.length,
      filters: {
        patientId,
        capability,
        startDate: start?.toISOString(),
        endDate: end?.toISOString()
      }
    })

  } catch (error) {
    logger.error('Failed to get IoT readings', {}, error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      deviceId,
      capability,
      value,
      unit,
      patientId,
      metadata
    } = body

    // Validar dados obrigatórios
    if (!deviceId || !capability || value === undefined || !unit || !patientId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validar valor
    if (typeof value !== 'number' || isNaN(value)) {
      return NextResponse.json(
        { error: 'Value must be a valid number' },
        { status: 400 }
      )
    }

    // Receber leitura do dispositivo
    const reading = await iotDeviceManager.receiveReading(
      deviceId,
      capability,
      value,
      unit,
      patientId,
      metadata
    )

    logger.info('IoT reading received', {
      readingId: reading.id,
      deviceId: reading.deviceId,
      capability: reading.capability,
      value: reading.value,
      quality: reading.quality
    })

    return NextResponse.json(reading, { status: 201 })

  } catch (error) {
    logger.error('Failed to receive IoT reading', {}, error as Error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
