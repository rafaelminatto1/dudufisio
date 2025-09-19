# Solução para o Erro "relation profiles does not exist"

## Problema
Você está recebendo o erro `ERROR: 42P01: relation "profiles" does not exist` ao tentar executar o SQL no dashboard do Supabase.

## Causa
O erro indica que a tabela `profiles` não existe no banco de dados. Isso pode acontecer por:
1. As migrações não foram aplicadas
2. A migração falhou parcialmente
3. O banco de dados foi resetado

## Soluções

### Opção 1: Aplicar Migrações Completas (Recomendado)
Execute o script `apply_migrations_complete.sql` no dashboard do Supabase. Este script:
- Cria todas as tabelas necessárias
- Aplica todas as políticas RLS
- Configura índices e triggers
- Concede permissões adequadas

### Opção 2: Aplicar Apenas o Script Corrigido
Execute o script `create_data_deletion_requests_table_fixed.sql` que:
- Verifica se as tabelas `profiles` e `orgs` existem
- Cria versões básicas se não existirem
- Cria a tabela `data_deletion_requests`

### Opção 3: Verificar Estrutura do Banco
Execute o script `check_database_structure.sql` para diagnosticar o que está faltando.

## Passos para Resolver

### 1. Verificar o Estado Atual
```sql
-- Execute no dashboard do Supabase
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'orgs', 'patients', 'appointments', 'sessions');
```

### 2. Aplicar a Solução
Escolha uma das opções acima e execute o script correspondente no dashboard do Supabase.

### 3. Verificar se Funcionou
```sql
-- Verificar se a tabela data_deletion_requests foi criada
SELECT * FROM public.data_deletion_requests LIMIT 1;
```

## Arquivos Criados

1. **`apply_migrations_complete.sql`** - Script completo com todas as migrações
2. **`create_data_deletion_requests_table_fixed.sql`** - Script corrigido que cria dependências se necessário
3. **`check_database_structure.sql`** - Script de diagnóstico

## Recomendação

Use o **`apply_migrations_complete.sql`** se você quer uma estrutura completa e organizada do banco de dados. Este é o método mais robusto e garante que todas as tabelas sejam criadas corretamente.

## Próximos Passos

Após aplicar as migrações:
1. Teste a criação de usuários
2. Teste a criação de organizações
3. Teste a funcionalidade de solicitações de exclusão de dados
4. Configure dados de teste se necessário

## Suporte

Se ainda tiver problemas, execute o script de diagnóstico e compartilhe os resultados para análise mais detalhada.
