const CACHE_NAME = 'pixel-rally-chaos-v3'; // Updated for new structure
const urlsToCache = [
    '/',
    'index.html',
    'game.js',
    'service-worker.js',
    'manifest.json',
    'assets/images/city-background.gif',
    'assets/images/ubp-person.png',
    'assets/images/ctp-person.png',
    'assets/images/ubp-logo.png',
    'assets/images/ctp-logo.png',
    'assets/images/win-screen.png',
    'assets/images/lose-screen.png',
    'assets/images/icon.png',
    'assets/images/icon-512.png',
    'assets/audio/bg-music.wav',
    'assets/audio/countdown-voice.wav',
    'assets/audio/pop-sound.mp3',
    'assets/audio/cheers-sound.ogg',
    'assets/audio/lose-sound.mp3',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js',
    'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});