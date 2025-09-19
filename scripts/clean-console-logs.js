#!/usr/bin/env node

/**
 * Script para substituir console.logs por logger estruturado
 * Uso: node scripts/clean-console-logs.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const isDryRun = process.argv.includes('--dry-run');

const directories = [
  'app',
  'components', 
  'lib',
  'src'
];

let totalProcessed = 0;
let totalReplaced = 0;
let filesModified = [];

// Mapeamento de console para logger
const consoleToLogger = {
  'console.log': 'logger.info',
  'console.debug': 'logger.debug',
  'console.info': 'logger.info',
  'console.warn': 'logger.warn',
  'console.error': 'logger.error'
};

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let newContent = content;
  let needsImport = false;
  
  // Verificar se já tem import do logger
  const hasLoggerImport = content.includes("from '@/lib/logger'") || 
                          content.includes('from "@/lib/logger"') ||
                          content.includes("from '../lib/logger'") ||
                          content.includes("from '../../lib/logger'");
  
  // Substituir console.* por logger.*
  Object.entries(consoleToLogger).forEach(([consoleMethod, loggerMethod]) => {
    const regex = new RegExp(`${consoleMethod.replace('.', '\\.')}\\(`, 'g');
    if (regex.test(newContent)) {
      newContent = newContent.replace(regex, `${loggerMethod}(`);
      modified = true;
      needsImport = true;
      totalReplaced++;
    }
  });
  
  // Adicionar import do logger se necessário
  if (modified && needsImport && !hasLoggerImport) {
    // Determinar o caminho relativo correto para o import
    const relativePath = path.relative(path.dirname(filePath), path.join(process.cwd(), 'lib/logger'));
    let importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
    importPath = importPath.replace(/\\/g, '/'); // Windows compatibility
    
    // Se o arquivo é TypeScript/TSX
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      // Adicionar import no início do arquivo
      const importStatement = `import logger from '${importPath}';\n`;
      
      // Encontrar onde adicionar o import (após outros imports ou no início)
      const importMatch = newContent.match(/^(import .+\n)+/m);
      if (importMatch) {
        const lastImportIndex = importMatch.index + importMatch[0].length;
        newContent = newContent.slice(0, lastImportIndex) + importStatement + newContent.slice(lastImportIndex);
      } else {
        // Se não há imports, adicionar no início com 'use client' check
        if (newContent.startsWith("'use client'") || newContent.startsWith('"use client"')) {
          const firstLineEnd = newContent.indexOf('\n') + 1;
          newContent = newContent.slice(0, firstLineEnd) + '\n' + importStatement + newContent.slice(firstLineEnd);
        } else {
          newContent = importStatement + '\n' + newContent;
        }
      }
    }
  }
  
  if (modified) {
    if (!isDryRun) {
      fs.writeFileSync(filePath, newContent);
    }
    filesModified.push(filePath);
    console.log(`${isDryRun ? '[DRY RUN] Would process' : 'Processed'}: ${filePath}`);
  }
  
  totalProcessed++;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    try {
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Ignorar diretórios especiais
        const ignoreDirs = ['.', 'node_modules', '.next', 'out', 'build', 'dist', '.git'];
        if (!ignoreDirs.some(ignore => file.startsWith(ignore))) {
          processDirectory(filePath);
        }
      } else if (stat.isFile()) {
        // Processar apenas arquivos de código
        const extensions = ['.ts', '.tsx', '.js', '.jsx'];
        if (extensions.some(ext => file.endsWith(ext))) {
          // Ignorar arquivos de teste e configuração
          const ignorePatterns = ['.test.', '.spec.', '.config.', 'jest.', 'playwright.'];
          if (!ignorePatterns.some(pattern => file.includes(pattern))) {
            processFile(filePath);
          }
        }
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  });
}

// Executar script
console.log('🧹 Starting console.log cleanup...');
if (isDryRun) {
  console.log('📝 Running in DRY RUN mode - no files will be modified\n');
}

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`📂 Processing directory: ${dir}`);
    processDirectory(dir);
  }
});

// Relatório final
console.log('\n' + '='.repeat(50));
console.log('📊 CLEANUP SUMMARY');
console.log('='.repeat(50));
console.log(`Files processed: ${totalProcessed}`);
console.log(`Files modified: ${filesModified.length}`);
console.log(`Console statements replaced: ${totalReplaced}`);

if (filesModified.length > 0 && !isDryRun) {
  console.log('\n✅ The following files were updated:');
  filesModified.forEach(file => console.log(`  - ${file}`));
  console.log('\n⚠️  Please review the changes and test your application!');
  console.log('💡 Tip: Use "git diff" to review all changes');
} else if (isDryRun && filesModified.length > 0) {
  console.log('\n📝 Run without --dry-run flag to apply changes');
}

process.exit(0);