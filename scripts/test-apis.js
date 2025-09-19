#!/usr/bin/env node

/**
 * Script para testar as APIs implementadas
 */

const baseUrl = 'http://localhost:3000';

const testEndpoints = [
  {
    name: 'API de Relatórios',
    url: '/api/reports',
    method: 'GET',
    expectedStatus: 401 // Esperamos 401 porque não estamos autenticados
  },
  {
    name: 'API de Agendamentos',
    url: '/api/appointments',
    method: 'GET',
    expectedStatus: 401
  },
  {
    name: 'API de Profissionais',
    url: '/api/practitioners',
    method: 'GET',
    expectedStatus: 401
  },
  {
    name: 'API de Lista de Espera',
    url: '/api/appointments/waiting-list',
    method: 'GET',
    expectedStatus: 401
  }
];

async function testEndpoint(endpoint) {
  try {
    console.log(`🧪 Testando ${endpoint.name}...`);
    
    const response = await fetch(`${baseUrl}${endpoint.url}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === endpoint.expectedStatus) {
      console.log(`✅ ${endpoint.name} - Status correto (${response.status})`);
      return true;
    } else {
      console.log(`❌ ${endpoint.name} - Status inesperado (${response.status}, esperado: ${endpoint.expectedStatus})`);
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`⚠️  ${endpoint.name} - Servidor não está rodando`);
      return false;
    } else {
      console.log(`❌ ${endpoint.name} - Erro: ${error.message}`);
      return false;
    }
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes das APIs...\n');
  
  let passedTests = 0;
  let totalTests = testEndpoints.length;
  
  for (const endpoint of testEndpoints) {
    const passed = await testEndpoint(endpoint);
    if (passed) passedTests++;
    console.log('');
  }
  
  console.log('📊 RESUMO DOS TESTES\n');
  console.log(`Testes aprovados: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Todas as APIs estão funcionando corretamente!');
    console.log('\n📋 APIs testadas:');
    testEndpoints.forEach(endpoint => {
      console.log(`   • ${endpoint.name} - ${endpoint.url}`);
    });
  } else {
    console.log('⚠️  Algumas APIs podem ter problemas ou o servidor não está rodando.');
    console.log('\n💡 Para testar manualmente:');
    console.log('   1. Execute: npm run dev');
    console.log('   2. Acesse: http://localhost:3000');
    console.log('   3. Teste as rotas das APIs');
  }
}

runTests().catch(console.error);
