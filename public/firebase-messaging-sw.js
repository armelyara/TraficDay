// Firebase Cloud Messaging Service Worker
// This service worker handles background notifications when the app is not active

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

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification?.title || 'TraficDay';
    const notificationOptions = {
        body: payload.notification?.body || 'Nouvelle alerte',
        icon: '../icons/icon-192.png',
        badge: '../icons/icon-72.png',
        tag: payload.data?.obstacleId || 'traficday-notification',
        data: payload.data,
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

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked:', event);

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // Open the app when notification is clicked
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // If app is already open, focus it
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes(self.registration.scope) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open new window
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});
