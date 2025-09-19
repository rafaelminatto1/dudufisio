#!/usr/bin/env python3
"""
Script para aplicar migrações no banco de produção Supabase via API REST
"""

import requests
import json
import time
import sys

# Configurações do Supabase
PROJECT_URL = "https://jfrddsmtpahpynihubue.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcmRkc210cGFocHluaWh1YnVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzMTAzMSwiZXhwIjoyMDczNjA3MDMxfQ.Y-_h2MYYBgmRQllecsvcdOGQNVIuCJtx29_59kB31yE"

def read_migration_file(filepath):
    """Lê o conteúdo de um arquivo de migração"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"❌ Arquivo não encontrado: {filepath}")
        return None

def execute_sql_via_rpc(sql_query):
    """Executa SQL via RPC do Supabase"""
    headers = {
        'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY
    }
    
    # Usar a função rpc para executar SQL
    payload = {
        'query': sql_query
    }
    
    try:
        response = requests.post(
            f"{PROJECT_URL}/rest/v1/rpc/execute_sql",
            headers=headers,
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            return {'success': True, 'data': response.json()}
        else:
            return {
                'success': False, 
                'error': f"HTTP {response.status_code}: {response.text}"
            }
    except Exception as e:
        return {'success': False, 'error': str(e)}

def execute_sql_direct(sql_query):
    """Executa SQL diretamente via REST API"""
    headers = {
        'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'return=minimal'
    }
    
    try:
        # Para operações DDL, usar endpoint direto
        response = requests.post(
            f"{PROJECT_URL}/rest/v1/rpc/exec",
            headers=headers,
            json={'sql': sql_query},
            timeout=60
        )
        
        if response.status_code in [200, 201, 204]:
            return {'success': True, 'data': response.text}
        else:
            return {
                'success': False, 
                'error': f"HTTP {response.status_code}: {response.text}"
            }
    except Exception as e:
        return {'success': False, 'error': str(e)}

def apply_migration(migration_name, sql_content):
    """Aplica uma migração específica"""
    print(f"📦 Aplicando migração: {migration_name}")
    
    # Dividir o SQL em statements individuais
    statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
    
    success_count = 0
    for i, statement in enumerate(statements):
        if not statement or statement.startswith('--'):
            continue
            
        print(f"   - Executando statement {i+1}/{len(statements)}")
        
        # Tentar primeiro via RPC
        result = execute_sql_via_rpc(statement)
        if not result['success']:
            # Se falhar, tentar método direto
            result = execute_sql_direct(statement)
        
        if result['success']:
            success_count += 1
            print(f"   ✅ Statement {i+1} executado com sucesso")
        else:
            print(f"   ❌ Erro no statement {i+1}: {result['error']}")
            # Continuar com os próximos statements
    
    print(f"   ✅ {success_count}/{len(statements)} statements executados com sucesso")
    return success_count == len(statements)

def test_connection():
    """Testa a conexão com o banco"""
    print("🔍 Testando conexão com o banco...")
    
    headers = {
        'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
        'apikey': SERVICE_ROLE_KEY
    }
    
    try:
        response = requests.get(
            f"{PROJECT_URL}/rest/v1/",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Conexão com Supabase bem-sucedida!")
            return True
        else:
            print(f"❌ Erro de conexão: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return False

def main():
    """Função principal"""
    print("🚀 Iniciando aplicação das migrações em produção...")
    print(f"📍 Projeto: {PROJECT_URL}")
    
    # Testar conexão
    if not test_connection():
        print("❌ Não foi possível conectar ao Supabase. Verifique as credenciais.")
        sys.exit(1)
    
    # Lista de migrações para aplicar
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
    
    # Aplicar cada migração
    success_count = 0
    for migration in migrations:
        sql_content = read_migration_file(migration['file'])
        if sql_content and apply_migration(migration['name'], sql_content):
            success_count += 1
        time.sleep(2)  # Pausa entre migrações
    
    print(f"\n✅ {success_count}/{len(migrations)} migrações aplicadas com sucesso!")
    
    if success_count == len(migrations):
        print("🎉 Deploy concluído!")
        print("\n📋 Próximos passos:")
        print("1. Verifique o dashboard: https://supabase.com/dashboard/project/jfrddsmtpahpynihubue")
        print("2. Teste as APIs no Studio")
        print("3. Configure as variáveis de ambiente no frontend")
    else:
        print("⚠️  Algumas migrações falharam. Verifique os logs acima.")
        sys.exit(1)

if __name__ == "__main__":
    main()

