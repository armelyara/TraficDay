const {onValueCreated} = require('firebase-functions/v2/database');
const admin = require('firebase-admin');

admin.initializeApp();

// Fonction pour calculer la distance entre deux points (Haversine)
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

// Labels pour les types d'obstacles
const obstacleLabels = {
    flood: 'Inondation',
    protest: 'Manifestation',
    closure: 'Route fermée',
    traffic: 'Embouteillage',
    police: 'Police routière'
};

// Fonction déclenchée lors de la création d'une notification (Cloud Functions v2)
exports.sendObstacleNotification = onValueCreated(
    '/notifications/{notificationId}',
    async (event) => {
        const snapshot = event.data;
        const {notificationId} = event.params;
        const notification = snapshot.val();
        const { obstacleId, type, lat, lng, description, reports } = notification;

        console.log('📩 Nouvelle notification à envoyer:', obstacleId);

        // Vérifier que l'obstacle a au moins 2 confirmations
        if (reports < 2) {
            console.log('⚠️ Obstacle n\'a pas assez de confirmations:', reports);
            return null;
        }

        try {
            // Récupérer tous les utilisateurs
            const usersSnapshot = await admin.database().ref('users').once('value');
            const users = usersSnapshot.val();

            if (!users) {
                console.log('⚠️ Aucun utilisateur trouvé');
                return null;
            }

            const tokens = [];
            const radiusKm = 1.6; // 1 mile ≈ 1.6 km

            // Filtrer les utilisateurs dans le rayon
            Object.keys(users).forEach(userId => {
                const user = users[userId];

                // Vérifier que l'utilisateur a une position et un token
                if (user.location && user.fcmToken) {
                    const distance = calculateDistance(
                        lat, lng,
                        user.location.lat, user.location.lng
                    );

                    if (distance <= radiusKm) {
                        tokens.push(user.fcmToken);
                        console.log(`✅ Utilisateur ${userId} dans le rayon (${distance.toFixed(2)} km)`);
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

            // Envoyer les notifications
            const response = await admin.messaging().sendMulticast(message);

            console.log(`✅ ${response.successCount} notifications envoyées sur ${tokens.length}`);

            // Marquer la notification comme envoyée
            await admin.database().ref(`/notifications/${notificationId}`).update({ sent: true, sentAt: Date.now() });

            // Supprimer les tokens invalides
            if (response.failureCount > 0) {
                const cleanupPromises = [];

                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        const errorCode = resp.error?.code;
                        const token = tokens[idx];

                        console.error('❌ Erreur envoi:', resp.error);

                        // Supprimer les tokens invalides ou expirés
                        if (errorCode === 'messaging/invalid-registration-token' ||
                            errorCode === 'messaging/registration-token-not-registered') {

                            // Trouver et supprimer le token de la base
                            const userQuery = admin.database()
                                .ref('users')
                                .orderByChild('fcmToken')
                                .equalTo(token);

                            cleanupPromises.push(
                                userQuery.once('value').then(snapshot => {
                                    snapshot.forEach(child => {
                                        console.log(`🧹 Suppression token invalide pour user: ${child.key}`);
                                        child.ref.child('fcmToken').remove();
                                    });
                                })
                            );
                        }
                    }
                });

                // Exécuter tous les nettoyages
                if (cleanupPromises.length > 0) {
                    await Promise.all(cleanupPromises);
                    console.log(`🧹 ${cleanupPromises.length} tokens invalides nettoyés`);
                }
            }

            return response;
        } catch (error) {
            console.error('❌ Erreur envoi notification:', error);
            return null;
        }
    }
);
