/**
 * Advanced Service Worker for FisioFlow
 * Implements intelligent caching, offline support, and push notifications
 */

const CACHE_VERSION = 'v2.0.0'
const CACHE_PREFIX = 'fisioflow'

const CACHES = {
  STATIC: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
  DYNAMIC: `${CACHE_PREFIX}-dynamic-${CACHE_VERSION}`,
  IMAGES: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
  API: `${CACHE_PREFIX}-api-${CACHE_VERSION}`
}

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
}

// Route patterns and their strategies
const ROUTE_STRATEGIES = [
  {
    pattern: /\/_next\/static\//,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cache: CACHES.STATIC,
    maxAge: 365 * 24 * 60 * 60 // 1 year
  },
  {
    pattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cache: CACHES.IMAGES,
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  {
    pattern: /\/api\/patients/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cache: CACHES.API,
    maxAge: 5 * 60 // 5 minutes
  },
  {
    pattern: /\/api\/appointments/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cache: CACHES.API,
    maxAge: 2 * 60 // 2 minutes
  },
  {
    pattern: /\/api\/exercises/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cache: CACHES.API,
    maxAge: 60 * 60 // 1 hour
  }
]

// Install event - cache critical resources
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker')

  const cacheResources = async () => {
    // Critical resources to cache immediately
    const criticalResources = [
      '/',
      '/manifest.json',
      '/offline',
      '/_next/static/css/',
      '/_next/static/js/'
    ]

    try {
      const cache = await caches.open(CACHES.STATIC)
      await cache.addAll(criticalResources.filter(url => !url.includes('undefined')))
      console.log('[SW] Critical resources cached')
    } catch (error) {
      console.error('[SW] Failed to cache critical resources:', error)
    }
  }

  event.waitUntil(cacheResources())
  self.skipWaiting()
})

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker')

  const cleanupCaches = async () => {
    const cacheNames = await caches.keys()
    const oldCaches = cacheNames.filter(name =>
      name.startsWith(CACHE_PREFIX) && !Object.values(CACHES).includes(name)
    )

    await Promise.all(
      oldCaches.map(cacheName => {
        console.log('[SW] Deleting old cache:', cacheName)
        return caches.delete(cacheName)
      })
    )
  }

  event.waitUntil(cleanupCaches())
  self.clients.claim()
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return
  }

  // Find matching strategy
  const route = ROUTE_STRATEGIES.find(route => route.pattern.test(url.pathname))

  if (route) {
    event.respondWith(handleRequest(request, route))
  } else {
    // Default strategy for unmatched routes
    event.respondWith(handleRequest(request, {
      strategy: CACHE_STRATEGIES.NETWORK_FIRST,
      cache: CACHES.DYNAMIC,
      maxAge: 24 * 60 * 60 // 24 hours
    }))
  }
})

// Handle requests based on strategy
async function handleRequest(request, route) {
  const { strategy, cache: cacheName, maxAge } = route

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cacheName, maxAge)

    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cacheName, maxAge)

    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cacheName, maxAge)

    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request)

    case CACHE_STRATEGIES.CACHE_ONLY:
      return caches.match(request)

    default:
      return fetch(request)
  }
}

// Cache first strategy
async function cacheFirst(request, cacheName, maxAge) {
  try {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)

    if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.error('[SW] Cache first failed:', error)
    const cachedResponse = await caches.match(request)
    return cachedResponse || createOfflineResponse(request)
  }
}

// Network first strategy
async function networkFirst(request, cacheName, maxAge) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.error('[SW] Network first failed, falling back to cache:', error)
    const cachedResponse = await caches.match(request)
    return cachedResponse || createOfflineResponse(request)
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  // Background revalidation
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(error => {
    console.error('[SW] Background revalidation failed:', error)
  })

  // Return cached response immediately, or wait for network
  return cachedResponse || networkPromise
}

// Check if cached response is expired
function isExpired(response, maxAge) {
  if (!maxAge) return false

  const dateHeader = response.headers.get('date')
  if (!dateHeader) return false

  const cacheTime = new Date(dateHeader).getTime()
  const now = Date.now()

  return (now - cacheTime) > (maxAge * 1000)
}

// Create offline response
function createOfflineResponse(request) {
  const url = new URL(request.url)

  // For API requests, return JSON error
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Você está offline. Esta ação será sincronizada quando a conexão for restaurada.'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  // For page requests, return offline page
  return caches.match('/offline') || new Response(
    '<h1>Você está offline</h1><p>Verifique sua conexão com a internet.</p>',
    {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    }
  )
}

// Push notification handling
self.addEventListener('push', event => {
  console.log('[SW] Push received:', event)

  const options = {
    badge: '/icons/badge-72x72.png',
    icon: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/icons/view.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/close.png'
      }
    ]
  }

  if (event.data) {
    try {
      const data = event.data.json()

      const notificationPromise = self.registration.showNotification(
        data.title || 'FisioFlow',
        {
          ...options,
          body: data.body || 'Você tem uma nova notificação',
          tag: data.tag || 'general',
          data: { ...options.data, ...data }
        }
      )

      event.waitUntil(notificationPromise)
    } catch (error) {
      console.error('[SW] Error parsing push data:', error)
    }
  }
})

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click received:', event)

  event.notification.close()

  if (event.action === 'close') {
    return
  }

  // Default action or 'view' action
  const urlToOpen = event.notification.data?.url || '/'

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(windowClients => {
    // Check if there's already a window/tab open with the target URL
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i]
      if (client.url === urlToOpen && 'focus' in client) {
        return client.focus()
      }
    }

    // If not, open a new window/tab
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen)
    }
  })

  event.waitUntil(promiseChain)
})

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag)

  if (event.tag === 'patient-data-sync') {
    event.waitUntil(syncPatientData())
  } else if (event.tag === 'appointment-sync') {
    event.waitUntil(syncAppointments())
  }
})

// Sync patient data when back online
async function syncPatientData() {
  try {
    // Get pending patient updates from IndexedDB
    const pendingUpdates = await getPendingPatientUpdates()

    for (const update of pendingUpdates) {
      try {
        const response = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update.data)
        })

        if (response.ok) {
          await removePendingUpdate(update.id)
          console.log('[SW] Patient data synced:', update.id)
        }
      } catch (error) {
        console.error('[SW] Failed to sync patient data:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Sync appointments when back online
async function syncAppointments() {
  try {
    const pendingAppointments = await getPendingAppointments()

    for (const appointment of pendingAppointments) {
      try {
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(appointment.data)
        })

        if (response.ok) {
          await removePendingAppointment(appointment.id)
          console.log('[SW] Appointment synced:', appointment.id)
        }
      } catch (error) {
        console.error('[SW] Failed to sync appointment:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Appointment sync failed:', error)
  }
}

// IndexedDB helpers (simplified)
async function getPendingPatientUpdates() {
  // Implementation would use IndexedDB to get pending updates
  return []
}

async function removePendingUpdate(id) {
  // Implementation would remove from IndexedDB
}

async function getPendingAppointments() {
  // Implementation would use IndexedDB to get pending appointments
  return []
}

async function removePendingAppointment(id) {
  // Implementation would remove from IndexedDB
}

// Message handling for communication with main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})