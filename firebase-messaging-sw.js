
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

importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);

  workbox.core.setCacheNameDetails({
    prefix: 'traffic-day',
    suffix: 'v1',
    precache: 'precache',
    runtime: 'run-time',
  });

  workbox.precaching.precacheAndRoute([
  {
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "assets/css/animate.css",
    "revision": "346964e149ad49ccf4f3da77b66fa086"
  },
  {
    "url": "assets/css/bootstrap.min.css",
    "revision": "450fc463b8b1a349df717056fbb3e078"
  },
  {
    "url": "assets/css/flaticon.css",
    "revision": "9a778ff7858c0a4b76c6d96064470003"
  },
  {
    "url": "assets/css/fontawesome.5.7.2.css",
    "revision": "815b503a2d2bcae91dbc20ae90075b05"
  },
  {
    "url": "assets/css/magnific-popup.css",
    "revision": "30b593b71d7672658f89bfea0ab360c9"
  },
  {
    "url": "assets/css/main.css",
    "revision": "de3bb05f640c67bb3c3c10d33cfc50a4"
  },
  {
    "url": "assets/css/owl.carousel.min.css",
    "revision": "0b58c934d1889ab05da02f46c6788c38"
  },
  {
    "url": "assets/css/responsive.css",
    "revision": "a8de43b94834f8c572d86723fffe250c"
  },
  {
    "url": "assets/css/sections/_call_to_action.css",
    "revision": "210c8fa7a8a62ccfed17e48c44d6d562"
  },
  {
    "url": "assets/css/sections/_connect_area.css",
    "revision": "94449a38a19fcb85b5facaeb9d1795c3"
  },
  {
    "url": "assets/css/sections/_contact.css",
    "revision": "5ff2b7a33ec2a945198cb1b4b19acb1d"
  },
  {
    "url": "assets/css/sections/_counterup.css",
    "revision": "1afad232ad91dfee9cefb69f5271655e"
  },
  {
    "url": "assets/css/sections/_discover_items.css",
    "revision": "cc6138c5d30aaea663a61bf94271df93"
  },
  {
    "url": "assets/css/sections/_featured_area.css",
    "revision": "1214d149eafc95c82ed9cf79f25a3975"
  },
  {
    "url": "assets/css/sections/_footer.css",
    "revision": "3dfaccaca45ad333e1721800d755e628"
  },
  {
    "url": "assets/css/sections/_full_width_feature_area.css",
    "revision": "faec86804a42e63debbe6fce5f94114d"
  },
  {
    "url": "assets/css/sections/_how_it_works.css",
    "revision": "f5216015faef493f9f3bcc4275fcce33"
  },
  {
    "url": "assets/css/sections/_icon_box.css",
    "revision": "4bca21495900730df0fbfec112fbc105"
  },
  {
    "url": "assets/css/sections/_pricing_plan.css",
    "revision": "2d81178b0733cb283528e4022809bcd2"
  },
  {
    "url": "assets/css/sections/_screenshort.css",
    "revision": "dfa7744edc63d4d73dfd549f40701bf2"
  },
  {
    "url": "assets/css/sections/_team_member.css",
    "revision": "42f6d3e16d93f4dc5b5e1ae640147191"
  },
  {
    "url": "assets/css/sections/_testimonial.css",
    "revision": "bc6ef8ff48b43e8a53fd893481d61094"
  },
  {
    "url": "assets/css/sections/_video_area.css",
    "revision": "df0ca763b50af95813dbd66cb3b01a2c"
  },
  {
    "url": "assets/css/sections/_why_choose_us.css",
    "revision": "74e816ae0eb591dd6ef1da4aa1eb08f0"
  },
  {
    "url": "assets/css/style.css",
    "revision": "be46afc25a97b2d309416a1f58b0a871"
  },
  {
    "url": "assets/fonts/fa-brands-400.svg",
    "revision": "80533988ff5fecd5be26557d08ce8237"
  },
  {
    "url": "assets/fonts/fa-regular-400.svg",
    "revision": "e7e957c87c454bccaa3bf9fdaa6874f8"
  },
  {
    "url": "assets/fonts/fa-solid-900.svg",
    "revision": "82905d8d1c06969df11c8c378e9bdd4c"
  },
  {
    "url": "assets/fonts/Flaticon.svg",
    "revision": "814939551cda0b85e8b0ce7ee2d874bb"
  },
  {
    "url": "assets/img/trafficday.ico",
    "revision": "acea64291433db4fb237b99f2bf5a724"
  },
  {
    "url": "assets/js/bootstrap.min.js",
    "revision": "14d449eb8876fa55e1ef3c2cc52b0c17"
  },
  {
    "url": "assets/js/contact.js",
    "revision": "dbb08f27f922887ba563d709885611ef"
  },
  {
    "url": "assets/js/goolg-map-activate.js",
    "revision": "802cabb5201461983fd8df2e1398cfb1"
  },
  {
    "url": "assets/js/jquery.counterup.min.js",
    "revision": "ef36cca760bf1cd76cfcd0e4dc10cef1"
  },
  {
    "url": "assets/js/jquery.js",
    "revision": "89c32b91cd2cbe8d45b2c6609c11ec58"
  },
  {
    "url": "assets/js/jquery.magnific-popup.js",
    "revision": "5b23ded83b6a631b06040ed574e43dd6"
  },
  {
    "url": "assets/js/main.js",
    "revision": "840fcef1c0add0e0177b5037039436d6"
  },
  {
    "url": "assets/js/owl.carousel.min.js",
    "revision": "c2dc175349b1ee00f8ea896ecac91518"
  },
  {
    "url": "assets/js/popper.min.js",
    "revision": "70d3fda195602fe8b75e0097eed74dde"
  },
  {
    "url": "assets/js/script.js",
    "revision": "e8dff7153bcbec73296c9bfc770e8234"
  },
  {
    "url": "assets/js/waypoints.min.js",
    "revision": "dfe0eedf8da578f4a4c43b05448c51d9"
  },
  {
    "url": "assets/js/wow.min.js",
    "revision": "e1f1ff6897992a9165e8ce009b4039e3"
  },
  {
    "url": "assets/scss/main/_global.scss",
    "revision": "1479d4c1b2e80a7042cfcbeb1f2a7130"
  },
  {
    "url": "assets/scss/main/_mixins.scss",
    "revision": "766260415f87a6e738c998c082523ffc"
  },
  {
    "url": "assets/scss/main/_normalize.scss",
    "revision": "1024c8239baf9b8a21167c814a06098e"
  },
  {
    "url": "assets/scss/main/_variables.scss",
    "revision": "a6030ce012e7313cfbc2dcbae42c8c32"
  },
  {
    "url": "assets/scss/pages/_blog_details.scss",
    "revision": "d92ca7d40fa47a1dabc67070e9057786"
  },
  {
    "url": "assets/scss/pages/_blog.scss",
    "revision": "428f13b8154b0a00b451524a9bfce8da"
  },
  {
    "url": "assets/scss/sections/_call_to_action.scss",
    "revision": "87734930c85c08927818fc73e5e8bd9a"
  },
  {
    "url": "assets/scss/sections/_connect_area.scss",
    "revision": "58a7023a583bc4828283971869b947f0"
  },
  {
    "url": "assets/scss/sections/_contact.scss",
    "revision": "fcda08e6353c026b50983968d46f4801"
  },
  {
    "url": "assets/scss/sections/_counterup.scss",
    "revision": "01e9d917909ca2d98f78bada81525e1c"
  },
  {
    "url": "assets/scss/sections/_customer_reply.scss",
    "revision": "cb7ae0def0b29027b8ea25b05fdb0796"
  },
  {
    "url": "assets/scss/sections/_discover_items.scss",
    "revision": "869287f06866f00fe29f3a4582ab88db"
  },
  {
    "url": "assets/scss/sections/_featured_area.scss",
    "revision": "f771a6fb48bfbbce865debf5e6a66738"
  },
  {
    "url": "assets/scss/sections/_footer.scss",
    "revision": "673abfcb093e45a978fc979c2dc0349f"
  },
  {
    "url": "assets/scss/sections/_full_width_feature_area.scss",
    "revision": "13ffc6ea6dc82552e6e03805a52a33a7"
  },
  {
    "url": "assets/scss/sections/_header.scss",
    "revision": "623c566360a9342593c796970ba33a3c"
  },
  {
    "url": "assets/scss/sections/_how_it_works.scss",
    "revision": "49a92659d5810b6ee685c8e5a643befe"
  },
  {
    "url": "assets/scss/sections/_icon_box.scss",
    "revision": "456f2d0d8044627e01b2ab4fee3e57fb"
  },
  {
    "url": "assets/scss/sections/_navbar.scss",
    "revision": "5e5104bfb385f4118b514a0d1cdfb6f1"
  },
  {
    "url": "assets/scss/sections/_pricing_plan.scss",
    "revision": "3c4cff75b1b3d125115dab8a31cb8410"
  },
  {
    "url": "assets/scss/sections/_screenshort.scss",
    "revision": "bafd31af7d0bb4ee947a278b866e9e97"
  },
  {
    "url": "assets/scss/sections/_sidebar.scss",
    "revision": "a16519853af7582d085352b8b3da0b3a"
  },
  {
    "url": "assets/scss/sections/_team_member.scss",
    "revision": "6aab28479523d5fd9082caf863ca790f"
  },
  {
    "url": "assets/scss/sections/_testimonial.scss",
    "revision": "5ce8ba92270d31939e9435e78040f2b0"
  },
  {
    "url": "assets/scss/sections/_video_area.scss",
    "revision": "a942da074163ed0ef5c7689d6b99ecee"
  },
  {
    "url": "assets/scss/sections/_why_choose_us.scss",
    "revision": "362dcf7aa7694cc098473851ff034e64"
  },
  {
    "url": "assets/scss/style.scss",
    "revision": "f8ff890e79a753355893c1d882684f74"
  },
  {
    "url": "favicon.ico",
    "revision": "e8c1d9785b948bbc49c6d3939ac8ea35"
  },
  {
    "url": "icons/icons.json",
    "revision": "41197e9b67e43a9cef47dd4ddc0dd4b7"
  },
  {
    "url": "index.html",
    "revision": "773841a4e555dab04cdcb708ca8e0e62"
  },
  {
    "url": "js/app.js",
    "revision": "4a453dfddb0ba5a7746dca8025f4f974"
  },
  {
    "url": "js/script.js",
    "revision": "3a4d9cbdb0be045ce7f072c152fc4093"
  },
  {
    "url": "js/security.js",
    "revision": "c7ac5e8126595aa078066028b8735327"
  },
  {
    "url": "main.css",
    "revision": "c567e72023871da77fdf2fad9e8c97f6"
  },
  {
    "url": "manifest.json",
    "revision": "51323c1f6e8767b0f8b8e96d50b85f38"
  },
  {
    "url": "workbox-e41b4514.js",
    "revision": "0ecfb260318670bc68b5650070df9307"
  }
]);

  workbox.routing.registerRoute(
    new RegExp('/assets/css/'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'css-cache',
      plugins: [
        new workbox.expiration.Plugin({
          // Only cache requests for a week
          maxAgeSeconds: 15 * 24 * 60 * 60,
          // Only cache requests.
          maxEntries: 10,
        }),
      ]
    })
  );

  workbox.routing.registerRoute(
    new RegExp('/assets/js/'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'js-cache',
      plugins: [
        new workbox.expiration.Plugin({
          // Only cache requests for a week
          maxAgeSeconds: 30 * 24 * 60 * 60,
          // Only cache requests.
          maxEntries: 14,
        }),
      ]
    })
  );

  workbox.routing.registerRoute(
    new RegExp('/assets/images/'),
    new workbox.strategies.CacheFirst({
      cacheName: 'image-cache',
      plugins: [
        new workbox.expiration.Plugin({
          // Only cache requests for a week
          maxAgeSeconds: 30 * 24 * 60 * 60,
          // Only cache 10 requests.
          maxEntries: 40,
        }),
      ]
    })
  );

} else {
console.log(`Boo! Workbox didn't load 😬`);
}

// Import and configure the Firebase SDK
// These scripts are made available when the app is served or deployed on Firebase Hosting
// If you do not serve/host your project using Firebase Hosting see https://firebase.google.com/docs/web/setup
importScripts('/__/firebase/7.14.3/firebase-app.js');
importScripts('/__/firebase/7.14.3/firebase-messaging.js');
importScripts('/__/firebase/init.js');

const messaging = firebase.messaging();

/**
 * Here is is the code snippet to initialize Firebase Messaging in the Service
 * Worker when your app is not hosted on Firebase Hosting.

 // [START initialize_firebase_in_sw]
 // Give the service worker access to Firebase Messaging.
 // Note that you can only use Firebase Messaging here, other Firebase libraries
 // are not available in the service worker.
 importScripts('https://www.gstatic.com/firebasejs/7.14.3/firebase-app.js');
 importScripts('https://www.gstatic.com/firebasejs/7.14.3/firebase-messaging.js');

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