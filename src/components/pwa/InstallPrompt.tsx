'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { X, Download, Smartphone, Monitor, Zap, Shield, Wifi } from 'lucide-react'
import { toast } from 'sonner'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [platform, setPlatform] = useState<'desktop' | 'mobile' | 'unknown'>('unknown')

  useEffect(() => {
    // Detectar plataforma
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
    setPlatform(isMobile ? 'mobile' : 'desktop')

    // Verificar se já está instalado
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Ouvir evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const event = e as BeforeInstallPromptEvent
      setDeferredPrompt(event)
      setIsInstallable(true)

      // Mostrar prompt após 30 segundos se o usuário não instalou
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true)
        }
      }, 30000)
    }

    // Ouvir instalação bem-sucedida
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
      toast.success('FisioFlow instalado com sucesso! 🎉')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice

      if (choiceResult.outcome === 'accepted') {
        toast.success('Instalação iniciada...')
      } else {
        toast.info('Instalação cancelada')
      }

      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      toast.error('Erro ao instalar o aplicativo')
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Não mostrar novamente nesta sessão
    sessionStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  // Não mostrar se já instalado ou se foi dispensado nesta sessão
  if (isInstalled || !isInstallable || !showPrompt) {
    return null
  }

  if (sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-primary/20 z-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Download className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm">Instalar FisioFlow</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {platform === 'mobile' ? 'App Mobile' : 'App Desktop'}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <CardDescription className="text-xs">
          Instale o FisioFlow para ter acesso rápido e uma experiência otimizada
        </CardDescription>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <Zap className="h-3 w-3 text-yellow-500" />
            <span>Acesso rápido</span>
          </div>
          <div className="flex items-center space-x-1">
            <Wifi className="h-3 w-3 text-blue-500" />
            <span>Funciona offline</span>
          </div>
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3 text-green-500" />
            <span>Notificações</span>
          </div>
          <div className="flex items-center space-x-1">
            {platform === 'mobile' ? (
              <Smartphone className="h-3 w-3 text-purple-500" />
            ) : (
              <Monitor className="h-3 w-3 text-purple-500" />
            )}
            <span>App nativo</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button onClick={handleInstall} size="sm" className="flex-1">
            <Download className="mr-1 h-3 w-3" />
            Instalar
          </Button>
          <Button variant="outline" size="sm" onClick={handleDismiss}>
            Agora não
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook para verificar status PWA
export function usePWAStatus() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Verificar se está instalado
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Verificar se é instalável
    const handleBeforeInstallPrompt = () => {
      setIsInstallable(true)
    }

    // Verificar status online/offline
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Status inicial
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isInstalled,
    isInstallable,
    isOnline
  }
}

// Componente de status offline
export function OfflineIndicator() {
  const { isOnline } = usePWAStatus()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm z-50">
      <div className="flex items-center justify-center space-x-2">
        <Wifi className="h-4 w-4" />
        <span>Modo offline - Algumas funcionalidades podem estar limitadas</span>
      </div>
    </div>
  )
}