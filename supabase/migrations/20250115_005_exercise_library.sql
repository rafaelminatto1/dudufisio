-- Migration: Exercise Library for FisioFlow
-- Description: Create exercise library tables for physiotherapy exercises
-- Date: 2025-01-15

-- Create exercise_categories table
CREATE TABLE IF NOT EXISTS exercise_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI
    icon VARCHAR(50), -- Icon name for UI
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    category_id UUID REFERENCES exercise_categories(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT NOT NULL,
    difficulty_level VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    duration_minutes INTEGER DEFAULT 10,
    repetitions INTEGER,
    sets INTEGER,
    rest_seconds INTEGER DEFAULT 30,
    equipment_needed TEXT[],
    contraindications TEXT[],
    benefits TEXT[],
    muscle_groups TEXT[],
    body_parts TEXT[],
    video_url TEXT,
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false, -- Public exercises available to all orgs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Create exercise_prescriptions table
CREATE TABLE IF NOT EXISTS exercise_prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    prescribed_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    prescription_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    notes TEXT,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exercise_prescription_items table
CREATE TABLE IF NOT EXISTS exercise_prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID REFERENCES exercise_prescriptions(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    repetitions INTEGER,
    sets INTEGER,
    duration_minutes INTEGER,
    rest_seconds INTEGER,
    frequency_per_week INTEGER DEFAULT 3,
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exercise_tracking table
CREATE TABLE IF NOT EXISTS exercise_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    prescription_item_id UUID REFERENCES exercise_prescription_items(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    performed_date DATE NOT NULL,
    repetitions_completed INTEGER,
    sets_completed INTEGER,
    duration_minutes INTEGER,
    pain_level_before INTEGER CHECK (pain_level_before >= 0 AND pain_level_before <= 10),
    pain_level_after INTEGER CHECK (pain_level_after >= 0 AND pain_level_after <= 10),
    difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    patient_notes TEXT,
    therapist_notes TEXT,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercise_categories_org_id ON exercise_categories(org_id);
CREATE INDEX IF NOT EXISTS idx_exercise_categories_active ON exercise_categories(org_id, is_active);

CREATE INDEX IF NOT EXISTS idx_exercises_org_id ON exercises(org_id);
CREATE INDEX IF NOT EXISTS idx_exercises_category_id ON exercises(category_id);
CREATE INDEX IF NOT EXISTS idx_exercises_active ON exercises(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_exercises_public ON exercises(is_public);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_groups ON exercises USING GIN(muscle_groups);
CREATE INDEX IF NOT EXISTS idx_exercises_body_parts ON exercises USING GIN(body_parts);

CREATE INDEX IF NOT EXISTS idx_exercise_prescriptions_org_id ON exercise_prescriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_exercise_prescriptions_patient_id ON exercise_prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_exercise_prescriptions_session_id ON exercise_prescriptions(session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_prescriptions_status ON exercise_prescriptions(org_id, status);

CREATE INDEX IF NOT EXISTS idx_exercise_prescription_items_prescription_id ON exercise_prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_exercise_prescription_items_exercise_id ON exercise_prescription_items(exercise_id);

CREATE INDEX IF NOT EXISTS idx_exercise_tracking_org_id ON exercise_tracking(org_id);
CREATE INDEX IF NOT EXISTS idx_exercise_tracking_patient_id ON exercise_tracking(patient_id);
CREATE INDEX IF NOT EXISTS idx_exercise_tracking_performed_date ON exercise_tracking(performed_date);
CREATE INDEX IF NOT EXISTS idx_exercise_tracking_exercise_id ON exercise_tracking(exercise_id);

-- Create updated_at triggers
CREATE TRIGGER update_exercise_categories_updated_at 
    BEFORE UPDATE ON exercise_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at 
    BEFORE UPDATE ON exercises 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_prescriptions_updated_at 
    BEFORE UPDATE ON exercise_prescriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_tracking_updated_at 
    BEFORE UPDATE ON exercise_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access exercise categories from their organization
CREATE POLICY "Users can access org exercise categories" ON exercise_categories
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Users can access exercises from their organization or public exercises
CREATE POLICY "Users can access org and public exercises" ON exercises
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        ) OR is_public = true
    );

-- RLS Policy: Users can access exercise prescriptions from their organization
CREATE POLICY "Users can access org exercise prescriptions" ON exercise_prescriptions
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Patients can only access their own prescriptions
CREATE POLICY "Patients can access own prescriptions" ON exercise_prescriptions
    FOR SELECT USING (
        patient_id IN (
            SELECT p.id FROM patients p
            JOIN org_memberships om ON p.org_id = om.org_id
            WHERE om.user_id = auth.uid() AND om.role = 'paciente'
        )
    );

-- RLS Policy: Users can access prescription items from their organization
CREATE POLICY "Users can access org prescription items" ON exercise_prescription_items
    FOR ALL USING (
        prescription_id IN (
            SELECT id FROM exercise_prescriptions
            WHERE org_id IN (
                SELECT org_id FROM org_memberships 
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

-- RLS Policy: Users can access exercise tracking from their organization
CREATE POLICY "Users can access org exercise tracking" ON exercise_tracking
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Patients can only access their own tracking data
CREATE POLICY "Patients can access own tracking data" ON exercise_tracking
    FOR SELECT USING (
        patient_id IN (
            SELECT p.id FROM patients p
            JOIN org_memberships om ON p.org_id = om.org_id
            WHERE om.user_id = auth.uid() AND om.role = 'paciente'
        )
    );

-- Create function to get exercise statistics
CREATE OR REPLACE FUNCTION get_exercise_statistics(
    p_patient_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    total_exercises INTEGER,
    completed_exercises INTEGER,
    completion_rate DECIMAL(5,2),
    average_pain_reduction DECIMAL(3,1),
    total_duration_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_exercises,
        COUNT(CASE WHEN et.is_completed THEN 1 END)::INTEGER as completed_exercises,
        ROUND(
            (COUNT(CASE WHEN et.is_completed THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
            2
        ) as completion_rate,
        ROUND(
            AVG(et.pain_level_before - et.pain_level_after), 
            1
        ) as average_pain_reduction,
        COALESCE(SUM(et.duration_minutes), 0)::INTEGER as total_duration_minutes
    FROM exercise_tracking et
    WHERE et.patient_id = p_patient_id
      AND (p_start_date IS NULL OR et.performed_date >= p_start_date)
      AND (p_end_date IS NULL OR et.performed_date <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get patient exercise progress
CREATE OR REPLACE FUNCTION get_patient_exercise_progress(
    p_patient_id UUID,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    exercise_name VARCHAR(200),
    total_sessions INTEGER,
    completion_rate DECIMAL(5,2),
    average_pain_before DECIMAL(3,1),
    average_pain_after DECIMAL(3,1),
    pain_improvement DECIMAL(3,1),
    last_performed DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.name as exercise_name,
        COUNT(et.id)::INTEGER as total_sessions,
        ROUND(
            (COUNT(CASE WHEN et.is_completed THEN 1 END)::DECIMAL / NULLIF(COUNT(et.id), 0)) * 100, 
            2
        ) as completion_rate,
        ROUND(AVG(et.pain_level_before), 1) as average_pain_before,
        ROUND(AVG(et.pain_level_after), 1) as average_pain_after,
        ROUND(AVG(et.pain_level_before - et.pain_level_after), 1) as pain_improvement,
        MAX(et.performed_date) as last_performed
    FROM exercise_tracking et
    JOIN exercises e ON et.exercise_id = e.id
    WHERE et.patient_id = p_patient_id
      AND et.performed_date >= CURRENT_DATE - INTERVAL '1 day' * p_days_back
    GROUP BY e.id, e.name
    ORDER BY last_performed DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
