const VERSION = 'pokedex-v3';
const CACHE = VERSION + '-cache';

const ARCHIVOS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './fonts/pkmn-rbygsc.ttf',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(
          claves
            .filter((clave) => clave !== CACHE)
            .map((clave) => caches.delete(clave))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;

  if (peticion.method !== 'GET') return;

  const url = new URL(peticion.url);

  if (url.hostname === 'pokeapi.co') {
    evento.respondWith(apiEstrategia(peticion));
  } else if (url.hostname === 'raw.githubusercontent.com') {
    evento.respondWith(spriteEstrategia(peticion));
  } else {
    evento.respondWith(navegacionEstrategia(peticion));
  }
});

async function apiEstrategia(peticion) {
  const cache = await caches.open(CACHE);
  try {
    const respuesta = await fetch(peticion);
    if (respuesta.ok) cache.put(peticion, respuesta.clone());
    return respuesta;
  } catch {
    const enCache = await cache.match(peticion);
    if (enCache) return enCache;
    return new Response(
      JSON.stringify({ error: 'Sin conexión y sin copia local', results: [] }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function spriteEstrategia(peticion) {
  const cache = await caches.open(CACHE);
  const enCache = await cache.match(peticion);
  if (enCache) return enCache;

  try {
    const respuesta = await fetch(peticion);
    if (respuesta.ok) cache.put(peticion, respuesta.clone());
    return respuesta;
  } catch {
    return new Response(null, { status: 504 });
  }
}

async function navegacionEstrategia(peticion) {
  const cache = await caches.open(CACHE);
  try {
    const respuesta = await fetch(peticion);
    if (respuesta.ok) cache.put(peticion, respuesta.clone());
    return respuesta;
  } catch {
    const enCache = await cache.match(peticion);
    if (enCache) return enCache;

    const shell = await cache.match('./index.html');
    if (shell) return shell;

    return new Response('Sin conexión', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
