# FisioFlow Development Context for Claude Code

**Project**: FisioFlow - Comprehensive Physiotherapy Management System
**Version**: 1.0.0
**Last Updated**: 2025-09-14
**Branch**: 001-documenta-o-completa

## Project Overview

FisioFlow is a comprehensive healthcare management system for physiotherapy clinics handling 744+ patients with 669+ monthly appointments. The system supports multi-role access (Admin, Fisioterapeuta, Estagiário, Paciente) with LGPD compliance for Brazilian healthcare regulations.

### Core Features
- **Patient Management**: Complete CRUD with CPF validation, photos, medical records
- **Interactive Body Mapping**: SVG-based pain tracking with 0-10 intensity scale
- **Appointment Scheduling**: Real-time conflict prevention, calendar views
- **Exercise Library**: Categorized exercises with video demonstrations
- **Exercise Prescription**: Personalized treatment plans with patient portal access
- **Clinical Reporting**: PDF generation for progress reports and discharge summaries
- **Analytics Dashboard**: KPI tracking for clinic operations and treatment effectiveness
- **Financial Tracking**: Payment management with multiple methods (PIX, card, cash)

## Technical Stack

### Frontend
- **Framework**: Next.js 14 with App Router, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Context + Supabase real-time subscriptions

### Backend
- **Database**: PostgreSQL via Supabase with Row Level Security (RLS)
- **Authentication**: Supabase Auth with custom RBAC
- **Storage**: Supabase Storage for photos, videos, documents
- **API**: Next.js API Routes with Server Actions
- **Queue**: Upstash QStash for background jobs and reminders

### External Services
- **Hosting**: Vercel Pro (~R$ 120/month)
- **Database/Auth**: Supabase Pro (~R$ 150/month)
- **Email**: Resend for appointment reminders
- **Monitoring**: Sentry for error tracking
- **Files**: Supabase Storage + optional Cloudflare R2

## Project Structure

```
├── app/                          # Next.js App Router
│   ├── (auth)/login/             # Authentication pages
│   ├── dashboard/                # Role-based dashboards
│   │   ├── admin/
│   │   ├── fisioterapeuta/
│   │   └── paciente/
│   ├── patients/                 # Patient management
│   ├── appointments/             # Scheduling system
│   ├── exercises/                # Exercise library
│   ├── api/                      # API routes
│   └── middleware.ts             # Auth & RBAC middleware
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── patients/                 # Patient-specific components
│   ├── bodymap/                  # Interactive body mapping
│   ├── calendar/                 # Appointment scheduling
│   └── exercises/                # Exercise library components
├── lib/                          # Utility libraries
│   ├── supabase.ts               # Supabase client configuration
│   ├── auth.ts                   # Authentication helpers
│   ├── rbac.ts                   # Role-based access control
│   ├── validators/               # Zod validation schemas
│   └── utils.ts                  # General utilities
└── tests/                        # Testing framework
    ├── contract/                 # API contract tests
    ├── integration/              # Integration tests
    └── e2e/                      # End-to-end tests
```

## Database Schema (Key Tables)

### Core Entities
- **orgs**: Multi-tenant organization isolation
- **profiles**: User profiles linked to Supabase Auth
- **org_memberships**: Role-based access control
- **patients**: Complete patient records with LGPD compliance
- **appointments**: Scheduling with conflict prevention
- **sessions**: Treatment documentation
- **pain_points**: Interactive body mapping data
- **exercise_library**: Exercise database with multimedia
- **prescriptions**: Exercise treatment plans
- **patient_feedback**: Exercise adherence tracking
- **payments**: Financial management
- **audit_logs**: Compliance and security logging

### Row Level Security
All tables use RLS policies for org-based data isolation:
```sql
CREATE POLICY org_isolation ON [table_name]
  FOR ALL USING (org_id IN (SELECT org_id FROM v_user_orgs));
```

## Authentication & Authorization

### User Roles
- **admin**: Full system access, clinic management
- **fisioterapeuta**: Patient care, treatment documentation
- **estagiario**: Limited access under supervision
- **paciente**: Personal data access, exercise portal

### RBAC Implementation
```typescript
// lib/rbac.ts - Role checking utilities
export const hasPermission = (userRole: string, action: string, resource: string): boolean => {
  const permissions = {
    admin: ['*:*'],
    fisioterapeuta: ['patients:read', 'patients:write', 'sessions:write'],
    estagiario: ['patients:read', 'sessions:read'],
    paciente: ['own:read', 'prescriptions:read']
  };
  // Permission checking logic
};
```

## Key Development Patterns

### 1. Server Actions for Mutations
```typescript
// app/patients/actions.ts
'use server'

export async function createPatient(formData: FormData) {
  const supabase = createServerClient();
  const user = await getCurrentUser();

  // Validate permissions
  if (!hasPermission(user.role, 'write', 'patients')) {
    throw new Error('Insufficient permissions');
  }

  // Validate data with Zod
  const validated = patientSchema.parse(formData);

  // Insert with org isolation
  const { data, error } = await supabase
    .from('patients')
    .insert({ ...validated, org_id: user.org_id });

  return { data, error };
}
```

### 2. Real-time Subscriptions
```typescript
// components/calendar/AppointmentCalendar.tsx
useEffect(() => {
  const subscription = supabase
    .channel('appointments')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'appointments' },
      (payload) => {
        // Update calendar in real-time
        setAppointments(prev => updateAppointments(prev, payload));
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

### 3. Form Validation with Zod
```typescript
// lib/validators/patient.ts
export const patientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().refine(validateCPF, 'CPF inválido'),
  date_of_birth: z.date(),
  phone: z.string().regex(BRAZILIAN_PHONE_REGEX, 'Telefone inválido'),
  email: z.string().email('Email inválido'),
  consent_lgpd: z.boolean().refine(val => val, 'Consentimento LGPD obrigatório')
});
```

## LGPD Compliance Requirements

### Data Subject Rights
- **Consent Management**: Explicit consent with timestamp logging
- **Data Access**: Export patient data in JSON/PDF format
- **Data Correction**: Allow patients to update their information
- **Data Deletion**: Right to erasure with anonymization
- **Data Portability**: Export in structured format

### Implementation
```typescript
// lib/lgpd.ts
export const exportPatientData = async (patientId: string) => {
  // Check user permissions
  const user = await getCurrentUser();
  if (!canAccessPatient(user, patientId)) {
    throw new Error('Unauthorized');
  }

  // Collect all patient data
  const data = await collectPatientData(patientId);

  // Log export action for audit
  await logAuditEvent('data_export', 'patient', patientId);

  return generateExportFile(data);
};
```

## Performance Optimizations

### Database Queries
- **Indexes**: Optimized for patient search, appointment scheduling
- **RLS Optimization**: Efficient policies to minimize query overhead
- **Connection Pooling**: PgBouncer for concurrent user handling

### Frontend Performance
- **Image Optimization**: Next.js Image component for patient photos
- **Code Splitting**: Lazy loading for complex components
- **Caching**: SWR for data fetching with real-time updates

## Error Handling

### API Error Responses
```typescript
// lib/api-response.ts
export const handleApiError = (error: unknown) => {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.errors },
      { status: 422 }
    );
  }

  if (error instanceof PostgrestError) {
    return NextResponse.json(
      { error: 'Database error', code: error.code },
      { status: 500 }
    );
  }

  // Log to Sentry
  captureException(error);

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
};
```

## Testing Strategy

### Test-Driven Development (TDD)
1. **Contract Tests**: Validate API endpoints match OpenAPI spec
2. **Integration Tests**: Test complete workflows with real database
3. **Unit Tests**: Component logic and utility functions
4. **E2E Tests**: Critical user journeys with Playwright

### Test Database
- Separate Supabase project for testing
- Database reset between test suites
- Seed data for consistent test scenarios

## Recent Changes (Last 3 Updates)

1. **2025-09-14**: Complete system specification and planning
2. **2025-09-14**: Database schema design with RLS policies
3. **2025-09-14**: API contracts definition and quickstart guide

## Common Commands

```bash
# Development
npm run dev                    # Start development server
npm run build                  # Build for production
npm run type-check            # TypeScript validation

# Database
npm run db:migrate            # Run database migrations
npm run db:seed              # Seed development data
npm run db:reset             # Reset development database

# Testing
npm run test                 # Unit tests
npm run test:integration     # Integration tests
npm run test:e2e            # End-to-end tests

# Code Quality
npm run lint                 # ESLint validation
npm run format               # Prettier formatting
npm run validate            # Full validation pipeline
```

## Development Guidelines

### Code Style
- **TypeScript**: Strict mode with comprehensive type definitions
- **Components**: Functional components with TypeScript props
- **Imports**: Absolute imports using `@/` alias
- **Naming**: camelCase for variables, PascalCase for components

### Security
- **Authentication**: Always validate user session and permissions
- **Input Validation**: Use Zod schemas for all user input
- **SQL Injection**: Use Supabase query builder, never raw SQL
- **XSS Prevention**: Sanitize user content in components

### Performance
- **Database**: Use RLS efficiently, minimize query complexity
- **Images**: Always use Next.js Image component
- **Bundle Size**: Monitor with webpack-bundle-analyzer
- **Real-time**: Use Supabase subscriptions judiciously

---

**Current Phase**: Implementation planning complete, ready for task generation
**Next Steps**: Generate implementation tasks, begin TDD development cycle
**Health Check**: All systems validated, development environment ready