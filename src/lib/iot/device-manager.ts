/**
 * Gerenciador de dispositivos IoT para FisioFlow
 * Suporta balanças, medidores, smartwatches e outros dispositivos
 */

import { logger } from '@/lib/logging/logger'

export interface IoTDevice {
  id: string
  name: string
  type: DeviceType
  manufacturer: string
  model: string
  serialNumber: string
  firmwareVersion: string
  batteryLevel?: number
  isConnected: boolean
  lastSeen: Date
  capabilities: DeviceCapability[]
  patientId?: string
  organizationId: string
}

export type DeviceType = 
  | 'smart_scale'      // Balança inteligente
  | 'blood_pressure'   // Medidor de pressão
  | 'heart_rate'       // Monitor de frequência cardíaca
  | 'smartwatch'       // Smartwatch
  | 'thermometer'      // Termômetro
  | 'pulse_oximeter'   // Oxímetro de pulso
  | 'glucose_meter'    // Glicosímetro
  | 'spirometer'       // Espirômetro
  | 'goniometer'       // Goniômetro digital
  | 'dynamometer'      // Dinamômetro

export interface DeviceCapability {
  name: string
  type: 'measurement' | 'monitoring' | 'exercise' | 'assessment'
  unit: string
  minValue?: number
  maxValue?: number
  accuracy?: number
  description: string
}

export interface DeviceReading {
  id: string
  deviceId: string
  patientId: string
  capability: string
  value: number
  unit: string
  timestamp: Date
  quality: 'excellent' | 'good' | 'fair' | 'poor'
  metadata?: Record<string, any>
}

export interface DeviceCommand {
  id: string
  deviceId: string
  command: string
  parameters?: Record<string, any>
  timestamp: Date
  status: 'pending' | 'sent' | 'completed' | 'failed'
  result?: any
}

class IoTDeviceManager {
  private devices: Map<string, IoTDevice> = new Map()
  private readings: DeviceReading[] = []
  private commands: DeviceCommand[] = []

  /**
   * Registrar novo dispositivo
   */
  async registerDevice(device: Omit<IoTDevice, 'id' | 'lastSeen'>): Promise<IoTDevice> {
    const deviceId = this.generateDeviceId(device)
    
    const newDevice: IoTDevice = {
      ...device,
      id: deviceId,
      lastSeen: new Date(),
      isConnected: false
    }

    this.devices.set(deviceId, newDevice)
    
    logger.info('Device registered', {
      deviceId,
      type: device.type,
      manufacturer: device.manufacturer,
      model: device.model
    })

    return newDevice
  }

  /**
   * Conectar dispositivo
   */
  async connectDevice(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId)
    if (!device) {
      throw new Error(`Device ${deviceId} not found`)
    }

    try {
      // Simular processo de conexão
      await this.performDeviceConnection(device)
      
      device.isConnected = true
      device.lastSeen = new Date()
      
      logger.info('Device connected', { deviceId, type: device.type })
      
      // Notificar sistema de monitoramento
      await this.notifyDeviceConnection(device, true)
      
      return true
    } catch (error) {
      logger.error('Failed to connect device', { deviceId }, error as Error)
      return false
    }
  }

  /**
   * Desconectar dispositivo
   */
  async disconnectDevice(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId)
    if (!device) {
      throw new Error(`Device ${deviceId} not found`)
    }

    try {
      // Simular processo de desconexão
      await this.performDeviceDisconnection(device)
      
      device.isConnected = false
      device.lastSeen = new Date()
      
      logger.info('Device disconnected', { deviceId, type: device.type })
      
      // Notificar sistema de monitoramento
      await this.notifyDeviceConnection(device, false)
      
      return true
    } catch (error) {
      logger.error('Failed to disconnect device', { deviceId }, error as Error)
      return false
    }
  }

  /**
   * Enviar comando para dispositivo
   */
  async sendCommand(
    deviceId: string, 
    command: string, 
    parameters?: Record<string, any>
  ): Promise<DeviceCommand> {
    const device = this.devices.get(deviceId)
    if (!device) {
      throw new Error(`Device ${deviceId} not found`)
    }

    if (!device.isConnected) {
      throw new Error(`Device ${deviceId} is not connected`)
    }

    const deviceCommand: DeviceCommand = {
      id: this.generateCommandId(),
      deviceId,
      command,
      parameters,
      timestamp: new Date(),
      status: 'pending'
    }

    this.commands.push(deviceCommand)

    try {
      // Simular envio de comando
      await this.performDeviceCommand(device, command, parameters)
      
      deviceCommand.status = 'sent'
      device.lastSeen = new Date()
      
      logger.info('Command sent to device', {
        commandId: deviceCommand.id,
        deviceId,
        command,
        parameters
      })
      
      return deviceCommand
    } catch (error) {
      deviceCommand.status = 'failed'
      deviceCommand.result = error instanceof Error ? error.message : 'Unknown error'
      
      logger.error('Failed to send command to device', {
        commandId: deviceCommand.id,
        deviceId,
        command
      }, error as Error)
      
      return deviceCommand
    }
  }

  /**
   * Receber leitura de dispositivo
   */
  async receiveReading(
    deviceId: string,
    capability: string,
    value: number,
    unit: string,
    patientId: string,
    metadata?: Record<string, any>
  ): Promise<DeviceReading> {
    const device = this.devices.get(deviceId)
    if (!device) {
      throw new Error(`Device ${deviceId} not found`)
    }

    // Validar capacidade do dispositivo
    const deviceCapability = device.capabilities.find(cap => cap.name === capability)
    if (!deviceCapability) {
      throw new Error(`Device ${deviceId} does not support capability ${capability}`)
    }

    // Validar valor
    const quality = this.assessReadingQuality(deviceCapability, value)
    
    const reading: DeviceReading = {
      id: this.generateReadingId(),
      deviceId,
      patientId,
      capability,
      value,
      unit,
      timestamp: new Date(),
      quality,
      metadata
    }

    this.readings.push(reading)
    device.lastSeen = new Date()

    logger.info('Reading received from device', {
      readingId: reading.id,
      deviceId,
      capability,
      value,
      unit,
      quality
    })

    // Processar leitura automaticamente
    await this.processReading(reading)

    return reading
  }

  /**
   * Obter dispositivos de um paciente
   */
  getPatientDevices(patientId: string): IoTDevice[] {
    return Array.from(this.devices.values()).filter(
      device => device.patientId === patientId
    )
  }

  /**
   * Obter leituras de um paciente
   */
  getPatientReadings(
    patientId: string, 
    capability?: string, 
    startDate?: Date, 
    endDate?: Date
  ): DeviceReading[] {
    let filteredReadings = this.readings.filter(reading => reading.patientId === patientId)

    if (capability) {
      filteredReadings = filteredReadings.filter(reading => reading.capability === capability)
    }

    if (startDate) {
      filteredReadings = filteredReadings.filter(reading => reading.timestamp >= startDate)
    }

    if (endDate) {
      filteredReadings = filteredReadings.filter(reading => reading.timestamp <= endDate)
    }

    return filteredReadings.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Obter estatísticas de dispositivo
   */
  getDeviceStats(deviceId: string): {
    totalReadings: number
    averageQuality: number
    lastReading?: DeviceReading
    uptime: number
    batteryLevel?: number
  } {
    const device = this.devices.get(deviceId)
    if (!device) {
      throw new Error(`Device ${deviceId} not found`)
    }

    const deviceReadings = this.readings.filter(reading => reading.deviceId === deviceId)
    
    const qualityScores = {
      excellent: 4,
      good: 3,
      fair: 2,
      poor: 1
    }

    const averageQuality = deviceReadings.length > 0
      ? deviceReadings.reduce((sum, reading) => sum + qualityScores[reading.quality], 0) / deviceReadings.length
      : 0

    const lastReading = deviceReadings.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
    
    const uptime = device.isConnected 
      ? Date.now() - device.lastSeen.getTime()
      : 0

    return {
      totalReadings: deviceReadings.length,
      averageQuality,
      lastReading,
      uptime,
      batteryLevel: device.batteryLevel
    }
  }

  // Métodos privados

  private generateDeviceId(device: any): string {
    return `device_${device.type}_${device.serialNumber}_${Date.now()}`
  }

  private generateReadingId(): string {
    return `reading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async performDeviceConnection(device: IoTDevice): Promise<void> {
    // Simular processo de conexão baseado no tipo de dispositivo
    switch (device.type) {
      case 'smart_scale':
        // Simular conexão Bluetooth para balança
        await this.simulateBluetoothConnection(device)
        break
      case 'smartwatch':
        // Simular conexão WiFi para smartwatch
        await this.simulateWifiConnection(device)
        break
      default:
        // Simular conexão genérica
        await this.simulateGenericConnection(device)
    }
  }

  private async performDeviceDisconnection(device: IoTDevice): Promise<void> {
    // Simular processo de desconexão
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  private async performDeviceCommand(
    device: IoTDevice, 
    command: string, 
    parameters?: Record<string, any>
  ): Promise<void> {
    // Simular execução de comando
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  private assessReadingQuality(capability: DeviceCapability, value: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (!capability.minValue || !capability.maxValue) {
      return 'good'
    }

    const range = capability.maxValue - capability.minValue
    const normalizedValue = (value - capability.minValue) / range

    if (normalizedValue >= 0.1 && normalizedValue <= 0.9) {
      return 'excellent'
    } else if (normalizedValue >= 0.05 && normalizedValue <= 0.95) {
      return 'good'
    } else if (normalizedValue >= 0 && normalizedValue <= 1) {
      return 'fair'
    } else {
      return 'poor'
    }
  }

  private async processReading(reading: DeviceReading): Promise<void> {
    // Processar leitura automaticamente
    // - Validar se está dentro dos parâmetros normais
    // - Detectar anomalias
    // - Atualizar métricas do paciente
    // - Enviar alertas se necessário

    logger.info('Processing reading', {
      readingId: reading.id,
      capability: reading.capability,
      value: reading.value,
      quality: reading.quality
    })
  }

  private async notifyDeviceConnection(device: IoTDevice, connected: boolean): Promise<void> {
    // Notificar sistema de monitoramento sobre mudança de status
    logger.info('Device connection status changed', {
      deviceId: device.id,
      type: device.type,
      connected,
      patientId: device.patientId
    })
  }

  private async simulateBluetoothConnection(device: IoTDevice): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  private async simulateWifiConnection(device: IoTDevice): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  private async simulateGenericConnection(device: IoTDevice): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

// Instância global do gerenciador
export const iotDeviceManager = new IoTDeviceManager()
