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

- Gestão de Pacientes (parcial, mas funcional)
  - Endpoints API: `app/api/patients/route.ts` (GET/POST), `app/api/patients/[id]/route.ts` (GET/PUT/DELETE soft-delete via archive).
  - UI: `src/components/patients/*` com listagem, filtros básicos, criação via `CreatePatientDialog` (Zod + máscaras BR) e cards (`PatientCard`).

- Agendamentos (frontend completo; API pronta)
  - Página `/appointments` com calendário mensal/semanal/diário, filtros, listagem, estatísticas e modal de criação/edição: `app/appointments/page.tsx`, `src/components/calendar/AppointmentCalendar.tsx`, `src/components/appointments/AppointmentBookingModal.tsx`.
  - API `app/api/appointments/route.ts` com prevenção de conflitos (RPC), lembretes e relacionamentos.

- Mapa Corporal Interativo (core entregue)
  - Componentes: `components/bodymap/BodyMapSVG.tsx`, `PainPointModal.tsx`, `PainTimeline.tsx`.
  - API de pontos de dor por sessão: `src/app/api/sessions/[id]/pain-points/route.ts`.

- Dashboards e páginas de perfil (parciais)
  - `src/components/dashboard/*` e páginas `src/app/dashboard/*` para admin, fisioterapeuta, estagiário e paciente.

- LGPD/Compliance
  - Funções e logs de acesso, consentimento LGPD, políticas RLS, headers de segurança.

- PWA e infra
  - `public/manifest.json`, `public/sw.js`, componentes PWA, config Vercel (`vercel.json`) e docs de deploy.

## 2) Lacunas em relação ao PRD

1. Gestão de Pacientes
   - Falta: páginas completas `/patients`, `/patients/new`, `/patients/[id]`, `/patients/[id]/edit` no App Router (parte está em `src/components`, mas falta compor as páginas e navegação canônica).
   - Falta: busca/filtros avançados (idade, cidade, status) conectados ao backend, export (CSV/PDF/LGPD) e upload de foto com storage Supabase (bucket + política + UI).
   - Falta: validação de CPF/telefone/CEP no servidor harmonizada com o form; soft delete já existe como archive, mas falta expor na UI.

2. Prontuário Eletrônico / Sessões
   - Falta: telas de sessão (criar, evoluir, registrar procedimentos, exercícios, dor antes/depois) e vínculo com `pain_points` e `sessions` (UI). API de pain points já existe.
   - Falta: anamnese/exame físico (modelagem pode reutilizar `sessions` + colunas específicas ou criar tabelas auxiliares).

3. Mapa Corporal Interativo
   - Implementado o core, mas falta: controles de frente/costas/lateral na UI do fluxo do paciente, persistência e edição dos pontos por sessão diretamente na tela do paciente/sessão, upload de fotos de lesões, export PDF.

4. Sistema de Agendamento
   - Front completo e API pronta, mas falta ligar a página a dados reais (fetch da API em vez de mocks), rota `/appointments/[id]` (detalhe) e `/appointments/new` (atalho).
   - Falta: lista de espera, bloqueios de horário/folgas/feriados, reagendamento por drag & drop (pode integrar `dnd-kit`).

5. Biblioteca de Exercícios e Prescrições
   - Falta: modelagem de exercícios e prescrições (tabelas e RPC), UI de biblioteca, filtros, favorito/duplicar, prescrição personalizada e portal do paciente para execução/feedback.

6. Dashboards, Relatórios e Export
   - Falta: dashboard executivo com KPIs reais (ligar a consultas), relatórios clínicos/gerenciais, export PDF/Excel, agendamento e envio por e-mail.

7. Financeiro
   - Falta: modelagem de procedimentos/recebíveis, integrações (PIX), UI de cobrança e relatórios financeiros.

8. Segurança extra e Auditoria
   - Falta: trilhas de auditoria expostas em UI, políticas RLS extras para novos módulos, rate limiting mais robusto e LGPD portal do paciente (portabilidade/eliminação).

## 3) Plano por Fases (12 semanas)

### Fase 1 — Fundação (Semanas 1–2)
Prioridade alta
- Concluir páginas de Pacientes no App Router:
  - `app/patients/page.tsx`: listar, buscar, filtros avançados c/ querystring → GET `/api/patients`.
  - `app/patients/new/page.tsx`: formulário com Zod + máscaras → POST `/api/patients`.
  - `app/patients/[id]/page.tsx`: detalhes com ações (inativar/arquivar) → GET/DELETE.
  - `app/patients/[id]/edit/page.tsx`: edição → PUT.
- Upload de foto (Supabase Storage): criar bucket, políticas e UI; salvar `photo_url`.
- Navegação e proteção por role nas páginas acima.

Entregáveis: CRUD pacientes 100% funcional, responsivo e seguro.

### Fase 2 — Core Features (Semanas 3–4)
Prioridade alta
- Mapa Corporal no fluxo de sessão/paciente:
  - Tela de sessão: criar/editar sessão, registrar dor antes/depois, abrir `BodyMapSVG` + `PainPointModal` e persistir em `/api/sessions/[id]/pain-points`.
  - Controles frente/costas/lateral e timeline integrada por sessão/paciente.
- Agendamentos com dados reais:
  - Substituir mocks por fetch à API, rota `/appointments/[id]` e reagendamento simples (ações na UI); preparar drag & drop.

Entregáveis: sessões com dor e agendamento integrado ao backend.

### Fase 3 — Exercícios (Semanas 5–6)
Prioridade média
- Modelagem Supabase: `exercises`, `exercise_media`, `prescriptions`, `patient_exercise_logs` + RLS.
- UI: biblioteca com busca/filtros, `ExerciseCard`, `ExerciseModal`, `ExerciseForm`, `CategoryFilter`, `ExerciseSearch`.
- Prescrição personalizada e portal do paciente (leitura e registro de execução/feedback).

Entregáveis: biblioteca e prescrição funcional, primeira versão do portal do paciente.

### Fase 4 — Relatórios (Semanas 7–8)
Prioridade média
- Dashboard executivo com métricas reais (Recharts) e filtros por período/terapeuta.
- Relatórios clínicos (evolução, alta, laudo) e gerenciais; export JSON/CSV e PDF (jsPDF/Print API).

Entregáveis: dashboards e relatórios exportáveis.

### Fase 5 — Financeiro (Semanas 9–10)
Prioridade baixa
- Modelagem financeira (procedimentos, recebimentos, parcelas, inadimplência) + RLS.
- UI de cobranças e relatórios; integração PIX (fase inicial com payload COP/QR estático).

Entregáveis: controle financeiro básico com relatórios.

### Fase 6 — Otimização e Deploy (Semanas 11–12)
Prioridade baixa
- Performance: lazy loading, code splitting, análise de bundle, caching e otimização de imagens.
- SEO/A11y: metatags dinâmicas, schema médico, ARIA/contraste/navegação por teclado.
- PWA: revisar SW, offline, push (usar VAPID), testes E2E (Playwright) e monitoramento (Sentry).
- LGPD: autoatendimento do paciente (export/forget) e trilhas de auditoria em UI.

## 4) Backlog por módulo (checklist)

- Pacientes
  - [ ] Páginas App Router completas e ligadas à API
  - [ ] Filtros avançados + export CSV/PDF/LGPD
  - [ ] Upload foto (Storage) + políticas

- Sessões/Prontuário
  - [ ] Tela sessão + dor antes/depois e pontos de dor
  - [ ] Anamnese/exame físico (modelo + UI)
  - [ ] Comparação temporal entre sessões

- Mapa Corporal
  - [ ] Alternar frente/costas/lateral e salvar contexto por sessão
  - [ ] Upload de fotos de lesões
  - [ ] Export PDF

- Agendamentos
  - [ ] Conectar página à API (sem mocks)
  - [ ] Rota de detalhes `/appointments/[id]`
  - [ ] Lista de espera, bloqueios, drag & drop

- Exercícios/Prescrição
  - [ ] Migrações + RLS
  - [ ] Biblioteca + CRUD + mídia
  - [ ] Prescrição personalizada e portal do paciente

- Dashboards/Relatórios
  - [ ] KPIs reais + gráficos
  - [ ] Relatórios clínicos/gerenciais + PDF/CSV/Excel

- Financeiro
  - [ ] Modelagem e UI básica
  - [ ] Integração PIX

- Segurança/LGPD
  - [ ] UI de auditoria e export/forget do paciente
  - [ ] Rate limiting e logs estendidos

## 5) Riscos e dependências

- Políticas RLS para novos módulos exigem cuidado no isolamento por organização e perfis.
- Export PDF e uploads exigem permissões, storage e custo de banda; considerar thumbnails e limites.
- Drag & drop no calendário requer definição de regra de conflito/auto-resolução.
- Portal do paciente requer escopo de autenticação específico e rotas próprias.

—

Responsável: Eng. responsável pelo FisioFlow
Última atualização: automática via auditoria inicial

