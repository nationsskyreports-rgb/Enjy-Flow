const CACHE = 'align-v1';
const FILES = ['/Enjy-Flow/index.html', '/Enjy-Flow/manifest.json', '/Enjy-Flow/icon-192.png', '/Enjy-Flow/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
