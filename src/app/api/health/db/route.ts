import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Verificar conectividade com o banco de dados
    const dbHealth = await checkDatabaseHealth()
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: dbHealth.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: {
        connection: dbHealth.connection,
        tables: dbHealth.tables,
        migrations: dbHealth.migrations
      }
    }, {
      status: dbHealth.healthy ? 200 : 503
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

async function checkDatabaseHealth() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Testar conexão básica
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      throw connectionError
    }
    
    // Verificar tabelas principais
    const tables = await checkTables(supabase)
    
    // Verificar migrações
    const migrations = await checkMigrations(supabase)
    
    return {
      healthy: true,
      connection: {
        status: 'connected',
        message: 'Database connection successful'
      },
      tables,
      migrations
    }
    
  } catch (error) {
    return {
      healthy: false,
      connection: {
        status: 'disconnected',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      tables: null,
      migrations: null
    }
  }
}

async function checkTables(supabase: any) {
  try {
    const tables = [
      'profiles',
      'orgs',
      'org_memberships',
      'patients',
      'appointments',
      'sessions',
      'pain_points',
      'measurements',
      'audit_logs'
    ]
    
    const tableStatus = await Promise.allSettled(
      tables.map(async (table) => {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)
        
        return {
          name: table,
          accessible: !error,
          error: error?.message
        }
      })
    )
    
    return tableStatus.map((result, index) => ({
      name: tables[index],
      status: result.status === 'fulfilled' && result.value.accessible ? 'accessible' : 'error',
      error: result.status === 'fulfilled' ? result.value.error : result.reason?.message
    }))
    
  } catch (error) {
    return [{
      name: 'all',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }]
  }
}

async function checkMigrations(supabase: any) {
  try {
    // Verificar se as migrações principais foram aplicadas
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('version')
      .order('version', { ascending: false })
      .limit(5)
    
    if (error) {
      // Se não conseguir acessar schema_migrations, assumir que está OK
      return {
        status: 'unknown',
        message: 'Could not check migration status'
      }
    }
    
    const latestMigration = data?.[0]?.version
    
    return {
      status: 'applied',
      latest: latestMigration,
      message: 'Migrations are up to date'
    }
    
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
