# Configuração de Deploy na Vercel

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente no painel da Vercel:

### Supabase (Produção)
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
```

### App Configuration
```
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
NODE_ENV=production
```

### Opcionais
```
ENCRYPTION_KEY=sua_chave_criptografia
RESEND_API_KEY=sua_chave_resend
EMAIL_FROM=noreply@seudominio.com
SENTRY_DSN=sua_dsn_sentry
NEXT_PUBLIC_DEBUG=false
```

## Passos para Deploy

1. **Conectar repositório GitHub na Vercel**
2. **Configurar variáveis de ambiente** no painel da Vercel
3. **Configurar Supabase** para produção
4. **Atualizar URLs de callback** no Supabase:
   - Site URL: `https://seu-app.vercel.app`
   - Redirect URLs: `https://seu-app.vercel.app/auth/callback`

## Problemas Comuns

### Erro de localhost
- Verificar se `NEXT_PUBLIC_APP_URL` está configurado corretamente
- Verificar URLs de callback no Supabase

### Erro de cookies
- Verificar se as funções de cookies estão usando `await`
- Verificar configurações de CORS no Supabase

### Erro 404 em recursos estáticos
- Verificar se o build está funcionando localmente
- Verificar configurações do Next.js
