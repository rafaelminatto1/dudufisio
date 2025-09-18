import { NextRequest, NextResponse } from 'next/server'
import { iotDeviceManager } from '@/lib/iot/device-manager'
import { logger } from '@/lib/logging/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const { deviceId } = params

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      )
    }

    const success = await iotDeviceManager.connectDevice(deviceId)

    if (success) {
      logger.info('Device connected successfully', { deviceId })
      return NextResponse.json({
        success: true,
        message: 'Device connected successfully'
      })
    } else {
      logger.error('Failed to connect device', { deviceId })
      return NextResponse.json(
        { error: 'Failed to connect device' },
        { status: 500 }
      )
    }

  } catch (error) {
    logger.error('Error connecting device', { deviceId: params.deviceId }, error as Error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
