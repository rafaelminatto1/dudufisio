# 🚀 Plano de Deploy Completo - DuduFisio

## 📋 **Visão Geral**

Este documento detalha o plano completo para deploy do sistema DuduFisio na Vercel e configuração do banco de dados Supabase com autenticação Google.

## 🎯 **Objetivos**

1. ✅ **Deploy na Vercel** - Aplicação web funcionando
2. ✅ **Configuração Supabase** - Banco de dados e autenticação
3. ✅ **Autenticação Google** - Login social funcionando
4. ✅ **Variáveis de Ambiente** - Configuração segura
5. ✅ **Testes de Funcionamento** - Validação completa

---

## 🗄️ **1. Configuração do Supabase**

### **1.1 Criar Projeto Supabase**
- [ ] Acessar [supabase.com](https://supabase.com)
- [ ] Criar novo projeto: `dudufisio`
- [ ] Escolher região: São Paulo (Brasil)
- [ ] Anotar credenciais:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### **1.2 Aplicar Migrações**
```bash
# Executar migrações do banco
supabase db push
```

### **1.3 Configurar Autenticação Google**
- [ ] Acessar [Google Cloud Console](https://console.cloud.google.com)
- [ ] Criar projeto OAuth 2.0
- [ ] Configurar URLs de callback:
  - `https://[project-ref].supabase.co/auth/v1/callback`
- [ ] Obter credenciais:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
- [ ] Configurar no Supabase Dashboard

---

## 🌐 **2. Deploy na Vercel**

### **2.1 Configurar Projeto**
- [ ] Conectar repositório GitHub
- [ ] Configurar build settings:
  - Framework: Next.js
  - Root Directory: `app-fisioflow`
  - Build Command: `npm run build`
  - Output Directory: `.next`

### **2.2 Variáveis de Ambiente**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# App
NEXT_PUBLIC_APP_URL=https://dudufisio.vercel.app
NODE_ENV=production

# Google OAuth
GOOGLE_CLIENT_ID=[google-client-id]
GOOGLE_CLIENT_SECRET=[google-client-secret]

# Opcional
ENCRYPTION_KEY=[random-key]
RESEND_API_KEY=[resend-key]
EMAIL_FROM=noreply@dudufisio.com
```

---

## 🔐 **3. Configuração de Autenticação**

### **3.1 Google OAuth Setup**
1. **Google Cloud Console:**
   - Criar credenciais OAuth 2.0
   - Adicionar domínios autorizados
   - Configurar redirect URIs

2. **Supabase Dashboard:**
   - Habilitar Google provider
   - Adicionar credenciais
   - Configurar URLs de callback

### **3.2 Testes de Login**
- [ ] Testar login com Google
- [ ] Verificar criação de usuário
- [ ] Validar redirecionamentos
- [ ] Testar logout

---

## 🧪 **4. Testes de Funcionamento**

### **4.1 Testes Básicos**
- [ ] Acesso à aplicação
- [ ] Carregamento das páginas
- [ ] Responsividade mobile
- [ ] Performance

### **4.2 Testes de Autenticação**
- [ ] Login com Google
- [ ] Criação de conta
- [ ] Logout
- [ ] Proteção de rotas

### **4.3 Testes de Banco de Dados**
- [ ] Conexão com Supabase
- [ ] Criação de registros
- [ ] Consultas
- [ ] RLS (Row Level Security)

---

## 📊 **5. Monitoramento**

### **5.1 Vercel Analytics**
- [ ] Configurar Vercel Analytics
- [ ] Monitorar performance
- [ ] Acompanhar erros

### **5.2 Supabase Monitoring**
- [ ] Dashboard de uso
- [ ] Logs de autenticação
- [ ] Métricas de banco

---

## 🔧 **6. Scripts de Deploy**

### **6.1 Deploy Automático**
```bash
# Deploy na Vercel
vercel --prod

# Aplicar migrações
supabase db push

# Verificar status
vercel ls
supabase status
```

### **6.2 Rollback (se necessário)**
```bash
# Rollback Vercel
vercel rollback [deployment-id]

# Rollback Supabase
supabase db reset
```

---

## 📝 **7. Checklist Final**

### **7.1 Pré-Deploy**
- [ ] Código testado localmente
- [ ] Migrações aplicadas
- [ ] Variáveis de ambiente configuradas
- [ ] Autenticação Google funcionando

### **7.2 Pós-Deploy**
- [ ] Aplicação acessível
- [ ] Login funcionando
- [ ] Banco de dados conectado
- [ ] Performance adequada
- [ ] Mobile responsivo

### **7.3 Documentação**
- [ ] README atualizado
- [ ] Instruções de deploy
- [ ] Troubleshooting guide
- [ ] Links de acesso

---

## 🚨 **8. Troubleshooting**

### **8.1 Problemas Comuns**
- **Erro de build:** Verificar TypeScript
- **Erro de auth:** Verificar credenciais Google
- **Erro de DB:** Verificar migrações
- **Erro de CORS:** Verificar URLs de callback

### **8.2 Logs Importantes**
- Vercel: `vercel logs [deployment-id]`
- Supabase: Dashboard > Logs
- Browser: Console do navegador

---

## 📞 **9. Suporte**

- **Vercel:** [vercel.com/support](https://vercel.com/support)
- **Supabase:** [supabase.com/support](https://supabase.com/support)
- **Google Cloud:** [cloud.google.com/support](https://cloud.google.com/support)

---

**Última atualização:** $(date)
**Status:** 🚧 Em desenvolvimento
