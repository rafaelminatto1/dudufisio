#!/usr/bin/env node

/**
 * Script para limpar console.log statements desnecessários
 * Mantém apenas os que são em scripts de desenvolvimento
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

// Arquivos que devem manter console.log (scripts de desenvolvimento)
const KEEP_CONSOLE_FILES = [
  'scripts/**/*.js',
  '**/validate-env.js',
  '**/seed-database.js'
]

// Padrões de console.log que devem ser removidos
const CONSOLE_PATTERNS = [
  /console\.log\([^)]*\);?\s*$/gm,
  /console\.debug\([^)]*\);?\s*$/gm,
  /console\.info\([^)]*\);?\s*$/gm
]

// Padrões que devem ser mantidos (error, warn em production code)
const KEEP_PATTERNS = [
  /console\.error/,
  /console\.warn/,
  /console\.critical/
]

function shouldCleanFile(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/')

  return !KEEP_CONSOLE_FILES.some(pattern => {
    const globPattern = pattern.replace(/\\/g, '/')
    return minimatch(normalizedPath, globPattern)
  })
}

function cleanConsoleFromFile(filePath) {
  if (!shouldCleanFile(filePath)) {
    console.log(`⏭️  Skipping ${filePath} (development script)`)
    return
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8')
    let newContent = content
    let changesMade = false

    const lines = content.split('\n')
    const newLines = []

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()

      // Verifica se é uma linha com console.log/debug/info
      const hasConsoleLog = /console\.(log|debug|info)\s*\(/.test(trimmedLine)

      if (hasConsoleLog) {
        // Verifica se deve ser mantido (error, warn)
        const shouldKeep = KEEP_PATTERNS.some(pattern => pattern.test(trimmedLine))

        if (!shouldKeep) {
          console.log(`🧹 Removendo: ${filePath}:${index + 1} - ${trimmedLine}`)
          changesMade = true
          return // Pula esta linha
        }
      }

      newLines.push(line)
    })

    if (changesMade) {
      newContent = newLines.join('\n')
      fs.writeFileSync(filePath, newContent, 'utf8')
      console.log(`✅ Limpo: ${filePath}`)
    }

  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message)
  }
}

function minimatch(path, pattern) {
  // Implementação simples de glob matching
  const regexPattern = pattern
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')

  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(path)
}

console.log('🧹 Iniciando limpeza de console.log statements...\n')

// Buscar arquivos TypeScript e JavaScript
const filePatterns = [
  'src/**/*.{ts,tsx,js,jsx}',
  'app/**/*.{ts,tsx,js,jsx}',
  'components/**/*.{ts,tsx,js,jsx}',
  'lib/**/*.{ts,tsx,js,jsx}'
]

let totalFiles = 0

filePatterns.forEach(pattern => {
  try {
    const files = glob.sync(pattern, {
      ignore: ['node_modules/**', '.next/**', 'dist/**']
    })

    files.forEach(file => {
      totalFiles++
      cleanConsoleFromFile(file)
    })
  } catch (error) {
    console.error(`Erro ao processar padrão ${pattern}:`, error.message)
  }
})

console.log(`\n🎉 Limpeza concluída! Processados ${totalFiles} arquivos.`)
console.log('💡 Console.error e console.warn foram mantidos para logs de produção.')