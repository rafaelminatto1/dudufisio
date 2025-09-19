/**
 * Comprehensive Validation Schemas for FisioFlow
 * Uses Zod for runtime type checking and validation
 */

import { z } from 'zod'
import { validateCPF, validateCNPJ, validateBrazilianPhone } from './brazilian-validators'

// Common validation patterns
const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const cepRegex = /^\d{5}-\d{3}$/

// Custom validation functions
const isBrazilianPhone = (phone: string) => validateBrazilianPhone(phone)
const isCPF = (cpf: string) => validateCPF(cpf)
const isCNPJ = (cnpj: string) => validateCNPJ(cnpj)

// Brazilian specific validations
export const cpfSchema = z.string()
  .min(11, 'CPF deve ter 11 dígitos')
  .max(14, 'CPF inválido')
  .refine(isCPF, 'CPF inválido')

export const cnpjSchema = z.string()
  .min(14, 'CNPJ deve ter 14 dígitos')
  .max(18, 'CNPJ inválido')
  .refine(isCNPJ, 'CNPJ inválido')

export const phoneSchema = z.string()
  .min(10, 'Telefone deve ter pelo menos 10 dígitos')
  .max(15, 'Telefone muito longo')
  .refine(isBrazilianPhone, 'Formato de telefone inválido')

export const cepSchema = z.string()
  .regex(cepRegex, 'CEP deve estar no formato 00000-000')

// Basic field validations
export const emailSchema = z.string()
  .email('Email inválido')
  .min(1, 'Email é obrigatório')

export const nameSchema = z.string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome muito longo')
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')

export const passwordSchema = z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter ao menos uma letra minúscula, uma maiúscula e um número')

// Date validations
export const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
  .refine((date) => {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) && parsed.toISOString().split('T')[0] === date
  }, 'Data inválida')

export const futureeDateSchema = dateSchema
  .refine((date) => new Date(date) > new Date(), 'Data deve ser futura')

export const pastDateSchema = dateSchema
  .refine((date) => new Date(date) < new Date(), 'Data deve ser passada')

// Address schema
export const addressSchema = z.object({
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  postal_code: cepSchema
})

// User schemas
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: nameSchema,
  crefito_number: z.string().optional(),
  phone: phoneSchema.optional(),
  consent_lgpd: z.literal(true, {
    errorMap: () => ({ message: 'Você deve aceitar os termos da LGPD' })
  })
})

export const userUpdateSchema = z.object({
  full_name: nameSchema.optional(),
  phone: phoneSchema.optional(),
  crefito_number: z.string().optional(),
  avatar_url: z.string().url('URL de avatar inválida').optional()
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória')
})

// Patient schemas
export const patientSchema = z.object({
  name: nameSchema,
  cpf: cpfSchema,
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  date_of_birth: pastDateSchema,
  gender: z.enum(['M', 'F', 'O'], {
    errorMap: () => ({ message: 'Gênero deve ser M, F ou O' })
  }),
  address: addressSchema.optional(),
  emergency_contact_name: nameSchema.optional(),
  emergency_contact_phone: phoneSchema.optional(),
  medical_history: z.string().optional(),
  current_medications: z.string().optional(),
  allergies: z.string().optional(),
  consent_lgpd: z.literal(true)
})

export const patientUpdateSchema = patientSchema.partial().omit({ cpf: true, consent_lgpd: true })

// Appointment schemas
export const appointmentSchema = z.object({
  patient_id: z.string().uuid('ID do paciente inválido'),
  practitioner_id: z.string().uuid('ID do profissional inválido'),
  appointment_date: z.string().datetime('Data e hora inválida'),
  duration_minutes: z.number().min(15, 'Duração mínima de 15 minutos').max(240, 'Duração máxima de 4 horas'),
  appointment_type: z.enum(['consultation', 'therapy', 'follow_up', 'assessment']),
  notes: z.string().optional(),
  room: z.string().optional()
})

export const appointmentUpdateSchema = appointmentSchema.partial()

export const rescheduleSchema = z.object({
  appointment_id: z.string().uuid('ID do agendamento inválido'),
  new_date: z.string().datetime('Nova data e hora inválida'),
  reason: z.string().optional(),
  notify_patient: z.boolean().default(true)
})

// Session/Treatment schemas
export const sessionSchema = z.object({
  appointment_id: z.string().uuid('ID do agendamento inválido'),
  treatment_type: z.string().min(1, 'Tipo de tratamento é obrigatório'),
  techniques_used: z.array(z.string()).min(1, 'Pelo menos uma técnica deve ser selecionada'),
  session_notes: z.string().optional(),
  pain_level_before: z.number().min(0).max(10),
  pain_level_after: z.number().min(0).max(10),
  patient_response: z.enum(['excellent', 'good', 'fair', 'poor']),
  homework_exercises: z.string().optional(),
  next_session_recommendations: z.string().optional()
})

// Pain tracking schemas
export const painPointSchema = z.object({
  patient_id: z.string().uuid('ID do paciente inválido'),
  session_id: z.string().uuid('ID da sessão inválido').optional(),
  body_region: z.string().min(1, 'Região do corpo é obrigatória'),
  pain_level: z.number().min(0, 'Nível mínimo é 0').max(10, 'Nível máximo é 10'),
  pain_type: z.enum(['sharp', 'dull', 'burning', 'tingling', 'cramping', 'other']),
  pain_description: z.string().optional(),
  coordinates_x: z.number().min(0).max(100),
  coordinates_y: z.number().min(0).max(100),
  date_recorded: z.string().datetime('Data de registro inválida')
})

// Exercise schemas
export const exerciseSchema = z.object({
  name: z.string().min(1, 'Nome do exercício é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  duration_minutes: z.number().min(1, 'Duração mínima de 1 minuto').optional(),
  repetitions: z.number().min(1, 'Mínimo 1 repetição').optional(),
  sets: z.number().min(1, 'Mínimo 1 série').optional(),
  equipment_needed: z.array(z.string()).optional(),
  video_url: z.string().url('URL do vídeo inválida').optional(),
  image_url: z.string().url('URL da imagem inválida').optional(),
  contraindications: z.string().optional(),
  benefits: z.string().optional()
})

// Prescription schemas
export const prescriptionSchema = z.object({
  patient_id: z.string().uuid('ID do paciente inválido'),
  prescribed_by: z.string().uuid('ID do profissional inválido'),
  exercises: z.array(z.object({
    exercise_id: z.string().uuid('ID do exercício inválido'),
    sets: z.number().min(1),
    repetitions: z.number().min(1),
    frequency_per_week: z.number().min(1).max(7),
    special_instructions: z.string().optional()
  })).min(1, 'Pelo menos um exercício deve ser prescrito'),
  start_date: dateSchema,
  end_date: futureeDateSchema,
  general_instructions: z.string().optional()
})

// Organization schemas
export const organizationSchema = z.object({
  name: z.string().min(1, 'Nome da organização é obrigatório'),
  cnpj: cnpjSchema.optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  address: addressSchema.optional(),
  specialties: z.array(z.string()).optional(),
  operating_hours: z.string().optional()
})

// LGPD compliance schemas
export const dataExportRequestSchema = z.object({
  data_types: z.array(z.enum(['personal', 'medical', 'sessions', 'appointments', 'all']))
    .min(1, 'Pelo menos um tipo de dado deve ser selecionado'),
  format: z.enum(['json', 'pdf', 'csv']).default('json'),
  reason: z.string().optional()
})

export const dataDeletionRequestSchema = z.object({
  request_type: z.enum(['full_deletion', 'partial_deletion', 'anonymization']),
  reason: z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres'),
  data_types: z.array(z.string()).optional(),
  confirmation: z.literal(true, {
    errorMap: () => ({ message: 'Você deve confirmar a solicitação de exclusão' })
  })
})

// Search and filter schemas
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc')
})

export const patientSearchSchema = paginationSchema.extend({
  search: z.string().optional(),
  active_only: z.boolean().default(true),
  date_from: dateSchema.optional(),
  date_to: dateSchema.optional()
})

export const appointmentSearchSchema = paginationSchema.extend({
  patient_id: z.string().uuid().optional(),
  practitioner_id: z.string().uuid().optional(),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  date_from: dateSchema.optional(),
  date_to: dateSchema.optional()
})

// Error response schema for consistency
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    timestamp: z.string(),
    requestId: z.string().optional()
  })
})

// Success response schema
export const successResponseSchema = <T>(dataSchema: z.ZodType<T>) => z.object({
  success: z.literal(true),
  data: dataSchema,
  message: z.string().optional()
})

export type PatientSchema = z.infer<typeof patientSchema>
export type AppointmentSchema = z.infer<typeof appointmentSchema>
export type SessionSchema = z.infer<typeof sessionSchema>
export type UserRegistrationSchema = z.infer<typeof userRegistrationSchema>
export type UserUpdateSchema = z.infer<typeof userUpdateSchema>
export type LoginSchema = z.infer<typeof loginSchema>