-- Migration: Patient Management Tables
-- Created: 2025-09-14
-- Description: Creates tables for patient records with Brazilian validation and LGPD compliance

-- Patients table - Patient records with comprehensive demographic and medical information
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    cpf TEXT, -- Brazilian CPF (will be encrypted at app level)
    date_of_birth DATE,
    email TEXT,
    phone TEXT,
    address JSONB, -- structured address data: street, city, state, cep, neighborhood
    emergency_contact JSONB, -- name, phone, relationship
    profession TEXT,
    marital_status TEXT CHECK (marital_status IN ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel')),
    photo_url TEXT,
    status TEXT CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
    consent_lgpd BOOLEAN DEFAULT FALSE NOT NULL,
    consent_date TIMESTAMPTZ,
    consent_version TEXT DEFAULT '1.0',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance and search
CREATE INDEX patients_org_id_idx ON patients(org_id);
CREATE INDEX patients_cpf_idx ON patients(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX patients_name_idx ON patients USING GIN (to_tsvector('portuguese', name));
CREATE INDEX patients_status_idx ON patients(status);
CREATE INDEX patients_created_at_idx ON patients(created_at DESC);
CREATE INDEX patients_email_idx ON patients(email) WHERE email IS NOT NULL;
CREATE INDEX patients_phone_idx ON patients(phone) WHERE phone IS NOT NULL;

-- Add updated_at trigger
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Brazilian CPF validation function
CREATE OR REPLACE FUNCTION validate_cpf(cpf TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    clean_cpf TEXT;
    sum1 INTEGER := 0;
    sum2 INTEGER := 0;
    digit1 INTEGER;
    digit2 INTEGER;
    i INTEGER;
BEGIN
    -- Remove non-numeric characters
    clean_cpf := regexp_replace(cpf, '[^0-9]', '', 'g');

    -- Check length
    IF length(clean_cpf) != 11 THEN
        RETURN FALSE;
    END IF;

    -- Check for invalid patterns (all same digits)
    IF clean_cpf ~ '^(.)\1{10}$' THEN
        RETURN FALSE;
    END IF;

    -- Calculate first digit
    FOR i IN 1..9 LOOP
        sum1 := sum1 + (11 - i) * substring(clean_cpf, i, 1)::INTEGER;
    END LOOP;

    digit1 := 11 - (sum1 % 11);
    IF digit1 >= 10 THEN
        digit1 := 0;
    END IF;

    -- Calculate second digit
    FOR i IN 1..10 LOOP
        sum2 := sum2 + (12 - i) * substring(clean_cpf, i, 1)::INTEGER;
    END LOOP;

    digit2 := 11 - (sum2 % 11);
    IF digit2 >= 10 THEN
        digit2 := 0;
    END IF;

    -- Validate digits
    RETURN digit1 = substring(clean_cpf, 10, 1)::INTEGER
       AND digit2 = substring(clean_cpf, 11, 1)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Add CPF validation constraint
ALTER TABLE patients ADD CONSTRAINT valid_cpf
    CHECK (cpf IS NULL OR validate_cpf(cpf));

-- Brazilian phone validation function
CREATE OR REPLACE FUNCTION validate_brazilian_phone(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Allow various Brazilian phone formats
    -- +55 (11) 99999-9999, +55 11 99999-9999, (11) 99999-9999, etc.
    RETURN phone IS NULL OR phone ~ '^\+?55\s?(\([1-9][0-9]\)|\([1-9][0-9]\)|\d{2})\s?9?\d{4,5}-?\d{4}$';
END;
$$ LANGUAGE plpgsql;

-- Add phone validation constraint
ALTER TABLE patients ADD CONSTRAINT valid_phone
    CHECK (validate_brazilian_phone(phone));

-- Brazilian email validation (more permissive than strict RFC)
ALTER TABLE patients ADD CONSTRAINT valid_email
    CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- LGPD consent trigger - automatically set consent_date when consent_lgpd becomes true
CREATE OR REPLACE FUNCTION set_consent_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.consent_lgpd = TRUE AND (OLD.consent_lgpd IS NULL OR OLD.consent_lgpd = FALSE) THEN
        NEW.consent_date = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_patient_consent_date BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION set_consent_date();

-- Audit logs table for LGPD compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- created, updated, deleted, viewed, exported, consent_granted, consent_revoked
    entity_type TEXT NOT NULL, -- patient, appointment, session, etc.
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent_hash TEXT, -- hashed for privacy
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for audit logs
CREATE INDEX audit_logs_org_id_idx ON audit_logs(org_id);
CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX audit_logs_entity_idx ON audit_logs(entity_type, entity_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at DESC);
CREATE INDEX audit_logs_action_idx ON audit_logs(action);

-- Function to log patient data access for LGPD compliance
CREATE OR REPLACE FUNCTION log_patient_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        org_id,
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    ) VALUES (
        COALESCE(NEW.org_id, OLD.org_id),
        (SELECT id FROM profiles WHERE auth_user_id = auth.uid()),
        CASE
            WHEN TG_OP = 'INSERT' THEN 'created'
            WHEN TG_OP = 'UPDATE' THEN 'updated'
            WHEN TG_OP = 'DELETE' THEN 'deleted'
        END,
        'patient',
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add audit trigger for patients
CREATE TRIGGER audit_patients_changes AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW EXECUTE FUNCTION log_patient_access();

-- Comments for documentation
COMMENT ON TABLE patients IS 'Patient records with LGPD compliance and Brazilian validation';
COMMENT ON COLUMN patients.cpf IS 'Brazilian CPF (encrypted at application level)';
COMMENT ON COLUMN patients.consent_lgpd IS 'LGPD consent flag - required for data processing';
COMMENT ON COLUMN patients.consent_date IS 'Timestamp when LGPD consent was granted';
COMMENT ON COLUMN patients.consent_version IS 'Version of privacy policy accepted';
COMMENT ON COLUMN patients.address IS 'JSON: {street, city, state, cep, neighborhood, complement}';
COMMENT ON COLUMN patients.emergency_contact IS 'JSON: {name, phone, relationship}';

COMMENT ON TABLE audit_logs IS 'Audit trail for LGPD compliance and security monitoring';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the request (for security monitoring)';
COMMENT ON COLUMN audit_logs.user_agent_hash IS 'Hashed user agent string (privacy preserving)';

-- Function to anonymize patient data (for LGPD right to erasure)
CREATE OR REPLACE FUNCTION anonymize_patient(patient_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE patients SET
        name = 'Paciente Anônimo',
        cpf = NULL,
        email = NULL,
        phone = NULL,
        address = NULL,
        emergency_contact = NULL,
        notes = NULL,
        photo_url = NULL,
        status = 'archived'
    WHERE id = patient_id;

    -- Log the anonymization
    INSERT INTO audit_logs (
        org_id,
        user_id,
        action,
        entity_type,
        entity_id
    ) SELECT
        org_id,
        (SELECT id FROM profiles WHERE auth_user_id = auth.uid()),
        'anonymized',
        'patient',
        id
    FROM patients WHERE id = patient_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;