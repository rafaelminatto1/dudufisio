#!/usr/bin/env node

/**
 * Script para testar as novas funcionalidades implementadas
 * - API de relatórios
 * - Página de detalhes de agendamento
 * - API de notas de agendamento
 * - Lista de espera
 * - Drag & drop de agendamentos
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando implementação das novas funcionalidades...\n');

// Lista de arquivos que devem existir
const requiredFiles = [
  // APIs
  'app/api/reports/route.ts',
  'app/api/reports/download/[id]/route.ts',
  'app/api/appointments/[id]/route.ts',
  'app/api/appointments/[id]/notes/route.ts',
  'app/api/appointments/waiting-list/route.ts',
  'app/api/appointments/waiting-list/[id]/route.ts',
  'app/api/practitioners/route.ts',
  
  // Páginas
  'app/appointments/[id]/page.tsx',
  
  // Componentes
  'components/appointments/WaitingListModal.tsx',
  'components/appointments/DragDropCalendar.tsx',
  
  // Migrações
  'supabase/migrations/20250115_007_reports_system.sql',
  'supabase/migrations/20250115_008_waiting_list.sql'
];

// Lista de funcionalidades para verificar
const features = [
  {
    name: 'API de Relatórios',
    files: [
      'app/api/reports/route.ts',
      'app/api/reports/download/[id]/route.ts'
    ],
    description: 'Endpoints para criar, listar e baixar relatórios'
  },
  {
    name: 'Detalhes de Agendamento',
    files: [
      'app/appointments/[id]/page.tsx',
      'app/api/appointments/[id]/route.ts',
      'app/api/appointments/[id]/notes/route.ts'
    ],
    description: 'Página e APIs para visualizar e editar agendamentos'
  },
  {
    name: 'Lista de Espera',
    files: [
      'components/appointments/WaitingListModal.tsx',
      'app/api/appointments/waiting-list/route.ts',
      'app/api/appointments/waiting-list/[id]/route.ts',
      'supabase/migrations/20250115_008_waiting_list.sql'
    ],
    description: 'Sistema de lista de espera para agendamentos'
  },
  {
    name: 'Drag & Drop de Agendamentos',
    files: [
      'components/appointments/DragDropCalendar.tsx'
    ],
    description: 'Interface drag & drop para mover agendamentos'
  },
  {
    name: 'API de Profissionais',
    files: [
      'app/api/practitioners/route.ts'
    ],
    description: 'Endpoint para listar profissionais'
  }
];

let allFilesExist = true;
let implementedFeatures = 0;

console.log('📁 Verificando arquivos...\n');

// Verificar se todos os arquivos existem
requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - ARQUIVO AUSENTE`);
    allFilesExist = false;
  }
});

console.log('\n🎯 Verificando funcionalidades...\n');

// Verificar funcionalidades
features.forEach(feature => {
  const allFeatureFilesExist = feature.files.every(file => {
    const filePath = path.join(process.cwd(), file);
    return fs.existsSync(filePath);
  });
  
  if (allFeatureFilesExist) {
    console.log(`✅ ${feature.name}`);
    console.log(`   ${feature.description}`);
    implementedFeatures++;
  } else {
    console.log(`❌ ${feature.name} - INCOMPLETA`);
    console.log(`   ${feature.description}`);
    const missingFiles = feature.files.filter(file => {
      const filePath = path.join(process.cwd(), file);
      return !fs.existsSync(filePath);
    });
    console.log(`   Arquivos ausentes: ${missingFiles.join(', ')}`);
  }
  console.log('');
});

// Resumo final
console.log('📊 RESUMO DA IMPLEMENTAÇÃO\n');
console.log(`Arquivos implementados: ${requiredFiles.filter(file => {
  const filePath = path.join(process.cwd(), file);
  return fs.existsSync(filePath);
}).length}/${requiredFiles.length}`);

console.log(`Funcionalidades implementadas: ${implementedFeatures}/${features.length}`);

if (allFilesExist && implementedFeatures === features.length) {
  console.log('\n🎉 TODAS AS FUNCIONALIDADES FORAM IMPLEMENTADAS COM SUCESSO!');
  console.log('\n📋 Funcionalidades disponíveis:');
  features.forEach(feature => {
    console.log(`   • ${feature.name}`);
  });
  
  console.log('\n🚀 Próximos passos:');
  console.log('   1. Aplicar as migrações do banco de dados');
  console.log('   2. Testar as APIs em ambiente de desenvolvimento');
  console.log('   3. Verificar a integração com o frontend');
  console.log('   4. Realizar testes de usuário');
  
  process.exit(0);
} else {
  console.log('\n⚠️  IMPLEMENTAÇÃO INCOMPLETA');
  console.log('Alguns arquivos ou funcionalidades ainda precisam ser implementados.');
  process.exit(1);
}
