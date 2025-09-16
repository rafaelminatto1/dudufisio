/**
 * Supabase Client Configuration
 * Configuração do cliente Supabase para FisioFlow
 * Inclui configurações de autenticação, RLS e tipos TypeScript
 */

import { createBrowserClient } from '@supabase/ssr'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'
import type { Database } from './database.types'

/**
 * Cliente Supabase para componentes do navegador
 * Usado em Client Components
 */
export const createClient = () =>
  createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        headers: {
          'X-Client-Info': 'fisioflow-web@1.0.0',
        },
      },
    }
  )

/**
 * Cliente Supabase para componentes do servidor
 * Usado em Server Components
 */
export const createServerClient = () => {
  return createServerComponentClient<Database>({
    cookies: async () => await cookies(),
  })
}

/**
 * Cliente Supabase para Route Handlers
 * Usado em API Routes
 */
export const createRouteClient = () => {
  return createRouteHandlerClient<Database>({
    cookies: async () => await cookies(),
  })
}

/**
 * Cliente Supabase com service role
 * Usado para operações administrativas que requerem bypass de RLS
 */
export const createServiceClient = () =>
  createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'fisioflow-service@1.0.0',
        },
      },
    }
  )

/**
 * Cliente Supabase padrão para uso geral
 * Singleton para evitar múltiplas instâncias
 */
let supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient()
  }
  return supabaseClient
}

/**
 * Tipos e interfaces para o cliente Supabase
 */
export type SupabaseClient = ReturnType<typeof createClient>
export type SupabaseServerClient = ReturnType<typeof createServerClient>
export type SupabaseRouteClient = ReturnType<typeof createRouteClient>
export type SupabaseServiceClient = ReturnType<typeof createServiceClient>

/**
 * Configurações de Real-time para diferentes recursos
 */
export const realtimeConfig = {
  appointments: {
    table: 'appointments',
    event: '*',
    schema: 'public',
  },
  patients: {
    table: 'patients',
    event: '*',
    schema: 'public',
  },
  sessions: {
    table: 'sessions',
    event: '*',
    schema: 'public',
  },
  pain_points: {
    table: 'pain_points',
    event: '*',
    schema: 'public',
  },
} as const

/**
 * Hook personalizado para subscription em tempo real
 */
export const createRealtimeSubscription = (
  client: SupabaseClient,
  config: typeof realtimeConfig[keyof typeof realtimeConfig],
  callback: (payload: any) => void
) => {
  const channel = client
    .channel(`${config.table}_changes`)
    .on(
      'postgres_changes',
      {
        event: config.event,
        schema: config.schema,
        table: config.table,
      },
      callback
    )
    .subscribe()

  return () => {
    client.removeChannel(channel)
  }
}

/**
 * Configurações de Storage
 */
export const storageConfig = {
  patientPhotos: {
    bucket: 'patient-photos',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  exerciseVideos: {
    bucket: 'exercise-videos',
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/avi'],
  },
  exerciseThumbnails: {
    bucket: 'exercise-thumbnails',
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  patientDocuments: {
    bucket: 'patient-documents',
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
    ],
  },
  clinicalReports: {
    bucket: 'clinical-reports',
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  orgLogos: {
    bucket: 'org-logos',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  },
  dataExports: {
    bucket: 'data-exports',
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['application/json', 'application/zip', 'text/csv', 'application/pdf'],
  },
} as const

/**
 * Utilitários para Storage
 */
export const uploadFile = async (
  client: SupabaseClient,
  bucket: keyof typeof storageConfig,
  path: string,
  file: File
) => {
  const config = storageConfig[bucket]

  // Validar tipo de arquivo
  if (!(config.allowedTypes as any).includes(file.type)) {
    throw new Error(`Tipo de arquivo não permitido: ${file.type}`)
  }

  // Validar tamanho do arquivo
  if (file.size > config.maxSize) {
    throw new Error(`Arquivo muito grande. Máximo: ${config.maxSize / (1024 * 1024)}MB`)
  }

  const { data, error } = await client.storage
    .from(config.bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Erro no upload: ${error.message}`)
  }

  return data
}

/**
 * Obter URL pública de arquivo
 */
export const getPublicUrl = (
  client: SupabaseClient,
  bucket: keyof typeof storageConfig,
  path: string
) => {
  const config = storageConfig[bucket]
  const { data } = client.storage.from(config.bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Obter URL assinada para arquivos privados
 */
export const getSignedUrl = async (
  client: SupabaseClient,
  bucket: keyof typeof storageConfig,
  path: string,
  expiresIn: number = 3600 // 1 hora por padrão
) => {
  const config = storageConfig[bucket]
  const { data, error } = await client.storage
    .from(config.bucket)
    .createSignedUrl(path, expiresIn)

  if (error) {
    throw new Error(`Erro ao gerar URL assinada: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * Deletar arquivo
 */
export const deleteFile = async (
  client: SupabaseClient,
  bucket: keyof typeof storageConfig,
  path: string
) => {
  const config = storageConfig[bucket]
  const { error } = await client.storage.from(config.bucket).remove([path])

  if (error) {
    throw new Error(`Erro ao deletar arquivo: ${error.message}`)
  }

  return true
}

/**
 * Configurações de error handling
 */
export const handleSupabaseError = (error: any) => {
  console.error('Erro Supabase:', error)

  // Erros específicos do PostgreSQL
  if (error.code === '23505') {
    return 'Este registro já existe no sistema'
  }

  if (error.code === '23503') {
    return 'Não é possível excluir este registro pois está sendo usado por outros dados'
  }

  if (error.code === '42501') {
    return 'Você não tem permissão para realizar esta ação'
  }

  // Erros de autenticação
  if (error.message?.includes('Invalid login credentials')) {
    return 'Credenciais de login inválidas'
  }

  if (error.message?.includes('Email not confirmed')) {
    return 'Email não confirmado. Verifique sua caixa de entrada'
  }

  // Erros de RLS
  if (error.message?.includes('row-level security')) {
    return 'Acesso negado a estes dados'
  }

  // Erros LGPD
  if (error.message?.includes('LGPD')) {
    return error.message
  }

  // Erro genérico
  return error.message || 'Ocorreu um erro inesperado'
}

/**
 * Configurações de retry para operações críticas
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      console.warn(`Tentativa ${attempt} falhou:`, error)

      if (attempt === maxRetries) {
        break
      }

      // Delay exponencial
      await new Promise((resolve) => setTimeout(resolve, delay * attempt))
    }
  }

  throw lastError!
}

export default getSupabaseClient