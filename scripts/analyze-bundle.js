#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes Next.js build output and identifies optimization opportunities
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const BUILD_DIR = '.next'
const ANALYSIS_OUTPUT = 'bundle-analysis.json'

function analyzeBundle() {
  console.log('🔍 Starting bundle analysis...')

  // Check if build exists
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ Build directory not found. Please run "npm run build" first.')
    process.exit(1)
  }

  // Read build manifest
  const manifestPath = path.join(BUILD_DIR, 'build-manifest.json')
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Build manifest not found.')
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

  // Analyze chunks
  const analysis = {
    timestamp: new Date().toISOString(),
    pages: {},
    chunks: {},
    recommendations: []
  }

  // Analyze each page
  Object.entries(manifest.pages).forEach(([page, files]) => {
    let totalSize = 0
    const pageFiles = []

    files.forEach(file => {
      const filePath = path.join(BUILD_DIR, 'static', file)
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath)
        pageFiles.push({
          name: file,
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024 * 100) / 100
        })
        totalSize += stats.size
      }
    })

    analysis.pages[page] = {
      files: pageFiles,
      totalSize,
      totalSizeKB: Math.round(totalSize / 1024 * 100) / 100
    }

    // Add recommendations for large pages
    if (totalSize > 500 * 1024) { // > 500KB
      analysis.recommendations.push({
        type: 'LARGE_PAGE',
        page,
        size: totalSize,
        message: `Page ${page} is ${Math.round(totalSize / 1024)}KB. Consider code splitting.`
      })
    }
  })

  // Analyze chunks directory
  const chunksDir = path.join(BUILD_DIR, 'static', 'chunks')
  if (fs.existsSync(chunksDir)) {
    const chunkFiles = fs.readdirSync(chunksDir)

    chunkFiles.forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(chunksDir, file)
        const stats = fs.statSync(filePath)

        analysis.chunks[file] = {
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024 * 100) / 100
        }

        // Large chunk warning
        if (stats.size > 300 * 1024) { // > 300KB
          analysis.recommendations.push({
            type: 'LARGE_CHUNK',
            file,
            size: stats.size,
            message: `Chunk ${file} is ${Math.round(stats.size / 1024)}KB. Consider splitting further.`
          })
        }
      }
    })
  }

  // Check for duplicate dependencies
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

    // Common duplicate patterns
    const duplicatePatterns = [
      ['react', '@types/react'],
      ['lodash', 'lodash-es'],
      ['moment', 'date-fns'],
      ['axios', 'fetch']
    ]

    duplicatePatterns.forEach(([dep1, dep2]) => {
      if (dependencies[dep1] && dependencies[dep2]) {
        analysis.recommendations.push({
          type: 'DUPLICATE_DEPENDENCY',
          dependencies: [dep1, dep2],
          message: `Consider using only one of: ${dep1} or ${dep2}`
        })
      }
    })
  } catch (error) {
    console.warn('⚠️ Could not analyze package.json')
  }

  // Generate summary
  const summary = {
    totalPages: Object.keys(analysis.pages).length,
    totalChunks: Object.keys(analysis.chunks).length,
    largestPage: Object.entries(analysis.pages)
      .sort(([,a], [,b]) => b.totalSize - a.totalSize)[0],
    largestChunk: Object.entries(analysis.chunks)
      .sort(([,a], [,b]) => b.size - a.size)[0],
    recommendations: analysis.recommendations.length
  }

  // Output results
  console.log('\n📊 Bundle Analysis Results:')
  console.log(`   Total Pages: ${summary.totalPages}`)
  console.log(`   Total Chunks: ${summary.totalChunks}`)

  if (summary.largestPage) {
    console.log(`   Largest Page: ${summary.largestPage[0]} (${summary.largestPage[1].totalSizeKB}KB)`)
  }

  if (summary.largestChunk) {
    console.log(`   Largest Chunk: ${summary.largestChunk[0]} (${summary.largestChunk[1].sizeKB}KB)`)
  }

  console.log(`   Recommendations: ${summary.recommendations}`)

  if (analysis.recommendations.length > 0) {
    console.log('\n💡 Optimization Recommendations:')
    analysis.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec.message}`)
    })
  }

  // Save detailed analysis
  const fullAnalysis = { ...analysis, summary }
  fs.writeFileSync(ANALYSIS_OUTPUT, JSON.stringify(fullAnalysis, null, 2))
  console.log(`\n📄 Detailed analysis saved to: ${ANALYSIS_OUTPUT}`)

  // Exit with error if critical issues found
  const criticalIssues = analysis.recommendations.filter(rec =>
    rec.type === 'LARGE_PAGE' || rec.type === 'LARGE_CHUNK'
  )

  if (criticalIssues.length > 0) {
    console.log(`\n⚠️  Found ${criticalIssues.length} critical performance issues.`)
    process.exit(1)
  }

  console.log('\n✅ Bundle analysis complete!')
}

// Run if called directly
if (require.main === module) {
  analyzeBundle()
}

module.exports = { analyzeBundle }