# Research Report: Technical Decisions for FisioFlow Healthcare System

**Date**: 2025-09-14
**Scope**: Comprehensive physiotherapy management system for 744+ patients with LGPD compliance
**Phase**: 0 - Technical Research & Decision Making

## 1. Next.js App Router Authentication with Supabase

**Decision**: Next.js 14 App Router with Supabase Authentication using server-side rendering and middleware-based session management.

**Rationale**:
- Supabase provides built-in PostgreSQL integration with authentication
- Server-side authentication ensures better security for healthcare data
- Middleware enables efficient session checks without database calls on every route
- Built-in Row Level Security (RLS) provides healthcare-grade data isolation between patients
- Native support for multi-role access control (admin, fisioterapeuta, estagiário, paciente)

**Alternatives Considered**:
- NextAuth.js: More complex setup, requires separate database management for user profiles
- Clerk: Third-party dependency with less control over sensitive healthcare data
- Auth0: Higher costs for healthcare scale, more complex RBAC configuration

**Implementation Details**:
- Separate Supabase clients for server/client components
- Custom claims via Auth Hooks for multi-role access
- Middleware for session refresh and route protection
- Roles stored in separate `org_memberships` table with foreign key to `auth.users`
- RLS policies using `auth.uid()` for data isolation

## 2. LGPD Compliance for Medical Data

**Decision**: Comprehensive LGPD compliance framework with 2024 amendments including 48-hour breach notification and expanded data subject rights.

**Rationale**:
- 2024 LGPD amendments require stricter breach notification (48 hours vs 72 hours)
- Healthcare data classified as sensitive personal data requiring explicit consent
- Physiotherapy systems must implement specific access controls for medical records
- Brazilian healthcare regulations require specialized compliance measures

**Alternatives Considered**:
- Basic GDPR compliance: Insufficient for Brazilian healthcare regulations
- Generic data protection framework: Doesn't address healthcare-specific LGPD requirements
- Manual compliance tracking: Not scalable for 744+ patients

**Implementation Details**:
- Data Protection Officer (DPO) role integrated into system
- Automated breach detection and notification system
- Granular consent management with detailed permissions
- Data subject request portal (access, correction, deletion, portability)
- Comprehensive audit logging for all data processing activities
- Medical record access limited to authorized healthcare professionals only

## 3. Interactive SVG Body Mapping

**Decision**: Custom SVG body mapping solution using `react-body-highlighter` as foundation with mobile-responsive enhancements.

**Rationale**:
- SVG provides scalable, responsive graphics optimal for mobile devices
- React component integration allows seamless state management
- Academic research validates SVG approach for digital pain mapping applications
- Better accessibility support compared to Canvas-based alternatives

**Alternatives Considered**:
- Canvas-based solutions: Less responsive, significant accessibility limitations
- Image-based mapping: Not scalable, poor mobile user experience
- Third-party mapping services: Data privacy concerns for healthcare applications

**Implementation Details**:
- `react-body-highlighter` for web interface
- Pain intensity scaling with color gradients (0-2 green, 3-5 yellow, 6-8 orange, 9-10 red)
- Touch-friendly interaction zones for mobile devices
- Pain mapping data stored as SVG coordinates in PostgreSQL
- Responsive layout with CSS Grid/Flexbox
- ARIA labels and keyboard navigation for accessibility

## 4. Medical PDF Report Generation

**Decision**: `@react-pdf/renderer` for clinical document generation with standardized medical report templates.

**Rationale**:
- React-based PDF generation maintains component consistency with web interface
- Server-side rendering capability ensures secure document generation
- Supports complex layouts required for medical report formatting standards
- Active development with regular updates (v3.x series maintains compatibility)

**Alternatives Considered**:
- jsPDF: Limited layout capabilities, no React component integration
- Puppeteer: Higher resource usage, security concerns for healthcare data
- html2pdf.js: Performance issues with complex medical reports

**Implementation Details**:
- Standardized templates for physiotherapy assessments and discharge summaries
- Multi-page support for comprehensive treatment plans
- Server-side generation to prevent sensitive data exposure
- Patient privacy headers and LGPD compliance notices
- Integration with Brazilian medical record standards (CFM requirements)

## 5. Real-time Appointment Scheduling

**Decision**: Supabase real-time subscriptions with PostgreSQL triggers and row-level security for conflict-free appointment management.

**Rationale**:
- Real-time subscriptions provide instant conflict detection across multiple users
- PostgreSQL triggers prevent double-booking at database level
- RLS policies ensure patients only access their own appointments
- `pg_cron` extension enables automated appointment reminders

**Alternatives Considered**:
- Redis-based locking: Additional infrastructure complexity and costs
- Client-side conflict detection: Unreliable, potential security vulnerabilities
- Manual polling approach: Poor user experience, higher server resource usage

**Implementation Details**:
- PostgreSQL triggers for appointment conflict detection
- `INSERT ON CONFLICT` for atomic upsert operations
- Optimistic locking with version control on appointment records
- Real-time subscriptions for live calendar updates
- Automated reminder system using `pg_cron` and email integration
- Conflict resolution UI for simultaneous booking attempts

## 6. Brazilian Healthcare Compliance (CFM)

**Decision**: CFM Resolution compliance framework with physiotherapy-specific regulations and transparency requirements.

**Rationale**:
- CFM governs physiotherapy practice as part of medical profession regulation in Brazil
- New transparency requirements and relationship disclosure mandates
- Medical device safety standards (INMETRO) must be tracked for physiotherapy equipment
- State medical boards (CRM) require specific audit trails and reporting

**Alternatives Considered**:
- Generic healthcare compliance: Insufficient for CFM-specific physiotherapy requirements
- International standards only: Doesn't address Brazilian regulatory framework
- Manual compliance tracking: Not scalable for regulatory updates and auditing

**Implementation Details**:
- CFM relationship disclosure system for physiotherapists
- Compliance dashboard for regulatory requirement tracking
- Medical device safety tracking for physiotherapy equipment usage
- Automated audit trails for CFM reporting requirements
- Integration with state medical board (CRM) reporting systems
- Physiotherapy-specific treatment protocols and documentation standards

## 7. Performance Optimization Strategy

**Decision**: Multi-layered performance optimization using Next.js built-in features, database optimization, and strategic caching.

**Rationale**:
- Healthcare applications require sub-second response times for patient safety
- Next.js 14 provides automatic optimization features (image optimization, code splitting)
- Database query optimization critical for real-time appointment conflict detection
- Proven scalability for similar healthcare portal loads (700+ concurrent users)

**Alternatives Considered**:
- Single server monolithic approach: Cannot scale to required concurrent user load
- Heavy client-side processing: Poor mobile performance, battery drain concerns
- Third-party performance services: Data privacy concerns for healthcare applications

**Implementation Details**:
- Next.js Image optimization for patient photos and body mapping assets
- Database connection pooling (PgBouncer) for Supabase connections
- Strategic database indexes for appointment queries and patient searches
- Query optimization with efficient WHERE clauses in RLS policies
- Next.js middleware for route-level caching of static content
- Progressive Web App (PWA) capabilities for offline appointment viewing
- React performance optimizations (memo, useMemo, lazy loading)
- Real User Monitoring (RUM) with Web Vitals tracking

## Technology Stack Summary

**Frontend Framework**: Next.js 14 with App Router, TypeScript, Tailwind CSS
**UI Components**: shadcn/ui with custom healthcare-specific components
**Authentication**: Supabase Auth with custom RBAC and org-based multi-tenancy
**Database**: PostgreSQL with Row Level Security and real-time subscriptions
**File Storage**: Supabase Storage for patient photos and clinical documents
**PDF Generation**: @react-pdf/renderer for clinical reports
**Body Mapping**: Custom SVG React components with touch/mobile optimization
**Form Validation**: Zod schemas with React Hook Form integration
**Email**: Resend for appointment reminders and system notifications
**Job Queue**: Upstash QStash for background tasks and scheduled reminders
**Monitoring**: Sentry for error tracking, Vercel Analytics for performance
**Hosting**: Vercel Pro with global CDN and edge functions

## Performance Targets

- **Lighthouse Score**: >90 across all pages
- **First Contentful Paint**: <1.5 seconds
- **Time to Interactive**: <3 seconds
- **Cumulative Layout Shift**: <0.1
- **API Response Time**: <200ms for critical healthcare operations
- **Concurrent Users**: Support for 700+ simultaneous active users
- **Uptime**: >99.9% availability for critical patient care operations

## Compliance Framework

- **LGPD**: Full compliance with 2024 amendments
- **CFM Regulations**: Physiotherapy-specific compliance
- **Medical Data Security**: End-to-end encryption, audit trails
- **Brazilian Healthcare Standards**: Integration with national health protocols
- **Accessibility**: WCAG 2.1 AA compliance for healthcare accessibility

---

**Research Status**: ✅ Complete
**Next Phase**: Design & Contracts (Phase 1)
**Validation**: All technical decisions align with constitutional principles and healthcare requirements