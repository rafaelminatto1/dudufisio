# 🗄️ Configuração do Supabase - DuduFisio

Este guia explica como configurar o Supabase real para o projeto DuduFisio, removendo as configurações mock.

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- Node.js 18+ instalado
- Git configurado

## 🚀 Passo a Passo

### 1. Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha os dados:
   - **Name**: `dudufisio`
   - **Database Password**: (anote esta senha!)
   - **Region**: Escolha a região mais próxima (Brasil: São Paulo)
5. Clique em "Create new project"
6. Aguarde a criação do projeto (2-3 minutos)

### 2. Configurar Variáveis de Ambiente

1. No painel do Supabase, vá em **Settings > API**
2. Copie as seguintes informações:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY)

3. Edite o arquivo `.env.local`:
```bash
# Substitua pelos valores do seu projeto
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui

# Mantenha os outros valores
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Executar Migrações

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Fazer login no Supabase
supabase login

# Vincular ao projeto
supabase link --project-ref seu-projeto-id

# Executar migrações
npm run db:migrate
```

### 4. Configurar Autenticação

1. No painel do Supabase, vá em **Authentication > Settings**
2. Configure as URLs permitidas:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/auth/callback`
3. Ative os providers desejados:
   - **Email** (já ativado)
   - **Google** (opcional)
   - **Magic Link** (opcional)

### 5. Configurar Storage

1. Vá em **Storage** no painel do Supabase
2. Crie os buckets necessários:
   - `patient-photos`
   - `exercise-videos`
   - `exercise-thumbnails`
   - `patient-documents`
   - `clinical-reports`
   - `org-logos`
   - `data-exports`

3. Configure as políticas RLS para cada bucket

### 6. Executar Seed do Banco

```bash
# Popular o banco com dados iniciais
npm run db:seed
```

### 7. Testar a Configuração

```bash
# Iniciar o servidor de desenvolvimento
npm run dev

# Em outro terminal, executar testes
npm run test
```

## 🔧 Scripts Disponíveis

```bash
# Configurar Supabase
npm run setup:supabase

# Executar migrações
npm run db:migrate

# Resetar banco (cuidado!)
npm run db:reset

# Popular com dados iniciais
npm run db:seed

# Gerar tipos TypeScript
npm run db:generate-types

# Verificar variáveis de ambiente
npm run env:check
```

## 🛠️ Configurações Avançadas

### Row Level Security (RLS)

O projeto já inclui políticas RLS configuradas em:
- `supabase/migrations/20250914_005_rls_policies.sql`

### Funções do Banco

As funções necessárias estão em:
- `supabase/migrations/20250914_001_core_entities.sql`

### Triggers

Os triggers para auditoria estão configurados automaticamente.

## 🚨 Troubleshooting

### Erro de Conexão

```bash
# Verificar se as variáveis estão corretas
npm run env:check

# Testar conexão
npm run supabase:status
```

### Erro de Migração

```bash
# Resetar e executar novamente
npm run db:reset
npm run db:migrate
```

### Erro de Autenticação

1. Verificar URLs no painel do Supabase
2. Verificar se as chaves estão corretas
3. Verificar se o projeto está ativo

## 📚 Documentação Adicional

- [Supabase Docs](https://supabase.com/docs)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## ✅ Checklist de Configuração

- [ ] Projeto criado no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] Migrações executadas
- [ ] Autenticação configurada
- [ ] Storage configurado
- [ ] Seed executado
- [ ] Testes passando
- [ ] Aplicação funcionando

---

**DuduFisio** - Sistema de Gestão Fisioterapêutica 🏥
