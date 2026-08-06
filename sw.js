const CACHE = 'maktaba-v3';

const PRECACHE = [
  '/',
  '/index.html',
  '/catalogue.html',
  '/login.html',
  '/compte.html',
  '/ressources.html',
  '/admin-ressources.html',
  '/supabase-client.js',
  '/manifest.json',
  '/Images/logo.png',
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  // Ne jamais mettre en cache les appels Supabase, Stripe, Google Fonts, CDN
  if (url.includes('supabase.co') || url.includes('stripe.com') ||
      url.includes('fonts.googleapis') || url.includes('fonts.gstatic') ||
      url.includes('cdn.tailwindcss') || url.includes('cdn.jsdelivr') ||
      url.includes('cdnjs.cloudflare')) return;

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(e.request);
      const networkPromise = fetch(e.request).then(response => {
        if (response.ok) cache.put(e.request, response.clone());
        return response;
      }).catch(() => null);

      // Pages HTML : réseau d'abord, cache en fallback
      if (e.request.destination === 'document') {
        return (await networkPromise) || cached;
      }
      // Autres assets : cache d'abord, réseau en fallback
      return cached || networkPromise;
    })
  );
});
