/**
 * T032 - Body Mapping Integration Test
 * Tests interactive body mapping pain point creation and timeline workflow
 */

import { test, expect, Page } from '@playwright/test';
import {
  createTestUser,
  createTestPatient,
  createTestSession,
  cleanupTestData,
  TEST_FISIO_USER,
  TEST_PATIENT_DATA,
  TEST_ORG
} from '../helpers/test-helpers';

test.describe('Body Mapping Integration', () => {
  let page: Page;
  let testPatientId: string;
  let testSessionId: string;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Setup test data
    await createTestUser({
      ...TEST_FISIO_USER,
      role: 'fisioterapeuta',
      org_id: TEST_ORG.id
    });

    testPatientId = await createTestPatient({
      ...TEST_PATIENT_DATA,
      org_id: TEST_ORG.id
    });

    testSessionId = await createTestSession({
      patient_id: testPatientId,
      therapist_id: TEST_FISIO_USER.id,
      org_id: TEST_ORG.id
    });

    await loginAsFisioterapeuta(page);
  });

  test.afterEach(async () => {
    await cleanupTestData();
    await page.close();
  });

  test('T032.1 - Interactive body mapping pain point creation', async () => {
    // Navigate to session with body mapping
    await page.goto(`/sessions/${testSessionId}`);

    // Click on body mapping tab
    await page.click('[data-testid="body-mapping-tab"]');

    // Verify body mapping interface is loaded
    await expect(page.locator('[data-testid="body-map-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="body-svg-front"]')).toBeVisible();
    await expect(page.locator('[data-testid="body-svg-back"]')).toBeVisible();

    // Test pain point creation on front view
    const shoulderCoordinates = { x: 150, y: 80 }; // Right shoulder area
    await page.click('[data-testid="body-svg-front"]', {
      position: shoulderCoordinates
    });

    // Verify pain point creation dialog
    await expect(page.locator('[data-testid="pain-point-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="body-region"]')).toContainText('Ombro Direito');

    // Configure pain point details
    await page.selectOption('select[data-testid="pain-type"]', 'aguda');
    await page.click('[data-testid="intensity-7"]'); // Pain intensity 7/10
    await page.fill('textarea[data-testid="pain-description"]', 'Dor intensa no ombro direito, piora com movimento de elevação');
    await page.selectOption('select[data-testid="pain-frequency"]', 'constante');

    // Add pain characteristics
    await page.check('input[data-testid="characteristic-queimacao"]');
    await page.check('input[data-testid="characteristic-pontada"]');

    // Set pain triggers
    await page.fill('input[data-testid="pain-triggers"]', 'Movimento de elevação, carregar peso');

    // Save pain point
    await page.click('[data-testid="save-pain-point"]');

    // Verify pain point is displayed on body map
    await expect(page.locator('[data-testid="pain-point-shoulder-right"]')).toBeVisible();
    await expect(page.locator('[data-testid="pain-intensity-indicator"]')).toContainText('7');

    // Test hover information
    await page.hover('[data-testid="pain-point-shoulder-right"]');
    await expect(page.locator('[data-testid="pain-tooltip"]')).toBeVisible();
    await expect(page.locator('[data-testid="pain-tooltip"]')).toContainText('Ombro Direito');
    await expect(page.locator('[data-testid="pain-tooltip"]')).toContainText('Intensidade: 7/10');
  });

  test('T032.2 - Multiple pain points and body regions', async () => {
    await page.goto(`/sessions/${testSessionId}`);
    await page.click('[data-testid="body-mapping-tab"]');

    // Create multiple pain points
    const painPoints = [
      {
        position: { x: 150, y: 80 }, // Right shoulder
        region: 'Ombro Direito',
        intensity: 7,
        type: 'aguda',
        description: 'Dor no ombro direito'
      },
      {
        position: { x: 120, y: 200 }, // Lower back
        region: 'Lombar',
        intensity: 5,
        type: 'cronica',
        description: 'Dor lombar crônica'
      },
      {
        position: { x: 180, y: 350 }, // Right knee
        region: 'Joelho Direito',
        intensity: 4,
        type: 'aguda',
        description: 'Desconforto no joelho'
      }
    ];

    for (const painPoint of painPoints) {
      // Click on body map
      await page.click('[data-testid="body-svg-front"]', {
        position: painPoint.position
      });

      // Fill pain point details
      await page.selectOption('select[data-testid="pain-type"]', painPoint.type);
      await page.click(`[data-testid="intensity-${painPoint.intensity}"]`);
      await page.fill('textarea[data-testid="pain-description"]', painPoint.description);

      // Save pain point
      await page.click('[data-testid="save-pain-point"]');

      // Verify pain point appears
      await expect(page.locator(`[data-testid="pain-point-${painPoint.region.toLowerCase().replace(/\s+/g, '-')}"]`))
        .toBeVisible();
    }

    // Verify pain points summary
    await expect(page.locator('[data-testid="pain-points-count"]')).toContainText('3 pontos de dor');

    // Test pain points list view
    await page.click('[data-testid="pain-points-list"]');

    for (const painPoint of painPoints) {
      await expect(page.locator('[data-testid="pain-list-item"]'))
        .toContainText(painPoint.region);
      await expect(page.locator('[data-testid="pain-list-item"]'))
        .toContainText(`${painPoint.intensity}/10`);
    }
  });

  test('T032.3 - Pain point editing and updates', async () => {
    await page.goto(`/sessions/${testSessionId}`);
    await page.click('[data-testid="body-mapping-tab"]');

    // Create initial pain point
    await page.click('[data-testid="body-svg-front"]', {
      position: { x: 150, y: 80 }
    });

    await page.selectOption('select[data-testid="pain-type"]', 'aguda');
    await page.click('[data-testid="intensity-8"]');
    await page.fill('textarea[data-testid="pain-description"]', 'Dor inicial no ombro');
    await page.click('[data-testid="save-pain-point"]');

    // Edit existing pain point
    await page.click('[data-testid="pain-point-shoulder-right"]');

    // Verify edit dialog opens with existing data
    await expect(page.locator('[data-testid="pain-point-dialog"]')).toBeVisible();
    await expect(page.locator('textarea[data-testid="pain-description"]'))
      .toHaveValue('Dor inicial no ombro');

    // Update pain point details
    await page.click('[data-testid="intensity-5"]'); // Reduce intensity
    await page.selectOption('select[data-testid="pain-type"]', 'cronica');
    await page.fill('textarea[data-testid="pain-description"]', 'Dor crônica no ombro, melhorou com tratamento');

    // Add improvement notes
    await page.fill('textarea[data-testid="improvement-notes"]', 'Paciente relata melhora após 3 sessões de fisioterapia');

    // Update pain point
    await page.click('[data-testid="update-pain-point"]');

    // Verify updates are reflected
    await expect(page.locator('[data-testid="pain-intensity-indicator"]')).toContainText('5');

    // Verify in hover tooltip
    await page.hover('[data-testid="pain-point-shoulder-right"]');
    await expect(page.locator('[data-testid="pain-tooltip"]')).toContainText('Intensidade: 5/10');
    await expect(page.locator('[data-testid="pain-tooltip"]')).toContainText('Crônica');
  });

  test('T032.4 - Pain timeline and progress tracking', async () => {
    // Create multiple sessions with pain evolution
    const sessions = [
      { date: '2024-01-15', intensity: 8, notes: 'Dor intensa inicial' },
      { date: '2024-01-22', intensity: 6, notes: 'Leve melhora após tratamento' },
      { date: '2024-01-29', intensity: 4, notes: 'Melhora significativa' },
      { date: '2024-02-05', intensity: 2, notes: 'Dor residual mínima' }
    ];

    for (const session of sessions) {
      const sessionId = await createTestSession({
        patient_id: testPatientId,
        date: session.date,
        org_id: TEST_ORG.id
      });

      await page.goto(`/sessions/${sessionId}`);
      await page.click('[data-testid="body-mapping-tab"]');

      // Create pain point for this session
      await page.click('[data-testid="body-svg-front"]', {
        position: { x: 150, y: 80 }
      });

      await page.click(`[data-testid="intensity-${session.intensity}"]`);
      await page.fill('textarea[data-testid="pain-description"]', session.notes);
      await page.click('[data-testid="save-pain-point"]');
    }

    // Navigate to patient pain timeline
    await page.goto(`/patients/${testPatientId}/pain-timeline`);

    // Verify pain timeline is displayed
    await expect(page.locator('[data-testid="pain-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="timeline-title"]')).toContainText('Evolução da Dor');

    // Verify timeline entries
    for (const session of sessions) {
      await expect(page.locator(`[data-testid="timeline-entry-${session.date}"]`)).toBeVisible();
      await expect(page.locator(`[data-testid="timeline-entry-${session.date}"]`))
        .toContainText(`${session.intensity}/10`);
    }

    // Test pain trend chart
    await expect(page.locator('[data-testid="pain-trend-chart"]')).toBeVisible();

    // Verify improvement trend
    await expect(page.locator('[data-testid="trend-indicator"]')).toContainText('Melhora');
    await expect(page.locator('[data-testid="improvement-percentage"]')).toContainText('75%');

    // Test filtering by body region
    await page.selectOption('select[data-testid="region-filter"]', 'ombro-direito');

    // Verify filtered results
    await expect(page.locator('[data-testid="filtered-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="region-specific-trend"]')).toBeVisible();
  });

  test('T032.5 - Body mapping views and anatomical regions', async () => {
    await page.goto(`/sessions/${testSessionId}`);
    await page.click('[data-testid="body-mapping-tab"]');

    // Test front/back view switching
    await expect(page.locator('[data-testid="body-svg-front"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-indicator"]')).toContainText('Vista Frontal');

    // Switch to back view
    await page.click('[data-testid="back-view-button"]');
    await expect(page.locator('[data-testid="body-svg-back"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-indicator"]')).toContainText('Vista Posterior');

    // Test pain point on back view
    await page.click('[data-testid="body-svg-back"]', {
      position: { x: 120, y: 200 } // Lower back area
    });

    await expect(page.locator('[data-testid="body-region"]')).toContainText('Lombar');

    // Configure back pain point
    await page.selectOption('select[data-testid="pain-type"]', 'cronica');
    await page.click('[data-testid="intensity-6"]');
    await page.fill('textarea[data-testid="pain-description"]', 'Dor lombar crônica');
    await page.click('[data-testid="save-pain-point"]');

    // Switch back to front view and verify pain point persistence
    await page.click('[data-testid="front-view-button"]');
    await page.click('[data-testid="back-view-button"]');

    await expect(page.locator('[data-testid="pain-point-lombar"]')).toBeVisible();

    // Test side views
    await page.click('[data-testid="side-view-button"]');
    await expect(page.locator('[data-testid="body-svg-side"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-indicator"]')).toContainText('Vista Lateral');

    // Test anatomical region highlighting
    await page.hover('[data-testid="anatomical-region-ombro"]');
    await expect(page.locator('[data-testid="region-highlight"]')).toBeVisible();
    await expect(page.locator('[data-testid="region-info"]')).toContainText('Ombro');
  });

  test('T032.6 - Pain assessment scales and measurements', async () => {
    await page.goto(`/sessions/${testSessionId}`);
    await page.click('[data-testid="body-mapping-tab"]');

    // Create pain point
    await page.click('[data-testid="body-svg-front"]', {
      position: { x: 150, y: 80 }
    });

    // Test different pain scales
    await page.click('[data-testid="scale-type-numeric"]');
    await expect(page.locator('[data-testid="numeric-scale"]')).toBeVisible();

    // Test numeric scale (0-10)
    for (let i = 0; i <= 10; i++) {
      await page.click(`[data-testid="intensity-${i}"]`);
      await expect(page.locator('[data-testid="selected-intensity"]')).toContainText(i.toString());
    }

    // Switch to visual analog scale
    await page.click('[data-testid="scale-type-visual"]');
    await expect(page.locator('[data-testid="visual-analog-scale"]')).toBeVisible();

    // Test VAS slider
    const vasSlider = page.locator('[data-testid="vas-slider"]');
    await vasSlider.click({ position: { x: 70, y: 0 } }); // ~70% position
    await expect(page.locator('[data-testid="vas-value"]')).toContainText('7');

    // Switch to faces scale
    await page.click('[data-testid="scale-type-faces"]');
    await expect(page.locator('[data-testid="faces-scale"]')).toBeVisible();

    // Test faces scale
    await page.click('[data-testid="face-scale-5"]');
    await expect(page.locator('[data-testid="selected-face"]')).toHaveAttribute('data-value', '5');

    // Test pain quality descriptors
    await page.click('[data-testid="pain-quality-tab"]');

    const painQualities = [
      'queimacao', 'pontada', 'latejante', 'formigamento',
      'pressao', 'choque', 'fadiga', 'rigidez'
    ];

    for (const quality of painQualities) {
      await page.check(`input[data-testid="quality-${quality}"]`);
    }

    // Verify selected qualities
    await expect(page.locator('[data-testid="selected-qualities"]')).toContainText('8 características selecionadas');

    // Test pain radiation mapping
    await page.click('[data-testid="radiation-tab"]');
    await page.check('input[data-testid="has-radiation"]');

    // Draw radiation path
    await page.dragAndDrop(
      '[data-testid="pain-point-shoulder-right"]',
      '[data-testid="radiation-target-arm"]'
    );

    await expect(page.locator('[data-testid="radiation-line"]')).toBeVisible();
    await expect(page.locator('[data-testid="radiation-description"]'))
      .toContainText('Dor irradia do ombro para o braço');

    // Save complete pain assessment
    await page.fill('textarea[data-testid="pain-description"]', 'Dor no ombro com irradiação para braço');
    await page.click('[data-testid="save-pain-point"]');

    // Verify comprehensive pain record
    await expect(page.locator('[data-testid="pain-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="pain-summary"]')).toContainText('Ombro Direito');
    await expect(page.locator('[data-testid="pain-summary"]')).toContainText('7/10');
    await expect(page.locator('[data-testid="pain-summary"]')).toContainText('Com irradiação');
  });

  // Helper function
  async function loginAsFisioterapeuta(page: Page) {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_FISIO_USER.email);
    await page.fill('input[name="password"]', TEST_FISIO_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard/fisioterapeuta', { timeout: 10000 });
  }
});