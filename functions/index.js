const {onValueCreated} = require('firebase-functions/v2/database');
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

// Function initiated when a new notification is created
exports.sendObstacleNotification = onValueCreated(
    '/notifications/{notificationId}',
    async (event) => {
        const snapshot = event.data;
        const {notificationId} = event.params;
        const notification = snapshot.val();
        const { obstacleId, type, lat, lng, description, reports } = notification;

        console.log('📩 Nouvelle notification à envoyer:', obstacleId);

        // Check if the notification has already been sent
        if (reports < 2) {
            console.log('⚠️ Obstacle n\'a pas assez de confirmations:', reports);
            return null;
        }

        try {
            // Retrieve all users
            const usersSnapshot = await admin.database().ref('users').once('value');
            const users = usersSnapshot.val();

            if (!users) {
                console.log('⚠️ Aucun utilisateur trouvé');
                return null;
            }

            const tokens = [];
            const radiusKm = 1.6; // 1 mile ≈ 1.6 km

            // Filter users within the radius
            Object.keys(users).forEach(userId => {
                const user = users[userId];

                // Check if user has location and fcmToken
                if (user.location && user.fcmToken) {
                    const distance = calculateDistance(
                        lat, lng,
                        user.location.lat, user.location.lng
                    );

                    if (distance <= radiusKm) {
                        tokens.push(user.fcmToken);
                        console.log(`Utilisateur ${userId} dans le rayon (${distance.toFixed(2)} km)`);
                    }
                }
            });

            if (tokens.length === 0) {
                console.log('⚠️ Aucun utilisateur dans le rayon');
                return null;
            }

            // Préparer le message
            const obstacleLabel = obstacleLabels[type] || 'Obstacle';
            const message = {
                notification: {
                    title: `⚠️ ${obstacleLabel} signalé`,
                    body: `${description} - ${reports} confirmations`,
                    icon: '/icons/icon-192.png',
                    badge: '/icons/icon-72.png'
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

            // Send the notification
            const response = await admin.messaging().sendMulticast(message);

            console.log(`{response.successCount} notifications envoyées sur ${tokens.length}`);

            // Mark notification as sent
            await admin.database().ref(`/notifications/${notificationId}`).update({ sent: true, sentAt: Date.now() });

            // Delete invalid tokens
            if (response.failureCount > 0) {
                const cleanupPromises = [];

                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        const errorCode = resp.error?.code;
                        const token = tokens[idx];

                        console.error('Erreur envoi:', resp.error);

                        // Delete the invalid token from all users
                        if (errorCode === 'messaging/invalid-registration-token' ||
                            errorCode === 'messaging/registration-token-not-registered') {

                            // Find user(s) with this token
                            const userQuery = admin.database()
                                .ref('users')
                                .orderByChild('fcmToken')
                                .equalTo(token);

                            cleanupPromises.push(
                                userQuery.once('value').then(snapshot => {
                                    snapshot.forEach(child => {
                                        console.log(`Suppression token invalide pour user: ${child.key}`);
                                        child.ref.child('fcmToken').remove();
                                    });
                                })
                            );
                        }
                    }
                });

                // Execute the cleanup
                if (cleanupPromises.length > 0) {
                    await Promise.all(cleanupPromises);
                    console.log(`${cleanupPromises.length} tokens invalides nettoyés`);
                }
            }

            return response;
        } catch (error) {
            console.error('Erreur envoi notification:', error);
            return null;
        }
    }
);
