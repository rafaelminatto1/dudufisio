import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/practitioners
 * List practitioners/professionals in organization
 */
export async function GET(_request: NextRequest) {
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