/* HPSocial offline shell — the app page is cached on the device so it opens
   instantly even with no signal. Data (Supabase) is never cached here; the app
   keeps its own on-device copy and syncs when a connection returns.
   Strategy: stale-while-revalidate.
   v2 (2026-10-24): new cache name + activate purges every older cache and the
   precache is fetched with cache:'reload', so a stuck old shell heals itself
   instead of serving a frozen copy forever. */
var CACHE = 'hps-shell-v2';
var SHELL = ['./', './index.html', './app.html', './bell-mark.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(SHELL.map(function (u) {
      return fetch(new Request(u, { cache: 'reload' })).then(function (r) { if (r && r.ok) return c.put(u, r); }).catch(function () {});
    }));
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
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
