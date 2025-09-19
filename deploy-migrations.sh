#!/bin/bash

# Script para aplicar migrações no banco de produção Supabase
# Execute este script para atualizar o banco de dados em produção

echo "🚀 Iniciando deploy das migrações para produção..."

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instale com: npm install -g supabase"
    exit 1
fi

# Verificar se está logado
if ! supabase projects list &> /dev/null; then
    echo "❌ Não está logado no Supabase. Execute: supabase login"
    exit 1
fi

# Aplicar migrações
echo "📦 Aplicando migrações..."

# Migração 1: Core Entities
echo "   - Aplicando migração 001: Core Entities"
supabase db push --file supabase/migrations/20250115_001_core_entities.sql

# Migração 2: Patients Management  
echo "   - Aplicando migração 002: Patients Management"
supabase db push --file supabase/migrations/20250115_002_patients.sql

# Migração 3: Appointments & Sessions
echo "   - Aplicando migração 003: Appointments & Sessions"
supabase db push --file supabase/migrations/20250115_003_appointments_sessions.sql

echo "✅ Migrações aplicadas com sucesso!"

# Verificar status
echo "🔍 Verificando status do projeto..."
supabase status

echo "🎉 Deploy concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Verifique o dashboard: https://supabase.com/dashboard/project/jfrddsmtpahpynihubue"
echo "2. Teste as APIs no Studio"
echo "3. Configure as variáveis de ambiente no frontend"
