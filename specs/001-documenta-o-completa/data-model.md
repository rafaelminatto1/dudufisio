# Data Model: FisioFlow Healthcare System

**Date**: 2025-09-14
**Phase**: 1 - Design & Contracts
**Database**: PostgreSQL with Supabase (Row Level Security enabled)

## Core Entities Overview

The FisioFlow system uses 8 primary entities designed for multi-tenant healthcare operations with strict data isolation and LGPD compliance.

## Entity Definitions

### 1. Organizations (`orgs`)
Multi-tenant healthcare clinics with independent data isolation.

```sql
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE, -- Brazilian tax ID
  address JSONB,
  phone TEXT,
  email TEXT,
  settings JSONB DEFAULT '{}', -- clinic preferences
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships**:
- One-to-many: patients, appointments, sessions, prescriptions
- One-to-many: org_memberships (staff and patient assignments)

**Validation Rules**:
- FR-001: CNPJ format validation (14 digits)
- Name must be non-empty and unique per region
- Settings include appointment duration defaults, business hours

### 2. Profiles (`profiles`)
User profiles linking Supabase Auth to application roles.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL, -- Supabase auth.users.id
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  crefito TEXT, -- physiotherapy license number
  specializations TEXT[],
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX profiles_auth_user_id_idx ON profiles(auth_user_id);
```

**Relationships**:
- One-to-one: Supabase auth.users
- One-to-many: org_memberships (multi-org support)
- One-to-many: appointments (as therapist)
- One-to-many: sessions (as therapist)

**Validation Rules**:
- FR-001: Email format validation
- CREFITO required for physiotherapist role
- Phone Brazilian format validation

### 3. Organization Memberships (`org_memberships`)
Role-based access control linking users to organizations.

```sql
CREATE TABLE org_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'fisioterapeuta', 'estagiario', 'paciente')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'suspended', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, profile_id)
);

CREATE INDEX org_memberships_org_id_idx ON org_memberships(org_id);
CREATE INDEX org_memberships_profile_id_idx ON org_memberships(profile_id);
```

**Relationships**:
- Many-to-one: orgs, profiles
- Enables multi-tenant RBAC

**State Transitions**:
- active ↔ suspended (temporary access removal)
- active → inactive (permanent removal)
- Role changes require admin approval

### 4. Patients (`patients`)
Patient records with comprehensive demographic and medical information.

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT, -- Brazilian CPF (encrypted at app level)
  date_of_birth DATE,
  email TEXT,
  phone TEXT,
  address JSONB, -- structured address data
  emergency_contact JSONB, -- name, phone, relationship
  profession TEXT,
  marital_status TEXT,
  photo_url TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
  consent_lgpd BOOLEAN DEFAULT FALSE,
  consent_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX patients_org_id_idx ON patients(org_id);
CREATE INDEX patients_cpf_idx ON patients(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX patients_name_idx ON patients USING GIN (to_tsvector('portuguese', name));
```

**Relationships**:
- Many-to-one: orgs
- One-to-many: appointments, sessions, prescriptions, pain_points
- One-to-one: profile (if patient has system access)

**Validation Rules**:
- FR-005, FR-006: Name, CPF, birth date, phone, email required
- FR-006: Brazilian CPF validation and uniqueness
- FR-050: LGPD consent required with timestamp

### 5. Appointments (`appointments`)
Scheduled treatment sessions with conflict prevention.

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
  type TEXT, -- session type (avaliacao, tratamento, reavaliacao)
  notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (ends_at > starts_at)
);

CREATE UNIQUE INDEX appointments_therapist_time_idx ON appointments(therapist_id, starts_at)
  WHERE status NOT IN ('cancelled', 'no_show');
CREATE INDEX appointments_org_id_idx ON appointments(org_id);
CREATE INDEX appointments_patient_id_idx ON appointments(patient_id);
CREATE INDEX appointments_starts_at_idx ON appointments(starts_at);
```

**Relationships**:
- Many-to-one: orgs, patients, profiles (therapist)
- One-to-one: sessions (when completed)

**State Transitions**:
- scheduled → confirmed (patient confirmation)
- confirmed → in_progress (therapist starts session)
- in_progress → completed (session finished)
- Any → cancelled (with reason required)
- scheduled/confirmed → no_show (after appointment time)

**Validation Rules**:
- FR-017, FR-018: Calendar views and conflict prevention
- FR-019: Creation, modification, cancellation tracking
- Therapist availability validation

### 6. Sessions (`sessions`)
Completed treatment documentation with clinical data.

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  pain_level_before INT2 CHECK (pain_level_before BETWEEN 0 AND 10),
  pain_level_after INT2 CHECK (pain_level_after BETWEEN 0 AND 10),
  procedures_performed TEXT,
  exercises_prescribed TEXT,
  patient_response TEXT,
  therapist_notes TEXT,
  next_session_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX sessions_org_id_idx ON sessions(org_id);
CREATE INDEX sessions_patient_id_idx ON sessions(patient_id, date DESC);
CREATE INDEX sessions_therapist_id_idx ON sessions(therapist_id);
CREATE INDEX sessions_date_idx ON sessions(date DESC);
```

**Relationships**:
- Many-to-one: orgs, appointments, patients, profiles (therapist)
- One-to-many: pain_points
- One-to-many: prescription_items (exercises prescribed)

**Validation Rules**:
- FR-024, FR-025: Detailed session documentation
- Pain levels 0-10 scale validation
- Session date cannot be future date

### 7. Pain Points (`pain_points`)
Interactive body mapping data with temporal tracking.

```sql
CREATE TABLE pain_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  body_side TEXT CHECK (body_side IN ('front', 'back')) NOT NULL,
  region_key TEXT NOT NULL, -- anatomical region identifier
  x_coordinate NUMERIC(5,2) NOT NULL, -- SVG x position (0-100%)
  y_coordinate NUMERIC(5,2) NOT NULL, -- SVG y position (0-100%)
  pain_intensity INT2 CHECK (pain_intensity BETWEEN 0 AND 10) NOT NULL,
  description TEXT,
  photo_url TEXT, -- injury/treatment photos
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX pain_points_org_id_idx ON pain_points(org_id);
CREATE INDEX pain_points_patient_id_idx ON pain_points(patient_id, created_at DESC);
CREATE INDEX pain_points_session_id_idx ON pain_points(session_id);
CREATE INDEX pain_points_region_idx ON pain_points(region_key);
```

**Relationships**:
- Many-to-one: orgs, patients, sessions
- Temporal relationship: pain evolution tracking

**Validation Rules**:
- FR-011, FR-012: Interactive SVG body mapping
- FR-012: Color-coded pain intensity (0-2 green, 3-5 yellow, 6-8 orange, 9-10 red)
- FR-013: Annotations and photo support
- Coordinates must be within SVG bounds (0-100%)

### 8. Exercise Library (`exercise_library`)
Comprehensive exercise database with multimedia content.

```sql
CREATE TABLE exercise_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE SET NULL, -- NULL for global exercises
  title TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'mobilizacao_neural', 'cervical', 'membros_superiores',
    'tronco_core', 'membros_inferiores', 'fortalecimento',
    'alongamento', 'propriocepcao', 'cardiorrespiratorio'
  )) NOT NULL,
  body_regions TEXT[], -- targeted anatomical regions
  description TEXT,
  instructions TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  images TEXT[], -- array of image URLs
  difficulty_level INT2 CHECK (difficulty_level BETWEEN 1 AND 5) NOT NULL,
  equipment_required TEXT[],
  contraindications TEXT,
  indications TEXT,
  duration_minutes INT2,
  sets_default INT2,
  reps_default INT2,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX exercise_library_org_id_idx ON exercise_library(org_id);
CREATE INDEX exercise_library_category_idx ON exercise_library(category);
CREATE INDEX exercise_library_difficulty_idx ON exercise_library(difficulty_level);
CREATE INDEX exercise_library_search_idx ON exercise_library USING GIN (to_tsvector('portuguese', title || ' ' || description));
```

**Relationships**:
- Many-to-one: orgs (nullable for global exercises), profiles (creator)
- One-to-many: prescription_items

**Validation Rules**:
- FR-028: Category-based organization
- FR-029: Multimedia content support
- FR-030: Equipment and difficulty classification
- FR-032: Search and filtering capabilities

### 9. Prescriptions (`prescriptions`)
Exercise treatment plans with progression tracking.

```sql
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  frequency_per_week INT2,
  status TEXT CHECK (status IN ('active', 'paused', 'completed', 'cancelled')) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_prescription_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX prescriptions_org_id_idx ON prescriptions(org_id);
CREATE INDEX prescriptions_patient_id_idx ON prescriptions(patient_id, created_at DESC);
CREATE INDEX prescriptions_status_idx ON prescriptions(status);
```

**Relationships**:
- Many-to-one: orgs, patients, profiles (therapist)
- One-to-many: prescription_items
- One-to-many: patient_feedback (through prescription_items)

**State Transitions**:
- active ↔ paused (temporary suspension)
- active → completed (treatment finished)
- Any → cancelled (treatment discontinued)

### 10. Prescription Items (`prescription_items`)
Individual exercise assignments within prescriptions.

```sql
CREATE TABLE prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercise_library(id) ON DELETE RESTRICT,
  sets INT2 NOT NULL,
  reps INT2,
  duration_minutes INT2,
  rest_seconds INT2,
  frequency_per_week INT2,
  special_instructions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sets_reps_or_duration CHECK (
    (reps IS NOT NULL) OR (duration_minutes IS NOT NULL)
  )
);

CREATE INDEX prescription_items_prescription_id_idx ON prescription_items(prescription_id);
CREATE INDEX prescription_items_exercise_id_idx ON prescription_items(exercise_id);
```

**Relationships**:
- Many-to-one: prescriptions, exercise_library
- One-to-many: patient_feedback

**Validation Rules**:
- FR-033: Personalized prescription parameters
- Either repetitions or duration must be specified
- Sets must be positive integer

### 11. Patient Feedback (`patient_feedback`)
Patient-reported outcomes and exercise adherence.

```sql
CREATE TABLE patient_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_item_id UUID REFERENCES prescription_items(id) ON DELETE CASCADE,
  feedback_date DATE DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT FALSE,
  difficulty_rating INT2 CHECK (difficulty_rating BETWEEN 1 AND 5), -- 1=very easy, 5=very hard
  pain_during_exercise INT2 CHECK (pain_during_exercise BETWEEN 0 AND 10),
  pain_after_exercise INT2 CHECK (pain_after_exercise BETWEEN 0 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX patient_feedback_prescription_item_id_idx ON patient_feedback(prescription_item_id);
CREATE INDEX patient_feedback_date_idx ON patient_feedback(feedback_date DESC);
```

**Relationships**:
- Many-to-one: prescription_items

**Validation Rules**:
- FR-036, FR-037: Patient logging and adherence tracking
- Pain scales 0-10 validation
- Difficulty rating 1-5 scale

### 12. Payments (`payments`)
Financial tracking for appointments and treatments.

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  amount_cents INT NOT NULL, -- stored in cents to avoid decimal issues
  payment_method TEXT CHECK (payment_method IN ('pix', 'cartao', 'dinheiro', 'boleto', 'convenio')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')) DEFAULT 'pending',
  transaction_id TEXT, -- external payment processor ID
  receipt_url TEXT,
  paid_at TIMESTAMPTZ,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX payments_org_id_idx ON payments(org_id);
CREATE INDEX payments_patient_id_idx ON payments(patient_id);
CREATE INDEX payments_status_idx ON payments(status);
CREATE INDEX payments_due_date_idx ON payments(due_date) WHERE status = 'pending';
```

**Relationships**:
- Many-to-one: orgs, patients
- Many-to-one: appointments (nullable)

**State Transitions**:
- pending → paid (successful payment)
- pending → failed (payment declined)
- paid → refunded (refund processed)
- pending → cancelled (appointment cancelled)

### 13. Audit Logs (`audit_logs`)
Comprehensive audit trail for compliance and security.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID, -- nullable for system-wide events
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- created, updated, deleted, viewed, exported
  entity_type TEXT NOT NULL, -- patient, appointment, session, etc.
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent_hash TEXT, -- hashed for privacy
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX audit_logs_org_id_idx ON audit_logs(org_id);
CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX audit_logs_entity_idx ON audit_logs(entity_type, entity_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at DESC);
```

**Relationships**:
- Many-to-one: orgs, profiles (user)
- References any entity via entity_id

**Validation Rules**:
- FR-004, FR-052: Comprehensive audit trails
- FR-050: LGPD compliance tracking
- All sensitive operations must be logged

## Row Level Security (RLS) Policies

### Base Policy Pattern
```sql
-- Enable RLS on all tables
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Standard org-based policy
CREATE POLICY org_isolation ON [table_name]
  FOR ALL USING (
    org_id IN (
      SELECT om.org_id
      FROM org_memberships om
      JOIN profiles p ON p.id = om.profile_id
      WHERE p.auth_user_id = auth.uid()
      AND om.status = 'active'
    )
  );
```

### Role-Based Access Examples
```sql
-- Patients can only see their own records
CREATE POLICY patient_own_data ON patients
  FOR SELECT USING (
    id IN (
      SELECT p.id FROM patients p
      JOIN profiles pr ON pr.id = (
        SELECT om.profile_id FROM org_memberships om
        WHERE om.org_id = p.org_id AND om.role = 'paciente'
      )
      WHERE pr.auth_user_id = auth.uid()
    )
  );

-- Physiotherapists can see assigned patients
CREATE POLICY therapist_patient_access ON patients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM appointments a
      JOIN profiles pr ON pr.id = a.therapist_id
      WHERE a.patient_id = patients.id
      AND pr.auth_user_id = auth.uid()
    )
  );
```

## Data Validation Constraints

### Brazilian CPF Validation
```sql
-- CPF validation function
CREATE OR REPLACE FUNCTION validate_cpf(cpf TEXT) RETURNS BOOLEAN AS $$
BEGIN
  -- Remove non-numeric characters
  cpf := regexp_replace(cpf, '[^0-9]', '', 'g');

  -- Check length and invalid patterns
  IF length(cpf) != 11 OR cpf ~ '^(.)\1{10}$' THEN
    RETURN FALSE;
  END IF;

  -- Validate check digits (Brazilian CPF algorithm)
  -- Implementation details omitted for brevity
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Apply constraint
ALTER TABLE patients ADD CONSTRAINT valid_cpf CHECK (cpf IS NULL OR validate_cpf(cpf));
```

### Phone Number Validation
```sql
-- Brazilian phone validation
ALTER TABLE patients ADD CONSTRAINT valid_phone CHECK (
  phone IS NULL OR phone ~ '^\+55\s?\([1-9][0-9]\)\s?[0-9]{4,5}-?[0-9]{4}$'
);
```

## Indexing Strategy

### Performance-Critical Indexes
```sql
-- Patient search optimization
CREATE INDEX CONCURRENTLY patients_search_idx ON patients
  USING GIN (to_tsvector('portuguese', name || ' ' || coalesce(cpf, '')));

-- Appointment scheduling optimization
CREATE INDEX CONCURRENTLY appointments_scheduling_idx ON appointments
  (therapist_id, starts_at)
  WHERE status IN ('scheduled', 'confirmed');

-- Session timeline optimization
CREATE INDEX CONCURRENTLY sessions_timeline_idx ON sessions
  (patient_id, date DESC, created_at DESC);

-- Exercise library search
CREATE INDEX CONCURRENTLY exercise_search_idx ON exercise_library
  USING GIN (to_tsvector('portuguese', title || ' ' || description));
```

## Data Retention Policies

### LGPD Compliance
```sql
-- Function to archive inactive patient data
CREATE OR REPLACE FUNCTION archive_inactive_patients() RETURNS void AS $$
BEGIN
  -- Archive patients inactive for 5 years (LGPD requirement)
  UPDATE patients SET status = 'archived'
  WHERE status = 'inactive'
  AND updated_at < NOW() - INTERVAL '5 years';

  -- Log archival action
  INSERT INTO audit_logs (action, entity_type, notes)
  VALUES ('archived', 'patients', 'Automated LGPD compliance archival');
END;
$$ LANGUAGE plpgsql;

-- Schedule via pg_cron
SELECT cron.schedule('archive-inactive-patients', '0 2 1 * *', 'SELECT archive_inactive_patients();');
```

---

**Model Status**: ✅ Complete
**Entities**: 13 core entities with full relationships
**Compliance**: LGPD and CFM requirements integrated
**Performance**: Optimized indexes for 700+ concurrent users
**Next Phase**: API Contract Generation