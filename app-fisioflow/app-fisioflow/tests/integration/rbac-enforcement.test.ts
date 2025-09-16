/**
 * T033 - RBAC Enforcement Integration Test
 * Tests role-based access control enforcement across the system
 */

import { test, expect, Page } from '@playwright/test';
import {
  createTestUser,
  createTestPatient,
  createTestSession,
  cleanupTestData,
  TEST_ADMIN_USER,
  TEST_FISIO_USER,
  TEST_ESTAGIARIO_USER,
  TEST_PATIENT_USER,
  TEST_PATIENT_DATA,
  TEST_ORG
} from '../helpers/test-helpers';

test.describe('RBAC Enforcement Integration', () => {
  let page: Page;
  let testPatientId: string;
  let testSessionId: string;

  test.beforeAll(async () => {
    // Setup test data for all roles
    await createTestUser({
      ...TEST_ADMIN_USER,
      role: 'admin',
      org_id: TEST_ORG.id
    });

    await createTestUser({
      ...TEST_FISIO_USER,
      role: 'fisioterapeuta',
      org_id: TEST_ORG.id
    });

    await createTestUser({
      ...TEST_ESTAGIARIO_USER,
      role: 'estagiario',
      org_id: TEST_ORG.id
    });

    testPatientId = await createTestPatient({
      ...TEST_PATIENT_DATA,
      org_id: TEST_ORG.id
    });

    await createTestUser({
      ...TEST_PATIENT_USER,
      role: 'paciente',
      patient_id: testPatientId,
      org_id: TEST_ORG.id
    });

    testSessionId = await createTestSession({
      patient_id: testPatientId,
      therapist_id: TEST_FISIO_USER.id,
      org_id: TEST_ORG.id
    });
  });

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test('T033.1 - Admin role permissions and access', async () => {
    await loginAs(page, TEST_ADMIN_USER);

    // Admin should have access to all areas
    const adminPermissions = [
      { nav: 'Dashboard', url: '/dashboard/admin', allowed: true },
      { nav: 'Pacientes', url: '/patients', allowed: true },
      { nav: 'Profissionais', url: '/professionals', allowed: true },
      { nav: 'Agendamentos', url: '/appointments', allowed: true },
      { nav: 'Relatórios', url: '/reports', allowed: true },
      { nav: 'Configurações', url: '/settings', allowed: true }
    ];

    for (const permission of adminPermissions) {
      await page.goto(permission.url);

      if (permission.allowed) {
        await expect(page).toHaveURL(permission.url);
        await expect(page.locator('[data-testid="unauthorized"]')).not.toBeVisible();
      } else {
        await expect(page).toHaveURL('/unauthorized');
        await expect(page.locator('[data-testid="unauthorized"]')).toBeVisible();
      }
    }

    // Test admin-specific actions
    await page.goto('/settings/organization');
    await expect(page.locator('[data-testid="org-settings"]')).toBeVisible();

    // Test user management
    await page.goto('/admin/users');
    await expect(page.locator('[data-testid="user-management"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-user-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="delete-user-button"]')).toBeVisible();

    // Test system configuration
    await page.goto('/admin/system');
    await expect(page.locator('[data-testid="system-config"]')).toBeVisible();
    await expect(page.locator('[data-testid="backup-settings"]')).toBeVisible();
  });

  test('T033.2 - Fisioterapeuta role permissions and restrictions', async () => {
    await loginAs(page, TEST_FISIO_USER);

    // Fisioterapeuta permissions
    const fisioPermissions = [
      { url: '/dashboard/fisioterapeuta', allowed: true },
      { url: '/patients', allowed: true },
      { url: '/patients/new', allowed: true },
      { url: `/patients/${testPatientId}`, allowed: true },
      { url: `/patients/${testPatientId}/edit`, allowed: true },
      { url: '/appointments', allowed: true },
      { url: '/appointments/new', allowed: true },
      { url: `/sessions/${testSessionId}`, allowed: true },
      { url: '/exercises', allowed: true },

      // Restricted areas
      { url: '/admin/users', allowed: false },
      { url: '/admin/system', allowed: false },
      { url: '/settings/organization', allowed: false },
      { url: '/reports/financial', allowed: false }
    ];

    for (const permission of fisioPermissions) {
      await page.goto(permission.url);

      if (permission.allowed) {
        await expect(page).toHaveURL(permission.url);
        await expect(page.locator('[data-testid="unauthorized"]')).not.toBeVisible();
      } else {
        await expect(page).toHaveURL('/unauthorized');
        await expect(page.locator('[data-testid="unauthorized"]')).toBeVisible();
      }
    }

    // Test fisioterapeuta-specific actions
    await page.goto(`/patients/${testPatientId}`);

    // Can create/edit sessions
    await expect(page.locator('[data-testid="new-session-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="edit-patient-button"]')).toBeVisible();

    // Cannot delete patients (admin only)
    await expect(page.locator('[data-testid="delete-patient-button"]')).not.toBeVisible();

    // Test session documentation
    await page.goto(`/sessions/${testSessionId}`);
    await expect(page.locator('[data-testid="session-notes"]')).toBeVisible();
    await expect(page.locator('[data-testid="body-mapping"]')).toBeVisible();
    await expect(page.locator('[data-testid="exercise-prescription"]')).toBeVisible();
  });

  test('T033.3 - Estagiário role limitations and supervision', async () => {
    await loginAs(page, TEST_ESTAGIARIO_USER);

    // Estagiário permissions (read-only with some exceptions)
    const estagiarioPermissions = [
      { url: '/dashboard/estagiario', allowed: true },
      { url: '/patients', allowed: true },
      { url: `/patients/${testPatientId}`, allowed: true },
      { url: '/appointments', allowed: true },
      { url: `/sessions/${testSessionId}`, allowed: true },
      { url: '/exercises', allowed: true },

      // Restricted write operations
      { url: '/patients/new', allowed: false },
      { url: `/patients/${testPatientId}/edit`, allowed: false },
      { url: '/appointments/new', allowed: false },
      { url: '/admin/users', allowed: false },
      { url: '/reports/financial', allowed: false }
    ];

    for (const permission of estagiarioPermissions) {
      await page.goto(permission.url);

      if (permission.allowed) {
        await expect(page).toHaveURL(permission.url);
        await expect(page.locator('[data-testid="unauthorized"]')).not.toBeVisible();
      } else {
        await expect(page).toHaveURL('/unauthorized');
        await expect(page.locator('[data-testid="unauthorized"]')).toBeVisible();
      }
    }

    // Test estagiário restrictions on patient page
    await page.goto(`/patients/${testPatientId}`);

    // Cannot edit patient information
    await expect(page.locator('[data-testid="edit-patient-button"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="delete-patient-button"]')).not.toBeVisible();

    // Cannot create new sessions independently
    await expect(page.locator('[data-testid="new-session-button"]')).not.toBeVisible();

    // Can view but not modify existing sessions
    await page.goto(`/sessions/${testSessionId}`);
    await expect(page.locator('[data-testid="session-notes"]')).toBeVisible();
    await expect(page.locator('[data-testid="edit-session-button"]')).not.toBeVisible();

    // Test supervision notification
    await expect(page.locator('[data-testid="supervision-notice"]')).toBeVisible();
    await expect(page.locator('[data-testid="supervision-notice"]'))
      .toContainText('Acesso supervisionado');
  });

  test('T033.4 - Patient role self-access and data privacy', async () => {
    await loginAs(page, TEST_PATIENT_USER);

    // Patient permissions (own data only)
    const patientPermissions = [
      { url: '/dashboard/paciente', allowed: true },
      { url: `/patients/${testPatientId}`, allowed: true },
      { url: `/patients/${testPatientId}/appointments`, allowed: true },
      { url: `/patients/${testPatientId}/exercises`, allowed: true },
      { url: `/patients/${testPatientId}/progress`, allowed: true },

      // Restricted areas
      { url: '/patients', allowed: false }, // Cannot see other patients
      { url: '/admin/users', allowed: false },
      { url: '/appointments', allowed: false }, // Cannot see all appointments
      { url: '/reports', allowed: false },
      { url: '/professionals', allowed: false }
    ];

    for (const permission of patientPermissions) {
      await page.goto(permission.url);

      if (permission.allowed) {
        await expect(page).toHaveURL(permission.url);
        await expect(page.locator('[data-testid="unauthorized"]')).not.toBeVisible();
      } else {
        await expect(page).toHaveURL('/unauthorized');
        await expect(page.locator('[data-testid="unauthorized"]')).toBeVisible();
      }
    }

    // Test patient dashboard
    await page.goto('/dashboard/paciente');
    await expect(page.locator('[data-testid="patient-info"]')).toContainText(TEST_PATIENT_DATA.name);
    await expect(page.locator('[data-testid="next-appointment"]')).toBeVisible();
    await expect(page.locator('[data-testid="exercise-portal"]')).toBeVisible();

    // Test patient data access
    await page.goto(`/patients/${testPatientId}`);

    // Can view own information
    await expect(page.locator('[data-testid="patient-name"]')).toContainText(TEST_PATIENT_DATA.name);
    await expect(page.locator('[data-testid="patient-phone"]')).toBeVisible();

    // Cannot edit sensitive information
    await expect(page.locator('[data-testid="edit-medical-history"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="edit-diagnosis"]')).not.toBeVisible();

    // Can update contact information
    await expect(page.locator('[data-testid="edit-contact-info"]')).toBeVisible();

    // Test LGPD self-service
    await page.click('[data-testid="data-privacy-menu"]');
    await expect(page.locator('[data-testid="export-my-data"]')).toBeVisible();
    await expect(page.locator('[data-testid="consent-management"]')).toBeVisible();
    await expect(page.locator('[data-testid="data-deletion-request"]')).toBeVisible();
  });

  test('T033.5 - Cross-organization data isolation', async () => {
    // Create second organization and user
    const org2 = { id: 'org-2', name: 'Clínica B' };
    const org2User = {
      email: 'fisio2@clinicab.com',
      password: 'password123',
      role: 'fisioterapeuta',
      org_id: org2.id
    };

    await createTestUser(org2User);

    const org2PatientId = await createTestPatient({
      name: 'Paciente Org 2',
      cpf: '987.654.321-00',
      org_id: org2.id
    });

    // Login as user from organization 2
    await loginAs(page, org2User);

    // Should not be able to access org 1 patient
    await page.goto(`/patients/${testPatientId}`);
    await expect(page).toHaveURL('/unauthorized');

    // Should not see org 1 patient in listings
    await page.goto('/patients');
    await expect(page.locator('[data-testid="patient-list"]')).not.toContainText(TEST_PATIENT_DATA.name);

    // Should only see own organization's patient
    await expect(page.locator('[data-testid="patient-list"]')).toContainText('Paciente Org 2');

    // Test appointments isolation
    await page.goto('/appointments');
    await expect(page.locator('[data-testid="appointment-list"]')).not.toContainText(TEST_PATIENT_DATA.name);

    // Test session access isolation
    await page.goto(`/sessions/${testSessionId}`);
    await expect(page).toHaveURL('/unauthorized');
  });

  test('T033.6 - API endpoint access control', async () => {
    // Test API access for different roles
    const apiTests = [
      {
        user: TEST_ADMIN_USER,
        endpoints: [
          { method: 'GET', path: '/api/patients', expected: 200 },
          { method: 'POST', path: '/api/patients', expected: 201 },
          { method: 'DELETE', path: `/api/patients/${testPatientId}`, expected: 204 },
          { method: 'GET', path: '/api/admin/users', expected: 200 },
          { method: 'POST', path: '/api/admin/users', expected: 201 }
        ]
      },
      {
        user: TEST_FISIO_USER,
        endpoints: [
          { method: 'GET', path: '/api/patients', expected: 200 },
          { method: 'POST', path: '/api/patients', expected: 201 },
          { method: 'PUT', path: `/api/patients/${testPatientId}`, expected: 200 },
          { method: 'GET', path: '/api/admin/users', expected: 403 },
          { method: 'DELETE', path: `/api/patients/${testPatientId}`, expected: 403 }
        ]
      },
      {
        user: TEST_ESTAGIARIO_USER,
        endpoints: [
          { method: 'GET', path: '/api/patients', expected: 200 },
          { method: 'GET', path: `/api/patients/${testPatientId}`, expected: 200 },
          { method: 'POST', path: '/api/patients', expected: 403 },
          { method: 'PUT', path: `/api/patients/${testPatientId}`, expected: 403 },
          { method: 'DELETE', path: `/api/patients/${testPatientId}`, expected: 403 }
        ]
      },
      {
        user: TEST_PATIENT_USER,
        endpoints: [
          { method: 'GET', path: `/api/patients/${testPatientId}`, expected: 200 },
          { method: 'GET', path: '/api/patients', expected: 403 },
          { method: 'POST', path: '/api/patients', expected: 403 },
          { method: 'PUT', path: `/api/patients/${testPatientId}/contact`, expected: 200 },
          { method: 'PUT', path: `/api/patients/${testPatientId}/medical`, expected: 403 }
        ]
      }
    ];

    for (const userTest of apiTests) {
      await loginAs(page, userTest.user);

      for (const endpoint of userTest.endpoints) {
        const response = await page.request[endpoint.method.toLowerCase()](
          `http://localhost:3000${endpoint.path}`,
          {
            data: endpoint.method === 'POST' ? { name: 'Test Data' } : undefined
          }
        );

        expect(response.status()).toBe(endpoint.expected);

        // For forbidden responses, verify error message
        if (endpoint.expected === 403) {
          const responseBody = await response.json();
          expect(responseBody.error).toContain('Insufficient permissions');
        }
      }
    }
  });

  test('T033.7 - Session timeout and re-authentication', async () => {
    await loginAs(page, TEST_FISIO_USER);

    // Navigate to protected area
    await page.goto(`/patients/${testPatientId}`);
    await expect(page).toHaveURL(`/patients/${testPatientId}`);

    // Simulate session timeout by clearing auth cookies
    await page.context().clearCookies();

    // Try to access protected area again
    await page.goto(`/patients/${testPatientId}`);

    // Should be redirected to login
    await expect(page).toHaveURL('/login');
    await expect(page.locator('[data-testid="session-expired"]'))
      .toContainText('Sessão expirada');

    // Re-authenticate
    await page.fill('input[name="email"]', TEST_FISIO_USER.email);
    await page.fill('input[name="password"]', TEST_FISIO_USER.password);
    await page.click('button[type="submit"]');

    // Should be redirected back to originally requested page
    await expect(page).toHaveURL(`/patients/${testPatientId}`);
  });

  // Helper function
  async function loginAs(page: Page, user: any) {
    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.click('button[type="submit"]');

    // Wait for appropriate dashboard based on role
    const dashboardUrl = `/dashboard/${user.role}`;
    await page.waitForURL(dashboardUrl, { timeout: 10000 });
  }
});