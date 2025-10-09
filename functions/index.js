const { onValueCreated, onValueWritten } = require('firebase-functions/v2/database');
const admin = require('firebase-admin');

admin.initializeApp();

// Calculate distance between two coordinates
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

// Labels for obstacle types
const obstacleLabels = {
    flood: '🌊 Inondation',
    protest: '📢 Manifestation',
    closure: '🚧 Route fermée',
    traffic: '🚗 Embouteillage',
    police: '👮 Police routière'
};

// FLOW 1: Triggered when a NEW obstacle is created
exports.checkForDuplicateAlerts = onValueCreated(
    '/obstacles/{obstacleId}',
    async (event) => {
        const obstacleId = event.params.obstacleId;
        const newObstacle = event.data.val();
        const { type, lat, lng, userId } = newObstacle;

        console.log('🔍 Nouvel obstacle créé:', obstacleId, 'Type:', type);

        try {
            // Récupérer TOUS les obstacles actifs
            const obstaclesSnapshot = await admin.database().ref('obstacles').once('value');
            const allObstacles = obstaclesSnapshot.val();

            if (!allObstacles) {
                console.log('⚠️ Aucun autre obstacle trouvé');
                return null;
            }

            // Trouver les obstacles du MÊME TYPE dans un rayon de 500m
            const DETECTION_RADIUS = 0.5; // 500 mètres
            const sameTypeNearby = [];
            const reportingUsers = [userId]; // Users qui ont signalé

            Object.keys(allObstacles).forEach(id => {
                const obstacle = allObstacles[id];

                // Ignorer l'obstacle actuel
                if (id === obstacleId) return;

                // Même type ET actif
                if (obstacle.type === type && obstacle.active) {
                    const distance = calculateDistance(lat, lng, obstacle.lat, obstacle.lng);

                    if (distance <= DETECTION_RADIUS) {
                        sameTypeNearby.push({ id, obstacle, distance });
                        reportingUsers.push(obstacle.userId);
                        console.log(`✅ Obstacle similaire trouvé: ${id} à ${distance.toFixed(2)}km`);
                    }
                }
            });

            console.log(`📊 Total obstacles ${type} dans la zone: ${sameTypeNearby.length + 1}`);

            // Si c'est le 2ème obstacle du même type dans la zone → ENVOYER NOTIFICATION
            if (sameTypeNearby.length === 1) {
                console.log('🚨 2 alertes détectées ! Envoi des notifications...');

                // Récupérer tous les users
                const usersSnapshot = await admin.database().ref('users').once('value');
                const users = usersSnapshot.val();

                if (!users) {
                    console.log('⚠️ Aucun utilisateur trouvé');
                    return null;
                }

                const tokens = [];
                const NOTIFICATION_RADIUS = 1.6; // 1.6 km

                // Filtrer users dans le rayon ET exclure ceux qui ont signalé
                Object.keys(users).forEach(uid => {
                    const user = users[uid];

                    // Exclure users qui ont déjà signalé
                    if (reportingUsers.includes(uid)) {
                        console.log(`⏭️ User ${uid} exclu (a signalé)`);
                        return;
                    }

                    // Vérifier location et token
                    if (user.location && user.notificationToken) {
                        const distance = calculateDistance(
                            lat, lng,
                            user.location.lat, user.location.lng
                        );

                        if (distance <= NOTIFICATION_RADIUS) {
                            tokens.push(user.notificationToken);
                            console.log(`✅ User ${uid} ajouté (${distance.toFixed(2)}km)`);
                        }
                    }
                });

                if (tokens.length === 0) {
                    console.log('⚠️ Aucun utilisateur à notifier');
                    return null;
                }

                // Préparer et envoyer le message
                const obstacleLabel = obstacleLabels[type] || 'Obstacle';
                const message = {
                    notification: {
                        title: `🚨 Alerte confirmée : ${obstacleLabel}`,
                        body: `2 signalements dans votre zone. Soyez vigilant !`,
                        icon: '/icons/android/icon-192.png',
                        badge: '/icons/android/icon-72.png'
                    },
                    data: {
                        obstacleId: obstacleId,
                        type: type,
                        lat: lat.toString(),
                        lng: lng.toString(),
                        click_action: '/'
                    },
                    tokens: tokens
                };

                const response = await admin.messaging().sendEachForMulticast(message);

                console.log(`✅ ${response.successCount} notifications envoyées sur ${tokens.length}`);

                if (response.failureCount > 0) {
                    console.log(`⚠️ ${response.failureCount} échecs`);
                }

                // Marquer dans la database que notification a été envoyée
                await admin.database().ref(`obstacles/${obstacleId}/notificationSent`).set(true);
                await admin.database().ref(`obstacles/${obstacleId}/notifiedUsers`).set(tokens.length);

                return null;
            } else {
                console.log(`ℹ️ Seulement ${sameTypeNearby.length + 1} alerte(s) de type ${type} dans la zone`);
                return null;
            }

        } catch (error) {
            console.error('❌ Erreur:', error);
            return null;
        }
    }
);

// FLOW 2: Subscribe user to "all" topic when token is created/updated
exports.subscribeToAllTopic = onValueWritten(
    '/users/{userId}/notificationToken',
    async (event) => {
        const token = event.data.after.val();
        const previousToken = event.data.before.val();
        const userId = event.params.userId;

        if (!token || token === previousToken) {
            return null;
        }

        try {
            await admin.messaging().subscribeToTopic([token], 'all');
            console.log(`✅ User ${userId} abonné au topic "all"`);

            await admin.database().ref(`users/${userId}/subscribedToAll`).set(true);
            return null;
        } catch (error) {
            console.error(`❌ Erreur abonnement:`, error);
            return null;
        }
    }
);