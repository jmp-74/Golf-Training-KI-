// Golf Pro AI – Service Worker
// Cache-Name mit Version für einfaches Update
var CACHE = 'golfpro-v1';
var FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './logo_chipping.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap'
];

// Install – alle Assets cachen
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(FILES);
    })
  );
  self.skipWaiting();
});

// Activate – alte Caches löschen
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch – Cache First, dann Network
self.addEventListener('fetch', function(e) {
  // API-Calls immer live (nie cachen)
  if (e.request.url.includes('api.anthropic.com') ||
      e.request.url.includes('open-meteo.com')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        // Erfolgreich geladene Ressourcen in Cache legen
        if (response && response.status === 200 && response.type !== 'opaque') {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache){
            cache.put(e.request, clone);
          });
        }
        return response;
      });
    }).catch(function() {
      // Offline-Fallback
      return caches.match('./index.html');
    })
  );
});