// Mapbox Configuration
// Real-time traffic overlay for TraficDay

export const MAPBOX_CONFIG = {
    // Access token - Public key (safe to expose in client-side code)
    accessToken: 'pk.eyJ1IjoidGhlZGF5IiwiYSI6ImNtZ2dvZzA5OTA5Mzgya29kaWZ0Znpzc3EifQ.lmNwkn75VtCJJVUth_V75A',

    // Map style
    style: 'mapbox://styles/mapbox/streets-v12',

    // Traffic layer source
    trafficSource: 'mapbox://mapbox.mapbox-traffic-v1',

    // Traffic tile URL (for Leaflet overlay)
    // Using @2x for high-resolution retina displays
    trafficTileUrl: 'https://api.mapbox.com/v4/mapbox.mapbox-traffic-v1/{z}/{x}/{y}@2x.png?access_token={accessToken}',

    // Configuration options
    options: {
        maxZoom: 19,
        opacity: 0.9, // Higher opacity for better visibility of traffic colors (red/yellow/green)
        attribution: '© Mapbox'
    }
};

console.log('🗺️ Mapbox config loaded');
