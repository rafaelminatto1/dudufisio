/**
 * API Endpoint de Teste - FisioFlow
 * GET /api/test - Endpoint para testar se a API está funcionando
 * Este endpoint não requer autenticação
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/test
 * Teste básico da API
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'API está funcionando corretamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurado' : 'Não configurado',
      anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurado' : 'Não configurado',
      service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurado' : 'Não configurado'
    }
  })
}

/**
 * POST /api/test
 * Teste de POST com JSON
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      success: true,
      message: 'POST recebido com sucesso',
      received: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro ao processar requisição',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    )
  }
}