
/*
Copyright 2018 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.1.2/workbox-sw.js');

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);

  workbox.core.setCacheNameDetails({
    prefix: 'traffic-day',
    suffix: 'v2',
    precache: 'precache',
    runtime: 'run-time',
  });

  workbox.precaching.precacheAndRoute([{"revision":"a4e2271d19eb1f6f93a15e1b7a4e74dd","url":"404.html"},{"revision":"0c3a8400faef4618c39dda0ad2748bc0","url":"assets/css/animate.css"},{"revision":"e59aa29ac4a3d18d092f6ba813ae1997","url":"assets/css/bootstrap.css"},{"revision":"feba0d0760607b9e21393156949afcd9","url":"assets/css/bootstrap.min.css"},{"revision":"075cd10c56ab6af6d203a1d7bcbb6e04","url":"assets/css/flaticon.css"},{"revision":"7aa6d9819afe3860515d1c1c0edda8e2","url":"assets/css/font-awesome-all.css"},{"revision":"af8dcfc6a953707b10f7b73450ca6da5","url":"assets/css/fontawesome.5.7.2.css"},{"revision":"fc5ec1e290124df26d075865a9e3d6d4","url":"assets/css/imagebg.css"},{"revision":"2568ba482043c2e442d3956f4e83b844","url":"assets/css/jquery-ui.css"},{"revision":"35d290afd71a6053d8195ea13170b4e9","url":"assets/css/jquery.fancybox.min.css"},{"revision":"c03fe8704d90e35eba342d2ca2c5a530","url":"assets/css/magnific-popup.css"},{"revision":"ed54621996821c9979a7a0941c8f978b","url":"assets/css/owl.carousel.min.css"},{"revision":"2533294f7dc4b3e5058137ee7cb5e4cd","url":"assets/css/owl.css"},{"revision":"6e5284bb53b8e11159d1d390a957a0b4","url":"assets/css/responsive.css"},{"revision":"8053e66fbff99bd4da09d31532def5d7","url":"assets/css/sections/_call_to_action.css"},{"revision":"b52e34af5443d95fac5eb326fe1d5adc","url":"assets/css/sections/_connect_area.css"},{"revision":"2eef4de073b8382b5ef8a2bd28184f2c","url":"assets/css/sections/_contact.css"},{"revision":"c7bb0cbb0f0b0a354eb88689fb424e5e","url":"assets/css/sections/_counterup.css"},{"revision":"fb732a1ad907606c37c0ea24323f5f24","url":"assets/css/sections/_discover_items.css"},{"revision":"43553afc78cbfac24205887b302d1602","url":"assets/css/sections/_featured_area.css"},{"revision":"35d804c6dc9642a09c14377b798b9a8c","url":"assets/css/sections/_footer.css"},{"revision":"ea555cacb0c0e8d4da7915e4f4db7d61","url":"assets/css/sections/_full_width_feature_area.css"},{"revision":"9b7b3bd80186c948634546c2c810c696","url":"assets/css/sections/_how_it_works.css"},{"revision":"7ff564414e35c9f2d9a80b5a01386313","url":"assets/css/sections/_icon_box.css"},{"revision":"e1382cee803f2d1ff0ebd1b6c17ff810","url":"assets/css/sections/_pricing_plan.css"},{"revision":"b8a1b141143857018a426238fa54850c","url":"assets/css/sections/_screenshort.css"},{"revision":"f6ac04bae2ab47ca4c2dc25fed55f626","url":"assets/css/sections/_team_member.css"},{"revision":"3dd527674d05e0ec2dbc0f64704407a2","url":"assets/css/sections/_testimonial.css"},{"revision":"386734f639ab3e844ae79427d3baae99","url":"assets/css/sections/_video_area.css"},{"revision":"fa647235c7c8b590543450874f947d4f","url":"assets/css/sections/_why_choose_us.css"},{"revision":"adcc58634eb126185f899ce55c724e42","url":"assets/css/style.css"},{"revision":"650c3a83e51f0186811543a2cdc91dad","url":"assets/fonts/fa-brands-400.svg"},{"revision":"1f65fad32ac9d1bc04ac7860930c31e2","url":"assets/fonts/fa-regular-400.svg"},{"revision":"b9bd91a94665aa8013d6e0390a8629b8","url":"assets/fonts/fa-solid-900.svg"},{"revision":"8b02fb0ec8ae035d562d381c59e279cd","url":"assets/fonts/Flaticon.svg"},{"revision":"acea64291433db4fb237b99f2bf5a724","url":"assets/img/trafficday.ico"},{"revision":"5a457d262e3c32d25c003ca412ee7fe6","url":"assets/js/appear.js"},{"revision":"38c2fa574cfafb7c578e35fde465495f","url":"assets/js/bootstrap.min.js"},{"revision":"eea4ef92150fe92c5e75aef6507d06cf","url":"assets/js/bxslider.js"},{"revision":"d329d4d2d0b200e251a415edd80b3176","url":"assets/js/circle-progress.js"},{"revision":"dd9fa4d47a32e48b61ea4e3753117b83","url":"assets/js/countdown.js"},{"revision":"bb0769f3ffae6ca09a891ea88a3cc635","url":"assets/js/gmaps.js"},{"revision":"802cabb5201461983fd8df2e1398cfb1","url":"assets/js/goolg-map-activate.js"},{"revision":"55c61eb8802947bf0d14f5430dfdebcd","url":"assets/js/isotope.js"},{"revision":"8120ec06edc8bfcf4e22a87274760b80","url":"assets/js/jquery-ui.js"},{"revision":"4f0e0b047f2ed8512d5119b31432bdcf","url":"assets/js/jquery.counterup.min.js"},{"revision":"07e33d1e472ce111dbb13463964f3a34","url":"assets/js/jquery.countTo.js"},{"revision":"b55dbe08d21912bc18d49f38e50e6142","url":"assets/js/jquery.fancybox.js"},{"revision":"f881db30a2885dcfc62802f85e37652d","url":"assets/js/jquery.js"},{"revision":"480ecf294c28becf9b85e166ec46a720","url":"assets/js/jquery.magnific-popup.js"},{"revision":"60c6dce8a2cf45329b59fd7b6ba8138a","url":"assets/js/jquery.paroller.min.js"},{"revision":"f75fed6480cb4bdbf476926356bb3124","url":"assets/js/main.js"},{"revision":"acf25c7d0f426d17ccc959daa440d4bc","url":"assets/js/map-helper.js"},{"revision":"e28a1be506d3151bad02d20a7751f09c","url":"assets/js/nav-tool.js"},{"revision":"839d98013acf063ec1e1e316d6bc05a1","url":"assets/js/owl.carousel.min.js"},{"revision":"9bd6ebd9fd42bf1203537b58bdccfee1","url":"assets/js/owl.js"},{"revision":"31c898c6d2ea13c30441657ff1900d81","url":"assets/js/popper.min.js"},{"revision":"31c8035332a3e265242255e05cefa0a1","url":"assets/js/script.js"},{"revision":"48925b3837050bc6215f3f351225adc0","url":"assets/js/scrollbar.js"},{"revision":"6e2a98f7a4861f35e86f283946842eb9","url":"assets/js/tilt.jquery.js"},{"revision":"84b46819ed415891567acb155d22eac7","url":"assets/js/validation.js"},{"revision":"4fe14337a62d710389f42e8a5d1043f7","url":"assets/js/waypoints.min.js"},{"revision":"11ac4d7173a68c50169addca2ef1b827","url":"assets/js/wow.js"},{"revision":"e1f1ff6897992a9165e8ce009b4039e3","url":"assets/js/wow.min.js"},{"revision":"380eefb7e2c0aae65948a8d071f220af","url":"circlemap.html"},{"revision":"f64c2815ef021e8353b73f1b58377a4b","url":"database.rules.json"},{"revision":"31ef93a533525231b0b712e137964b5c","url":"firestore.indexes.json"},{"revision":"756a62d2a08373077434e585a1d6f760","url":"fonts/fa-brands-400.svg"},{"revision":"6d4774d4e483e03057f9d09544656b42","url":"fonts/fa-regular-400.svg"},{"revision":"bc5fd7c280c3c151e966adf8fe4246e3","url":"fonts/fa-solid-900.svg"},{"revision":"2084075f92f8c0c44e3dfa1ffc575482","url":"fonts/flaticon.css"},{"revision":"54398892074d8c183fc4dbb362fcfb7f","url":"fonts/flaticon.html"},{"revision":"999d8e46804e4dc11fd6edba758f1a18","url":"fonts/Flaticon.svg"},{"revision":"f721466883998665b87923b92dea655b","url":"fonts/glyphicons-halflings-regular.svg"},{"revision":"ac38240b01066dbfdb6b548b8bee04d3","url":"fonts/revicons90c6.svg"},{"revision":"8e28fb11d868c5e9fbc18ab57d25a47d","url":"images/favicon.ico"},{"revision":"8e28fb11d868c5e9fbc18ab57d25a47d","url":"images/favicon/app_images/favicon.ico"},{"revision":"fbb21171188b5afe11265ccd75a5b29d","url":"images/icons/angle-right-solid.svg"},{"revision":"ecc41bdb1187f8cef194feea8d1e464b","url":"images/icons/angle-up-solid.svg"},{"revision":"80981f505e348bbfb5d5cabc45e431ef","url":"images/icons/bell-solid.svg"},{"revision":"7fefaa66ae016cea915187ab2e3c8d51","url":"images/icons/car-alt-solid.svg"},{"revision":"8da7aebce1f2428dc68bafde818a1f20","url":"images/icons/car-crash-solid.svg"},{"revision":"82189696539164bc0b0e271a3bcac397","url":"images/icons/envelope-solid.svg"},{"revision":"a35f82b90ed9fba09203009c0527c964","url":"images/icons/exclamation-triangle-solid.svg"},{"revision":"62d8b6ef8e6c796a5ddad822dff96874","url":"images/icons/facebook-brands (1).svg"},{"revision":"62d8b6ef8e6c796a5ddad822dff96874","url":"images/icons/facebook-brands.svg"},{"revision":"e274581238709fcd099e88af0eb57087","url":"images/icons/google-play-brands.svg"},{"revision":"2b7c48a767e22546941d70afc9f27ff0","url":"images/icons/map-marker-alt-solid.svg"},{"revision":"0c5b6cc8b0ba471712cdd1c7f8771783","url":"images/icons/map-marker-solid.svg"},{"revision":"584f89de21cedb71ab251833b7a733ca","url":"images/icons/phone-solid.svg"},{"revision":"f79fe6ae99a50939f12f755851398cf9","url":"images/icons/play-solid.svg"},{"revision":"6620c8ae2cac90067a9aa78339bb808d","url":"images/icons/twitter-brands.svg"},{"revision":"a1223de504180a12574a17a1f30c5a08","url":"images/icons/twitter-square-brands.svg"},{"revision":"a617dfb6304f7cd3ec2341bda2f99505","url":"images/icons/user-solid.svg"},{"revision":"a881270183c6e504d3d92cae4e9a097f","url":"images/icons/whatsapp-brands.svg"},{"revision":"137f26e60fa7397178acce885bf43809","url":"images/icons/whatsapp-square-brands.svg"},{"revision":"b1f2a76280a27ad7ff98924882c41e78","url":"images/icons/window-close-solid.svg"},{"revision":"c80ca203c0f773a8502d85ae60f347ce","url":"images/icons/youtube-brands.svg"},{"revision":"c768bf0e89f5247fdc8e9b65ee2d8a17","url":"index.html"},{"revision":"f9359d45edc501a3a1e7b7710f340a2b","url":"inondation.html"},{"revision":"f0914db8cd97fcef34e6e7fdc9643579","url":"script.js"},{"revision":"c7ac5e8126595aa078066028b8735327","url":"security.js"}]);

  // Cache the Google Fonts stylesheets with a stale while revalidate strategy.
  workbox.routing.registerRoute(
    /^https:\/\/fonts\.googleapis\.com/,
    new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        purgeOnQuotaError: true,
      }),
    ],
   }),
  );

 // Cache the Google Fonts webfont files with a cache first strategy for 1 year.
  workbox.routing.registerRoute(
    new RegExp('/fonts/'),
    new workbox.strategies.CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        purgeOnQuotaError: true,
      }),
    ],
    }),
  ); 

  workbox.routing.registerRoute(
    new RegExp('/assets/css/'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'css-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          // Only cache requests for a week
          maxAgeSeconds: 15 * 24 * 60 * 60,
          // Only cache requests.
          maxEntries: 22,
          purgeOnQuotaError: true,
        }),
      ]
    })
  );

  workbox.routing.registerRoute(
    new RegExp('/assets/js/'),
    new workbox.strategies.CacheFirst({
      cacheName: 'js-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          // Only cache requests for a week
          maxAgeSeconds: 30 * 24 * 60 * 60,
          // Only cache requests.
          maxEntries: 22,
          purgeOnQuotaError: true,
        }),
      ]
    })
  );

  workbox.routing.registerRoute(
    new RegExp('/images/'),
    new workbox.strategies.CacheFirst({
      cacheName: 'image-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          // Only cache requests for a week
          maxAgeSeconds: 30 * 24 * 60 * 60,
          // Only cache 10 requests.
          maxEntries: 20,
          purgeOnQuotaError: true,
        }),
      ]
    })
  );

} else {
console.log(`Boo! Workbox didn't load 😬`);
}

const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('BackSync', {
  maxRetentionTime: 24 * 60 // Retry for max of 24 Hours (specified in minutes)
});

workbox.routing.registerRoute(
  /\/api\/.*\/*.json/,
  new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin]
  }),
  'POST'
);
// This is the "Offline page" service worker
const CACHE = "pwabuilder-page";

// TODO: replace the following with the correct offline fallback page i.e.: const offlineFallbackPage = "offline.html";
const offlineFallbackPage = "index.html";

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.add(offlineFallbackPage))
  );
});

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;

        if (preloadResp) {
          return preloadResp;
        }

        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {

        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match(offlineFallbackPage);
        return cachedResp;
      }
    })());
  }
});

// Import and configure the Firebase SDK
// These scripts are made available when the app is served or deployed on Firebase Hosting
// If you do not serve/host your project using Firebase Hosting see https://firebase.google.com/docs/web/setup
importScripts('/__/firebase/7.24.0/firebase-app.js');
importScripts('/__/firebase/7.24.0/firebase-messaging.js');
importScripts('/__/firebase/init.js');

const messaging = firebase.messaging();

/**
 * Here is is the code snippet to initialize Firebase Messaging in the Service
 * Worker when your app is not hosted on Firebase Hosting.

 // [START initialize_firebase_in_sw]
 // Give the service worker access to Firebase Messaging.
 // Note that you can only use Firebase Messaging here, other Firebase libraries
 // are not available in the service worker.
 importScripts('https://www.gstatic.com/firebasejs/7.24.0/firebase-app.js');
 importScripts('https://www.gstatic.com/firebasejs/7.24.0/firebase-messaging.js');

 // Initialize the Firebase app in the service worker by passing in
 // your app's Firebase config object.
 // https://firebase.google.com/docs/web/setup#config-object
 firebase.initializeApp({
   apiKey: 'api-key',
   authDomain: 'project-id.firebaseapp.com',
   databaseURL: 'https://project-id.firebaseio.com',
   projectId: 'project-id',
   storageBucket: 'project-id.appspot.com',
   messagingSenderId: 'sender-id',
   appId: 'app-id',
   measurementId: 'G-measurement-id',
 });

 // Retrieve an instance of Firebase Messaging so that it can handle background
 // messages.
 const messaging = firebase.messaging();
 // [END initialize_firebase_in_sw]
 **/


// If you would like to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you should
// implement this optional method.
// [START background_handler]
messaging.setBackgroundMessageHandler(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = 'Background Message Title';
    const notificationOptions = {
        body: 'Background Message body.',
        icon: '/firebase-logo.png'
    };

    return self.registration.showNotification(notificationTitle,
        notificationOptions);
});
// [END background_handler]