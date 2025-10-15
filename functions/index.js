const { onValueCreated, onValueWritten } = require('firebase-functions/v2/database');
const { onSchedule } = require('firebase-functions/v2/scheduler');
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
    accident: 'Accident',
    protest: 'Manifestation',
    closure: 'Route fermée',
    traffic: 'Embouteillage',
    police: 'Police routière'
};


// FUNCTION 1: Send notification when obstacle confirmed

exports.sendObstacleNotification = onValueCreated(
    '/notifications/{notificationId}',
    async (event) => {
        const snapshot = event.data;
        const { notificationId } = event.params;
        const notification = snapshot.val();
        const { obstacleId, type, lat, lng, description, reports } = notification;

        console.log('Nouvelle notification à envoyer:', obstacleId);

        // Check if the notification has enough confirmations
        if (reports < 2) {
            console.log('Obstacle n\'a pas assez de confirmations:', reports);
            return null;
        }

        try {
            // Retrieve the obstacle to get confirmedBy users
            const obstacleSnapshot = await admin.database().ref(`obstacles/${obstacleId}`).once('value');
            const obstacle = obstacleSnapshot.val();
            const confirmedByUsers = obstacle?.confirmedBy ? Object.keys(obstacle.confirmedBy) : [];

            console.log('Utilisateurs ayant confirmé:', confirmedByUsers);

            // Retrieve all users
            const usersSnapshot = await admin.database().ref('users').once('value');
            const users = usersSnapshot.val();

            if (!users) {
                console.log('Aucun utilisateur trouvé');
                return null;
            }

            const tokens = [];
            const radiusKm = 1.6; // 1 mile

            // Find users: in radius OR subscribed to "all" topic
            Object.keys(users).forEach(uid => {
                const user = users[uid];

                // Skip users who confirmed the obstacle
                if (confirmedByUsers.includes(uid)) {
                    console.log('⏭️ User skip (confirmé):', uid);
                    return;
                }

                // Check if user has token
                if (!user.notificationToken) {
                    return;
                }

                // CASE 1: Users within radius (inside area)
                if (user.location) {
                    const distance = calculateDistance(
                        lat,
                        lng,
                        user.location.lat,
                        user.location.lng
                    );

                    if (distance <= radiusKm) {
                        tokens.push(user.notificationToken);
                        console.log('✅ User dans rayon:', uid, `(${distance.toFixed(2)}km)`);
                        return; // Don't check "all" topic if already in radius
                    }
                }

                // CASE 2: Users outside area but subscribed to "all" topic
                if (user.subscribedToAll === true) {
                    tokens.push(user.notificationToken);
                    console.log('✅ User "all" topic (outside):', uid);
                }
            });

            if (tokens.length === 0) {
                console.log('⚠️ Aucun utilisateur à proximité ou abonné au topic "all"');
                return null;
            }

            // Send notification
            const message = {
                notification: {
                    title: `${obstacleLabels[type]}`,
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
            console.log('Notifications envoyées:', response.successCount, '/', tokens.length);

            if (response.failureCount > 0) {
                console.log('Échecs:', response.failureCount);
            }

            return { success: true, sent: response.successCount };
        } catch (error) {
            console.error('Erreur envoi notification:', error);
            return null;
        }
    }
);


// FUNCTION 2: Check for duplicate alerts when obstacle created

exports.checkForDuplicateAlerts = onValueCreated(
    '/obstacles/{obstacleId}',
    async (event) => {
        const snapshot = event.data;
        const newObstacle = snapshot.val();
        const { obstacleId } = event.params;

        console.log('Nouvel obstacle créé:', obstacleId);

        try {
            // Get all obstacles
            const obstaclesSnapshot = await admin.database().ref('obstacles').once('value');
            const obstacles = obstaclesSnapshot.val();

            if (!obstacles) {
                console.log('Aucun autre obstacle trouvé');
                return null;
            }

            const DUPLICATE_RADIUS = 0.05; // 50m (approximately)
            let primaryObstacleId = null;
            let minDistance = Infinity;

            // Find closest similar obstacle (potential primary)
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

                    if (distance <= DUPLICATE_RADIUS && distance < minDistance) {
                        // Found a closer primary obstacle
                        if (obstacle.isPrimary !== false) {
                            primaryObstacleId = oid;
                            minDistance = distance;
                        }
                    }
                }
            });

            // If duplicate found, link it to primary
            if (primaryObstacleId) {
                console.log('Duplicate détecté! Lien vers obstacle primaire:', primaryObstacleId, `(${(minDistance * 1000).toFixed(0)}m)`);

                // Mark new obstacle as duplicate
                await admin.database().ref(`obstacles/${obstacleId}`).update({
                    isPrimary: false,
                    linkedTo: primaryObstacleId
                });

                // Link to primary obstacle
                await admin.database().ref(`obstacles/${primaryObstacleId}/linkedObstacles/${obstacleId}`).set(true);

                // Add reporter to primary obstacle's confirmedBy
                if (newObstacle.userId) {
                    await admin.database().ref(`obstacles/${primaryObstacleId}/confirmedBy/${newObstacle.userId}`).set(true);
                    console.log('Utilisateur ajouté aux confirmations:', newObstacle.userId);
                }

                // Check if threshold reached for notification
                const primarySnapshot = await admin.database().ref(`obstacles/${primaryObstacleId}`).once('value');
                const primaryObstacle = primarySnapshot.val();
                const totalConfirmations = primaryObstacle.confirmedBy ? Object.keys(primaryObstacle.confirmedBy).length : 0;
                const totalLinked = primaryObstacle.linkedObstacles ? Object.keys(primaryObstacle.linkedObstacles).length : 0;

                // Update confirmations count to match confirmedBy
                await admin.database().ref(`obstacles/${primaryObstacleId}/confirmations`).set(totalConfirmations);
                console.log(`Confirmations count updated: ${totalConfirmations}`);

                console.log(`Obstacle primaire: ${totalConfirmations} confirmations, ${totalLinked} obstacles liés`);

                // Trigger notification if threshold reached (2 reports)
                if (totalConfirmations >= 2 && !primaryObstacle.notificationSent) {
                    console.log('Seuil atteint! Création de la notification...');

                    await admin.database().ref(`notifications/${primaryObstacleId}`).set({
                        obstacleId: primaryObstacleId,
                        type: primaryObstacle.type,
                        lat: primaryObstacle.lat,
                        lng: primaryObstacle.lng,
                        description: primaryObstacle.description,
                        reports: totalConfirmations,
                        timestamp: Date.now()
                    });

                    // Mark as notification sent
                    await admin.database().ref(`obstacles/${primaryObstacleId}/notificationSent`).set(true);
                }

                return { checked: true, isDuplicate: true, linkedTo: primaryObstacleId };
            } else {
                console.log('Pas de duplicate trouvé - obstacle primaire');
                return { checked: true, isDuplicate: false };
            }
        } catch (error) {
            console.error('Erreur vérification duplicata:', error);
            return null;
        }
    }
);


// FUNCTION 3: Subscribe user to "all" topic when they get a token

exports.subscribeToAllTopic = onValueWritten(
    '/users/{userId}/notificationToken',
    async (event) => {
        const { userId } = event.params;
        const token = event.data.after.val();

        if (!token) {
            console.log('Token supprimé pour:', userId);
            return null;
        }

        console.log('Nouveau token pour:', userId);

        try {
            // Subscribe to "all" topic
            await admin.messaging().subscribeToTopic(token, 'all');
            console.log('Utilisateur abonné au topic "all":', userId);

            return { success: true };
        } catch (error) {
            console.error('Erreur abonnement topic:', error);
            return null;
        }
    }
);


// FUNCTION 4: Send proximity notification when user enters danger zone
// Triggered when a record is created in /proximityAlerts/{userId}/{alertId}

exports.sendProximityNotification = onValueCreated(
    '/proximityAlerts/{userId}/{alertId}',
    async (event) => {
        const snapshot = event.data;
        const { userId, alertId } = event.params;
        const alert = snapshot.val();
        const { obstacleId, obstacleType, severity, distance } = alert;

        console.log('Proximity alert triggered for user:', userId);

        try {
            // Get user's FCM token
            const userSnapshot = await admin.database().ref(`users/${userId}`).once('value');
            const user = userSnapshot.val();

            if (!user || !user.notificationToken) {
                console.log('User has no FCM token');
                // Clean up the alert record
                await admin.database().ref(`proximityAlerts/${userId}/${alertId}`).remove();
                return null;
            }

            const token = user.notificationToken;

            // Format distance
            const distanceText = distance < 1
                ? `${Math.round(distance * 1000)}m`
                : `${distance.toFixed(1)}km`;

            // Map severity to danger level labels
            const dangerLabels = {
                low: { icon: '⚠️', label: 'Prudence', desc: 'Circulation autorisée' },
                medium: { icon: '🟠', label: 'Vérifier avant', desc: 'Vérifier les conditions' },
                high: { icon: '🔴', label: 'Danger', desc: 'Circulation interdite' },
                critical: { icon: '🔴', label: 'Danger', desc: 'Circulation interdite' }
            };

            const info = dangerLabels[severity] || dangerLabels.medium;

            const title = `${info.icon} ${info.label}`;
            const body = `${obstacleLabels[obstacleType]} à ${distanceText} - ${info.desc}`;

            // Send FCM notification
            const message = {
                notification: {
                    title: title,
                    body: body
                },
                data: {
                    type: 'proximity',
                    obstacleId: obstacleId,
                    obstacleType: obstacleType,
                    severity: severity,
                    distance: distance.toString()
                },
                token: token
            };

            await admin.messaging().send(message);
            console.log('Proximity notification sent to user:', userId);

            // Clean up the alert record (it's processed)
            await admin.database().ref(`proximityAlerts/${userId}/${alertId}`).remove();

            return { success: true };
        } catch (error) {
            console.error('Erreur proximity notification:', error);
            // Clean up the alert record even on error
            await admin.database().ref(`proximityAlerts/${userId}/${alertId}`).remove();
            return null;
        }
    }
);


// FUNCTION 5: Auto-delete expired obstacles (runs every 15 minutes)

exports.cleanupExpiredObstacles = onSchedule(
    {
        schedule: 'every 15 minutes',
        timeZone: 'Africa/Abidjan'
    },
    async (event) => {
        console.log('Démarrage nettoyage des obstacles expirés...');

        try {
            const now = Date.now();
            const obstaclesSnapshot = await admin.database().ref('obstacles').once('value');
            const obstacles = obstaclesSnapshot.val();

            if (!obstacles) {
                console.log('Aucun obstacle à vérifier');
                return null;
            }

            let expiredCount = 0;
            let resolvedCount = 0;

            // Check each obstacle
            for (const obstacleId in obstacles) {
                const obstacle = obstacles[obstacleId];

                // Skip if already inactive
                if (obstacle.active === false) {
                    continue;
                }

                // Check if expired by time
                if (obstacle.expiresAt && now >= obstacle.expiresAt) {
                    console.log(`Obstacle expiré (temps): ${obstacleId}`);
                    await admin.database().ref(`obstacles/${obstacleId}`).update({
                        active: false,
                        deletedReason: 'expired',
                        deletedAt: now
                    });
                    expiredCount++;
                }

                // Check if resolved by community (resolvedCount >= 5)
                if (obstacle.resolvedCount && obstacle.resolvedCount >= 5) {
                    console.log(`Obstacle résolu (communauté): ${obstacleId} (${obstacle.resolvedCount} résolutions)`);
                    await admin.database().ref(`obstacles/${obstacleId}`).update({
                        active: false,
                        deletedReason: 'resolved',
                        deletedAt: now
                    });
                    resolvedCount++;
                }
            }

            console.log(`Nettoyage terminé: ${expiredCount} expirés, ${resolvedCount} résolus`);
            return {
                success: true,
                expired: expiredCount,
                resolved: resolvedCount
            };
        } catch (error) {
            console.error('Erreur nettoyage obstacles:', error);
            return null;
        }
    }
);