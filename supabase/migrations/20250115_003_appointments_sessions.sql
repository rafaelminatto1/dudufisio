-- Migration: Appointments and Sessions for FisioFlow
-- Description: Create appointment scheduling and session management tables
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
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    appointment_type VARCHAR(50) NOT NULL CHECK (appointment_type IN (
        'consulta', 'retorno', 'avaliacao', 'fisioterapia', 'reavaliacao', 'emergencia'
    )),
    status VARCHAR(50) DEFAULT 'agendado' CHECK (status IN (
        'agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'falta'
    )),
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMPTZ,
    
    -- Recurring appointments
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(20) CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly')),
    recurrence_count INTEGER CHECK (recurrence_count > 0),
    recurrence_days INTEGER[],
    parent_appointment_id UUID REFERENCES appointments(id),
    
    -- Conflict prevention
    conflict_resolution VARCHAR(20) DEFAULT 'prevent' CHECK (conflict_resolution IN (
        'prevent', 'allow', 'suggest_alternative'
    )),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id),
    
    -- Ensure no overlapping appointments for same practitioner
    EXCLUDE USING gist (
        practitioner_id WITH =,
        tsrange(
            (appointment_date + start_time)::timestamp,
            (appointment_date + end_time)::timestamp
        ) WITH &&
    ) WHERE (status NOT IN ('cancelado', 'falta'))
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
    status VARCHAR(50) DEFAULT 'agendada' CHECK (status IN (
        'agendada', 'em_andamento', 'concluida', 'cancelada', 'falta'
    )),
    
    -- Session content
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN (
        'avaliacao_inicial', 'tratamento', 'reavaliacao', 'alta', 'emergencia'
    )),
    chief_complaint TEXT,
    subjective_assessment TEXT,
    objective_assessment TEXT,
    assessment_notes TEXT,
    treatment_plan TEXT,
    exercises_prescribed TEXT[],
    pain_level_before INTEGER CHECK (pain_level_before >= 0 AND pain_level_before <= 10),
    pain_level_after INTEGER CHECK (pain_level_after >= 0 AND pain_level_after <= 10),
    session_notes TEXT,
    next_session_recommendations TEXT,
    
    -- Progress tracking
    progress_notes TEXT,
    improvement_areas TEXT[],
    concerns TEXT[],
    patient_feedback TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Create pain_points table for body mapping
CREATE TABLE IF NOT EXISTS pain_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    body_region VARCHAR(100) NOT NULL,
    x_coordinate DECIMAL(5,2) NOT NULL CHECK (x_coordinate >= 0 AND x_coordinate <= 100),
    y_coordinate DECIMAL(5,2) NOT NULL CHECK (y_coordinate >= 0 AND y_coordinate <= 100),
    pain_intensity INTEGER NOT NULL CHECK (pain_intensity >= 0 AND pain_intensity <= 10),
    pain_type VARCHAR(50) CHECK (pain_type IN (
        'aguda', 'cronica', 'latejante', 'queimacao', 'formigamento', 
        'dormencia', 'rigidez', 'outro'
    )),
    pain_description TEXT,
    clinical_notes TEXT,
    assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN (
        'initial', 'progress', 'discharge', 'followup'
    )),
    improvement_notes TEXT,
    assessment_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Create appointment_reminders table
CREATE TABLE IF NOT EXISTS appointment_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN (
        'email', 'sms', 'push', 'whatsapp'
    )),
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'sent', 'failed', 'cancelled'
    )),
    message_content TEXT,
    recipient_contact VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointment_conflicts table for conflict tracking
CREATE TABLE IF NOT EXISTS appointment_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    conflicting_appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    conflict_type VARCHAR(50) NOT NULL CHECK (conflict_type IN (
        'time_overlap', 'practitioner_double_booking', 'room_conflict'
    )),
    conflict_severity VARCHAR(20) DEFAULT 'medium' CHECK (conflict_severity IN (
        'low', 'medium', 'high', 'critical'
    )),
    resolution_status VARCHAR(50) DEFAULT 'unresolved' CHECK (resolution_status IN (
        'unresolved', 'resolved', 'ignored', 'auto_resolved'
    )),
    resolution_notes TEXT,
    resolved_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_org_id ON appointments(org_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_practitioner_id ON appointments(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(org_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(org_id, appointment_type);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(practitioner_id, appointment_date, start_time);

CREATE INDEX IF NOT EXISTS idx_sessions_org_id ON sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_sessions_appointment_id ON sessions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_sessions_patient_id ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_id ON sessions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(org_id, status);

CREATE INDEX IF NOT EXISTS idx_pain_points_org_id ON pain_points(org_id);
CREATE INDEX IF NOT EXISTS idx_pain_points_session_id ON pain_points(session_id);
CREATE INDEX IF NOT EXISTS idx_pain_points_patient_id ON pain_points(patient_id);
CREATE INDEX IF NOT EXISTS idx_pain_points_assessment_date ON pain_points(assessment_date);

CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment_id ON appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_scheduled_for ON appointment_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_status ON appointment_reminders(status);

CREATE INDEX IF NOT EXISTS idx_appointment_conflicts_appointment_id ON appointment_conflicts(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_conflicts_resolution_status ON appointment_conflicts(resolution_status);

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

-- Create RLS policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pain_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_conflicts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access appointments from their organization
CREATE POLICY "Users can access org appointments" ON appointments
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Patients can only access their own appointments
CREATE POLICY "Patients can access own appointments" ON appointments
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

-- RLS Policy: Patients can only access their own sessions
CREATE POLICY "Patients can access own sessions" ON sessions
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

-- RLS Policy: Patients can only access their own pain points
CREATE POLICY "Patients can access own pain points" ON pain_points
    FOR SELECT USING (
        patient_id IN (
            SELECT p.id FROM patients p
            JOIN org_memberships om ON p.org_id = om.org_id
            WHERE om.user_id = auth.uid() AND om.role = 'paciente'
        )
    );

-- RLS Policy: Users can access reminders from their organization
CREATE POLICY "Users can access org reminders" ON appointment_reminders
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Users can access conflicts from their organization
CREATE POLICY "Users can access org conflicts" ON appointment_conflicts
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Create function to check appointment conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflicts(
    p_practitioner_id UUID,
    p_appointment_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS TABLE(
    conflict_id UUID,
    conflict_type VARCHAR(50),
    severity VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as conflict_id,
        'time_overlap'::VARCHAR(50) as conflict_type,
        CASE 
            WHEN (a.start_time < p_start_time AND a.end_time > p_start_time) OR
                 (a.start_time < p_end_time AND a.end_time > p_end_time) OR
                 (a.start_time >= p_start_time AND a.end_time <= p_end_time)
            THEN 'high'::VARCHAR(20)
            ELSE 'medium'::VARCHAR(20)
        END as severity
    FROM appointments a
    WHERE a.practitioner_id = p_practitioner_id
      AND a.appointment_date = p_appointment_date
      AND a.status NOT IN ('cancelado', 'falta')
      AND (p_exclude_appointment_id IS NULL OR a.id != p_exclude_appointment_id)
      AND (
          (a.start_time < p_start_time AND a.end_time > p_start_time) OR
          (a.start_time < p_end_time AND a.end_time > p_end_time) OR
          (a.start_time >= p_start_time AND a.end_time <= p_end_time)
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to generate appointment reminders
CREATE OR REPLACE FUNCTION generate_appointment_reminders(p_appointment_id UUID)
RETURNS VOID AS $$
DECLARE
    v_appointment RECORD;
    v_reminder_times TIMESTAMPTZ[];
    v_reminder_time TIMESTAMPTZ;
BEGIN
    -- Get appointment details
    SELECT * INTO v_appointment
    FROM appointments
    WHERE id = p_appointment_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Define reminder times (24h, 2h, 30min before)
    v_reminder_times := ARRAY[
        (v_appointment.appointment_date + v_appointment.start_time) - INTERVAL '24 hours',
        (v_appointment.appointment_date + v_appointment.start_time) - INTERVAL '2 hours',
        (v_appointment.appointment_date + v_appointment.start_time) - INTERVAL '30 minutes'
    ];
    
    -- Create reminders
    FOREACH v_reminder_time IN ARRAY v_reminder_times
    LOOP
        -- Only create future reminders
        IF v_reminder_time > NOW() THEN
            INSERT INTO appointment_reminders (
                org_id,
                appointment_id,
                reminder_type,
                scheduled_for,
                message_content,
                recipient_contact
            ) VALUES (
                v_appointment.org_id,
                p_appointment_id,
                'email',
                v_reminder_time,
                'Lembrete: Você tem uma consulta agendada para ' || 
                to_char(v_appointment.appointment_date, 'DD/MM/YYYY') || 
                ' às ' || v_appointment.start_time,
                v_appointment.patient_id::TEXT -- This would be replaced with actual contact
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get available time slots
CREATE OR REPLACE FUNCTION get_available_time_slots(
    p_practitioner_id UUID,
    p_appointment_date DATE,
    p_duration_minutes INTEGER DEFAULT 60
)
RETURNS TABLE(
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN
) AS $$
DECLARE
    v_start_time TIME := '08:00'::TIME;
    v_end_time TIME := '18:00'::TIME;
    v_slot_duration INTERVAL := (p_duration_minutes || ' minutes')::INTERVAL;
    v_current_slot TIME;
    v_slot_end TIME;
    v_conflict_count INTEGER;
BEGIN
    v_current_slot := v_start_time;
    
    WHILE v_current_slot < v_end_time LOOP
        v_slot_end := (v_current_slot + v_slot_duration)::TIME;
        
        -- Check for conflicts
        SELECT COUNT(*) INTO v_conflict_count
        FROM appointments
        WHERE practitioner_id = p_practitioner_id
          AND appointment_date = p_appointment_date
          AND status NOT IN ('cancelado', 'falta')
          AND (
              (start_time < v_current_slot AND end_time > v_current_slot) OR
              (start_time < v_slot_end AND end_time > v_slot_end) OR
              (start_time >= v_current_slot AND end_time <= v_slot_end)
          );
        
        RETURN QUERY SELECT 
            v_current_slot,
            v_slot_end,
            (v_conflict_count = 0) as is_available;
        
        v_current_slot := (v_current_slot + v_slot_duration)::TIME;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to generate reminders when appointment is created
CREATE OR REPLACE FUNCTION trigger_generate_reminders()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate reminders for new appointments
    IF TG_OP = 'INSERT' AND NEW.status = 'agendado' THEN
        PERFORM generate_appointment_reminders(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_reminders_trigger
    AFTER INSERT ON appointments
    FOR EACH ROW EXECUTE FUNCTION trigger_generate_reminders();
