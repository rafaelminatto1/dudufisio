-- Migration: Appointments and Sessions for FisioFlow
-- Description: Create appointment and session management tables
-- Date: 2025-01-15

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    practitioner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Create pain_points table for pain mapping
CREATE TABLE IF NOT EXISTS pain_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    body_region VARCHAR(50) NOT NULL,
    x_coordinate DECIMAL(5,2),
    y_coordinate DECIMAL(5,2),
    pain_intensity INTEGER NOT NULL CHECK (pain_intensity >= 0 AND pain_intensity <= 10),
    pain_type VARCHAR(50) CHECK (pain_type IN (
        'aguda', 'cronica', 'intermitente', 'constante', 'pontual', 'difusa'
    )),
    pain_description TEXT,
    clinical_notes TEXT,
    assessment_type VARCHAR(50) DEFAULT 'initial' CHECK (assessment_type IN (
        'initial', 'progress', 'final'
    )),
    improvement_notes TEXT,
    assessment_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Create appointment_notes table for additional notes
CREATE TABLE IF NOT EXISTS appointment_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    note_type VARCHAR(50) NOT NULL CHECK (note_type IN (
        'observacao', 'lembrete', 'evolucao', 'comportamento', 'medicamento', 'outro'
    )),
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Create waiting_list table for appointment management
CREATE TABLE IF NOT EXISTS waiting_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    requested_appointment_type VARCHAR(50) NOT NULL,
    preferred_date DATE,
    preferred_time TIME,
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    status VARCHAR(20) DEFAULT 'aguardando' CHECK (status IN (
        'aguardando', 'contatado', 'agendado', 'cancelado', 'removido'
    )),
    notes TEXT,
    contact_attempts INTEGER DEFAULT 0,
    last_contact_attempt TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_org_id ON appointments(org_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_practitioner_id ON appointments(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(appointment_type);

CREATE INDEX IF NOT EXISTS idx_sessions_org_id ON sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_sessions_appointment_id ON sessions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_sessions_patient_id ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_id ON sessions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

CREATE INDEX IF NOT EXISTS idx_pain_points_session_id ON pain_points(session_id);
CREATE INDEX IF NOT EXISTS idx_pain_points_patient_id ON pain_points(patient_id);
CREATE INDEX IF NOT EXISTS idx_pain_points_body_region ON pain_points(body_region);
CREATE INDEX IF NOT EXISTS idx_pain_points_assessment_date ON pain_points(assessment_date);

CREATE INDEX IF NOT EXISTS idx_appointment_notes_appointment_id ON appointment_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_notes_session_id ON appointment_notes(session_id);

CREATE INDEX IF NOT EXISTS idx_waiting_list_org_id ON waiting_list(org_id);
CREATE INDEX IF NOT EXISTS idx_waiting_list_patient_id ON waiting_list(patient_id);
CREATE INDEX IF NOT EXISTS idx_waiting_list_status ON waiting_list(status);
CREATE INDEX IF NOT EXISTS idx_waiting_list_priority ON waiting_list(priority);

-- Create updated_at triggers
CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pain_points_updated_at 
    BEFORE UPDATE ON pain_points 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointment_notes_updated_at 
    BEFORE UPDATE ON appointment_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waiting_list_updated_at 
    BEFORE UPDATE ON waiting_list 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pain_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access appointments from their organization
CREATE POLICY "Users can access org appointments" ON appointments
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Patients can view their own appointments
CREATE POLICY "Patients can view own appointments" ON appointments
    FOR SELECT USING (
        patient_id IN (
            SELECT p.id FROM patients p
            JOIN org_memberships om ON p.org_id = om.org_id
            WHERE om.user_id = auth.uid() AND om.role = 'paciente'
        )
    );

-- RLS Policy: Users can access sessions from their organization
CREATE POLICY "Users can access org sessions" ON sessions
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Patients can view their own sessions
CREATE POLICY "Patients can view own sessions" ON sessions
    FOR SELECT USING (
        patient_id IN (
            SELECT p.id FROM patients p
            JOIN org_memberships om ON p.org_id = om.org_id
            WHERE om.user_id = auth.uid() AND om.role = 'paciente'
        )
    );

-- RLS Policy: Users can access pain points from their organization
CREATE POLICY "Users can access org pain points" ON pain_points
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Users can access appointment notes from their organization
CREATE POLICY "Users can access org appointment notes" ON appointment_notes
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Users can access waiting list from their organization
CREATE POLICY "Users can access org waiting list" ON waiting_list
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Create function to automatically create session from appointment
CREATE OR REPLACE FUNCTION create_session_from_appointment()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create session when appointment status changes to 'em_andamento'
    IF NEW.status = 'em_andamento' AND (OLD.status IS NULL OR OLD.status != 'em_andamento') THEN
        INSERT INTO sessions (
            org_id,
            appointment_id,
            patient_id,
            therapist_id,
            session_date,
            start_time,
            status,
            session_type,
            created_by,
            updated_by
        ) VALUES (
            NEW.org_id,
            NEW.id,
            NEW.patient_id,
            NEW.practitioner_id,
            NEW.appointment_date,
            (NEW.appointment_date::text || ' ' || NEW.start_time::text)::timestamp,
            'em_andamento',
            CASE 
                WHEN NEW.appointment_type = 'consulta' THEN 'avaliacao_inicial'
                WHEN NEW.appointment_type = 'avaliacao' THEN 'avaliacao_progresso'
                ELSE 'fisioterapia'
            END,
            NEW.updated_by,
            NEW.updated_by
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic session creation
CREATE TRIGGER trigger_create_session_from_appointment
    AFTER UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION create_session_from_appointment();

-- Create function to calculate session duration
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate duration when end_time is set
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for duration calculation
CREATE TRIGGER trigger_calculate_session_duration
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION calculate_session_duration();
