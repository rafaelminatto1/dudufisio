/**
 * T029 - Admin Workflow Integration Test
 * Tests complete admin login and dashboard access workflow
 */

import { test, expect, Page } from '@playwright/test';
import {
  createTestUser,
  cleanupTestData,
  TEST_ADMIN_USER,
  TEST_ORG
} from '../helpers/test-helpers';

test.describe('Admin Workflow Integration', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Setup test data
    await createTestUser({
      ...TEST_ADMIN_USER,
      role: 'admin',
      org_id: TEST_ORG.id
    });
  });

  test.afterEach(async () => {
    await cleanupTestData();
    await page.close();
  });

  test('T029.1 - Admin complete login workflow', async () => {
    // Navigate to login page
    await page.goto('/login');

    // Verify login page elements
    await expect(page.locator('h1')).toContainText('Acesso ao Sistema');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Entrar');

    // Fill login form
    await page.fill('input[name="email"]', TEST_ADMIN_USER.email);
    await page.fill('input[name="password"]', TEST_ADMIN_USER.password);

    // Submit login
    await page.click('button[type="submit"]');

    // Wait for authentication
    await page.waitForURL('/dashboard/admin', { timeout: 10000 });

    // Verify admin dashboard access
    await expect(page).toHaveURL(/\/dashboard\/admin/);
    await expect(page.locator('h1')).toContainText('Dashboard Administrativo');

    // Verify admin navigation menu
    const navItems = [
      'Visão Geral',
      'Pacientes',
      'Profissionais',
      'Agendamentos',
      'Relatórios',
      'Configurações'
    ];

    for (const item of navItems) {
      await expect(page.locator(`nav >> text=${item}`)).toBeVisible();
    }

    // Test admin-only features
    await expect(page.locator('[data-testid="admin-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="org-settings"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-management"]')).toBeVisible();
  });

  test('T029.2 - Admin dashboard KPI cards display', async () => {
    // Login as admin
    await loginAsAdmin(page);

    // Verify KPI cards are present
    const kpiCards = [
      'total-patients',
      'monthly-appointments',
      'active-professionals',
      'revenue-month'
    ];

    for (const cardId of kpiCards) {
      const card = page.locator(`[data-testid="${cardId}"]`);
      await expect(card).toBeVisible();

      // Verify card has title and value
      await expect(card.locator('.kpi-title')).toBeVisible();
      await expect(card.locator('.kpi-value')).toBeVisible();
    }

    // Test KPI card interactions
    await page.click('[data-testid="total-patients"]');
    await expect(page).toHaveURL(/\/dashboard\/admin\/patients/);

    await page.goBack();

    await page.click('[data-testid="monthly-appointments"]');
    await expect(page).toHaveURL(/\/dashboard\/admin\/appointments/);
  });

  test('T029.3 - Admin navigation and permissions', async () => {
    await loginAsAdmin(page);

    // Test navigation to each admin section
    const adminSections = [
      { nav: 'Pacientes', url: '/dashboard/admin/patients', title: 'Gestão de Pacientes' },
      { nav: 'Profissionais', url: '/dashboard/admin/professionals', title: 'Gestão de Profissionais' },
      { nav: 'Agendamentos', url: '/dashboard/admin/appointments', title: 'Gestão de Agendamentos' },
      { nav: 'Relatórios', url: '/dashboard/admin/reports', title: 'Relatórios Gerenciais' },
      { nav: 'Configurações', url: '/dashboard/admin/settings', title: 'Configurações do Sistema' }
    ];

    for (const section of adminSections) {
      await page.click(`nav >> text=${section.nav}`);
      await expect(page).toHaveURL(section.url);
      await expect(page.locator('h1')).toContainText(section.title);
    }
  });

  test('T029.4 - Admin logout workflow', async () => {
    await loginAsAdmin(page);

    // Click user menu
    await page.click('[data-testid="user-menu"]');

    // Verify user menu options
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    await expect(page.locator('[data-testid="logout-button"]')).toBeVisible();

    // Click logout
    await page.click('[data-testid="logout-button"]');

    // Verify redirect to login
    await page.waitForURL('/login', { timeout: 5000 });
    await expect(page).toHaveURL('/login');

    // Verify session is cleared
    await page.goto('/dashboard/admin');
    await expect(page).toHaveURL('/login');
  });

  test('T029.5 - Admin error handling and validation', async () => {
    // Test invalid login credentials
    await page.goto('/login');

    await page.fill('input[name="email"]', 'invalid@email.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Credenciais inválidas');

    // Test empty form submission
    await page.fill('input[name="email"]', '');
    await page.fill('input[name="password"]', '');
    await page.click('button[type="submit"]');

    // Verify validation messages
    await expect(page.locator('[data-testid="email-error"]'))
      .toContainText('Email é obrigatório');
    await expect(page.locator('[data-testid="password-error"]'))
      .toContainText('Senha é obrigatória');

    // Test malformed email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.blur('input[name="email"]');

    await expect(page.locator('[data-testid="email-error"]'))
      .toContainText('Email inválido');
  });

  // Helper function to login as admin
  async function loginAsAdmin(page: Page) {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_ADMIN_USER.email);
    await page.fill('input[name="password"]', TEST_ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard/admin', { timeout: 10000 });
  }
});