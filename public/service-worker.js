// TraficDay Service Worker - Cache + Notifications FCM
const CACHE_VERSION = 'v3.1.6';
const CACHE_NAME = `traficday-cache-${CACHE_VERSION}`;

// Fichiers à mettre en cache
const CACHE_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/firebase-config.js',
    '/manifest.json',
    '/icons/icon-72.png',
    '/icons/icon-96.png',
    '/icons/icon-128.png',
    '/icons/icon-192.png',
    '/icons/icon-384.png',
    '/icons/icon-512.png',
    '/logo.ico'
];

// ============================================
// FIREBASE CLOUD MESSAGING
// ============================================
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Configuration Firebase
firebase.initializeApp({
    apiKey: "AIzaSyB7DwtpC_RggBLkW0w2yHOOGxrXHpyWPfE",
    authDomain: "traficday-91045.firebaseapp.com",
    databaseURL: "https://traficday-91045-default-rtdb.firebaseio.com",
    projectId: "traficday-91045",
    storageBucket: "traficday-91045.firebasestorage.app",
    messagingSenderId: "230009461919",
    appId: "1:230009461919:web:bc09e90d723f66a84556aa"
});

const messaging = firebase.messaging();

// Gérer les notifications en background
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Message reçu en background:', payload);

    // Detect notification type
    const notificationType = payload.data?.type || 'obstacle';
    console.log('[SW] Type de notification:', notificationType);

    const notificationTitle = payload.notification?.title || 'TraficDay';
    const notificationOptions = {
        body: payload.notification?.body || 'Nouvelle alerte',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        tag: payload.data?.obstacleId || `traficday-${notificationType}`,
        data: {
            ...payload.data,
            type: notificationType
        },
        requireInteraction: true,
        vibrate: [200, 100, 200],
        actions: [
            {
                action: 'open',
                title: 'Voir',
                icon: '/icons/icon-72.png'
            },
            {
                action: 'close',
                title: 'Fermer'
            }
        ]
    };

    // CASE 3: For admin notifications, always show push when app is closed
    // (Both in-area and outside-area users get notification when app is closed)
    console.log('[SW] Affichage notification push (app closed)');

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ============================================
// INSTALLATION DU SERVICE WORKER
// ============================================
self.addEventListener('install', (event) => {
    console.log('[SW] Installation...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Fichiers mis en cache');
                return cache.addAll(CACHE_FILES);
            })
            .then(() => self.skipWaiting())
    );
});

// ============================================
// ACTIVATION DU SERVICE WORKER
// ============================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activation...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Suppression ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ============================================
// INTERCEPTION DES REQUÊTES
// ============================================
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes Firebase
    if (event.request.url.includes('firebasestorage.googleapis.com') ||
        event.request.url.includes('firebaseinstallations.googleapis.com') ||
        event.request.url.includes('firebaseio.com') ||
        event.request.url.includes('googleapis.com')||
        event.request.url.includes('apis.google.com') || // ✅ AJOUTER CETTE LIGNE
        event.request.url.includes('accounts.google.com') || // ✅ AJOUTER CETTE LIGNE
        event.request.url.includes('securetoken.googleapis.com') || // ✅ AJOUTER CETTE LIGNE
        event.request.url.includes('identitytoolkit.googleapis.com')) { // ✅ AJOUTER CETTE LIGNE
        
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
            .catch(() => {
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});

// ============================================
// GESTION DES CLICS SUR NOTIFICATIONS
// ============================================
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification cliquée:', event);

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes(self.registration.scope) && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

// ============================================
// MESSAGES DE L'APPLICATION
// ============================================
self.addEventListener('message', (event) => {
    console.log('[SW] Message reçu:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('[SW] Service Worker chargé');