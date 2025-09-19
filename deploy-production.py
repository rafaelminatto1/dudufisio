#!/usr/bin/env python3
"""
Script para aplicar migrações no banco de produção Supabase
Usa a API REST do Supabase para executar as migrações
"""

import os
import sys
import requests
import json
from typing import Dict, Any

# Configurações do projeto Supabase
PROJECT_URL = "https://jfrddsmtpahpynihubue.supabase.co"
PROJECT_REF = "jfrddsmtpahpynihubue"

def get_env_vars():
    """Obtém as variáveis de ambiente necessárias"""
    required_vars = [
        'SUPABASE_SERVICE_ROLE_KEY'
    ]
    
    env_vars = {}
    missing_vars = []
    
    for var in required_vars:
        value = os.getenv(var)
        if not value:
            missing_vars.append(var)
        else:
            env_vars[var] = value
    
    if missing_vars:
        print(f"❌ Variáveis de ambiente faltando: {', '.join(missing_vars)}")
        print("Configure as seguintes variáveis:")
        for var in missing_vars:
            print(f"  export {var}=sua_chave_aqui")
        sys.exit(1)
    
    return env_vars

def read_migration_file(filepath: str) -> str:
    """Lê o conteúdo de um arquivo de migração"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"❌ Arquivo de migração não encontrado: {filepath}")
        sys.exit(1)

def execute_sql_via_rpc(service_key: str, sql: str) -> Dict[str, Any]:
    """Executa SQL via RPC do Supabase"""
    headers = {
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json',
        'apikey': service_key
    }
    
    # Usar a função rpc para executar SQL
    payload = {
        'query': sql
    }
    
    try:
        response = requests.post(
            f"{PROJECT_URL}/rest/v1/rpc/execute_sql",
            headers=headers,
            json=payload,
            timeout=30
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

def apply_migration(migration_name: str, sql_content: str, service_key: str) -> bool:
    """Aplica uma migração específica"""
    print(f"📦 Aplicando migração: {migration_name}")
    
    # Dividir o SQL em statements individuais
    statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
    
    success_count = 0
    for i, statement in enumerate(statements):
        if not statement:
            continue
            
        print(f"   - Executando statement {i+1}/{len(statements)}")
        
        result = execute_sql_via_rpc(service_key, statement)
        if result['success']:
            success_count += 1
        else:
            print(f"   ❌ Erro no statement {i+1}: {result['error']}")
            # Continuar com os próximos statements
    
    print(f"   ✅ {success_count}/{len(statements)} statements executados com sucesso")
    return success_count == len(statements)

def main():
    """Função principal"""
    print("🚀 Iniciando deploy das migrações para produção...")
    print(f"📍 Projeto: {PROJECT_URL}")
    
    # Obter variáveis de ambiente
    env_vars = get_env_vars()
    service_key = env_vars['SUPABASE_SERVICE_ROLE_KEY']
    
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
        if apply_migration(migration['name'], sql_content, service_key):
            success_count += 1
    
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
