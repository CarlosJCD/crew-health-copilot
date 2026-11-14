// Minimal offline-first service worker (no build plugin needed).
// - Pages (navigations): network first, fall back to the cached shell when offline.
//   This avoids serving a stale index.html that points at assets from an older build.
// - Hashed build assets (/assets/*): cache first; their names change on every build.
// - Other same-origin GETs: cache first, refreshed in the background.
// The page posts the URLs it already loaded (see main.tsx) so the first visit is cached too.
const CACHE = 'crew-health-v3'
const SHELL = ['./', './index.html', './manifest.webmanifest', './favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CACHE_URLS') return
  const urls = event.data.urls.filter((u) => new URL(u).origin === self.location.origin)
  event.waitUntil(caches.open(CACHE).then((c) => Promise.all(urls.map((u) => c.add(u).catch(() => undefined)))))
})

async function networkFirst(req) {
  const cache = await caches.open(CACHE)
  try {
    // 'no-cache' revalidates with the server so a new deploy is not hidden by the HTTP cache.
    const res = await fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
    if (res.ok) cache.put('./index.html', res.clone())
    return res
  } catch {
    return (await cache.match('./index.html')) ?? (await cache.match('./')) ?? Response.error()
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(req)
  const network = fetch(req)
    .then((res) => {
      // Never store an HTML fallback page under a script/style URL (dev servers answer 404s with index.html).
      const isHtml = (res.headers.get('content-type') ?? '').includes('text/html')
      if (res.ok && !isHtml) cache.put(req, res.clone())
      return res
    })
    .catch(() => undefined)
  return cached ?? (await network) ?? Response.error()
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  event.respondWith(req.mode === 'navigate' ? networkFirst(req) : cacheFirst(req))
})
