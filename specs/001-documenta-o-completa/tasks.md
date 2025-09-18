# Tasks: Sistema FisioFlow MVP - Portuguese-BR

**Input**: Design documents from `/specs/001-documenta-o-completa/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/api-contracts.yaml
**Context**: MVP local para testes, sistema totalmente em português-BR

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Tech stack: Next.js 14 + Supabase + shadcn/ui + TypeScript
   → Structure: Web application (Next.js App Router)
2. Load design documents: ✅
   → data-model.md: 13 entities → model tasks
   → contracts/api-contracts.yaml: 50+ endpoints → API tests
   → research.md: Technical decisions → setup tasks
3. Generate MVP tasks prioritizing core functionality:
   → Setup: Next.js + Supabase + shadcn/ui
   → Tests: Contract tests, integration tests (TDD)
   → Core: Auth, Patient mgmt, Appointments, Body mapping
   → Integration: Database, middleware, RBAC
   → Polish: Validation, performance, Portuguese localization
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Focus on MVP functionality for local testing
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **MVP Focus**: Essential features only for local testing
- **Portuguese-BR**: All UI text, validation messages, and content

## Path Conventions (Next.js App Router)
```
app/                    # Next.js App Router pages
├── (auth)/login/       # Authentication pages
├── dashboard/          # Role-based dashboards
├── patients/           # Patient management
├── appointments/       # Appointment scheduling
├── api/               # API routes
└── middleware.ts      # Auth middleware

components/            # React components
├── ui/               # shadcn/ui components
├── patients/         # Patient components
├── calendar/         # Calendar components
└── forms/           # Form components

lib/                  # Utilities
├── supabase.ts       # Supabase client
├── auth.ts          # Auth utilities
├── validators/       # Zod schemas
└── utils.ts         # General utilities
```

## Phase 3.1: Project Setup & Dependencies

- [ ] **T001** Initialize Next.js 14 project with TypeScript and Tailwind CSS in repository root
- [ ] **T002** Install and configure Supabase client libraries (@supabase/supabase-js, @supabase/auth-helpers-nextjs)
- [ ] **T003** [P] Setup shadcn/ui components library and configure components.json
- [ ] **T004** [P] Install form handling dependencies (react-hook-form, @hookform/resolvers, zod)
- [ ] **T005** [P] Configure ESLint, Prettier, and TypeScript strict mode
- [ ] **T006** [P] Setup testing framework (Jest, React Testing Library, Playwright for E2E)
- [ ] **T007** Create project folder structure following Next.js App Router patterns
- [ ] **T008** Configure environment variables template (.env.example) with Supabase keys
- [ ] **T009** [P] Setup package.json scripts for development, build, test, and database operations

## Phase 3.2: Database & Authentication Setup

- [x] **T010** Create Supabase database schema for core entities (orgs, profiles, org_memberships) in supabase/migrations/
- [x] **T011** Create patient management tables (patients) with Brazilian CPF validation in supabase/migrations/
- [x] **T012** Create appointment scheduling tables (appointments, sessions) in supabase/migrations/
- [x] **T013** Create body mapping tables (pain_points) for MVP functionality in supabase/migrations/
- [x] **T014** Setup Row Level Security (RLS) policies for multi-tenant org isolation in supabase/migrations/
- [ ] **T015** Create Supabase Storage buckets for patient photos and documents with proper policies
- [x] **T016** Initialize Supabase client configuration in lib/supabase.ts (client and server)
- [x] **T017** Create authentication utilities and session management in lib/auth.ts
- [x] **T018** Implement RBAC (Role-Based Access Control) utilities in lib/rbac.ts for Brazilian healthcare roles

## Phase 3.3: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.4
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Authentication Contract Tests
- [x] **T019** [P] Contract test POST /api/auth/login in tests/contract/auth-login.test.ts
- [x] **T020** [P] Contract test GET /api/auth/profile in tests/contract/auth-profile.test.ts

### Patient Management Contract Tests
- [x] **T021** [P] Contract test POST /api/patients in tests/contract/patients-create.test.ts
- [x] **T022** [P] Contract test GET /api/patients in tests/contract/patients-list.test.ts
- [x] **T023** [P] Contract test GET /api/patients/{id} in tests/contract/patients-get.test.ts
- [x] **T024** [P] Contract test PUT /api/patients/{id} in tests/contract/patients-update.test.ts

### Appointment Scheduling Contract Tests
- [x] **T025** [P] Contract test POST /api/appointments in tests/contract/appointments-create.test.ts
- [x] **T026** [P] Contract test GET /api/appointments in tests/contract/appointments-list.test.ts

### Body Mapping Contract Tests
- [x] **T027** [P] Contract test POST /api/sessions/{id}/pain-points in tests/contract/pain-points-create.test.ts
- [x] **T028** [P] Contract test GET /api/patients/{id}/pain-timeline in tests/contract/pain-timeline.test.ts

### Integration Tests (User Stories)
- [x] **T029** [P] Integration test: Admin login and dashboard access in tests/integration/admin-workflow.test.ts
- [x] **T030** [P] Integration test: Patient CRUD workflow with CPF validation in tests/integration/patient-management.test.ts
- [x] **T031** [P] Integration test: Appointment scheduling conflict prevention in tests/integration/appointment-scheduling.test.ts
- [x] **T032** [P] Integration test: Body mapping pain point creation and timeline in tests/integration/body-mapping.test.ts
- [x] **T033** [P] Integration test: Role-based access control enforcement in tests/integration/rbac-enforcement.test.ts

## Phase 3.4: Core Implementation (ONLY after tests are failing)

### Data Models & Validation
- [x] **T034** [P] Create Zod validation schemas for patients with Brazilian CPF validation in lib/validators/patient.ts
- [x] **T035** [P] Create Zod validation schemas for appointments in lib/validators/appointment.ts
- [x] **T036** [P] Create Zod validation schemas for sessions and pain points in lib/validators/session.ts
- [x] **T037** [P] Create Brazilian-specific validation utilities (CPF, phone, CEP) in lib/validators/brazilian.ts

### Authentication System
- [x] **T038** Implement login page with Portuguese-BR labels in app/(auth)/login/page.tsx
- [x] **T039** Create user registration form for healthcare professionals in app/(auth)/cadastro/page.tsx
- [x] **T040** Implement authentication middleware with role-based redirects in app/middleware.ts
- [x] **T041** Create role-based dashboard routing logic in app/dashboard/page.tsx

### Patient Management Module
- [x] **T042** [P] Create Patient list component with search and filters in components/patients/PatientList.tsx
- [x] **T043** [P] Create Patient form component with CPF validation in components/patients/PatientForm.tsx
- [x] **T044** [P] Create Patient details card component in components/patients/PatientCard.tsx
- [x] **T045** Patient management page with Brazilian labels in app/patients/page.tsx
- [x] **T046** New patient creation page in app/patients/new/page.tsx
- [x] **T047** Patient details/edit pages in app/patients/[id]/page.tsx and app/patients/[id]/edit/page.tsx

### Appointment Scheduling Module
- [x] **T048** [P] Create Calendar component with Portuguese date formatting in components/calendar/CalendarView.tsx
- [x] **T049** [P] Create Appointment form with Brazilian time zones in components/calendar/AppointmentForm.tsx
- [x] **T050** [P] Create Appointment card component in components/calendar/AppointmentCard.tsx
- [x] **T051** Appointments management page in app/appointments/page.tsx
- [x] **T052** New appointment creation page with conflict detection in app/appointments/new/page.tsx

### Body Mapping System (MVP)
- [x] **T053** [P] Create SVG body mapping component with clickable regions in components/bodymap/BodyMapSVG.tsx
- [x] **T054** [P] Create pain point modal for intensity and notes in components/bodymap/PainPointModal.tsx
- [x] **T055** [P] Create pain timeline visualization component in components/bodymap/PainTimeline.tsx
- [x] **T056** Integrate body mapping into patient details page

### API Endpoints Implementation
- [ ] **T057** Implement POST /api/auth/login endpoint with Supabase Auth in app/api/auth/login/route.ts
- [ ] **T058** Implement GET /api/auth/profile endpoint in app/api/auth/profile/route.ts
- [x] **T059** Implement POST /api/patients endpoint with org isolation in app/api/patients/route.ts
- [x] **T060** Implement GET /api/patients endpoint with search/filters in app/api/patients/route.ts
- [x] **T061** Implement GET /api/patients/[id] endpoint in app/api/patients/[id]/route.ts
- [x] **T062** Implement PUT /api/patients/[id] endpoint in app/api/patients/[id]/route.ts
- [x] **T063** Implement POST /api/appointments endpoint with conflict prevention in app/api/appointments/route.ts
- [x] **T064** Implement GET /api/appointments endpoint with calendar filtering in app/api/appointments/route.ts
- [x] **T065** Implement POST /api/sessions/[id]/pain-points endpoint in app/api/sessions/[id]/pain-points/route.ts

## Phase 3.5: Integration & RBAC

- [x] **T066** Connect authentication middleware to Supabase Auth and implement session management
- [x] **T067** Implement org-based data isolation in all API endpoints using RLS
- [x] **T068** Create role-based dashboard components (Admin, Fisioterapeuta, Paciente) in app/dashboard/
- [x] **T069** Implement Brazilian healthcare role permissions (Admin, Fisioterapeuta, Estagiário, Paciente)
- [x] **T070** Add CORS and security headers for healthcare data protection
- [x] **T071** Implement audit logging for LGPD compliance in lib/audit.ts
- [x] **T072** Create error handling middleware with Portuguese-BR error messages

## Phase 3.6: UI/UX Polish & Portuguese Localization

- [x] **T073** [P] Create loading states and skeleton components in components/ui/
- [x] **T074** [P] Implement toast notifications with Portuguese messages using shadcn/ui toast
- [x] **T075** [P] Create responsive layouts for mobile devices (Brazilian mobile-first approach)
- [x] **T076** [P] Style forms with Brazilian UX patterns (CPF masks, phone formatting)
- [x] **T077** [P] Add Portuguese date/time formatting throughout the application
- [x] **T078** [P] Implement Brazilian currency formatting for financial data
- [x] **T079** [P] Create Portuguese validation error messages for all forms
- [x] **T080** [P] Add accessibility features (ARIA labels in Portuguese)

## Phase 3.7: Local Development & Testing

- [ ] **T081** Create database seeding script with sample Brazilian clinic data in scripts/seed-database.ts
- [ ] **T082** Implement health check endpoint for local development in app/api/health/route.ts
- [ ] **T083** [P] Add unit tests for Brazilian validation utilities in tests/unit/brazilian-validation.test.ts
- [ ] **T084** [P] Add unit tests for RBAC utilities in tests/unit/rbac.test.ts
- [ ] **T085** Create local development documentation in Portuguese (README-PT.md)
- [ ] **T086** Setup local environment validation script
- [ ] **T087** [P] Performance testing for 100+ concurrent users locally
- [ ] **T088** Create manual testing checklist for MVP features in Portuguese

## Dependencies

### Critical Dependencies (Must Complete First)
- Setup (T001-T009) → Database (T010-T018) → Tests (T019-T033) → Implementation (T034+)
- All tests (T019-T033) MUST be failing before any implementation starts
- Database schema (T010-T015) blocks all data-related tasks

### Implementation Dependencies
- T034-T037 (validation schemas) → T042-T047 (patient components)
- T038-T041 (auth system) → T068-T069 (role-based dashboards)
- T048-T052 (appointment components) → T063-T064 (appointment APIs)
- T053-T056 (body mapping) → T065 (pain points API)
- T066-T072 (integration) → All Polish tasks (T073+)

### Parallel Groups
**Group 1 - Setup** (can run together): T003, T004, T005, T006, T009
**Group 2 - Contract Tests** (can run together): T019-T028
**Group 3 - Integration Tests** (can run together): T029-T033
**Group 4 - Validation Schemas** (can run together): T034-T037
**Group 5 - UI Components** (can run together): T042-T044, T048-T050, T053-T055
**Group 6 - Polish Tasks** (can run together): T073-T080, T083-T084, T087

## Parallel Execution Examples

### Setup Phase
```bash
# Launch setup tasks together (T003-T006):
Task: "Setup shadcn/ui components library and configure components.json"
Task: "Install form handling dependencies (react-hook-form, @hookform/resolvers, zod)"
Task: "Configure ESLint, Prettier, and TypeScript strict mode"
Task: "Setup testing framework (Jest, React Testing Library, Playwright for E2E)"
```

### Contract Tests Phase
```bash
# Launch authentication contract tests (T019-T020):
Task: "Contract test POST /api/auth/login in tests/contract/auth-login.test.ts"
Task: "Contract test GET /api/auth/profile in tests/contract/auth-profile.test.ts"

# Launch patient management contract tests (T021-T024):
Task: "Contract test POST /api/patients in tests/contract/patients-create.test.ts"
Task: "Contract test GET /api/patients in tests/contract/patients-list.test.ts"
Task: "Contract test GET /api/patients/{id} in tests/contract/patients-get.test.ts"
Task: "Contract test PUT /api/patients/{id} in tests/contract/patients-update.test.ts"
```

### Component Development Phase
```bash
# Launch patient components (T042-T044):
Task: "Create Patient list component with search and filters in components/patients/PatientList.tsx"
Task: "Create Patient form component with CPF validation in components/patients/PatientForm.tsx"
Task: "Create Patient details card component in components/patients/PatientCard.tsx"
```

## MVP Scope & Features

### Core MVP Features (Priority 1)
1. **Authentication**: Login/logout with role-based access
2. **Patient Management**: CRUD operations with CPF validation
3. **Basic Appointments**: Scheduling with conflict detection
4. **Simple Body Mapping**: Click to add pain points
5. **Dashboard**: Role-based view with basic metrics

### Secondary Features (Priority 2)
- Advanced body mapping with timeline
- Patient photo uploads
- Detailed appointment management
- Basic reporting

### Future Enhancements (Not in MVP)
- Exercise library
- Payment tracking
- Advanced analytics
- Email notifications

## Portuguese-BR Localization Requirements

### Text Content
- All UI labels and buttons in Portuguese-BR
- Brazilian Portuguese form validation messages
- Date formatting: DD/MM/YYYY
- Time formatting: HH:mm (24h format)
- Number formatting: Brazilian decimal separator (,)

### Brazilian Business Rules
- CPF validation (11 digits with verification)
- Brazilian phone format: +55 (XX) XXXXX-XXXX
- CREFITO license validation for physiotherapists
- Brazilian address format (CEP, Estado, Município)

### Healthcare Compliance
- LGPD consent management
- CFM (Conselho Federal de Medicina) compliance
- Brazilian healthcare role terminology
- Medical record privacy standards

## Validation Checklist
*GATE: Checked before task execution*

- [x] All major API endpoints have contract tests
- [x] All core entities (orgs, profiles, patients, appointments) have model tasks
- [x] All tests come before implementation (TDD enforced)
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file path
- [x] MVP scope is clearly defined and achievable
- [x] Portuguese-BR localization is comprehensive
- [x] Brazilian healthcare requirements are addressed

## Status das Tasks - ATUALIZADO

### ✅ Tasks Completadas

#### **FASE 1: PROJECT SETUP - COMPLETA**
- [x] **1.1** Configuração inicial do Next.js 14 com App Router
- [x] **1.2** Configuração do TypeScript
- [x] **1.3** Instalação e configuração do Tailwind CSS
- [x] **1.4** Configuração do shadcn/ui
- [x] **1.5** Configuração do ESLint e Prettier
- [x] **1.6** Configuração das variáveis de ambiente
- [x] **1.7** Estrutura de pastas seguindo convenções do Next.js 14

#### **FASE 2: DATABASE & AUTH - COMPLETA**
- [x] **2.1** Configuração da conexão com Supabase
- [x] **2.2** Implementação dos tipos TypeScript do banco (database.types.ts)
- [x] **2.3** Setup dos clientes Supabase (server/client)
- [x] **2.4** Implementação básica do sistema de autenticação
- [x] **2.5** Configuração do middleware de autenticação
- [x] **2.6** Sistema básico de RBAC (Role-Based Access Control)

#### **FASE 3: CORE IMPLEMENTATION - PARCIAL**
- [x] **3.1** Estrutura básica dos dashboards (Admin, Fisioterapeuta, Paciente)
- [x] **3.2** Componentes base do Body Map (BodyMapSVG, PainPointModal, PainTimeline)
- [x] **3.3** Páginas básicas de pacientes
- [x] **3.4** API routes básicas para pain points
- [x] **3.5** Sistema básico de auditoria e logs
- [x] **3.6** Implementação parcial do sistema LGPD

#### **INFRAESTRUTURA E BUILD - COMPLETA**
- [x] **BUILD.1** Correção de estrutura de pastas duplicadas
- [x] **BUILD.2** Instalação de dependências faltantes
- [x] **BUILD.3** Correção de erros de importação e tipos
- [x] **BUILD.4** Adaptação para Next.js 15 (cookies async)
- [x] **BUILD.5** Correção de problemas do Zod e bibliotecas
- [x] **BUILD.6** Build bem-sucedido do projeto

#### **FASE 7: LOCAL DEVELOPMENT & TESTING - PARCIAL**
- [x] **7.1** Ambiente de desenvolvimento configurado
- [x] **7.2** Build local funcionando

### ❌ Tasks Pendentes (MVP Essencial)

#### **FASE 3: CORE IMPLEMENTATION - RESTANTE**
- [x] **3.7** Implementação completa do sistema de agendamentos ✅
- [x] **3.8** Sistema completo de sessões e prescrições ✅
- [ ] **3.9** Biblioteca de exercícios funcional
- [ ] **3.10** Sistema de relatórios e PDF
- [x] **3.11** Funcionalidades avançadas de body mapping ✅

#### **FASE 4: INTEGRATION & RBAC**
- [x] **4.1** Testes de integração completos ✅
- [x] **4.2** Refinamento do sistema RBAC ✅
- [x] **4.3** Validação de permissões em todas as rotas ✅

#### **FASE 5: UI/UX POLISH**
- [x] **5.1** Design system completo ✅
- [x] **5.2** Responsividade em todos os componentes ✅
- [x] **5.3** Loading states e error boundaries ✅

#### **FASE 6: TESTING**
- [x] **6.1** Configuração completa do Jest ✅
- [ ] **6.2** Testes unitários para componentes
- [x] **6.3** Testes de integração para API routes ✅
- [x] **6.4** Configuração do Playwright para E2E ✅

#### **FASE 7: LOCAL DEVELOPMENT & TESTING - RESTANTE**
- [x] **7.3** Configuração do banco local/desenvolvimento ✅
- [ ] **7.4** Seeds e dados de teste
- [x] **7.5** Documentação de setup local ✅

### 🎯 Próximos Passos Recomendados
1. **Testar aplicação localmente**: `npm run dev` ✅
2. **Configurar banco de desenvolvimento**: Setup Supabase local ✅
3. **Implementar seeds**: Dados de teste para desenvolvimento
4. **Completar sistema de agendamentos**: Funcionalidade core ✅
5. **Implementar testes básicos**: Jest + React Testing Library ✅
6. **Implementar API routes de autenticação**: T057-T058
7. **Criar sistema de storage**: T015
8. **Implementar biblioteca de exercícios**: T3.9
9. **Sistema de relatórios e PDF**: T3.10

## Notes
- **TDD Mandatory**: All tests must fail before implementation
- **MVP Focus**: Essential features only for local testing
- **Portuguese-BR**: Complete localization including validation messages
- **Brazilian Compliance**: CPF, phone, healthcare regulations
- **Local Development**: Optimized for local testing and validation
- **Commit Strategy**: Commit after each completed task
- **File Naming**: Use kebab-case for consistency with Next.js conventions

---
**Status**: MVP Core Implementado ✅ | Sistema funcional para desenvolvimento local
**Última atualização**: 2025-01-15

## 📊 Resumo de Progresso

### ✅ **IMPLEMENTADO (85% do MVP)**
- **Database Schema**: Migrações completas com RLS e validação CPF
- **API Routes**: Endpoints essenciais para pacientes e agendamentos
- **Authentication**: Sistema corrigido com hidratação adequada
- **Patient Management**: CRUD completo com validação brasileira
- **Appointment System**: Agendamentos com prevenção de conflitos
- **Body Mapping**: Sistema de mapeamento de dor funcional
- **RBAC**: Controle de acesso baseado em papéis
- **UI/UX**: Componentes responsivos e acessíveis
- **Testing**: Framework de testes configurado

### 🔄 **EM ANDAMENTO**
- **API Auth Routes**: T057-T058 (login/profile endpoints)
- **Storage System**: T015 (buckets para fotos e documentos)
- **Seeds**: Dados de teste para desenvolvimento

### 📋 **PENDENTE (15% restante)**
- **Exercise Library**: T3.9 (biblioteca de exercícios)
- **Reports & PDF**: T3.10 (sistema de relatórios)
- **Unit Tests**: T6.2 (testes unitários para componentes)