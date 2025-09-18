-- Migration: Reports System for FisioFlow
-- Description: Create reports and PDF generation system
-- Date: 2025-01-15

-- Create report_templates table
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN (
        'patient_summary',
        'session_report',
        'progress_report',
        'discharge_summary',
        'appointment_summary',
        'financial_report',
        'custom'
    )),
    template_content JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Create generated_reports table
CREATE TABLE IF NOT EXISTS generated_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,
    report_title VARCHAR(200) NOT NULL,
    report_data JSONB NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by UUID REFERENCES profiles(id),
    status VARCHAR(20) DEFAULT 'generated' CHECK (status IN (
        'generating',
        'generated',
        'failed',
        'archived'
    )),
    error_message TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create report_schedules table for automated reports
CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN (
        'daily',
        'weekly',
        'monthly',
        'quarterly',
        'yearly',
        'custom'
    )),
    schedule_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_templates_org_id ON report_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON report_templates(org_id, template_type);
CREATE INDEX IF NOT EXISTS idx_report_templates_active ON report_templates(org_id, is_active);

CREATE INDEX IF NOT EXISTS idx_generated_reports_org_id ON generated_reports(org_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_patient_id ON generated_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_session_id ON generated_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_appointment_id ON generated_reports(appointment_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON generated_reports(org_id, report_type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_at ON generated_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_generated_reports_status ON generated_reports(status);

CREATE INDEX IF NOT EXISTS idx_report_schedules_org_id ON report_schedules(org_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_active ON report_schedules(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON report_schedules(next_run_at);

-- Create updated_at triggers
CREATE TRIGGER update_report_templates_updated_at 
    BEFORE UPDATE ON report_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_schedules_updated_at 
    BEFORE UPDATE ON report_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access report templates from their organization
CREATE POLICY "Users can access org report templates" ON report_templates
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Users can access generated reports from their organization
CREATE POLICY "Users can access org generated reports" ON generated_reports
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Patients can only access their own reports
CREATE POLICY "Patients can access own reports" ON generated_reports
    FOR SELECT USING (
        patient_id IN (
            SELECT p.id FROM patients p
            JOIN org_memberships om ON p.org_id = om.org_id
            WHERE om.user_id = auth.uid() AND om.role = 'paciente'
        )
    );

-- RLS Policy: Users can access report schedules from their organization
CREATE POLICY "Users can access org report schedules" ON report_schedules
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Create function to generate patient summary report
CREATE OR REPLACE FUNCTION generate_patient_summary_report(
    p_patient_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_patient RECORD;
    v_sessions RECORD[];
    v_appointments RECORD[];
    v_pain_points RECORD[];
    v_exercise_stats RECORD;
    v_report_data JSONB;
BEGIN
    -- Get patient information
    SELECT * INTO v_patient
    FROM patients
    WHERE id = p_patient_id;
    
    -- Get sessions in date range
    SELECT array_agg(s.*) INTO v_sessions
    FROM sessions s
    WHERE s.patient_id = p_patient_id
      AND (p_start_date IS NULL OR s.session_date >= p_start_date)
      AND (p_end_date IS NULL OR s.session_date <= p_end_date)
    ORDER BY s.session_date DESC;
    
    -- Get appointments in date range
    SELECT array_agg(a.*) INTO v_appointments
    FROM appointments a
    WHERE a.patient_id = p_patient_id
      AND (p_start_date IS NULL OR a.appointment_date >= p_start_date)
      AND (p_end_date IS NULL OR a.appointment_date <= p_end_date)
    ORDER BY a.appointment_date DESC;
    
    -- Get pain points in date range
    SELECT array_agg(pp.*) INTO v_pain_points
    FROM pain_points pp
    JOIN sessions s ON pp.session_id = s.id
    WHERE s.patient_id = p_patient_id
      AND (p_start_date IS NULL OR s.session_date >= p_start_date)
      AND (p_end_date IS NULL OR s.session_date <= p_end_date)
    ORDER BY pp.assessment_date DESC;
    
    -- Get exercise statistics
    SELECT * INTO v_exercise_stats
    FROM get_exercise_statistics(p_patient_id, p_start_date, p_end_date);
    
    -- Build report data
    v_report_data := jsonb_build_object(
        'patient', row_to_json(v_patient),
        'sessions', COALESCE(v_sessions, '{}'),
        'appointments', COALESCE(v_appointments, '{}'),
        'pain_points', COALESCE(v_pain_points, '{}'),
        'exercise_statistics', row_to_json(v_exercise_stats),
        'report_period', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
        ),
        'generated_at', NOW()
    );
    
    RETURN v_report_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to generate session report
CREATE OR REPLACE FUNCTION generate_session_report(
    p_session_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_session RECORD;
    v_patient RECORD;
    v_therapist RECORD;
    v_pain_points RECORD[];
    v_exercises RECORD[];
    v_report_data JSONB;
BEGIN
    -- Get session information
    SELECT s.*, 
           p.name as patient_name,
           p.cpf as patient_cpf,
           pr.full_name as therapist_name
    INTO v_session
    FROM sessions s
    JOIN patients p ON s.patient_id = p.id
    JOIN profiles pr ON s.therapist_id = pr.id
    WHERE s.id = p_session_id;
    
    -- Get pain points for this session
    SELECT array_agg(pp.*) INTO v_pain_points
    FROM pain_points pp
    WHERE pp.session_id = p_session_id
    ORDER BY pp.assessment_date;
    
    -- Get exercises prescribed for this session
    SELECT array_agg(e.*) INTO v_exercises
    FROM exercise_prescription_items epi
    JOIN exercise_prescriptions ep ON epi.prescription_id = ep.id
    JOIN exercises e ON epi.exercise_id = e.id
    WHERE ep.session_id = p_session_id;
    
    -- Build report data
    v_report_data := jsonb_build_object(
        'session', row_to_json(v_session),
        'pain_points', COALESCE(v_pain_points, '{}'),
        'exercises', COALESCE(v_exercises, '{}'),
        'generated_at', NOW()
    );
    
    RETURN v_report_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to generate progress report
CREATE OR REPLACE FUNCTION generate_progress_report(
    p_patient_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS JSONB AS $$
DECLARE
    v_patient RECORD;
    v_sessions RECORD[];
    v_pain_progress RECORD[];
    v_exercise_progress RECORD[];
    v_report_data JSONB;
BEGIN
    -- Get patient information
    SELECT * INTO v_patient
    FROM patients
    WHERE id = p_patient_id;
    
    -- Get sessions in date range
    SELECT array_agg(s.*) INTO v_sessions
    FROM sessions s
    WHERE s.patient_id = p_patient_id
      AND s.session_date >= p_start_date
      AND s.session_date <= p_end_date
    ORDER BY s.session_date;
    
    -- Get pain progress data
    SELECT array_agg(pp.*) INTO v_pain_progress
    FROM pain_points pp
    JOIN sessions s ON pp.session_id = s.id
    WHERE s.patient_id = p_patient_id
      AND s.session_date >= p_start_date
      AND s.session_date <= p_end_date
    ORDER BY pp.assessment_date;
    
    -- Get exercise progress data
    SELECT array_agg(et.*) INTO v_exercise_progress
    FROM exercise_tracking et
    WHERE et.patient_id = p_patient_id
      AND et.performed_date >= p_start_date
      AND et.performed_date <= p_end_date
    ORDER BY et.performed_date;
    
    -- Build report data
    v_report_data := jsonb_build_object(
        'patient', row_to_json(v_patient),
        'sessions', COALESCE(v_sessions, '{}'),
        'pain_progress', COALESCE(v_pain_progress, '{}'),
        'exercise_progress', COALESCE(v_exercise_progress, '{}'),
        'report_period', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
        ),
        'generated_at', NOW()
    );
    
    RETURN v_report_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up old reports
CREATE OR REPLACE FUNCTION cleanup_old_reports(
    p_days_old INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete expired reports
    DELETE FROM generated_reports
    WHERE expires_at IS NOT NULL 
      AND expires_at < NOW()
      AND status = 'archived';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default report templates
INSERT INTO report_templates (
    id,
    org_id,
    name,
    description,
    template_type,
    template_content,
    is_default,
    created_by,
    updated_by
) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440700',
    '550e8400-e29b-41d4-a716-446655440000',
    'Relatório de Resumo do Paciente',
    'Relatório completo com informações do paciente, sessões e progresso',
    'patient_summary',
    '{
      "sections": [
        {
          "title": "Informações do Paciente",
          "fields": ["name", "cpf", "date_of_birth", "phone", "email"]
        },
        {
          "title": "Histórico Médico",
          "fields": ["medical_history", "current_medications", "allergies"]
        },
        {
          "title": "Sessões Realizadas",
          "fields": ["session_date", "session_type", "therapist_name", "notes"]
        },
        {
          "title": "Pontos de Dor",
          "fields": ["body_region", "pain_intensity", "pain_type", "assessment_date"]
        },
        {
          "title": "Exercícios Prescritos",
          "fields": ["exercise_name", "repetitions", "sets", "frequency"]
        }
      ],
      "formatting": {
        "header": "FisioFlow - Relatório de Paciente",
        "footer": "Gerado em {{generated_at}}",
        "logo": true
      }
    }',
    true,
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440701',
    '550e8400-e29b-41d4-a716-446655440000',
    'Relatório de Sessão',
    'Relatório detalhado de uma sessão específica',
    'session_report',
    '{
      "sections": [
        {
          "title": "Dados da Sessão",
          "fields": ["session_date", "start_time", "end_time", "therapist_name"]
        },
        {
          "title": "Avaliação Subjetiva",
          "fields": ["chief_complaint", "subjective_assessment"]
        },
        {
          "title": "Avaliação Objetiva",
          "fields": ["objective_assessment", "assessment_notes"]
        },
        {
          "title": "Plano de Tratamento",
          "fields": ["treatment_plan", "exercises_prescribed"]
        },
        {
          "title": "Pontos de Dor",
          "fields": ["body_region", "pain_intensity", "pain_type", "clinical_notes"]
        }
      ],
      "formatting": {
        "header": "FisioFlow - Relatório de Sessão",
        "footer": "Sessão realizada em {{session_date}}",
        "logo": true
      }
    }',
    true,
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001'
  )
ON CONFLICT (id) DO NOTHING;
