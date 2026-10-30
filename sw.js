// Offline support, built to use as little of the host's bandwidth as possible.
// - App files (HTML, CSS, JS, icons): saved when this version installs and served
//   from the phone. A new version of this file (new SHELL name) brings new app files.
// - Quran pages, fonts, hadith, translation, tafsir: saved the first time they're read.
// - Books: each PDF is downloaded once, then read from the phone.
// - Recitation audio streams from EveryAyah / MP3Quran (not from this site) and the
//   ayahs you play are kept so they replay offline.
const SHELL = 'tilawah-shell-v77';
const DATA = 'tilawah-data-v4';
const BOOKS = 'tilawah-books-v1';
const AUDIO = 'tilawah-audio-v1';
const ASSETS = [
  './', './index.html', './styles.css', './matcher.js', './app.js', './speech.js', './speech-worker.js', './mic-worklet.js', './fbank.js', './tajweed.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  './fonts/fonts.css',
  './mushaf/madinah/meta.json', './mushaf/madinah/bismillah.json', './mushaf/madinah/search.json', './mushaf/madinah/fonts/QCF4_QBSML.woff2', './hadith/index.json', './data/quran-ph.json',
];
// Books are no longer part of the app (readers add their own, kept in IndexedDB), so the
// old books cache is dropped.
const KEEP = [SHELL, DATA, AUDIO];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => !KEEP.includes(k)).map(k => caches.delete(k))))
    // Earlier versions saved MP3Quran ayah timings under one entry for every surah and
    // reciter (the query was ignored): drop those once. Since then each surah's timings are
    // saved on their own and kept, for listening offline.
    .then(() => caches.open(DATA))
    .then(c => c.match('__timings_fixed').then(done => {
      if (done) return;
      return c.keys()
        .then(reqs => Promise.all(reqs.filter(r => r.url.includes('ayat_timing')).map(r => c.delete(r))))
        .then(() => c.put('__timings_fixed', new Response('1')));
    }))
    .then(() => self.clients.claim()));
});

function cacheFirst(req, name = DATA, exact = false) {
  return caches.open(name).then(c => c.match(req, { ignoreSearch: !exact }).then(hit => hit || fetch(req).then(res => {
    if (res.status === 200) c.put(req, res.clone());
    return res;
  })));
}

function networkFirst(req, name = DATA) {
  return caches.open(name).then(c => fetch(req).then(res => { if (res.status === 200) c.put(req, res.clone()); return res; })
    .catch(() => c.match(req, { ignoreSearch: true }).then(hit => hit || Response.error())));
}

// Audio: keep whole files; answer range requests (seeking) from the saved copy.
const fileUrl = req => req.url.split('#')[0];
async function audio(req) {
  const c = await caches.open(AUDIO);
  const key = fileUrl(req);
  const hit = await c.match(key);
  if (hit) return withRange(req, hit);
  let res = await fetch(key, { mode: 'cors' }).catch(() => null);
  if (res && res.status === 200) { c.put(key, res.clone()).catch(() => {}); return withRange(req, res); }
  // A host that doesn't allow reading the file still lets it be kept and played back.
  res = await fetch(key, { mode: 'no-cors' }).catch(() => null);
  if (res && (res.type === 'opaque' || res.ok)) { c.put(key, res.clone()).catch(() => {}); return res; }
  return fetch(req);
}
// A full-surah recording: play it straight from the network, and keep the whole file in the
// background (once per file), so it plays offline from then on.
const saving = new Set();
async function surahAudio(e, req) {
  const c = await caches.open(AUDIO);
  const key = fileUrl(req);
  const hit = await c.match(key);
  if (hit) return withRange(req, hit);
  // The app downloading for offline (not the player): fetch the whole file once and keep it.
  if (req.destination !== 'audio' && req.destination !== 'video') {
    let res = await fetch(key, { mode: 'cors' }).catch(() => null);
    if (!(res && res.status === 200)) res = await fetch(key, { mode: 'no-cors' }).catch(() => null);
    if (!res) return Response.error();
    if (res.status === 200 || res.type === 'opaque') await c.put(key, res.clone()).catch(() => {});
    return res;
  }
  if (!saving.has(key)) {
    saving.add(key);
    e.waitUntil((async () => {
      try {
        let res = await fetch(key, { mode: 'cors' }).catch(() => null);
        if (!(res && res.status === 200)) res = await fetch(key, { mode: 'no-cors' }).catch(() => null);
        if (res && (res.status === 200 || res.type === 'opaque')) await c.put(key, res);
      } catch (_) {} finally { saving.delete(key); }
    })());
  }
  return fetch(req);
}
async function withRange(req, res) {
  const range = req.headers.get('range');
  if (!range || res.type === 'opaque') return res;
  const blob = await res.blob();
  const m = /bytes=(\d+)-(\d*)/.exec(range);
  const start = m ? +m[1] : 0, end = m && m[2] ? Math.min(+m[2], blob.size - 1) : blob.size - 1;
  return new Response(blob.slice(start, end + 1), { status: 206, headers: {
    'Content-Type': res.headers.get('content-type') || 'audio/mpeg',
    'Content-Range': `bytes ${start}-${end}/${blob.size}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
}

// A PDF shared to the app (Android: Share → Tilawah) is kept on the phone and the app
// opens to file it under its book. The app itself hosts no books.
function putShared(value) {
  return new Promise((res, rej) => {
    const r = indexedDB.open('tilawah-books', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('files');
    r.onerror = () => rej(r.error);
    r.onsuccess = () => { const t = r.result.transaction('files', 'readwrite'); t.objectStore('files').put(value, 'inbox'); t.oncomplete = () => res(); t.onerror = () => rej(t.error); };
  });
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method === 'POST' && new URL(req.url).pathname.endsWith('/share-target')) {
    e.respondWith((async () => {
      try {
        const f = (await req.formData()).get('pdf');
        if (f && f.size) await putShared({ name: f.name || 'Book.pdf', blob: new Blob([await f.arrayBuffer()], { type: 'application/pdf' }) });
      } catch (_) {}
      return Response.redirect(new URL('./#inbox', self.registration.scope).href, 303);
    })());
    return;
  }
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Recitations are kept on the phone once played, so they play offline afterwards:
  // EveryAyah's per-ayah files, and the full-surah recordings (MP3Quran, Quran.com).
  if (url.hostname === 'everyayah.com') { e.respondWith(audio(req)); return; }
  if ((/(^|\.)mp3quran\.net$/.test(url.hostname) || url.hostname === 'download.quranicaudio.com') && /\.mp3$/i.test(url.pathname)) { e.respondWith(surahAudio(e, req)); return; }
  // Ayah timings for full-surah reciters.
  if (/mp3quran\.net$/.test(url.hostname) && url.pathname.includes('ayat_timing')) { e.respondWith(cacheFirst(req, DATA, true)); return; }

  // Quran.com ayah and word timings for their recordings.
  if (url.hostname === 'api.quran.com' && url.pathname.includes('chapter_recitations')) { e.respondWith(cacheFirst(req, DATA, true)); return; }
  // Tajweed page fonts: kept once a page has been opened.
  if (url.hostname === 'verses.quran.foundation') { e.respondWith(cacheFirst(req)); return; }
  if (url.origin !== self.location.origin) return;

  // Our own ayah timings: fresh when online (they're improved between versions), saved for offline.
  if (url.pathname.includes('/data/timings/')) { e.respondWith(networkFirst(req)); return; }
  // Lecture lists and their follow-along timings: fresh when online, saved for offline.
  if (url.pathname.includes('/lectures/')) { e.respondWith(networkFirst(req)); return; }
  if (/\/(mushaf|hadith|data|fonts|vendor|models|arbooks)\//.test(url.pathname)) {
    // Index files change between versions and are saved with the app files.
    if (/(index|meta|search|quran-ph)\.json$/.test(url.pathname) || url.pathname.endsWith('fonts.css')) {
      // (kept with this version's app files, so they stay in step with it; also offline)
      e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
        if (res.status === 200) { const copy = res.clone(); caches.open(SHELL).then(c => c.put(req, copy)).catch(() => {}); }
        return res;
      })));
      return;
    }
    e.respondWith(cacheFirst(req)); return;
  }

  // App files: from the phone; online only if missing.
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : null)).then(hit => hit || fetch(req)));
});
