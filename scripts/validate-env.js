/**
 * Environment validation script
 * Validates that all required environment variables are set
 */

const fs = require('fs');
const path = require('path');

function validateEnv() {
  console.log('🔍 Validating environment variables...\n');

  // Check if .env.local exists
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envLocalPath)) {
    console.error('❌ .env.local file not found');
    console.log('💡 Create one by copying .env.example:');
    console.log('   cp .env.example .env.local');
    process.exit(1);
  }

  // Required variables for MVP
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_APP_URL'
  ];

  const optionalVars = [
    'ENCRYPTION_KEY',
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'SENTRY_DSN'
  ];

  let hasErrors = false;

  console.log('✅ Required variables:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName}: NOT SET`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName}: SET`);
    }
  });

  console.log('\n🔧 Optional variables (for full functionality):');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: SET`);
    } else {
      console.log(`⚠️  ${varName}: NOT SET (optional for MVP)`);
    }
  });

  if (hasErrors) {
    console.log('\n❌ Some required environment variables are missing.');
    console.log('💡 Update your .env.local file with the missing values.');
    process.exit(1);
  } else {
    console.log('\n🎉 All required environment variables are set!');
    console.log('✨ Ready for development');
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });
validateEnv();