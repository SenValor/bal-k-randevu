// Service Worker - Balık Sefası
// Bu dosya tarayıcının SW arama uyarısını önler

self.addEventListener('install', function(event) {
  console.log('Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
  // Basit fetch handling - cache kullanmıyoruz
  event.respondWith(fetch(event.request));
}); 