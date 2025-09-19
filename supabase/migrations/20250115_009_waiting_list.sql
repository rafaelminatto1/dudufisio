-- Migration: Appointment Waiting List
-- Description: Create table for appointment waiting list management
-- Date: 2025-01-15

-- Create appointment_waiting_list table
CREATE TABLE IF NOT EXISTS appointment_waiting_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    practitioner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    appointment_type VARCHAR(50) NOT NULL CHECK (appointment_type IN ('consulta', 'retorno', 'avaliacao', 'fisioterapia', 'reavaliacao', 'emergencia')),
    preferred_date DATE,
    preferred_time TIME,
    notes TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'contacted', 'scheduled', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointment_waiting_list_org_id ON appointment_waiting_list(org_id);
CREATE INDEX IF NOT EXISTS idx_appointment_waiting_list_patient_id ON appointment_waiting_list(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_waiting_list_practitioner_id ON appointment_waiting_list(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_appointment_waiting_list_status ON appointment_waiting_list(status);
CREATE INDEX IF NOT EXISTS idx_appointment_waiting_list_priority ON appointment_waiting_list(priority);
CREATE INDEX IF NOT EXISTS idx_appointment_waiting_list_created_at ON appointment_waiting_list(created_at);

-- Create updated_at trigger
CREATE TRIGGER update_appointment_waiting_list_updated_at 
    BEFORE UPDATE ON appointment_waiting_list 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE appointment_waiting_list ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access waiting list entries from their organization
CREATE POLICY "Users can access org waiting list entries" ON appointment_waiting_list
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Add foreign key constraints
ALTER TABLE appointment_waiting_list 
    ADD CONSTRAINT fk_appointment_waiting_list_patient_id 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE appointment_waiting_list 
    ADD CONSTRAINT fk_appointment_waiting_list_practitioner_id 
    FOREIGN KEY (practitioner_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add unique constraint to prevent duplicate entries for same patient and practitioner
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointment_waiting_list_unique_active 
    ON appointment_waiting_list(patient_id, practitioner_id, org_id) 
    WHERE status IN ('waiting', 'contacted');
