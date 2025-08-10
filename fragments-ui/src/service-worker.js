// Minimal service worker - disabled to prevent reload loops
console.log('Service Worker: Minimal version loaded');

// Install event - just log
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event');
  self.skipWaiting();
});

// Activate event - just log
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  event.waitUntil(self.clients.claim());
});

// Fetch event - just pass through to network
self.addEventListener('fetch', (event) => {
  // Just pass through to network, no caching to avoid issues
  event.respondWith(fetch(event.request));
});
