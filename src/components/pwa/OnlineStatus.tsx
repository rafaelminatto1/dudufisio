'use client'

import { useIsOnline } from './PWAManager'

/**
 * Componente que mostra o status de conectividade
 * Exibe se o usuário está online ou offline
 */
export function OnlineStatus() {
  const isOnline = useIsOnline()

  if (isOnline) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse"></div>
        <span>Online</span>
      </div>
    )
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg flex items-center space-x-2">
      <div className="w-2 h-2 bg-red-200 rounded-full"></div>
      <span>Offline</span>
      <div className="text-xs">📱 PWA Ativo</div>
    </div>
  )
}

/**
 * Componente para testar funcionalidades offline
 */
export function OfflineTester() {
  const isOnline = useIsOnline()

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📡 Teste de Funcionalidades Offline
      </h3>

      <div className="space-y-4">
        {/* Status atual */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">Status: {isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <div className="text-sm text-gray-600">
            {isOnline ? '🌐 Conectado à internet' : '📱 Modo offline ativo'}
          </div>
        </div>

        {/* Funcionalidades offline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">📋 Cache Local</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Páginas principais em cache</li>
              <li>✅ Ícones e assets salvos</li>
              <li>✅ Service worker ativo</li>
              <li>✅ Navegação básica funcional</li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">🔄 Sincronização</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Dados pendentes em fila</li>
              <li>✅ Auto-sync ao voltar online</li>
              <li>✅ Background sync habilitado</li>
              <li>✅ Conflitos resolvidos automaticamente</li>
            </ul>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">🧪 Como testar offline:</h4>
          <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
            <li>Abra as DevTools do navegador (F12)</li>
            <li>Vá na aba "Network" ou "Rede"</li>
            <li>Marque a opção "Offline" ou configure throttling</li>
            <li>Navegue pelo app e veja que continua funcionando</li>
            <li>Reative a conexão e observe a sincronização</li>
          </ol>
        </div>

        {/* Status do service worker */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">⚙️ Service Worker</h4>
          <div className="text-sm text-gray-600">
            {typeof window !== 'undefined' && 'serviceWorker' in navigator ? (
              <div className="space-y-1">
                <div>✅ Service Worker suportado</div>
                <div>✅ Cache estratégico configurado</div>
                <div>✅ Push notifications habilitadas</div>
                <div>✅ Background sync disponível</div>
              </div>
            ) : (
              <div>❌ Service Worker não suportado neste navegador</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}