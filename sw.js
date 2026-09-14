const CACHE_NAME = 'aura-cafe-v2';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  '/', '/index.html', '/offline.html', '/manifest.json',
  '/images/banner.png', '/images/book_table.png',
  '/images/nav_menu.png', '/images/nav_gallery.png', '/images/nav_info.png', '/images/nav_orders.png',
  '/images/pepperoni_pizza.png', '/images/classic_cheeseburger.png',
  '/images/chocolate_banana_pancakes.png', '/images/classic_avocado_toast.png',
  '/images/avocado_feta_toast.png', '/images/mixed_berry_pancakes.png',
  '/images/lemon_lime_mint_cooler.png', '/images/coca_cola.png',
  '/images/fresh_orange_juice.png', '/images/lemon_lime_berries.png',
  '/images/coffee.png', '/images/blue_lemon_virgin_mojito.png',
  '/images/chocolate_milkshake.png', '/images/watermelon_soda.png',
  '/images/garden_fresh_vegetable_salad.png', '/images/creamy_vegetable_penne_pasta.png',
  '/images/garlic_bread.png', '/images/chocolate_chip_cookie.png',
  '/images/butter_croissant.png', '/images/chocolate_fudge_cake.png',
  '/images/chocolate_sundae.png', '/images/veggie_supreme_pizza.png',
  '/images/loaded_veggie_pizza.png', '/images/noodles.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => console.log('Cache skip:', url))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (!req.url.startsWith('http')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return response;
        })
        .catch(() =>
          caches.match(req).then((cached) =>
            cached || caches.match('/index.html') || caches.match(OFFLINE_URL)
          )
        )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return response;
      }).catch(() => {
        if (req.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fdf6ec"/><stop offset="100%" stop-color="#f5e6d3"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/><text x="100" y="115" font-size="70" text-anchor="middle"></text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      });
    })
  );
});