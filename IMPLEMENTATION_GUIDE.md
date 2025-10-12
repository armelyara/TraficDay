# 🚀 TraficDay - Implementation Guide for Notification & Danger Level System

## 📋 Overview

This guide covers all the changes needed to implement:
1. ✅ Automatic obstacle notifications for outside users with "all" topic (DONE)
2. ⚠️ Admin notifications showing push when app is open
3. ⚠️ Admin notifications showing alert details for inside users
4. ⚠️ Context-aware danger level system for each obstacle type
5. ⚠️ French labels for danger levels

---

## 1. ✅ Cloud Function - ALREADY DONE

**File**: `functions/index.js` (lines 66-110)

The Cloud Function has been updated to send automatic obstacle notifications to:
- Users within 1.6km radius (inside area)
- Users outside area who subscribed to "all" topic

**No action needed** - This is already deployed.

---

## 2. ⚠️ Fix Admin Notifications (App Open)

### **Problem:**
- Currently: Admin notifications are silent when app is open
- Required: Show push notification with sound when app is open

### **File to Edit**: `public/firebase-config.js`

**Find** (around line 524-552):
```javascript
// CASE 3: Handle ADMIN notifications differently
if (notificationType === 'admin') {
    console.log('📢 Admin notification received');

    const isInArea = checkIfUserInNotificationArea(payload.data);

    console.log('📍 User in notification area:', isInArea);

    if (isAppVisible) {
        // App is OPEN
        if (isInArea) {
            // In-area: Change header color (silent mode)
            console.log('🎨 In-area user + App open → Change header color');
            window.dispatchEvent(new CustomEvent('adminNotification', {
                detail: { payload, isInArea: true }
            }));
            return; // No popup notification
        } else {
            // Outside area: Silent message
            console.log('🔕 Outside area + App open → Silent message');
            return; // No action
        }
    } else {
        // App is CLOSED - handled by Service Worker
        console.log('📱 App closed → Service Worker will handle');
        return;
    }
}
```

**Replace with:**
```javascript
// CASE 3: Handle ADMIN notifications differently
if (notificationType === 'admin') {
    console.log('📢 Admin notification received');

    const isInArea = checkIfUserInNotificationArea(payload.data);

    console.log('📍 User in notification area:', isInArea);

    // ALWAYS show push notification for admin messages (both app open/closed)
    const notificationTitle = payload.notification?.title || '📢 Message Administrateur';
    const notificationBody = payload.notification?.body || 'Nouvelle alerte administrative';

    const notificationOptions = {
        body: notificationBody,
        icon: '/icons/android/icon-192.png',
        badge: '/icons/android/icon-72.png',
        tag: 'admin-notification',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        silent: false
    };

    if (Notification.permission === 'granted') {
        const notification = new Notification(notificationTitle, notificationOptions);
        console.log('✅ Admin notification displayed');

        notification.onclick = (event) => {
            event.preventDefault();
            window.focus();

            // If inside area, also update header color
            if (isInArea && isAppVisible) {
                window.dispatchEvent(new CustomEvent('adminNotification', {
                    detail: { payload, isInArea: true }
                }));
            }

            notification.close();
        };
    }

    return; // Done handling admin notification
}
```

---

## 3. ⚠️ Add Danger Level System for Each Obstacle Type

### **File to Create**: `public/danger-levels.js`

Create a new file with the danger level system:

```javascript
// Danger Level System for TraficDay
// Each obstacle type has context-aware danger levels

export const DANGER_LEVELS = {
    // Inondation (Flood)
    flood: {
        low: {
            icon: '⚠️',
            label: 'Prudence',
            description: 'Circulation autorisée',
            color: '#fbbf24', // Yellow
            severity: 'low'
        },
        medium: {
            icon: '🟠',
            label: 'Vérifier avant',
            description: 'Vérifier les conditions avant de circuler',
            color: '#f97316', // Orange
            severity: 'medium'
        },
        high: {
            icon: '🔴',
            label: 'Danger',
            description: 'Circulation interdite',
            color: '#dc2626', // Red
            severity: 'high'
        }
    },

    // Manifestation (Protest)
    protest: {
        low: {
            icon: '⚠️',
            label: 'Prudence',
            description: 'Circulation autorisée',
            color: '#fbbf24',
            severity: 'low'
        },
        medium: {
            icon: '🟠',
            label: 'Vérifier avant',
            description: 'Vérifier les conditions avant de circuler',
            color: '#f97316',
            severity: 'medium'
        },
        high: {
            icon: '🔴',
            label: 'Danger',
            description: 'Circulation interdite',
            color: '#dc2626',
            severity: 'high'
        }
    },

    // Embouteillage (Traffic Jam) - Based on proximity distance
    traffic: {
        low: {
            icon: '⚠️',
            label: 'Prudence',
            description: 'Trafic ralentissant',
            color: '#fbbf24',
            severity: 'low',
            distanceThreshold: 2000 // > 2km
        },
        medium: {
            icon: '🟠',
            label: 'Vigilance',
            description: 'Trafic très ralentissant',
            color: '#f97316',
            severity: 'medium',
            distanceThreshold: 500 // 500m - 2km
        },
        high: {
            icon: '🔴',
            label: 'Danger',
            description: 'Trafic bloqué',
            color: '#dc2626',
            severity: 'high',
            distanceThreshold: 0 // < 500m
        }
    },

    // Route fermée (Closure)
    closure: {
        low: {
            icon: '⚠️',
            label: 'Prudence',
            description: 'Circulation autorisée',
            color: '#fbbf24',
            severity: 'low'
        },
        medium: {
            icon: '🟠',
            label: 'Vigilance',
            description: 'Trafic très ralentissant',
            color: '#f97316',
            severity: 'medium'
        },
        high: {
            icon: '🔴',
            label: 'Danger',
            description: 'Circulation interdite',
            color: '#dc2626',
            severity: 'high'
        }
    },

    // Contrôle de police (Police) - Based on speed limit and proximity
    police: {
        low: {
            icon: '⚠️',
            label: 'Prudence',
            description: 'Limite de vitesse atteinte',
            color: '#fbbf24',
            severity: 'low',
            distanceThreshold: 2000 // > 2km
        },
        medium: {
            icon: '🟠',
            label: 'Vigilance',
            description: 'Ralentissez',
            color: '#f97316',
            severity: 'medium',
            distanceThreshold: 1000 // 1km - 2km
        },
        high: {
            icon: '🔴',
            label: 'Danger',
            description: 'Sous radar',
            color: '#dc2626',
            severity: 'high',
            distanceThreshold: 0 // < 1km
        }
    }
};

/**
 * Calculate danger level based on obstacle type and distance
 * @param {string} obstacleType - Type of obstacle (flood, protest, traffic, closure, police)
 * @param {number} distance - Distance to obstacle in km
 * @param {object} obstacle - Full obstacle object (for future context-aware calculations)
 * @returns {object} - Danger level object with icon, label, description, color, severity
 */
export function calculateDangerLevelForObstacle(obstacleType, distance, obstacle = null) {
    const levels = DANGER_LEVELS[obstacleType];

    if (!levels) {
        // Default fallback
        return {
            icon: '⚠️',
            label: 'Alerte',
            description: 'Obstacle signalé',
            color: '#fbbf24',
            severity: 'low'
        };
    }

    // For traffic and police, use distance-based calculation
    if (obstacleType === 'traffic' || obstacleType === 'police') {
        const distanceInMeters = distance * 1000;

        if (distanceInMeters < levels.high.distanceThreshold || distanceInMeters < 500) {
            return levels.high;
        } else if (distanceInMeters < levels.medium.distanceThreshold || distanceInMeters < 1000) {
            return levels.medium;
        } else {
            return levels.low;
        }
    }

    // For other obstacle types, use the obstacle's severity if available
    if (obstacle && obstacle.severity) {
        const severityMap = {
            'low': levels.low,
            'medium': levels.medium,
            'high': levels.high,
            'critical': levels.high
        };
        return severityMap[obstacle.severity] || levels.medium;
    }

    // Default to medium if no context available
    return levels.medium;
}

/**
 * Get French description for danger level
 * @param {string} obstacleType - Type of obstacle
 * @param {string} severity - Severity level (low, medium, high)
 * @returns {string} - French description
 */
export function getDangerDescription(obstacleType, severity) {
    const levels = DANGER_LEVELS[obstacleType];
    if (!levels || !levels[severity]) {
        return 'Obstacle signalé';
    }
    return levels[severity].description;
}
```

---

## 4. ⚠️ Update app.js to Use Danger Level System

### **File to Edit**: `public/app.js`

**Step 1**: Import the danger level module at the top of the file (after other imports):

```javascript
import { calculateDangerLevelForObstacle, DANGER_LEVELS } from './danger-levels.js';
```

**Step 2**: Find the `calculateDangerLevel()` function (around line 844) and update it:

**Find:**
```javascript
function calculateDangerLevel() {
    if (!app.userLocation || app.obstacles.length === 0) {
        updateDangerLevel('safe');
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
            currentSeverity = 'critical';
            closestObstacleType = obstacle.type;

            const zoneKey = `${obstacle.id}_critical`;
            currentDangerZones.add(zoneKey);

            if (!app.previousDangerZones.has(zoneKey)) {
                sendProximityNotification(obstacle, 'critical', distance);
            }
        } else if (distance <= HIGH_RADIUS) {
            if (obstacle.severity === 'critical') {
                currentSeverity = 'critical';
            } else if (obstacle.severity === 'high') {
                currentSeverity = 'high';
            } else {
                currentSeverity = 'medium';
            }
            if (!closestObstacleType) closestObstacleType = obstacle.type;

            const zoneKey = `${obstacle.id}_high`;
            currentDangerZones.add(zoneKey);

            if (!app.previousDangerZones.has(zoneKey)) {
                sendProximityNotification(obstacle, 'high', distance);
            }
        } else if (distance <= MEDIUM_RADIUS) {
            currentSeverity = 'low';
            if (!closestObstacleType) closestObstacleType = obstacle.type;

            const zoneKey = `${obstacle.id}_medium`;
            currentDangerZones.add(zoneKey);
        }

        const severityOrder = { 'safe': 0, 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
        if (severityOrder[currentSeverity] > severityOrder[maxSeverity]) {
            maxSeverity = currentSeverity;
        }
    });

    app.previousDangerZones = currentDangerZones;

    updateDangerLevel(maxSeverity, closestObstacleType);
}
```

**Replace with:**
```javascript
function calculateDangerLevel() {
    if (!app.userLocation || app.obstacles.length === 0) {
        updateDangerLevel('safe');
        app.previousDangerZones.clear();
        return;
    }

    const CRITICAL_RADIUS = 0.5; // 500m
    const HIGH_RADIUS = 2; // 2km
    const MEDIUM_RADIUS = 5; // 5km

    let maxSeverity = 'safe';
    let closestObstacle = null;
    let closestDistance = Infinity;
    const currentDangerZones = new Set();

    app.obstacles.forEach(obstacle => {
        const distance = calculateDistance(
            app.userLocation.lat,
            app.userLocation.lng,
            obstacle.lat,
            obstacle.lng
        );

        // Calculate context-aware danger level for this obstacle
        const dangerLevel = calculateDangerLevelForObstacle(obstacle.type, distance, obstacle);
        let currentSeverity = dangerLevel.severity;

        if (distance <= CRITICAL_RADIUS) {
            const zoneKey = `${obstacle.id}_critical`;
            currentDangerZones.add(zoneKey);

            if (!app.previousDangerZones.has(zoneKey)) {
                sendProximityNotification(obstacle, dangerLevel.severity, distance);
            }
        } else if (distance <= HIGH_RADIUS) {
            const zoneKey = `${obstacle.id}_high`;
            currentDangerZones.add(zoneKey);

            if (!app.previousDangerZones.has(zoneKey)) {
                sendProximityNotification(obstacle, dangerLevel.severity, distance);
            }
        } else if (distance <= MEDIUM_RADIUS) {
            const zoneKey = `${obstacle.id}_medium`;
            currentDangerZones.add(zoneKey);
        }

        // Track closest obstacle for UI display
        if (distance < closestDistance) {
            closestDistance = distance;
            closestObstacle = obstacle;
        }

        // Update max severity
        const severityOrder = { 'safe': 0, 'low': 1, 'medium': 2, 'high': 3 };
        if (severityOrder[currentSeverity] > severityOrder[maxSeverity]) {
            maxSeverity = currentSeverity;
        }
    });

    app.previousDangerZones = currentDangerZones;

    // Pass full obstacle context to updateDangerLevel
    updateDangerLevel(maxSeverity, closestObstacle, closestDistance);
}
```

**Step 3**: Update the `updateDangerLevel()` function signature (around line 1010):

**Find:**
```javascript
function updateDangerLevel(level, obstacleType = null) {
```

**Replace with:**
```javascript
function updateDangerLevel(level, closestObstacle = null, distance = null) {
```

**Step 4**: Update the UI display logic inside `updateDangerLevel()`:

**Find** (around line 1040-1060):
```javascript
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
}
```

**Replace with:**
```javascript
// Update danger status with context-aware level
let statusText = `${config.icon} ${config.label}`;
let description = config.description;

if (closestObstacle && distance !== null) {
    // Get context-aware danger level for display
    const dangerInfo = calculateDangerLevelForObstacle(closestObstacle.type, distance, closestObstacle);
    statusText = `${dangerInfo.icon} ${dangerInfo.label}`;
    description = dangerInfo.description;

    const obstacleLabel = getObstacleLabel(closestObstacle.type);
    const distanceText = distance < 1
        ? `${Math.round(distance * 1000)}m`
        : `${distance.toFixed(1)}km`;
    description = `${obstacleLabel} à ${distanceText} - ${dangerInfo.description}`;
}

document.getElementById('danger-status').textContent = statusText;

// Update banners
const dangerBanner = document.getElementById('danger-banner');
const guestBanner = document.getElementById('guest-banner');

if (level !== 'safe') {
    dangerBanner.style.display = 'block';
    dangerBanner.style.background = headerColor;
    guestBanner.style.display = 'none';
    document.getElementById('danger-title').textContent = statusText;
    document.getElementById('danger-subtitle').textContent = description;
}
```

---

## 5. ⚠️ Update Proximity Notifications to Use Danger Levels

### **File to Edit**: `public/app.js`

**Find** the `sendProximityNotification()` function (around line 927):

**Find:**
```javascript
const severityLabels = {
    critical: '🔴 Danger',
    high: '🟠 Vigilance accrue'
};

const title = severityLabels[severity] || '⚠️ ALERTE';
const obstacleLabel = getObstacleLabel(obstacle.type);
const body = `${obstacleLabel} à ${distanceText} de votre position`;
```

**Replace with:**
```javascript
// Get context-aware danger level
const dangerInfo = calculateDangerLevelForObstacle(obstacle.type, distance, obstacle);

const title = `${dangerInfo.icon} ${dangerInfo.label}`;
const obstacleLabel = getObstacleLabel(obstacle.type);
const body = `${obstacleLabel} à ${distanceText} - ${dangerInfo.description}`;
```

---

## 6. ⚠️ Update Cloud Function to Use Danger Levels

### **File to Edit**: `functions/index.js`

**Find** the proximity notification function (around line 272-278):

**Find:**
```javascript
const severityLabels = {
    critical: '🔴 Danger',
    high: '🟠 Vigilance Accrue'
};

const title = severityLabels[severity] || '⚠️ ALERTE';
const body = `${obstacleLabels[obstacleType]} à ${distanceText} de votre position`;
```

**Replace with:**
```javascript
// Map severity to French labels
const severityLabels = {
    low: '⚠️ Prudence',
    medium: '🟠 Vigilance',
    high: '🔴 Danger',
    critical: '🔴 Danger'
};

const title = severityLabels[severity] || '⚠️ ALERTE';
const body = `${obstacleLabels[obstacleType]} à ${distanceText} de votre position`;
```

---

## 7. 🧪 Testing Checklist

### **Automatic Obstacle Notifications:**
- [ ] Test inside user (app open) → Header changes with context-aware level
- [ ] Test inside user (app closed) → Push notification
- [ ] Test outside user with "all" (app open) → No header change
- [ ] Test outside user with "all" (app closed) → Push notification

### **Admin Notifications:**
- [ ] Test inside user (app open) → Push notification
- [ ] Test inside user (app closed) → Push notification
- [ ] Test outside user with "all" (app open) → Push notification
- [ ] Test outside user with "all" (app closed) → Push notification

### **Proximity Notifications:**
- [ ] Test approaching flood → Context-aware level based on distance
- [ ] Test approaching traffic → Level changes based on distance (>2km, 500m-2km, <500m)
- [ ] Test approaching police → Level changes based on distance (>2km, 1-2km, <1km)
- [ ] Test app open → Browser notification with French labels
- [ ] Test app closed → Push notification with French labels

### **Danger Level Display:**
- [ ] Flood shows: Prudence / Vérifier avant / Danger
- [ ] Protest shows: Prudence / Vérifier avant / Danger
- [ ] Traffic shows: Trafic ralentissant / très ralentissant / bloqué
- [ ] Closure shows: Circulation autorisée / Vigilance / Interdite
- [ ] Police shows: Limite atteinte / Ralentissez / Sous radar

---

## 8. 🚀 Deployment Steps

1. **Commit all changes:**
```bash
git add .
git commit -m "Add context-aware danger levels and fix admin notifications"
```

2. **Deploy Cloud Functions:**
```bash
firebase deploy --only functions
```

3. **Deploy Hosting:**
```bash
firebase deploy --only hosting
```

4. **Test everything** using the checklist above

---

## 9. 📝 Summary of Changes

| File | Changes | Status |
|------|---------|--------|
| `functions/index.js` | Added outside users to automatic notifications | ✅ DONE |
| `public/firebase-config.js` | Fixed admin notifications to show push when app open | ⚠️ TODO |
| `public/danger-levels.js` | Created new danger level system | ⚠️ TODO |
| `public/app.js` | Updated to use context-aware danger levels | ⚠️ TODO |

---

## 10. ❓ Questions or Issues?

If you encounter any issues during implementation:

1. Check browser console for error messages
2. Check Firebase Functions logs: `firebase functions:log`
3. Verify all imports are correct
4. Test with small changes first before deploying everything

Good luck with the implementation! 🚀
