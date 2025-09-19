-- Script completo para aplicar todas as migrações necessárias
-- Execute este SQL no dashboard do Supabase em ordem sequencial

-- ========================================
-- PARTE 1: HABILITAR EXTENSÕES NECESSÁRIAS
-- ========================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- PARTE 2: CRIAR TABELA ORGS
-- ========================================

CREATE TABLE IF NOT EXISTS public.orgs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    cnes_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    postal_code VARCHAR(10),
    logo_url TEXT,
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    business_hours JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    subscription_type VARCHAR(20) DEFAULT 'free' CHECK (subscription_type IN ('free', 'basic', 'pro', 'enterprise')),
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- PARTE 3: CRIAR TABELA PROFILES
-- ========================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'fisioterapeuta', 'estagiario', 'paciente')),
    crefito_number VARCHAR(20),
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- PARTE 4: CRIAR TABELA ORG_MEMBERSHIPS
-- ========================================

CREATE TABLE IF NOT EXISTS public.org_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'fisioterapeuta', 'estagiario', 'paciente')),
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    invited_by UUID REFERENCES public.profiles(id),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

-- ========================================
-- PARTE 5: CRIAR TABELA AUDIT_LOGS
-- ========================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    operation VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    additional_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- PARTE 6: CRIAR TABELA PATIENTS
-- ========================================

CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    rg VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('masculino', 'feminino', 'outro', 'nao_informado')),
    phone VARCHAR(20),
    email VARCHAR(255),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    postal_code VARCHAR(10),
    health_insurance VARCHAR(100),
    health_insurance_number VARCHAR(50),
    medical_history TEXT,
    current_medications TEXT,
    allergies TEXT,
    observations TEXT,
    
    -- LGPD Compliance fields
    consent_lgpd BOOLEAN NOT NULL DEFAULT false,
    consent_date TIMESTAMPTZ,
    consent_version VARCHAR(10) DEFAULT '1.0',
    data_retention_until TIMESTAMPTZ,
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    
    -- Ensure unique CPF per organization
    UNIQUE(org_id, cpf)
);

-- ========================================
-- PARTE 7: CRIAR TABELA APPOINTMENTS
-- ========================================

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    practitioner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    appointment_type VARCHAR(50) NOT NULL CHECK (appointment_type IN (
        'consulta', 'avaliacao', 'fisioterapia', 'retorno', 'emergencia'
    )),
    status VARCHAR(20) DEFAULT 'agendado' CHECK (status IN (
        'agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'falta'
    )),
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id)
);

-- ========================================
-- PARTE 8: CRIAR TABELA SESSIONS
-- ========================================

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'agendada' CHECK (status IN (
        'agendada', 'em_andamento', 'concluida', 'cancelada'
    )),
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN (
        'avaliacao_inicial', 'fisioterapia', 'avaliacao_progresso', 
        'tratamento', 'reeducacao', 'prevencao'
    )),
    
    -- Assessment fields
    chief_complaint TEXT,
    subjective_assessment TEXT,
    objective_assessment TEXT,
    assessment_notes TEXT,
    
    -- Treatment fields
    treatment_plan TEXT,
    exercises_prescribed TEXT[],
    pain_level_before INTEGER CHECK (pain_level_before >= 0 AND pain_level_before <= 10),
    pain_level_after INTEGER CHECK (pain_level_after >= 0 AND pain_level_after <= 10),
    
    -- Session notes
    session_notes TEXT,
    next_session_recommendations TEXT,
    progress_notes TEXT,
    improvement_areas TEXT[],
    concerns TEXT,
    patient_feedback TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id)
);

-- ========================================
-- PARTE 9: CRIAR TABELA DATA_DELETION_REQUESTS
-- ========================================

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

-- ========================================
-- PARTE 10: CRIAR ÍNDICES
-- ========================================

-- Índices para orgs
CREATE INDEX IF NOT EXISTS idx_orgs_slug ON public.orgs(slug);
CREATE INDEX IF NOT EXISTS idx_orgs_cnpj ON public.orgs(cnpj);

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Índices para org_memberships
CREATE INDEX IF NOT EXISTS idx_org_memberships_org_user ON public.org_memberships(org_id, user_id);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON public.audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Índices para patients
CREATE INDEX IF NOT EXISTS idx_patients_org_id ON public.patients(org_id);
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON public.patients(org_id, cpf);
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients(org_id, name);
CREATE INDEX IF NOT EXISTS idx_patients_status ON public.patients(org_id, status);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON public.patients(org_id, created_at);

-- Índices para appointments
CREATE INDEX IF NOT EXISTS idx_appointments_org_id ON public.appointments(org_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_practitioner_id ON public.appointments(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON public.appointments(appointment_type);

-- Índices para sessions
CREATE INDEX IF NOT EXISTS idx_sessions_org_id ON public.sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_sessions_appointment_id ON public.sessions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_sessions_patient_id ON public.sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_id ON public.sessions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);

-- Índices para data_deletion_requests
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id ON public.data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_org_id ON public.data_deletion_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON public.data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_requested_at ON public.data_deletion_requests(requested_at);

-- ========================================
-- PARTE 11: CRIAR FUNÇÕES
-- ========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- PARTE 12: CRIAR TRIGGERS
-- ========================================

-- Triggers para updated_at
CREATE TRIGGER update_orgs_updated_at BEFORE UPDATE ON public.orgs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_org_memberships_updated_at BEFORE UPDATE ON public.org_memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_deletion_requests_updated_at BEFORE UPDATE ON public.data_deletion_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- PARTE 13: HABILITAR RLS
-- ========================================

ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PARTE 14: CRIAR POLÍTICAS RLS BÁSICAS
-- ========================================

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR ALL USING (id = auth.uid());

-- Políticas para orgs
CREATE POLICY "Users can view orgs" ON public.orgs
    FOR ALL USING (true);

-- Políticas para org_memberships
CREATE POLICY "Users can view their memberships" ON public.org_memberships
    FOR ALL USING (user_id = auth.uid());

-- Políticas para patients
CREATE POLICY "Users can access org patients" ON public.patients
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM public.org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Políticas para appointments
CREATE POLICY "Users can access org appointments" ON public.appointments
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM public.org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Políticas para sessions
CREATE POLICY "Users can access org sessions" ON public.sessions
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM public.org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Políticas para data_deletion_requests
CREATE POLICY "Users can view own deletion requests" ON public.data_deletion_requests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own deletion requests" ON public.data_deletion_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update deletion requests" ON public.data_deletion_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.role = 'admin'
        )
    );

-- ========================================
-- PARTE 15: CONCEDER PERMISSÕES
-- ========================================

-- Permissões para authenticated users
GRANT SELECT, INSERT ON public.orgs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.org_memberships TO authenticated;
GRANT SELECT, INSERT ON public.patients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.sessions TO authenticated;
GRANT SELECT, INSERT ON public.data_deletion_requests TO authenticated;

-- Permissões para service_role
GRANT ALL ON public.orgs TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.org_memberships TO service_role;
GRANT ALL ON public.audit_logs TO service_role;
GRANT ALL ON public.patients TO service_role;
GRANT ALL ON public.appointments TO service_role;
GRANT ALL ON public.sessions TO service_role;
GRANT ALL ON public.data_deletion_requests TO service_role;

-- ========================================
-- PARTE 16: MENSAGEM DE SUCESSO
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÕES APLICADAS COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Todas as tabelas principais foram criadas:';
    RAISE NOTICE '- orgs';
    RAISE NOTICE '- profiles';
    RAISE NOTICE '- org_memberships';
    RAISE NOTICE '- audit_logs';
    RAISE NOTICE '- patients';
    RAISE NOTICE '- appointments';
    RAISE NOTICE '- sessions';
    RAISE NOTICE '- data_deletion_requests';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Agora você pode executar o script de data_deletion_requests';
    RAISE NOTICE '========================================';
END $$;
