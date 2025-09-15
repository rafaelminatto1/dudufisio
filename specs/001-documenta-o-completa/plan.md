# Implementation Plan: Sistema FisioFlow - Comprehensive Physiotherapy Management System

**Branch**: `001-documenta-o-completa` | **Date**: 2025-09-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-documenta-o-completa/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → SUCCESS: Loaded comprehensive healthcare system spec
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend)
   → Set Structure Decision based on project type: WEB APPLICATION
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check ✓
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check ✓
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Comprehensive physiotherapy clinic management system supporting 744+ patients with multi-role access (Admin, Fisioterapeuta, Estagiário, Paciente). Core features include patient management, interactive body pain mapping, appointment scheduling, exercise library with prescription system, clinical reporting, and financial tracking. Technical approach uses Next.js with App Router, Supabase for backend services, and modern UI with shadcn/ui components, following LGPD compliance requirements.

## Technical Context
**Language/Version**: TypeScript/JavaScript (Next.js 14+ with App Router)
**Primary Dependencies**: Next.js, React 18+, Tailwind CSS, shadcn/ui, Zod, React Hook Form, Supabase Client
**Storage**: Supabase (PostgreSQL + Storage + Auth + Edge Functions)
**Testing**: Jest, React Testing Library, Playwright (E2E)
**Target Platform**: Web application (responsive mobile-first design)
**Project Type**: web - determines source structure (frontend + backend via Next.js)
**Performance Goals**: Lighthouse Score >90, FCP <1.5s, TTI <3s, CLS <0.1
**Constraints**: LGPD compliance, medical data encryption, CFM regulations, <200ms API response time
**Scale/Scope**: 744+ patients, 669+ monthly appointments, 4 user roles, 8 core modules, multi-tenant architecture

**Additional Technical Stack**:
- **Hosting**: Vercel Pro (~R$ 120/month)
- **Database/Auth/Storage**: Supabase Pro (~R$ 150/month)
- **Queue & Cron**: Upstash/QStash (~R$ 20/month)
- **Email**: Resend (R$ 0-40/month)
- **Monitoring**: Sentry (Free) + Vercel Analytics
- **Optional CDN/Video**: Cloudflare R2/Stream (~R$ 20/month)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (Next.js full-stack application)
- Using framework directly? (Yes - Next.js App Router without wrappers)
- Single data model? (Yes - unified healthcare entities)
- Avoiding patterns? (Direct Supabase client usage, no unnecessary abstractions)

**Architecture**:
- EVERY feature as library? (Yes - modular components and services)
- Libraries listed:
  - auth-lib: Authentication & RBAC
  - patient-lib: Patient management
  - bodymap-lib: Interactive body mapping
  - schedule-lib: Appointment scheduling
  - exercise-lib: Exercise library & prescription
  - reports-lib: Clinical reporting
  - financial-lib: Payment tracking
- CLI per library: (Each lib exposes utilities via Next.js API routes)
- Library docs: llms.txt format planned? (Yes - CLAUDE.md for development context)

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? (Yes - tests written before implementation)
- Git commits show tests before implementation? (Yes - TDD workflow)
- Order: Contract→Integration→E2E→Unit strictly followed? (Yes)
- Real dependencies used? (Yes - actual Supabase instance for testing)
- Integration tests for: new libraries, contract changes, shared schemas? (Yes)
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? (Yes - Sentry integration)
- Frontend logs → backend? (Yes - unified error tracking)
- Error context sufficient? (Yes - with user context and audit trails)

**Versioning**:
- Version number assigned? (1.0.0 - MAJOR.MINOR.BUILD)
- BUILD increments on every change? (Yes - CI/CD pipeline)
- Breaking changes handled? (Yes - database migrations and API versioning)

## Project Structure

### Documentation (this feature)
```
specs/001-documenta-o-completa/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Web application structure (Next.js App Router)
app/
├── (auth)/
│   └── login/
├── dashboard/
│   ├── admin/
│   ├── fisioterapeuta/
│   └── paciente/
├── patients/
│   ├── new/
│   └── [id]/
├── appointments/
│   ├── new/
│   └── [id]/
├── exercises/
├── reports/
├── api/
│   ├── pdf/
│   ├── qstash/
│   └── pix/
├── globals.css
└── middleware.ts

components/
├── ui/               # shadcn/ui components
├── patients/         # Patient management components
├── bodymap/          # Interactive body mapping
├── calendar/         # Scheduling components
├── exercises/        # Exercise library components
├── reports/          # Reporting components
└── layout/           # Layout components

lib/
├── supabase.ts       # Supabase client configuration
├── auth.ts           # Authentication utilities
├── rbac.ts           # Role-based access control
├── pdf.ts            # PDF generation utilities
├── qstash.ts         # Queue management
├── validators/       # Zod schemas
└── utils.ts          # General utilities

tests/
├── contract/         # API contract tests
├── integration/      # Integration tests
├── e2e/             # End-to-end tests (Playwright)
└── unit/            # Unit tests (Jest)

public/
├── svgs/            # Body mapping SVG assets
├── icons/           # UI icons
└── images/          # Static images
```

**Structure Decision**: Web application (Option 2) - Next.js full-stack architecture with integrated frontend and backend

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - Research Next.js 14 App Router best practices for healthcare applications
   - Supabase Row Level Security implementation for multi-tenant medical data
   - LGPD compliance requirements for healthcare data processing
   - Interactive SVG body mapping implementation patterns
   - PDF generation for clinical reports with medical formatting
   - Real-time appointment scheduling with conflict prevention
   - Medical data encryption standards (transit and at rest)
   - Brazilian CPF validation and formatting libraries
   - Video streaming optimization for exercise demonstrations
   - Performance optimization for 744+ patient scale

2. **Generate and dispatch research agents**:
   ```
   Task: "Research Next.js App Router authentication patterns with Supabase for healthcare applications"
   Task: "Find LGPD compliance best practices for medical data handling in TypeScript applications"
   Task: "Research interactive SVG body mapping libraries compatible with React and mobile devices"
   Task: "Find medical PDF reporting standards and React/TypeScript implementation approaches"
   Task: "Research real-time scheduling systems with conflict prevention for healthcare appointments"
   Task: "Find Brazilian healthcare data regulations (CFM) and technical implementation requirements"
   Task: "Research performance optimization strategies for Next.js applications handling 700+ concurrent users"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all technical decisions documented

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Organizations, Profiles, Patients, Appointments, Sessions, Exercises
   - Pain Points, Prescriptions, Reports, Payments, Audit Logs
   - Validation rules from 54 functional requirements
   - State transitions for appointments, prescriptions, payments

2. **Generate API contracts** from functional requirements:
   - REST endpoints for each CRUD operation
   - Authentication and authorization contracts
   - File upload contracts for photos and videos
   - Real-time event contracts for notifications
   - Output OpenAPI schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - Authentication flow tests
   - Patient management API tests
   - Appointment scheduling tests
   - Body mapping data persistence tests
   - Exercise prescription tests
   - PDF generation tests
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Multi-role dashboard access scenarios
   - Patient management workflow scenarios
   - Body mapping interaction scenarios
   - Appointment scheduling scenarios
   - Exercise prescription and tracking scenarios
   - Clinical reporting scenarios
   - Quickstart test = complete patient treatment workflow

5. **Update CLAUDE.md incrementally**:
   - Add healthcare domain context
   - Add Next.js + Supabase tech stack
   - Add LGPD compliance requirements
   - Add medical data handling patterns
   - Keep under 150 lines for token efficiency

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate 6 major module implementation sequences
- Each module: contracts → data model → services → UI → tests
- Authentication & RBAC foundation first
- Core entities (patients, appointments) second
- Advanced features (body mapping, reporting) third

**Ordering Strategy**:
- TDD order: Tests before implementation for each component
- Dependency order:
  1. Database schema & RLS policies
  2. Authentication & role management
  3. Patient management (foundation)
  4. Appointment scheduling
  5. Session documentation & body mapping
  6. Exercise library & prescriptions
  7. Reporting & analytics
  8. Financial tracking
- Mark [P] for parallel UI component development

**Estimated Output**: 45-60 numbered, ordered tasks in tasks.md covering all 8 modules

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (12-week development roadmap following constitutional principles)
**Phase 5**: Validation (E2E testing, performance validation, LGPD compliance audit, production deployment)

## Complexity Tracking
*No constitutional violations - system designed within simplicity constraints*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All NEEDS CLARIFICATION resolved ✅
- [x] Complexity deviations documented ✅

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*