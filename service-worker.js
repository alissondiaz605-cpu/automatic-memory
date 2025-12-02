const CACHE_NAME = 'reporte-doncafe-v1';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];
self.addEventListener('install', evt=>{
  evt.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(FILES_TO_CACHE)));
  self.skipWaiting();
});
self.addEventListener('activate', evt=>{
  evt.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', evt=>{
  if(evt.request.method !== 'GET') return;
  evt.respondWith(caches.match(evt.request).then(resp=>resp || fetch(evt.request)));
});
