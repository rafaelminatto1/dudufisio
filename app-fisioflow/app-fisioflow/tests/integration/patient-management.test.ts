/**
 * T030 - Patient Management Integration Test
 * Tests complete patient CRUD workflow with Brazilian healthcare patterns
 */

import { test, expect, Page } from '@playwright/test';
import {
  createTestUser,
  cleanupTestData,
  TEST_FISIO_USER,
  TEST_PATIENT_DATA,
  generateValidCPF,
  generateValidCREFITO,
  TEST_ORG
} from '../helpers/test-helpers';

test.describe('Patient Management Integration', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Setup test user (fisioterapeuta with patient management permissions)
    await createTestUser({
      ...TEST_FISIO_USER,
      role: 'fisioterapeuta',
      org_id: TEST_ORG.id,
      crefito: generateValidCREFITO()
    });

    await loginAsFisioterapeuta(page);
  });

  test.afterEach(async () => {
    await cleanupTestData();
    await page.close();
  });

  test('T030.1 - Complete patient creation workflow', async () => {
    // Navigate to patient creation
    await page.click('nav >> text=Pacientes');
    await page.click('[data-testid="new-patient-button"]');

    // Verify patient form is displayed
    await expect(page.locator('h1')).toContainText('Novo Paciente');
    await expect(page.locator('form[data-testid="patient-form"]')).toBeVisible();

    // Fill patient form with Brazilian data
    const patientData = {
      name: 'Maria Silva Santos',
      cpf: generateValidCPF(),
      rg: '12.345.678-9',
      dateOfBirth: '1985-03-15',
      phone: '(11) 99876-5432',
      email: 'maria.santos@email.com',
      address: 'Rua das Flores, 123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      emergencyContact: 'João Santos',
      emergencyPhone: '(11) 98765-4321',
      occupation: 'Professora',
      healthInsurance: 'Unimed',
      insuranceNumber: '123456789',
      medicalHistory: 'Hipertensão controlada',
      allergies: 'Dipirona',
      medications: 'Losartana 50mg'
    };

    // Fill basic information
    await page.fill('input[name="name"]', patientData.name);
    await page.fill('input[name="cpf"]', patientData.cpf);
    await page.fill('input[name="rg"]', patientData.rg);
    await page.fill('input[name="dateOfBirth"]', patientData.dateOfBirth);
    await page.fill('input[name="phone"]', patientData.phone);
    await page.fill('input[name="email"]', patientData.email);

    // Fill address information
    await page.fill('input[name="address"]', patientData.address);
    await page.fill('input[name="neighborhood"]', patientData.neighborhood);
    await page.fill('input[name="city"]', patientData.city);
    await page.selectOption('select[name="state"]', patientData.state);
    await page.fill('input[name="zipCode"]', patientData.zipCode);

    // Fill emergency contact
    await page.fill('input[name="emergencyContact"]', patientData.emergencyContact);
    await page.fill('input[name="emergencyPhone"]', patientData.emergencyPhone);

    // Fill additional information
    await page.fill('input[name="occupation"]', patientData.occupation);
    await page.fill('input[name="healthInsurance"]', patientData.healthInsurance);
    await page.fill('input[name="insuranceNumber"]', patientData.insuranceNumber);

    // Fill medical information
    await page.fill('textarea[name="medicalHistory"]', patientData.medicalHistory);
    await page.fill('textarea[name="allergies"]', patientData.allergies);
    await page.fill('textarea[name="medications"]', patientData.medications);

    // Accept LGPD consent
    await page.check('input[name="lgpdConsent"]');
    await expect(page.locator('input[name="lgpdConsent"]')).toBeChecked();

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message and redirect
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Paciente criado com sucesso');

    await page.waitForURL(/\/patients\/\d+/, { timeout: 5000 });

    // Verify patient details page
    await expect(page.locator('h1')).toContainText(patientData.name);
    await expect(page.locator('[data-testid="patient-cpf"]')).toContainText(patientData.cpf);
    await expect(page.locator('[data-testid="patient-phone"]')).toContainText(patientData.phone);
  });

  test('T030.2 - CPF validation and formatting', async () => {
    await page.click('nav >> text=Pacientes');
    await page.click('[data-testid="new-patient-button"]');

    // Test invalid CPF
    await page.fill('input[name="cpf"]', '111.111.111-11');
    await page.blur('input[name="cpf"]');

    await expect(page.locator('[data-testid="cpf-error"]'))
      .toContainText('CPF inválido');

    // Test CPF formatting
    await page.fill('input[name="cpf"]', '12345678901');
    await page.blur('input[name="cpf"]');

    // Verify auto-formatting
    const cpfValue = await page.inputValue('input[name="cpf"]');
    expect(cpfValue).toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);

    // Test valid CPF
    const validCPF = generateValidCPF();
    await page.fill('input[name="cpf"]', validCPF);
    await page.blur('input[name="cpf"]');

    await expect(page.locator('[data-testid="cpf-error"]')).not.toBeVisible();
  });

  test('T030.3 - Patient search and filtering', async () => {
    // Create test patients first
    const testPatients = [
      { name: 'Ana Silva', cpf: generateValidCPF() },
      { name: 'Carlos Santos', cpf: generateValidCPF() },
      { name: 'Beatriz Oliveira', cpf: generateValidCPF() }
    ];

    for (const patient of testPatients) {
      await createTestPatient(page, patient);
    }

    // Navigate to patients list
    await page.click('nav >> text=Pacientes');

    // Test search by name
    await page.fill('input[data-testid="patient-search"]', 'Ana');
    await page.press('input[data-testid="patient-search"]', 'Enter');

    await expect(page.locator('[data-testid="patient-list"]')).toContainText('Ana Silva');
    await expect(page.locator('[data-testid="patient-list"]')).not.toContainText('Carlos Santos');

    // Test search by CPF
    await page.fill('input[data-testid="patient-search"]', testPatients[1].cpf);
    await page.press('input[data-testid="patient-search"]', 'Enter');

    await expect(page.locator('[data-testid="patient-list"]')).toContainText('Carlos Santos');

    // Test clear search
    await page.click('[data-testid="clear-search"]');
    await expect(page.locator('[data-testid="patient-list"]')).toContainText('Ana Silva');
    await expect(page.locator('[data-testid="patient-list"]')).toContainText('Carlos Santos');

    // Test filters
    await page.click('[data-testid="filter-dropdown"]');
    await page.click('[data-testid="filter-active"]');

    // Verify only active patients are shown
    await expect(page.locator('[data-testid="filter-indicator"]')).toContainText('Ativos');
  });

  test('T030.4 - Patient profile update workflow', async () => {
    // Create a test patient
    const originalData = {
      name: 'João Teste',
      cpf: generateValidCPF(),
      phone: '(11) 99999-9999'
    };

    const patientId = await createTestPatient(page, originalData);

    // Navigate to patient profile
    await page.goto(`/patients/${patientId}`);

    // Click edit button
    await page.click('[data-testid="edit-patient-button"]');

    // Verify edit form is displayed
    await expect(page.locator('h1')).toContainText('Editar Paciente');
    await expect(page.inputValue('input[name="name"]')).toBe(originalData.name);

    // Update patient information
    const updatedData = {
      name: 'João Silva Teste',
      phone: '(11) 88888-8888',
      address: 'Nova Rua, 456'
    };

    await page.fill('input[name="name"]', updatedData.name);
    await page.fill('input[name="phone"]', updatedData.phone);
    await page.fill('input[name="address"]', updatedData.address);

    // Submit changes
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Paciente atualizado com sucesso');

    // Verify updated information is displayed
    await expect(page.locator('h1')).toContainText(updatedData.name);
    await expect(page.locator('[data-testid="patient-phone"]')).toContainText(updatedData.phone);
    await expect(page.locator('[data-testid="patient-address"]')).toContainText(updatedData.address);
  });

  test('T030.5 - LGPD compliance and patient data management', async () => {
    const patientData = {
      name: 'Paciente LGPD Teste',
      cpf: generateValidCPF()
    };

    const patientId = await createTestPatient(page, patientData);

    // Navigate to patient profile
    await page.goto(`/patients/${patientId}`);

    // Test LGPD compliance features
    await page.click('[data-testid="lgpd-menu"]');

    // Verify LGPD options are available
    await expect(page.locator('[data-testid="export-data"]')).toBeVisible();
    await expect(page.locator('[data-testid="consent-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="data-deletion"]')).toBeVisible();

    // Test data export
    await page.click('[data-testid="export-data"]');
    await expect(page.locator('[data-testid="export-dialog"]')).toBeVisible();

    await page.click('[data-testid="export-json"]');

    // Wait for download to start
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="confirm-export"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('patient-data');
    expect(download.suggestedFilename()).toContain('.json');

    // Test consent history
    await page.click('[data-testid="consent-history"]');
    await expect(page.locator('[data-testid="consent-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="consent-record"]')).toContainText('LGPD');

    // Test data deletion request
    await page.click('[data-testid="data-deletion"]');
    await expect(page.locator('[data-testid="deletion-dialog"]')).toBeVisible();

    await page.fill('textarea[name="deletionReason"]', 'Paciente solicitou exclusão dos dados');
    await page.check('input[name="confirmDeletion"]');

    await page.click('[data-testid="request-deletion"]');

    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Solicitação de exclusão registrada');
  });

  test('T030.6 - Patient photo upload and management', async () => {
    const patientData = {
      name: 'Paciente Foto Teste',
      cpf: generateValidCPF()
    };

    const patientId = await createTestPatient(page, patientData);

    // Navigate to patient profile
    await page.goto(`/patients/${patientId}`);

    // Test photo upload
    await page.click('[data-testid="upload-photo-button"]');

    // Set up file chooser
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="choose-photo-file"]');
    const fileChooser = await fileChooserPromise;

    // Upload test image
    await fileChooser.setFiles([
      {
        name: 'patient-photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      }
    ]);

    // Submit photo upload
    await page.click('[data-testid="upload-submit"]');

    // Verify photo upload success
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Foto atualizada com sucesso');

    // Verify photo is displayed
    await expect(page.locator('[data-testid="patient-photo"]')).toBeVisible();

    // Test photo removal
    await page.click('[data-testid="remove-photo-button"]');
    await page.click('[data-testid="confirm-remove-photo"]');

    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Foto removida com sucesso');

    await expect(page.locator('[data-testid="patient-photo"]')).not.toBeVisible();
  });

  // Helper functions
  async function loginAsFisioterapeuta(page: Page) {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_FISIO_USER.email);
    await page.fill('input[name="password"]', TEST_FISIO_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard/fisioterapeuta', { timeout: 10000 });
  }

  async function createTestPatient(page: Page, patientData: any): Promise<string> {
    await page.click('nav >> text=Pacientes');
    await page.click('[data-testid="new-patient-button"]');

    await page.fill('input[name="name"]', patientData.name);
    await page.fill('input[name="cpf"]', patientData.cpf);
    await page.fill('input[name="dateOfBirth"]', '1990-01-01');
    await page.fill('input[name="phone"]', patientData.phone || '(11) 99999-9999');
    await page.check('input[name="lgpdConsent"]');

    await page.click('button[type="submit"]');

    await page.waitForURL(/\/patients\/(\d+)/, { timeout: 5000 });

    const url = page.url();
    const match = url.match(/\/patients\/(\d+)/);
    return match ? match[1] : '';
  }
});