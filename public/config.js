// TraficDay - Secure Configuration
// This file loads sensitive config from Firebase Remote Config

import { getRemoteConfig, fetchAndActivate, getString } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-remote-config.js';
import { app } from './firebase-config.js';

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
