// TraficDay PWA - JavaScript Principal
// Import Firebase functions
import {
    signInWithGoogle,
    signOutUser,
    onAuthChange,
    createObstacle,
    firebaseListenToObstacles,
    confirmObstacle,
    createUserProfile,
    saveUserLocation,
    subscribeToLocationTopic
} from './firebase-config.js';

// Security: HTML escaping function to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Security: Validation functions
function validateCoordinates(lat, lng) {
    return (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180
    );
}

function validateObstacleType(type) {
    const validTypes = ['flood', 'protest', 'closure', 'traffic', 'police'];
    return validTypes.includes(type);
}

function checkRateLimit(action) {
    const lastAction = localStorage.getItem(`lastAction_${action}`);
    const now = Date.now();
    const cooldown = 60000; // 1 minute

    if (lastAction && (now - parseInt(lastAction)) < cooldown) {
        const remaining = Math.ceil((cooldown - (now - parseInt(lastAction))) / 1000);
        return { allowed: false, remaining };
    }

    localStorage.setItem(`lastAction_${action}`, now.toString());
    return { allowed: true };
}

// State management
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


// INITIALISATION

document.addEventListener('DOMContentLoaded', () => {
    console.log('TraficDay démarrage...');

    // Initialize the map
    initMap();

    // Check user authentication state
    checkUser();

    // Initialise the geolocation
    initGeolocation();

    // Load obstacles from Firebase
    loadObstacles();

    // A
    attachEventListeners();

    // Register Service Worker
    registerServiceWorker();

    // Hide loading screen after a delay
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';

        // Force map resize
        if (app.map) {
            setTimeout(() => {
                app.map.invalidateSize();
            }, 100);
        }
    }, 2000);
});


// CARTE LEAFLET

function initMap() {
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('Leaflet non chargé');
        setTimeout(initMap, 100);
        return;
    }

    // Create the map centered on Abidjan, Côte d'Ivoire
    app.map = L.map('map', {
        zoomControl: true,
        attributionControl: true
    }).setView([5.345317, -4.024429], 13);

    // Add OpenStreetMap tile layerß
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 3
    }).addTo(app.map);

    console.log('Carte Leaflet initialisée');

    // Force map resize after a short delay to fix display issues
    setTimeout(() => {
        app.map.invalidateSize();
    }, 100);

    // Handle window resize
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
        // Create a custom user marker for areas without obstacles
        app.userMarker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'user-marker',
                html: `<div style="background: #43938A; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        }).addTo(app.map);
    }

    // Center the map on the user location if authenticated
    if (app.user) {
        app.map.setView([lat, lng], 15);
    }
}


// AUTHENTIFICATION

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
    // Écouter les changements d'état d'authentification
    onAuthChange((user) => {
        if (user) {
            app.user = user;
            console.log('Utilisateur connecté:', user.email);
            updateUIForAuthState(true);

            // Create and update user profile in Firestore
            createUserProfile(user);

            // Save user location if available
            if (app.userLocation) {
                saveUserLocation(user.uid, app.userLocation.lat, app.userLocation.lng);
            }
        } else {
            app.user = null;
            console.log('Utilisateur déconnecté');
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
    console.log('Tentative de connexion avec:', provider);

    if (provider === 'google') {
        const result = await signInWithGoogle();

        if (result.success) {
            closeModal('auth-modal');
            alert('Connexion réussie !');
            requestNotificationPermission();
        } else {
            alert('Erreur de connexion : ' + result.error);
        }
    } else {
        // Config Email/Phone login
        alert('Connexion Email/Phone bientôt disponible');
    }
}

async function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        const result = await signOutUser();

        if (result.success) {
            alert('Vous êtes déconnecté. Vous pouvez toujours consulter la carte.');
        } else {
            alert('Erreur de déconnexion');
        }
    }
}


// GÉOLOCALISATION


function initGeolocation() {
    if (!navigator.geolocation) {
        console.error('Géolocalisation non supportée');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            app.userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            console.log('Position:', app.userLocation);
            updateUserMarker(app.userLocation.lat, app.userLocation.lng);
            calculateDangerLevel();

            // Save user location if authenticated
            if (app.user) {
                saveUserLocation(app.user.uid, app.userLocation.lat, app.userLocation.lng);
                // Subscribe to location-based FCM topic (only once on initial position)
                subscribeToLocationTopic(app.user.uid, app.userLocation.lat, app.userLocation.lng);
            }
        },
        (error) => {
            console.error('Erreur géolocalisation:', error);
            // Show the map even if location fails
        }
    );

    // Follow position changes
    navigator.geolocation.watchPosition(
        (position) => {
            app.userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            updateUserMarker(app.userLocation.lat, app.userLocation.lng);
            calculateDangerLevel();

            // Save user location if authenticated
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


// OBSTACLES


function loadObstacles() {
    firebaseListenToObstacles((obstacles) => {
        app.obstacles = obstacles;
        renderObstacles();
        updateAlertsList();
        calculateDangerLevel();
        console.log('Obstacles chargés:', obstacles.length);
    });
}

async function handleReport(type) {
    // Validation 1: Check location
    if (!app.userLocation) {
        alert('Veuillez activer la géolocalisation');
        return;
    }

    // Validation 2: Check authentication
    if (!app.user) {
        promptLogin('report');
        return;
    }

    // Validation 3: Validate obstacle type
    if (!validateObstacleType(type)) {
        alert('Type d\'obstacle invalide');
        console.error('Invalid obstacle type:', type);
        return;
    }

    // Validation 4: Validate coordinates
    if (!validateCoordinates(app.userLocation.lat, app.userLocation.lng)) {
        alert('Coordonnées GPS invalides');
        console.error('Invalid coordinates:', app.userLocation);
        return;
    }

    // Validation 5: Rate limiting
    const rateCheck = checkRateLimit('reportObstacle');
    if (!rateCheck.allowed) {
        alert(`Veuillez attendre ${rateCheck.remaining} secondes avant de signaler un autre obstacle`);
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
        lat: Math.round(app.userLocation.lat * 1000) / 1000, // Round to ~111m for privacy
        lng: Math.round(app.userLocation.lng * 1000) / 1000,
        description: `${getObstacleLabel(type)} signalé(e)`,
        reports: 1,
        severity: severities[type],
        zone: 'Ma zone',
        userId: app.user.uid,
        confirmedBy: [app.user.uid]
    };

    // Report the obstacle in Firebase
    const result = await createObstacle(newObstacle);

    if (result.success) {
        closeModal('report-modal');
        alert(`${getObstacleLabel(type)} signalé(e) avec succès !`);
    } else {
        alert('Erreur lors du signalement : ' + result.error);
    }
}

function renderObstacles() {
    // Vérifier que la carte est initialisée
    if (!app.map) {
        console.warn('Carte non initialisée, impossible de rendre les obstacles');
        return;
    }

    // Delete existing markers
    Object.values(app.obstacleMarkers).forEach(marker => {
        app.map.removeLayer(marker);
    });
    app.obstacleMarkers = {};

    // Add markers for each obstacle
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
    console.log('Showing obstacle details:', obstacle);
    console.log('Obstacle ID:', obstacle.id);

    const timeAgo = getTimeAgo(obstacle.timestamp);
    const label = getObstacleLabel(obstacle.type);

    const message = `
${label}
${obstacle.description || 'Aucune description'}

📍 Zone: ${obstacle.zone || 'Inconnue'}
⏰ Signalé il y a ${timeAgo}
👥 ${obstacle.confirmations || 1} confirmations
  `;

    if (confirm(message + '\n\nVoulez-vous confirmer cet obstacle ?')) {
        console.log('User wants to confirm obstacle ID:', obstacle.id);
        handleConfirmObstacle(obstacle.id);
    }
}

async function handleConfirmObstacle(obstacleId) {
    if (!app.user) {
        alert('Vous devez être connecté pour confirmer un obstacle');
        promptLogin('report');
        return;
    }

    // Rate limiting
    const rateCheck = checkRateLimit('confirmObstacle');
    if (!rateCheck.allowed) {
        alert(`Veuillez attendre ${rateCheck.remaining} secondes avant de confirmer un autre obstacle`);
        return;
    }

    const result = await confirmObstacle(obstacleId);

    if (result.success) {
        alert('Obstacle confirmé !');

        // Notification is automatically handled in firebase-config.js after 2+ confirmations
    } else {
        if (result.error === 'Déjà confirmé') {
            alert('Vous avez déjà confirmé cet obstacle');
        } else {
            alert('Erreur : ' + result.error);
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
        // Show the alerts button
        if (alertsToggleBtn) {
            alertsToggleBtn.style.display = 'flex';
        }

        // Fill the alerts dropdown
        if (alertsContent) {
            alertsContent.innerHTML = app.obstacles.slice(0, 10).map(obs => `
          <div class="alert-item">
            <div class="alert-item-icon ${escapeHtml(obs.type)}">
              ${getObstacleIcon(obs.type)}
            </div>
            <div class="alert-item-content">
              <p class="alert-item-title">${escapeHtml(getObstacleLabel(obs.type))}</p>
              <p class="alert-item-meta">${escapeHtml(getTimeAgo(obs.timestamp))} • ${escapeHtml(obs.reports)} confirmations</p>
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


// Danger level calculation

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

        // Determine severity based on distance and obstacle severity
        let currentSeverity = 'safe';

        if (distance <= CRITICAL_RADIUS) {
            // Too close (< 500m) - stick to critical
            currentSeverity = 'critical';
            closestObstacleType = obstacle.type;
        } else if (distance <= HIGH_RADIUS) {
            // Close (< 2km) - Use obstacle severity
            if (obstacle.severity === 'critical') {
                currentSeverity = 'critical';
            } else if (obstacle.severity === 'high') {
                currentSeverity = 'high';
            } else {
                currentSeverity = 'medium';
            }
            if (!closestObstacleType) closestObstacleType = obstacle.type;
        } else if (distance <= MEDIUM_RADIUS) {
            // Low (< 5km) - low severity
            currentSeverity = 'low';
            if (!closestObstacleType) closestObstacleType = obstacle.type;
        }

        //Update max severity
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

    // Color by level if no specific obstacle type
    const levelColors = {
        safe: '#43938A',  // RGB(67, 147, 138)
        low: '#10b981',
        medium: '#fbbf24',
        high: '#f97316',
        critical: '#dc2626'
    };

    // Choose header color
    const headerColor = obstacleType ? obstacleColors[obstacleType] : levelColors[level];

    // Update header style with gradient based on level and obstacle type
    const header = document.getElementById('header');
    header.className = `header ${config.class}`;
    header.style.background = `linear-gradient(to right, ${headerColor}, ${adjustBrightness(headerColor, -20)})`;

    // update danger status text
    document.getElementById('danger-status').textContent = `${config.icon} ${config.label}`;

    // Update banners
    const dangerBanner = document.getElementById('danger-banner');
    const guestBanner = document.getElementById('guest-banner');

    if (level !== 'safe') {
        dangerBanner.style.display = 'block';
        dangerBanner.style.background = headerColor;
        guestBanner.style.display = 'none';
        document.getElementById('danger-title').textContent = `${config.icon} ${config.label}`;

        // Add obstacle type to description if available
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

    // Update user marker color
    if (app.userMarker) {
        const markerColor = obstacleType ? obstacleColors[obstacleType] : levelColors[level];

        // Update user marker color
        app.userMarker.setIcon(L.divIcon({
            className: 'user-marker',
            html: `<div style="background: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        }));
    }
}

// Function to adjust brightness of a hex color
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




// Notification push

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
    } else {
        console.log('Notifications refusées');
        document.getElementById('btn-notifications').classList.remove('active');
    }
}


// SERVICE WORKER

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


// UTILS
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
    // Hide all views
    document.querySelectorAll('.view-container').forEach(view => {
        view.style.display = 'none';
    });

    // Show the selected view
    const viewId = `view-${viewName}`;
    const viewElement = document.getElementById(viewId);
    if (viewElement) {
        viewElement.style.display = 'block';
    }

    // Show map and invalidate size
    if (viewName === 'map' && app.map) {
        setTimeout(() => app.map.invalidateSize(), 100);
    }

    // Show alerts list
    if (viewName === 'alerts') {
        updateAlertsListView();
    }

    // Show settings information
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
        <div class="alert-card" onclick="showObstacleDetails({id: '${escapeHtml(obs.id)}'})">
            <div class="alert-card-header">
                <span class="alert-type-badge" style="background: ${getObstacleColor(obs.type)}">${escapeHtml(getObstacleLabel(obs.type))}</span>
                <span class="alert-time">${escapeHtml(getTimeAgo(obs.timestamp))}</span>
            </div>
            <p class="alert-description">${escapeHtml(obs.description)}</p>
            <div class="alert-footer">
                <span>${escapeHtml(obs.zone || 'Zone inconnue')}</span>
                <span>${escapeHtml(obs.reports)} confirmations</span>
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

// events listeners

function attachEventListeners() {
    // Auth button
    document.getElementById('btn-auth').addEventListener('click', () => {
        if (app.user) {
            logout();
        } else {
            openModal('auth-modal');
        }
    });

    // Notifications button
    document.getElementById('btn-notifications').addEventListener('click', () => {
        if (!app.user) {
            alert('Connectez-vous pour activer les notifications');
            openModal('auth-modal');
        } else {
            requestNotificationPermission();
        }
    });

    // report button
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

    // Modals - Close buttons
    document.getElementById('close-auth-modal').addEventListener('click', () => closeModal('auth-modal'));
    document.getElementById('close-report-modal').addEventListener('click', () => closeModal('report-modal'));

    // Modals - Authentification
    document.getElementById('btn-google-auth').addEventListener('click', () => login('google'));
    document.getElementById('btn-email-auth').addEventListener('click', () => login('email'));

    // Modals - reporting
    document.querySelectorAll('.report-card').forEach(card => {
        card.addEventListener('click', () => {
            const type = card.getAttribute('data-type');
            handleReport(type);
        });
    });

    // Close 
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Page visibilty change event
// Prevent reload when returning to app (fix for Samsung Galaxy)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('App resumed - updating data without reload');

        // Update data without full reload
        if (app.map) {
            app.map.invalidateSize();
        }

        // Refresh danger level
        if (app.userLocation) {
            calculateDangerLevel();
        }
    }
});

// Handle app resume from background
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        console.log('App resumed from bfcache');
        // Page was restored from back/forward cache
        if (app.map) {
            app.map.invalidateSize();
        }
    }
});

// Prevent pull-to-refresh on Android
let touchStartY = 0;
document.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    const touchDiff = touchY - touchStartY;

    // Prevent pull-to-refresh when at top of page
    if (touchDiff > 0 && window.scrollY === 0) {
        e.preventDefault();
    }
}, { passive: false });


// Pwa install prompt handling
let deferredPrompt = null;

// Capture the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💾 PWA Install prompt available');

    // Prevent the default browser install prompt
    e.preventDefault();

    // Store the event for later use
    deferredPrompt = e;

    // Check if user has dismissed before
    const installDismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedDate = localStorage.getItem('pwa-install-dismissed-date');

    // Show banner if not dismissed, or if dismissed more than 7 days ago
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    const shouldShowBanner = !installDismissed ||
        !dismissedDate ||
        (now - parseInt(dismissedDate)) > sevenDays;

    if (shouldShowBanner) {
        showInstallBanner();
    }
});

function showInstallBanner() {
    const installBanner = document.getElementById('install-banner');
    if (installBanner) {
        installBanner.style.display = 'block';
    }
}

function hideInstallBanner() {
    const installBanner = document.getElementById('install-banner');
    if (installBanner) {
        installBanner.style.display = 'none';
    }
}

// Install button click
document.getElementById('btn-install-pwa')?.addEventListener('click', async () => {
    if (!deferredPrompt) {
        console.log('No install prompt available');
        return;
    }

    // Show the browser's install prompt
    deferredPrompt.prompt();

    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);

    if (outcome === 'accepted') {
        console.log('PWA installed');
    } else {
        console.log('PWA installation declined');
    }

    // Clear the deferred prompt
    deferredPrompt = null;

    // Hide banner
    hideInstallBanner();
});

// Dismiss button click
document.getElementById('btn-install-dismiss')?.addEventListener('click', () => {
    console.log('Install prompt dismissed');

    // Store dismissal in localStorage
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-dismissed-date', Date.now().toString());

    // Hide banner
    hideInstallBanner();
});

// Detect when PWA is installed
window.addEventListener('appinstalled', () => {
    console.log('PWA successfully installed');

    // Hide banner
    hideInstallBanner();

    // Clear dismissal flag
    localStorage.removeItem('pwa-install-dismissed');
    localStorage.removeItem('pwa-install-dismissed-date');

    // Optional: Show success message
    // You could add a toast notification here
});

// Check if app is already installed (running in standalone mode)
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    console.log('App is running in standalone mode');
    // App is already installed, don't show install banner
    hideInstallBanner();
}


// Gestionnaire pour les liens de confidentialité
function setupPrivacyLinks() {
    document.addEventListener('click', function (e) {
        // Vérifier si c'est un lien de confidentialité
        if (e.target.matches('a.privacy-link') ||
            e.target.closest('a.privacy-link') ||
            (e.target.tagName === 'A' && e.target.textContent.includes('Confidentialité'))) {
            e.preventDefault();
            openPrivacyViewer();
        }
    });
}

function openPrivacyViewer() {
    // Vérifier si une instance existe déjà
    if (document.querySelector('privacy-viewer')) {
        return;
    }

    // Create and append the component
    const privacyViewer = document.createElement('privacy-viewer');
    document.body.appendChild(privacyViewer);

    // Give focus for keyboard navigation
    privacyViewer.focus();
}

// Initialise terms links on load
document.addEventListener('DOMContentLoaded', function () {
    setupPrivacyLinks();
});

// Manager links for terms of service
function setupTermsLinks() {
    document.addEventListener('click', function (e) {
        // check if it's a terms link
        if (e.target.matches('a.terms-link') ||
            e.target.closest('a.terms-link') ||
            (e.target.tagName === 'A' && e.target.textContent.includes('Condition Générales d"Utilisation'))) {
            e.preventDefault();
            openTermsViewer();
        }
    });
}

function openTermsViewer() {
    // Vérifier si une instance existe déjà
    if (document.querySelector('terms-viewer')) {
        return;
    }

    // create and append the component
    const termsViewer = document.createElement('terms-viewer');
    document.body.appendChild(termsViewer);

    // Give focus for keyboard navigation
    termsViewer.focus();
}

// Initialize terms links on load
document.addEventListener('DOMContentLoaded', function () {
    setupTermsLinks();
});

console.log('app.js chargé');