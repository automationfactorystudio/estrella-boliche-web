/* Service worker · La estrella de Boliche
   Al actualizar el juego, sube el número de VERSION para que los móviles reciban los cambios. */
const VERSION = 'estrella-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'logo-tigalma.png',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/environments/RoomEnvironment.js'];
const VOICES = ["boliche-hola.mp3", "boliche-estrella.mp3", "boliche-adonde.mp3", "boliche-puerta.mp3", "oruga-hola.mp3", "oruga-voy.mp3", "boliche-arbusto.mp3", "conejito-voy.mp3", "boliche-ardilla.mp3", "oruga-pina.mp3", "boliche-en-marcha.mp3", "oruga-huellas.mp3", "boliche-camino.mp3", "boliche-puente.mp3", "boliche-luces.mp3", "boliche-buscar.mp3", "boliche-flor.mp3", "boliche-ramitas.mp3", "boliche-nuez.mp3", "oruga-todo.mp3", "boliche-cascabel.mp3", "oruga-baile.mp3", "boliche-portal.mp3", "boliche-regalos.mp3", "boliche-dejar.mp3", "oruga-emocion.mp3", "boliche-cantar.mp3", "boliche-dormir.mp3", "oruga-feliz.mp3", "boliche-muy-bien.mp3", "boliche-estrella-ganada.mp3", "boliche-pista.mp3"].map(f => 'voces/' + f);
const SONG = 'cancion-estrella-boliche.mp3';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.all(CORE.map(u => c.add(u).catch(() => {})));       // lo imprescindible
    await Promise.all(VOICES.map(u => c.add(u).catch(() => {})));      // las voces, sin que un fallo rompa la instalación
    await c.add(SONG).catch(() => {});                                  // la canción
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});
async function rangeFrom(resp, range){
  const buf = await resp.arrayBuffer(), m = /bytes=(\d*)-(\d*)/.exec(range) || [], s = +m[1] || 0, e = m[2] ? +m[2] : buf.byteLength - 1;
  return new Response(buf.slice(s, e + 1), { status: 206, headers: { 'Content-Type': resp.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': `bytes ${s}-${e}/${buf.byteLength}`, 'Content-Length': e - s + 1 } });
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!/^https?:$/.test(url.protocol)) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: true, ignoreVary: true });
    if (req.mode === 'navigate'){                                      // la página: primero la red, y sin conexión la guardada
      try { const r = await fetch(req); if (r.ok) cache.put('index.html', r.clone()); return r; }
      catch (_) { return (await cache.match('index.html')) || (await cache.match('./')) || Response.error(); }
    }
    if (hit){
      const range = req.headers.get('range');
      return range ? rangeFrom(hit, range) : hit;
    }
    try {
      const r = await fetch(req);
      if (r && (r.ok || r.type === 'opaque') && !req.headers.get('range')) cache.put(req, r.clone());
      return r;
    } catch (_) { return Response.error(); }
  })());
});
