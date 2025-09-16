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

---

## 🚀 **Como Executar**

### **Pré-requisitos**
```bash
Node.js 18+
npm ou yarn
Conta Supabase
```

### **Instalação**
```bash
# Clone o repositório
git clone https://github.com/rafaelminatto1/dudufisio.git
cd dudufisio

# Instale as dependências
npm install

# Configure o Supabase
npm run setup:supabase

# Configure as variáveis de ambiente no arquivo .env.local
# Siga as instruções em SUPABASE_SETUP.md

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

### **👩‍⚕️ Fisioterapeuta**
- Agenda pessoal
- Avaliação de pacientes
- Prescrição de exercícios
- Evolução clínica

### **🎓 Estagiário**
- Acesso supervisionado
- Visualização de casos
- Aprendizado guiado

### **🙋‍♂️ Paciente**
- Portal pessoal
- Exercícios prescritos
- Agendamentos
- Evolução da dor

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

---

## 📞 **Suporte**

- **Email**: suporte@dudufisio.com
- **Issues**: [GitHub Issues](https://github.com/rafaelminatto1/dudufisio/issues)

---

**DuduFisio** - Transformando o cuidado fisioterapêutico através da tecnologia 🚀
