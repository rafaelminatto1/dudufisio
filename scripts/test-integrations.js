#!/usr/bin/env node

/**
 * Script para testar integrações externas
 * Execute: node scripts/test-integrations.js
 */

require('dotenv').config();

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

console.log('🧪 Testando integrações externas...\n');

// Testar Supabase
async function testSupabase() {
  console.log('📊 Testando conexão com Supabase...');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Testar conexão fazendo uma query simples
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Supabase: Conexão estabelecida com sucesso');
    return true;
  } catch (error) {
    console.log('❌ Supabase: Erro na conexão -', error.message);
    return false;
  }
}

// Testar WhatsApp Business API
async function testWhatsApp() {
  console.log('📱 Testando WhatsApp Business API...');
  
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    if (!accessToken || !phoneNumberId) {
      throw new Error('Variáveis de ambiente do WhatsApp não configuradas');
    }
    
    // Testar conectividade com a API
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ WhatsApp: API conectada com sucesso');
    console.log(`   Número: ${data.display_phone_number}`);
    return true;
  } catch (error) {
    console.log('❌ WhatsApp: Erro na conexão -', error.message);
    return false;
  }
}

// Testar VAPID Keys
function testVAPID() {
  console.log('🔑 Testando VAPID keys...');
  
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    
    if (!publicKey || !privateKey) {
      throw new Error('VAPID keys não configuradas');
    }
    
    // Validar formato das chaves
    if (!publicKey.startsWith('B') || publicKey.length !== 87) {
      throw new Error('Formato inválido da chave pública VAPID');
    }
    
    if (!privateKey.startsWith('B') || privateKey.length !== 43) {
      throw new Error('Formato inválido da chave privada VAPID');
    }
    
    console.log('✅ VAPID: Keys configuradas corretamente');
    return true;
  } catch (error) {
    console.log('❌ VAPID: Erro na configuração -', error.message);
    return false;
  }
}

// Testar variáveis de ambiente essenciais
function testEnvironmentVariables() {
  console.log('🔧 Testando variáveis de ambiente...');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Ambiente: Variáveis faltando -', missingVars.join(', '));
    return false;
  }
  
  console.log('✅ Ambiente: Todas as variáveis essenciais configuradas');
  return true;
}

// Executar todos os testes
async function runTests() {
  const results = {
    environment: testEnvironmentVariables(),
    supabase: await testSupabase(),
    whatsapp: await testWhatsApp(),
    vapid: testVAPID()
  };
  
  console.log('\n📋 Resumo dos Testes:');
  console.log('='.repeat(40));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    const testName = test.charAt(0).toUpperCase() + test.slice(1);
    console.log(`${status} ${testName}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 Todos os testes passaram! O FisioFlow está pronto para uso.');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique a configuração.');
    console.log('\n💡 Consulte o arquivo docs/ENVIRONMENT_SETUP.md para mais detalhes.');
  }
  
  return allPassed;
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runTests, testSupabase, testWhatsApp, testVAPID, testEnvironmentVariables };
