# Correções para Deploy na Vercel - FisioFlow

## Status: ✅ Build Funcionando

## Problemas Identificados e Resolvidos

### 1. Configuração da Vercel (`vercel.json`)
- **Problema**: Configuração inadequada para Next.js 15
- **Solução**: Atualizada configuração com:
  - Framework correto (`nextjs`)
  - Região Brasil (`gru1`)
  - Headers de segurança
  - Configurações de build apropriadas

### 2. Referências a localhost hardcoded
- **Problema**: URLs com localhost fixo no código
- **Solução**: Atualizado para usar variáveis de ambiente:
  - `src/lib/seo/metadata.ts`: Usa `NEXT_PUBLIC_APP_URL` ou `NEXT_PUBLIC_DOMAIN`
  - `middleware.ts`: Condicionalmente inclui localhost apenas em desenvolvimento

### 3. Edge Runtime Compatibility
- **Problema**: Middleware incompatível com Edge Runtime
- **Solução**: Criado `lib/auth/session-manager-edge.ts` com versão compatível

### 4. Tabelas ausentes no Supabase
- **Problema**: Várias tabelas referenciadas não existem ainda:
  - `data_deletion_requests`
  - `data_export_requests`
  - `patient_consent_history`
- **Solução**: APIs temporariamente desabilitadas com mensagens apropriadas

### 5. Erros de TypeScript
- **Problema**: Vários erros de tipo e parâmetros não utilizados
- **Solução**: 
  - Prefixado parâmetros não utilizados com `_`
  - Adicionado type assertions onde necessário
  - Comentado código que depende de tabelas ausentes

## Variáveis de Ambiente Necessárias na Vercel

```env
# Supabase (Obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui

# App Configuration (Obrigatório)
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
NODE_ENV=production

# Opcional mas Recomendado
ENCRYPTION_KEY=sua_chave_32_caracteres
RESEND_API_KEY=sua_chave_resend
EMAIL_FROM=noreply@seudominio.com
NEXT_PUBLIC_DOMAIN=seu-app.vercel.app
```

## Próximos Passos

1. **Configurar Variáveis de Ambiente na Vercel**:
   - Acessar o painel da Vercel
   - Ir em Settings > Environment Variables
   - Adicionar todas as variáveis necessárias

2. **Configurar Supabase**:
   - Atualizar URLs de callback no Supabase
   - Site URL: `https://seu-app.vercel.app`
   - Redirect URLs: `https://seu-app.vercel.app/auth/callback`

3. **Criar Tabelas Ausentes** (quando necessário):
   - `data_deletion_requests` - Para LGPD deletion requests
   - `data_export_requests` - Para LGPD data export
   - `patient_consent_history` - Para histórico de consentimento

4. **Deploy**:
   ```bash
   git add .
   git commit -m "fix: corrigir erros de build para deploy na Vercel"
   git push
   ```

## Funcionalidades Temporariamente Desabilitadas

As seguintes funcionalidades estão temporariamente desabilitadas até que as tabelas correspondentes sejam criadas:

1. **LGPD Data Deletion** (`/api/lgpd/deletion`)
2. **LGPD Data Export** (`/api/lgpd/export`)
3. **Patient Consent History** (log de mudanças de consentimento)
4. **Patient Data Access Logging** (RPC `log_patient_data_access`)

## Arquivo de Exemplo de Variáveis

Criado `.env.example` com todas as variáveis necessárias para referência.

## Build Status

```
✅ Build funcionando localmente
✅ TypeScript compilando sem erros
✅ ESLint passando (com warnings aceitáveis)
✅ Pronto para deploy na Vercel
```

## Comandos Úteis

```bash
# Testar build local
npm run build

# Testar produção local
npm run build && npm run start

# Deploy para Vercel (staging)
vercel

# Deploy para Vercel (produção)
vercel --prod
```