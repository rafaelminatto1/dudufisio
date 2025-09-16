-- Migration: Appointment Scheduling and Sessions
-- Created: 2025-09-14
-- Description: Creates tables for appointment scheduling and treatment sessions

-- Appointments table - Scheduled treatment sessions with conflict prevention
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    therapist_id UUID REFERENCES profiles(id) ON DELETE RESTRICT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
    type TEXT DEFAULT 'consulta', -- avaliacao, tratamento, reavaliacao, retorno
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (ends_at > starts_at),
    CONSTRAINT valid_cancellation CHECK (
        (status = 'cancelled' AND cancellation_reason IS NOT NULL AND cancelled_by IS NOT NULL AND cancelled_at IS NOT NULL)
        OR (status != 'cancelled' AND cancellation_reason IS NULL AND cancelled_by IS NULL AND cancelled_at IS NULL)
    )
);

-- Critical index to prevent double-booking (unique constraint)
CREATE UNIQUE INDEX appointments_therapist_time_idx ON appointments(therapist_id, starts_at)
    WHERE status NOT IN ('cancelled', 'no_show');

-- Performance indexes
CREATE INDEX appointments_org_id_idx ON appointments(org_id);
CREATE INDEX appointments_patient_id_idx ON appointments(patient_id, starts_at DESC);
CREATE INDEX appointments_therapist_id_idx ON appointments(therapist_id, starts_at DESC);
CREATE INDEX appointments_starts_at_idx ON appointments(starts_at);
CREATE INDEX appointments_status_idx ON appointments(status);
CREATE INDEX appointments_created_at_idx ON appointments(created_at DESC);

-- Sessions table - Completed treatment documentation
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    therapist_id UUID REFERENCES profiles(id) ON DELETE RESTRICT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    pain_level_before INT2 CHECK (pain_level_before BETWEEN 0 AND 10),
    pain_level_after INT2 CHECK (pain_level_after BETWEEN 0 AND 10),
    procedures_performed TEXT,
    exercises_prescribed TEXT,
    patient_response TEXT,
    therapist_notes TEXT,
    next_session_notes TEXT,
    duration_minutes INT2 CHECK (duration_minutes > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for sessions
CREATE INDEX sessions_org_id_idx ON sessions(org_id);
CREATE INDEX sessions_patient_id_idx ON sessions(patient_id, date DESC, created_at DESC);
CREATE INDEX sessions_therapist_id_idx ON sessions(therapist_id, date DESC);
CREATE INDEX sessions_appointment_id_idx ON sessions(appointment_id);
CREATE INDEX sessions_date_idx ON sessions(date DESC);
CREATE INDEX sessions_created_at_idx ON sessions(created_at DESC);

-- Add updated_at triggers
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update appointment status when session is created
CREATE OR REPLACE FUNCTION update_appointment_status_on_session()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.appointment_id IS NOT NULL THEN
        UPDATE appointments
        SET status = 'completed',
            updated_at = NOW()
        WHERE id = NEW.appointment_id
        AND status = 'in_progress';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_updates_appointment AFTER INSERT ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_appointment_status_on_session();

-- Function to check therapist availability (prevents double booking)
CREATE OR REPLACE FUNCTION check_therapist_availability(
    p_therapist_id UUID,
    p_starts_at TIMESTAMPTZ,
    p_ends_at TIMESTAMPTZ,
    p_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO conflict_count
    FROM appointments
    WHERE therapist_id = p_therapist_id
      AND status NOT IN ('cancelled', 'no_show')
      AND (p_appointment_id IS NULL OR id != p_appointment_id)
      AND (
          (starts_at <= p_starts_at AND ends_at > p_starts_at)
          OR (starts_at < p_ends_at AND ends_at >= p_ends_at)
          OR (starts_at >= p_starts_at AND ends_at <= p_ends_at)
      );

    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to validate appointment before insert/update
CREATE OR REPLACE FUNCTION validate_appointment()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if therapist is available
    IF NOT check_therapist_availability(
        NEW.therapist_id,
        NEW.starts_at,
        NEW.ends_at,
        NEW.id
    ) THEN
        RAISE EXCEPTION 'Fisioterapeuta não está disponível no horário solicitado';
    END IF;

    -- Set cancellation timestamp
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        NEW.cancelled_at = NOW();
        NEW.cancelled_by = (SELECT id FROM profiles WHERE auth_user_id = auth.uid());
    END IF;

    -- Validate therapist belongs to the same organization as patient
    IF NOT EXISTS (
        SELECT 1 FROM org_memberships om1
        JOIN org_memberships om2 ON om1.org_id = om2.org_id
        WHERE om1.profile_id = NEW.therapist_id
        AND om2.profile_id = (
            SELECT (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
        )
        AND om1.org_id = NEW.org_id
    ) THEN
        RAISE EXCEPTION 'Fisioterapeuta deve pertencer à mesma organização';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_appointment_trigger BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION validate_appointment();

-- Function to automatically create session from appointment
CREATE OR REPLACE FUNCTION create_session_from_appointment(appointment_id UUID)
RETURNS UUID AS $$
DECLARE
    new_session_id UUID;
    apt_data RECORD;
BEGIN
    -- Get appointment data
    SELECT * INTO apt_data FROM appointments WHERE id = appointment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Agendamento não encontrado';
    END IF;

    -- Create session
    INSERT INTO sessions (
        org_id,
        appointment_id,
        patient_id,
        therapist_id,
        date,
        duration_minutes
    ) VALUES (
        apt_data.org_id,
        apt_data.id,
        apt_data.patient_id,
        apt_data.therapist_id,
        apt_data.starts_at::DATE,
        EXTRACT(EPOCH FROM (apt_data.ends_at - apt_data.starts_at)) / 60
    ) RETURNING id INTO new_session_id;

    -- Update appointment status
    UPDATE appointments
    SET status = 'completed',
        updated_at = NOW()
    WHERE id = appointment_id;

    RETURN new_session_id;
END;
$$ LANGUAGE plpgsql;

-- Audit triggers for appointments and sessions
CREATE TRIGGER audit_appointments_changes AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION log_patient_access();

CREATE TRIGGER audit_sessions_changes AFTER INSERT OR UPDATE OR DELETE ON sessions
    FOR EACH ROW EXECUTE FUNCTION log_patient_access();

-- View for therapist schedule (useful for calendar displays)
CREATE VIEW therapist_schedule AS
SELECT
    a.id,
    a.org_id,
    a.therapist_id,
    p.name as therapist_name,
    a.patient_id,
    pt.name as patient_name,
    a.starts_at,
    a.ends_at,
    a.status,
    a.type,
    a.notes,
    EXTRACT(EPOCH FROM (a.ends_at - a.starts_at)) / 60 as duration_minutes
FROM appointments a
JOIN profiles p ON a.therapist_id = p.id
JOIN patients pt ON a.patient_id = pt.id
WHERE a.status NOT IN ('cancelled');

-- View for patient appointments history
CREATE VIEW patient_appointments AS
SELECT
    a.id,
    a.org_id,
    a.patient_id,
    pt.name as patient_name,
    a.therapist_id,
    p.name as therapist_name,
    a.starts_at,
    a.ends_at,
    a.status,
    a.type,
    a.notes,
    s.id as session_id,
    s.pain_level_before,
    s.pain_level_after,
    s.procedures_performed
FROM appointments a
JOIN profiles p ON a.therapist_id = p.id
JOIN patients pt ON a.patient_id = pt.id
LEFT JOIN sessions s ON a.id = s.appointment_id
ORDER BY a.starts_at DESC;

-- Comments for documentation
COMMENT ON TABLE appointments IS 'Scheduled treatment sessions with conflict prevention';
COMMENT ON COLUMN appointments.type IS 'Appointment type: avaliacao, tratamento, reavaliacao, retorno';
COMMENT ON COLUMN appointments.status IS 'Appointment status with workflow: scheduled → confirmed → in_progress → completed';

COMMENT ON TABLE sessions IS 'Completed treatment sessions with clinical documentation';
COMMENT ON COLUMN sessions.pain_level_before IS 'Pain level before treatment (0-10 scale)';
COMMENT ON COLUMN sessions.pain_level_after IS 'Pain level after treatment (0-10 scale)';
COMMENT ON COLUMN sessions.duration_minutes IS 'Actual session duration in minutes';

COMMENT ON VIEW therapist_schedule IS 'Therapist calendar view with patient and appointment details';
COMMENT ON VIEW patient_appointments IS 'Patient appointment history with session data';