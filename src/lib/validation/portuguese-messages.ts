/**
 * Portuguese Validation Error Messages
 * Comprehensive error messages for form validation in Brazilian Portuguese
 */

// General validation messages
export const VALIDATION_MESSAGES = {
  // Required fields
  required: "Este campo é obrigatório",
  requiredField: (field: string) => `${field} é obrigatório`,

  // String validations
  minLength: (min: number) => `Deve ter pelo menos ${min} caracteres`,
  maxLength: (max: number) => `Deve ter no máximo ${max} caracteres`,
  exactLength: (length: number) => `Deve ter exatamente ${length} caracteres`,

  // Number validations
  minValue: (min: number) => `Deve ser maior ou igual a ${min}`,
  maxValue: (max: number) => `Deve ser menor ou igual a ${max}`,
  positive: "Deve ser um número positivo",
  negative: "Deve ser um número negativo",
  integer: "Deve ser um número inteiro",
  decimal: "Deve ser um número decimal válido",

  // Format validations
  email: "Email inválido",
  url: "URL inválida",
  phone: "Telefone inválido",
  date: "Data inválida",
  time: "Hora inválida",

  // Pattern validations
  invalidPattern: "Formato inválido",
  onlyLetters: "Apenas letras são permitidas",
  onlyNumbers: "Apenas números são permitidos",
  alphanumeric: "Apenas letras e números são permitidos",

  // Confirmation validations
  passwordConfirmation: "As senhas não conferem",
  emailConfirmation: "Os emails não conferem",

  // File validations
  invalidFileType: "Tipo de arquivo não permitido",
  fileTooLarge: (size: string) => `Arquivo muito grande. Tamanho máximo: ${size}`,
  fileTooSmall: (size: string) => `Arquivo muito pequeno. Tamanho mínimo: ${size}`,

  // Array validations
  minItems: (min: number) => `Selecione pelo menos ${min} item${min !== 1 ? 's' : ''}`,
  maxItems: (max: number) => `Selecione no máximo ${max} item${max !== 1 ? 's' : ''}`,

  // Custom messages
  custom: (message: string) => message,
} as const

// Brazilian-specific validation messages
export const BRAZILIAN_VALIDATION_MESSAGES = {
  // CPF validation
  cpf: {
    invalid: "CPF inválido",
    required: "CPF é obrigatório",
    format: "CPF deve ter o formato 000.000.000-00",
    digits: "CPF deve conter apenas números",
    sequence: "CPF não pode ser uma sequência de números iguais",
    checkDigits: "Dígitos verificadores do CPF são inválidos"
  },

  // CNPJ validation
  cnpj: {
    invalid: "CNPJ inválido",
    required: "CNPJ é obrigatório",
    format: "CNPJ deve ter o formato 00.000.000/0000-00",
    digits: "CNPJ deve conter apenas números",
    checkDigits: "Dígitos verificadores do CNPJ são inválidos"
  },

  // Phone validation
  phone: {
    invalid: "Telefone inválido",
    required: "Telefone é obrigatório",
    mobile: "Número de celular inválido",
    landline: "Número de telefone fixo inválido",
    format: "Telefone deve ter o formato (11) 91234-5678",
    incompleteArea: "Código de área incompleto",
    incompleteNumber: "Número de telefone incompleto"
  },

  // CEP validation
  cep: {
    invalid: "CEP inválido",
    required: "CEP é obrigatório",
    format: "CEP deve ter o formato 00000-000",
    notFound: "CEP não encontrado",
    digits: "CEP deve conter apenas números"
  },

  // RG validation
  rg: {
    invalid: "RG inválido",
    required: "RG é obrigatório",
    format: "RG deve ter um formato válido"
  },

  // Brazilian date validation
  brazilianDate: {
    invalid: "Data inválida",
    required: "Data é obrigatória",
    format: "Data deve estar no formato DD/MM/AAAA",
    future: "Data não pode ser no futuro",
    past: "Data não pode ser no passado",
    minAge: (age: number) => `Idade mínima é ${age} anos`,
    maxAge: (age: number) => `Idade máxima é ${age} anos`,
    businessDay: "Data deve ser um dia útil",
    weekend: "Data deve ser um final de semana"
  },

  // Brazilian time validation
  brazilianTime: {
    invalid: "Horário inválido",
    required: "Horário é obrigatório",
    format: "Horário deve estar no formato HH:MM",
    businessHours: "Horário deve estar dentro do horário comercial",
    conflict: "Conflito de horário detectado"
  },

  // Currency validation
  currency: {
    invalid: "Valor monetário inválido",
    required: "Valor é obrigatório",
    format: "Valor deve estar no formato R$ 0,00",
    negative: "Valor não pode ser negativo",
    tooLow: (min: string) => `Valor mínimo é ${min}`,
    tooHigh: (max: string) => `Valor máximo é ${max}`,
    decimal: "Valor deve ter no máximo 2 casas decimais"
  },

  // Address validation
  address: {
    street: {
      required: "Logradouro é obrigatório",
      invalid: "Logradouro inválido"
    },
    number: {
      required: "Número é obrigatório",
      invalid: "Número inválido"
    },
    neighborhood: {
      required: "Bairro é obrigatório",
      invalid: "Bairro inválido"
    },
    city: {
      required: "Cidade é obrigatória",
      invalid: "Cidade inválida"
    },
    state: {
      required: "Estado é obrigatório",
      invalid: "Estado inválido",
      format: "Estado deve ter 2 letras (ex: SP)"
    }
  }
} as const

// Healthcare-specific validation messages
export const HEALTHCARE_VALIDATION_MESSAGES = {
  // Patient data
  patient: {
    name: {
      required: "Nome do paciente é obrigatório",
      minLength: "Nome deve ter pelo menos 2 caracteres",
      maxLength: "Nome deve ter no máximo 100 caracteres",
      onlyLetters: "Nome deve conter apenas letras e espaços"
    },
    birthDate: {
      required: "Data de nascimento é obrigatória",
      future: "Data de nascimento não pode ser no futuro",
      minAge: "Paciente deve ter pelo menos 1 ano",
      maxAge: "Paciente deve ter no máximo 120 anos"
    },
    gender: {
      required: "Sexo é obrigatório",
      invalid: "Sexo deve ser Masculino, Feminino ou Outro"
    },
    emergencyContact: {
      required: "Contato de emergência é obrigatório",
      phone: "Telefone de contato de emergência é obrigatório"
    },
    consent: {
      lgpd: "Consentimento LGPD é obrigatório",
      treatment: "Consentimento para tratamento é obrigatório",
      photos: "Consentimento para uso de imagens é obrigatório"
    }
  },

  // Appointment data
  appointment: {
    date: {
      required: "Data da consulta é obrigatória",
      past: "Data da consulta não pode ser no passado",
      businessDay: "Consultas só podem ser agendadas em dias úteis",
      withinHours: "Consultas devem ser agendadas dentro do horário de funcionamento"
    },
    time: {
      required: "Horário da consulta é obrigatório",
      conflict: "Já existe uma consulta agendada para este horário",
      businessHours: "Horário deve estar entre 07:00 e 18:00",
      duration: "Duração mínima da consulta é 30 minutos"
    },
    patient: {
      required: "Paciente é obrigatório",
      invalid: "Paciente selecionado é inválido"
    },
    therapist: {
      required: "Fisioterapeuta é obrigatório",
      invalid: "Fisioterapeuta selecionado é inválido",
      unavailable: "Fisioterapeuta não está disponível neste horário"
    },
    type: {
      required: "Tipo de consulta é obrigatório",
      invalid: "Tipo de consulta inválido"
    }
  },

  // Session data
  session: {
    patient: {
      required: "Paciente é obrigatório",
      invalid: "Paciente inválido"
    },
    therapist: {
      required: "Fisioterapeuta é obrigatório",
      invalid: "Fisioterapeuta inválido"
    },
    date: {
      required: "Data da sessão é obrigatória",
      future: "Data da sessão não pode ser no futuro"
    },
    duration: {
      required: "Duração da sessão é obrigatória",
      min: "Duração mínima é 15 minutos",
      max: "Duração máxima é 180 minutos"
    },
    evolution: {
      required: "Evolução da sessão é obrigatória",
      minLength: "Evolução deve ter pelo menos 10 caracteres"
    },
    painLevel: {
      required: "Nível de dor é obrigatório",
      range: "Nível de dor deve estar entre 0 e 10"
    }
  },

  // Exercise data
  exercise: {
    name: {
      required: "Nome do exercício é obrigatório",
      minLength: "Nome deve ter pelo menos 3 caracteres",
      maxLength: "Nome deve ter no máximo 100 caracteres"
    },
    description: {
      required: "Descrição do exercício é obrigatória",
      minLength: "Descrição deve ter pelo menos 10 caracteres"
    },
    category: {
      required: "Categoria é obrigatória",
      invalid: "Categoria inválida"
    },
    difficulty: {
      required: "Nível de dificuldade é obrigatório",
      range: "Dificuldade deve estar entre 1 e 5"
    },
    duration: {
      required: "Duração é obrigatória",
      min: "Duração mínima é 1 minuto",
      max: "Duração máxima é 60 minutos"
    },
    repetitions: {
      required: "Número de repetições é obrigatório",
      min: "Mínimo 1 repetição",
      max: "Máximo 100 repetições"
    },
    sets: {
      required: "Número de séries é obrigatório",
      min: "Mínimo 1 série",
      max: "Máximo 10 séries"
    }
  },

  // Payment data
  payment: {
    amount: {
      required: "Valor é obrigatório",
      positive: "Valor deve ser positivo",
      currency: "Valor deve estar no formato R$ 0,00"
    },
    method: {
      required: "Forma de pagamento é obrigatória",
      invalid: "Forma de pagamento inválida"
    },
    installments: {
      required: "Número de parcelas é obrigatório",
      min: "Mínimo 1 parcela",
      max: "Máximo 12 parcelas"
    },
    dueDate: {
      required: "Data de vencimento é obrigatória",
      past: "Data de vencimento não pode ser no passado"
    }
  },

  // Report data
  report: {
    type: {
      required: "Tipo de relatório é obrigatório",
      invalid: "Tipo de relatório inválido"
    },
    period: {
      required: "Período é obrigatório",
      startDate: "Data inicial é obrigatória",
      endDate: "Data final é obrigatória",
      invalidRange: "Data final deve ser posterior à data inicial",
      maxRange: "Período máximo é de 1 ano"
    },
    format: {
      required: "Formato é obrigatório",
      invalid: "Formato inválido (PDF, Excel ou CSV)"
    }
  }
} as const

// Professional validation messages
export const PROFESSIONAL_VALIDATION_MESSAGES = {
  // CREFITO (Physiotherapist license)
  crefito: {
    required: "Número do CREFITO é obrigatório",
    invalid: "Número do CREFITO inválido",
    format: "CREFITO deve ter o formato 000000-F/UF",
    expired: "CREFITO expirado",
    suspended: "CREFITO suspenso"
  },

  // Professional data
  professional: {
    specialty: {
      required: "Especialidade é obrigatória",
      invalid: "Especialidade inválida"
    },
    experience: {
      required: "Tempo de experiência é obrigatório",
      min: "Mínimo 0 anos de experiência",
      max: "Máximo 60 anos de experiência"
    },
    schedule: {
      required: "Horário de trabalho é obrigatório",
      conflict: "Conflito de horário com outro profissional",
      businessHours: "Horário deve estar dentro do funcionamento da clínica"
    }
  }
} as const

// Combine all messages for easy import
export const ALL_VALIDATION_MESSAGES = {
  ...VALIDATION_MESSAGES,
  brazilian: BRAZILIAN_VALIDATION_MESSAGES,
  healthcare: HEALTHCARE_VALIDATION_MESSAGES,
  professional: PROFESSIONAL_VALIDATION_MESSAGES
} as const

/**
 * Get localized error message
 */
export function getValidationMessage(
  key: string,
  params?: Record<string, any>
): string {
  // Navigate through nested keys (e.g., "brazilian.cpf.invalid")
  const keys = key.split('.')
  let message: any = ALL_VALIDATION_MESSAGES

  for (const k of keys) {
    message = message[k]
    if (!message) break
  }

  if (typeof message === 'function' && params) {
    return message(params)
  }

  if (typeof message === 'string') {
    return message
  }

  return 'Erro de validação'
}

/**
 * Format field name for error messages
 */
export function formatFieldName(fieldName: string): string {
  const fieldNames: Record<string, string> = {
    name: 'Nome',
    email: 'Email',
    phone: 'Telefone',
    cpf: 'CPF',
    cnpj: 'CNPJ',
    rg: 'RG',
    birthDate: 'Data de nascimento',
    address: 'Endereço',
    cep: 'CEP',
    city: 'Cidade',
    state: 'Estado',
    password: 'Senha',
    confirmPassword: 'Confirmação de senha',
    amount: 'Valor',
    date: 'Data',
    time: 'Horário',
    description: 'Descrição',
    notes: 'Observações'
  }

  return fieldNames[fieldName] || fieldName
}