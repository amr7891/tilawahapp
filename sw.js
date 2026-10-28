// Offline support, built to use as little of the host's bandwidth as possible.
// - App files (HTML, CSS, JS, icons): saved when this version installs and served
//   from the phone. A new version of this file (new SHELL name) brings new app files.
// - Quran pages, fonts, hadith, translation, tafsir: saved the first time they're read.
// - Books: each PDF is downloaded once, then read from the phone.
// - Recitation audio streams from EveryAyah / MP3Quran (not from this site) and the
//   ayahs you play are kept so they replay offline.
const SHELL = 'tilawah-shell-v43';
const DATA = 'tilawah-data-v4';
const BOOKS = 'tilawah-books-v1';
const AUDIO = 'tilawah-audio-v1';
const ASSETS = [
  './', './index.html', './styles.css', './matcher.js', './app.js', './speech.js', './speech-worker.js', './mic-worklet.js', './fbank.js', './tajweed.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  './fonts/fonts.css',
  './mushaf/madinah/meta.json', './mushaf/madinah/bismillah.json', './mushaf/madinah/search.json', './mushaf/madinah/fonts/QCF4_QBSML.woff2', './hadith/index.json', './data/quran-ph.json',
];
const KEEP = [SHELL, DATA, BOOKS, AUDIO];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => !KEEP.includes(k)).map(k => caches.delete(k))))
    // Earlier versions saved MP3Quran ayah timings under one entry for every surah and
    // reciter (the query was ignored); drop them so each surah's timings are fetched again.
    // Our own ayah timings (small files) are refreshed with every update too.
    .then(() => caches.open(DATA)).then(c => c.keys().then(reqs => Promise.all(reqs.filter(r => r.url.includes('ayat_timing') || r.url.includes('/data/timings/')).map(r => c.delete(r)))))
    .then(() => self.clients.claim()));
});

function cacheFirst(req, name = DATA, exact = false) {
  return caches.open(name).then(c => c.match(req, { ignoreSearch: !exact }).then(hit => hit || fetch(req).then(res => {
    if (res.status === 200) c.put(req, res.clone());
    return res;
  })));
}

// Audio: keep whole files; answer range requests from the saved copy.
async function audio(req) {
  const c = await caches.open(AUDIO);
  const hit = await c.match(req.url);
  if (!hit) {
    const res = await fetch(req.url, { mode: 'cors' }).catch(() => null);
    if (res && res.status === 200) { c.put(req.url, res.clone()).catch(() => {}); return withRange(req, res); }
    return fetch(req);
  }
  return withRange(req, hit);
}
async function withRange(req, res) {
  const range = req.headers.get('range');
  if (!range) return res;
  const buf = await res.arrayBuffer();
  const m = /bytes=(\d+)-(\d*)/.exec(range);
  const start = m ? +m[1] : 0, end = m && m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), { status: 206, headers: {
    'Content-Type': res.headers.get('content-type') || 'audio/mpeg',
    'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Per-ayah recitations from EveryAyah (small files) are kept once played.
  if (url.hostname === 'everyayah.com') { e.respondWith(audio(req)); return; }
  // Ayah timings for full-surah reciters.
  if (/mp3quran\.net$/.test(url.hostname) && url.pathname.includes('ayat_timing')) { e.respondWith(cacheFirst(req, DATA, true)); return; }

  // Tajweed page fonts: kept once a page has been opened.
  if (url.hostname === 'verses.quran.foundation') { e.respondWith(cacheFirst(req)); return; }
  if (url.origin !== self.location.origin) return;

  if (/\/books\/.+\.pdf$/i.test(url.pathname)) { e.respondWith(cacheFirst(req, BOOKS)); return; }
  if (/\/(mushaf|hadith|data|fonts|vendor|models)\//.test(url.pathname)) {
    // Index files change between versions and are saved with the app files.
    if (/(index|meta|search|quran-ph)\.json$/.test(url.pathname) || url.pathname.endsWith('fonts.css')) { e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req))); return; }
    e.respondWith(cacheFirst(req)); return;
  }

  // App files: from the phone; online only if missing.
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : null)).then(hit => hit || fetch(req)));
});
