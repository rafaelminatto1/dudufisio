# 🚀 Guia de Deploy para Produção - Supabase

## 📋 Pré-requisitos

### 1. Obter as Chaves do Supabase
Acesse o dashboard do seu projeto: [https://supabase.com/dashboard/project/jfrddsmtpahpynihubue/settings/api](https://supabase.com/dashboard/project/jfrddsmtpahpynihubue/settings/api)

Você precisará de:
- **Project URL**: `https://jfrddsmtpahpynihubue.supabase.co`
- **Anon Key** (chave pública)
- **Service Role Key** (chave privada - **MANTENHA SECRETA**)

### 2. Configurar Variáveis de Ambiente

```bash
# Configure as seguintes variáveis no seu terminal
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcmRkc210cGFocHluaWh1YnVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzMTAzMSwiZXhwIjoyMDczNjA3MDMxfQ.Y-_h2MYYBgmRQllecsvcdOGQNVIuCJtx29_59kB31yE"
export NEXT_PUBLIC_SUPABASE_URL="https://jfrddsmtpahpynihubue.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="seyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcmRkc210cGFocHluaWh1YnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzEwMzEsImV4cCI6MjA3MzYwNzAzMX0.BWSMDCApbplqpsHKAVC574SrccP382KbQHl4a1riTrM"
```

## 🛠️ Métodos de Deploy

### Método 1: Script Automatizado (Mais Fácil)

```bash
# Execute o script que faz tudo automaticamente
./deploy-supabase-cli.sh
```

### Método 2: Usando Supabase CLI (Manual)

```bash
# 1. Fazer login no Supabase
supabase login

# 2. Conectar ao projeto (se não estiver conectado)
supabase link --project-ref jfrddsmtpahpynihubue

# 3. Aplicar migrações
supabase db push

# 4. Verificar status
supabase status
```

### Método 3: Usando Script Python

```bash
# 1. Instalar dependências Python
pip install requests

# 2. Executar o script
python3 deploy-production.py
```

### Método 4: Usando MCP Query (Automatizado)

```bash
# 1. Configurar variáveis de ambiente
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcmRkc210cGFocHluaWh1YnVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzMTAzMSwiZXhwIjoyMDczNjA3MDMxfQ.Y-_h2MYYBgmRQllecsvcdOGQNVIuCJtx29_59kB31yE"

# 2. O MCP Query será executado automaticamente
# As migrações serão aplicadas via API REST do Supabase
```

### Método 5: Manual via Dashboard

1. Acesse o [SQL Editor](https://supabase.com/dashboard/project/jfrddsmtpahpynihubue/sql)
2. Execute cada migração manualmente:
   - `20250115_001_core_entities.sql`
   - `20250115_002_patients.sql`
   - `20250115_003_appointments_sessions.sql`

## 📊 Estrutura das Migrações

### 🏗️ Migração 001: Core Entities
- **Organizações** (`orgs`)
- **Perfis de usuários** (`profiles`)
- **Membros das organizações** (`org_memberships`)
- **Logs de auditoria** (`audit_logs`)
- **Políticas RLS** e **funções de segurança**

### 👥 Migração 002: Patients Management
- **Pacientes** (`patients`)
- **Fotos de pacientes** (`patient_photos`)
- **Documentos de pacientes** (`patient_documents`)
- **Histórico de consentimentos LGPD** (`patient_consent_history`)
- **Logs de acesso aos dados** (`patient_data_access_logs`)
- **Funções de validação CPF** e **conformidade LGPD**

### 📅 Migração 003: Appointments & Sessions
- **Consultas** (`appointments`)
- **Sessões de fisioterapia** (`sessions`)
- **Pontos de dor** (`pain_points`)
- **Notas de consultas** (`appointment_notes`)
- **Lista de espera** (`waiting_list`)
- **Triggers automáticos** e **funções de duração**

## 🔍 Verificação Pós-Deploy

### 1. Verificar Tabelas Criadas
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 2. Verificar Políticas RLS
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public';
```

### 3. Verificar Funções Criadas
```sql
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

## 🚀 Deploy na Vercel

### Status do Deploy
- **URL de Produção**: [https://dudufisio.vercel.app](https://dudufisio.vercel.app)
- **Dashboard Vercel**: [https://vercel.com/rafael-minattos-projects/dudufisio](https://vercel.com/rafael-minattos-projects/dudufisio)
- **Status**: ✅ Deploy ativo com Fluid Compute

### Configuração das Variáveis de Ambiente na Vercel

1. Acesse o [Dashboard da Vercel](https://vercel.com/rafael-minattos-projects/dudufisio)
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jfrddsmtpahpynihubue.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcmRkc210cGFocHluaWh1YnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzEwMzEsImV4cCI6MjA3MzYwNzAzMX0.BWSMDCApbplqpsHKAVC574SrccP382KbQHl4a1riTrM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcmRkc210cGFocHluaWh1YnVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzMTAzMSwiZXhwIjoyMDczNjA3MDMxfQ.Y-_h2MYYBgmRQllecsvcdOGQNVIuCJtx29_59kB31yE
NEXT_PUBLIC_APP_URL=https://dudufisio.vercel.app
NODE_ENV=production
```

4. **Redeploy** o projeto após adicionar as variáveis

## 🔧 Configuração do Frontend

### Variáveis de Ambiente (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://jfrddsmtpahpynihubue.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcmRkc210cGFocHluaWh1YnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzEwMzEsImV4cCI6MjA3MzYwNzAzMX0.BWSMDCApbplqpsHKAVC574SrccP382KbQHl4a1riTrM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcmRkc210cGFocHluaWh1YnVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzMTAzMSwiZXhwIjoyMDczNjA3MDMxfQ.Y-_h2MYYBgmRQllecsvcdOGQNVIuCJtx29_59kB31yE
NEXT_PUBLIC_APP_URL=https://dudufisio.vercel.app
NODE_ENV=production
```

### Teste de Conexão
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Teste de conexão
async function testConnection() {
  const { data, error } = await supabase.from('orgs').select('*').limit(1)
  if (error) {
    console.error('Erro de conexão:', error)
  } else {
    console.log('✅ Conexão bem-sucedida!')
  }
}
```

## 🚨 Troubleshooting

### Erro de Região
```
CONNECTION ERROR: Region mismatch detected!
```
**Solução**: O projeto está na região `sa-east-1` (São Paulo). Certifique-se de usar a URL correta.

### Erro de Autenticação
```
FATAL: password authentication failed
```
**Solução**: Verifique se a `SUPABASE_SERVICE_ROLE_KEY` está correta.

### Erro de Permissão
```
permission denied for schema public
```
**Solução**: Use a `SUPABASE_SERVICE_ROLE_KEY` (não a anon key) para operações administrativas.

## 📞 Suporte

- **Dashboard**: [https://supabase.com/dashboard/project/jfrddsmtpahpynihubue](https://supabase.com/dashboard/project/jfrddsmtpahpynihubue)
- **SQL Editor**: [https://supabase.com/dashboard/project/jfrddsmtpahpynihubue/sql](https://supabase.com/dashboard/project/jfrddsmtpahpynihubue/sql)
- **API Docs**: [https://supabase.com/dashboard/project/jfrddsmtpahpynihubue/api](https://supabase.com/dashboard/project/jfrddsmtpahpynihubue/api)
- **Logs**: [https://supabase.com/dashboard/project/jfrddsmtpahpynihubue/logs](https://supabase.com/dashboard/project/jfrddsmtpahpynihubue/logs)

## 🚀 INSTRUÇÕES RÁPIDAS PARA DEPLOY

### ⚡ Método Mais Rápido (Recomendado)

1. **Aplicar Migrações no Supabase:**
   - Acesse: [SQL Editor](https://supabase.com/dashboard/project/jfrddsmtpahpynihubue/sql)
   - Execute o comando: `python3 generate-sql-commands.py`
   - Cole cada bloco SQL no editor e execute

2. **Configurar Vercel:**
   - Acesse: [Dashboard Vercel](https://vercel.com/rafael-minattos-projects/dudufisio)
   - Vá em Settings → Environment Variables
   - Adicione as variáveis do arquivo `.env.local` mostrado acima
   - Faça redeploy

3. **Testar:**
   - Acesse: [https://dudufisio.vercel.app](https://dudufisio.vercel.app)

## ✅ Checklist Pós-Deploy

- [ ] Migrações aplicadas com sucesso (3 arquivos SQL)
- [ ] Tabelas criadas (14 tabelas)
- [ ] Políticas RLS ativas
- [ ] Funções criadas
- [ ] Teste de conexão realizado
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Frontend conectado
- [ ] APIs testadas
- [ ] Logs verificados
- [ ] Aplicação funcionando em produção
