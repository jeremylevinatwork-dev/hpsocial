/* HPSocial offline shell — the app page is cached on the device so it opens
   instantly even with no signal. Data (Supabase) is never cached here; the app
   keeps its own on-device copy and syncs when a connection returns.
   Strategy: stale-while-revalidate. */
var CACHE = 'hps-shell-v1';
var SHELL = ['./', './index.html', './app.html', './bell-mark.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  if (url.indexOf('supabase.co') >= 0) return;
  if (url.indexOf(self.location.origin) !== 0) return;
  e.respondWith(
    caches.open(CACHE).then(function (c) {
      return c.match(e.request, { ignoreSearch: true }).then(function (hit) {
        var net = fetch(e.request).then(function (res) {
          if (res && res.ok) c.put(e.request, res.clone());
          return res;
        }).catch(function () { return hit; });
        return hit || net;
      });
    })
  );
});
