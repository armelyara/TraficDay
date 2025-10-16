// TraficDay PWA - JavaScript Principal
// Import Firebase functions
import {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOutUser,
    onAuthChange,
    createObstacle,
    firebaseListenToObstacles,
    confirmObstacle,
    markAsResolved,
    createUserProfile,
    saveUserLocation,
    subscribeToLocationTopic,
    saveNotificationToken,
    subscribeToAllTopic,
    unsubscribeFromAllTopic,
    database,
    messaging
} from './firebase-config.js';

import { ref, get, push, set } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

// Import getToken from Firebase messaging
import { getToken } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js';

// Import secure configuration
import { getGoogleMapsApiKey } from './config.js';

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
    const validTypes = ['flood', 'accident', 'protest', 'closure', 'traffic', 'police'];
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
    obstacleMarkers: {},
    trafficLayer: null,  // Google Maps traffic overlay
    dangerCircles: {},    // Circles around point obstacles
    previousDangerZones: new Set(),  // Track which danger zones user was in
    lastProximityNotification: 0,  // Timestamp of last notification (rate limiting)
    pendingUserPosition: null  // Store user position if map not ready yet
};

// Make app globally accessible for firebase-config.js
window.app = app;

// Constantes
const DANGER_LEVELS = {
    safe: {
        class: 'safe',
        icon: '🟢',
        label: 'Zone sûre',
        description: 'Aucun danger signalé'
    },
    low: {
        class: 'low',
        icon: '⚠️',
        label: 'Attention requise',
        description: 'obstacles mineurs'
    },
    medium: {
        class: 'medium',
        icon: '🟡',
        label: 'Vigilance absolue',
        description: 'Obstacles modérés dans la zone'
    },
    high: {
        class: 'high',
        icon: '🟠',
        label: 'Zone critique',
        description: 'Vigilance accrue requise'
    },
    critical: {
        class: 'critical',
        icon: '🔴',
        label: 'Danger',
        description: 'Zone dangereuse - Veuillez sortir de la zone immédiatement'
    }
};


// INITIALISATION

document.addEventListener('DOMContentLoaded', () => {
    console.log('TraficDay démarrage...');

    // Load Google Maps API securely (will call initMap when ready)
    loadGoogleMapsAPI();

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

        // Force map resize (Google Maps handles resize automatically)
        if (app.map && typeof google !== 'undefined') {
            setTimeout(() => {
                google.maps.event.trigger(app.map, 'resize');
            }, 100);
        }
    }, 2000);
});


// GOOGLE MAPS

// Load Google Maps API dynamically with secure API key
async function loadGoogleMapsAPI() {
    try {
        // Get API key from Firebase Remote Config
        const apiKey = await getGoogleMapsApiKey();

        // Create script element to load Google Maps
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&callback=initGoogleMapsCallback`;
        script.async = true;
        script.defer = true;

        // Add error handler
        script.onerror = () => {
            console.error('Failed to load Google Maps API');
            alert('Erreur: Impossible de charger Google Maps');
        };

        document.head.appendChild(script);
        console.log('Google Maps API script injected');
    } catch (error) {
        console.error('Error loading Google Maps:', error);
        alert('Erreur: Clé API Google Maps non configurée');
    }
}

// Google Maps callback (called when API loads)
window.initGoogleMapsCallback = function() {
    console.log('Google Maps API loaded');
    // Trigger map initialization if DOM is ready
    if (document.readyState === 'complete') {
        initMap();
    }
};

function initMap() {
    // Check if Google Maps is loaded
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        console.error('Google Maps non chargé, attente...');
        setTimeout(initMap, 100);
        return;
    }

    // Create Google Map centered on Abidjan, Côte d'Ivoire
    app.map = new google.maps.Map(document.getElementById('map'), {
        mapId: 'TRAFICDAY_MAP', // Required for AdvancedMarkerElement
        center: { lat: 5.345317, lng: -4.024429 },
        zoom: 13,
        minZoom: 3,
        maxZoom: 19,
        disableDefaultUI: false,
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_TOP // Move zoom to top-left
        },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy' // Better for mobile
    });

    // Add Google Maps Traffic Layer
    app.trafficLayer = new google.maps.TrafficLayer();
    app.trafficLayer.setMap(app.map);

    console.log('Google Map initialisée');
    console.log('Google Maps traffic layer ajouté');

    // Render obstacles if they were already loaded before map was ready
    if (app.obstacles && app.obstacles.length > 0) {
        console.log('Rendering pending obstacles:', app.obstacles.length);
        renderObstacles();
    }

    // Apply pending user position if available
    if (app.pendingUserPosition) {
        console.log('Applying pending user position:', app.pendingUserPosition);
        updateUserMarker(app.pendingUserPosition.lat, app.pendingUserPosition.lng);
        app.pendingUserPosition = null; // Clear pending position
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        if (app.map) {
            // Google Maps handles resize automatically, but trigger if needed
            google.maps.event.trigger(app.map, 'resize');
        }
    });
}

function updateUserMarker(lat, lng) {
    // Guard check: Don't execute if Google Maps not loaded yet
    if (typeof google === 'undefined' || !google.maps || !app.map) {
        console.log('Waiting for Google Maps to load before updating user marker...');
        // Store position for later
        app.pendingUserPosition = { lat, lng };
        return;
    }

    const position = { lat, lng };

    if (app.userMarker) {
        // Update position of existing marker
        app.userMarker.position = position;
    } else {
        // Create custom HTML element for user marker
        const markerDiv = document.createElement('div');
        markerDiv.style.cssText = `
            width: 20px;
            height: 20px;
            background: #43938A;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        `;

        // Create AdvancedMarkerElement with custom HTML
        app.userMarker = new google.maps.marker.AdvancedMarkerElement({
            position: position,
            map: app.map,
            content: markerDiv,
            title: 'Votre position',
            zIndex: 1000
        });

        // Store reference to the marker div for color updates
        app.userMarkerDiv = markerDiv;
    }

    // Center the map on the user location if authenticated
    if (app.user) {
        app.map.setCenter(position);
        app.map.setZoom(15);
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

        } else {
            alert('Erreur de connexion : ' + result.error);
        }
    } else {
        // Config Email/Phone login
        alert('Connexion Email/Phone bientôt disponible');
    }
}

async function handleEmailAuth(isSignup) {
    const email = document.getElementById('email-input').value.trim();
    const password = document.getElementById('password-input').value;
    const errorMessage = document.getElementById('auth-error-message');

    // Hide previous error
    errorMessage.style.display = 'none';

    // Basic validation
    if (!email || !password) {
        errorMessage.textContent = 'Veuillez remplir tous les champs';
        errorMessage.style.display = 'block';
        return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorMessage.textContent = 'Format d\'email invalide';
        errorMessage.style.display = 'block';
        return;
    }

    // Password length validation
    if (password.length < 6) {
        errorMessage.textContent = 'Le mot de passe doit contenir au moins 6 caractères';
        errorMessage.style.display = 'block';
        return;
    }

    // Disable submit button during processing
    const submitBtn = document.getElementById('btn-email-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = isSignup ? 'Inscription...' : 'Connexion...';

    try {
        let result;
        if (isSignup) {
            console.log('Attempting signup with email:', email);
            result = await signUpWithEmail(email, password);
        } else {
            console.log('Attempting login with email:', email);
            result = await signInWithEmail(email, password);
        }

        if (result.success) {
            closeModal('auth-modal');
            // Reset form
            document.getElementById('email-input').value = '';
            document.getElementById('password-input').value = '';
            document.getElementById('email-auth-form').style.display = 'none';
            document.getElementById('auth-selection').style.display = 'flex';

            alert(isSignup ? 'Inscription réussie !' : 'Connexion réussie !');
        } else {
            errorMessage.textContent = result.error;
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error during email auth:', error);
        errorMessage.textContent = 'Une erreur est survenue. Veuillez réessayer.';
        errorMessage.style.display = 'block';
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = isSignup ? 'S\'inscrire' : 'Se connecter';
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

        // Only render if map is initialized, otherwise obstacles will be rendered when map loads
        if (app.map) {
            renderObstacles();
        } else {
            console.log('⏳ Map not ready yet, obstacles will render when map initializes');
        }

        updateAlertsList();
        calculateDangerLevel();
        console.log('Obstacles chargés:', obstacles.length);
    });
}

async function handleReport(type, userSelectedDangerLevel) {
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

    // Use user-selected danger level
    const severity = userSelectedDangerLevel; // 'low', 'medium', or 'high'

    // Danger level descriptions
    const dangerDescriptions = {
        low: 'Prudence - Circulation autorisée',
        medium: 'Vérifier avant - Vérifier les conditions',
        high: 'Danger - Circulation interdite'
    };

    const newObstacle = {
        type: type,
        lat: Math.round(app.userLocation.lat * 1000) / 1000, // Round to ~111m for privacy
        lng: Math.round(app.userLocation.lng * 1000) / 1000,
        description: `${getObstacleLabel(type)} - ${dangerDescriptions[severity]}`,
        reports: 1,
        severity: severity, // Store user-selected danger level
        dangerLevel: severity, // Also store as dangerLevel for clarity
        zone: 'Ma zone',
        userId: app.user.uid,
        confirmedBy: [app.user.uid]
    };

    // Report the obstacle in Firebase
    const result = await createObstacle(newObstacle);

    if (result.success) {
        closeModal('report-modal');

        // Reset report modal to first step
        document.querySelector('.report-grid').style.display = 'grid';
        document.getElementById('danger-level-selection').style.display = 'none';

        alert(`${getObstacleLabel(type)} signalé avec niveau: ${dangerDescriptions[severity]}`);
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

    // Delete existing markers (Google Maps)
    Object.values(app.obstacleMarkers).forEach(marker => {
        marker.map = null; // Remove marker from map
    });
    app.obstacleMarkers = {};

    // Delete existing circles (Google Maps)
    Object.values(app.dangerCircles).forEach(circle => {
        circle.setMap(null); // Remove circle from map
    });
    app.dangerCircles = {};

    // Filter to show only primary obstacles (hide duplicates)
    const primaryObstacles = app.obstacles.filter(obs => obs.isPrimary !== false);

    console.log(`📍 Rendering ${primaryObstacles.length} primary obstacles (${app.obstacles.length} total)`);

    // Render ALL obstacles as markers (including traffic)
    // Mapbox real-time traffic overlay shows the actual road colors (green/yellow/red)
    primaryObstacles.forEach(obstacle => {
        const totalCount = calculateObstacleTotalCount(obstacle);
        createObstacleMarker(obstacle, totalCount);
    });
}

// Calculate total count: alerts + manual confirmations
function calculateObstacleTotalCount(obstacle) {
    // Start with primary obstacle count (1)
    let alertCount = 1;

    // Add linked obstacles (duplicates reported by other users)
    if (obstacle.linkedObstacles) {
        alertCount += Object.keys(obstacle.linkedObstacles).length;
    }

    // Count total confirmations
    const totalConfirmations = obstacle.confirmedBy ? Object.keys(obstacle.confirmedBy).length : 1;

    // Manual confirmations = total confirmations - alert reports
    const manualConfirmations = Math.max(0, totalConfirmations - alertCount);

    // Total = alerts + manual confirmations
    const totalCount = alertCount + manualConfirmations;

    console.log(`Obstacle ${obstacle.id}: ${alertCount} alerts + ${manualConfirmations} manual = ${totalCount} total`);

    return totalCount;
}

function createObstacleMarker(obstacle, totalCount) {
    const colors = {
        flood: '#0096FF',
        accident: '#8B4513',
        protest: '#6C3BAA',
        closure: '#333333',
        traffic: '#FFBF00',
        police: '#004700'
    };

    const color = colors[obstacle.type] || colors.traffic;
    const icon = getObstacleIcon(obstacle.type);
    const displayCount = totalCount || obstacle.reports || 1;

    // All markers use white text now (no light backgrounds)
    const textColor = 'white';

    // Add danger circle for point obstacles (not for traffic jams)
    if (obstacle.type !== 'traffic') {
        // Determine circle radius based on current danger distance
        const CRITICAL_RADIUS = 0.5; // 500m - same as calculateDangerLevel
        const radiusInMeters = CRITICAL_RADIUS * 1000; // Convert km to meters

        // Create circle with same color as marker
        const circle = new google.maps.Circle({
            strokeColor: color,
            strokeOpacity: 0.5,
            strokeWeight: 2,
            fillColor: color,
            fillOpacity: 0.15,
            map: app.map,
            center: { lat: obstacle.lat, lng: obstacle.lng },
            radius: radiusInMeters
        });

        // Store circle reference for cleanup
        app.dangerCircles[obstacle.id] = circle;
    }

    // Create custom HTML marker
    const markerDiv = document.createElement('div');
    markerDiv.className = 'custom-obstacle-marker';
    markerDiv.style.cssText = 'cursor: pointer;';
    markerDiv.innerHTML = `
        <div style="
            background: ${color};
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${textColor};
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
            ">${displayCount}</div>
        </div>
    `;

    // Use AdvancedMarkerElement for custom HTML markers (modern Google Maps API)
    const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: obstacle.lat, lng: obstacle.lng },
        map: app.map,
        content: markerDiv,
        title: getObstacleLabel(obstacle.type)
    });

    // Add click listener using Google Maps API (recommended for accessibility)
    marker.addListener('click', () => {
        showObstacleDetails(obstacle);
    });

    app.obstacleMarkers[obstacle.id] = marker;
    return marker;
}

function getObstacleIcon(type) {
    const icons = {
        flood: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
    </svg>`,
        accident: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
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
        accident: 'Accident',
        protest: 'Manifestation',
        closure: 'Route fermée',
        traffic: 'Embouteillage',
        police: 'Contrôle police'
    };
    return labels[type] || 'Obstacle';
}

function showObstacleDetails(obstacle) {
    console.log('Showing obstacle details:', obstacle);
    console.log('Obstacle ID:', obstacle.id);

    const timeAgo = getTimeAgo(obstacle.timestamp);
    const label = getObstacleLabel(obstacle.type);
    const resolvedCount = obstacle.resolvedCount || 0;

    const message = `
${label}
${obstacle.description || 'Aucune description'}

📍 Zone: ${obstacle.zone || 'Inconnue'}
⏰ Signalé il y a ${timeAgo}
👥 ${obstacle.confirmations || 1} confirmations | ✅ ${resolvedCount}/5 résolu
  `;

    // Ask what the user wants to do
    const action = prompt(message + '\n\nQue voulez-vous faire ?\n1 = Confirmer\n2 = Marquer comme résolu\n0 = Annuler');

    if (action === '1') {
        console.log('User wants to confirm obstacle ID:', obstacle.id);
        handleConfirmObstacle(obstacle.id);
    } else if (action === '2') {
        console.log('User wants to mark as resolved:', obstacle.id);
        handleMarkAsResolved(obstacle.id);
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

async function handleMarkAsResolved(obstacleId) {
    if (!app.user) {
        alert('Vous devez être connecté pour marquer un obstacle comme résolu');
        promptLogin('report');
        return;
    }

    // Rate limiting
    const rateCheck = checkRateLimit('markAsResolved');
    if (!rateCheck.allowed) {
        alert(`Veuillez attendre ${rateCheck.remaining} secondes avant de marquer un autre obstacle comme résolu`);
        return;
    }

    const result = await markAsResolved(obstacleId);

    if (result.success) {
        if (result.deleted) {
            alert('✅ Obstacle résolu et supprimé! (5 utilisateurs ont confirmé la résolution)');
        } else {
            alert(`✅ Marqué comme résolu (${result.resolvedCount}/5)`);
        }
    } else {
        if (result.error === 'Déjà marqué comme résolu') {
            alert('Vous avez déjà marqué cet obstacle comme résolu');
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
        // Clear danger zones when no obstacles
        app.previousDangerZones.clear();
        return;
    }

    const CRITICAL_RADIUS = 0.5; // 500m
    const HIGH_RADIUS = 2; // 2km
    const MEDIUM_RADIUS = 5; // 5km

    let maxSeverity = 'safe';
    let closestObstacleType = null;
    const currentDangerZones = new Set();

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

            // Track zone entry for proximity notification
            const zoneKey = `${obstacle.id}_critical`;
            currentDangerZones.add(zoneKey);

            // Check if this is a NEW zone entry
            if (!app.previousDangerZones.has(zoneKey)) {
                sendProximityNotification(obstacle, 'critical', distance);
            }
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

            // Track zone entry for proximity notification
            const zoneKey = `${obstacle.id}_high`;
            currentDangerZones.add(zoneKey);

            // Check if this is a NEW zone entry
            if (!app.previousDangerZones.has(zoneKey)) {
                sendProximityNotification(obstacle, 'high', distance);
            }
        } else if (distance <= MEDIUM_RADIUS) {
            // Low (< 5km) - low severity
            currentSeverity = 'low';
            if (!closestObstacleType) closestObstacleType = obstacle.type;

            // Track zone entry (but don't notify for low severity)
            const zoneKey = `${obstacle.id}_medium`;
            currentDangerZones.add(zoneKey);
        }

        //Update max severity
        const severityOrder = { 'safe': 0, 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
        if (severityOrder[currentSeverity] > severityOrder[maxSeverity]) {
            maxSeverity = currentSeverity;
        }
    });

    // Update tracked zones
    app.previousDangerZones = currentDangerZones;

    updateDangerLevel(maxSeverity, closestObstacleType);
}

// Send proximity notification when entering danger zone
async function sendProximityNotification(obstacle, severity, distance) {
    // Rate limiting: Prevent notification spam (max 1 per 30 seconds)
    const now = Date.now();
    const NOTIFICATION_COOLDOWN = 30000; // 30 seconds

    if (now - app.lastProximityNotification < NOTIFICATION_COOLDOWN) {
        console.log('Proximity notification rate limited');
        return;
    }

    app.lastProximityNotification = now;

    const distanceText = distance < 1
        ? `${Math.round(distance * 1000)}m`
        : `${distance.toFixed(1)}km`;

    // Get danger level from obstacle
    const dangerLevel = obstacle.severity || obstacle.dangerLevel || 'medium';

    const dangerLabels = {
        low: { icon: '⚠️', label: 'Prudence', desc: 'Circulation autorisée' },
        medium: { icon: '🟠', label: 'Vérifier avant', desc: 'Vérifier les conditions' },
        high: { icon: '🔴', label: 'Danger', desc: 'Circulation interdite' }
    };

    const info = dangerLabels[dangerLevel] || dangerLabels.medium;

    const title = `${info.icon} ${info.label}`;
    const obstacleLabel = getObstacleLabel(obstacle.type);
    const body = `${obstacleLabel} à ${distanceText} - ${info.desc}`;

    console.log(`Sending proximity notification: ${title} - ${body}`);

    // Check if app is in foreground
    const isAppInForeground = !document.hidden && document.visibilityState === 'visible';

    // If app is open, show browser notification only (no FCM push)
    if (isAppInForeground) {
        // Check if user wants to suppress foreground notifications
        const userId = app.user?.uid;
        const suppressForegroundKey = `suppressForegroundNotif_${userId}`;
        const suppressForeground = localStorage.getItem(suppressForegroundKey) === 'true';

        if (!suppressForeground && 'Notification' in window && Notification.permission === 'granted') {
            // Show browser notification
            const notification = new Notification(title, {
                body: body,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                tag: `proximity_${obstacle.id}`,
                requireInteraction: false,
                vibrate: [200, 100, 200]
            });

            // Handle notification click
            notification.onclick = () => {
                window.focus();
                if (app.map && obstacle.lat && obstacle.lng) {
                    app.map.setCenter({ lat: obstacle.lat, lng: obstacle.lng });
                    app.map.setZoom(16);
                    showObstacleDetails(obstacle);
                }
                notification.close();
            };

            console.log('Browser notification shown (foreground)');
        }
    } else {
        // App is in background - Send FCM push notification via Cloud Function
        if (app.user) {
            try {
                // Create proximity alert record in database
                // This triggers the Cloud Function sendProximityNotification
                const alertRef = database.ref(`proximityAlerts/${app.user.uid}`).push();
                await alertRef.set({
                    obstacleId: obstacle.id,
                    obstacleType: obstacle.type,
                    severity: severity,
                    distance: distance,
                    timestamp: Date.now()
                });
                console.log('Proximity alert created in database for FCM push');
            } catch (error) {
                console.error('Error creating proximity alert:', error);
            }
        }
    }
}

function updateDangerLevel(level, obstacleType = null) {
    app.dangerLevel = level;
    const config = DANGER_LEVELS[level];

    // Couleurs basées sur le type d'obstacle ET le niveau
    const obstacleColors = {
        flood: '#0096FF',      // Bright blue
        accident: '#8B4513',   // Brown
        protest: '#6C3BAA',    // Purple
        closure: '#333333',    // Black
        traffic: '#FFBF00',    // Amber
        police: '#004700'      // Dark green
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

    // Update user marker color (Google Maps AdvancedMarkerElement)
    if (app.userMarker && app.userMarkerDiv) {
        const markerColor = obstacleType ? obstacleColors[obstacleType] : levelColors[level];

        // Update the background color of the marker div
        app.userMarkerDiv.style.background = markerColor;
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
    // Step 1: Check browser support
    if (!('Notification' in window)) {
        console.log('Notifications non supportées');
        alert('Votre navigateur ne supporte pas les notifications');
        return;
    }

    // Step 2: Check user authentication
    if (!app.user) {
        alert('Connectez-vous pour activer les notifications');
        return;
    }

    // Step 3: Request browser permission
    const permission = await Notification.requestPermission();
    app.notificationsEnabled = permission === 'granted';

    if (permission === 'granted') {
        console.log('Permission accordée');

        try {
            // Step 4: Wait for Service Worker to be ready
            let registration = null;
            if ('serviceWorker' in navigator) {
                registration = await navigator.serviceWorker.ready;
                console.log('Service Worker prêt:', registration.active?.scriptURL);
            }

            // Step 5: Get FCM token from Firebase
            const token = await getToken(messaging, {
                vapidKey: 'BIL4dNbV90yM_ulonvJibpWlbV7IOOHyeE2JFgHJnf48Qqzr3kUaai0MxoR2byoO5n4Wpy6I4sd5SuezQ3eTrbU',
                serviceWorkerRegistration: registration  // Use our custom service-worker.js
            });

            if (token) {
                console.log('Token FCM obtenu:', token.substring(0, 20) + '...');

                // Step 6: Save token to database
                await saveNotificationToken(app.user.uid, token);

                // Step 6.5: Set default preference to suppress foreground notifications
                const suppressForegroundKey = `suppressForegroundNotif_${app.user.uid}`;
                if (!localStorage.getItem(suppressForegroundKey)) {
                    // Default to true (suppress foreground notifications)
                    localStorage.setItem(suppressForegroundKey, 'true');
                    console.log('Paramètre par défaut: Masquer notifications foreground = true');
                }

                // Step 7: Update UI
                document.getElementById('btn-notifications').classList.add('active');
                alert('Notifications activées! Vous recevrez des alertes pour les obstacles dans un rayon de 1,6 km.');

            } else {
                console.error('Impossible d\'obtenir le token FCM');
                alert('Erreur: Impossible d\'activer les notifications');
                document.getElementById('btn-notifications').classList.remove('active');
            }

        } catch (error) {
            console.error('Erreur FCM:', error);
            alert('Erreur: ' + error.message);
            document.getElementById('btn-notifications').classList.remove('active');
        }

    } else if (permission === 'denied') {
        console.log('Permission refusée');
        document.getElementById('btn-notifications').classList.remove('active');
        alert('Vous avez refusé les notifications. Pour les activer, modifiez les paramètres de votre navigateur.');
    }
}


// Service Worker

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
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

    // Show map and trigger resize
    if (viewName === 'map' && app.map && typeof google !== 'undefined') {
        setTimeout(() => google.maps.event.trigger(app.map, 'resize'), 100);
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

async function updateSettingsView() {
    const userEmailDisplay = document.getElementById('user-email-display');
    if (app.user) {
        userEmailDisplay.textContent = app.user.email;
    } else {
        userEmailDisplay.textContent = 'Non connecté';
    }

    // Load user preference for foreground notification suppression
    const userId = app.user?.uid;
    if (userId) {
        const suppressForegroundKey = `suppressForegroundNotif_${userId}`;
        const suppressForeground = localStorage.getItem(suppressForegroundKey) === 'true';

        const toggleBtn = document.getElementById('toggle-suppress-foreground');
        if (toggleBtn) {
            toggleBtn.textContent = suppressForeground ? 'Activé' : 'Désactivé';
            toggleBtn.classList.toggle('active', suppressForeground);
        }

        // Load "all" topic subscription status from Firebase
        try {
            const allTopicRef = ref(database, `users/${userId}/subscribedToAll`);
            const snapshot = await get(allTopicRef);
            const subscribedToAll = snapshot.val() === true;

            const allTopicToggleBtn = document.getElementById('toggle-all-topic');
            if (allTopicToggleBtn) {
                allTopicToggleBtn.textContent = subscribedToAll ? 'Activé' : 'Désactivé';
                allTopicToggleBtn.classList.toggle('active', subscribedToAll);
            }
        } catch (error) {
            console.error('Erreur chargement préférence "all" topic:', error);
        }
    }
}

function getObstacleColor(type) {
    const colors = {
        flood: '#0096FF',
        accident: '#8B4513',
        protest: '#6C3BAA',
        closure: '#333333',
        traffic: '#FFBF00',
        police: '#004700'
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
    document.getElementById('close-auth-modal').addEventListener('click', () => {
        closeModal('auth-modal');
        // Reset auth modal to initial state
        document.getElementById('email-auth-form').style.display = 'none';
        document.getElementById('auth-selection').style.display = 'flex';
        document.getElementById('email-input').value = '';
        document.getElementById('password-input').value = '';
        document.getElementById('auth-error-message').style.display = 'none';
    });
    document.getElementById('close-report-modal').addEventListener('click', () => {
        closeModal('report-modal');
        // Reset report modal to first step
        document.querySelector('.report-grid').style.display = 'grid';
        document.getElementById('danger-level-selection').style.display = 'none';
    });

    // Modals - Authentification
    document.getElementById('btn-google-auth').addEventListener('click', () => login('google'));

    // Email auth - Show email form
    document.getElementById('btn-show-email-auth')?.addEventListener('click', () => {
        document.getElementById('auth-selection').style.display = 'none';
        document.getElementById('email-auth-form').style.display = 'block';
    });

    // Email auth - Back to selection
    document.getElementById('btn-back-to-auth-selection')?.addEventListener('click', () => {
        document.getElementById('email-auth-form').style.display = 'none';
        document.getElementById('auth-selection').style.display = 'flex';
        // Reset form
        document.getElementById('email-input').value = '';
        document.getElementById('password-input').value = '';
        document.getElementById('auth-error-message').style.display = 'none';
    });

    // Email auth - Toggle between login and signup
    let isSignupMode = false;
    document.getElementById('btn-toggle-signup')?.addEventListener('click', () => {
        isSignupMode = !isSignupMode;
        const formTitle = document.getElementById('email-form-title');
        const submitBtn = document.getElementById('btn-email-submit');
        const toggleBtn = document.getElementById('btn-toggle-signup');

        if (isSignupMode) {
            formTitle.textContent = 'Inscription';
            submitBtn.textContent = 'S\'inscrire';
            toggleBtn.innerHTML = 'Déjà un compte ? <strong>Se connecter</strong>';
        } else {
            formTitle.textContent = 'Connexion';
            submitBtn.textContent = 'Se connecter';
            toggleBtn.innerHTML = 'Pas de compte ? <strong>S\'inscrire</strong>';
        }
    });

    // Email auth - Form submission
    document.getElementById('email-auth-form-fields')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleEmailAuth(isSignupMode);
    });

    // Password visibility toggle
    document.getElementById('toggle-password')?.addEventListener('click', () => {
        const passwordInput = document.getElementById('password-input');
        const eyeIconClosed = document.getElementById('eye-icon-closed');
        const eyeIconOpen = document.getElementById('eye-icon-open');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIconClosed.style.display = 'none';
            eyeIconOpen.style.display = 'block';
        } else {
            passwordInput.type = 'password';
            eyeIconClosed.style.display = 'block';
            eyeIconOpen.style.display = 'none';
        }
    });

    // Modals - reporting with two-step flow
    // STATE: Track selected obstacle type
    let selectedObstacleType = null;

    // STEP 1: User clicks obstacle type
    document.querySelectorAll('.report-card').forEach(card => {
        card.addEventListener('click', () => {
            selectedObstacleType = card.getAttribute('data-type');

            // Get obstacle label
            const labels = {
                flood: 'Inondation',
                accident: 'Accident',
                protest: 'Manifestation',
                closure: 'Route fermée',
                traffic: 'Embouteillage',
                police: 'Contrôle police'
            };

            // Hide/show "low" danger level based on obstacle type
            const lowDangerBtn = document.querySelector('.danger-level-btn[data-level="low"]');
            if (lowDangerBtn) {
                if (selectedObstacleType === 'accident') {
                    // Hide "low" level for accidents
                    lowDangerBtn.style.display = 'none';
                } else {
                    // Show "low" level for other obstacle types
                    lowDangerBtn.style.display = 'flex';
                }
            }

            // Show danger level selection
            document.querySelector('.report-grid').style.display = 'none';
            document.getElementById('danger-level-selection').style.display = 'block';
            document.getElementById('selected-obstacle-title').textContent =
                `Niveau de danger: ${labels[selectedObstacleType]}`;
        });
    });

    // STEP 2: User selects danger level
    document.querySelectorAll('.danger-level-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const dangerLevel = btn.getAttribute('data-level');
            handleReport(selectedObstacleType, dangerLevel);
        });
    });

    // Back button
    document.getElementById('back-to-type-selection')?.addEventListener('click', () => {
        document.querySelector('.report-grid').style.display = 'grid';
        document.getElementById('danger-level-selection').style.display = 'none';
        selectedObstacleType = null;
    });

    // Close
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Settings - Suppress foreground notifications toggle
    document.getElementById('toggle-suppress-foreground')?.addEventListener('click', () => {
        if (!app.user) {
            alert('Connectez-vous pour modifier ce paramètre');
            return;
        }

        const userId = app.user.uid;
        const suppressForegroundKey = `suppressForegroundNotif_${userId}`;
        const currentValue = localStorage.getItem(suppressForegroundKey) === 'true';
        const newValue = !currentValue;

        // Save preference
        localStorage.setItem(suppressForegroundKey, newValue.toString());

        // Update UI
        const toggleBtn = document.getElementById('toggle-suppress-foreground');
        toggleBtn.textContent = newValue ? 'Activé' : 'Désactivé';
        toggleBtn.classList.toggle('active', newValue);

        console.log(`Paramètre mis à jour: Masquer notifications foreground = ${newValue}`);
    });

    // Settings - "All" topic subscription toggle
    document.getElementById('toggle-all-topic')?.addEventListener('click', async () => {
        if (!app.user) {
            alert('Connectez-vous pour modifier ce paramètre');
            return;
        }

        const userId = app.user.uid;
        const toggleBtn = document.getElementById('toggle-all-topic');
        const currentValue = toggleBtn.classList.contains('active');
        const newValue = !currentValue;

        try {
            if (newValue) {
                // Subscribe to "all" topic
                const result = await subscribeToAllTopic(userId);
                if (result.success) {
                    toggleBtn.textContent = 'Activé';
                    toggleBtn.classList.add('active');
                    alert('Vous êtes maintenant abonné aux alertes nationales. Vous recevrez des notifications pour toute la Côte d\'Ivoire.');
                    console.log('Abonné au topic "all"');
                } else {
                    alert('Erreur lors de l\'abonnement: ' + result.error);
                }
            } else {
                // Unsubscribe from "all" topic
                const result = await unsubscribeFromAllTopic(userId);
                if (result.success) {
                    toggleBtn.textContent = 'Désactivé';
                    toggleBtn.classList.remove('active');
                    alert('Vous ne recevrez plus que les alertes de votre zone.');
                    console.log('Désabonné du topic "all"');
                } else {
                    alert('Erreur lors du désabonnement: ' + result.error);
                }
            }
        } catch (error) {
            console.error('Erreur toggle topic "all":', error);
            alert('Erreur: ' + error.message);
        }
    });
}

// CASE 3: Listen for admin notifications to change header color
window.addEventListener('adminNotification', (event) => {
    const { payload, isInArea } = event.detail;

    console.log('Admin notification event received');
    console.log('User in area:', isInArea);

    if (isInArea) {
        // Change header to admin notification color (e.g., purple for admin)
        const header = document.getElementById('header');
        if (header) {
            header.style.background = 'linear-gradient(to right, #9333ea, #7c3aed)'; // Purple gradient
            header.style.transition = 'background 0.3s ease';

            // Update danger status text
            const dangerStatus = document.getElementById('danger-status');
            if (dangerStatus) {
                dangerStatus.textContent = '📢 ' + (payload.notification?.title || 'Message Admin');
            }

            console.log('✅ Header color changed for admin notification');

            // Reset after 10 seconds
            setTimeout(() => {
                header.style.background = '';
                if (dangerStatus) {
                    calculateDangerLevel(); // Restore normal danger level
                }
                console.log('Header reset to normal');
            }, 10000);
        }
    }
});

// Listen for Service Worker messages (notification clicks)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message from Service Worker:', event.data);

        if (event.data && event.data.type === 'notificationClick') {
            const { notificationType, obstacleId } = event.data;

            console.log(`Notification clicked: ${notificationType}`);

            // Handle different notification types
            if (notificationType === 'admin') {
                // Admin notification clicked - just focus the app
                console.log('Admin notification clicked');
                // App is already focused by Service Worker
            } else if (notificationType === 'obstacle' || notificationType === 'proximity') {
                // Obstacle/Proximity notification - zoom to obstacle
                if (obstacleId && window.zoomToObstacle) {
                    console.log('Zooming to obstacle:', obstacleId);
                    window.zoomToObstacle(obstacleId);
                }
            }
        }
    });
}

// Page visibilty change event
// Prevent reload when returning to app (fix for Samsung Galaxy)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('App resumed - updating data without reload');

        // Update data without full reload
        if (app.map && typeof google !== 'undefined') {
            google.maps.event.trigger(app.map, 'resize');
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
        if (app.map && typeof google !== 'undefined') {
            google.maps.event.trigger(app.map, 'resize');
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
    console.log('PWA Install prompt available');

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

// Fonction globale pour zoomer sur un obstacle depuis une notification
window.zoomToObstacle = function (obstacleId) {
    console.log('Recherche obstacle:', obstacleId);

    const obstacle = app.obstacles.find(o => o.id === obstacleId);

    if (obstacle) {
        // Zoomer sur la carte (Google Maps)
        app.map.setCenter({ lat: obstacle.lat, lng: obstacle.lng });
        app.map.setZoom(16);

        // Afficher les détails
        showObstacleDetails(obstacle);

        console.log('Obstacle affiché:', obstacleId);
    } else {
        console.warn('Obstacle introuvable:', obstacleId);
    }
};


console.log('app.js chargé');