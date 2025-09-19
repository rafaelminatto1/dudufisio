#!/usr/bin/env node

/**
 * Script para corrigir imports malformados causados pelo script de limpeza de console.logs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing malformed imports...');

// Padrão para encontrar imports malformados
const malformedImportPattern = /import\s*{\s*\nimport logger from ['"][^'"]+['"];\s*\n/g;

// Função para processar um arquivo
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar se tem import malformado
    if (malformedImportPattern.test(content)) {
      console.log(`Fixing: ${filePath}`);
      
      // Corrigir o import malformado
      let fixedContent = content.replace(malformedImportPattern, (match) => {
        // Extrair o caminho do logger
        const loggerMatch = match.match(/import logger from ['"]([^'"]+)['"];/);
        if (loggerMatch) {
          const loggerPath = loggerMatch[1];
          // Retornar o import correto
          return `import logger from '${loggerPath}';\nimport {\n`;
        }
        return match;
      });
      
      // Salvar o arquivo corrigido
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Função para encontrar todos os arquivos TypeScript/TSX
function findTsFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Pular diretórios desnecessários
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(item)) {
          traverse(fullPath);
        }
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Processar todos os arquivos
const tsFiles = findTsFiles('.');
let fixedCount = 0;

for (const file of tsFiles) {
  if (processFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✅ Fixed ${fixedCount} files`);
console.log('🔍 Running type check to verify fixes...');

try {
  execSync('npm run type-check', { stdio: 'inherit' });
  console.log('✅ Type check passed!');
} catch (error) {
  console.log('❌ Type check failed. Please review the remaining errors.');
  process.exit(1);
}
