-- Criação da tabela data_deletion_requests para compliance LGPD
-- Execute este SQL diretamente no dashboard do Supabase
-- Este script corrige o problema da tabela 'profiles' não existir

-- 1. Verificar se a tabela profiles existe, se não, criar uma versão básica
DO $$
BEGIN
    -- Verificar se a tabela profiles existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        -- Criar tabela profiles básica se não existir
        CREATE TABLE IF NOT EXISTS public.profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'paciente' CHECK (role IN ('admin', 'fisioterapeuta', 'estagiario', 'paciente')),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Habilitar RLS na tabela profiles
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        -- Criar política básica para profiles
        CREATE POLICY "Users can view own profile" ON public.profiles
            FOR ALL USING (id = auth.uid());
            
        RAISE NOTICE 'Tabela profiles criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela profiles já existe';
    END IF;
END $$;

-- 2. Verificar se a tabela orgs existe, se não, criar uma versão básica
DO $$
BEGIN
    -- Verificar se a tabela orgs existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orgs' AND table_schema = 'public') THEN
        -- Criar tabela orgs básica se não existir
        CREATE TABLE IF NOT EXISTS public.orgs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Habilitar RLS na tabela orgs
        ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
        
        -- Criar política básica para orgs
        CREATE POLICY "Users can view orgs" ON public.orgs
            FOR ALL USING (true);
            
        RAISE NOTICE 'Tabela orgs criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela orgs já existe';
    END IF;
END $$;

-- 3. Criar a tabela data_deletion_requests
CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('full_deletion', 'partial_deletion', 'anonymization')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    reason TEXT NOT NULL,
    data_types JSONB,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES public.profiles(id),
    confirmation_required BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id ON public.data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_org_id ON public.data_deletion_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON public.data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_requested_at ON public.data_deletion_requests(requested_at);

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS para isolamento por organização
-- Usuários podem visualizar apenas suas próprias solicitações
CREATE POLICY "Users can view own deletion requests" ON public.data_deletion_requests
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Usuários podem criar suas próprias solicitações
CREATE POLICY "Users can create own deletion requests" ON public.data_deletion_requests
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

-- Apenas admins podem atualizar solicitações
CREATE POLICY "Admins can update deletion requests" ON public.data_deletion_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.role = 'admin'
        )
    );

-- 7. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_data_deletion_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger para atualizar updated_at
CREATE TRIGGER trigger_update_data_deletion_requests_updated_at
    BEFORE UPDATE ON public.data_deletion_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_data_deletion_requests_updated_at();

-- 9. Adicionar comentários para documentação
COMMENT ON TABLE public.data_deletion_requests IS 'Tabela para gerenciar solicitações de exclusão de dados conforme LGPD';
COMMENT ON COLUMN public.data_deletion_requests.request_type IS 'Tipo da solicitação: full_deletion, partial_deletion, anonymization';
COMMENT ON COLUMN public.data_deletion_requests.status IS 'Status da solicitação: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN public.data_deletion_requests.data_types IS 'JSON com os tipos de dados a serem processados';
COMMENT ON COLUMN public.data_deletion_requests.confirmation_required IS 'Se a solicitação requer confirmação adicional';

-- 10. Conceder permissões básicas
GRANT SELECT, INSERT ON public.data_deletion_requests TO authenticated;
GRANT ALL ON public.data_deletion_requests TO service_role;

-- 11. Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Tabela data_deletion_requests criada com sucesso!';
    RAISE NOTICE 'Verifique se as tabelas profiles e orgs foram criadas corretamente.';
    RAISE NOTICE 'Se você tem migrações completas, considere aplicá-las primeiro.';
END $$;
