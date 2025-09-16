# FisioFlow Integration Tests (T029-T033)

This directory contains integration tests for the FisioFlow physiotherapy management system. These tests are designed to fail initially and pass only after the corresponding features are implemented, following a Test-Driven Development (TDD) approach.

## Test Files

### T029 - Admin Workflow (`admin-workflow.test.ts`)
Tests complete admin login and dashboard access workflow including:
- Admin authentication and session management
- Dashboard KPI display and navigation
- Admin-specific permissions and features
- Error handling and validation
- Logout workflow

### T030 - Patient Management (`patient-management.test.ts`)
Tests complete patient CRUD workflow with Brazilian healthcare patterns:
- Patient creation with CPF validation and LGPD compliance
- Patient search, filtering, and data management
- Profile updates and photo upload/management
- LGPD compliance features (data export, consent history, deletion requests)
- Brazilian data patterns (CPF, phone, address formatting)

### T031 - Appointment Scheduling (`appointment-scheduling.test.ts`)
Tests appointment scheduling with conflict prevention:
- Complete appointment creation workflow
- Real-time conflict detection and resolution
- Calendar view and appointment management
- Status transitions (agendado → confirmado → em_andamento → concluído)
- Recurring appointments and reminder management
- Brazilian business day handling

### T032 - Body Mapping (`body-mapping.test.ts`)
Tests interactive body mapping and pain tracking:
- SVG-based body map interaction
- Pain point creation with 0-10 intensity scale
- Multiple pain points across body regions
- Pain timeline and progress tracking
- Different anatomical views (front/back/side)
- Pain assessment scales (numeric, visual analog, faces)

### T033 - RBAC Enforcement (`rbac-enforcement.test.ts`)
Tests role-based access control across the system:
- Admin role permissions and restrictions
- Fisioterapeuta access and limitations
- Estagiário supervised access
- Patient self-access and data privacy
- Cross-organization data isolation
- API endpoint access control
- Session timeout and re-authentication

## Test Helpers

The `test-helpers.ts` file provides:
- Brazilian healthcare data generators (CPF, CREFITO, phone numbers)
- Test user and patient creation utilities
- Date utilities for business days
- Validation functions for Brazilian patterns
- Mock data generators for testing scenarios

## Running the Tests

### Prerequisites
1. Ensure the FisioFlow application is set up and running on `http://localhost:3000`
2. Test database should be configured and accessible
3. All dependencies installed: `npm install`

### Commands

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npx playwright test tests/integration/admin-workflow.test.ts

# Run tests in headed mode (see browser)
npx playwright test tests/integration/ --headed

# Run tests with debug mode
npx playwright test tests/integration/ --debug

# Generate test report
npx playwright show-report
```

### Test Configuration

Tests are configured via `playwright.config.ts` with:
- Base URL: `http://localhost:3000`
- Multiple browser support (Chrome, Firefox, Safari)
- Mobile device testing
- Automatic server startup for CI/CD
- Retry logic for flaky tests

## Test Data Management

### Brazilian Healthcare Patterns
- **CPF Validation**: Tests use real CPF validation algorithm
- **CREFITO Numbers**: Generated following Brazilian physiotherapy council patterns
- **Phone Numbers**: Brazilian mobile/landline format validation
- **Business Days**: Proper handling of Brazilian weekends and holidays
- **LGPD Compliance**: Data consent, export, and deletion workflows

### Test Database
- Tests use isolated test data that's cleaned up after each test
- Patient, appointment, and session data is generated with realistic Brazilian patterns
- Multi-tenant organization isolation is tested

### Authentication
- Each test authenticates with appropriate user roles
- Session management and timeout scenarios are tested
- Permission boundaries are verified at UI and API levels

## Expected Test Failures

These tests are designed to fail initially because the corresponding features haven't been implemented yet:

1. **Authentication System**: Login, logout, session management
2. **Patient Management**: CRUD operations, Brazilian data validation
3. **Appointment System**: Scheduling, conflict prevention, calendar views
4. **Body Mapping**: Interactive SVG components, pain tracking
5. **RBAC System**: Role-based permissions, API access control
6. **Database Schema**: Tables, relationships, RLS policies
7. **API Endpoints**: All backend functionality

## Implementation Guidance

To make these tests pass, implement features in this order:

1. **Database Schema**: Create tables with RLS policies
2. **Authentication**: Supabase Auth integration with RBAC
3. **API Routes**: Backend endpoints for all CRUD operations
4. **UI Components**: Forms, dashboards, interactive elements
5. **Brazilian Patterns**: CPF validation, phone formatting, etc.
6. **Advanced Features**: Body mapping, recurring appointments, LGPD compliance

## Test Maintenance

- Update test data when schema changes
- Add new test cases for new features
- Maintain Brazilian healthcare compliance patterns
- Keep mock data generators current with real-world patterns
- Update role permissions as system evolves

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- Docker containers for consistent environments
- Database seeding and cleanup
- Parallel test execution
- Screenshot and video capture on failures
- Test reporting and coverage metrics