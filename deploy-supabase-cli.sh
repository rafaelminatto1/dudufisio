#!/bin/bash

# Script para aplicar migrações no Supabase usando CLI
# Este script usa o método mais confiável: supabase db push

echo "🚀 Iniciando deploy das migrações para produção..."
echo "📍 Projeto: jfrddsmtpahpynihubue.supabase.co"

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instalando..."
    npm install -g supabase
fi

# Verificar se está logado
echo "🔍 Verificando autenticação..."
supabase status --help > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "🔑 Fazendo login no Supabase..."
    supabase login
fi

# Verificar se o projeto está linkado
if [ ! -f ".supabase/config.toml" ]; then
    echo "🔗 Conectando ao projeto remoto..."
    supabase link --project-ref jfrddsmtpahpynihubue
fi

# Aplicar migrações
echo "📦 Aplicando migrações..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migrações aplicadas com sucesso!"
    
    # Verificar status
    echo "🔍 Verificando status do projeto..."
    supabase status
    
    echo ""
    echo "🎉 Deploy concluído!"
    echo "📋 Próximos passos:"
    echo "1. Verifique o dashboard: https://supabase.com/dashboard/project/jfrddsmtpahpynihubue"
    echo "2. Configure as variáveis na Vercel: https://vercel.com/rafael-minattos-projects/dudufisio"
    echo "3. Teste a aplicação: https://dudufisio.vercel.app"
else
    echo "❌ Erro ao aplicar migrações"
    echo "💡 Alternativas:"
    echo "1. Use o SQL Editor no dashboard do Supabase"
    echo "2. Execute as migrações manualmente via psql"
    exit 1
fi

