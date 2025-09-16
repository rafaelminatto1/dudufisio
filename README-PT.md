# 🏥 FisioFlow - Sistema de Gestão para Fisioterapia

Sistema completo de gestão para clínicas de fisioterapia desenvolvido em **Next.js 14** com foco no mercado brasileiro.

## ✨ Funcionalidades Principais (MVP)

- 🔐 **Autenticação Segura** - Login com controle baseado em funções
- 👥 **Gestão de Pacientes** - CRUD completo com validação de CPF brasileiro
- 📅 **Agendamento** - Sistema de agendamento com prevenção de conflitos
- 🎯 **Mapa Corporal Interativo** - Marcação de pontos de dor com escala 0-10
- 📊 **Dashboard** - Visão geral baseada na função do usuário
- 📱 **Mobile-First** - Design responsivo para dispositivos móveis

## 🚀 Tecnologias

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Formulários**: React Hook Form + Zod
- **Testes**: Jest, React Testing Library, Playwright
- **Code Quality**: ESLint, Prettier

## 📋 Pré-requisitos

- Node.js 18.17.0 ou superior
- npm 9.0.0 ou superior
- Conta no Supabase (para desenvolvimento)

## ⚡ Início Rápido

### 1. Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/fisioflow.git
cd fisioflow/app-fisioflow

# Instale as dependências
npm install
```

### 2. Configuração do Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite o arquivo .env.local com suas configurações do Supabase
```

### 3. Validação do Ambiente

```bash
# Verifique se todas as variáveis estão configuradas
npm run env:check
```

### 4. Inicie o Servidor de Desenvolvimento

```bash
# Inicie o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🧪 Testes

```bash
# Todos os testes
npm test

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes de contrato (API)
npm run test:contract

# Testes E2E
npm run test:e2e

# Testes com watch mode
npm run test:watch
```

## 📝 Scripts Disponíveis

### Desenvolvimento
- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Inicia servidor de produção

### Qualidade de Código
- `npm run lint` - Executa ESLint
- `npm run lint:fix` - Corrige problemas do ESLint
- `npm run format` - Formata código com Prettier
- `npm run type-check` - Verifica tipos TypeScript
- `npm run validate` - Executa todas as validações

### Banco de Dados (Supabase)
- `npm run supabase:start` - Inicia Supabase local
- `npm run supabase:stop` - Para Supabase local
- `npm run db:migrate` - Executa migrações
- `npm run db:seed` - Popula banco com dados de teste

## 🏗️ Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/login/       # Páginas de autenticação
│   ├── dashboard/          # Dashboards por função
│   ├── patients/           # Gestão de pacientes
│   ├── appointments/       # Agendamentos
│   └── api/               # API routes
├── components/            # Componentes React
│   ├── ui/               # shadcn/ui components
│   ├── patients/         # Componentes de pacientes
│   ├── calendar/         # Componentes de calendário
│   └── forms/           # Componentes de formulários
└── lib/                  # Utilitários
    ├── validators/       # Schemas Zod
    └── utils.ts         # Funções utilitárias
```

## 👥 Perfis de Usuário

### 👑 Administrador
- Acesso completo ao sistema
- Gestão de usuários e configurações
- Relatórios administrativos

### 🏥 Fisioterapeuta
- Gestão de pacientes atribuídos
- Documentação de sessões
- Prescrição de exercícios
- Relatórios clínicos

### 📚 Estagiário
- Acesso limitado supervisionado
- Visualização de pacientes
- Documentação básica

### 👤 Paciente
- Acesso aos próprios dados
- Visualização de exercícios prescritos
- Feedback de exercícios

## 🇧🇷 Localizações Brasileiras

- **Validação de CPF** - Formatação e validação de CPF brasileiro
- **Telefones** - Formato brasileiro (+55 XX XXXXX-XXXX)
- **Datas** - Formato DD/MM/YYYY
- **LGPD** - Conformidade com a Lei Geral de Proteção de Dados
- **CFM** - Conformidade com regulamentações do Conselho Federal de Medicina

## 📊 Métricas de Performance

- **Lighthouse Score**: > 90
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Cumulative Layout Shift**: < 0.1

## 🔒 Segurança e Compliance

- **LGPD** - Totalmente compatível com a Lei Geral de Proteção de Dados
- **CFM** - Segue regulamentações do Conselho Federal de Medicina
- **Criptografia** - Dados sensíveis criptografados
- **Auditoria** - Logs completos de acesso e modificações
- **Multi-tenancy** - Isolamento completo entre organizações

## 🚧 Status do Projeto

### ✅ Concluído (Fase Setup - T001-T009)
- [x] Configuração inicial Next.js + TypeScript
- [x] Integração Supabase
- [x] Configuração shadcn/ui
- [x] Sistema de testes (Jest + Playwright)
- [x] Estrutura de pastas
- [x] Scripts de desenvolvimento

### 🔄 Em Desenvolvimento
- [ ] Schema do banco de dados (T010-T018)
- [ ] Testes TDD (T019-T033)
- [ ] Implementação core (T034-T065)

### 📋 Próximas Fases
- Implementação MVP completo
- Sistema de relatórios
- Integração com pagamentos
- Otimizações de performance

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- 📧 Email: suporte@fisioflow.com
- 📱 WhatsApp: +55 (XX) XXXXX-XXXX
- 💬 Discord: [FisioFlow Community](https://discord.gg/fisioflow)

---

**FisioFlow** - Transformando a gestão de clínicas de fisioterapia no Brasil 🇧🇷