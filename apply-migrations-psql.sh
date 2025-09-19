#!/bin/bash

# Script para aplicar migrações usando psql diretamente
echo "🚀 Aplicando migrações no banco de produção..."

# Configurar variáveis de conexão
export PGPASSWORD="Y7H1sho7nXaoPlFN"
PGHOST="aws-1-sa-east-1.pooler.supabase.com"
PGPORT="6543"
PGUSER="postgres.jfrddsmtpahpynihubue"
PGDATABASE="postgres"

echo "📍 Conectando ao banco: $PGHOST:$PGPORT"
echo "👤 Usuário: $PGUSER"
echo "🗄️ Banco: $PGDATABASE"

# Testar conexão primeiro
echo "🔍 Testando conexão..."
PGPASSWORD="Y7H1sho7nXaoPlFN" psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Conexão bem-sucedida!"
else
    echo "❌ Erro de conexão. Verificando credenciais..."
    exit 1
fi

# Aplicar migrações uma por uma
migrations=(
    "supabase/migrations/20250115_001_core_entities.sql"
    "supabase/migrations/20250115_002_patients.sql"
    "supabase/migrations/20250115_003_appointments_sessions.sql"
)

for migration in "${migrations[@]}"; do
    if [ -f "$migration" ]; then
        echo "📦 Aplicando migração: $(basename $migration)"
        
        PGPASSWORD="Y7H1sho7nXaoPlFN" psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f "$migration"
        
        if [ $? -eq 0 ]; then
            echo "✅ Migração $(basename $migration) aplicada com sucesso!"
        else
            echo "❌ Erro ao aplicar migração $(basename $migration)"
            echo "💡 Continuando com as próximas migrações..."
        fi
        echo ""
    else
        echo "⚠️ Arquivo não encontrado: $migration"
    fi
done

echo "🎉 Processo de aplicação de migrações concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Verifique o dashboard: https://supabase.com/dashboard/project/jfrddsmtpahpynihubue"
echo "2. Configure as variáveis na Vercel"
echo "3. Teste a aplicação: https://dudufisio.vercel.app"

