# 🔧 Configuração de Ambiente - FisioFlow

Este documento descreve como configurar todas as integrações externas necessárias para o funcionamento completo do FisioFlow.

## 📋 Variáveis de Ambiente Necessárias

### 1. Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. WhatsApp Business API
```bash
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
```

### 3. VAPID Keys para Push Notifications
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### 4. Email Configuration (opcional)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### 5. Monitoring (opcional)
```bash
SENTRY_DSN=your_sentry_dsn
LOGROCKET_APP_ID=your_logrocket_app_id
```

### 6. Environment
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 7. LGPD Compliance
```bash
LGPD_RETENTION_DAYS=2555  # 7 anos para dados de saúde
LGPD_AUDIT_RETENTION_DAYS=2555
```

### 8. Security
```bash
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## 🚀 Passo a Passo para Configuração

### 1. Configurar WhatsApp Business API

1. **Criar conta no Facebook Business Manager**
   - Acesse: https://business.facebook.com/
   - Crie uma conta business

2. **Configurar WhatsApp Business**
   - Vá para WhatsApp Business API
   - Adicione um número de telefone
   - Configure templates de mensagem

3. **Obter credenciais**
   - Access Token
   - Phone Number ID
   - Webhook Verify Token

4. **Templates necessários** (criar no Facebook Business Manager):
   ```
   - fisioflow_appointment_reminder
   - fisioflow_appointment_confirmation
   - fisioflow_exercise_reminder
   - fisioflow_payment_reminder
   ```

### 2. Configurar VAPID Keys

1. **Instalar web-push**:
   ```bash
   npm install web-push
   ```

2. **Gerar VAPID keys**:
   ```bash
   npx web-push generate-vapid-keys
   ```

3. **Configurar no ambiente**:
   - Copiar a chave pública para `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - Copiar a chave privada para `VAPID_PRIVATE_KEY`

### 3. Configurar Supabase

1. **Criar projeto no Supabase**
2. **Executar migrações**:
   ```bash
   npx supabase db push
   ```
3. **Configurar RLS policies**
4. **Configurar Storage buckets**

### 4. Configurar Monitoramento (Opcional)

#### Sentry
1. Criar conta em https://sentry.io/
2. Adicionar projeto Next.js
3. Copiar DSN para `SENTRY_DSN`

#### LogRocket
1. Criar conta em https://logrocket.com/
2. Adicionar projeto
3. Copiar App ID para `LOGROCKET_APP_ID`

## 🔐 Segurança

- **Nunca commite** arquivos `.env` no repositório
- Use **diferentes credenciais** para desenvolvimento e produção
- Configure **webhooks** com tokens seguros
- Use **HTTPS** em produção

## ✅ Checklist de Configuração

- [ ] Supabase configurado e migrações executadas
- [ ] WhatsApp Business API configurado com templates
- [ ] VAPID keys geradas e configuradas
- [ ] Variáveis de ambiente definidas
- [ ] Testes de integração executados
- [ ] Monitoramento configurado (se aplicável)

## 🧪 Testando as Integrações

### Testar WhatsApp
```bash
curl -X POST "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "5511999999999",
    "type": "template",
    "template": {
      "name": "fisioflow_appointment_reminder",
      "language": {
        "code": "pt_BR"
      },
      "components": [
        {
          "type": "body",
          "parameters": [
            {
              "type": "text",
              "text": "João Silva"
            },
            {
              "type": "text",
              "text": "15/01/2025 às 14:00"
            }
          ]
        }
      ]
    }
  }'
```

### Testar Push Notifications
1. Acesse a aplicação
2. Permita notificações no navegador
3. Use a função de teste no dashboard

## 📞 Suporte

Para dúvidas sobre configuração, consulte:
- [Documentação WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação VAPID](https://web.dev/push-notifications-overview/)
