/**
 * Utilitários de Teste para FisioFlow
 * Fornece helpers e mocks para testes
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

// Mock do Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock do Supabase
jest.mock('@/src/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}));

// Mock do logger
jest.mock('@/src/lib/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
}));

// Mock do Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setContext: jest.fn(),
}));

// Mock do window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock do IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock do ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock do fetch
global.fetch = jest.fn();

// Mock do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock do sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock do crypto
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid'),
    getRandomValues: jest.fn((arr) => arr.map(() => Math.floor(Math.random() * 256))),
  },
});

// Mock do performance
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
  },
});

// Mock do Date
const mockDate = new Date('2024-01-01T00:00:00.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

// Mock do console para evitar logs durante testes
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Test wrapper com providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {children}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data factories
export const mockPatient = {
  id: 'patient-1',
  name: 'João Silva',
  email: 'joao@example.com',
  phone: '11999999999',
  cpf: '12345678900',
  birth_date: '1990-01-01',
  gender: 'male',
  address: {
    street: 'Rua das Flores',
    number: '123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01234567',
  },
  emergency_contact: {
    name: 'Maria Silva',
    phone: '11988888888',
    relationship: 'Esposa',
  },
  medical_history: [],
  allergies: [],
  medications: [],
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

export const mockAppointment = {
  id: 'appointment-1',
  patient_id: 'patient-1',
  practitioner_id: 'practitioner-1',
  appointment_date: '2024-01-15',
  start_time: '09:00',
  duration_minutes: 60,
  appointment_type: 'consulta',
  status: 'agendada',
  notes: 'Primeira consulta',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

export const mockSession = {
  id: 'session-1',
  patient_id: 'patient-1',
  practitioner_id: 'practitioner-1',
  session_date: '2024-01-15',
  session_type: 'avaliacao',
  duration_minutes: 60,
  status: 'concluida',
  chief_complaint: 'Dor no joelho',
  objective_findings: 'Edema e crepitação',
  assessment: 'Tendinite patelar',
  treatment_plan: 'Fortalecimento e alongamento',
  notes: 'Paciente colaborativo',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

export const mockExercise = {
  id: 'exercise-1',
  name: 'Agachamento',
  description: 'Exercício de fortalecimento para quadríceps',
  category: 'fortalecimento',
  body_regions: ['pernas'],
  difficulty_level: 'intermediario',
  equipment_needed: ['nenhum'],
  instructions: 'Mantenha as costas retas e desça até 90 graus',
  precautions: 'Evitar se houver dor no joelho',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

export const mockPrescription = {
  id: 'prescription-1',
  patient_id: 'patient-1',
  practitioner_id: 'practitioner-1',
  name: 'Fortalecimento de Quadríceps',
  goals: 'Melhorar força e estabilidade do joelho',
  start_date: '2024-01-15',
  end_date: '2024-02-15',
  frequency_description: '3x por semana',
  exercises: [
    {
      exercise_id: 'exercise-1',
      sets: 3,
      reps: 15,
      frequency_per_week: 3,
      duration_weeks: 4,
      notes: 'Progressão gradual',
    },
  ],
  status: 'ativa',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

// Mock functions
export const mockFetch = (data: any, status = 200) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
};

export const mockFetchError = (message = 'Network error') => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(message));
};

// Test helpers
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  role: 'fisioterapeuta',
  name: 'Test User',
  ...overrides,
});

export const createMockAuthState = (user = null) => ({
  user,
  loading: false,
  error: null,
});

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
