-- Script para verificar a estrutura do banco de dados
-- Execute este SQL no dashboard do Supabase para diagnosticar problemas

-- 1. Verificar se as tabelas principais existem
SELECT 
    table_name,
    table_schema,
    CASE 
        WHEN table_name IN ('profiles', 'orgs', 'patients', 'appointments', 'sessions') 
        THEN '✅ Tabela existe'
        ELSE '❌ Tabela não encontrada'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'orgs', 'patients', 'appointments', 'sessions', 'data_deletion_requests')
ORDER BY table_name;

-- 2. Verificar se as extensões necessárias estão instaladas
SELECT 
    extname as extension_name,
    CASE 
        WHEN extname IN ('uuid-ossp', 'pgcrypto') 
        THEN '✅ Extensão instalada'
        ELSE '❌ Extensão não encontrada'
    END as status
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- 3. Verificar se as funções necessárias existem
SELECT 
    routine_name as function_name,
    routine_schema,
    CASE 
        WHEN routine_name IN ('update_updated_at_column', 'gen_random_uuid') 
        THEN '✅ Função existe'
        ELSE '❌ Função não encontrada'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_updated_at_column', 'gen_random_uuid', 'uuid_generate_v4')
ORDER BY routine_name;

-- 4. Verificar se RLS está habilitado nas tabelas principais
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS habilitado'
        ELSE '❌ RLS desabilitado'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'orgs', 'patients', 'appointments', 'sessions', 'data_deletion_requests')
ORDER BY tablename;

-- 5. Verificar políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'orgs', 'patients', 'appointments', 'sessions', 'data_deletion_requests')
ORDER BY tablename, policyname;

-- 6. Verificar se há dados nas tabelas principais
SELECT 
    'profiles' as tabela,
    COUNT(*) as total_registros
FROM public.profiles
UNION ALL
SELECT 
    'orgs' as tabela,
    COUNT(*) as total_registros
FROM public.orgs
UNION ALL
SELECT 
    'patients' as tabela,
    COUNT(*) as total_registros
FROM public.patients
UNION ALL
SELECT 
    'appointments' as tabela,
    COUNT(*) as total_registros
FROM public.appointments
UNION ALL
SELECT 
    'sessions' as tabela,
    COUNT(*) as total_registros
FROM public.sessions
UNION ALL
SELECT 
    'data_deletion_requests' as tabela,
    COUNT(*) as total_registros
FROM public.data_deletion_requests;

-- 7. Verificar migrações aplicadas (se a tabela existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supabase_migrations' AND table_schema = 'supabase') THEN
        RAISE NOTICE 'Verificando migrações aplicadas...';
        PERFORM 1; -- Placeholder para query de migrações
    ELSE
        RAISE NOTICE 'Tabela de migrações não encontrada. As migrações podem não ter sido aplicadas.';
    END IF;
END $$;
