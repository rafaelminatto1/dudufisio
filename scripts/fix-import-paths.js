#!/usr/bin/env node

/**
 * Script para corrigir paths de imports após mudanças na configuração do TypeScript
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing import paths...');

// Padrões de imports para corrigir
const importPatterns = [
  // Corrigir imports de componentes UI
  {
    pattern: /from ['"]@\/components\/ui\/([^'"]+)['"]/g,
    replacement: "from '@/src/components/ui/$1'"
  },
  // Corrigir imports de hooks
  {
    pattern: /from ['"]@\/hooks\/([^'"]+)['"]/g,
    replacement: "from '@/src/hooks/$1'"
  },
  // Corrigir imports de lib
  {
    pattern: /from ['"]@\/lib\/([^'"]+)['"]/g,
    replacement: "from '@/src/lib/$1'"
  },
  // Corrigir imports de componentes específicos
  {
    pattern: /from ['"]@\/components\/([^'"]+)['"]/g,
    replacement: "from '@/src/components/$1'"
  }
];

// Função para processar um arquivo
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;
    
    // Aplicar cada padrão de correção
    for (const { pattern, replacement } of importPatterns) {
      const before = newContent;
      newContent = newContent.replace(pattern, replacement);
      if (before !== newContent) {
        modified = true;
      }
    }
    
    // Salvar o arquivo se foi modificado
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
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
        if (!['node_modules', '.next', '.git', 'dist', 'build', 'testsprite_tests'].includes(item)) {
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

console.log(`Found ${tsFiles.length} TypeScript files to process...`);

for (const file of tsFiles) {
  if (processFile(file)) {
    fixedCount++;
    console.log(`Fixed: ${file}`);
  }
}

console.log(`\n✅ Fixed ${fixedCount} files`);
console.log('🔍 Running type check to verify fixes...');

try {
  execSync('npm run type-check', { stdio: 'inherit' });
  console.log('✅ Type check passed!');
} catch (error) {
  console.log('❌ Type check still has errors. Continuing with other improvements...');
}
