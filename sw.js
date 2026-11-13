/* nozilla Teleprompter — Service Worker
 *
 * Netz zuerst, Cache als Rückfall: Online gibt es immer den aktuellen Stand,
 * offline läuft die App aus dem Cache weiter. Das Original lieferte umgekehrt
 * immer aus dem Cache — Updates kamen bei Nutzerinnen und Nutzern nie an.
 */
var CACHE = 'nozilla-teleprompter-v2';
var CORE = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/style.v122.css',
  './assets/js/plugins.v122.js',
  './assets/js/script.v122.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

// Alte Caches (auch den des Originals) entfernen
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      // Erfolgreiche Antworten (auch Design System und Schriften vom CDN) für offline merken
      if (res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});
