/**
 * Accessibility Utilities
 * ARIA helpers and accessibility improvements for healthcare UI
 */

// ARIA live region announcements
class AriaLiveRegion {
  private liveRegion: HTMLElement | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeLiveRegion()
    }
  }

  private initializeLiveRegion() {
    // Create live region for screen reader announcements
    this.liveRegion = document.createElement('div')
    this.liveRegion.setAttribute('aria-live', 'polite')
    this.liveRegion.setAttribute('aria-atomic', 'true')
    this.liveRegion.setAttribute('aria-relevant', 'all')
    this.liveRegion.style.position = 'absolute'
    this.liveRegion.style.left = '-10000px'
    this.liveRegion.style.width = '1px'
    this.liveRegion.style.height = '1px'
    this.liveRegion.style.overflow = 'hidden'

    document.body.appendChild(this.liveRegion)
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.liveRegion) return

    this.liveRegion.setAttribute('aria-live', priority)
    this.liveRegion.textContent = message

    // Clear after announcement
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = ''
      }
    }, 1000)
  }
}

// Singleton instance
export const ariaLiveRegion = new AriaLiveRegion()

// Accessibility utilities
export const a11yUtils = {
  // Generate unique IDs for form associations
  generateId: (prefix: string = 'element'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  },

  // Announce form validation errors
  announceFormError: (fieldName: string, error: string) => {
    ariaLiveRegion.announce(
      `Erro no campo ${fieldName}: ${error}`,
      'assertive'
    )
  },

  // Announce successful actions
  announceSuccess: (message: string) => {
    ariaLiveRegion.announce(`Sucesso: ${message}`, 'polite')
  },

  // Announce page navigation
  announceNavigation: (pageName: string) => {
    ariaLiveRegion.announce(`Navegando para ${pageName}`, 'polite')
  },

  // Announce data loading states
  announceLoading: (context: string) => {
    ariaLiveRegion.announce(`Carregando ${context}...`, 'polite')
  },

  announceLoaded: (context: string, count?: number) => {
    const message = count !== undefined
      ? `${context} carregado. ${count} itens encontrados.`
      : `${context} carregado com sucesso.`

    ariaLiveRegion.announce(message, 'polite')
  }
}

// Keyboard navigation utilities
export const keyboardUtils = {
  // Trap focus within a container (for modals)
  trapFocus: (container: HTMLElement): (() => void) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Find close button or trigger escape handler
        const closeButton = container.querySelector('[data-close]') as HTMLElement
        if (closeButton) {
          closeButton.click()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    container.addEventListener('keydown', handleEscapeKey)

    // Focus first element
    if (firstElement) {
      firstElement.focus()
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey)
      container.removeEventListener('keydown', handleEscapeKey)
    }
  },

  // Enhanced skip link functionality
  createSkipLink: (targetId: string, text: string): HTMLElement => {
    const skipLink = document.createElement('a')
    skipLink.href = `#${targetId}`
    skipLink.textContent = text
    skipLink.className = 'skip-link'
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 9999;
      border-radius: 4px;
    `

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px'
    })

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px'
    })

    return skipLink
  }
}

// Color contrast utilities
export const contrastUtils = {
  // Calculate relative luminance
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  },

  // Calculate contrast ratio
  getContrastRatio: (color1: string, color2: string): number => {
    const rgb1 = contrastUtils.hexToRgb(color1)
    const rgb2 = contrastUtils.hexToRgb(color2)

    if (!rgb1 || !rgb2) return 1

    const lum1 = contrastUtils.getLuminance(rgb1.r, rgb1.g, rgb1.b)
    const lum2 = contrastUtils.getLuminance(rgb2.r, rgb2.g, rgb2.b)

    const lightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)

    return (lightest + 0.05) / (darkest + 0.05)
  },

  // Convert hex to RGB
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  },

  // Check WCAG compliance
  isWCAGCompliant: (contrast: number, level: 'AA' | 'AAA' = 'AA'): boolean => {
    const thresholds = {
      AA: 4.5,
      AAA: 7
    }

    return contrast >= thresholds[level]
  }
}

// Medical form accessibility helpers
export const medicalFormA11y = {
  // Generate accessible error messages for medical fields
  getFieldErrorMessage: (field: string, error: string): string => {
    const medicalFieldLabels: Record<string, string> = {
      cpf: 'CPF',
      cns: 'Cartão Nacional de Saúde',
      crefito: 'Número CREFITO',
      blood_pressure: 'Pressão Arterial',
      heart_rate: 'Frequência Cardíaca',
      pain_scale: 'Escala de Dor',
      date_of_birth: 'Data de Nascimento',
      emergency_contact: 'Contato de Emergência'
    }

    const label = medicalFieldLabels[field] || field
    return `${label}: ${error}`
  },

  // Generate ARIA descriptions for medical inputs
  getMedicalFieldDescription: (field: string): string => {
    const descriptions: Record<string, string> = {
      cpf: 'Digite o CPF no formato 000.000.000-00',
      cns: 'Número do Cartão Nacional de Saúde com 15 dígitos',
      crefito: 'Número de registro no Conselho Regional de Fisioterapia',
      pain_scale: 'Escala de 0 a 10, onde 0 é sem dor e 10 é dor máxima',
      blood_pressure: 'Formato: sistólica/diastólica (ex: 120/80)',
      heart_rate: 'Frequência cardíaca em batimentos por minuto',
      emergency_contact: 'Telefone de contato em caso de emergência'
    }

    return descriptions[field] || ''
  },

  // Generate accessible labels for patient data
  getPatientDataLabel: (field: string, value: string): string => {
    const labels: Record<string, string> = {
      gender: value === 'masculino' ? 'Sexo: Masculino' : 'Sexo: Feminino',
      status: `Status do paciente: ${value}`,
      pain_level: `Nível de dor: ${value} de 10`,
      mobility: `Mobilidade: ${value}`
    }

    return labels[field] || `${field}: ${value}`
  }
}

// Screen reader optimizations
export const screenReaderUtils = {
  // Hide decorative elements from screen readers
  hideFromScreenReader: (element: HTMLElement) => {
    element.setAttribute('aria-hidden', 'true')
  },

  // Mark element as presentation only
  markAsPresentation: (element: HTMLElement) => {
    element.setAttribute('role', 'presentation')
  },

  // Add screen reader only text
  addScreenReaderOnlyText: (text: string): HTMLElement => {
    const span = document.createElement('span')
    span.textContent = text
    span.className = 'sr-only'
    span.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    `
    return span
  },

  // Enhanced table accessibility
  enhanceTableAccessibility: (table: HTMLTableElement) => {
    // Add table caption if missing
    if (!table.caption) {
      const caption = table.createCaption()
      caption.textContent = 'Tabela de dados médicos'
    }

    // Add scope to headers
    const headers = table.querySelectorAll('th')
    headers.forEach(header => {
      if (!header.getAttribute('scope')) {
        const cellIndex = (header as HTMLTableCellElement).cellIndex
        header.setAttribute('scope', cellIndex === 0 ? 'row' : 'col')
      }
    })

    // Add ARIA labels to data cells if needed
    const rows = table.querySelectorAll('tbody tr')
    rows.forEach((row, index) => {
      row.setAttribute('aria-rowindex', (index + 2).toString()) // +2 for header row
    })
  }
}