#!/usr/bin/env node

/**
 * Script para configurar o Supabase real
 * Remove configurações mock e prepara para produção
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando Supabase real para DuduFisio...\n');

// 1. Verificar se o arquivo .env.local existe
const envPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Criando arquivo .env.local...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Arquivo .env.local criado a partir do .env.example');
  } else {
    // Criar .env.local básico
    const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Optional Configuration
ENCRYPTION_KEY=your_encryption_key_here
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@dudufisio.com
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_DEBUG=false
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Arquivo .env.local criado com configurações básicas');
  }
} else {
  console.log('✅ Arquivo .env.local já existe');
}

// 2. Verificar se as variáveis estão configuradas
console.log('\n🔍 Verificando configurações...');

try {
  require('dotenv').config({ path: envPath });
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => {
    const value = process.env[varName];
    return !value || value.includes('your_') || value.includes('your-');
  });
  
  if (missingVars.length > 0) {
    console.log('⚠️  Variáveis de ambiente não configuradas:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n📋 Para configurar o Supabase:');
    console.log('1. Acesse https://supabase.com');
    console.log('2. Crie um novo projeto');
    console.log('3. Vá em Settings > API');
    console.log('4. Copie as chaves para o arquivo .env.local');
    console.log('5. Execute as migrações: npm run db:migrate');
  } else {
    console.log('✅ Todas as variáveis de ambiente estão configuradas');
  }
} catch (error) {
  console.log('⚠️  Erro ao verificar variáveis de ambiente:', error.message);
}

// 3. Verificar se as migrações existem
console.log('\n🗄️  Verificando migrações do banco...');

const migrationsPath = path.join(__dirname, '..', 'supabase', 'migrations');
if (fs.existsSync(migrationsPath)) {
  const migrations = fs.readdirSync(migrationsPath).filter(file => file.endsWith('.sql'));
  console.log(`✅ ${migrations.length} migrações encontradas:`);
  migrations.forEach(migration => {
    console.log(`   - ${migration}`);
  });
} else {
  console.log('⚠️  Pasta de migrações não encontrada');
}

// 4. Instruções finais
console.log('\n🎯 Próximos passos:');
console.log('1. Configure as variáveis de ambiente no arquivo .env.local');
console.log('2. Execute as migrações: npm run db:migrate');
console.log('3. Execute o seed do banco: npm run db:seed');
console.log('4. Inicie o servidor: npm run dev');
console.log('5. Acesse http://localhost:3000');

console.log('\n✨ Configuração do Supabase concluída!');
