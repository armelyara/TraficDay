// AlerteRoute PWA - JavaScript Principal
// Import Firebase functions
import {
    loginWithGoogle,
    logout as firebaseLogout,
    onAuthChange,
    addObstacle as firebaseAddObstacle,
    listenToObstacles as firebaseListenToObstacles,
    confirmObstacle as firebaseConfirmObstacle,
    saveUserLocation,
    createUserProfile,
    requestNotificationToken,
    saveUserFCMToken,
    createObstacleNotification
} from './firebase-config.js';

// État global de l'application
const app = {
    user: null,
    userLocation: null,
    obstacles: [],
    dangerLevel: 'safe',
    notificationsEnabled: false,
    map: null,
    userMarker: null,
    obstacleMarkers: {}
};

// Constantes
const DANGER_LEVELS = {
    safe: {
        class: 'safe',
        icon: '',
        label: 'Zone sûre',
        description: 'Aucun danger signalé'
    },
    low: {
        class: 'low',
        icon: '🟢',
        label: 'Vigilance normale',
        description: 'Quelques obstacles mineurs'
    },
    medium: {
        class: 'medium',
        icon: '🟡',
        label: 'Attention requise',
        description: 'Obstacles modérés dans la zone'
    },
    high: {
        class: 'high',
        icon: '🟠',
        label: 'Danger élevé',
        description: 'Vigilance accrue requise'
    },
    critical: {
        class: 'critical',
        icon: '🔴',
        label: 'DANGER CRITIQUE',
        description: 'Zone dangereuse - Évitez si possible'
    }
};

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 AlerteRoute démarrage...');

    // Initialiser la carte Leaflet
    initMap();

    // Vérifier si l'utilisateur est connecté
    checkUser();

    // Initialiser la géolocalisation
    initGeolocation();

    // Charger les obstacles
    loadObstacles();

    // Attacher les événements
    attachEventListeners();

    // Enregistrer le Service Worker
    registerServiceWorker();

    // Masquer l'écran de chargement après 2 secondes
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';

        // Forcer le redimensionnement de la carte après l'affichage
        if (app.map) {
            setTimeout(() => {
                app.map.invalidateSize();
            }, 100);
        }
    }, 2000);
});

// ============================================
// CARTE LEAFLET
// ============================================

function initMap() {
    // Vérifier que Leaflet est chargé
    if (typeof L === 'undefined') {
        console.error('❌ Leaflet non chargé');
        setTimeout(initMap, 100);
        return;
    }

    // Créer la carte centrée sur Abidjan par défaut
    app.map = L.map('map', {
        zoomControl: true,
        attributionControl: true
    }).setView([5.345317, -4.024429], 13);

    // Ajouter les tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 3
    }).addTo(app.map);

    console.log('🗺️ Carte Leaflet initialisée');

    // Forcer le redimensionnement après un court délai
    setTimeout(() => {
        app.map.invalidateSize();
    }, 100);

    // Gérer le redimensionnement de la fenêtre (rotation mobile, etc.)
    window.addEventListener('resize', () => {
        if (app.map) {
            app.map.invalidateSize();
        }
    });
}

function updateUserMarker(lat, lng) {
    if (app.userMarker) {
        app.userMarker.setLatLng([lat, lng]);
    } else {
        // Créer un marqueur avec la couleur "zone sûre" pour l'utilisateur
        app.userMarker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'user-marker',
                html: `<div style="background: #43938A; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        }).addTo(app.map);
    }

    // Centrer la carte sur l'utilisateur uniquement s'il est connecté
    if (app.user) {
        app.map.setView([lat, lng], 15);
    }
}

// ============================================
// AUTHENTIFICATION
// ============================================

function promptLogin(action) {
    const messages = {
        report: 'Connectez-vous pour signaler un obstacle',
        confirm: 'Connectez-vous pour confirmer un obstacle',
        notifications: 'Connectez-vous pour activer les notifications'
    };

    alert(messages[action] || 'Connectez-vous pour continuer');
    openModal('auth-modal');
}

function checkUser() {
    // Écouter les changements d'authentification Firebase
    onAuthChange((user) => {
        if (user) {
            app.user = user;
            console.log('👤 Utilisateur connecté:', user.email);
            updateUIForAuthState(true);

            // Créer/mettre à jour le profil
            createUserProfile(user);

            // Sauvegarder la position si disponible
            if (app.userLocation) {
                saveUserLocation(user.uid, app.userLocation.lat, app.userLocation.lng);
            }
        } else {
            app.user = null;
            console.log('👤 Utilisateur déconnecté');
            updateUIForAuthState(false);
        }
    });
}
function updateUIForAuthState(isAuthenticated) {
    const guestBanner = document.getElementById('guest-banner');
    const btnAuth = document.getElementById('btn-auth');

    if (isAuthenticated) {
        guestBanner.style.display = 'none';
        btnAuth.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
    `;
    } else {
        guestBanner.style.display = 'block';
    }
}

async function login(provider) {
    console.log('🔐 Tentative de connexion avec:', provider);

    if (provider === 'google') {
        const result = await loginWithGoogle();

        if (result.success) {
            closeModal('auth-modal');
            alert('✅ Connexion réussie !');
            requestNotificationPermission();
        } else {
            alert('❌ Erreur de connexion : ' + result.error);
        }
    } else {
        // Email/Phone à implémenter plus tard
        alert('🚧 Connexion Email/Phone bientôt disponible');
    }
}

async function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        const result = await firebaseLogout();

        if (result.success) {
            alert('✅ Vous êtes déconnecté. Vous pouvez toujours consulter la carte.');
        } else {
            alert('❌ Erreur de déconnexion');
        }
    }
}

// ============================================
// GÉOLOCALISATION
// ============================================

function initGeolocation() {
    if (!navigator.geolocation) {
        console.error('❌ Géolocalisation non supportée');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            app.userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            console.log('📍 Position:', app.userLocation);
            updateUserMarker(app.userLocation.lat, app.userLocation.lng);
            calculateDangerLevel();

            // Sauvegarder la position si connecté
            if (app.user) {
                saveUserLocation(app.user.uid, app.userLocation.lat, app.userLocation.lng);
            }
        },
        (error) => {
            console.error('❌ Erreur géolocalisation:', error);
            // Montrer quand même la carte sans position
        }
    );

    // Suivre la position en continu
    navigator.geolocation.watchPosition(
        (position) => {
            app.userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            updateUserMarker(app.userLocation.lat, app.userLocation.lng);
            calculateDangerLevel();

            // Sauvegarder la position si connecté
            if (app.user) {
                saveUserLocation(app.user.uid, app.userLocation.lat, app.userLocation.lng);
            }
        },
        (error) => console.error('Erreur watch position:', error)
    );
}

function showUserPosition() {
    const userPositionEl = document.getElementById('user-position');
    if (userPositionEl) {
        userPositionEl.style.display = 'block';
    }
}

// ============================================
// OBSTACLES
// ============================================

function loadObstacles() {
    firebaseListenToObstacles((obstacles) => {
        app.obstacles = obstacles;
        renderObstacles();
        updateAlertsList();
        calculateDangerLevel();
        console.log('📊 Obstacles chargés:', obstacles.length);
    });
}

async function handleReport(type) {
    if (!app.userLocation) {
        alert('Veuillez activer la géolocalisation');
        return;
    }

    if (!app.user) {
        promptLogin('report');
        return;
    }

    const severities = {
        flood: 'high',
        protest: 'critical',
        closure: 'medium',
        traffic: 'medium',
        police: 'low'
    };

    const newObstacle = {
        type: type,
        lat: app.userLocation.lat,
        lng: app.userLocation.lng,
        description: `${getObstacleLabel(type)} signalé(e)`,
        reports: 1,
        severity: severities[type],
        zone: 'Ma zone',
        userId: app.user.uid,
        confirmedBy: [app.user.uid]
    };

    // Enregistrer dans Firebase
    const result = await firebaseAddObstacle(newObstacle);

    if (result.success) {
        closeModal('report-modal');
        alert(`✅ ${getObstacleLabel(type)} signalé(e) avec succès !`);
    } else {
        alert('❌ Erreur lors du signalement : ' + result.error);
    }
}

function renderObstacles() {
    // Vérifier que la carte est initialisée
    if (!app.map) {
        console.warn('⚠️ Carte non initialisée, impossible de rendre les obstacles');
        return;
    }

    // Supprimer tous les anciens marqueurs
    Object.values(app.obstacleMarkers).forEach(marker => {
        app.map.removeLayer(marker);
    });
    app.obstacleMarkers = {};

    // Ajouter les nouveaux marqueurs
    app.obstacles.forEach(obstacle => {
        createObstacleMarker(obstacle);
    });
}

function createObstacleMarker(obstacle) {
    const colors = {
        flood: '#3b82f6',
        protest: '#f97316',
        closure: '#dc2626',
        traffic: '#fbbf24',
        police: '#8b5cf6'
    };

    const color = colors[obstacle.type] || colors.traffic;
    const icon = getObstacleIcon(obstacle.type);

    const marker = L.marker([obstacle.lat, obstacle.lng], {
        icon: L.divIcon({
            className: 'obstacle-marker',
            html: `
                <div style="
                    background: ${color};
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    border: 3px solid white;
                    position: relative;
                ">
                    ${icon}
                    <div style="
                        position: absolute;
                        bottom: -8px;
                        right: -8px;
                        background: #1f2937;
                        color: white;
                        border-radius: 12px;
                        padding: 2px 6px;
                        font-size: 10px;
                        font-weight: bold;
                    ">${obstacle.reports}</div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        })
    }).addTo(app.map);

    marker.on('click', () => showObstacleDetails(obstacle));

    app.obstacleMarkers[obstacle.id] = marker;
    return marker;
}

function getObstacleIcon(type) {
    const icons = {
        flood: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
    </svg>`,
        protest: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    </svg>`,
        closure: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>`,
        traffic: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"></path>
      <rect x="8" y="10" width="8" height="4"></rect>
    </svg>`,
        police: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>`
    };

    return icons[type] || icons.traffic;
}

function getObstacleLabel(type) {
    const labels = {
        flood: 'Inondation',
        protest: 'Manifestation',
        closure: 'Route fermée',
        traffic: 'Embouteillage',
        police: 'Police routière'
    };
    return labels[type] || 'Obstacle';
}

function showObstacleDetails(obstacle) {
    const timeAgo = getTimeAgo(obstacle.timestamp);
    const label = getObstacleLabel(obstacle.type);

    const message = `
${label}
${obstacle.description}

📍 Zone: ${obstacle.zone}
⏰ Signalé il y a ${timeAgo}
👥 ${obstacle.reports} confirmations
  `;

    if (confirm(message + '\n\nVoulez-vous confirmer cet obstacle ?')) {
        confirmObstacle(obstacle.id);
    }
}

async function confirmObstacle(obstacleId) {
    if (!app.user) {
        alert('Vous devez être connecté pour confirmer un obstacle');
        promptLogin('report');
        return;
    }

    const result = await firebaseConfirmObstacle(obstacleId, app.user.uid);

    if (result.success) {
        alert('Obstacle confirmé !');

        // Vérifier si l'obstacle a atteint 2 confirmations pour envoyer notification
        const obstacle = app.obstacles.find(obs => obs.id === obstacleId);
        if (obstacle && obstacle.reports >= 2) {
            // Créer une entrée de notification pour la Cloud Function
            await createObstacleNotification(obstacleId, obstacle);
            console.log('📩 Notification déclenchée pour obstacle:', obstacleId);
        }
    } else {
        if (result.error === 'Déjà confirmé') {
            alert('ℹ️ Vous avez déjà confirmé cet obstacle');
        } else {
            alert('❌ Erreur : ' + result.error);
        }
    }
}

function updateAlertsList() {
    const alertsCount = document.getElementById('alerts-count');
    const alertsContent = document.getElementById('alerts-content');
    const alertsToggleBtn = document.getElementById('toggle-alerts-btn');
    const alertsBadge = document.getElementById('alerts-badge');

    if (alertsCount) {
        alertsCount.textContent = app.obstacles.length;
    }

    if (alertsBadge) {
        alertsBadge.textContent = app.obstacles.length;
    }

    if (app.obstacles.length > 0) {
        // Afficher le bouton flottant
        if (alertsToggleBtn) {
            alertsToggleBtn.style.display = 'flex';
        }

        // Remplir le contenu
        if (alertsContent) {
            alertsContent.innerHTML = app.obstacles.slice(0, 10).map(obs => `
          <div class="alert-item">
            <div class="alert-item-icon ${obs.type}">
              ${getObstacleIcon(obs.type)}
            </div>
            <div class="alert-item-content">
              <p class="alert-item-title">${getObstacleLabel(obs.type)}</p>
              <p class="alert-item-meta">${getTimeAgo(obs.timestamp)} • ${obs.reports} confirmations</p>
            </div>
          </div>
        `).join('');
        }
    } else {
        if (alertsToggleBtn) {
            alertsToggleBtn.style.display = 'none';
        }
    }
}

// ============================================
// NIVEAU DE DANGER
// ============================================

function calculateDangerLevel() {
    if (!app.userLocation || app.obstacles.length === 0) {
        updateDangerLevel('safe');
        return;
    }

    const CRITICAL_RADIUS = 0.5; // 500m
    const HIGH_RADIUS = 2; // 2km
    const MEDIUM_RADIUS = 5; // 5km

    let maxSeverity = 'safe';
    let closestObstacleType = null;

    app.obstacles.forEach(obstacle => {
        const distance = calculateDistance(
            app.userLocation.lat,
            app.userLocation.lng,
            obstacle.lat,
            obstacle.lng
        );

        // Déterminer la sévérité basée sur la distance ET le type d'obstacle
        let currentSeverity = 'safe';

        if (distance <= CRITICAL_RADIUS) {
            // Très proche (< 500m) - toujours critique
            currentSeverity = 'critical';
            closestObstacleType = obstacle.type;
        } else if (distance <= HIGH_RADIUS) {
            // Proche (< 2km) - utiliser la sévérité de l'obstacle
            if (obstacle.severity === 'critical') {
                currentSeverity = 'critical';
            } else if (obstacle.severity === 'high') {
                currentSeverity = 'high';
            } else {
                currentSeverity = 'medium';
            }
            if (!closestObstacleType) closestObstacleType = obstacle.type;
        } else if (distance <= MEDIUM_RADIUS) {
            // Moyen (< 5km) - avertissement bas
            currentSeverity = 'low';
            if (!closestObstacleType) closestObstacleType = obstacle.type;
        }

        // Mettre à jour le niveau max
        const severityOrder = { 'safe': 0, 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
        if (severityOrder[currentSeverity] > severityOrder[maxSeverity]) {
            maxSeverity = currentSeverity;
        }
    });

    updateDangerLevel(maxSeverity, closestObstacleType);
}

function updateDangerLevel(level, obstacleType = null) {
    app.dangerLevel = level;
    const config = DANGER_LEVELS[level];

    // Couleurs basées sur le type d'obstacle ET le niveau
    const obstacleColors = {
        flood: '#3b82f6',      // Bleu
        protest: '#f97316',    // Orange
        closure: '#dc2626',    // Rouge
        traffic: '#fbbf24',    // Jaune
        police: '#8b5cf6'      // Violet
    };

    // Couleur par défaut basée sur le niveau si pas d'obstacle spécifique
    const levelColors = {
        safe: '#43938A',  // RGB(67, 147, 138)
        low: '#10b981',
        medium: '#fbbf24',
        high: '#f97316',
        critical: '#dc2626'
    };

    // Choisir la couleur appropriée
    const headerColor = obstacleType ? obstacleColors[obstacleType] : levelColors[level];

    // Mettre à jour le header avec la couleur de l'obstacle
    const header = document.getElementById('header');
    header.className = `header ${config.class}`;
    header.style.background = `linear-gradient(to right, ${headerColor}, ${adjustBrightness(headerColor, -20)})`;

    // Mettre à jour le statut
    document.getElementById('danger-status').textContent = `${config.icon} ${config.label}`;

    // Mettre à jour le bandeau de danger
    const dangerBanner = document.getElementById('danger-banner');
    const guestBanner = document.getElementById('guest-banner');

    if (level !== 'safe') {
        dangerBanner.style.display = 'block';
        dangerBanner.style.background = headerColor;
        guestBanner.style.display = 'none';
        document.getElementById('danger-title').textContent = `${config.icon} ${config.label}`;

        // Ajouter le type d'obstacle dans la description
        let description = config.description;
        if (obstacleType) {
            const obstacleLabel = getObstacleLabel(obstacleType);
            description = `${obstacleLabel} signalé(e) dans votre zone`;
        }
        document.getElementById('danger-subtitle').textContent = description;
    } else {
        dangerBanner.style.display = 'none';
        header.style.background = '';
        if (!app.user) {
            guestBanner.style.display = 'block';
        }
    }

    // Mettre à jour la couleur du marqueur utilisateur
    if (app.userMarker) {
        const markerColor = obstacleType ? obstacleColors[obstacleType] : levelColors[level];

        // Mettre à jour l'icône du marqueur avec la nouvelle couleur
        app.userMarker.setIcon(L.divIcon({
            className: 'user-marker',
            html: `<div style="background: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        }));
    }
}

// Fonction helper pour ajuster la luminosité d'une couleur
function adjustBrightness(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}

// ============================================
// SIGNALEMENT
// ============================================

function reportObstacle(type) {
    if (!app.user) {
        alert('Vous devez être connecté pour signaler un obstacle');
        closeModal('report-modal');
        openModal('auth-modal');
        return;
    }

    if (!app.userLocation) {
        alert('Veuillez activer la géolocalisation');
        return;
    }

    const severities = {
        flood: 'high',
        protest: 'critical',
        closure: 'medium',
        other: 'medium'
    };

    const newObstacle = {
        id: Date.now().toString(),
        type: type,
        lat: app.userLocation.lat,
        lng: app.userLocation.lng,
        description: `${getObstacleLabel(type)} signalé(e)`,
        reports: 1,
        timestamp: Date.now(),
        severity: severities[type],
        zone: 'Ma zone',
        userId: app.user.uid
    };

    app.obstacles.push(newObstacle);

    renderObstacles();
    updateAlertsList();
    calculateDangerLevel();
    closeModal('report-modal');

    alert(`${getObstacleLabel(type)} signalé(e) avec succès !`);

    // TODO: Enregistrer dans Firebase
    // TODO: Notifier les utilisateurs à proximité
}

// ============================================
// NOTIFICATIONS
// ============================================

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('Notifications non supportées');
        return;
    }

    const permission = await Notification.requestPermission();
    app.notificationsEnabled = permission === 'granted';

    if (permission === 'granted') {
        console.log('Notifications activées');
        document.getElementById('btn-notifications').classList.add('active');

        // Obtenir le token FCM
        if (app.user) {
            const tokenResult = await requestNotificationToken();
            if (tokenResult.success) {
                // Sauvegarder le token dans Firebase
                await saveUserFCMToken(app.user.uid, tokenResult.token);
                console.log('Token FCM sauvegardé');
            }
        }
    }
}

// ============================================
// SERVICE WORKER
// ============================================

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker enregistré:', registration);
            })
            .catch(error => {
                console.error('Erreur Service Worker:', error);
            });
    }
}

// ============================================
// UTILITAIRES
// ============================================

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

function getTimeAgo(timestamp) {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}j`;
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function switchView(viewName) {
    // Masquer toutes les vues
    document.querySelectorAll('.view-container').forEach(view => {
        view.style.display = 'none';
    });

    // Afficher la vue sélectionnée
    const viewId = `view-${viewName}`;
    const viewElement = document.getElementById(viewId);
    if (viewElement) {
        viewElement.style.display = 'block';
    }

    // Si on revient à la carte, redimensionner
    if (viewName === 'map' && app.map) {
        setTimeout(() => app.map.invalidateSize(), 100);
    }

    // Si on affiche les alertes, mettre à jour la liste
    if (viewName === 'alerts') {
        updateAlertsListView();
    }

    // Si on affiche les paramètres, mettre à jour les infos
    if (viewName === 'settings') {
        updateSettingsView();
    }
}

function updateAlertsListView() {
    const listView = document.getElementById('alerts-list-view');

    if (app.obstacles.length === 0) {
        listView.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 40px;">Aucune alerte active dans votre zone</p>';
        return;
    }

    listView.innerHTML = app.obstacles.map(obs => `
        <div class="alert-card" onclick="showObstacleDetails({id: '${obs.id}'})">
            <div class="alert-card-header">
                <span class="alert-type-badge" style="background: ${getObstacleColor(obs.type)}">${getObstacleLabel(obs.type)}</span>
                <span class="alert-time">${getTimeAgo(obs.timestamp)}</span>
            </div>
            <p class="alert-description">${obs.description}</p>
            <div class="alert-footer">
                <span>📍 ${obs.zone || 'Zone inconnue'}</span>
                <span>👥 ${obs.reports} confirmations</span>
            </div>
        </div>
    `).join('');
}

function updateSettingsView() {
    const userEmailDisplay = document.getElementById('user-email-display');
    if (app.user) {
        userEmailDisplay.textContent = app.user.email;
    } else {
        userEmailDisplay.textContent = 'Non connecté';
    }
}

function getObstacleColor(type) {
    const colors = {
        flood: '#3b82f6',
        protest: '#f97316',
        closure: '#dc2626',
        traffic: '#fbbf24',
        police: '#8b5cf6'
    };
    return colors[type] || colors.traffic;
}

// ============================================
// ÉVÉNEMENTS
// ============================================

function attachEventListeners() {
    // Bouton d'authentification
    document.getElementById('btn-auth').addEventListener('click', () => {
        if (app.user) {
            logout();
        } else {
            openModal('auth-modal');
        }
    });

    // Bouton de notifications
    document.getElementById('btn-notifications').addEventListener('click', () => {
        if (!app.user) {
            alert('Connectez-vous pour activer les notifications');
            openModal('auth-modal');
        } else {
            requestNotificationPermission();
        }
    });

    // Bouton de signalement
    document.getElementById('btn-report').addEventListener('click', () => {
        if (!app.user) {
            alert('Connectez-vous pour signaler un obstacle');
            openModal('auth-modal');
        } else {
            openModal('report-modal');
        }
    });

    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const view = btn.getAttribute('data-view');
            switchView(view);
        });
    });

    // Modals - Fermeture
    document.getElementById('close-auth-modal').addEventListener('click', () => closeModal('auth-modal'));
    document.getElementById('close-report-modal').addEventListener('click', () => closeModal('report-modal'));

    // Modals - Authentification
    document.getElementById('btn-google-auth').addEventListener('click', () => login('google'));
    document.getElementById('btn-email-auth').addEventListener('click', () => login('email'));

    // Modals - Signalement
    document.querySelectorAll('.report-card').forEach(card => {
        card.addEventListener('click', () => {
            const type = card.getAttribute('data-type');
            reportObstacle(type);
        });
    });

    // Fermer les modals en cliquant en dehors
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

console.log('app.js chargé');