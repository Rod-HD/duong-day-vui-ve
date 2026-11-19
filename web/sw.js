// Offline support: network-first (always fresh when online), cache fallback when offline.
// Bump CACHE when the list of shell files changes.
const CACHE = "ddvv-v1";
const SHELL = ["./", "index.html", "style.css", "app.js", "content.json", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "qr.svg", "poster.html"];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    // Audio list comes from content.json so adding a message never needs a SW edit.
    try {
      const c = await (await fetch("content.json")).json();
      const audio = ["audio/greeting.mp3",
        ...Object.entries(c.options).flatMap(([k, o]) => o.messages.map((_, i) => `audio/${k}/${i + 1}.mp3`))];
      await cache.addAll(audio);
    } catch { /* audio offline is a bonus; the shell still installs */ }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(e.request);
      // Only full 200s are cached; 206 range replies from <audio> would poison the cache.
      if (res.status === 200) (await caches.open(CACHE)).put(e.request, res.clone());
      return res;
    } catch {
      return (await caches.match(e.request, { ignoreSearch: true })) || Response.error();
    }
  })());
});
