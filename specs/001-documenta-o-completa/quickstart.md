# FisioFlow Quickstart Guide

**Date**: 2025-09-14
**Purpose**: Comprehensive setup and validation guide for FisioFlow physiotherapy management system
**Target**: Development team, QA engineers, system administrators

## Table of Contents
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Database Configuration](#database-configuration)
- [Environment Configuration](#environment-configuration)
- [Application Startup](#application-startup)
- [Core Feature Validation](#core-feature-validation)
- [Testing Framework](#testing-framework)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **Node.js**: v18.17.0 or higher
- **npm**: v9.0.0 or higher (or **yarn**: v1.22.0+)
- **Git**: v2.40.0 or higher
- **PostgreSQL**: v15+ (for local development)

### Required Accounts
- **Supabase**: Create project at [supabase.com](https://supabase.com)
- **Vercel**: Account at [vercel.com](https://vercel.com)
- **Resend**: Account at [resend.com](https://resend.com)
- **Upstash**: Account at [upstash.com](https://upstash.com)
- **Sentry**: Account at [sentry.io](https://sentry.io)

### Development Tools (Recommended)
- **VS Code** with extensions:
  - Prettier
  - ESLint
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

---

## Development Setup

### 1. Clone Repository
```bash
# Clone the FisioFlow repository
git clone https://github.com/your-org/fisioflow.git
cd fisioflow

# Checkout the implementation branch
git checkout 001-documenta-o-completa
```

### 2. Install Dependencies
```bash
# Install all project dependencies
npm install

# Verify installation
npm list --depth=0
```

**Expected Key Dependencies:**
- `next`: ^14.0.0
- `react`: ^18.0.0
- `@supabase/supabase-js`: ^2.0.0
- `tailwindcss`: ^3.0.0
- `zod`: ^3.0.0
- `react-hook-form`: ^7.0.0

### 3. Install shadcn/ui Components
```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Install core UI components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add calendar
```

---

## Database Configuration

### 1. Supabase Project Setup
```bash
# Create new Supabase project via CLI
npx supabase login
npx supabase init
npx supabase start
```

### 2. Database Schema Setup
```sql
-- Execute in Supabase SQL Editor or via CLI
-- Copy schema from specs/001-documenta-o-completa/data-model.md

-- 1. Create organizations table
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Continue with all tables from data-model.md...
```

### 3. Row Level Security Setup
```sql
-- Enable RLS on all tables
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
-- ... (continue for all tables)

-- Create base RLS policies
CREATE VIEW v_user_orgs AS
SELECT om.org_id, om.profile_id
FROM org_memberships om
WHERE om.profile_id = (
  SELECT id FROM profiles
  WHERE auth_user_id = auth.uid()
);

-- Apply org isolation policy to each table
CREATE POLICY org_isolation ON patients
  FOR ALL USING (org_id IN (SELECT org_id FROM v_user_orgs));
```

### 4. Storage Buckets Setup
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('patient-photos', 'patient-photos', false),
  ('exercise-videos', 'exercise-videos', true),
  ('clinical-documents', 'clinical-documents', false);

-- Set up storage policies
CREATE POLICY "Users can upload patient photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'patient-photos');

CREATE POLICY "Users can view exercise videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'exercise-videos');
```

---

## Environment Configuration

### 1. Create Environment Files
```bash
# Development environment
cp .env.example .env.local

# Add required environment variables
```

### 2. Environment Variables (.env.local)
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Application Configuration
APP_BASE_URL=http://localhost:3000
ENCRYPTION_KEY=your-32-byte-encryption-key

# Email Configuration (Resend)
RESEND_API_KEY=re_your-api-key
EMAIL_FROM="FisioFlow <no-reply@fisioflow.com>"

# Observability (Sentry)
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENV=development

# Queue Management (QStash)
QSTASH_URL=https://qstash.upstash.io
QSTASH_CURRENT_SIGNING_KEY=your-current-key
QSTASH_NEXT_SIGNING_KEY=your-next-key

# Payment Integration (Future)
PIX_PROVIDER=GERENCIANET
PIX_CLIENT_ID=your-client-id
PIX_CLIENT_SECRET=your-client-secret
```

### 3. Validate Configuration
```bash
# Check environment variables
npm run validate-env

# Expected output: ✅ All environment variables configured
```

---

## Application Startup

### 1. Development Server
```bash
# Start development server
npm run dev

# Verify startup
curl http://localhost:3000/api/health

# Expected response:
# {"status": "healthy", "timestamp": "2025-09-14T10:00:00.000Z"}
```

### 2. Database Migrations
```bash
# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed

# Expected output:
# ✅ Database migrated successfully
# ✅ Sample data seeded (1 org, 2 users, 10 patients)
```

### 3. Verify Core Services
```bash
# Test Supabase connection
curl http://localhost:3000/api/test/supabase
# Expected: {"connected": true, "version": "15.x"}

# Test authentication
curl http://localhost:3000/api/test/auth
# Expected: {"auth_enabled": true, "providers": ["email", "magic_link"]}

# Test storage
curl http://localhost:3000/api/test/storage
# Expected: {"buckets": 3, "accessible": true}
```

---

## Core Feature Validation

### 1. Authentication Flow
```bash
# Test user registration
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@fisioflow.com",
    "password": "TestPass123!",
    "name": "Test User",
    "role": "admin"
  }'

# Expected: {"user": {...}, "access_token": "..."}
```

**Manual Validation:**
1. Navigate to `http://localhost:3000/login`
2. Enter credentials: `admin@clinica.com` / `admin123`
3. Verify redirect to role-appropriate dashboard
4. Check user profile in top navigation

### 2. Patient Management
```bash
# Create test patient
curl -X POST http://localhost:3000/api/patients \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Silva",
    "cpf": "12345678901",
    "date_of_birth": "1985-06-15",
    "phone": "+55 (11) 99999-9999",
    "email": "maria@example.com",
    "consent_lgpd": true
  }'

# Expected: {"id": "uuid", "name": "Maria Silva", ...}
```

**Manual Validation:**
1. Navigate to `/patients`
2. Click "Novo Paciente"
3. Fill required fields (name, CPF, birth date, phone, email)
4. Submit form and verify patient appears in list
5. Test search functionality with patient name

### 3. Appointment Scheduling
```bash
# Create test appointment
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "patient-uuid",
    "therapist_id": "therapist-uuid",
    "starts_at": "2025-09-15T09:00:00Z",
    "ends_at": "2025-09-15T10:00:00Z",
    "type": "avaliacao"
  }'

# Expected: {"id": "uuid", "status": "scheduled", ...}
```

**Manual Validation:**
1. Navigate to `/appointments`
2. Verify calendar view loads correctly
3. Click "Novo Agendamento"
4. Select patient, therapist, date, and time
5. Submit and verify appointment appears on calendar
6. Test conflict detection by scheduling overlapping appointment

### 4. Body Mapping System
**Manual Validation:**
1. Navigate to patient details page
2. Click "Mapa Corporal" tab
3. Click on body region (shoulder, knee, etc.)
4. Set pain intensity (0-10) and add description
5. Submit and verify pain point is saved
6. Check timeline view shows pain evolution

### 5. Exercise Library
```bash
# Create test exercise
curl -X POST http://localhost:3000/api/exercises \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Flexão Cervical",
    "category": "cervical",
    "difficulty_level": 2,
    "description": "Movimento de flexão da região cervical",
    "instructions": "Incline a cabeça suavemente para frente..."
  }'

# Expected: {"id": "uuid", "title": "Flexão Cervical", ...}
```

**Manual Validation:**
1. Navigate to `/exercises`
2. Verify exercise library loads with categories
3. Test search functionality
4. Filter by category and difficulty level
5. Create new exercise with video upload
6. Verify exercise appears in library

### 6. Exercise Prescription
**Manual Validation:**
1. Navigate to patient details
2. Click "Prescrições" tab
3. Click "Nova Prescrição"
4. Add exercises from library
5. Customize sets, reps, frequency
6. Submit prescription
7. Verify patient can access via patient portal

---

## Testing Framework

### 1. Unit Tests
```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Expected: All tests passing, >80% coverage
```

### 2. Integration Tests
```bash
# Run integration tests (requires test database)
npm run test:integration

# Test specific module
npm run test:integration -- --testPathPattern=patients

# Expected: All integration tests passing
```

### 3. End-to-End Tests
```bash
# Start test environment
npm run test:e2e:setup

# Run E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- --spec="patient-management"

# Expected: All E2E scenarios passing
```

### 4. Contract Tests
```bash
# Validate API contracts
npm run test:contract

# Generate contract documentation
npm run docs:api

# Expected: All API endpoints match OpenAPI specification
```

---

## Production Deployment

### 1. Build Validation
```bash
# Build production bundle
npm run build

# Analyze bundle size
npm run analyze

# Expected: Build successful, no critical warnings
```

### 2. Performance Testing
```bash
# Run Lighthouse CI
npm run lighthouse

# Load testing (requires production environment)
npm run test:load

# Expected: Lighthouse score >90, load test passes
```

### 3. Security Validation
```bash
# Security audit
npm audit --audit-level=moderate

# LGPD compliance check
npm run compliance:lgpd

# Expected: No security vulnerabilities, LGPD compliant
```

### 4. Deployment Steps
```bash
# Deploy to Vercel
vercel --prod

# Run post-deployment tests
npm run test:deployment

# Expected: Deployment successful, all health checks pass
```

---

## Troubleshooting

### Common Issues

#### 1. Supabase Connection Issues
**Symptom**: Database connection errors, RLS policy denials
```bash
# Check Supabase connection
npx supabase status

# Reset local Supabase
npx supabase stop
npx supabase start

# Verify RLS policies
npm run db:check-rls
```

#### 2. Authentication Problems
**Symptom**: Login failures, token validation errors
```bash
# Verify JWT configuration
npm run test:auth

# Check Supabase Auth settings
npx supabase dashboard

# Reset user password
npm run auth:reset-password -- --email=user@example.com
```

#### 3. File Upload Issues
**Symptom**: Patient photo uploads fail, storage errors
```bash
# Check storage buckets
npm run storage:status

# Test file upload
curl -X POST http://localhost:3000/api/test/upload \
  -F "file=@test-image.jpg"

# Expected: Upload successful, URL returned
```

#### 4. Performance Issues
**Symptom**: Slow page loads, API timeouts
```bash
# Profile application
npm run profile

# Check database performance
npm run db:analyze

# Monitor with Sentry
npm run monitor:start
```

### Database Issues

#### Reset Database
```bash
# Reset development database
npm run db:reset

# Re-run migrations
npm run db:migrate

# Re-seed data
npm run db:seed
```

#### Check Database Health
```sql
-- Monitor active connections
SELECT count(*) FROM pg_stat_activity;

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### Environment Issues

#### Validate Environment
```bash
# Check all environment variables
npm run env:check

# Test external services
npm run services:health

# Expected output:
# ✅ Supabase: Connected
# ✅ Resend: API key valid
# ✅ QStash: Queue accessible
# ✅ Sentry: Monitoring active
```

---

## Feature Validation Checklist

### ✅ Core Features
- [ ] User authentication (login/logout)
- [ ] Role-based access control (admin, fisioterapeuta, estagiário, paciente)
- [ ] Patient CRUD operations
- [ ] CPF validation and formatting
- [ ] Patient photo upload
- [ ] Appointment scheduling
- [ ] Appointment conflict detection
- [ ] Interactive body mapping
- [ ] Pain point tracking and timeline
- [ ] Exercise library management
- [ ] Exercise prescription system
- [ ] Patient exercise portal
- [ ] Clinical report generation
- [ ] Dashboard analytics

### ✅ Compliance Features
- [ ] LGPD consent management
- [ ] Data export functionality
- [ ] Data deletion (right to erasure)
- [ ] Audit logging
- [ ] Medical data encryption
- [ ] Access control enforcement

### ✅ Performance Features
- [ ] Page load times <1.5s
- [ ] API responses <200ms
- [ ] Mobile responsiveness
- [ ] PWA functionality
- [ ] Offline capabilities (limited)

### ✅ Integration Features
- [ ] Email notifications
- [ ] File storage (Supabase)
- [ ] PDF generation
- [ ] Real-time updates
- [ ] Error monitoring (Sentry)

---

## Next Steps

After successful quickstart validation:

1. **Review Implementation Plan**: See `plan.md` for detailed development phases
2. **Generate Tasks**: Run `/tasks` command to create implementation tasks
3. **Start Development**: Follow TDD approach from constitutional requirements
4. **Setup CI/CD**: Configure automated testing and deployment pipeline
5. **Production Preparation**: Setup monitoring, backup, and scaling strategies

## Support

- **Documentation**: Full API docs at `/docs/api`
- **Development Guide**: See `CLAUDE.md` for AI assistant context
- **Issue Tracking**: GitHub issues for bug reports and feature requests
- **Team Communication**: Slack #fisioflow-dev channel

---

**Quickstart Status**: ✅ Ready for development
**Last Updated**: 2025-09-14
**Next Phase**: Task generation and implementation execution