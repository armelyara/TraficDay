// TraficDay - Secure Configuration
// This file loads sensitive config from Firebase Remote Config

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getRemoteConfig, fetchAndActivate, getString } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-remote-config.js';

// Firebase config (same as firebase-config.js)
const firebaseConfig = {
    apiKey: "AIzaSyB7DwtpC_RggBLkW0w2yHOOGxrXHpyWPfE",
    authDomain: "traficday-91045.firebaseapp.com",
    databaseURL: "https://traficday-91045-default-rtdb.firebaseio.com",
    projectId: "traficday-91045",
    storageBucket: "traficday-91045.firebasestorage.app",
    messagingSenderId: "230009461919",
    appId: "1:230009461919:web:bc09e90d723f66a84556aa"
};

// Get or initialize Firebase app
let app;
try {
    app = initializeApp(firebaseConfig, 'config-app'); // Use a different name to avoid conflict
} catch (error) {
    // If already initialized, get existing app
    const { getApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
    app = getApp();
}

// Initialize Remote Config
const remoteConfig = getRemoteConfig(app);
remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour cache

// Default fallback (empty string forces manual setup in Firebase Console)
remoteConfig.defaultConfig = {
    'google_maps_api_key': ''
};

/**
 * Get Google Maps API Key from Firebase Remote Config
 * @returns {Promise<string>} The API key
 */
export async function getGoogleMapsApiKey() {
    try {
        await fetchAndActivate(remoteConfig);
        const apiKey = getString(remoteConfig, 'google_maps_api_key');

        if (!apiKey) {
            console.error('❌ Google Maps API key not configured in Firebase Remote Config');
            throw new Error('Google Maps API key missing');
        }

        return apiKey;
    } catch (error) {
        console.error('❌ Error fetching Google Maps API key:', error);
        throw error;
    }
}

console.log('✅ Config module loaded');
