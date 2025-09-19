import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac'

// Schema for practitioner search parameters
const searchPractitionersSchema = z.object({
  role: z.enum(['fisioterapeuta', 'estagiario', 'admin']).optional(),
  is_active: z.boolean().default(true),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(['email', 'created_at', 'last_login_at']).default('email'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
})

/**
 * GET /api/practitioners
 * List practitioners/professionals in organization
 */
export async function GET(request: NextRequest) {
  // TODO: Re-enable after profiles table schema is updated in production database
  return NextResponse.json(
    {
      error: 'Funcionalidade temporariamente desabilitada - aguardando atualização do schema do banco de dados',
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total_items: 0,
        total_pages: 0,
        has_next_page: false,
        has_prev_page: false
      }
    },
    { status: 503 }
  )
}