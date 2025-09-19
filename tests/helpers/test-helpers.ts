/**
 * Test Helpers for FisioFlow Integration Tests
 * Provides utilities for test data creation and Brazilian healthcare patterns
 */

// Test Organizations
export const TEST_ORG = {
  id: 'test-org-1',
  name: 'Clínica de Fisioterapia Teste',
  cnpj: '12.345.678/0001-99',
  address: 'Rua Teste, 123',
  city: 'São Paulo',
  state: 'SP'
};

// Test Users
export const TEST_ADMIN_USER = {
  id: 'admin-test-1',
  email: 'admin@fisioflow.test',
  password: 'AdminTest123!',
  name: 'Administrador Teste',
  role: 'admin'
};

export const TEST_FISIO_USER = {
  id: 'fisio-test-1',
  email: 'fisio@fisioflow.test',
  password: 'FisioTest123!',
  name: 'Dr. João Fisioterapeuta',
  role: 'fisioterapeuta',
  crefito: '123456-F'
};

export const TEST_ESTAGIARIO_USER = {
  id: 'estagiario-test-1',
  email: 'estagiario@fisioflow.test',
  password: 'EstagTest123!',
  name: 'Maria Estagiária',
  role: 'estagiario',
  supervisor_id: 'fisio-test-1'
};

export const TEST_PATIENT_USER = {
  id: 'patient-test-1',
  email: 'paciente@fisioflow.test',
  password: 'PacienteTest123!',
  name: 'Carlos Paciente Teste',
  role: 'paciente'
};

// Test Patient Data
export const TEST_PATIENT_DATA = {
  id: 'patient-data-1',
  name: 'Carlos Silva Santos',
  cpf: '123.456.789-01',
  rg: '12.345.678-9',
  date_of_birth: '1985-03-15',
  phone: '(11) 99876-5432',
  email: 'carlos.santos@email.com',
  address: 'Rua das Flores, 123',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zip_code: '01234-567',
  emergency_contact: 'Ana Santos',
  emergency_phone: '(11) 98765-4321',
  occupation: 'Professor',
  health_insurance: 'Unimed',
  insurance_number: '123456789',
  medical_history: 'Hipertensão controlada',
  allergies: 'Dipirona',
  medications: 'Losartana 50mg',
  lgpd_consent: true,
  lgpd_consent_date: new Date().toISOString()
};

/**
 * CPF Validation and Generation
 */
export function validateCPF(cpf: string): boolean {
  // Remove formatting
  cpf = cpf.replace(/[^\d]/g, '');

  // Check length
  if (cpf.length !== 11) return false;

  // Check for known invalid patterns
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let checkDigit1 = 11 - (sum % 11);
  if (checkDigit1 >= 10) checkDigit1 = 0;

  if (parseInt(cpf[9]) !== checkDigit1) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  let checkDigit2 = 11 - (sum % 11);
  if (checkDigit2 >= 10) checkDigit2 = 0;

  return parseInt(cpf[10]) === checkDigit2;
}

export function generateValidCPF(): string {
  // Generate first 9 digits
  const digits: number[] = [];
  for (let i = 0; i < 9; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }

  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  let checkDigit1 = 11 - (sum % 11);
  if (checkDigit1 >= 10) checkDigit1 = 0;
  digits.push(checkDigit1);

  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * (11 - i);
  }
  let checkDigit2 = 11 - (sum % 11);
  if (checkDigit2 >= 10) checkDigit2 = 0;
  digits.push(checkDigit2);

  // Format as CPF
  const cpf = digits.join('');
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
}

/**
 * CREFITO Generation (Brazilian Physical Therapy Council)
 */
export function generateValidCREFITO(): string {
  const regions = ['F', 'T', 'TO'];
  const region = regions[Math.floor(Math.random() * regions.length)];
  const number = Math.floor(Math.random() * 900000) + 100000;
  return `${number}-${region}`;
}

/**
 * Date Utilities for Brazilian Business Days
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();

    // Skip weekends (Saturday = 6, Sunday = 0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }

  return result;
}

export function formatBrazilianDate(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

export function formatBrazilianTime(time: string): string {
  return time;
}

export function formatBrazilianPhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Format as (XX) XXXXX-XXXX for mobile or (XX) XXXX-XXXX for landline
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }

  return phone;
}

/**
 * Test Data Creation Functions
 * These functions will fail until the actual implementation exists
 */
export async function createTestUser(userData: any): Promise<string> {
  // This will fail until user creation API is implemented
  const response = await fetch('/api/test/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    throw new Error(`Failed to create test user: ${response.statusText}`);
  }

  const result = await response.json();
  return result.id;
}

export async function createTestPatient(patientData: any): Promise<string> {
  // This will fail until patient creation API is implemented
  const response = await fetch('/api/test/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patientData)
  });

  if (!response.ok) {
    throw new Error(`Failed to create test patient: ${response.statusText}`);
  }

  const result = await response.json();
  return result.id;
}

export async function createTestSession(sessionData: any): Promise<string> {
  // This will fail until session creation API is implemented
  const response = await fetch('/api/test/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionData)
  });

  if (!response.ok) {
    throw new Error(`Failed to create test session: ${response.statusText}`);
  }

  const result = await response.json();
  return result.id;
}

export async function createTestAppointment(appointmentData: any): Promise<string> {
  // This will fail until appointment creation API is implemented
  const response = await fetch('/api/test/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointmentData)
  });

  if (!response.ok) {
    throw new Error(`Failed to create test appointment: ${response.statusText}`);
  }

  const result = await response.json();
  return result.id;
}

export async function cleanupTestData(): Promise<void> {
  // This will fail until cleanup API is implemented
  const response = await fetch('/api/test/cleanup', {
    method: 'DELETE'
  });

  if (!response.ok) {
    if (process.env.NODE_ENV === 'test') {
      console.warn(`Test cleanup failed: ${response.statusText}`);
    }
  }
}

/**
 * Brazilian Healthcare Patterns
 */
export const BRAZILIAN_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' }
];

export const BRAZILIAN_PHONE_REGEX = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
export const BRAZILIAN_CPF_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
export const BRAZILIAN_ZIPCODE_REGEX = /^\d{5}-\d{3}$/;

/**
 * Common Health Insurance Providers in Brazil
 */
export const HEALTH_INSURANCE_PROVIDERS = [
  'Unimed',
  'Bradesco Saúde',
  'Amil',
  'SulAmérica',
  'Hapvida',
  'Notre Dame',
  'Golden Cross',
  'São Francisco',
  'Prevent Senior',
  'Porto Seguro Saúde'
];

/**
 * Brazilian Pain Scale Labels
 */
export const PAIN_SCALE_LABELS = {
  0: 'Sem dor',
  1: 'Dor muito leve',
  2: 'Dor leve',
  3: 'Dor leve a moderada',
  4: 'Dor moderada',
  5: 'Dor moderada a forte',
  6: 'Dor forte',
  7: 'Dor muito forte',
  8: 'Dor intensa',
  9: 'Dor insuportável',
  10: 'Pior dor possível'
};

/**
 * Test Assertion Helpers
 */
export function expectBrazilianCPF(cpf: string): void {
  if (!BRAZILIAN_CPF_REGEX.test(cpf)) {
    throw new Error(`Expected valid Brazilian CPF format, got: ${cpf}`);
  }

  if (!validateCPF(cpf)) {
    throw new Error(`Expected valid CPF, got invalid: ${cpf}`);
  }
}

export function expectBrazilianPhone(phone: string): void {
  if (!BRAZILIAN_PHONE_REGEX.test(phone)) {
    throw new Error(`Expected valid Brazilian phone format, got: ${phone}`);
  }
}

export function expectLGPDCompliance(consentData: any): void {
  if (!consentData.lgpd_consent) {
    throw new Error('Expected LGPD consent to be true');
  }

  if (!consentData.lgpd_consent_date) {
    throw new Error('Expected LGPD consent date to be present');
  }

  const consentDate = new Date(consentData.lgpd_consent_date);
  const now = new Date();

  if (consentDate > now) {
    throw new Error('LGPD consent date cannot be in the future');
  }
}

/**
 * Mock Data Generators for Testing
 */
export function generateMockPatients(count: number): any[] {
  const patients = [];

  for (let i = 0; i < count; i++) {
    patients.push({
      id: `patient-${i + 1}`,
      name: `Paciente Teste ${i + 1}`,
      cpf: generateValidCPF(),
      date_of_birth: new Date(1980 + Math.floor(Math.random() * 40),
                             Math.floor(Math.random() * 12),
                             Math.floor(Math.random() * 28) + 1),
      phone: `(11) 9${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      org_id: TEST_ORG.id,
      lgpd_consent: true,
      lgpd_consent_date: new Date().toISOString()
    });
  }

  return patients;
}

export function generateMockAppointments(patientIds: string[], count: number): any[] {
  const appointments = [];
  const baseDate = new Date();

  for (let i = 0; i < count; i++) {
    const appointmentDate = addBusinessDays(baseDate, i);
    appointments.push({
      id: `appointment-${i + 1}`,
      patient_id: patientIds[Math.floor(Math.random() * patientIds.length)],
      therapist_id: TEST_FISIO_USER.id,
      date: appointmentDate.toISOString().split('T')[0],
      time: `${9 + Math.floor(Math.random() * 8)}:00`,
      type: ['consulta', 'retorno', 'avaliacao'][Math.floor(Math.random() * 3)],
      status: ['agendado', 'confirmado', 'concluido'][Math.floor(Math.random() * 3)],
      org_id: TEST_ORG.id
    });
  }

  return appointments;
}