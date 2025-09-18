-- Seed Data for FisioFlow Development
-- Brazilian healthcare clinic test data
-- Date: 2025-01-15

-- Insert test organization
INSERT INTO orgs (
  id,
  name,
  slug,
  cnpj,
  cnes_code,
  phone,
  email,
  address_line1,
  city,
  state,
  postal_code,
  timezone,
  business_hours,
  status,
  subscription_type
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Clínica FisioFlow Demo',
  'fisioflow-demo',
  '12.345.678/0001-90',
  '1234567',
  '(11) 99999-9999',
  'contato@fisioflow.com.br',
  'Rua das Flores, 123',
  'São Paulo',
  'SP',
  '01234-567',
  'America/Sao_Paulo',
  '{"monday": {"start": "08:00", "end": "18:00"}, "tuesday": {"start": "08:00", "end": "18:00"}, "wednesday": {"start": "08:00", "end": "18:00"}, "thursday": {"start": "08:00", "end": "18:00"}, "friday": {"start": "08:00", "end": "18:00"}, "saturday": {"start": "08:00", "end": "12:00"}}',
  'active',
  'pro'
) ON CONFLICT (id) DO NOTHING;

-- Insert test users (profiles)
INSERT INTO profiles (
  id,
  org_id,
  email,
  full_name,
  role,
  crefito_number,
  phone,
  is_active,
  last_login_at
) VALUES 
  -- Admin user
  (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'admin@fisioflow.com.br',
    'Dr. João Silva - Administrador',
    'admin',
    null,
    '(11) 99999-0001',
    true,
    NOW()
  ),
  -- Fisioterapeuta
  (
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    'fisio@fisioflow.com.br',
    'Dra. Maria Santos - Fisioterapeuta',
    'fisioterapeuta',
    '123456-F',
    '(11) 99999-0002',
    true,
    NOW()
  ),
  -- Estagiário
  (
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440000',
    'estagiario@fisioflow.com.br',
    'Carlos Oliveira - Estagiário',
    'estagiario',
    null,
    '(11) 99999-0003',
    true,
    NOW()
  ),
  -- Paciente
  (
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440000',
    'paciente@fisioflow.com.br',
    'Ana Costa - Paciente',
    'paciente',
    null,
    '(11) 99999-0004',
    true,
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Insert org memberships
INSERT INTO org_memberships (
  id,
  org_id,
  user_id,
  role,
  permissions,
  is_active,
  joined_at
) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    'admin',
    '{"all": true}',
    true,
    NOW()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440002',
    'fisioterapeuta',
    '{"patients": ["read", "write", "delete"], "appointments": ["read", "write", "delete"], "sessions": ["read", "write", "delete"]}',
    true,
    NOW()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440003',
    'estagiario',
    '{"patients": ["read", "write"], "appointments": ["read", "write"], "sessions": ["read", "write"]}',
    true,
    NOW()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440004',
    'paciente',
    '{"patients": ["read"], "appointments": ["read"], "sessions": ["read"]}',
    true,
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Insert test patients
INSERT INTO patients (
  id,
  org_id,
  name,
  cpf,
  rg,
  date_of_birth,
  gender,
  phone,
  email,
  emergency_contact_name,
  emergency_contact_phone,
  address_line1,
  city,
  state,
  postal_code,
  health_insurance,
  health_insurance_number,
  medical_history,
  current_medications,
  allergies,
  observations,
  consent_lgpd,
  consent_date,
  consent_version,
  status,
  created_by,
  updated_by
) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440100',
    '550e8400-e29b-41d4-a716-446655440000',
    'Roberto Almeida',
    '123.456.789-01',
    '12.345.678-9',
    '1985-03-15',
    'masculino',
    '(11) 98765-4321',
    'roberto.almeida@email.com',
    'Maria Almeida',
    '(11) 98765-4322',
    'Rua das Palmeiras, 456',
    'São Paulo',
    'SP',
    '04567-890',
    'Unimed',
    '123456789',
    'Hipertensão controlada, diabetes tipo 2',
    'Losartana 50mg, Metformina 850mg',
    'Penicilina',
    'Paciente colaborativo, adere bem ao tratamento',
    true,
    NOW(),
    '1.0',
    'active',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440101',
    '550e8400-e29b-41d4-a716-446655440000',
    'Fernanda Lima',
    '987.654.321-00',
    '98.765.432-1',
    '1992-07-22',
    'feminino',
    '(11) 91234-5678',
    'fernanda.lima@email.com',
    'José Lima',
    '(11) 91234-5679',
    'Av. Paulista, 1000',
    'São Paulo',
    'SP',
    '01310-100',
    'Bradesco Saúde',
    '987654321',
    'Lombalgia crônica, hérnia de disco L4-L5',
    'Diclofenaco 50mg quando necessário',
    'Nenhuma',
    'Paciente ativa, pratica exercícios regularmente',
    true,
    NOW(),
    '1.0',
    'active',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440102',
    '550e8400-e29b-41d4-a716-446655440000',
    'Pedro Santos',
    '456.789.123-45',
    '45.678.912-3',
    '1978-11-08',
    'masculino',
    '(11) 99887-7665',
    'pedro.santos@email.com',
    'Lucia Santos',
    '(11) 99887-7666',
    'Rua Augusta, 789',
    'São Paulo',
    'SP',
    '01305-000',
    'SUS',
    null,
    'Fratura de fêmur em 2020, artrose no joelho direito',
    'Paracetamol 750mg',
    'Dipirona',
    'Paciente idoso, necessita cuidados especiais',
    true,
    NOW(),
    '1.0',
    'active',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440103',
    '550e8400-e29b-41d4-a716-446655440000',
    'Carla Mendes',
    '789.123.456-78',
    '78.912.345-6',
    '1995-12-03',
    'feminino',
    '(11) 95544-3322',
    'carla.mendes@email.com',
    'Antonio Mendes',
    '(11) 95544-3323',
    'Rua Oscar Freire, 321',
    'São Paulo',
    'SP',
    '01426-001',
    'Amil',
    '789123456',
    'Tendinite no ombro direito, bursite',
    'Ibuprofeno 600mg',
    'Nenhuma',
    'Paciente jovem, boa adesão ao tratamento',
    true,
    NOW(),
    '1.0',
    'active',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert test appointments
INSERT INTO appointments (
  id,
  org_id,
  patient_id,
  practitioner_id,
  appointment_date,
  start_time,
  end_time,
  duration_minutes,
  appointment_type,
  status,
  notes,
  reminder_sent,
  created_by,
  updated_by
) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440200',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440100',
    '550e8400-e29b-41d4-a716-446655440002',
    CURRENT_DATE + INTERVAL '1 day',
    '09:00',
    '10:00',
    60,
    'consulta',
    'agendado',
    'Primeira consulta - avaliação inicial',
    false,
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440201',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440101',
    '550e8400-e29b-41d4-a716-446655440002',
    CURRENT_DATE + INTERVAL '1 day',
    '10:30',
    '11:30',
    60,
    'fisioterapia',
    'confirmado',
    'Sessão de fisioterapia - lombalgia',
    true,
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440202',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440102',
    '550e8400-e29b-41d4-a716-446655440002',
    CURRENT_DATE + INTERVAL '2 days',
    '14:00',
    '15:00',
    60,
    'avaliacao',
    'agendado',
    'Avaliação de progresso - artrose',
    false,
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440203',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440103',
    '550e8400-e29b-41d4-a716-446655440002',
    CURRENT_DATE + INTERVAL '3 days',
    '16:00',
    '17:00',
    60,
    'fisioterapia',
    'agendado',
    'Tratamento de tendinite',
    false,
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert test sessions
INSERT INTO sessions (
  id,
  org_id,
  appointment_id,
  patient_id,
  therapist_id,
  session_date,
  start_time,
  end_time,
  status,
  session_type,
  chief_complaint,
  subjective_assessment,
  objective_assessment,
  assessment_notes,
  treatment_plan,
  exercises_prescribed,
  pain_level_before,
  pain_level_after,
  session_notes,
  next_session_recommendations,
  progress_notes,
  improvement_areas,
  concerns,
  patient_feedback,
  created_by,
  updated_by
) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440300',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440200',
    '550e8400-e29b-41d4-a716-446655440100',
    '550e8400-e29b-41d4-a716-446655440002',
    CURRENT_DATE - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '1 hour',
    'concluida',
    'avaliacao_inicial',
    'Dor lombar há 3 meses, piora ao sentar',
    'Paciente relata dor constante na região lombar, piora ao final do dia',
    'Limitação de flexão lombar, teste de Lasègue positivo',
    'Avaliação inicial realizada, paciente colaborativo',
    'Fortalecimento da musculatura paravertebral, alongamentos',
    ARRAY['Ponte', 'Alongamento de coluna', 'Exercícios de estabilização'],
    7,
    5,
    'Sessão produtiva, paciente demonstrou boa adesão',
    'Continuar exercícios em casa, retorno em 1 semana',
    'Boa evolução inicial, paciente motivado',
    ARRAY['Flexibilidade', 'Força muscular'],
    ARRAY['Dor noturna'],
    'Muito satisfeito com o atendimento'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert test pain points
INSERT INTO pain_points (
  id,
  org_id,
  session_id,
  patient_id,
  body_region,
  x_coordinate,
  y_coordinate,
  pain_intensity,
  pain_type,
  pain_description,
  clinical_notes,
  assessment_type,
  improvement_notes,
  assessment_date,
  created_by,
  updated_by
) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440400',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440300',
    '550e8400-e29b-41d4-a716-446655440100',
    'lombar',
    50.0,
    30.0,
    7,
    'cronica',
    'Dor constante na região lombar baixa',
    'Dor localizada em L4-L5, sem irradiação',
    'initial',
    'Dor diminuiu após alongamentos',
    NOW() - INTERVAL '1 day',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440401',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440300',
    '550e8400-e29b-41d4-a716-446655440100',
    'lombar',
    45.0,
    35.0,
    5,
    'cronica',
    'Dor na região lombar média',
    'Dor bilateral, pior no lado direito',
    'initial',
    'Melhora com exercícios de fortalecimento',
    NOW() - INTERVAL '1 day',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert patient consent history
INSERT INTO patient_consent_history (
  id,
  patient_id,
  org_id,
  consent_type,
  granted,
  consent_text,
  consent_version,
  granted_at,
  granted_by
) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440500',
    '550e8400-e29b-41d4-a716-446655440100',
    '550e8400-e29b-41d4-a716-446655440000',
    'data_processing',
    true,
    'Consentimento para processamento de dados pessoais conforme LGPD',
    '1.0',
    NOW() - INTERVAL '1 day',
    '550e8400-e29b-41d4-a716-446655440002'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440501',
    '550e8400-e29b-41d4-a716-446655440101',
    '550e8400-e29b-41d4-a716-446655440000',
    'data_processing',
    true,
    'Consentimento para processamento de dados pessoais conforme LGPD',
    '1.0',
    NOW() - INTERVAL '2 days',
    '550e8400-e29b-41d4-a716-446655440002'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert audit logs for testing
INSERT INTO audit_logs (
  id,
  org_id,
  user_id,
  table_name,
  record_id,
  operation,
  old_values,
  new_values,
  ip_address,
  user_agent,
  additional_data
) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440600',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440002',
    'patients',
    '550e8400-e29b-41d4-a716-446655440100',
    'CREATE',
    null,
    '{"name": "Roberto Almeida", "cpf": "123.456.789-01"}',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    '{"patient_name": "Roberto Almeida", "lgpd_consent": true}'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440601',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440002',
    'appointments',
    '550e8400-e29b-41d4-a716-446655440200',
    'CREATE',
    null,
    '{"appointment_date": "2025-01-16", "start_time": "09:00"}',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    '{"patient_name": "Roberto Almeida", "appointment_type": "consulta"}'
  )
ON CONFLICT (id) DO NOTHING;
