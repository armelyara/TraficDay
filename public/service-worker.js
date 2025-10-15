// TraficDay Service Worker - Cache + Notifications FCM
const CACHE_VERSION = 'v3.2.0';
const CACHE_NAME = `traficday-cache-${CACHE_VERSION}`;

// Files to cache
const CACHE_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/firebase-config.js',
    '/config.js',
    '/manifest.json',
    '/logo.png',
    '/logo.ico',
    '/icons/android/icon-48.png',
    '/icons/android/icon-72.png',
    '/icons/android/icon-96.png',
    '/icons/android/icon-144.png',
    '/icons/android/icon-192.png',
    '/icons/android/icon-512.png'
];


// Firebase cloud messaging setup

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Firebase configuration
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

// Manage background messages
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

    // Show notification (when app is closed)
    console.log('[SW] Affichage notification push (app closed)');

    return self.registration.showNotification(notificationTitle, notificationOptions);
});


// Service Worker Installation

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


// Service Worker Activation

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


// Requestes fetch

self.addEventListener('fetch', (event) => {
    // Ignore requests to external services (Firebase, Google APIs, etc.)
    const url = event.request.url;

    if (url.includes('firebasestorage.googleapis.com') ||
        url.includes('firebaseinstallations.googleapis.com') ||
        url.includes('firebaseio.com') ||
        url.includes('googleapis.com') ||
        url.includes('apis.google.com') ||
        url.includes('accounts.google.com') ||
        url.includes('securetoken.googleapis.com') ||
        url.includes('identitytoolkit.googleapis.com') ||
        url.includes('gstatic.com') ||
        url.includes('maps.googleapis.com')) {
        return;
    }

    // Cache-first strategy for app shell files
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }

                // Otherwise fetch from network
                return fetch(event.request).then((networkResponse) => {
                    // Cache successful responses for future use
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                });
            })
            .catch(() => {
                // Offline fallback: return index.html for navigation requests
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});


// Manage notification clicks

self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification cliquée:', event);
    console.log('[SW] Notification data:', event.notification.data);

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const notificationType = event.notification.data?.type;
    const obstacleId = event.notification.data?.obstacleId;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Try to focus existing window
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes(self.registration.scope) && 'focus' in client) {
                        console.log('[SW] Focusing existing window');

                        // Send message to app about notification click
                        client.postMessage({
                            type: 'notificationClick',
                            notificationType: notificationType,
                            obstacleId: obstacleId
                        });

                        return client.focus();
                    }
                }

                // No existing window, open new one
                if (clients.openWindow) {
                    console.log('[SW] Opening new window');
                    return clients.openWindow('/');
                }
            })
    );
});


// App messages

self.addEventListener('message', (event) => {
    console.log('[SW] Message reçu:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('[SW] Service Worker chargé');