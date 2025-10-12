# 🎯 TraficDay - FINAL Implementation with Exact Logic

## Core Logic Rules

### ✅ **Confirmed Requirements:**
1. **User reports**: User chooses danger level → Stored in database
2. **Admin alerts**: Parse from emoji in title (🔴 = high, 🟠 = medium, ⚠️ = low)
3. **Proximity**: Use stored danger level + distance
4. **Header color**: Based on **obstacle TYPE** (not danger level)
5. **Description**: Based on obstacle type + danger level
6. **Notifications**: Include danger level description (e.g., "Manifestation à 500m - Circulation interdite")

---

## Step 1: Add Danger Level Selection UI (After Obstacle Type)

### **File**: `public/index.html`

**After line 163** (after closing `</div>` of report-grid), add:

```html
            <!-- Step 2: Danger Level Selection (Hidden by default) -->
            <div id="danger-level-selection" style="display: none; padding: 20px;">
                <h3 id="selected-obstacle-title" style="text-align: center; margin-bottom: 20px; color: #1f2937;"></h3>

                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button class="danger-level-btn" data-level="low" style="padding: 16px; border: 2px solid #fbbf24; border-radius: 12px; background: white; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: all 0.3s;">
                        <span style="font-size: 32px;">⚠️</span>
                        <div style="text-align: left; flex: 1;">
                            <div style="font-weight: bold; font-size: 16px; color: #1f2937;">Prudence</div>
                            <div style="font-size: 14px; color: #6b7280;">Circulation autorisée</div>
                        </div>
                    </button>

                    <button class="danger-level-btn" data-level="medium" style="padding: 16px; border: 2px solid #f97316; border-radius: 12px; background: white; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: all 0.3s;">
                        <span style="font-size: 32px;">🟠</span>
                        <div style="text-align: left; flex: 1;">
                            <div style="font-weight: bold; font-size: 16px; color: #1f2937;">Vérifier avant</div>
                            <div style="font-size: 14px; color: #6b7280;">Vérifier les conditions avant de circuler</div>
                        </div>
                    </button>

                    <button class="danger-level-btn" data-level="high" style="padding: 16px; border: 2px solid #dc2626; border-radius: 12px; background: white; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: all 0.3s;">
                        <span style="font-size: 32px;">🔴</span>
                        <div style="text-align: left; flex: 1;">
                            <div style="font-weight: bold; font-size: 16px; color: #1f2937;">Danger</div>
                            <div style="font-size: 14px; color: #6b7280;">Circulation interdite</div>
                        </div>
                    </button>
                </div>

                <button id="back-to-type-selection" style="width: 100%; padding: 12px; margin-top: 16px; background: #e5e7eb; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    ← Retour
                </button>
            </div>
```

**Add CSS** for hover effects in `styles.css`:

```css
.danger-level-btn:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

---

## Step 2: Update JavaScript for Two-Step Flow

### **File**: `public/app.js`

**Find** line ~1365 where report cards are handled:

```javascript
// Modals - reporting
document.querySelectorAll('.report-card').forEach(card => {
    card.addEventListener('click', () => {
        const type = card.getAttribute('data-type');
        handleReport(type);
    });
});
```

**Replace with**:

```javascript
// STATE: Track selected obstacle type
let selectedObstacleType = null;

// STEP 1: User clicks obstacle type
document.querySelectorAll('.report-card').forEach(card => {
    card.addEventListener('click', () => {
        selectedObstacleType = card.getAttribute('data-type');

        // Get obstacle label
        const labels = {
            flood: 'Inondation',
            protest: 'Manifestation',
            closure: 'Route fermée',
            traffic: 'Embouteillage',
            police: 'Contrôle police'
        };

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

// Reset modal when closed
const originalCloseHandler = document.getElementById('close-report-modal');
originalCloseHandler.addEventListener('click', () => {
    document.querySelector('.report-grid').style.display = 'grid';
    document.getElementById('danger-level-selection').style.display = 'none';
    selectedObstacleType = null;
});
```

---

## Step 3: Update handleReport to Accept Danger Level

### **File**: `public/app.js`

**Find** `handleReport` function (around line 470):

```javascript
async function handleReport(type) {
```

**Change signature to**:

```javascript
async function handleReport(type, userSelectedDangerLevel) {
```

**Find** inside the function (around line 504):

```javascript
const severities = {
    flood: 'high',
    protest: 'critical',
    closure: 'medium',
    traffic: 'medium',
    police: 'low'
};

const newObstacle = {
    type: type,
    lat: Math.round(app.userLocation.lat * 1000) / 1000,
    lng: Math.round(app.userLocation.lng * 1000) / 1000,
    description: `${getObstacleLabel(type)} signalé(e)`,
    reports: 1,
    severity: severities[type],
    zone: 'Ma zone',
    userId: app.user.uid,
    confirmedBy: [app.user.uid]
};
```

**Replace with**:

```javascript
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
    lat: Math.round(app.userLocation.lat * 1000) / 1000,
    lng: Math.round(app.userLocation.lng * 1000) / 1000,
    description: `${getObstacleLabel(type)} - ${dangerDescriptions[severity]}`,
    reports: 1,
    severity: severity, // Store user-selected danger level
    dangerLevel: severity, // Also store as dangerLevel for clarity
    zone: 'Ma zone',
    userId: app.user.uid,
    confirmedBy: [app.user.uid]
};
```

**At the end of handleReport**, after closeModal:

```javascript
if (result.success) {
    closeModal('report-modal');

    // Reset modal
    document.querySelector('.report-grid').style.display = 'grid';
    document.getElementById('danger-level-selection').style.display = 'none';
    selectedObstacleType = null;

    alert(`${getObstacleLabel(type)} signalé avec niveau: ${dangerDescriptions[severity]}`);
}
```

---

## Step 4: Update Header Color Logic (Use Obstacle Type, NOT Danger Level)

### **File**: `public/app.js`

**Find** `updateDangerLevel` function (around line 1010):

```javascript
function updateDangerLevel(level, obstacleType = null) {
```

**Keep obstacle type colors** (DO NOT change based on danger level):

```javascript
function updateDangerLevel(level, closestObstacle = null, distance = null) {
    // Obstacle TYPE colors (never change these based on danger level)
    const obstacleColors = {
        flood: '#3b82f6',      // Blue
        protest: '#f97316',    // Orange
        closure: '#dc2626',    // Red
        traffic: '#fbbf24',    // Yellow
        police: '#8b5cf6'      // Purple
    };

    const levelColors = {
        safe: '#43938A',
        low: '#fbbf24',
        medium: '#f97316',
        high: '#dc2626'
    };

    // IMPORTANT: Use obstacle TYPE for color, not danger level
    let headerColor = levelColors.safe;
    let statusText = '🟢 Zone sûre';
    let description = 'Aucun danger signalé';

    if (closestObstacle) {
        // Use obstacle TYPE color
        headerColor = obstacleColors[closestObstacle.type] || levelColors.medium;

        // But use danger level for TEXT
        const dangerLevel = closestObstacle.severity || closestObstacle.dangerLevel || 'medium';

        const dangerLabels = {
            low: { icon: '⚠️', label: 'Prudence', desc: 'Circulation autorisée' },
            medium: { icon: '🟠', label: 'Vérifier avant', desc: 'Vérifier les conditions' },
            high: { icon: '🔴', label: 'Danger', desc: 'Circulation interdite' }
        };

        const info = dangerLabels[dangerLevel] || dangerLabels.medium;

        const obstacleLabel = getObstacleLabel(closestObstacle.type);
        const distanceText = distance < 1
            ? `${Math.round(distance * 1000)}m`
            : `${distance.toFixed(1)}km`;

        statusText = `${info.icon} ${info.label}`;
        description = `${obstacleLabel} à ${distanceText} - ${info.desc}`;
    }

    // Update header with obstacle TYPE color
    const header = document.getElementById('header');
    header.style.background = `linear-gradient(to right, ${headerColor}, ${adjustBrightness(headerColor, -20)})`;

    // Update status text with danger level info
    document.getElementById('danger-status').textContent = statusText;

    // Update banners
    const dangerBanner = document.getElementById('danger-banner');
    const guestBanner = document.getElementById('guest-banner');

    if (level !== 'safe' && closestObstacle) {
        dangerBanner.style.display = 'block';
        dangerBanner.style.background = headerColor;
        guestBanner.style.display = 'none';
        document.getElementById('danger-title').textContent = statusText;
        document.getElementById('danger-subtitle').textContent = description;
    } else {
        dangerBanner.style.display = 'none';
        header.style.background = '';
        if (!app.user) {
            guestBanner.style.display = 'block';
        }
    }

    // Update user marker with obstacle TYPE color
    if (app.userMarker && app.userMarkerDiv) {
        app.userMarkerDiv.style.background = headerColor;
    }
}
```

---

## Step 5: Update Proximity Notifications with Danger Description

### **File**: `public/app.js`

**Find** `sendProximityNotification` function (around line 927):

```javascript
const severityLabels = {
    critical: '🔴 Danger',
    high: '🟠 Vigilance accrue'
};

const title = severityLabels[severity] || '⚠️ ALERTE';
const obstacleLabel = getObstacleLabel(obstacle.type);
const body = `${obstacleLabel} à ${distanceText} de votre position`;
```

**Replace with**:

```javascript
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
```

---

## Step 6: Admin Alert Parsing (Parse Emoji from Title)

### **File**: `public/firebase-config.js`

**Find** admin notification handler (around line 524):

```javascript
if (notificationType === 'admin') {
    console.log('📢 Admin notification received');

    const isInArea = checkIfUserInNotificationArea(payload.data);
    // ... existing code ...
}
```

**Add BEFORE showing notification**:

```javascript
if (notificationType === 'admin') {
    console.log('📢 Admin notification received');

    // PARSE ADMIN ALERT
    const title = payload.notification?.title || '';
    const body = payload.notification?.body || '';

    // Parse danger level from emoji in title
    let dangerLevel = 'medium';
    let obstacleType = null;

    if (title.includes('🔴')) {
        dangerLevel = 'high';
    } else if (title.includes('🟠')) {
        dangerLevel = 'medium';
    } else if (title.includes('⚠️')) {
        dangerLevel = 'low';
    }

    // Parse obstacle type from title
    if (title.toLowerCase().includes('inondation')) {
        obstacleType = 'flood';
    } else if (title.toLowerCase().includes('manifestation')) {
        obstacleType = 'protest';
    } else if (title.toLowerCase().includes('fermée') || title.toLowerCase().includes('route')) {
        obstacleType = 'closure';
    } else if (title.toLowerCase().includes('embouteillage') || title.toLowerCase().includes('trafic')) {
        obstacleType = 'traffic';
    } else if (title.toLowerCase().includes('police') || title.toLowerCase().includes('contrôle')) {
        obstacleType = 'police';
    }

    // Parse location from custom data
    const lat = parseFloat(payload.data?.lat);
    const lng = parseFloat(payload.data?.lng);

    // Create marker if location provided
    if (obstacleType && !isNaN(lat) && !isNaN(lng)) {
        console.log('📍 Creating admin alert marker:', obstacleType, dangerLevel);

        const adminObstacle = {
            id: `admin_${Date.now()}`,
            type: obstacleType,
            lat: lat,
            lng: lng,
            description: body,
            severity: dangerLevel,
            dangerLevel: dangerLevel,
            reports: 1,
            isAdminAlert: true,
            timestamp: Date.now(),
            active: true,
            confirmations: 1,
            confirmedBy: {}
        };

        // Add to obstacles and render
        if (window.app?.obstacles) {
            window.app.obstacles.push(adminObstacle);
            if (typeof window.renderObstacles === 'function') {
                window.renderObstacles();
            }
        }
    }

    const isInArea = checkIfUserInNotificationArea(payload.data);

    // ... rest of existing notification code ...
}
```

---

## Step 7: Testing Scenarios

### **User Report Flow:**
1. Click "Inondation"
2. Select "⚠️ Prudence"
3. Verify:
   - Header turns **BLUE** (obstacle type color)
   - Status shows "⚠️ Prudence"
   - Description: "Inondation à Xm - Circulation autorisée"

### **Admin Alert:**
Send from Firebase Console:
```
Title: 🔴 Manifestation
Body: Manifestation signalée au carrefour St Jean de Cocody
Custom data:
  type: admin
  topic: all
  lat: 5.3453
  lng: -4.0244
```

Verify:
- Marker appears on map
- Header turns **ORANGE** (protest type color)
- Status shows "🔴 Danger"
- Description: "Manifestation - Circulation interdite"

---

## Step 8: Deploy

```bash
git add .
git commit -m "Add user danger level selection and admin alert parsing"
firebase deploy --only hosting,functions
```

---

## Summary of Logic

| Aspect | Logic |
|--------|-------|
| **Danger Level Source** | User chooses OR Admin emoji (🔴🟠⚠️) |
| **Header Color** | Always use **obstacle TYPE color** |
| **Header Text** | Use **danger level** (Prudence/Vérifier/Danger) |
| **Description** | Include danger level description |
| **Storage** | Store both `severity` and `dangerLevel` fields |
| **Notifications** | Include full description with danger level |

This implementation follows your exact requirements with proper conditional logic! 🎯
