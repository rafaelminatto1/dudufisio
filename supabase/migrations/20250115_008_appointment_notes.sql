-- Migration: Appointment Notes System for FisioFlow
-- Description: Add appointment notes and enhance appointment functionality
-- Date: 2025-01-15

-- Create appointment_notes table
CREATE TABLE IF NOT EXISTS appointment_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    note_type VARCHAR(20) DEFAULT 'general' CHECK (note_type IN ('general', 'medical', 'administrative')),
    is_private BOOLEAN DEFAULT false,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add additional fields to appointments table if not exists
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS parent_appointment_id UUID REFERENCES appointments(id);

-- Create waiting_list table for appointment queuing
CREATE TABLE IF NOT EXISTS appointment_waiting_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    practitioner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    preferred_date DATE,
    preferred_time_start TIME,
    preferred_time_end TIME,
    appointment_type VARCHAR(50) NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    priority INTEGER DEFAULT 0,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'notified', 'scheduled', 'expired', 'cancelled')),
    notification_sent_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointment_blocks table for blocking time slots
CREATE TABLE IF NOT EXISTS appointment_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    practitioner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    block_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    block_type VARCHAR(20) DEFAULT 'unavailable' CHECK (block_type IN ('unavailable', 'break', 'meeting', 'vacation', 'sick_leave')),
    reason TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(20) CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly')),
    recurrence_end_date DATE,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appointment_notes_org_id ON appointment_notes(org_id);
CREATE INDEX IF NOT EXISTS idx_appointment_notes_appointment_id ON appointment_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_notes_patient_id ON appointment_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_notes_created_by ON appointment_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_appointment_notes_note_type ON appointment_notes(note_type);

CREATE INDEX IF NOT EXISTS idx_waiting_list_org_id ON appointment_waiting_list(org_id);
CREATE INDEX IF NOT EXISTS idx_waiting_list_patient_id ON appointment_waiting_list(patient_id);
CREATE INDEX IF NOT EXISTS idx_waiting_list_practitioner_id ON appointment_waiting_list(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_waiting_list_status ON appointment_waiting_list(org_id, status);
CREATE INDEX IF NOT EXISTS idx_waiting_list_preferred_date ON appointment_waiting_list(preferred_date);
CREATE INDEX IF NOT EXISTS idx_waiting_list_priority ON appointment_waiting_list(priority DESC);

CREATE INDEX IF NOT EXISTS idx_appointment_blocks_org_id ON appointment_blocks(org_id);
CREATE INDEX IF NOT EXISTS idx_appointment_blocks_practitioner_id ON appointment_blocks(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_appointment_blocks_date ON appointment_blocks(block_date);
CREATE INDEX IF NOT EXISTS idx_appointment_blocks_time ON appointment_blocks(block_date, start_time, end_time);

-- Add indexes to appointments table for optimization
CREATE INDEX IF NOT EXISTS idx_appointments_parent_id ON appointments(parent_appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_cancelled_by ON appointments(cancelled_by);

-- Create updated_at triggers
CREATE TRIGGER update_appointment_notes_updated_at 
    BEFORE UPDATE ON appointment_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waiting_list_updated_at 
    BEFORE UPDATE ON appointment_waiting_list 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointment_blocks_updated_at 
    BEFORE UPDATE ON appointment_blocks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE appointment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_waiting_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointment_notes
CREATE POLICY "Users can access org appointment notes" ON appointment_notes
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policies for waiting_list
CREATE POLICY "Users can access org waiting list" ON appointment_waiting_list
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policies for appointment_blocks
CREATE POLICY "Users can access org appointment blocks" ON appointment_blocks
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Create function to find available slots considering blocks
CREATE OR REPLACE FUNCTION get_available_time_slots_enhanced(
    p_practitioner_id UUID,
    p_date DATE,
    p_duration_minutes INTEGER DEFAULT 60,
    p_business_start TIME DEFAULT '08:00',
    p_business_end TIME DEFAULT '18:00',
    p_slot_interval_minutes INTEGER DEFAULT 30
)
RETURNS TABLE(
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN,
    conflict_type VARCHAR(20)
) AS $$
DECLARE
    current_time TIME;
    end_time_calc TIME;
    slot_end TIME;
BEGIN
    current_time := p_business_start;
    
    WHILE current_time < p_business_end LOOP
        slot_end := current_time + (p_duration_minutes || ' minutes')::INTERVAL;
        
        -- Exit if slot would go beyond business hours
        IF slot_end > p_business_end THEN
            EXIT;
        END IF;
        
        -- Check for existing appointments
        IF EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.practitioner_id = p_practitioner_id
              AND a.appointment_date = p_date
              AND a.status NOT IN ('cancelled', 'no_show')
              AND (
                (a.start_time, a.start_time + (a.duration_minutes || ' minutes')::INTERVAL) OVERLAPS 
                (current_time, slot_end)
              )
        ) THEN
            start_time := current_time;
            end_time := slot_end;
            is_available := false;
            conflict_type := 'appointment';
            RETURN NEXT;
        -- Check for blocks
        ELSIF EXISTS (
            SELECT 1 FROM appointment_blocks ab
            WHERE ab.practitioner_id = p_practitioner_id
              AND ab.block_date = p_date
              AND (ab.start_time, ab.end_time) OVERLAPS (current_time, slot_end)
        ) THEN
            start_time := current_time;
            end_time := slot_end;
            is_available := false;
            conflict_type := 'blocked';
            RETURN NEXT;
        ELSE
            start_time := current_time;
            end_time := slot_end;
            is_available := true;
            conflict_type := NULL;
            RETURN NEXT;
        END IF;
        
        current_time := current_time + (p_slot_interval_minutes || ' minutes')::INTERVAL;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to auto-notify waiting list when slot becomes available
CREATE OR REPLACE FUNCTION notify_waiting_list_for_slot(
    p_practitioner_id UUID,
    p_date DATE,
    p_start_time TIME,
    p_duration_minutes INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    notified_count INTEGER := 0;
    waiting_record RECORD;
BEGIN
    -- Find matching waiting list entries
    FOR waiting_record IN
        SELECT * FROM appointment_waiting_list
        WHERE practitioner_id = p_practitioner_id
          AND status = 'active'
          AND (preferred_date IS NULL OR preferred_date = p_date)
          AND (
            preferred_time_start IS NULL OR 
            (p_start_time >= preferred_time_start AND p_start_time <= COALESCE(preferred_time_end, preferred_time_start + INTERVAL '2 hours'))
          )
        ORDER BY priority DESC, created_at ASC
        LIMIT 5
    LOOP
        -- Update status to notified
        UPDATE appointment_waiting_list
        SET status = 'notified',
            notification_sent_at = NOW(),
            expires_at = NOW() + INTERVAL '24 hours',
            updated_at = NOW()
        WHERE id = waiting_record.id;
        
        notified_count := notified_count + 1;
        
        -- TODO: Send actual notification (email/SMS)
        -- This would integrate with notification service
    END LOOP;
    
    RETURN notified_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
