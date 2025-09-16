# 🏥 **DuduFisio**

**Sistema Completo de Gestão Fisioterapêutica**

Sistema moderno e intuitivo para clínicas de fisioterapia, desenvolvido com foco na experiência do usuário e conformidade com regulamentações brasileiras.

---

## 🚀 **Características Principais**

### **👥 Gestão de Pacientes**
- ✅ Cadastro completo com validação de CPF
- ✅ Histórico médico detalhado
- ✅ Fotos e documentos seguros
- ✅ Controle de consentimento LGPD

### **📊 Mapeamento de Dor Interativo**
- ✅ Interface visual do corpo humano
- ✅ Escala de dor 0-10
- ✅ Acompanhamento da evolução
- ✅ Relatórios de progresso

### **📅 Agendamento Inteligente**
- ✅ Calendário integrado
- ✅ Prevenção de conflitos
- ✅ Lembretes automáticos
- ✅ Múltiplas visualizações

### **💪 Prescrição de Exercícios**
- ✅ Biblioteca de exercícios
- ✅ Vídeos demonstrativos
- ✅ Planos personalizados
- ✅ Portal do paciente

### **🔐 Autenticação Múltipla**
- ✅ Login tradicional (email/senha)
- ✅ Google OAuth
- ✅ Magic Link (email sem senha)
- ✅ Gestão de papéis (Admin, Fisio, Estagiário, Paciente)

### **📧 Sistema de Convites**
- ✅ Convites por email
- ✅ Controle de permissões
- ✅ Templates personalizados
- ✅ Rastreamento de status

---

## 🛠️ **Stack Tecnológica**

### **Frontend**
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **Shadcn/UI** - Componentes acessíveis
- **Lucide React** - Ícones modernos

### **Backend**
- **Supabase** - Backend as a Service
- **PostgreSQL** - Banco de dados relacional
- **Row Level Security** - Segurança nativa
- **Real-time** - Atualizações em tempo real

### **Autenticação**
- **Supabase Auth** - Sistema de autenticação
- **Google OAuth** - Login social
- **Magic Links** - Acesso sem senha
- **RBAC** - Controle de acesso baseado em papéis

### **Hospedagem**
- **Vercel** - Deploy e hospedagem
- **Edge Functions** - Funções serverless
- **CDN Global** - Performance otimizada

---

## 🚀 **Como Executar**

### **Pré-requisitos**
```bash
Node.js 18+
npm ou yarn
Conta Supabase
Conta Vercel (opcional)
```

### **Instalação**
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/dudufisio.git
cd dudufisio

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Execute o projeto
npm run dev
```

### **Variáveis de Ambiente**
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📱 **Funcionalidades por Papel**

### **👑 Administrador**
- Gestão completa de usuários
- Configurações da clínica
- Relatórios financeiros
- Analytics e métricas
- Auditoria e logs

### **👩‍⚕️ Fisioterapeuta**
- Agenda pessoal
- Avaliação de pacientes
- Prescrição de exercícios
- Evolução clínica
- Relatórios de progresso

### **🎓 Estagiário**
- Acesso supervisionado
- Visualização de casos
- Aprendizado guiado
- Relatórios básicos

### **🙋‍♂️ Paciente**
- Portal pessoal
- Exercícios prescritos
- Agendamentos
- Evolução da dor
- Documentos

---

## 🔒 **Conformidade e Segurança**

### **LGPD (Lei Geral de Proteção de Dados)**
- ✅ Consentimento explícito
- ✅ Direito ao esquecimento
- ✅ Portabilidade de dados
- ✅ Logs de auditoria

### **CFM (Conselho Federal de Medicina)**
- ✅ Prontuário eletrônico
- ✅ Assinatura digital
- ✅ Backup seguro
- ✅ Rastreabilidade

### **Segurança Técnica**
- ✅ HTTPS obrigatório
- ✅ Criptografia de dados
- ✅ Autenticação multifator
- ✅ Rate limiting

---

## 📊 **Métricas e Analytics**

- **Pacientes ativos**: Acompanhamento em tempo real
- **Taxa de aderência**: Exercícios e consultas
- **Evolução da dor**: Métricas de melhoria
- **Performance**: Tempo de carregamento
- **Satisfação**: Feedback dos usuários

---

## 🤝 **Contribuindo**

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📝 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 **Suporte**

- **Email**: suporte@dudufisio.com
- **Documentação**: [docs.dudufisio.com](https://docs.dudufisio.com)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/dudufisio/issues)

---

## 🎯 **Roadmap**

- [ ] Sistema de pagamentos integrado
- [ ] App mobile (React Native)
- [ ] Telemedicina integrada
- [ ] AI para diagnósticos auxiliares
- [ ] Integração com equipamentos
- [ ] Relatórios governamentais automatizados

---

**DuduFisio** - Transformando o cuidado fisioterapêutico através da tecnologia 🚀