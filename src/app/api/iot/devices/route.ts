import { NextRequest, NextResponse } from 'next/server'
import { iotDeviceManager, type IoTDevice } from '@/src/lib/iot/device-manager'
import { logger } from '@/src/lib/logging/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const type = searchParams.get('type')
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      )
    }

    let devices: IoTDevice[] = []

    if (patientId) {
      devices = iotDeviceManager.getPatientDevices(patientId)
    } else {
      // Retornar todos os dispositivos da organização
      devices = Array.from((iotDeviceManager as any).devices.values()).filter(
        (device: IoTDevice) => device.organizationId === organizationId
      )
    }

    if (type) {
      devices = devices.filter(device => device.type === type)
    }

    return NextResponse.json({
      devices,
      total: devices.length
    })

  } catch (error) {
    logger.error('Failed to get IoT devices', {}, error as Error)
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
      name,
      type,
      manufacturer,
      model,
      serialNumber,
      firmwareVersion,
      capabilities,
      patientId,
      organizationId
    } = body

    // Validar dados obrigatórios
    if (!name || !type || !manufacturer || !model || !serialNumber || !capabilities || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Registrar dispositivo
    const device = await iotDeviceManager.registerDevice({
      name,
      type,
      manufacturer,
      model,
      serialNumber,
      firmwareVersion: firmwareVersion || '1.0.0',
      isConnected: false,
      capabilities,
      patientId,
      organizationId
    })

    logger.info('IoT device registered', {
      deviceId: device.id,
      type: device.type,
      patientId: device.patientId
    })

    return NextResponse.json(device, { status: 201 })

  } catch (error) {
    logger.error('Failed to register IoT device', {}, error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
