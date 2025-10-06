// Import Firebase SDK (version 10.x)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getDatabase,
    ref,
    set,
    onValue,
    push,
    update,
    serverTimestamp,
    get
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import {
    getMessaging,
    getToken,
    onMessage
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';

// CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyB7DwtpC_RggBLkW0w2yHOOGxrXHpyWPfE",
    authDomain: "traficday-91045.firebaseapp.com",
    databaseURL: "https://traficday-91045-default-rtdb.firebaseio.com",
    projectId: "traficday-91045",
    storageBucket: "traficday-91045.firebasestorage.app",
    messagingSenderId: "230009461919",
    appId: "1:230009461919:web:bc09e90d723f66a84556aa"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const messaging = getMessaging(app);

console.log('✅ Firebase initialisé');

// ============================================
// AUTHENTIFICATION
// ============================================

export async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        return { success: true, user: result.user };
    } catch (error) {
        console.error('Erreur connexion Google:', error);
        return { success: false, error: error.message };
    }
}

export async function logout() {
    try {
        await firebaseSignOut(auth);
        return { success: true };
    } catch (error) {
        console.error('Erreur déconnexion:', error);
        return { success: false, error: error.message };
    }
}

export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}

// ============================================
// OBSTACLES
// ============================================

export async function addObstacle(obstacleData) {
    try {
        const obstaclesRef = ref(database, 'obstacles');
        const newObstacleRef = push(obstaclesRef);

        await set(newObstacleRef, {
            ...obstacleData,
            timestamp: Date.now(),
            active: true
        });

        return { success: true, id: newObstacleRef.key };
    } catch (error) {
        console.error('Erreur ajout obstacle:', error);
        return { success: false, error: error.message };
    }
}

export function listenToObstacles(callback) {
    const obstaclesRef = ref(database, 'obstacles');

    return onValue(obstaclesRef, (snapshot) => {
        const data = snapshot.val();
        const obstacles = [];

        if (data) {
            Object.keys(data).forEach((key) => {
                if (data[key].active !== false) {
                    obstacles.push({
                        id: key,
                        ...data[key]
                    });
                }
            });
        }

        callback(obstacles);
    });
}

export async function confirmObstacle(obstacleId, userId) {
    try {
        const obstacleRef = ref(database, `obstacles/${obstacleId}`);

        // Récupérer l'obstacle actuel
        const snapshot = await new Promise((resolve) => {
            onValue(obstacleRef, resolve, { onlyOnce: true });
        });

        const obstacle = snapshot.val();
        if (!obstacle) return { success: false, error: 'Obstacle non trouvé' };

        const confirmedBy = obstacle.confirmedBy || [obstacle.userId];
        if (confirmedBy.includes(userId)) {
            return { success: false, error: 'Déjà confirmé' };
        }

        await update(obstacleRef, {
            reports: (obstacle.reports || 1) + 1,
            confirmedBy: [...confirmedBy, userId]
        });

        return { success: true };
    } catch (error) {
        console.error('Erreur confirmation:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// UTILISATEURS
// ============================================

export async function createUserProfile(user) {
    try {
        const userRef = ref(database, `users/${user.uid}`);
        await set(userRef, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastLogin: Date.now()
        });
        return { success: true };
    } catch (error) {
        console.error('Erreur création profil:', error);
        return { success: false, error: error.message };
    }
}

export async function saveUserLocation(userId, lat, lng) {
    try {
        const userLocationRef = ref(database, `users/${userId}/location`);
        await set(userLocationRef, {
            lat,
            lng,
            timestamp: Date.now()
        });
        return { success: true };
    } catch (error) {
        console.error('Erreur sauvegarde position:', error);
        return { success: false, error: error.message };
    }
}

export async function saveUserFCMToken(userId, token) {
    try {
        const userTokenRef = ref(database, `users/${userId}/fcmToken`);
        await set(userTokenRef, token);
        return { success: true };
    } catch (error) {
        console.error('Erreur sauvegarde token:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// NOTIFICATIONS
// ============================================

export async function requestNotificationToken() {
    try {
        const token = await getToken(messaging, {
            vapidKey: 'BIL4dNbV90yM_ulonvJibpWlbV7IOOHyeE2JFgHJnf48Qqzr3kUaai0MxoR2byoO5n4Wpy6I4sd5SuezQ3eTrbU'
        });
        console.log('✅ FCM Token obtenu:', token);
        return { success: true, token };
    } catch (error) {
        console.error('Erreur token FCM:', error);
        return { success: false, error: error.message };
    }
}

// Écouter les messages en foreground
onMessage(messaging, (payload) => {
    console.log('📩 Message reçu:', payload);

    // Afficher une notification locale
    if (Notification.permission === 'granted') {
        const { title, body, icon } = payload.notification || {};
        new Notification(title || 'TraficDay', {
            body: body || 'Nouvelle alerte routière',
            icon: icon || '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            vibrate: [200, 100, 200]
        });
    }
});

// Récupérer les utilisateurs dans un rayon donné
export async function getUsersInRadius(lat, lng, radiusKm = 1.6) {
    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);

        if (!snapshot.exists()) {
            return { success: true, users: [] };
        }

        const users = [];
        const data = snapshot.val();

        Object.keys(data).forEach(userId => {
            const user = data[userId];
            if (user.location && user.fcmToken) {
                const distance = calculateDistance(
                    lat, lng,
                    user.location.lat, user.location.lng
                );

                if (distance <= radiusKm) {
                    users.push({
                        userId,
                        fcmToken: user.fcmToken,
                        distance
                    });
                }
            }
        });

        return { success: true, users };
    } catch (error) {
        console.error('Erreur récupération utilisateurs:', error);
        return { success: false, error: error.message };
    }
}

// Calculer la distance entre deux points (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Créer une notification pour un obstacle
export async function createObstacleNotification(obstacleId, obstacleData) {
    try {
        const notificationRef = ref(database, `notifications/${obstacleId}`);
        await set(notificationRef, {
            obstacleId,
            type: obstacleData.type,
            lat: obstacleData.lat,
            lng: obstacleData.lng,
            description: obstacleData.description,
            reports: obstacleData.reports,
            timestamp: Date.now(),
            sent: false
        });
        return { success: true };
    } catch (error) {
        console.error('Erreur création notification:', error);
        return { success: false, error: error.message };
    }
}