/**
 * Brazilian Validation Utilities
 * Custom validators for Brazilian documents, formats, and healthcare data
 */

import { z } from "zod"
import { BRAZILIAN_VALIDATION_MESSAGES } from "./portuguese-messages"

// CPF validation
export function validateCPF(cpf: string): boolean {
  if (!cpf) return false

  // Remove formatting
  const cleaned = cpf.replace(/[^\d]/g, '')

  // Check length
  if (cleaned.length !== 11) return false

  // Check for sequences like 11111111111
  if (/^(\d)\1{10}$/.test(cleaned)) return false

  // Calculate check digits
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let remainder = 11 - (sum % 11)
  const digit1 = remainder < 2 ? 0 : remainder

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  remainder = 11 - (sum % 11)
  const digit2 = remainder < 2 ? 0 : remainder

  return digit1 === parseInt(cleaned.charAt(9)) && digit2 === parseInt(cleaned.charAt(10))
}

// CNPJ validation
export function validateCNPJ(cnpj: string): boolean {
  if (!cnpj) return false

  const cleaned = cnpj.replace(/[^\d]/g, '')

  if (cleaned.length !== 14) return false

  // Check for sequences
  if (/^(\d)\1{13}$/.test(cleaned)) return false

  // Calculate check digits
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * (weights1[i] || 0)
  }
  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder

  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * (weights2[i] || 0)
  }
  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder

  return digit1 === parseInt(cleaned.charAt(12)) && digit2 === parseInt(cleaned.charAt(13))
}

// Brazilian phone validation
export function validateBrazilianPhone(phone: string): boolean {
  if (!phone) return false

  const cleaned = phone.replace(/[^\d]/g, '')

  // Mobile: 11 digits (with area code)
  // Landline: 10 digits (with area code)
  return cleaned.length === 10 || cleaned.length === 11
}

// CEP validation
export function validateCEP(cep: string): boolean {
  if (!cep) return false

  const cleaned = cep.replace(/[^\d]/g, '')
  return cleaned.length === 8
}

// Brazilian date validation (DD/MM/YYYY)
export function validateBrazilianDate(dateString: string): boolean {
  if (!dateString) return false

  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  const match = dateString.match(regex)

  if (!match) return false

  const [, day, month, year] = match
  const date = new Date(parseInt(year || '0'), parseInt(month || '0') - 1, parseInt(day || '0'))

  return date.getDate() === parseInt(day || '0') &&
         date.getMonth() === parseInt(month || '0') - 1 &&
         date.getFullYear() === parseInt(year || '0')
}

// Brazilian time validation (HH:MM)
export function validateBrazilianTime(timeString: string): boolean {
  if (!timeString) return false

  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  return regex.test(timeString)
}

// CREFITO validation (Physiotherapist license)
export function validateCREFITO(crefito: string): boolean {
  if (!crefito) return false

  // Format: 000000-F/UF (6 digits, check digit, state)
  const regex = /^\d{6}-[0-9]\/[A-Z]{2}$/
  return regex.test(crefito)
}

// Age validation
export function validateAge(birthDate: string | Date, minAge: number = 0, maxAge: number = 120): boolean {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const today = new Date()

  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age >= minAge && age <= maxAge
}

// Zod schemas with Portuguese error messages
export const BrazilianSchemas = {
  cpf: z.string()
    .min(1, BRAZILIAN_VALIDATION_MESSAGES.cpf.required)
    .refine(validateCPF, BRAZILIAN_VALIDATION_MESSAGES.cpf.invalid),

  cnpj: z.string()
    .min(1, BRAZILIAN_VALIDATION_MESSAGES.cnpj.required)
    .refine(validateCNPJ, BRAZILIAN_VALIDATION_MESSAGES.cnpj.invalid),

  phone: z.string()
    .min(1, BRAZILIAN_VALIDATION_MESSAGES.phone.required)
    .refine(validateBrazilianPhone, BRAZILIAN_VALIDATION_MESSAGES.phone.invalid),

  cep: z.string()
    .min(1, BRAZILIAN_VALIDATION_MESSAGES.cep.required)
    .refine(validateCEP, BRAZILIAN_VALIDATION_MESSAGES.cep.invalid),

  brazilianDate: z.string()
    .min(1, BRAZILIAN_VALIDATION_MESSAGES.brazilianDate.required)
    .refine(validateBrazilianDate, BRAZILIAN_VALIDATION_MESSAGES.brazilianDate.invalid),

  brazilianTime: z.string()
    .min(1, BRAZILIAN_VALIDATION_MESSAGES.brazilianTime.required)
    .refine(validateBrazilianTime, BRAZILIAN_VALIDATION_MESSAGES.brazilianTime.invalid),

  crefito: z.string()
    .min(1, "CREFITO é obrigatório")
    .refine(validateCREFITO, "CREFITO inválido"),

  currency: z.number()
    .min(0, BRAZILIAN_VALIDATION_MESSAGES.currency.negative),

  email: z.string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),

  name: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços"),

  password: z.string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Senha deve ter pelo menos uma letra minúscula, uma maiúscula e um número"),

  age: (minAge: number = 0, maxAge: number = 120) =>
    z.string()
      .refine(
        (date) => validateAge(date, minAge, maxAge),
        `Idade deve estar entre ${minAge} e ${maxAge} anos`
      )
}

// Healthcare-specific schemas
export const HealthcareSchemas = {
  patient: z.object({
    name: BrazilianSchemas.name,
    cpf: BrazilianSchemas.cpf,
    birthDate: BrazilianSchemas.age(1, 120),
    phone: BrazilianSchemas.phone,
    email: BrazilianSchemas.email.optional(),
    emergencyContact: z.string().min(1, "Contato de emergência é obrigatório"),
    emergencyPhone: BrazilianSchemas.phone,
    consentLGPD: z.boolean().refine(val => val, "Consentimento LGPD é obrigatório")
  }),

  appointment: z.object({
    patientId: z.string().min(1, "Paciente é obrigatório"),
    therapistId: z.string().min(1, "Fisioterapeuta é obrigatório"),
    date: z.date().min(new Date(), "Data não pode ser no passado"),
    duration: z.number().min(15, "Duração mínima é 15 minutos").max(180, "Duração máxima é 180 minutos"),
    type: z.string().min(1, "Tipo de consulta é obrigatório"),
    notes: z.string().optional()
  }),

  session: z.object({
    patientId: z.string().min(1, "Paciente é obrigatório"),
    therapistId: z.string().min(1, "Fisioterapeuta é obrigatório"),
    date: z.date().max(new Date(), "Data não pode ser no futuro"),
    duration: z.number().min(15, "Duração mínima é 15 minutos").max(180, "Duração máxima é 180 minutos"),
    evolution: z.string().min(10, "Evolução deve ter pelo menos 10 caracteres"),
    painLevel: z.number().min(0, "Nível de dor mínimo é 0").max(10, "Nível de dor máximo é 10"),
    exercises: z.array(z.string()).optional(),
    observations: z.string().optional()
  }),

  exercise: z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
    description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
    category: z.string().min(1, "Categoria é obrigatória"),
    difficulty: z.number().min(1, "Dificuldade mínima é 1").max(5, "Dificuldade máxima é 5"),
    duration: z.number().min(1, "Duração mínima é 1 minuto").max(60, "Duração máxima é 60 minutos"),
    repetitions: z.number().min(1, "Mínimo 1 repetição").max(100, "Máximo 100 repetições"),
    sets: z.number().min(1, "Mínimo 1 série").max(10, "Máximo 10 séries"),
    instructions: z.string().optional(),
    videoUrl: z.string().url("URL do vídeo inválida").optional()
  }),

  payment: z.object({
    amount: BrazilianSchemas.currency,
    method: z.string().min(1, "Forma de pagamento é obrigatória"),
    installments: z.number().min(1, "Mínimo 1 parcela").max(12, "Máximo 12 parcelas"),
    dueDate: z.date().min(new Date(), "Data de vencimento não pode ser no passado"),
    description: z.string().optional(),
    patientId: z.string().min(1, "Paciente é obrigatório")
  }),

  professional: z.object({
    name: BrazilianSchemas.name,
    cpf: BrazilianSchemas.cpf,
    crefito: BrazilianSchemas.crefito,
    email: BrazilianSchemas.email,
    phone: BrazilianSchemas.phone,
    specialty: z.string().min(1, "Especialidade é obrigatória"),
    experience: z.number().min(0, "Experiência mínima é 0 anos").max(60, "Experiência máxima é 60 anos"),
    schedule: z.object({
      monday: z.object({ start: BrazilianSchemas.brazilianTime, end: BrazilianSchemas.brazilianTime }).optional(),
      tuesday: z.object({ start: BrazilianSchemas.brazilianTime, end: BrazilianSchemas.brazilianTime }).optional(),
      wednesday: z.object({ start: BrazilianSchemas.brazilianTime, end: BrazilianSchemas.brazilianTime }).optional(),
      thursday: z.object({ start: BrazilianSchemas.brazilianTime, end: BrazilianSchemas.brazilianTime }).optional(),
      friday: z.object({ start: BrazilianSchemas.brazilianTime, end: BrazilianSchemas.brazilianTime }).optional(),
      saturday: z.object({ start: BrazilianSchemas.brazilianTime, end: BrazilianSchemas.brazilianTime }).optional(),
      sunday: z.object({ start: BrazilianSchemas.brazilianTime, end: BrazilianSchemas.brazilianTime }).optional()
    })
  })
}

// Address schema with CEP integration
export const BrazilianAddressSchema = z.object({
  cep: BrazilianSchemas.cep,
  street: z.string().min(1, BRAZILIAN_VALIDATION_MESSAGES.address.street.required),
  number: z.string().min(1, BRAZILIAN_VALIDATION_MESSAGES.address.number.required),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, BRAZILIAN_VALIDATION_MESSAGES.address.neighborhood.required),
  city: z.string().min(1, BRAZILIAN_VALIDATION_MESSAGES.address.city.required),
  state: z.string()
    .length(2, BRAZILIAN_VALIDATION_MESSAGES.address.state.format)
    .regex(/^[A-Z]{2}$/, BRAZILIAN_VALIDATION_MESSAGES.address.state.format)
})

export type PatientFormData = z.infer<typeof HealthcareSchemas.patient>
export type AppointmentFormData = z.infer<typeof HealthcareSchemas.appointment>
export type SessionFormData = z.infer<typeof HealthcareSchemas.session>
export type ExerciseFormData = z.infer<typeof HealthcareSchemas.exercise>
export type PaymentFormData = z.infer<typeof HealthcareSchemas.payment>
export type ProfessionalFormData = z.infer<typeof HealthcareSchemas.professional>
export type AddressFormData = z.infer<typeof BrazilianAddressSchema>