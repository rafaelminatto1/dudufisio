#!/usr/bin/env node

/**
 * Script para testar a aplicação FisioFlow
 * Verifica se todas as funcionalidades estão funcionando
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing FisioFlow Application...\n');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.blue}${msg}${colors.reset}`),
};

// Testes a serem executados
const tests = [
  {
    name: 'TypeScript Compilation',
    command: 'npm run type-check',
    critical: true,
  },
  {
    name: 'ESLint Check',
    command: 'npm run lint',
    critical: false,
  },
  {
    name: 'Prettier Check',
    command: 'npm run format:check',
    critical: false,
  },
  {
    name: 'Unit Tests',
    command: 'npm run test:unit',
    critical: true,
  },
  {
    name: 'Integration Tests',
    command: 'npm run test:integration',
    critical: true,
  },
  {
    name: 'Contract Tests',
    command: 'npm run test:contract',
    critical: false,
  },
  {
    name: 'Security Audit',
    command: 'npm run security:audit',
    critical: false,
  },
  {
    name: 'Build Test',
    command: 'npm run build',
    critical: true,
  },
];

// Verificações de arquivos
const fileChecks = [
  {
    name: 'Environment Example',
    path: '.env.example',
    critical: true,
  },
  {
    name: 'TypeScript Config',
    path: 'tsconfig.json',
    critical: true,
  },
  {
    name: 'Next.js Config',
    path: 'next.config.ts',
    critical: true,
  },
  {
    name: 'Package.json',
    path: 'package.json',
    critical: true,
  },
  {
    name: 'Logger System',
    path: 'lib/logger/index.ts',
    critical: true,
  },
  {
    name: 'CI/CD Pipeline',
    path: '.github/workflows/ci.yml',
    critical: true,
  },
  {
    name: 'Sentry Config',
    path: 'sentry.client.config.ts',
    critical: false,
  },
  {
    name: 'API Cache',
    path: 'src/lib/cache/api-cache.ts',
    critical: false,
  },
];

// Função para executar comando
function runCommand(command, name, critical = false) {
  try {
    log.info(`Running: ${name}...`);
    execSync(command, { stdio: 'pipe' });
    log.success(`${name} passed`);
    return { success: true, error: null };
  } catch (error) {
    const errorMsg = error.message || error.toString();
    if (critical) {
      log.error(`${name} failed: ${errorMsg}`);
    } else {
      log.warning(`${name} failed: ${errorMsg}`);
    }
    return { success: false, error: errorMsg };
  }
}

// Função para verificar arquivo
function checkFile(filePath, name, critical = false) {
  if (fs.existsSync(filePath)) {
    log.success(`${name} exists`);
    return { success: true, error: null };
  } else {
    const errorMsg = `File not found: ${filePath}`;
    if (critical) {
      log.error(`${name} missing: ${errorMsg}`);
    } else {
      log.warning(`${name} missing: ${errorMsg}`);
    }
    return { success: false, error: errorMsg };
  }
}

// Função para verificar dependências
function checkDependencies() {
  log.header('\n📦 Checking Dependencies...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    '@sentry/nextjs',
    'zod',
    'react-hook-form',
    '@hookform/resolvers',
  ];
  
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
  );
  
  if (missingDeps.length === 0) {
    log.success('All required dependencies are installed');
    return { success: true, error: null };
  } else {
    log.error(`Missing dependencies: ${missingDeps.join(', ')}`);
    return { success: false, error: `Missing dependencies: ${missingDeps.join(', ')}` };
  }
}

// Função para verificar configuração
function checkConfiguration() {
  log.header('\n⚙️  Checking Configuration...');
  
  const checks = [];
  
  // Verificar tsconfig.json
  try {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    if (tsconfig.compilerOptions.strict) {
      log.success('TypeScript strict mode enabled');
    } else {
      log.warning('TypeScript strict mode disabled');
    }
  } catch (error) {
    log.error('Failed to read tsconfig.json');
    checks.push({ success: false, error: 'Failed to read tsconfig.json' });
  }
  
  // Verificar next.config.ts
  try {
    const nextConfig = fs.readFileSync('next.config.ts', 'utf8');
    if (nextConfig.includes('withSentryConfig')) {
      log.success('Sentry integration configured');
    } else {
      log.warning('Sentry integration not configured');
    }
  } catch (error) {
    log.error('Failed to read next.config.ts');
    checks.push({ success: false, error: 'Failed to read next.config.ts' });
  }
  
  return checks;
}

// Função principal
async function runTests() {
  log.header('🚀 FisioFlow Application Test Suite');
  log.info('Starting comprehensive application testing...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    critical: 0,
  };
  
  // Verificar arquivos
  log.header('📁 Checking Required Files...');
  for (const check of fileChecks) {
    const result = checkFile(check.path, check.name, check.critical);
    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
      if (check.critical) {
        results.critical++;
      } else {
        results.warnings++;
      }
    }
  }
  
  // Verificar dependências
  const depResult = checkDependencies();
  if (depResult.success) {
    results.passed++;
  } else {
    results.failed++;
    results.critical++;
  }
  
  // Verificar configuração
  const configResults = checkConfiguration();
  results.passed += configResults.filter(r => r.success).length;
  results.failed += configResults.filter(r => !r.success).length;
  
  // Executar testes
  log.header('\n🧪 Running Test Suite...');
  for (const test of tests) {
    const result = runCommand(test.command, test.name, test.critical);
    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
      if (test.critical) {
        results.critical++;
      } else {
        results.warnings++;
      }
    }
  }
  
  // Resumo dos resultados
  log.header('\n📊 Test Results Summary');
  log.info(`Total tests: ${results.passed + results.failed}`);
  log.success(`Passed: ${results.passed}`);
  
  if (results.warnings > 0) {
    log.warning(`Warnings: ${results.warnings}`);
  }
  
  if (results.failed > 0) {
    log.error(`Failed: ${results.failed}`);
  }
  
  if (results.critical > 0) {
    log.error(`Critical failures: ${results.critical}`);
    log.error('❌ Application has critical issues that need to be fixed!');
    process.exit(1);
  } else if (results.failed > 0) {
    log.warning('⚠️  Application has some issues but is functional');
    process.exit(0);
  } else {
    log.success('🎉 All tests passed! Application is ready for production.');
    process.exit(0);
  }
}

// Executar testes
runTests().catch(error => {
  log.error(`Test suite failed: ${error.message}`);
  process.exit(1);
});


