-- Criação da tabela data_deletion_requests para compliance LGPD
-- Execute este SQL diretamente no dashboard do Supabase

-- 1. Criar a tabela
CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('full_deletion', 'partial_deletion', 'anonymization')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    reason TEXT NOT NULL,
    data_types JSONB,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES profiles(id),
    confirmation_required BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id ON public.data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON public.data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_requested_at ON public.data_deletion_requests(requested_at);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS para isolamento por organização
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
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 5. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_data_deletion_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para atualizar updated_at
CREATE TRIGGER trigger_update_data_deletion_requests_updated_at
    BEFORE UPDATE ON public.data_deletion_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_data_deletion_requests_updated_at();

-- 7. Adicionar comentários para documentação
COMMENT ON TABLE public.data_deletion_requests IS 'Tabela para gerenciar solicitações de exclusão de dados conforme LGPD';
COMMENT ON COLUMN public.data_deletion_requests.request_type IS 'Tipo da solicitação: full_deletion, partial_deletion, anonymization';
COMMENT ON COLUMN public.data_deletion_requests.status IS 'Status da solicitação: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN public.data_deletion_requests.data_types IS 'JSON com os tipos de dados a serem processados';
COMMENT ON COLUMN public.data_deletion_requests.confirmation_required IS 'Se a solicitação requer confirmação adicional';

-- 8. Conceder permissões básicas
GRANT SELECT, INSERT ON public.data_deletion_requests TO authenticated;
GRANT ALL ON public.data_deletion_requests TO service_role;