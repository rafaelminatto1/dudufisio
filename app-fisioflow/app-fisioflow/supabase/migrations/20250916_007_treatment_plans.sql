-- supabase/migrations/20250916_007_treatment_plans.sql

-- Tabela para armazenar a biblioteca de exercícios
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela para os planos de tratamento de cada paciente
CREATE TABLE treatment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'active', -- ex: active, completed, archived
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de junção para associar exercícios a planos de tratamento
CREATE TABLE plan_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    sets INTEGER,
    reps INTEGER,
    frequency TEXT,
    notes TEXT,
    "order" INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para otimizar as consultas
CREATE INDEX idx_treatment_plans_patient_id ON treatment_plans(patient_id);
CREATE INDEX idx_plan_exercises_plan_id ON plan_exercises(plan_id);
CREATE INDEX idx_plan_exercises_exercise_id ON plan_exercises(exercise_id);

-- Políticas de Segurança (RLS)

-- Tabela: exercises
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fisioterapeutas e Admins podem gerenciar exercícios"
ON exercises
FOR ALL
USING (get_my_claim('role') IN ('admin', 'fisioterapeuta'));

CREATE POLICY "Pacientes podem ver todos os exercícios"
ON exercises
FOR SELECT
USING (get_my_claim('role') IS NOT NULL); -- Qualquer usuário logado pode ver

-- Tabela: treatment_plans
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fisioterapeutas podem gerenciar seus planos de tratamento"
ON treatment_plans
FOR ALL
USING (therapist_id = auth.uid());

CREATE POLICY "Pacientes podem ver seus próprios planos de tratamento"
ON treatment_plans
FOR SELECT
USING (patient_id = (
    SELECT id FROM patients WHERE user_id = auth.uid()
));

CREATE POLICY "Admins podem gerenciar todos os planos de tratamento"
ON treatment_plans
FOR ALL
USING (get_my_claim('role') = 'admin');

-- Tabela: plan_exercises
ALTER TABLE plan_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fisioterapeutas podem gerenciar exercícios em seus planos"
ON plan_exercises
FOR ALL
USING (
    plan_id IN (
        SELECT id FROM treatment_plans WHERE therapist_id = auth.uid()
    )
);

CREATE POLICY "Pacientes podem ver os exercícios em seus planos"
ON plan_exercises
FOR SELECT
USING (
    plan_id IN (
        SELECT id FROM treatment_plans WHERE patient_id = (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Admins podem gerenciar todos os exercícios em planos"
ON plan_exercises
FOR ALL
USING (get_my_claim('role') = 'admin');
