# 📚 Guia de Boas Práticas - FisioFlow

## 📋 Índice
1. [Arquitetura e Estrutura](#arquitetura-e-estrutura)
2. [TypeScript e Type Safety](#typescript-e-type-safety)
3. [Segurança](#segurança)
4. [Performance](#performance)
5. [Qualidade de Código](#qualidade-de-código)
6. [Testes](#testes)
7. [Logging e Monitoramento](#logging-e-monitoramento)
8. [Banco de Dados](#banco-de-dados)
9. [Autenticação e Autorização](#autenticação-e-autorização)
10. [LGPD e Compliance](#lgpd-e-compliance)

---

## 🏗️ Arquitetura e Estrutura

### Estrutura de Pastas
```
/workspace
├── app/                    # App Router do Next.js
│   ├── (auth)/            # Grupo de rotas autenticadas
│   ├── api/               # API Routes
│   └── [feature]/         # Features modulares
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes de UI base
│   └── [feature]/        # Componentes específicos
├── lib/                   # Lógica de negócio e utilitários
│   ├── auth/             # Autenticação
│   ├── db/               # Acesso a dados
│   └── utils/            # Funções utilitárias
├── hooks/                 # Custom React Hooks
├── types/                 # TypeScript types globais
└── tests/                 # Testes
```

### Princípios de Design
- **Separation of Concerns**: Manter lógica de negócio separada da UI
- **DRY (Don't Repeat Yourself)**: Reutilizar código através de componentes e hooks
- **SOLID Principles**: Aplicar princípios SOLID no design de componentes
- **Composition over Inheritance**: Preferir composição de componentes

---

## 🎯 TypeScript e Type Safety

### Configuração Strict
```typescript
// tsconfig.json deve ter:
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Boas Práticas de Tipos

#### ❌ Evitar `any`
```typescript
// Ruim
function processData(data: any) {
  return data.value;
}

// Bom
interface Data {
  value: string;
}
function processData(data: Data) {
  return data.value;
}
```

#### ✅ Usar Types Específicos
```typescript
// Types para domínio
type PatientId = string & { readonly brand: unique symbol };
type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

// Interfaces para objetos complexos
interface Patient {
  id: PatientId;
  name: string;
  cpf: string;
  birthDate: Date;
  medicalHistory: MedicalRecord[];
}
```

#### ✅ Validação com Zod
```typescript
import { z } from 'zod';

const PatientSchema = z.object({
  name: z.string().min(3).max(100),
  cpf: z.string().regex(/^\d{11}$/),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10,11}$/)
});

type PatientInput = z.infer<typeof PatientSchema>;
```

---

## 🔒 Segurança

### Headers de Segurança
```typescript
// Implementados no middleware.ts
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
  'Strict-Transport-Security': 'max-age=31536000'
};
```

### Sanitização de Dados
```typescript
// Sempre sanitizar entrada do usuário
import DOMPurify from 'isomorphic-dompurify';

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [] 
  });
}
```

### Proteção contra SQL Injection
```typescript
// Usar prepared statements com Supabase
const { data, error } = await supabase
  .from('patients')
  .select('*')
  .eq('id', patientId) // Supabase escapa automaticamente
  .single();
```

### Variáveis de Ambiente
```typescript
// Validar variáveis de ambiente
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

---

## ⚡ Performance

### Otimização de Imagens
```tsx
import Image from 'next/image';

// Sempre usar next/image para otimização automática
<Image
  src="/patient-photo.jpg"
  alt="Patient"
  width={200}
  height={200}
  loading="lazy"
  placeholder="blur"
/>
```

### Code Splitting
```tsx
// Lazy loading de componentes pesados
const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  { 
    loading: () => <Skeleton />,
    ssr: false 
  }
);
```

### Memoização
```tsx
// Usar memo para componentes puros
const PatientCard = memo(({ patient }: { patient: Patient }) => {
  return <div>{patient.name}</div>;
});

// Usar useMemo para cálculos pesados
const expensiveCalculation = useMemo(() => {
  return calculateComplexMetrics(data);
}, [data]);

// Usar useCallback para funções
const handleSubmit = useCallback((data: FormData) => {
  // processar...
}, [dependency]);
```

### Cache de API
```typescript
// Implementar cache com SWR ou React Query
import useSWR from 'swr';

function usePatient(id: string) {
  return useSWR(`/api/patients/${id}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 60000 // 1 minuto
  });
}
```

---

## 🎨 Qualidade de Código

### Logging Estruturado
```typescript
import logger from '@/lib/logger';

// Usar logger ao invés de console.log
logger.info('Patient created', { 
  patientId: patient.id,
  userId: currentUser.id 
});

logger.error('Failed to save appointment', error, {
  appointmentData,
  userId: currentUser.id
});
```

### Tratamento de Erros
```typescript
// Criar classes de erro específicas
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Usar try-catch com tipos específicos
try {
  await savePatient(data);
} catch (error) {
  if (error instanceof ValidationError) {
    // Tratar erro de validação
  } else if (error instanceof DatabaseError) {
    // Tratar erro de banco
  } else {
    // Erro desconhecido
    logger.error('Unexpected error', error);
  }
}
```

### Comentários e Documentação
```typescript
/**
 * Calcula o IMC do paciente
 * @param weight - Peso em kg
 * @param height - Altura em metros
 * @returns IMC calculado
 * @throws {ValidationError} Se peso ou altura forem inválidos
 */
function calculateBMI(weight: number, height: number): number {
  if (weight <= 0 || height <= 0) {
    throw new ValidationError('Peso e altura devem ser positivos', 'measurement');
  }
  return weight / (height * height);
}
```

---

## 🧪 Testes

### Estrutura de Testes
```typescript
// Organizar testes por tipo
tests/
├── unit/           # Testes unitários
├── integration/    # Testes de integração
├── e2e/           # Testes end-to-end
└── fixtures/      # Dados de teste

// Exemplo de teste unitário
describe('PatientService', () => {
  describe('validateCPF', () => {
    it('should validate a valid CPF', () => {
      expect(validateCPF('12345678900')).toBe(true);
    });
    
    it('should reject invalid CPF', () => {
      expect(validateCPF('00000000000')).toBe(false);
    });
  });
});
```

### Coverage Mínimo
- Funções críticas: 100%
- Lógica de negócio: 80%
- Componentes UI: 60%
- Utilitários: 90%

---

## 📊 Logging e Monitoramento

### Níveis de Log
```typescript
// DEBUG: Informações detalhadas para debugging
logger.debug('Calculating appointment slots', { date, duration });

// INFO: Eventos importantes do sistema
logger.info('User logged in', { userId, timestamp });

// WARN: Situações potencialmente problemáticas
logger.warn('Rate limit approaching', { userId, requests });

// ERROR: Erros que precisam atenção
logger.error('Payment failed', error, { orderId });

// FATAL: Erros críticos que param o sistema
logger.fatal('Database connection lost', error);
```

### Métricas Importantes
- Response time de APIs
- Taxa de erro
- Uso de memória
- Queries lentas no banco
- Taxa de conversão de agendamentos

---

## 🗄️ Banco de Dados

### Row Level Security (RLS)
```sql
-- Sempre usar RLS no Supabase
CREATE POLICY "Users can only see their own data"
ON patients
FOR SELECT
USING (auth.uid() = user_id OR 
       EXISTS (
         SELECT 1 FROM user_roles 
         WHERE user_id = auth.uid() 
         AND role IN ('admin', 'fisioterapeuta')
       ));
```

### Migrations
```sql
-- Sempre versionar mudanças no banco
-- supabase/migrations/20240101000000_add_patient_notes.sql
ALTER TABLE patients 
ADD COLUMN notes TEXT;

-- Adicionar comentário explicativo
COMMENT ON COLUMN patients.notes IS 'Notas médicas do paciente (dados sensíveis)';
```

### Índices
```sql
-- Criar índices para queries frequentes
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_patients_cpf ON patients(cpf);
```

---

## 🔐 Autenticação e Autorização

### RBAC (Role-Based Access Control)
```typescript
// Definir roles e permissões claramente
enum Role {
  ADMIN = 'admin',
  FISIOTERAPEUTA = 'fisioterapeuta',
  SECRETARIA = 'secretaria',
  PACIENTE = 'paciente'
}

const permissions = {
  [Role.ADMIN]: ['*'],
  [Role.FISIOTERAPEUTA]: [
    'patients:read',
    'patients:write',
    'appointments:*',
    'prescriptions:*'
  ],
  [Role.SECRETARIA]: [
    'patients:read',
    'appointments:read',
    'appointments:write'
  ],
  [Role.PACIENTE]: [
    'own:appointments:read',
    'own:prescriptions:read'
  ]
};
```

### Session Management
```typescript
// Validar sessão em cada request
export async function validateSession(request: Request) {
  const session = await getSession(request);
  
  if (!session || session.expiresAt < new Date()) {
    throw new UnauthorizedError('Session expired');
  }
  
  return session;
}
```

---

## 📜 LGPD e Compliance

### Consentimento
```typescript
interface ConsentRecord {
  userId: string;
  version: string;
  acceptedAt: Date;
  ip: string;
  purposes: string[];
}

// Sempre registrar consentimento
async function recordConsent(consent: ConsentRecord) {
  await supabase.from('consent_records').insert(consent);
  logger.audit('Consent recorded', consent.userId, consent);
}
```

### Direito ao Esquecimento
```typescript
async function deleteUserData(userId: string) {
  // Anonimizar ao invés de deletar para manter integridade
  await supabase.from('patients').update({
    name: 'ANONIMIZADO',
    cpf: '00000000000',
    email: `deleted_${userId}@example.com`,
    phone: '0000000000',
    deleted_at: new Date()
  }).eq('id', userId);
  
  logger.audit('User data deleted', userId, { requestedAt: new Date() });
}
```

### Exportação de Dados
```typescript
async function exportUserData(userId: string): Promise<UserDataExport> {
  const data = await gatherAllUserData(userId);
  
  // Registrar exportação para auditoria
  logger.audit('Data exported', userId, { 
    exportedAt: new Date(),
    dataTypes: Object.keys(data)
  });
  
  return data;
}
```

---

## 🚀 Deployment Checklist

### Antes do Deploy
- [ ] Rodar testes: `npm run test`
- [ ] Verificar tipos: `npm run type-check`
- [ ] Verificar lint: `npm run lint`
- [ ] Verificar variáveis de ambiente
- [ ] Revisar logs e remover console.logs
- [ ] Verificar performance com Lighthouse
- [ ] Testar em diferentes navegadores
- [ ] Validar acessibilidade

### Configurações de Produção
- [ ] Habilitar HTTPS
- [ ] Configurar CDN
- [ ] Habilitar compressão
- [ ] Configurar rate limiting
- [ ] Configurar backup automático
- [ ] Configurar monitoramento
- [ ] Configurar alertas

---

## 📚 Recursos Adicionais

### Documentação
- [Next.js Best Practices](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Security Guidelines](https://owasp.org/)

### Ferramentas Recomendadas
- **Análise de Bundle**: `next-bundle-analyzer`
- **Testes**: Jest, React Testing Library, Playwright
- **Monitoramento**: Sentry, LogRocket, Datadog
- **CI/CD**: GitHub Actions, Vercel
- **Análise de Código**: SonarQube, CodeClimate

---

## 🤝 Contribuindo

1. Sempre criar branch para features: `feature/nome-da-feature`
2. Escrever testes para código novo
3. Atualizar documentação quando necessário
4. Fazer code review antes de merge
5. Usar conventional commits: `feat:`, `fix:`, `docs:`, etc.

---

**Última atualização**: Setembro 2025
**Mantido por**: Equipe FisioFlow