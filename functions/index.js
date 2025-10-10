const { onValueCreated, onValueWritten } = require('firebase-functions/v2/database');
const admin = require('firebase-admin');

admin.initializeApp();

// Function to calculate distance between two coordinates using Haversine formula
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
    flood: 'Inondation',
    protest: 'Manifestation',
    closure: 'Route fermée',
    traffic: 'Embouteillage',
    police: 'Police routière'
};

// ========================================
// FUNCTION 1: Send notification when obstacle confirmed
// ========================================
exports.sendObstacleNotification = onValueCreated(
    '/notifications/{notificationId}',
    async (event) => {
        const snapshot = event.data;
        const { notificationId } = event.params;
        const notification = snapshot.val();
        const { obstacleId, type, lat, lng, description, reports } = notification;

        console.log('📩 Nouvelle notification à envoyer:', obstacleId);

        // Check if the notification has enough confirmations
        if (reports < 2) {
            console.log('⚠️ Obstacle n\'a pas assez de confirmations:', reports);
            return null;
        }

        try {
            // Retrieve the obstacle to get confirmedBy users
            const obstacleSnapshot = await admin.database().ref(`obstacles/${obstacleId}`).once('value');
            const obstacle = obstacleSnapshot.val();
            const confirmedByUsers = obstacle?.confirmedBy ? Object.keys(obstacle.confirmedBy) : [];

            console.log('👥 Utilisateurs ayant confirmé:', confirmedByUsers);

            // Retrieve all users
            const usersSnapshot = await admin.database().ref('users').once('value');
            const users = usersSnapshot.val();

            if (!users) {
                console.log('⚠️ Aucun utilisateur trouvé');
                return null;
            }

            const tokens = [];
            const radiusKm = 1.6; // 1 mile

            // Find users within radius
            Object.keys(users).forEach(uid => {
                const user = users[uid];

                // Skip users who confirmed the obstacle
                if (confirmedByUsers.includes(uid)) {
                    console.log('⏭️ User skip (confirmé):', uid);
                    return;
                }

                // Check if user has location and token
                if (user.location && user.notificationToken) {
                    const distance = calculateDistance(
                        lat,
                        lng,
                        user.location.lat,
                        user.location.lng
                    );

                    if (distance <= radiusKm) {
                        tokens.push(user.notificationToken);
                        console.log('✅ User dans rayon:', uid, `(${distance.toFixed(2)}km)`);
                    }
                }
            });

            if (tokens.length === 0) {
                console.log('⚠️ Aucun utilisateur à proximité avec token');
                return null;
            }

            // Send notification
            const message = {
                notification: {
                    title: `🚨 ${obstacleLabels[type]}`,
                    body: `${description || 'Obstacle signalé'} - ${reports} confirmations`
                },
                data: {
                    obstacleId: obstacleId,
                    type: type,
                    lat: lat.toString(),
                    lng: lng.toString()
                },
                tokens: tokens
            };

            const response = await admin.messaging().sendEachForMulticast(message);
            console.log('✅ Notifications envoyées:', response.successCount, '/', tokens.length);

            if (response.failureCount > 0) {
                console.log('⚠️ Échecs:', response.failureCount);
            }

            return { success: true, sent: response.successCount };
        } catch (error) {
            console.error('❌ Erreur envoi notification:', error);
            return null;
        }
    }
);

// ========================================
// FUNCTION 2: Check for duplicate alerts when obstacle created
// ========================================
exports.checkForDuplicateAlerts = onValueCreated(
    '/obstacles/{obstacleId}',
    async (event) => {
        const snapshot = event.data;
        const newObstacle = snapshot.val();
        const { obstacleId } = event.params;

        console.log('🔍 Nouvel obstacle créé:', obstacleId);

        try {
            // Get all obstacles
            const obstaclesSnapshot = await admin.database().ref('obstacles').once('value');
            const obstacles = obstaclesSnapshot.val();

            if (!obstacles) {
                console.log('ℹ️ Aucun autre obstacle trouvé');
                return null;
            }

            const DUPLICATE_RADIUS = 0.05; // 50m
            let foundSimilar = false;

            // Check for similar obstacles
            Object.keys(obstacles).forEach(oid => {
                if (oid === obstacleId) return; // Skip self

                const obstacle = obstacles[oid];

                // Check type match and active status
                if (obstacle.type === newObstacle.type && obstacle.active) {
                    const distance = calculateDistance(
                        newObstacle.lat,
                        newObstacle.lng,
                        obstacle.lat,
                        obstacle.lng
                    );

                    if (distance <= DUPLICATE_RADIUS) {
                        console.log('✅ Obstacle similaire trouvé:', oid, `(${(distance * 1000).toFixed(0)}m)`);
                        foundSimilar = true;
                    }
                }
            });

            console.log('📊 Total obstacles:', Object.keys(obstacles).length);
            console.log('🎯 Similaires trouvés:', foundSimilar ? 'Oui' : 'Non');

            return { checked: true, foundSimilar };
        } catch (error) {
            console.error('❌ Erreur vérification duplicata:', error);
            return null;
        }
    }
);

// ========================================
// FUNCTION 3: Subscribe user to "all" topic when they get a token
// ========================================
exports.subscribeToAllTopic = onValueWritten(
    '/users/{userId}/notificationToken',
    async (event) => {
        const { userId } = event.params;
        const token = event.data.after.val();

        if (!token) {
            console.log('⚠️ Token supprimé pour:', userId);
            return null;
        }

        console.log('🔔 Nouveau token pour:', userId);

        try {
            // Subscribe to "all" topic
            await admin.messaging().subscribeToTopic(token, 'all');
            console.log('✅ Utilisateur abonné au topic "all":', userId);

            return { success: true };
        } catch (error) {
            console.error('❌ Erreur abonnement topic:', error);
            return null;
        }
    }
);