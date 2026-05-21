/**
 * Mission Hub service worker — conservative static cache only.
 * Scope: /community/ (script must be served from /community/sw.js)
 *
 * Does NOT cache: HTML/RSC, /api/*, POST bodies, member/profile responses.
 */

const CACHE_NAME = "mission-hub-static-v2";

/** Keep in sync with MISSION_HUB_PWA.precachePaths */
const PRECACHE_URLS = [
  "/mission-hub/manifest.webmanifest",
  "/mission-hub/apple-touch-icon.png",
  "/mission-hub/icon-192.png",
  "/mission-hub/icon-512.png",
];

function isPrecachePath(pathname) {
  return PRECACHE_URLS.includes(pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" }))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) return;

  if (!isPrecachePath(url.pathname)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request);
    }),
  );
});
