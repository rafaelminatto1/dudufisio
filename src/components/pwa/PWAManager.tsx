'use client'

import { useEffect } from 'react'
import logger from '../../../lib/logger';

/**
 * Componente responsável por gerenciar o PWA
 * - Registra o Service Worker
 * - Configura notificações push
 * - Gerencia instalação do PWA
 */
export function PWAManager() {
  useEffect(() => {
    // Registrar service worker apenas no cliente e se estiver disponível
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker()
    }

    // Configurar notificações push
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setupPushNotifications()
    }

    // Detectar instalação do PWA
    if (typeof window !== 'undefined') {
      setupPWAInstallPrompt()
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      logger.info('Service Worker registrado:', registration.scope)

      // Verificar atualizações
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão disponível
              logger.info('Nova versão do PWA disponível')
              // Opcional: mostrar notificação de atualização
              showUpdateNotification(registration)
            }
          })
        }
      })

    } catch (error) {
      logger.error('Erro ao registrar Service Worker:', error)
    }
  }

  const setupPushNotifications = async () => {
    try {
      // Verificar se as notificações estão permitidas
      if (Notification.permission === 'default') {
        // Pedir permissão apenas quando necessário (não no load inicial)
        logger.info('Permissão de notificação: padrão (será solicitada quando necessário)')
        return
      }

      if (Notification.permission === 'granted') {
        logger.info('Notificações push habilitadas')

        // Configurar VAPID keys se necessário
        const registration = await navigator.serviceWorker.ready

        // Opcional: Subscrever para push notifications
        // const subscription = await registration.pushManager.subscribe({
        //   userVisibleOnly: true,
        //   applicationServerKey: VAPID_PUBLIC_KEY
        // })

        logger.info('Service Worker pronto para notificações')
      }

    } catch (error) {
      logger.error('Erro ao configurar notificações push:', error)
    }
  }

  const setupPWAInstallPrompt = () => {
    let deferredPrompt: any = null

    window.addEventListener('beforeinstallprompt', (e) => {
      logger.info('PWA pode ser instalado')
      e.preventDefault()
      deferredPrompt = e

      // Mostrar botão de instalação customizado se desejar
      // showInstallButton(deferredPrompt)
    })

    window.addEventListener('appinstalled', () => {
      logger.info('PWA foi instalado')
      deferredPrompt = null

      // Opcional: rastrear instalação para analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'pwa_installed')
      }
    })
  }

  const showUpdateNotification = (registration: ServiceWorkerRegistration) => {
    // Opcional: mostrar notificação in-app sobre atualização
    if (confirm('Nova versão disponível! Deseja atualizar?')) {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        window.location.reload()
      }
    }
  }

  // Este componente não renderiza nada visível
  return null
}

/**
 * Hook para solicitar permissão de notificação quando necessário
 */
export function useNotificationPermission() {
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      logger.warn('Notificações não são suportadas neste navegador')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  const showNotification = async (title: string, options?: NotificationOptions) => {
    const hasPermission = await requestPermission()

    if (hasPermission) {
      const registration = await navigator.serviceWorker.ready

      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options
      })
    }
  }

  return {
    requestPermission,
    showNotification,
    hasPermission: Notification.permission === 'granted'
  }
}

/**
 * Hook para verificar se o app está rodando como PWA
 */
export function useIsPWA() {
  const isPWA = typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
     (window.navigator as any).standalone === true)

  return isPWA
}

/**
 * Hook para detectar se está offline
 */
export function useIsOnline() {
  const isOnline = typeof window !== 'undefined' ? navigator.onLine : true

  useEffect(() => {
    const handleOnline = () => logger.info('Conectado à internet')
    const handleOffline = () => logger.info('Modo offline ativado')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}