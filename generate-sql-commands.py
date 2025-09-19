#!/usr/bin/env python3
"""
Script para gerar comandos SQL para aplicar migrações manualmente
"""

import os

def read_migration_file(filepath):
    """Lê o conteúdo de um arquivo de migração"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"❌ Arquivo não encontrado: {filepath}")
        return None

def generate_sql_commands():
    """Gera comandos SQL para aplicar migrações"""
    
    migrations = [
        {
            'name': 'Core Entities',
            'file': 'supabase/migrations/20250115_001_core_entities.sql'
        },
        {
            'name': 'Patients Management', 
            'file': 'supabase/migrations/20250115_002_patients.sql'
        },
        {
            'name': 'Appointments & Sessions',
            'file': 'supabase/migrations/20250115_003_appointments_sessions.sql'
        }
    ]
    
    print("🚀 COMANDOS SQL PARA APLICAR MIGRAÇÕES")
    print("=" * 50)
    print("📋 Instruções:")
    print("1. Acesse: https://supabase.com/dashboard/project/jfrddsmtpahpynihubue/sql")
    print("2. Cole cada bloco SQL abaixo no SQL Editor")
    print("3. Execute um bloco por vez")
    print("4. Verifique se não há erros antes de executar o próximo")
    print()
    
    for i, migration in enumerate(migrations, 1):
        sql_content = read_migration_file(migration['file'])
        if sql_content:
            print(f"📦 MIGRAÇÃO {i}: {migration['name']}")
            print("-" * 40)
            print("-- Cole o SQL abaixo no SQL Editor do Supabase")
            print()
            print(sql_content)
            print()
            print("-- ✅ Execute o SQL acima e verifique se não há erros")
            print()
            print("=" * 50)
            print()
    
    print("🎉 TODAS AS MIGRAÇÕES FORAM GERADAS!")
    print()
    print("📋 Próximos passos:")
    print("1. ✅ Aplicar todas as migrações no SQL Editor")
    print("2. ✅ Configurar variáveis na Vercel")
    print("3. ✅ Testar a aplicação")
    print("4. ✅ Verificar logs e funcionamento")

if __name__ == "__main__":
    generate_sql_commands()

