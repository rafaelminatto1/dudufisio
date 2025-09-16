-- Migration: Body Mapping System
-- Description: Interactive body mapping for pain tracking and treatment visualization
-- Date: 2025-09-14
-- Author: FisioFlow Team

-- Pain points for body mapping
CREATE TABLE pain_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,

    -- Body mapping coordinates
    body_region TEXT NOT NULL CHECK (body_region IN (
        'head', 'neck', 'shoulder_left', 'shoulder_right',
        'arm_left', 'arm_right', 'elbow_left', 'elbow_right',
        'forearm_left', 'forearm_right', 'wrist_left', 'wrist_right',
        'hand_left', 'hand_right', 'chest', 'upper_back',
        'lower_back', 'abdomen', 'hip_left', 'hip_right',
        'thigh_left', 'thigh_right', 'knee_left', 'knee_right',
        'shin_left', 'shin_right', 'calf_left', 'calf_right',
        'ankle_left', 'ankle_right', 'foot_left', 'foot_right'
    )),

    -- SVG coordinates for precise mapping
    x_coordinate NUMERIC(8,2) NOT NULL CHECK (x_coordinate >= 0 AND x_coordinate <= 1000),
    y_coordinate NUMERIC(8,2) NOT NULL CHECK (y_coordinate >= 0 AND y_coordinate <= 1000),

    -- Pain assessment
    pain_intensity INTEGER NOT NULL CHECK (pain_intensity >= 0 AND pain_intensity <= 10),
    pain_type TEXT CHECK (pain_type IN (
        'aguda', 'cronica', 'latejante', 'queimacao',
        'formigamento', 'dormencia', 'rigidez', 'outro'
    )),
    pain_description TEXT,

    -- Assessment context
    assessment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assessment_type TEXT NOT NULL CHECK (assessment_type IN (
        'initial', 'progress', 'discharge', 'followup'
    )),

    -- Clinical notes
    clinical_notes TEXT,
    improvement_notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Body regions reference table for standardization
CREATE TABLE body_regions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region_code TEXT UNIQUE NOT NULL,
    region_name_pt TEXT NOT NULL,
    region_group TEXT NOT NULL,
    svg_path TEXT,
    anatomical_description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercise body targets for exercise-region mapping
CREATE TABLE exercise_body_targets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL,  -- Will reference exercise_library when created
    body_region TEXT NOT NULL REFERENCES body_regions(region_code),
    target_type TEXT NOT NULL CHECK (target_type IN (
        'primary', 'secondary', 'stabilizer'
    )),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Body mapping assessments for structured evaluation
CREATE TABLE body_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,

    -- Assessment metadata
    assessment_name TEXT NOT NULL,
    assessment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assessment_type TEXT NOT NULL CHECK (assessment_type IN (
        'initial', 'progress', 'discharge', 'followup'
    )),

    -- Overall pain assessment
    overall_pain_score INTEGER CHECK (overall_pain_score >= 0 AND overall_pain_score <= 10),
    functional_limitation_score INTEGER CHECK (functional_limitation_score >= 0 AND functional_limitation_score <= 10),

    -- Assessment notes
    subjective_notes TEXT,
    objective_findings TEXT,
    assessment_conclusion TEXT,
    treatment_plan TEXT,

    -- Progress tracking
    previous_assessment_id UUID REFERENCES body_assessments(id),
    improvement_percentage NUMERIC(5,2) CHECK (improvement_percentage >= -100 AND improvement_percentage <= 100),

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Indexes for performance
CREATE INDEX idx_pain_points_org_patient ON pain_points(org_id, patient_id);
CREATE INDEX idx_pain_points_session ON pain_points(session_id);
CREATE INDEX idx_pain_points_assessment_date ON pain_points(assessment_date);
CREATE INDEX idx_pain_points_body_region ON pain_points(body_region);
CREATE INDEX idx_pain_points_pain_intensity ON pain_points(pain_intensity);

CREATE INDEX idx_body_assessments_org_patient ON body_assessments(org_id, patient_id);
CREATE INDEX idx_body_assessments_session ON body_assessments(session_id);
CREATE INDEX idx_body_assessments_date ON body_assessments(assessment_date);
CREATE INDEX idx_body_assessments_type ON body_assessments(assessment_type);

CREATE INDEX idx_exercise_body_targets_org ON exercise_body_targets(org_id);
CREATE INDEX idx_exercise_body_targets_region ON exercise_body_targets(body_region);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pain_points_updated_at
    BEFORE UPDATE ON pain_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_body_assessments_updated_at
    BEFORE UPDATE ON body_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_body_targets_updated_at
    BEFORE UPDATE ON exercise_body_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Body regions seed data
INSERT INTO body_regions (region_code, region_name_pt, region_group, anatomical_description) VALUES
-- Cabeça e Pescoço
('head', 'Cabeça', 'cranio_cervical', 'Região craniana incluindo face e couro cabeludo'),
('neck', 'Pescoço', 'cranio_cervical', 'Coluna cervical e musculatura do pescoço'),

-- Membros Superiores
('shoulder_left', 'Ombro Esquerdo', 'membro_superior', 'Articulação glenoumeral e cintura escapular esquerda'),
('shoulder_right', 'Ombro Direito', 'membro_superior', 'Articulação glenoumeral e cintura escapular direita'),
('arm_left', 'Braço Esquerdo', 'membro_superior', 'Úmero e musculatura do braço esquerdo'),
('arm_right', 'Braço Direito', 'membro_superior', 'Úmero e musculatura do braço direito'),
('elbow_left', 'Cotovelo Esquerdo', 'membro_superior', 'Articulação do cotovelo esquerdo'),
('elbow_right', 'Cotovelo Direito', 'membro_superior', 'Articulação do cotovelo direito'),
('forearm_left', 'Antebraço Esquerdo', 'membro_superior', 'Rádio e ulna esquerdos'),
('forearm_right', 'Antebraço Direito', 'membro_superior', 'Rádio e ulna direitos'),
('wrist_left', 'Punho Esquerdo', 'membro_superior', 'Articulação do punho esquerdo'),
('wrist_right', 'Punho Direito', 'membro_superior', 'Articulação do punho direito'),
('hand_left', 'Mão Esquerda', 'membro_superior', 'Mão e dedos esquerdos'),
('hand_right', 'Mão Direita', 'membro_superior', 'Mão e dedos direitos'),

-- Tronco
('chest', 'Tórax', 'tronco', 'Região torácica anterior'),
('upper_back', 'Costas Superior', 'tronco', 'Coluna torácica e musculatura das costas'),
('lower_back', 'Lombar', 'tronco', 'Coluna lombar e região lombossacral'),
('abdomen', 'Abdômen', 'tronco', 'Região abdominal'),

-- Membros Inferiores
('hip_left', 'Quadril Esquerdo', 'membro_inferior', 'Articulação coxofemoral esquerda'),
('hip_right', 'Quadril Direito', 'membro_inferior', 'Articulação coxofemoral direita'),
('thigh_left', 'Coxa Esquerda', 'membro_inferior', 'Fêmur e musculatura da coxa esquerda'),
('thigh_right', 'Coxa Direita', 'membro_inferior', 'Fêmur e musculatura da coxa direita'),
('knee_left', 'Joelho Esquerdo', 'membro_inferior', 'Articulação do joelho esquerdo'),
('knee_right', 'Joelho Direito', 'membro_inferior', 'Articulação do joelho direito'),
('shin_left', 'Canela Esquerda', 'membro_inferior', 'Tíbia anterior esquerda'),
('shin_right', 'Canela Direita', 'membro_inferior', 'Tíbia anterior direita'),
('calf_left', 'Panturrilha Esquerda', 'membro_inferior', 'Musculatura posterior da perna esquerda'),
('calf_right', 'Panturrilha Direita', 'membro_inferior', 'Musculatura posterior da perna direita'),
('ankle_left', 'Tornozelo Esquerdo', 'membro_inferior', 'Articulação do tornozelo esquerdo'),
('ankle_right', 'Tornozelo Direito', 'membro_inferior', 'Articulação do tornozelo direito'),
('foot_left', 'Pé Esquerdo', 'membro_inferior', 'Pé e dedos esquerdos'),
('foot_right', 'Pé Direito', 'membro_inferior', 'Pé e dedos direitos');

-- Functions for pain assessment analysis
CREATE OR REPLACE FUNCTION get_patient_pain_history(
    p_patient_id UUID,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    assessment_date DATE,
    avg_pain_intensity NUMERIC,
    max_pain_intensity INTEGER,
    affected_regions INTEGER,
    total_pain_points INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pp.assessment_date::DATE,
        ROUND(AVG(pp.pain_intensity), 2) as avg_pain_intensity,
        MAX(pp.pain_intensity) as max_pain_intensity,
        COUNT(DISTINCT pp.body_region) as affected_regions,
        COUNT(*) as total_pain_points
    FROM pain_points pp
    WHERE pp.patient_id = p_patient_id
        AND pp.assessment_date >= NOW() - INTERVAL '%s days' % p_days_back
    GROUP BY pp.assessment_date::DATE
    ORDER BY pp.assessment_date::DATE DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pain improvement analysis
CREATE OR REPLACE FUNCTION analyze_pain_improvement(
    p_patient_id UUID,
    p_region TEXT DEFAULT NULL
)
RETURNS TABLE (
    body_region TEXT,
    initial_pain NUMERIC,
    current_pain NUMERIC,
    improvement_percentage NUMERIC,
    assessment_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH pain_stats AS (
        SELECT
            pp.body_region,
            FIRST_VALUE(pp.pain_intensity) OVER (
                PARTITION BY pp.body_region
                ORDER BY pp.assessment_date ASC
            ) as initial_intensity,
            FIRST_VALUE(pp.pain_intensity) OVER (
                PARTITION BY pp.body_region
                ORDER BY pp.assessment_date DESC
            ) as current_intensity,
            COUNT(*) OVER (PARTITION BY pp.body_region) as total_assessments
        FROM pain_points pp
        WHERE pp.patient_id = p_patient_id
            AND (p_region IS NULL OR pp.body_region = p_region)
    )
    SELECT DISTINCT
        ps.body_region,
        ps.initial_intensity::NUMERIC,
        ps.current_intensity::NUMERIC,
        CASE
            WHEN ps.initial_intensity = 0 THEN 0
            ELSE ROUND(((ps.initial_intensity - ps.current_intensity)::NUMERIC / ps.initial_intensity::NUMERIC) * 100, 2)
        END as improvement_percentage,
        ps.total_assessments::INTEGER
    FROM pain_stats ps
    ORDER BY improvement_percentage DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit trigger for pain_points
CREATE OR REPLACE FUNCTION audit_pain_points()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            table_name, operation, record_id, org_id,
            new_values, user_id, timestamp
        ) VALUES (
            'pain_points', 'INSERT', NEW.id, NEW.org_id,
            row_to_json(NEW), NEW.created_by, NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            table_name, operation, record_id, org_id,
            old_values, new_values, user_id, timestamp
        ) VALUES (
            'pain_points', 'UPDATE', NEW.id, NEW.org_id,
            row_to_json(OLD), row_to_json(NEW), NEW.updated_by, NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            table_name, operation, record_id, org_id,
            old_values, user_id, timestamp
        ) VALUES (
            'pain_points', 'DELETE', OLD.id, OLD.org_id,
            row_to_json(OLD), OLD.updated_by, NOW()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_pain_points_trigger
    AFTER INSERT OR UPDATE OR DELETE ON pain_points
    FOR EACH ROW EXECUTE FUNCTION audit_pain_points();

-- Comments for documentation
COMMENT ON TABLE pain_points IS 'Pontos de dor mapeados no corpo do paciente para acompanhamento do tratamento';
COMMENT ON TABLE body_regions IS 'Regiões anatômicas padronizadas para mapeamento corporal';
COMMENT ON TABLE exercise_body_targets IS 'Regiões corporais alvo de cada exercício';
COMMENT ON TABLE body_assessments IS 'Avaliações estruturadas do mapeamento corporal';

COMMENT ON COLUMN pain_points.pain_intensity IS 'Escala de dor de 0-10 conforme padrão clínico';
COMMENT ON COLUMN pain_points.x_coordinate IS 'Coordenada X no SVG do corpo humano (0-1000)';
COMMENT ON COLUMN pain_points.y_coordinate IS 'Coordenada Y no SVG do corpo humano (0-1000)';
COMMENT ON COLUMN pain_points.assessment_type IS 'Tipo de avaliação: inicial, progresso, alta, seguimento';