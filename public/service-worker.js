// Service Worker pour AlerteRoute PWA
// Version du cache - Update this version number whenever you deploy changes
const CACHE_VERSION = 'traficday-v3.1.3';

// Fichiers à mettre en cache (essentials only, dynamic files cached on-demand)
const CACHE_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/manifest.json'
];

const OPTIONAL_CACHE_FILES = [
    '/icons/icon-72.png',
    '/icons/icon-96.png',
    '/icons/icon-128.png',
    '/icons/icon-144.png',
    '/icons/icon-152.png',
    '/icons/icon-192.png',
    '/icons/icon-384.png',
    '/icons/icon-512.png'
];

// ============================================
// INSTALLATION
// ============================================
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installation en cours...');

    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then((cache) => {
                console.log('📦 Service Worker: Mise en cache des fichiers essentiels');
                // Mettre en cache les fichiers essentiels
                return cache.addAll(CACHE_FILES);
            })
            .then(() => {
                // Mettre en cache les icônes (sans bloquer si elles n'existent pas)
                return caches.open(CACHE_VERSION).then(cache => {
                    return Promise.all(
                        OPTIONAL_CACHE_FILES.map(file => {
                            return cache.add(file).catch(err => {
                                console.log('⚠️ Icône non trouvée:', file);
                            });
                        })
                    );
                });
            })
            .then(() => {
                console.log('✅ Service Worker: Installation terminée');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Service Worker: Erreur installation', error);
            })
    );
});

// ============================================
// ACTIVATION
// ============================================
self.addEventListener('activate', (event) => {
    console.log('⚡ Service Worker: Activation en cours...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Supprimer les anciens caches
                    if (cacheName !== CACHE_VERSION) {
                        console.log('🗑️ Service Worker: Suppression ancien cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
            .then(() => {
                console.log('✅ Service Worker: Activation terminée');
                return self.clients.claim();
            })
    );
});

// ============================================
// FETCH - Stratégie de cache
// ============================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorer les requêtes non-HTTP
    if (!request.url.startsWith('http')) {
        return;
    }

    // Only cache requests from our own domain
    const isOwnDomain = url.hostname === self.location.hostname ||
                        url.hostname.includes('traficday-91045') ||
                        url.hostname.includes('firebaseapp.com');

    // Don't intercept external resources (Leaflet, Firebase CDN, etc.)
    if (!isOwnDomain) {
        // Let browser handle external resources normally
        return;
    }

    // Stratégie Network First pour Firebase API calls
    if (url.hostname.includes('firebase') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('firebaseio.com')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Stratégie Cache First pour les assets statiques de notre domaine
    if (request.destination === 'image' ||
        request.destination === 'style' ||
        request.destination === 'script') {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Stratégie Network First pour le reste
    event.respondWith(networkFirst(request));
});

// ============================================
// STRATÉGIES DE CACHE
// ============================================

// Cache First - Cherche d'abord dans le cache
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        console.log('📦 Cache hit:', request.url);
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);

        // Mettre en cache la réponse
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_VERSION);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('❌ Erreur fetch:', error);
        return new Response('Erreur réseau', { status: 503 });
    }
}

// Network First - Cherche d'abord sur le réseau
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);

        // Mettre en cache la réponse réussie
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_VERSION);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('🌐 Network failed, using cache:', request.url);

        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Page hors ligne de secours
        if (request.destination === 'document') {
            const cache = await caches.open(CACHE_VERSION);
            return cache.match('/index.html');
        }

        return new Response('Hors ligne', { status: 503 });
    }
}

// ============================================
// NOTIFICATIONS PUSH
// ============================================
self.addEventListener('push', (event) => {
    console.log('📩 Service Worker: Notification push reçue');

    let notificationData = {
        title: 'AlerteRoute',
        body: 'Nouvelle alerte routière',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        tag: 'alerte-route',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: {
            url: '/'
        }
    };

    // Si des données sont envoyées
    if (event.data) {
        try {
            const payload = event.data.json();
            notificationData = {
                ...notificationData,
                title: payload.notification?.title || notificationData.title,
                body: payload.notification?.body || notificationData.body,
                icon: payload.notification?.icon || notificationData.icon,
                data: payload.data || notificationData.data
            };
        } catch (error) {
            console.error('❌ Erreur parsing notification:', error);
        }
    }

    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag,
            requireInteraction: notificationData.requireInteraction,
            vibrate: notificationData.vibrate,
            data: notificationData.data,
            actions: [
                {
                    action: 'view',
                    title: '👁️ Voir',
                    icon: '/icons/icon-96.png'
                },
                {
                    action: 'close',
                    title: '❌ Fermer'
                }
            ]
        })
    );
});

// ============================================
// CLIC SUR NOTIFICATION
// ============================================
self.addEventListener('notificationclick', (event) => {
    console.log('👆 Service Worker: Clic sur notification');

    event.notification.close();

    if (event.action === 'view' || !event.action) {
        const urlToOpen = event.notification.data?.url || '/';

        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    // Si l'app est déjà ouverte, la mettre au premier plan
                    for (let client of clientList) {
                        if (client.url === urlToOpen && 'focus' in client) {
                            return client.focus();
                        }
                    }

                    // Sinon, ouvrir une nouvelle fenêtre
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
        );
    }
});

// ============================================
// SYNCHRONISATION EN ARRIÈRE-PLAN
// ============================================
self.addEventListener('sync', (event) => {
    console.log('🔄 Service Worker: Synchronisation en arrière-plan');

    if (event.tag === 'sync-obstacles') {
        event.waitUntil(syncObstacles());
    }
});

async function syncObstacles() {
    try {
        console.log('🔄 Synchronisation des obstacles...');

        // Récupérer les obstacles en attente depuis IndexedDB
        // const pendingObstacles = await getPendingObstacles();

        // Envoyer à Firebase
        // for (let obstacle of pendingObstacles) {
        //   await sendObstacleToFirebase(obstacle);
        // }

        console.log('✅ Synchronisation terminée');
    } catch (error) {
        console.error('❌ Erreur synchronisation:', error);
    }
}

// ============================================
// MESSAGES DEPUIS L'APPLICATION
// ============================================
self.addEventListener('message', (event) => {
    console.log('💬 Service Worker: Message reçu', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});

// ============================================
// PARTAGE
// ============================================
self.addEventListener('share', (event) => {
    console.log('📤 Service Worker: Partage reçu');

    const { title, text, url } = event.data;

    // Gérer le partage
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then((clientList) => {
                if (clientList.length > 0) {
                    clientList[0].postMessage({
                        type: 'SHARED_DATA',
                        title,
                        text,
                        url
                    });
                }
            })
    );
});

console.log('✅ Service Worker chargé');