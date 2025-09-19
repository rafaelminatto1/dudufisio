import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { whatsappAPI } from '@/src/lib/integrations/whatsapp-api'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Verificar conectividade básica
    const checks = await Promise.allSettled([
      checkSupabaseConnection(),
      checkWhatsAppConnection(),
      checkEnvironmentVariables()
    ])
    
    const results = checks.map((check, index) => {
      const status = check.status === 'fulfilled' ? 'healthy' : 'unhealthy'
      const details = check.status === 'fulfilled' 
        ? check.value 
        : { error: check.reason?.message || 'Unknown error' }
      
      return {
        service: ['supabase', 'whatsapp', 'environment'][index],
        status,
        details
      }
    })
    
    const allHealthy = results.every(result => result.status === 'healthy')
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      checks: results
    }, {
      status: allHealthy ? 200 : 503
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    })
  }
}

async function checkSupabaseConnection() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Testar conexão com uma query simples
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      throw error
    }
    
    return {
      connected: true,
      message: 'Supabase connection successful'
    }
  } catch (error) {
    throw new Error(`Supabase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function checkWhatsAppConnection() {
  try {
    const isConnected = await whatsappAPI.testConnection()
    
    if (!isConnected) {
      throw new Error('WhatsApp API connection failed')
    }
    
    return {
      connected: true,
      message: 'WhatsApp API connection successful'
    }
  } catch (error) {
    throw new Error(`WhatsApp API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function checkEnvironmentVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY'
  ]
  
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`)
  }
  
  return {
    configured: true,
    message: 'All required environment variables are set'
  }
}
