// sw.js - Service Worker Básico para cumplir con los requisitos de instalación (PWA)
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Instalado');
});

self.addEventListener('fetch', (e) => {
    // No hace nada por ahora, pero Google Chrome requiere que este evento exista.
});