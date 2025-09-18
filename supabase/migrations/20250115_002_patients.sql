-- Migration: Patients Management for FisioFlow
-- Description: Create patient management tables with Brazilian healthcare compliance
-- Date: 2025-01-15

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    rg VARCHAR(20),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('masculino', 'feminino', 'outro')),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    
    -- Address information
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    postal_code VARCHAR(10),
    
    -- Health information
    health_insurance VARCHAR(100),
    health_insurance_number VARCHAR(50),
    medical_history TEXT,
    current_medications TEXT,
    allergies TEXT,
    observations TEXT,
    
    -- LGPD compliance
    consent_lgpd BOOLEAN DEFAULT false,
    consent_date TIMESTAMPTZ,
    consent_version VARCHAR(10) DEFAULT '1.0',
    data_retention_until TIMESTAMPTZ,
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id),
    
    -- Ensure unique CPF per organization
    UNIQUE(org_id, cpf)
);

-- Create patient_photos table for photo management
CREATE TABLE IF NOT EXISTS patient_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create patient_documents table for document management
CREATE TABLE IF NOT EXISTS patient_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'rg', 'cpf', 'cnh', 'passport', 'medical_report', 'prescription', 
        'insurance_card', 'other'
    )),
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    description TEXT,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create patient_consent_history table for LGPD compliance
CREATE TABLE IF NOT EXISTS patient_consent_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN (
        'data_processing', 'photo_usage', 'research_participation', 
        'marketing_communications', 'data_sharing'
    )),
    granted BOOLEAN NOT NULL,
    consent_text TEXT NOT NULL,
    consent_version VARCHAR(10) NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    granted_by UUID REFERENCES profiles(id),
    ip_address INET,
    user_agent TEXT
);

-- Create patient_data_access_logs table for LGPD compliance
CREATE TABLE IF NOT EXISTS patient_data_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    accessed_by UUID REFERENCES profiles(id),
    access_type VARCHAR(50) NOT NULL CHECK (access_type IN (
        'view', 'edit', 'export', 'delete', 'photo_view', 'document_view'
    )),
    accessed_fields TEXT[],
    access_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_org_id ON patients(org_id);
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON patients(org_id, cpf);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(org_id, name);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(org_id, status);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_patient_photos_patient_id ON patient_photos(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_consent_history_patient_id ON patient_consent_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_data_access_logs_patient_id ON patient_data_access_logs(patient_id);

-- Create updated_at trigger for patients
CREATE TRIGGER update_patients_updated_at 
    BEFORE UPDATE ON patients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consent_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_data_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access patients from their organization
CREATE POLICY "Users can access org patients" ON patients
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Patients can only access their own data
CREATE POLICY "Patients can access own data" ON patients
    FOR SELECT USING (
        id IN (
            SELECT p.id FROM patients p
            JOIN org_memberships om ON p.org_id = om.org_id
            WHERE om.user_id = auth.uid() AND om.role = 'paciente'
        )
    );

-- RLS Policy: Users can access patient photos from their organization
CREATE POLICY "Users can access org patient photos" ON patient_photos
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Users can access patient documents from their organization
CREATE POLICY "Users can access org patient documents" ON patient_documents
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Users can access consent history from their organization
CREATE POLICY "Users can access org consent history" ON patient_consent_history
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Users can access data access logs from their organization
CREATE POLICY "Users can access org data access logs" ON patient_data_access_logs
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Create function to validate CPF
CREATE OR REPLACE FUNCTION validate_cpf(cpf_text TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    cpf_clean TEXT;
    sum1 INTEGER := 0;
    sum2 INTEGER := 0;
    remainder1 INTEGER;
    remainder2 INTEGER;
    digit1 INTEGER;
    digit2 INTEGER;
    i INTEGER;
BEGIN
    -- Remove formatting
    cpf_clean := regexp_replace(cpf_text, '[^0-9]', '', 'g');
    
    -- Check length
    IF length(cpf_clean) != 11 THEN
        RETURN FALSE;
    END IF;
    
    -- Check for sequences like 11111111111
    IF cpf_clean ~ '^(\d)\1{10}$' THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate first check digit
    FOR i IN 1..9 LOOP
        sum1 := sum1 + (substring(cpf_clean, i, 1)::INTEGER * (11 - i));
    END LOOP;
    
    remainder1 := 11 - (sum1 % 11);
    digit1 := CASE WHEN remainder1 < 2 THEN 0 ELSE remainder1 END;
    
    -- Calculate second check digit
    FOR i IN 1..10 LOOP
        sum2 := sum2 + (substring(cpf_clean, i, 1)::INTEGER * (12 - i));
    END LOOP;
    
    remainder2 := 11 - (sum2 % 11);
    digit2 := CASE WHEN remainder2 < 2 THEN 0 ELSE remainder2 END;
    
    -- Validate check digits
    RETURN (digit1 = substring(cpf_clean, 10, 1)::INTEGER) AND 
           (digit2 = substring(cpf_clean, 11, 1)::INTEGER);
END;
$$ LANGUAGE plpgsql;

-- Create function to format CPF
CREATE OR REPLACE FUNCTION format_cpf(cpf_text TEXT)
RETURNS TEXT AS $$
DECLARE
    cpf_clean TEXT;
BEGIN
    -- Remove formatting
    cpf_clean := regexp_replace(cpf_text, '[^0-9]', '', 'g');
    
    -- Check if valid length
    IF length(cpf_clean) != 11 THEN
        RETURN cpf_text;
    END IF;
    
    -- Format as XXX.XXX.XXX-XX
    RETURN substring(cpf_clean, 1, 3) || '.' ||
           substring(cpf_clean, 4, 3) || '.' ||
           substring(cpf_clean, 7, 3) || '-' ||
           substring(cpf_clean, 10, 2);
END;
$$ LANGUAGE plpgsql;

-- Create function to log patient data access
CREATE OR REPLACE FUNCTION log_patient_data_access(
    p_patient_id UUID,
    p_access_type VARCHAR(50),
    p_accessed_fields TEXT[] DEFAULT NULL,
    p_access_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_org_id UUID;
    v_user_id UUID;
BEGIN
    -- Get current user's org and user ID
    SELECT om.org_id, om.user_id INTO v_org_id, v_user_id
    FROM org_memberships om
    WHERE om.user_id = auth.uid() AND om.is_active = true
    LIMIT 1;

    -- Insert access log
    INSERT INTO patient_data_access_logs (
        patient_id,
        org_id,
        accessed_by,
        access_type,
        accessed_fields,
        access_reason,
        ip_address,
        user_agent
    ) VALUES (
        p_patient_id,
        v_org_id,
        v_user_id,
        p_access_type,
        p_accessed_fields,
        p_access_reason,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically log patient data access
CREATE OR REPLACE FUNCTION trigger_log_patient_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Log access to patient data
    PERFORM log_patient_data_access(
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE 
            WHEN TG_OP = 'INSERT' THEN ARRAY['all']
            WHEN TG_OP = 'UPDATE' THEN ARRAY['all']
            WHEN TG_OP = 'DELETE' THEN ARRAY['all']
            ELSE ARRAY['all']
        END,
        'Database operation: ' || TG_OP
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for patient data access logging
CREATE TRIGGER log_patient_access_trigger
    AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW EXECUTE FUNCTION trigger_log_patient_access();

-- Create function to check LGPD consent
CREATE OR REPLACE FUNCTION check_lgpd_consent(p_patient_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_consent BOOLEAN;
BEGIN
    SELECT consent_lgpd INTO v_consent
    FROM patients
    WHERE id = p_patient_id;
    
    RETURN COALESCE(v_consent, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
