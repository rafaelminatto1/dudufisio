-- Migration: Row Level Security Policies
-- Description: Comprehensive RLS policies for multi-tenant data isolation and Brazilian healthcare compliance
-- Date: 2025-09-14
-- Author: FisioFlow Team

-- Enable RLS on all tables
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pain_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_body_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create helper view for user organization access
CREATE OR REPLACE VIEW v_user_orgs AS
SELECT om.org_id, om.user_id, om.role
FROM org_memberships om
WHERE om.user_id = auth.uid()
  AND om.status = 'active';

-- Create security definer function for org access validation
CREATE OR REPLACE FUNCTION user_has_org_access(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM org_memberships
        WHERE user_id = auth.uid()
          AND org_id = target_org_id
          AND status = 'active'
    );
END;
$$;

-- Create function to get user role in organization
CREATE OR REPLACE FUNCTION get_user_role_in_org(target_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM org_memberships
    WHERE user_id = auth.uid()
      AND org_id = target_org_id
      AND status = 'active';

    RETURN COALESCE(user_role, 'none');
END;
$$;

-- Create function to check if user can access patient data
CREATE OR REPLACE FUNCTION can_access_patient(target_patient_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    patient_org_id UUID;
    user_role TEXT;
    is_patient_owner BOOLEAN := FALSE;
BEGIN
    -- Get patient's organization
    SELECT org_id INTO patient_org_id
    FROM patients
    WHERE id = target_patient_id;

    -- Check if user has access to the organization
    IF NOT user_has_org_access(patient_org_id) THEN
        RETURN FALSE;
    END IF;

    -- Get user role
    user_role := get_user_role_in_org(patient_org_id);

    -- Admin and Fisioterapeuta have full access
    IF user_role IN ('admin', 'fisioterapeuta') THEN
        RETURN TRUE;
    END IF;

    -- Estagiario has read-only access
    IF user_role = 'estagiario' THEN
        RETURN TRUE;
    END IF;

    -- Paciente can only access their own data
    IF user_role = 'paciente' THEN
        SELECT EXISTS (
            SELECT 1 FROM patients p
            JOIN profiles pr ON pr.id = auth.uid()
            WHERE p.id = target_patient_id
              AND p.cpf = pr.cpf
        ) INTO is_patient_owner;

        RETURN is_patient_owner;
    END IF;

    RETURN FALSE;
END;
$$;

-- RLS Policies for orgs table
CREATE POLICY "Users can view their organizations"
    ON orgs FOR SELECT
    TO authenticated
    USING (user_has_org_access(id));

CREATE POLICY "Only admins can modify organizations"
    ON orgs FOR ALL
    TO authenticated
    USING (get_user_role_in_org(id) = 'admin');

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Profiles can be created during signup"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- RLS Policies for org_memberships table
CREATE POLICY "Users can view memberships in their organizations"
    ON org_memberships FOR SELECT
    TO authenticated
    USING (
        user_has_org_access(org_id) AND
        get_user_role_in_org(org_id) IN ('admin', 'fisioterapeuta')
    );

CREATE POLICY "Only admins can manage org memberships"
    ON org_memberships FOR ALL
    TO authenticated
    USING (get_user_role_in_org(org_id) = 'admin');

-- RLS Policies for patients table
CREATE POLICY "Healthcare professionals can view patients in their org"
    ON patients FOR SELECT
    TO authenticated
    USING (
        user_has_org_access(org_id) AND
        get_user_role_in_org(org_id) IN ('admin', 'fisioterapeuta', 'estagiario')
    );

CREATE POLICY "Patients can view their own data"
    ON patients FOR SELECT
    TO authenticated
    USING (
        user_has_org_access(org_id) AND
        get_user_role_in_org(org_id) = 'paciente' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND cpf = patients.cpf
        )
    );

CREATE POLICY "Healthcare professionals can create patients"
    ON patients FOR INSERT
    TO authenticated
    WITH CHECK (
        user_has_org_access(org_id) AND
        get_user_role_in_org(org_id) IN ('admin', 'fisioterapeuta')
    );

CREATE POLICY "Healthcare professionals can update patients"
    ON patients FOR UPDATE
    TO authenticated
    USING (
        user_has_org_access(org_id) AND
        get_user_role_in_org(org_id) IN ('admin', 'fisioterapeuta')
    );

CREATE POLICY "Patients can update their own contact info"
    ON patients FOR UPDATE
    TO authenticated
    USING (
        user_has_org_access(org_id) AND
        get_user_role_in_org(org_id) = 'paciente' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND cpf = patients.cpf
        )
    )
    WITH CHECK (
        -- Patients can only update specific fields
        OLD.cpf = NEW.cpf AND
        OLD.name = NEW.name AND
        OLD.date_of_birth = NEW.date_of_birth AND
        OLD.org_id = NEW.org_id
    );

-- RLS Policies for appointments table
CREATE POLICY "Organization members can view appointments"
    ON appointments FOR SELECT
    TO authenticated
    USING (
        user_has_org_access(org_id) AND
        (
            get_user_role_in_org(org_id) IN ('admin', 'fisioterapeuta', 'estagiario') OR
            (get_user_role_in_org(org_id) = 'paciente' AND can_access_patient(patient_id))
        )
    );

CREATE POLICY "Healthcare professionals can manage appointments"
    ON appointments FOR ALL
    TO authenticated
    USING (
        user_has_org_access(org_id) AND
        get_user_role_in_org(org_id) IN ('admin', 'fisioterapeuta')
    );

-- RLS Policies for sessions table
CREATE POLICY "Healthcare professionals can view sessions"
    ON sessions FOR SELECT
    TO authenticated
    USING (
        user_has_org_access(org_id) AND
        (
            get_user_role_in_org(org_id) IN ('admin', 'fisioterapeuta', 'estagiario') OR
            (get_user_role_in_org(org_id) = 'paciente' AND can_access_patient(patient_id))
        )
    );

CREATE POLICY "Healthcare professionals can create sessions"
    ON sessions FOR INSERT
    TO authenticated
    WITH CHECK (
        user_has_org_access(org_id) AND
        get_user_role_in_org(org_id) IN ('admin', 'fisioterapeuta')
    );

CREATE POLICY "Healthcare professionals can update sessions"
    ON sessions FOR UPDATE
    TO authenticated
    USING (
        user_has_org_access(org_id) AND
        get_user_role_in_org(org_id) IN ('admin', 'fisioterapeuta')
    );

-- RLS Policies for pain_points table
CREATE POLICY "Healthcare professionals can view pain points"
    ON pain_points FOR SELECT
    TO authenticated
    USING (
        user_has_org_access(org_id) AND
        (
            get_user_role_in_org(org_id) IN ('admin', 'fisioterapeuta', 'estagiario') OR
            (get_user_role_in_org(org_id) = 'paciente' AND can_access_patient(patient_id))
        )
    );

CREATE POLICY "Healthcare professionals can manage pain points"
    ON pain_points FOR ALL
    TO authenticated
    USING (
        user_has_org_access(org_id) AND
        get_user_role_in_org(org_id) IN ('admin', 'fisioterapeuta')
    );

-- RLS Policies for body_assessments table
CREATE POLICY "Healthcare professionals can view body assessments"
    ON body_assessments FOR SELECT
    TO authenticated
    USING (
        user_has_org_access(org_id) AND
        (
            get_user_role_in_org(org_id) IN ('admin', 'fisioterapeuta', 'estagiario') OR
            (get_user_role_in_org(org_id) = 'paciente' AND can_access_patient(patient_id))
        )
    );

CREATE POLICY "Healthcare professionals can manage body assessments"
    ON body_assessments FOR ALL
    TO authenticated
    USING (
        user_has_org_access(org_id) AND
        get_user_role_in_org(org_id) IN ('admin', 'fisioterapeuta')
    );

-- RLS Policies for exercise_body_targets table
CREATE POLICY "Organization members can view exercise targets"
    ON exercise_body_targets FOR SELECT
    TO authenticated
    USING (user_has_org_access(org_id));

CREATE POLICY "Healthcare professionals can manage exercise targets"
    ON exercise_body_targets FOR ALL
    TO authenticated
    USING (
        user_has_org_access(org_id) AND
        get_user_role_in_org(org_id) IN ('admin', 'fisioterapeuta')
    );

-- RLS Policies for body_regions table (public reference data)
CREATE POLICY "Anyone can view body regions"
    ON body_regions FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for audit_logs table
CREATE POLICY "Only admins can view audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (
        user_has_org_access(org_id) AND
        get_user_role_in_org(org_id) = 'admin'
    );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON v_user_orgs TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_org_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role_in_org(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_patient(UUID) TO authenticated;

-- Create indexes for RLS performance optimization
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_org_active
    ON org_memberships(user_id, org_id)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_patients_org_cpf
    ON patients(org_id, cpf);

CREATE INDEX IF NOT EXISTS idx_profiles_cpf
    ON profiles(cpf)
    WHERE cpf IS NOT NULL;

-- Additional security functions for LGPD compliance

-- Function to check data access consent
CREATE OR REPLACE FUNCTION check_lgpd_consent(target_patient_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    consent_valid BOOLEAN := FALSE;
BEGIN
    SELECT p.consent_lgpd AND p.consent_date >= (NOW() - INTERVAL '2 years')
    INTO consent_valid
    FROM patients p
    WHERE p.id = target_patient_id;

    RETURN COALESCE(consent_valid, FALSE);
END;
$$;

-- Function to log LGPD data access
CREATE OR REPLACE FUNCTION log_patient_data_access(
    patient_id UUID,
    access_type TEXT,
    accessed_fields TEXT[] DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    patient_org_id UUID;
BEGIN
    SELECT org_id INTO patient_org_id
    FROM patients p
    WHERE p.id = patient_id;

    INSERT INTO audit_logs (
        table_name, operation, record_id, org_id,
        additional_data, user_id, timestamp
    ) VALUES (
        'patients', access_type, patient_id, patient_org_id,
        jsonb_build_object(
            'accessed_fields', accessed_fields,
            'access_type', access_type,
            'lgpd_logged', true
        ),
        auth.uid(), NOW()
    );
END;
$$;

-- Create view for patient data access logging
CREATE OR REPLACE VIEW v_patient_access_log AS
SELECT
    al.timestamp,
    al.user_id,
    p.email as user_email,
    al.record_id as patient_id,
    pat.name as patient_name,
    al.operation,
    al.additional_data->>'access_type' as access_type,
    al.additional_data->'accessed_fields' as accessed_fields
FROM audit_logs al
JOIN profiles p ON p.id = al.user_id
LEFT JOIN patients pat ON pat.id = al.record_id::UUID
WHERE al.table_name = 'patients'
  AND al.additional_data->>'lgpd_logged' = 'true'
ORDER BY al.timestamp DESC;

-- Grant access to LGPD functions
GRANT EXECUTE ON FUNCTION check_lgpd_consent(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_patient_data_access(UUID, TEXT, TEXT[]) TO authenticated;

-- Policy to ensure LGPD consent checking
CREATE OR REPLACE FUNCTION enforce_lgpd_consent()
RETURNS TRIGGER AS $$
BEGIN
    -- Only apply to patient data access, not to healthcare professional operations
    IF get_user_role_in_org(NEW.org_id) = 'paciente' THEN
        IF NOT check_lgpd_consent(NEW.id) THEN
            RAISE EXCEPTION 'LGPD: Consentimento expirado ou inexistente para acesso aos dados do paciente'
                USING ERRCODE = 'P0001';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply LGPD consent checking to patient data access
CREATE TRIGGER enforce_lgpd_consent_trigger
    BEFORE SELECT ON patients
    FOR EACH ROW
    WHEN (get_user_role_in_org(NEW.org_id) = 'paciente')
    EXECUTE FUNCTION enforce_lgpd_consent();

-- Comments for documentation
COMMENT ON FUNCTION user_has_org_access IS 'Verifica se usuário tem acesso à organização';
COMMENT ON FUNCTION get_user_role_in_org IS 'Retorna o papel do usuário na organização';
COMMENT ON FUNCTION can_access_patient IS 'Verifica se usuário pode acessar dados do paciente';
COMMENT ON FUNCTION check_lgpd_consent IS 'Verifica validade do consentimento LGPD';
COMMENT ON FUNCTION log_patient_data_access IS 'Registra acesso aos dados do paciente para LGPD';
COMMENT ON VIEW v_user_orgs IS 'View com organizações acessíveis ao usuário atual';
COMMENT ON VIEW v_patient_access_log IS 'Log de acessos aos dados de pacientes para auditoria LGPD';