/**
 * T031 - Appointment Scheduling Integration Test
 * Tests complete appointment scheduling workflow with conflict prevention
 */

import { test, expect, Page } from '@playwright/test';
import {
  createTestUser,
  createTestPatient,
  cleanupTestData,
  TEST_FISIO_USER,
  TEST_PATIENT_DATA,
  addBusinessDays,
  formatBrazilianDate,
  formatBrazilianTime,
  TEST_ORG
} from '../helpers/test-helpers';

test.describe('Appointment Scheduling Integration', () => {
  let page: Page;
  let testPatientId: string;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Setup test user and patient
    await createTestUser({
      ...TEST_FISIO_USER,
      role: 'fisioterapeuta',
      org_id: TEST_ORG.id
    });

    testPatientId = await createTestPatient({
      ...TEST_PATIENT_DATA,
      org_id: TEST_ORG.id
    });

    await loginAsFisioterapeuta(page);
  });

  test.afterEach(async () => {
    await cleanupTestData();
    await page.close();
  });

  test('T031.1 - Complete appointment scheduling workflow', async () => {
    // Navigate to appointment scheduling
    await page.click('nav >> text=Agendamentos');
    await page.click('[data-testid="new-appointment-button"]');

    // Verify appointment form is displayed
    await expect(page.locator('h1')).toContainText('Novo Agendamento');
    await expect(page.locator('form[data-testid="appointment-form"]')).toBeVisible();

    // Select patient
    await page.click('input[data-testid="patient-search"]');
    await page.type('input[data-testid="patient-search"]', TEST_PATIENT_DATA.name);
    await page.click(`[data-testid="patient-option-${testPatientId}"]`);

    // Verify patient is selected
    await expect(page.locator('[data-testid="selected-patient"]'))
      .toContainText(TEST_PATIENT_DATA.name);

    // Select appointment date (tomorrow)
    const appointmentDate = addBusinessDays(new Date(), 1);
    await page.click('input[data-testid="appointment-date"]');
    await page.click(`[data-testid="date-${appointmentDate.getDate()}"]`);

    // Select appointment time
    const appointmentTime = '14:00';
    await page.click('select[data-testid="appointment-time"]');
    await page.selectOption('select[data-testid="appointment-time"]', appointmentTime);

    // Select appointment type
    await page.selectOption('select[data-testid="appointment-type"]', 'consulta');

    // Add appointment notes
    const appointmentNotes = 'Primeira consulta - avaliação inicial do paciente';
    await page.fill('textarea[data-testid="appointment-notes"]', appointmentNotes);

    // Select duration
    await page.selectOption('select[data-testid="appointment-duration"]', '60');

    // Submit appointment
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Agendamento criado com sucesso');

    // Verify redirect to appointment details
    await page.waitForURL(/\/appointments\/\d+/, { timeout: 5000 });

    // Verify appointment details are displayed
    await expect(page.locator('[data-testid="appointment-patient"]'))
      .toContainText(TEST_PATIENT_DATA.name);
    await expect(page.locator('[data-testid="appointment-date"]'))
      .toContainText(formatBrazilianDate(appointmentDate));
    await expect(page.locator('[data-testid="appointment-time"]'))
      .toContainText(appointmentTime);
    await expect(page.locator('[data-testid="appointment-notes"]'))
      .toContainText(appointmentNotes);
  });

  test('T031.2 - Appointment conflict prevention', async () => {
    // Create first appointment
    const conflictDate = addBusinessDays(new Date(), 2);
    const conflictTime = '15:00';

    await createTestAppointment(page, {
      patientId: testPatientId,
      date: conflictDate,
      time: conflictTime,
      duration: 60
    });

    // Try to create conflicting appointment
    await page.click('[data-testid="new-appointment-button"]');

    // Fill form with same date/time
    await selectPatient(page, testPatientId);
    await selectDate(page, conflictDate);
    await page.selectOption('select[data-testid="appointment-time"]', conflictTime);
    await page.selectOption('select[data-testid="appointment-duration"]', '60');

    // Attempt to submit
    await page.click('button[type="submit"]');

    // Verify conflict error is displayed
    await expect(page.locator('[data-testid="conflict-error"]'))
      .toContainText('Conflito de horário detectado');

    await expect(page.locator('[data-testid="conflict-details"]'))
      .toContainText(`${formatBrazilianTime(conflictTime)} - ${formatBrazilianDate(conflictDate)}`);

    // Test conflict resolution suggestions
    await expect(page.locator('[data-testid="suggested-times"]')).toBeVisible();

    // Click on suggested time
    await page.click('[data-testid="suggestion-16:00"]');

    // Verify time is updated
    const selectedTime = await page.inputValue('select[data-testid="appointment-time"]');
    expect(selectedTime).toBe('16:00');

    // Submit with new time
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Agendamento criado com sucesso');
  });

  test('T031.3 - Calendar view and appointment management', async () => {
    // Create multiple appointments for testing
    const baseDate = addBusinessDays(new Date(), 1);
    const appointments = [
      { time: '09:00', type: 'consulta' },
      { time: '10:00', type: 'retorno' },
      { time: '14:00', type: 'avaliacao' }
    ];

    for (const apt of appointments) {
      await createTestAppointment(page, {
        patientId: testPatientId,
        date: baseDate,
        time: apt.time,
        type: apt.type
      });
    }

    // Navigate to calendar view
    await page.click('nav >> text=Agendamentos');
    await page.click('[data-testid="calendar-view"]');

    // Verify calendar is displayed
    await expect(page.locator('[data-testid="appointment-calendar"]')).toBeVisible();

    // Navigate to appointment date
    await page.click(`[data-testid="calendar-day-${baseDate.getDate()}"]`);

    // Verify appointments are displayed
    for (const apt of appointments) {
      await expect(page.locator(`[data-testid="appointment-${apt.time}"]`)).toBeVisible();
    }

    // Test appointment quick actions
    await page.click(`[data-testid="appointment-${appointments[0].time}"]`);

    // Verify appointment popover
    await expect(page.locator('[data-testid="appointment-popover"]')).toBeVisible();
    await expect(page.locator('[data-testid="patient-name"]')).toContainText(TEST_PATIENT_DATA.name);

    // Test quick reschedule
    await page.click('[data-testid="reschedule-button"]');
    await page.selectOption('select[data-testid="new-time"]', '11:00');
    await page.click('[data-testid="confirm-reschedule"]');

    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Agendamento reagendado com sucesso');

    // Verify appointment moved
    await expect(page.locator('[data-testid="appointment-11:00"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointment-09:00"]')).not.toBeVisible();
  });

  test('T031.4 - Appointment status management', async () => {
    const appointmentId = await createTestAppointment(page, {
      patientId: testPatientId,
      date: new Date(),
      time: '10:00',
      status: 'agendado'
    });

    // Navigate to appointment details
    await page.goto(`/appointments/${appointmentId}`);

    // Verify initial status
    await expect(page.locator('[data-testid="appointment-status"]'))
      .toContainText('Agendado');

    // Test status transitions
    const statusFlow = [
      { from: 'agendado', to: 'confirmado', label: 'Confirmar' },
      { from: 'confirmado', to: 'em_andamento', label: 'Iniciar Atendimento' },
      { from: 'em_andamento', to: 'concluido', label: 'Finalizar Atendimento' }
    ];

    for (const status of statusFlow) {
      await page.click(`[data-testid="status-action-${status.to}"]`);

      // For 'em_andamento' and 'concluido', may require additional confirmation
      if (status.to === 'em_andamento') {
        await expect(page.locator('[data-testid="start-session-dialog"]')).toBeVisible();
        await page.click('[data-testid="confirm-start-session"]');
      }

      if (status.to === 'concluido') {
        await expect(page.locator('[data-testid="complete-session-dialog"]')).toBeVisible();
        await page.fill('textarea[data-testid="session-notes"]', 'Sessão realizada com sucesso');
        await page.click('[data-testid="confirm-complete-session"]');
      }

      // Verify status updated
      await expect(page.locator('[data-testid="appointment-status"]'))
        .toContainText(getStatusLabel(status.to));
    }

    // Test cancellation workflow
    await page.goto(`/appointments/${appointmentId}/edit`);
    await page.click('[data-testid="cancel-appointment"]');

    await expect(page.locator('[data-testid="cancel-dialog"]')).toBeVisible();
    await page.fill('textarea[data-testid="cancel-reason"]', 'Paciente cancelou por motivos pessoais');
    await page.click('[data-testid="confirm-cancel"]');

    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Agendamento cancelado com sucesso');
  });

  test('T031.5 - Recurring appointments management', async () => {
    // Navigate to new appointment
    await page.click('[data-testid="new-appointment-button"]');

    // Fill basic appointment data
    await selectPatient(page, testPatientId);
    await selectDate(page, addBusinessDays(new Date(), 1));
    await page.selectOption('select[data-testid="appointment-time"]', '15:00');
    await page.selectOption('select[data-testid="appointment-type"]', 'fisioterapia');

    // Enable recurring appointments
    await page.check('input[data-testid="recurring-appointment"]');

    // Configure recurrence
    await page.selectOption('select[data-testid="recurrence-pattern"]', 'weekly');
    await page.fill('input[data-testid="recurrence-count"]', '8');

    // Select days of week
    await page.check('input[data-testid="weekday-tuesday"]');
    await page.check('input[data-testid="weekday-thursday"]');

    // Submit recurring appointments
    await page.click('button[type="submit"]');

    // Verify confirmation dialog
    await expect(page.locator('[data-testid="recurring-confirm"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointments-count"]')).toContainText('16 agendamentos');

    await page.click('[data-testid="confirm-recurring"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Agendamentos recorrentes criados com sucesso');

    // Navigate to calendar to verify appointments
    await page.click('[data-testid="view-calendar"]');

    // Verify recurring appointments are visible
    for (let week = 0; week < 8; week++) {
      const tuesdayDate = addBusinessDays(new Date(), 1 + (week * 7));
      const thursdayDate = addBusinessDays(new Date(), 3 + (week * 7));

      await expect(page.locator(`[data-testid="appointment-${tuesdayDate.getTime()}"]`)).toBeVisible();
      await expect(page.locator(`[data-testid="appointment-${thursdayDate.getTime()}"]`)).toBeVisible();
    }
  });

  test('T031.6 - Appointment reminders and notifications', async () => {
    // Create appointment for tomorrow
    const appointmentDate = addBusinessDays(new Date(), 1);
    const appointmentId = await createTestAppointment(page, {
      patientId: testPatientId,
      date: appointmentDate,
      time: '14:00',
      reminderEnabled: true
    });

    // Navigate to appointment settings
    await page.goto(`/appointments/${appointmentId}/settings`);

    // Configure reminder settings
    await page.check('input[data-testid="sms-reminder"]');
    await page.check('input[data-testid="email-reminder"]');

    // Set reminder times
    await page.selectOption('select[data-testid="reminder-time-1"]', '24h');
    await page.selectOption('select[data-testid="reminder-time-2"]', '2h');

    // Save reminder settings
    await page.click('[data-testid="save-reminders"]');

    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Lembretes configurados com sucesso');

    // Test manual reminder sending
    await page.click('[data-testid="send-reminder-now"]');

    await expect(page.locator('[data-testid="reminder-sent"]'))
      .toContainText('Lembrete enviado para o paciente');

    // Verify reminder history
    await expect(page.locator('[data-testid="reminder-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="last-reminder"]'))
      .toContainText('Enviado agora');
  });

  // Helper functions
  async function loginAsFisioterapeuta(page: Page) {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_FISIO_USER.email);
    await page.fill('input[name="password"]', TEST_FISIO_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard/fisioterapeuta', { timeout: 10000 });
  }

  async function createTestAppointment(page: Page, appointmentData: any): Promise<string> {
    await page.goto('/appointments/new');

    await selectPatient(page, appointmentData.patientId);
    await selectDate(page, appointmentData.date);
    await page.selectOption('select[data-testid="appointment-time"]', appointmentData.time);

    if (appointmentData.type) {
      await page.selectOption('select[data-testid="appointment-type"]', appointmentData.type);
    }

    if (appointmentData.duration) {
      await page.selectOption('select[data-testid="appointment-duration"]', appointmentData.duration.toString());
    }

    await page.click('button[type="submit"]');

    await page.waitForURL(/\/appointments\/(\d+)/, { timeout: 5000 });

    const url = page.url();
    const match = url.match(/\/appointments\/(\d+)/);
    return match ? match[1] : '';
  }

  async function selectPatient(page: Page, patientId: string) {
    await page.click('input[data-testid="patient-search"]');
    await page.click(`[data-testid="patient-option-${patientId}"]`);
  }

  async function selectDate(page: Page, date: Date) {
    await page.click('input[data-testid="appointment-date"]');
    await page.click(`[data-testid="date-${date.getDate()}"]`);
  }

  function getStatusLabel(status: string): string {
    const statusLabels = {
      'agendado': 'Agendado',
      'confirmado': 'Confirmado',
      'em_andamento': 'Em Andamento',
      'concluido': 'Concluído',
      'cancelado': 'Cancelado',
      'falta': 'Falta'
    };
    return statusLabels[status] || status;
  }
});