/**
 * Brazilian Date and Time Formatting Utilities
 * Handles Brazilian locale formatting for dates, times, and related operations
 */

// Brazilian locale configuration
export const BRAZILIAN_LOCALE = 'pt-BR'
export const BRAZILIAN_TIMEZONE = 'America/Sao_Paulo'

// Common Brazilian date/time formats
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',          // 31/12/2023
  MEDIUM: 'dd/MM/yyyy HH:mm',   // 31/12/2023 14:30
  LONG: 'dd \'de\' MMMM \'de\' yyyy', // 31 de dezembro de 2023
  ISO: 'yyyy-MM-dd',            // 2023-12-31
  TIME_ONLY: 'HH:mm',           // 14:30
  TIME_WITH_SECONDS: 'HH:mm:ss', // 14:30:45
  DATETIME_FULL: 'dd/MM/yyyy \'às\' HH:mm', // 31/12/2023 às 14:30
} as const

// Month names in Portuguese
export const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
] as const

export const MONTHS_SHORT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez'
] as const

// Day names in Portuguese
export const WEEKDAYS = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado'
] as const

export const WEEKDAYS_SHORT = [
  'dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'
] as const

/**
 * Format date in Brazilian format
 */
export function formatBrazilianDate(
  date: Date | string | number,
  format: keyof typeof DATE_FORMATS = 'SHORT'
): string {
  const dateObj = new Date(date)

  if (isNaN(dateObj.getTime())) {
    return 'Data inválida'
  }

  try {
    switch (format) {
      case 'SHORT':
        return dateObj.toLocaleDateString(BRAZILIAN_LOCALE)

      case 'MEDIUM':
        return dateObj.toLocaleDateString(BRAZILIAN_LOCALE) + ' ' +
               dateObj.toLocaleTimeString(BRAZILIAN_LOCALE, {
                 hour: '2-digit',
                 minute: '2-digit'
               })

      case 'LONG':
        return dateObj.toLocaleDateString(BRAZILIAN_LOCALE, {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })

      case 'ISO':
        return dateObj.toISOString().split('T')[0]

      case 'TIME_ONLY':
        return dateObj.toLocaleTimeString(BRAZILIAN_LOCALE, {
          hour: '2-digit',
          minute: '2-digit'
        })

      case 'TIME_WITH_SECONDS':
        return dateObj.toLocaleTimeString(BRAZILIAN_LOCALE)

      case 'DATETIME_FULL':
        return `${dateObj.toLocaleDateString(BRAZILIAN_LOCALE)} às ${
          dateObj.toLocaleTimeString(BRAZILIAN_LOCALE, {
            hour: '2-digit',
            minute: '2-digit'
          })
        }`

      default:
        return dateObj.toLocaleDateString(BRAZILIAN_LOCALE)
    }
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Erro na formatação'
  }
}

/**
 * Format time in Brazilian format
 */
export function formatBrazilianTime(
  date: Date | string | number,
  includeSeconds: boolean = false
): string {
  const dateObj = new Date(date)

  if (isNaN(dateObj.getTime())) {
    return 'Hora inválida'
  }

  return dateObj.toLocaleTimeString(BRAZILIAN_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' })
  })
}

/**
 * Get relative time in Portuguese (e.g., "há 2 horas", "em 3 dias")
 */
export function getRelativeTime(date: Date | string | number): string {
  const dateObj = new Date(date)
  const now = new Date()
  const diffMs = dateObj.getTime() - now.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (Math.abs(diffMinutes) < 1) {
    return 'agora'
  }

  if (Math.abs(diffMinutes) < 60) {
    if (diffMinutes > 0) {
      return `em ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`
    } else {
      return `há ${Math.abs(diffMinutes)} minuto${Math.abs(diffMinutes) !== 1 ? 's' : ''}`
    }
  }

  if (Math.abs(diffHours) < 24) {
    if (diffHours > 0) {
      return `em ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
    } else {
      return `há ${Math.abs(diffHours)} hora${Math.abs(diffHours) !== 1 ? 's' : ''}`
    }
  }

  if (Math.abs(diffDays) < 7) {
    if (diffDays > 0) {
      return `em ${diffDays} dia${diffDays !== 1 ? 's' : ''}`
    } else {
      return `há ${Math.abs(diffDays)} dia${Math.abs(diffDays) !== 1 ? 's' : ''}`
    }
  }

  // For longer periods, use standard date format
  return formatBrazilianDate(dateObj)
}

/**
 * Calculate age in years from birth date
 */
export function calculateAge(birthDate: Date | string): number {
  const birth = new Date(birthDate)
  const today = new Date()

  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

/**
 * Format age with Portuguese text
 */
export function formatAge(birthDate: Date | string): string {
  const age = calculateAge(birthDate)
  return `${age} ano${age !== 1 ? 's' : ''}`
}

/**
 * Get day of week in Portuguese
 */
export function getDayOfWeek(date: Date | string, short: boolean = false): string {
  const dateObj = new Date(date)
  const dayIndex = dateObj.getDay()

  return short ? WEEKDAYS_SHORT[dayIndex] : WEEKDAYS[dayIndex]
}

/**
 * Get month name in Portuguese
 */
export function getMonthName(date: Date | string | number, short: boolean = false): string {
  const dateObj = new Date(date)
  const monthIndex = dateObj.getMonth()

  return short ? MONTHS_SHORT[monthIndex] : MONTHS[monthIndex]
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = new Date(date)
  const today = new Date()

  return dateObj.toDateString() === today.toDateString()
}

/**
 * Check if date is tomorrow
 */
export function isTomorrow(date: Date | string): boolean {
  const dateObj = new Date(date)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  return dateObj.toDateString() === tomorrow.toDateString()
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date | string): boolean {
  const dateObj = new Date(date)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  return dateObj.toDateString() === yesterday.toDateString()
}

/**
 * Format date with contextual information (hoje, ontem, amanhã)
 */
export function formatDateWithContext(date: Date | string): string {
  if (isToday(date)) {
    return `hoje, ${formatBrazilianTime(date)}`
  }

  if (isTomorrow(date)) {
    return `amanhã, ${formatBrazilianTime(date)}`
  }

  if (isYesterday(date)) {
    return `ontem, ${formatBrazilianTime(date)}`
  }

  return formatBrazilianDate(date, 'DATETIME_FULL')
}

/**
 * Parse Brazilian date string (DD/MM/YYYY) to Date object
 */
export function parseBrazilianDate(dateString: string): Date | null {
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  const match = dateString.match(regex)

  if (!match) {
    return null
  }

  const [, day, month, year] = match
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))

  // Validate the date
  if (date.getDate() !== parseInt(day) ||
      date.getMonth() !== parseInt(month) - 1 ||
      date.getFullYear() !== parseInt(year)) {
    return null
  }

  return date
}

/**
 * Get Brazilian timezone offset
 */
export function getBrazilianTimezone(): string {
  return BRAZILIAN_TIMEZONE
}

/**
 * Convert UTC to Brazilian time
 */
export function utcToBrazilianTime(utcDate: Date | string): Date {
  const date = new Date(utcDate)
  return new Date(date.toLocaleString("en-US", { timeZone: BRAZILIAN_TIMEZONE }))
}

/**
 * Format duration in Portuguese
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  let result = `${hours} hora${hours !== 1 ? 's' : ''}`

  if (remainingMinutes > 0) {
    result += ` e ${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`
  }

  return result
}

/**
 * Get business hours labels
 */
export const BUSINESS_HOURS = {
  MORNING: 'manhã',
  AFTERNOON: 'tarde',
  EVENING: 'noite',
  DAWN: 'madrugada'
} as const

/**
 * Get period of day in Portuguese
 */
export function getPeriodOfDay(date: Date | string): string {
  const dateObj = new Date(date)
  const hour = dateObj.getHours()

  if (hour >= 5 && hour < 12) {
    return BUSINESS_HOURS.MORNING
  } else if (hour >= 12 && hour < 18) {
    return BUSINESS_HOURS.AFTERNOON
  } else if (hour >= 18 && hour < 22) {
    return BUSINESS_HOURS.EVENING
  } else {
    return BUSINESS_HOURS.DAWN
  }
}

/**
 * Healthcare-specific date utilities
 */
export const HEALTHCARE_DATE_UTILS = {
  /**
   * Format appointment date
   */
  formatAppointmentDate: (date: Date | string): string => {
    return formatDateWithContext(date)
  },

  /**
   * Format session duration
   */
  formatSessionDuration: (startTime: Date | string, endTime: Date | string): string => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()
    const durationMinutes = Math.floor(durationMs / (1000 * 60))

    return formatDuration(durationMinutes)
  },

  /**
   * Get next appointment time
   */
  getNextAppointmentText: (date: Date | string): string => {
    const now = new Date()
    const appointmentDate = new Date(date)

    if (appointmentDate <= now) {
      return 'Consulta em andamento ou finalizada'
    }

    return `Próxima consulta: ${formatDateWithContext(appointmentDate)}`
  },

  /**
   * Format patient age for display
   */
  formatPatientAge: (birthDate: Date | string): string => {
    const age = calculateAge(birthDate)
    const birth = new Date(birthDate)
    const formattedBirthDate = formatBrazilianDate(birth)

    return `${age} anos (nascido em ${formattedBirthDate})`
  }
} as const

/**
 * Format CPF for display
 */
export function formatCPF(cpf: string): string {
  if (!cpf) return ''

  const cleaned = cpf.replace(/\D/g, '')

  if (cleaned.length !== 11) return cpf

  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Format CNPJ for display
 */
export function formatCNPJ(cnpj: string): string {
  if (!cnpj) return ''

  const cleaned = cnpj.replace(/\D/g, '')

  if (cleaned.length !== 14) return cnpj

  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

/**
 * Format Brazilian phone for display
 */
export function formatPhone(phone: string): string {
  if (!phone) return ''

  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 10) {
    // Landline: (11) 1234-5678
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  } else if (cleaned.length === 11) {
    // Mobile: (11) 91234-5678
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  return phone
}

/**
 * Format CEP for display
 */
export function formatCEP(cep: string): string {
  if (!cep) return ''

  const cleaned = cep.replace(/\D/g, '')

  if (cleaned.length !== 8) return cep

  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
}

/**
 * Alias for formatBrazilianDate with default SHORT format
 */
export function formatDate(date: Date | string | number): string {
  return formatBrazilianDate(date, 'SHORT')
}