/**
 * Service Worker para FisioFlow
 * Gerencia notificações push e cache offline
 */

const CACHE_NAME = 'fisioflow-v1'
const urlsToCache = [
  '/',
  '/dashboard',
  '/patients',
  '/appointments',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto')
        return cache.addAll(urlsToCache)
      })
  )
})

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Interceptação de requisições (estratégia cache-first para assets estáticos)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se encontrado
        if (response) {
          return response
        }

        // Faz a requisição à rede
        return fetch(event.request).then((response) => {
          // Verifica se é uma resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clona a resposta para o cache
          const responseToCache = response.clone()

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })

          return response
        })
      })
  )
})

// Recebimento de notificações push
self.addEventListener('push', (event) => {
  console.log('Push recebido:', event)

  let data = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data = { title: 'FisioFlow', body: event.data.text() }
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    timestamp: data.timestamp || Date.now(),
    tag: data.tag || 'default'
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'FisioFlow', options)
  )
})

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada:', event)

  event.notification.close()

  const action = event.action
  const data = event.notification.data

  let url = '/'

  // Determina a URL baseada na ação ou tipo de notificação
  if (action === 'confirm' && data.appointmentId) {
    url = `/appointments/${data.appointmentId}/confirm`
  } else if (action === 'reschedule' && data.appointmentId) {
    url = `/appointments/${data.appointmentId}/reschedule`
  } else if (action === 'done' && data.exerciseId) {
    url = `/exercises/${data.exerciseId}/complete`
  } else if (action === 'pay' && data.paymentId) {
    url = `/payments/${data.paymentId}`
  } else if (data.appointmentId) {
    url = `/appointments/${data.appointmentId}`
  } else if (data.exerciseId) {
    url = `/exercises/${data.exerciseId}`
  } else if (data.paymentId) {
    url = `/payments/${data.paymentId}`
  } else if (data.patientId) {
    url = `/patients/${data.patientId}`
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Verifica se já há uma janela aberta
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }

      // Abre nova janela se necessário
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Fechamento de notificação
self.addEventListener('notificationclose', (event) => {
  console.log('Notificação fechada:', event)

  // Opcional: Registrar evento de fechamento para analytics
  if (event.notification.data && event.notification.data.trackClose) {
    event.waitUntil(
      fetch('/api/analytics/notification-closed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationId: event.notification.tag,
          closedAt: Date.now()
        })
      })
    )
  }
})

// Sincronização em background (para notificações offline)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // Sincronizar dados pendentes quando voltar online
    const response = await fetch('/api/sync/pending')
    if (response.ok) {
      const pendingData = await response.json()

      // Processar dados pendentes
      for (const item of pendingData) {
        await processPendingItem(item)
      }
    }
  } catch (error) {
    console.error('Erro na sincronização:', error)
  }
}

async function processPendingItem(item) {
  try {
    switch (item.type) {
      case 'appointment':
        await fetch(`/api/appointments/${item.id}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        })
        break

      case 'exercise':
        await fetch(`/api/exercises/${item.id}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        })
        break

      default:
        console.log('Tipo de sincronização não reconhecido:', item.type)
    }
  } catch (error) {
    console.error('Erro ao processar item pendente:', error)
  }
}

// Atualização do Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})