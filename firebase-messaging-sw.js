
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

  workbox.precaching.precacheAndRoute([{"revision":"0a27a4163254fc8fce870c8cc3a3f94f","url":"404.html"},{"revision":"0c3a8400faef4618c39dda0ad2748bc0","url":"assets/css/animate.css"},{"revision":"e59aa29ac4a3d18d092f6ba813ae1997","url":"assets/css/bootstrap.css"},{"revision":"d432e4222814b62dd30c9513dcc29440","url":"assets/css/bootstrap.min.css"},{"revision":"1bda53e3fcba2b066780112c5261a8c9","url":"assets/css/flaticon.css"},{"revision":"ae8b01be2525f50a950cfffde8ddd56a","url":"assets/css/font-awesome-all.css"},{"revision":"815b503a2d2bcae91dbc20ae90075b05","url":"assets/css/fontawesome.5.7.2.css"},{"revision":"1e15f3c94808b6bc50dad3dd97bf82b8","url":"assets/css/imagebg.css"},{"revision":"2568ba482043c2e442d3956f4e83b844","url":"assets/css/jquery-ui.css"},{"revision":"35d290afd71a6053d8195ea13170b4e9","url":"assets/css/jquery.fancybox.min.css"},{"revision":"30b593b71d7672658f89bfea0ab360c9","url":"assets/css/magnific-popup.css"},{"revision":"0b58c934d1889ab05da02f46c6788c38","url":"assets/css/owl.carousel.min.css"},{"revision":"2533294f7dc4b3e5058137ee7cb5e4cd","url":"assets/css/owl.css"},{"revision":"6e5284bb53b8e11159d1d390a957a0b4","url":"assets/css/responsive.css"},{"revision":"b85c221eaf0fa549ff085533a1159c19","url":"assets/css/sections/_call_to_action.css"},{"revision":"b8d9764e9a58846916823fb2f18ff892","url":"assets/css/sections/_connect_area.css"},{"revision":"3d41f781d6ed3991ba78e8802babca48","url":"assets/css/sections/_contact.css"},{"revision":"e29488e0053996e6105ec5f20db3960e","url":"assets/css/sections/_counterup.css"},{"revision":"b7d871f0cde1167af3775c25ea3daf89","url":"assets/css/sections/_discover_items.css"},{"revision":"7063d43f561c88ea7a53ea83b34baefe","url":"assets/css/sections/_featured_area.css"},{"revision":"f5c3a37b7e0afe3d1c237667ebe3297c","url":"assets/css/sections/_footer.css"},{"revision":"32a350b105a85657754d1cb7c1bd6ada","url":"assets/css/sections/_full_width_feature_area.css"},{"revision":"c646b5224a35cb7b8547fd27d0365516","url":"assets/css/sections/_how_it_works.css"},{"revision":"ceedd521c5a4242c1bb45c79f29ec7e9","url":"assets/css/sections/_icon_box.css"},{"revision":"3823ff806977109b0c2a5b0a27d9abbf","url":"assets/css/sections/_pricing_plan.css"},{"revision":"706e2fe5a64b2e5258d5c6f15bcca559","url":"assets/css/sections/_screenshort.css"},{"revision":"992dee3c053e570983b2323e34444f0f","url":"assets/css/sections/_team_member.css"},{"revision":"4c62e1663c912d2db0221fcddea7bd40","url":"assets/css/sections/_testimonial.css"},{"revision":"d553cb3567661c6913b3f5d1f404372e","url":"assets/css/sections/_video_area.css"},{"revision":"15dad160f3fc18c2bf58b41931046202","url":"assets/css/sections/_why_choose_us.css"},{"revision":"fde45abe14f3c5e99d2b326c25105526","url":"assets/css/style.css"},{"revision":"80533988ff5fecd5be26557d08ce8237","url":"assets/fonts/fa-brands-400.svg"},{"revision":"e7e957c87c454bccaa3bf9fdaa6874f8","url":"assets/fonts/fa-regular-400.svg"},{"revision":"82905d8d1c06969df11c8c378e9bdd4c","url":"assets/fonts/fa-solid-900.svg"},{"revision":"814939551cda0b85e8b0ce7ee2d874bb","url":"assets/fonts/Flaticon.svg"},{"revision":"acea64291433db4fb237b99f2bf5a724","url":"assets/img/trafficday.ico"},{"revision":"5a457d262e3c32d25c003ca412ee7fe6","url":"assets/js/appear.js"},{"revision":"38c2fa574cfafb7c578e35fde465495f","url":"assets/js/bootstrap.min.js"},{"revision":"b257e0969014adf4d5836b545fd6ccfc","url":"assets/js/bxslider.js"},{"revision":"6816a923a10ae7680223d740150448a5","url":"assets/js/circle-progress.js"},{"revision":"5c9ed65dd67f879666350af81eb122d2","url":"assets/js/countdown.js"},{"revision":"bb0769f3ffae6ca09a891ea88a3cc635","url":"assets/js/gmaps.js"},{"revision":"623df3d9623fabb74722506ad105b386","url":"assets/js/goolg-map-activate.js"},{"revision":"55c61eb8802947bf0d14f5430dfdebcd","url":"assets/js/isotope.js"},{"revision":"4edf6cc481af8f99be16f570a2d4ddf7","url":"assets/js/jquery-ui.js"},{"revision":"ef36cca760bf1cd76cfcd0e4dc10cef1","url":"assets/js/jquery.counterup.min.js"},{"revision":"5ac11c01ea3885061ce1d564f6a4f7ad","url":"assets/js/jquery.countTo.js"},{"revision":"6e11711058a9459a94d5a19b26a78135","url":"assets/js/jquery.fancybox.js"},{"revision":"ae6efbcc6658b1779c8398037dde2042","url":"assets/js/jquery.js"},{"revision":"5b23ded83b6a631b06040ed574e43dd6","url":"assets/js/jquery.magnific-popup.js"},{"revision":"394b3ad178eb6e985869e8182452c814","url":"assets/js/jquery.paroller.min.js"},{"revision":"7fe4834cec8614049ca9052f0e674a5f","url":"assets/js/main.js"},{"revision":"acf25c7d0f426d17ccc959daa440d4bc","url":"assets/js/map-helper.js"},{"revision":"e28a1be506d3151bad02d20a7751f09c","url":"assets/js/nav-tool.js"},{"revision":"c2dc175349b1ee00f8ea896ecac91518","url":"assets/js/owl.carousel.min.js"},{"revision":"54428880ec8df798ac3d666f5113c7ff","url":"assets/js/owl.js"},{"revision":"31c898c6d2ea13c30441657ff1900d81","url":"assets/js/popper.min.js"},{"revision":"31c8035332a3e265242255e05cefa0a1","url":"assets/js/script.js"},{"revision":"f9a1879a168f161e6abeb47aebfda291","url":"assets/js/scrollbar.js"},{"revision":"3bb2cb86f33d82a9778dbc59d3783577","url":"assets/js/tilt.jquery.js"},{"revision":"ac7157df7854226ddc289da31fffe396","url":"assets/js/validation.js"},{"revision":"dfe0eedf8da578f4a4c43b05448c51d9","url":"assets/js/waypoints.min.js"},{"revision":"11ac4d7173a68c50169addca2ef1b827","url":"assets/js/wow.js"},{"revision":"36050285bfeeb7395752f0f9bbc08273","url":"assets/js/wow.min.js"},{"revision":"b82708858d35a38c6ec51d3bf95b2704","url":"circlemap.html"},{"revision":"9e2471d9c45b79ccc7d639221021a457","url":"database.rules.json"},{"revision":"6c1369bcee45fa3baebaaf77f2dc3ae3","url":"firestore.indexes.json"},{"revision":"c862e94cbef741d18838774587e3c49d","url":"fonts/fa-brands-400.svg"},{"revision":"b5a61b229c9c92a6ac21f5b0e3c6e9f1","url":"fonts/fa-regular-400.svg"},{"revision":"1d220cf9da36861171fa90d3c164f4d3","url":"fonts/fa-solid-900.svg"},{"revision":"dbf714813e5f6fdef0d1b29422fdea91","url":"fonts/flaticon.css"},{"revision":"91a70c823e9b80237f48395aa2ceaeda","url":"fonts/flaticon.html"},{"revision":"9f80637b40b544e92874b3f5151bf4aa","url":"fonts/Flaticon.svg"},{"revision":"89889688147bd7575d6327160d64e760","url":"fonts/glyphicons-halflings-regular.svg"},{"revision":"5ad4f0d6e99dd65aba77cbef6e17c25c","url":"fonts/revicons90c6.svg"},{"revision":"8e28fb11d868c5e9fbc18ab57d25a47d","url":"images/favicon.ico"},{"revision":"8e28fb11d868c5e9fbc18ab57d25a47d","url":"images/favicon/app_images/favicon.ico"},{"revision":"fbb21171188b5afe11265ccd75a5b29d","url":"images/icons/angle-right-solid.svg"},{"revision":"ecc41bdb1187f8cef194feea8d1e464b","url":"images/icons/angle-up-solid.svg"},{"revision":"80981f505e348bbfb5d5cabc45e431ef","url":"images/icons/bell-solid.svg"},{"revision":"7fefaa66ae016cea915187ab2e3c8d51","url":"images/icons/car-alt-solid.svg"},{"revision":"8da7aebce1f2428dc68bafde818a1f20","url":"images/icons/car-crash-solid.svg"},{"revision":"82189696539164bc0b0e271a3bcac397","url":"images/icons/envelope-solid.svg"},{"revision":"a35f82b90ed9fba09203009c0527c964","url":"images/icons/exclamation-triangle-solid.svg"},{"revision":"62d8b6ef8e6c796a5ddad822dff96874","url":"images/icons/facebook-brands (1).svg"},{"revision":"62d8b6ef8e6c796a5ddad822dff96874","url":"images/icons/facebook-brands.svg"},{"revision":"e274581238709fcd099e88af0eb57087","url":"images/icons/google-play-brands.svg"},{"revision":"2b7c48a767e22546941d70afc9f27ff0","url":"images/icons/map-marker-alt-solid.svg"},{"revision":"0c5b6cc8b0ba471712cdd1c7f8771783","url":"images/icons/map-marker-solid.svg"},{"revision":"584f89de21cedb71ab251833b7a733ca","url":"images/icons/phone-solid.svg"},{"revision":"f79fe6ae99a50939f12f755851398cf9","url":"images/icons/play-solid.svg"},{"revision":"6620c8ae2cac90067a9aa78339bb808d","url":"images/icons/twitter-brands.svg"},{"revision":"a1223de504180a12574a17a1f30c5a08","url":"images/icons/twitter-square-brands.svg"},{"revision":"a617dfb6304f7cd3ec2341bda2f99505","url":"images/icons/user-solid.svg"},{"revision":"a881270183c6e504d3d92cae4e9a097f","url":"images/icons/whatsapp-brands.svg"},{"revision":"137f26e60fa7397178acce885bf43809","url":"images/icons/whatsapp-square-brands.svg"},{"revision":"b1f2a76280a27ad7ff98924882c41e78","url":"images/icons/window-close-solid.svg"},{"revision":"c80ca203c0f773a8502d85ae60f347ce","url":"images/icons/youtube-brands.svg"},{"revision":"08f98584ecc77effa5d574cdb8fe3483","url":"index.html"},{"revision":"335d2623629f5ee23e7d611e5ef75e9c","url":"script.js"},{"revision":"c7ac5e8126595aa078066028b8735327","url":"security.js"}]);

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