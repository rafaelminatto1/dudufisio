#!/usr/bin/env node

/**
 * Script para gerar VAPID keys para Push Notifications
 * Execute: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push');

console.log('🔑 Gerando VAPID keys para Push Notifications...\n');

try {
  const vapidKeys = webpush.generateVAPIDKeys();
  
  console.log('✅ VAPID Keys geradas com sucesso!\n');
  console.log('📋 Adicione estas variáveis ao seu arquivo .env:\n');
  console.log('='.repeat(60));
  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  console.log('='.repeat(60));
  console.log('\n🔐 IMPORTANTE:');
  console.log('- Mantenha a chave privada em segurança');
  console.log('- Nunca commite essas chaves no repositório');
  console.log('- Use diferentes chaves para desenvolvimento e produção');
  console.log('\n✨ Configuração concluída!');
  
} catch (error) {
  console.error('❌ Erro ao gerar VAPID keys:', error.message);
  console.log('\n💡 Certifique-se de que o pacote web-push está instalado:');
  console.log('npm install web-push');
  process.exit(1);
}
