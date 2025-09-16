/**
 * Brazilian Currency Formatting Utilities
 * Handles Real (R$) currency formatting and financial operations
 */

// Brazilian currency configuration
export const BRAZILIAN_CURRENCY = {
  code: 'BRL',
  symbol: 'R$',
  name: 'Real Brasileiro',
  locale: 'pt-BR',
  precision: 2,
  thousands: '.',
  decimal: ','
} as const

// Payment method labels in Portuguese
export const PAYMENT_METHODS = {
  CASH: 'Dinheiro',
  DEBIT_CARD: 'Cartão de Débito',
  CREDIT_CARD: 'Cartão de Crédito',
  PIX: 'PIX',
  BANK_TRANSFER: 'Transferência Bancária',
  BANK_SLIP: 'Boleto Bancário',
  FINANCING: 'Financiamento',
  INSURANCE: 'Convênio/Plano de Saúde',
  CHECK: 'Cheque'
} as const

// Installment periods in Portuguese
export const INSTALLMENT_PERIODS = {
  1: 'à vista',
  2: 'em 2x',
  3: 'em 3x',
  4: 'em 4x',
  5: 'em 5x',
  6: 'em 6x',
  7: 'em 7x',
  8: 'em 8x',
  9: 'em 9x',
  10: 'em 10x',
  11: 'em 11x',
  12: 'em 12x'
} as const

/**
 * Format currency value in Brazilian Real format
 */
export function formatCurrency(
  value: number | string,
  options?: {
    showSymbol?: boolean
    precision?: number
    compact?: boolean
  }
): string {
  const {
    showSymbol = true,
    precision = 2,
    compact = false
  } = options || {}

  const numericValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numericValue)) {
    return showSymbol ? 'R$ 0,00' : '0,00'
  }

  try {
    if (compact && Math.abs(numericValue) >= 1000000) {
      const millions = numericValue / 1000000
      const formatted = millions.toLocaleString(BRAZILIAN_CURRENCY.locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })
      return showSymbol ? `R$ ${formatted}M` : `${formatted}M`
    }

    if (compact && Math.abs(numericValue) >= 1000) {
      const thousands = numericValue / 1000
      const formatted = thousands.toLocaleString(BRAZILIAN_CURRENCY.locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })
      return showSymbol ? `R$ ${formatted}K` : `${formatted}K`
    }

    const formatted = numericValue.toLocaleString(BRAZILIAN_CURRENCY.locale, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    })

    return showSymbol ? `R$ ${formatted}` : formatted
  } catch (error) {
    console.error('Error formatting currency:', error)
    return showSymbol ? 'R$ 0,00' : '0,00'
  }
}

/**
 * Parse Brazilian currency string to number
 */
export function parseCurrency(currencyString: string): number {
  if (!currencyString) return 0

  // Remove currency symbol and normalize
  const cleaned = currencyString
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '') // Remove thousands separator
    .replace(/,/g, '.') // Convert decimal separator
    .trim()

  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Format currency input (for form fields)
 */
export function formatCurrencyInput(value: string): string {
  // Remove all non-numeric characters except comma and dot
  const cleaned = value.replace(/[^\d,]/g, '')

  // Convert to number for formatting
  const numericValue = parseCurrency(cleaned) / 100

  return formatCurrency(numericValue, { showSymbol: false })
}

/**
 * Format percentage in Brazilian format
 */
export function formatPercentage(
  value: number,
  precision: number = 2
): string {
  return `${value.toLocaleString(BRAZILIAN_CURRENCY.locale, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  })}%`
}

/**
 * Calculate installment value
 */
export function calculateInstallment(
  totalValue: number,
  installments: number,
  interestRate: number = 0
): {
  installmentValue: number
  totalValue: number
  totalInterest: number
} {
  if (installments <= 1 || interestRate === 0) {
    return {
      installmentValue: totalValue,
      totalValue,
      totalInterest: 0
    }
  }

  const monthlyRate = interestRate / 100 / 12
  const factor = Math.pow(1 + monthlyRate, installments)
  const installmentValue = totalValue * (monthlyRate * factor) / (factor - 1)
  const finalTotalValue = installmentValue * installments
  const totalInterest = finalTotalValue - totalValue

  return {
    installmentValue: Math.round(installmentValue * 100) / 100,
    totalValue: Math.round(finalTotalValue * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100
  }
}

/**
 * Format installment display
 */
export function formatInstallment(
  installmentValue: number,
  installments: number,
  totalValue?: number
): string {
  const installmentText = INSTALLMENT_PERIODS[installments as keyof typeof INSTALLMENT_PERIODS] || `em ${installments}x`
  const formattedInstallment = formatCurrency(installmentValue)

  if (totalValue && installments > 1) {
    const formattedTotal = formatCurrency(totalValue)
    return `${installmentText} de ${formattedInstallment} (total: ${formattedTotal})`
  }

  return `${installmentText} de ${formattedInstallment}`
}

/**
 * Format payment method display
 */
export function formatPaymentMethod(
  method: keyof typeof PAYMENT_METHODS,
  installments?: number,
  value?: number
): string {
  const methodName = PAYMENT_METHODS[method]

  if (installments && installments > 1 && value) {
    const installmentInfo = formatInstallment(value / installments, installments, value)
    return `${methodName} - ${installmentInfo}`
  }

  return methodName
}

/**
 * Calculate discount or surcharge
 */
export function calculatePriceAdjustment(
  baseValue: number,
  percentage: number,
  isDiscount: boolean = true
): {
  adjustmentValue: number
  finalValue: number
  percentage: number
} {
  const adjustmentValue = baseValue * (percentage / 100)
  const finalValue = isDiscount ? baseValue - adjustmentValue : baseValue + adjustmentValue

  return {
    adjustmentValue: Math.round(adjustmentValue * 100) / 100,
    finalValue: Math.round(finalValue * 100) / 100,
    percentage
  }
}

/**
 * Format discount display
 */
export function formatDiscount(
  originalValue: number,
  discountPercentage: number
): string {
  const discount = calculatePriceAdjustment(originalValue, discountPercentage, true)
  const originalFormatted = formatCurrency(originalValue)
  const finalFormatted = formatCurrency(discount.finalValue)
  const discountFormatted = formatCurrency(discount.adjustmentValue)

  return `De ${originalFormatted} por ${finalFormatted} (desconto de ${discountFormatted} - ${formatPercentage(discountPercentage)})`
}

/**
 * Validate Brazilian currency input
 */
export function isValidCurrency(value: string | number): boolean {
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value) && value >= 0
  }

  const parsed = parseCurrency(value)
  return !isNaN(parsed) && isFinite(parsed) && parsed >= 0
}

/**
 * Healthcare-specific currency utilities
 */
export const HEALTHCARE_CURRENCY_UTILS = {
  /**
   * Format consultation fee
   */
  formatConsultationFee: (value: number, paymentMethod?: keyof typeof PAYMENT_METHODS): string => {
    const formatted = formatCurrency(value)

    if (paymentMethod) {
      const method = PAYMENT_METHODS[paymentMethod]
      return `${formatted} (${method})`
    }

    return formatted
  },

  /**
   * Format session package price
   */
  formatPackagePrice: (
    sessionPrice: number,
    sessionsCount: number,
    discountPercentage?: number
  ): string => {
    const totalPrice = sessionPrice * sessionsCount

    if (discountPercentage) {
      const discount = calculatePriceAdjustment(totalPrice, discountPercentage, true)
      return `${formatCurrency(discount.finalValue)} para ${sessionsCount} sessões (${formatPercentage(discountPercentage)} de desconto)`
    }

    return `${formatCurrency(totalPrice)} para ${sessionsCount} sessões`
  },

  /**
   * Format insurance copayment
   */
  formatCopayment: (consultationFee: number, copaymentValue: number): string => {
    const patientPays = formatCurrency(copaymentValue)
    const insurancePays = formatCurrency(consultationFee - copaymentValue)

    return `Paciente: ${patientPays} | Convênio: ${insurancePays}`
  },

  /**
   * Format outstanding balance
   */
  formatOutstandingBalance: (totalValue: number, paidValue: number): string => {
    const outstanding = totalValue - paidValue

    if (outstanding <= 0) {
      return 'Quitado'
    }

    const outstandingFormatted = formatCurrency(outstanding)
    const percentagePaid = (paidValue / totalValue) * 100

    return `Saldo devedor: ${outstandingFormatted} (${formatPercentage(100 - percentagePaid)} restante)`
  },

  /**
   * Format monthly revenue
   */
  formatMonthlyRevenue: (revenue: number, previousMonth?: number): string => {
    const formatted = formatCurrency(revenue, { compact: true })

    if (previousMonth !== undefined && previousMonth > 0) {
      const growth = ((revenue - previousMonth) / previousMonth) * 100
      const growthFormatted = formatPercentage(Math.abs(growth), 1)
      const trend = growth >= 0 ? 'aumento' : 'redução'

      return `${formatted} (${trend} de ${growthFormatted})`
    }

    return formatted
  }
} as const

/**
 * Currency input component helper
 */
export function createCurrencyMask() {
  return {
    mask: (value: string) => {
      const cleaned = value.replace(/\D/g, '')
      const number = parseFloat(cleaned) / 100

      if (isNaN(number)) return ''

      return formatCurrency(number, { showSymbol: false })
    },

    parse: (value: string) => {
      return parseCurrency(value)
    }
  }
}