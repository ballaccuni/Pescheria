// Sapore di Mare: conserva il sito sul telefono, così le ricette si aprono anche senza internet.
// Si aggiorna da solo: con internet scarica sempre la versione nuova della pagina,
// e le immagini salvate vengono rinnovate in sottofondo. Non serve cambiare niente qui.
const VERSIONE = 'sdm';
const FILE_BASE = [
  "./",
  "./sapore-di-mare.html",
  "./manifest.webmanifest",
  "./img/logo-barra.png",
  "./img/logo-pesce.png",
  "./img/logo-testo.png",
  "./img/icon.png",
  "./img/app/icona-192.png",
  "./img/app/icona-512.png",
  "./img/app/apple-touch-icon.png",
  "./img/ricette/astice-alla-catalana.svg",
  "./img/ricette/branzino-al-sale.svg",
  "./img/ricette/linguine-gambero-rosso.svg",
  "./img/ricette/orata-al-cartoccio.svg",
  "./img/ricette/polpo-alla-luciana.jpg",
  "./img/ricette/risotto-nero-di-seppia.svg",
  "./img/ricette/vongole-alla-marinara.svg",
  "./img/ricette/zuppa-di-pesce-siciliana.svg"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(FILE_BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(nomi => Promise.all(nomi.filter(n => n !== VERSIONE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Pagine: prima la rete (contenuti aggiornati), senza rete la copia salvata
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-cache' }).then(r => { const copia = r.clone(); caches.open(VERSIONE).then(c => c.put(req, copia)); return r; })
        .catch(() => caches.match(req).then(r => r || caches.match('./sapore-di-mare.html')))
    );
    return;
  }

  // Immagini e file del sito: subito la copia salvata (veloce) e intanto si scarica quella aggiornata
  if (url.origin === location.origin) {
    e.respondWith(
      caches.open(VERSIONE).then(c => c.match(req).then(salvata => {
        const dallaRete = fetch(req, { cache: 'no-cache' }).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => salvata);
        if (salvata) { e.waitUntil(dallaRete.catch(() => {})); return salvata; }
        return dallaRete;
      }))
    );
    return;
  }

  // Caratteri di Google: usa la copia salvata e intanto aggiornala
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(VERSIONE).then(c => c.match(req).then(salvata => {
        const dallaRete = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => salvata);
        return salvata || dallaRete;
      }))
    );
  }
});
