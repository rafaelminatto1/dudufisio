# Plano de Implementação — FisioFlow (DuduFisio)

Este documento consolida o que já existe no projeto e o que falta implementar, com priorização por fases (alinhado ao PRD fornecido). Ele serve como checklist técnico para levar o sistema à produção.

## 1) Status atual (implementado)

- Autenticação, middleware e RBAC
  - `middleware.ts` com proteção de rotas, headers de segurança, CORS, redirecionamento por sessão e checagem de permissões.
  - RBAC avançado em `src/lib/auth/rbac.ts` com `Resource`/`Action`, utilitários e hooks.
  - Páginas de login/fluxos auth em `src/app/(auth)/*`.

- Base de dados (Supabase) e RLS
  - Migrações para pacientes, agendamentos, sessões e pontos de dor: `supabase/migrations/20250115_00{2,3}_*.sql`.
  - Funções RPC: `validate_cpf`, `log_patient_data_access`, `check_appointment_conflicts`, `generate_appointment_reminders`, `get_available_time_slots`.
  - RLS e índices configurados.

- ✅ **Gestão de Pacientes (COMPLETO)**
  - Endpoints API: `app/api/patients/route.ts` (GET/POST), `app/api/patients/[id]/route.ts` (GET/PUT/DELETE soft-delete via archive).
  - Páginas App Router completas:
    - `app/patients/page.tsx` - Listagem com filtros avançados, paginação e busca conectada à API
    - `app/patients/new/page.tsx` - Criação de novos pacientes
    - `app/patients/[id]/page.tsx` - Detalhes do paciente com tabs (visão geral, mapa corporal, timeline, sessões)
    - `app/patients/[id]/edit/page.tsx` - Edição completa de dados do paciente
  - ✅ Upload de fotos implementado:
    - Componente `PatientPhotoUpload.tsx` integrado com Supabase Storage
    - API `app/api/storage/upload/route.ts` para uploads seguros
    - Políticas RLS para acesso controlado às imagens

- ✅ **Sistema de Sessões Clínicas (COMPLETO)**
  - API completa: `app/api/sessions/route.ts` (GET/POST) e `app/api/sessions/[id]/pain-points/route.ts`
  - Componente `CreateSessionModal.tsx` para criação de sessões com formulário em duas etapas
  - Integração com mapa corporal para registro de pontos de dor durante sessões
  - Campos clínicos completos: queixa principal, avaliação de dor antes/depois, procedimentos, técnicas, metas

- Agendamentos (frontend completo; API parcial)
  - Página `/appointments` com calendário mensal/semanal/diário, filtros, listagem, estatísticas: `app/appointments/page.tsx`
  - Componentes: `src/components/calendar/AppointmentCalendar.tsx`, `src/components/appointments/AppointmentBookingModal.tsx`
  - ✅ Conectado parcialmente à API de pacientes para dados reais
  - API `app/api/appointments/route.ts` com prevenção de conflitos (RPC), lembretes e relacionamentos.

- ✅ **Mapa Corporal Interativo (INTEGRADO)**
  - Componentes: `components/bodymap/BodyMapSVG.tsx`, `PainPointModal.tsx`, `PainTimeline.tsx`.
  - ✅ API integrada: `app/api/sessions/[id]/pain-points/route.ts`
  - ✅ Fluxo completo: sessão → registro de dor → visualização no mapa corporal
  - Controles frente/costas/lateral implementados na página do paciente

- Dashboards e páginas de perfil (parciais)
  - `src/components/dashboard/*` e páginas `src/app/dashboard/*` para admin, fisioterapeuta, estagiário e paciente.

- LGPD/Compliance
  - Funções e logs de acesso, consentimento LGPD, políticas RLS, headers de segurança.
  - ✅ Upload de arquivos com conformidade LGPD e auditoria

- PWA e infra
  - `public/manifest.json`, `public/sw.js`, componentes PWA, config Vercel (`vercel.json`) e docs de deploy.

## 2) Lacunas em relação ao PRD

1. ✅ ~~Gestão de Pacientes~~ **CONCLUÍDO**
   - ✅ Páginas completas implementadas: `/patients`, `/patients/new`, `/patients/[id]`, `/patients/[id]/edit`
   - ✅ Busca/filtros avançados conectados ao backend com paginação
   - ✅ Upload de foto com Supabase Storage implementado
   - Pendente: Export CSV/PDF/LGPD (baixa prioridade)

2. ✅ ~~Prontuário Eletrônico / Sessões~~ **CONCLUÍDO**
   - ✅ Sistema completo de sessões implementado com `CreateSessionModal`
   - ✅ Integração com mapa corporal e pontos de dor
   - ✅ APIs completas: `/api/sessions` e `/api/sessions/[id]/pain-points`
   - Pendente: Anamnese/exame físico detalhado (pode ser extensão futura)

3. ✅ ~~Mapa Corporal Interativo~~ **CONCLUÍDO**
   - ✅ Controles frente/costas/lateral implementados
   - ✅ Persistência e edição de pontos por sessão
   - ✅ Integração completa com fluxo clínico
   - Pendente: Upload de fotos de lesões, export PDF (funcionalidades avançadas)

4. Sistema de Agendamento (90% completo)
   - ✅ Frontend completo e API pronta
   - ✅ Conectado parcialmente à API real (pacientes)
   - Pendente: Rota `/appointments/[id]` (detalhe) e `/appointments/new` (atalho)
   - Pendente: Lista de espera, bloqueios de horário, reagendamento por drag & drop

5. Biblioteca de Exercícios e Prescrições
   - Falta: Modelagem de exercícios e prescrições (tabelas e RPC)
   - Falta: UI de biblioteca, filtros, prescrição personalizada
   - Falta: Portal do paciente para execução/feedback

6. Dashboards, Relatórios e Export
   - Falta: Dashboard executivo com KPIs reais
   - Falta: Relatórios clínicos/gerenciais, export PDF/Excel
   - Falta: Agendamento e envio por e-mail

7. Financeiro
   - Falta: Modelagem de procedimentos/recebíveis
   - Falta: Integrações (PIX), UI de cobrança
   - Falta: Relatórios financeiros

8. Segurança extra e Auditoria
   - Falta: Trilhas de auditoria expostas em UI
   - Falta: Rate limiting mais robusto
   - Falta: LGPD portal do paciente (portabilidade/eliminação)

## 3) Plano por Fases (12 semanas)

### ✅ ~~Fase 1 — Fundação (Semanas 1–2)~~ **CONCLUÍDO**
Prioridade alta
- ✅ Concluir páginas de Pacientes no App Router:
  - ✅ `app/patients/page.tsx`: listar, buscar, filtros avançados c/ querystring → GET `/api/patients`.
  - ✅ `app/patients/new/page.tsx`: formulário com Zod + máscaras → POST `/api/patients`.
  - ✅ `app/patients/[id]/page.tsx`: detalhes com ações (inativar/arquivar) → GET/DELETE.
  - ✅ `app/patients/[id]/edit/page.tsx`: edição → PUT.
- ✅ Upload de foto (Supabase Storage): criar bucket, políticas e UI; salvar `photo_url`.
- ✅ Navegação e proteção por role nas páginas acima.

**Entregáveis**: ✅ CRUD pacientes 100% funcional, responsivo e seguro.

### ✅ ~~Fase 2 — Core Features (Semanas 3–4)~~ **CONCLUÍDO**
Prioridade alta
- ✅ Mapa Corporal no fluxo de sessão/paciente:
  - ✅ Tela de sessão: criar/editar sessão com `CreateSessionModal`
  - ✅ Registrar dor antes/depois, abrir `BodyMapSVG` + `PainPointModal`
  - ✅ Persistir em `/api/sessions/[id]/pain-points`
  - ✅ Controles frente/costas/lateral e timeline integrada por sessão/paciente
- ✅ Agendamentos com dados reais:
  - ✅ Conectado à API de pacientes para dados reais
  - Pendente: Rota `/appointments/[id]` e drag & drop (próxima fase)

**Entregáveis**: ✅ Sessões com dor e agendamento parcialmente integrado ao backend.

### ✅ ~~Fase 3 — Exercícios (Semanas 5–6)~~ **CONCLUÍDO**
Prioridade média
- ✅ Modelagem Supabase: APIs `app/api/exercises/route.ts` e `app/api/prescriptions/route.ts` com validações completas
- ✅ UI: biblioteca completa `app/exercises/page.tsx` com busca/filtros, `CreateExerciseModal`, `ExerciseDetailsModal`
- ✅ Prescrição personalizada `app/prescriptions/page.tsx` com `CreatePrescriptionModal` e sistema drag & drop
- ✅ Portal do paciente `app/portal-paciente/exercicios/page.tsx` com `ExerciseExecutionModal` para execução e feedback

**Entregáveis**: ✅ Biblioteca de exercícios funcional, sistema de prescrições personalizado e portal do paciente interativo.

### ✅ ~~Fase 4 — Relatórios (Semanas 7–8)~~ **CONCLUÍDO**
Prioridade média
- ✅ Dashboard executivo `app/dashboard/admin/page.tsx` com métricas reais (Recharts) e filtros por período/terapeuta
- ✅ Sistema de relatórios `app/relatorios/page.tsx` com templates, agendamento automático e export múltiplos formatos
- ✅ Gráficos interativos: receita, agendamentos, distribuição demográfica, desempenho por terapeuta

**Entregáveis**: ✅ Dashboards executivos e sistema completo de relatórios automatizados.

### ✅ ~~Fase 5 — Financeiro (Semanas 9–10)~~ **CONCLUÍDO**
Prioridade baixa
- ✅ Modelagem financeira: APIs `app/api/procedures/route.ts` e `app/api/billing/route.ts` com controle completo
- ✅ UI financeira `app/financeiro/page.tsx` com dashboards, controle de cobranças e análise de inadimplência
- ✅ Sistema de procedimentos, cobrança, pagamentos e relatórios financeiros integrados

**Entregáveis**: ✅ Sistema financeiro básico completo com controle de receitas, cobranças e relatórios.

### ✅ ~~Fase 6 — Otimização e Deploy (Semanas 11–12)~~ **CONCLUÍDO**
Prioridade baixa
- ✅ Performance: lazy loading, code splitting, análise de bundle, caching e otimização de imagens
- ✅ SEO/A11y: metatags dinâmicas, schema médico, ARIA/contraste/navegação por teclado
- ✅ PWA: service worker avançado, offline, push notifications e background sync
- ✅ LGPD: portal de autoatendimento do paciente (export/delete) com APIs completas

**Entregáveis**: ✅ Sistema otimizado com performance melhorada, SEO completo, PWA funcional e conformidade total LGPD.

## 4) Backlog por módulo (checklist)

- ✅ **Pacientes (CONCLUÍDO)**
  - ✅ Páginas App Router completas e ligadas à API
  - ✅ Filtros avançados + paginação
  - ✅ Upload foto (Storage) + políticas
  - ✅ Export/portabilidade LGPD (portal de autoatendimento)

- ✅ **Sessões/Prontuário (CONCLUÍDO)**
  - ✅ Tela sessão + dor antes/depois e pontos de dor
  - ✅ Integração completa com mapa corporal
  - ✅ API completa com validações e auditoria
  - [ ] Anamnese/exame físico detalhado (extensão futura)
  - [ ] Comparação temporal entre sessões (feature avançada)

- ✅ **Mapa Corporal (CONCLUÍDO)**
  - ✅ Alternar frente/costas/lateral e salvar contexto por sessão
  - ✅ Integração com fluxo de sessões
  - ✅ API de pontos de dor funcional
  - [ ] Upload de fotos de lesões (feature avançada)
  - [ ] Export PDF (feature avançada)

- Agendamentos (90% concluído)
  - ✅ Conectar página à API de pacientes
  - [ ] Conectar à API de agendamentos completa
  - [ ] Rota de detalhes `/appointments/[id]`
  - [ ] Lista de espera, bloqueios, drag & drop

- ✅ **Exercícios/Prescrição (CONCLUÍDO)**
  - ✅ APIs completas com validações Zod e auditoria
  - ✅ Biblioteca de exercícios com filtros avançados e categorização
  - ✅ Sistema de prescrições personalizadas com drag & drop
  - ✅ Portal do paciente interativo com execução de exercícios

- ✅ **Dashboards/Relatórios (CONCLUÍDO)**
  - ✅ Dashboard executivo com KPIs reais e gráficos interativos (Recharts)
  - ✅ Sistema de relatórios com templates, agendamento e export múltiplos formatos
  - ✅ Análise financeira, demográfica e de desempenho

- ✅ **Financeiro (CONCLUÍDO)**
  - ✅ Modelagem completa: procedimentos, cobranças, pagamentos, parcelas
  - ✅ UI financeira com dashboards, controle de inadimplência
  - ✅ Sistema básico de cobrança com múltiplos métodos de pagamento

- ✅ **Segurança/LGPD (CONCLUÍDO)**
  - ✅ Upload seguro com auditoria
  - ✅ Portal LGPD completo: export/delete de dados do paciente
  - ✅ APIs LGPD com conformidade legal e rate limiting
  - ✅ Performance, SEO, PWA e acessibilidade implementados

## 5) Riscos e dependências

- Políticas RLS para novos módulos exigem cuidado no isolamento por organização e perfis.
- Export PDF e uploads exigem permissões, storage e custo de banda; considerar thumbnails e limites.
- Drag & drop no calendário requer definição de regra de conflito/auto-resolução.
- Portal do paciente requer escopo de autenticação específico e rotas próprias.

—

Responsável: Eng. responsável pelo FisioFlow
Última atualização: automática via auditoria inicial


