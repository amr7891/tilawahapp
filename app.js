'use strict';

/* ------------------------------------------------------------------ */
/*  Configuration — edit these to customise the app                    */
/* ------------------------------------------------------------------ */

const APP_NAME = 'Tilawah';

// The Quran text and page layout ship with the app (mushaf/madinah):
// King Fahd Complex Madinah Mushaf 1441 AH, 604 pages, 15 lines.
const MUSHAF_BASE = 'mushaf/madinah/';
// Tajweed colours: the King Fahd Complex's colour-coded pages (QPC V4 tajweed fonts,
// one per page, loaded from Quran.com's font server and kept on the phone once seen).
const TAJWEED_BASE = 'mushaf/v4/';
const TAJWEED_FONT = n => `https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p${n}.woff2`;
// The tajweed fonts carry palettes: 0 light, 1 dark, 2 sepia. Register the dark one per font.
const tajweedFams = new Set();
function tajweedPalette(fam) {
  tajweedFams.add(fam);
  let el = document.getElementById('tajweedPalettes');
  if (!el) { el = document.createElement('style'); el.id = 'tajweedPalettes'; document.head.append(el); }
  const list = [...tajweedFams].join(', ');
  el.textContent = `@font-palette-values --tajweed-dark { font-family: ${list}; base-palette: 1; }`;
}

// English translation (Sahih International) ships in /data/translation, saved exactly
// as published by the Al Quran Cloud API.

// Ayah-by-ayah reciters. `id` is the folder name on everyayah.com
// (audio URL = AUDIO_BASE/<id>/<SSS><AAA>.mp3). Replace or extend freely.
const AUDIO_BASE = 'https://everyayah.com/data';
const MP3Q = 'https://cdn.mp3quran.net/audio/';
const RECITERS = [
  { id: 'Abdul_Basit_Murattal_192kbps', name: 'Abdul Basit Abdus-Samad', arabic: 'عبد الباسط عبد الصمد' },  // Quran.com's timings drift for this recording: EveryAyah's per-ayah files
  { id: 'Abdul_Basit_Mujawwad_128kbps', name: 'Abdul Basit Abdus-Samad', arabic: 'عبد الباسط عبد الصمد', style: 'Mujawwad' , timed: { qdc: 1 }, words: true, qdcSkip: [30] },
  { id: 'Abdullaah_3awwaad_Al-Juhaynee_128kbps', name: 'Abdullah Awad Al-Juhany', arabic: 'عبد الله عواد الجهني', timed: { local: 'abdullah-juhani', read: 62, base: MP3Q + 'abdullah-juhani/r1/' } },
  { id: 'Abdurrahmaan_As-Sudais_192kbps', name: 'Abdur-Rahman as-Sudais', arabic: 'عبد الرحمن السديس' , timed: { qdc: 3 }, words: true, qdcSkip: [2, 27, 28, 48, 49] },
  { id: 'Abu_Bakr_Ash-Shaatree_128kbps', name: 'Abu Bakr al-Shatri', arabic: 'أبو بكر الشاطري' , timed: { qdc: 4 }, words: true, qdcSkip: [14, 52, 63, 75, 112, 113, 114] },
  { id: 'Hudhaify_128kbps', name: 'Ali Al-Huthaify', arabic: 'علي بن عبد الرحمن الحذيفي' },
  { id: 'tl-bandar-baleela', name: 'Bandar Baleela', arabic: 'بندر بليلة', timed: { local: 'bandar-baleela', read: 217, base: MP3Q + 'bandar-baleela/r1/' } },
  { id: 'Fares_Abbad_64kbps', name: 'Fares Abbad', arabic: 'فارس عباد' },
  { id: 'mp3quran-273', name: 'Haitham Al-Dokhin', arabic: 'هيثم الدخين', timed: { local: 'haitham-dukhain', read: 273, base: MP3Q + 'haitham-dukhain/r1/' } },
  { id: 'mp3quran-299', name: 'Hassan Saleh', arabic: 'حسن صالح', timed: { local: 'hassan-saleh', read: 299, base: MP3Q + 'hassan-saleh/r1/' } },
  { id: 'Husary_128kbps', name: 'Mahmoud Khalil Al-Husary', arabic: 'محمود خليل الحصري' , timed: { qdc: 6 }, words: true },
  { id: 'MaherAlMuaiqly128kbps', name: 'Maher Al-Muaiqly', arabic: 'ماهر المعيقلي' },
  { id: 'tl-badr-turki', name: 'Badr Al-Turki', arabic: 'بدر التركي', timed: { local: 'badr-turki', base: MP3Q + 'badr-turki/r1/' } },
  { id: 'tl-muhammad-luhaidan', name: 'Muhammad Al-Luhaidan', arabic: 'محمد اللحيدان', timed: { local: 'muhammad-luhaidan', base: MP3Q + 'muhammad-luhaidan/r1/' } },
  { id: 'Alafasy_128kbps', name: 'Mishary Rashid Alafasy', arabic: 'مشاري راشد العفاسي' , timed: { qdc: 7 }, words: true },
  { id: 'Muhammad_Ayyoub_128kbps', name: 'Muhammad Ayyub', arabic: 'محمد أيوب' },
  { id: 'mp3quran-340', name: 'Muhammad Barhaji', arabic: 'محمد برهجي', timed: { local: 'muhammad-burhaji', read: 340, base: MP3Q + 'muhammad-burhaji/r1/' } },
  { id: 'Minshawy_Murattal_128kbps', name: 'Muhammad Siddiq Al-Minshawi', arabic: 'محمد صديق المنشاوي' , timed: { qdc: 9 }, words: true },
  { id: 'Minshawy_Mujawwad_192kbps', name: 'Muhammad Siddiq Al-Minshawi', arabic: 'محمد صديق المنشاوي', style: 'Mujawwad' },  // Quran.com's timings are broken for some surahs: EveryAyah's per-ayah files
  { id: 'mp3quran-221', name: 'Raad Muhammad al-Kurdi', arabic: 'رعد محمد الكردي', timed: { local: 'raad-kurdi', read: 221, base: MP3Q + 'raad-kurdi/r1/' } },
  { id: 'mp3quran-30', name: 'Saad al-Ghamdi', arabic: 'سعد الغامدي', timed: { local: 'saad-ghamdi', read: 30, base: MP3Q + 'saad-ghamdi/r1/' } },
  { id: 'Saood_ash-Shuraym_128kbps', name: 'Saud al-Shuraim', arabic: 'سعود الشريم' , timed: { qdc: 10 }, words: true },
  { id: 'Yasser_Ad-Dussary_128kbps', name: 'Yasser al-Dossari', arabic: 'ياسر الدوسري' },
];
RECITERS.sort((x, y) => x.name.localeCompare(y.name) || (x.style ? 1 : 0) - (y.style ? 1 : 0));
const reciterGroups = () => [['Murattal', RECITERS.filter(r => !r.style)], ['Mujawwad', RECITERS.filter(r => r.style === 'Mujawwad')]];
// Reciters with `timed` play a full-surah recording from MP3Quran, cut into ayahs
// with MP3Quran's published ayah timings. All others play EveryAyah's per-ayah files.

// Hadith collections (Sunnah.com's nine main books and selections) ship in /hadith.
const HADITH_BASE = 'hadith/';

// Tafsir Ibn Kathir (English, abridged) ships in /data/tafsir, saved exactly as
// published by the Quran.com API.

// Book shelves. Each book has one or more PDF files (a link or a file in /books).
const KM = 'https://www.kalamullah.com/Books/';
const SHELVES = [
  {
    id: 'sirah', title: 'Sirah',
    items: [
      { id: 'sira-ibn-kathir', title: 'The Life of the Prophet Muhammad (Al-Sira al-Nabawiyya)', author: 'Ibn Kathir', note: '4 volumes', files: [1, 2, 3, 4].map(v => ({ label: `Volume ${v}`, url: `https://archive.org/download/AlSiraAlNabawiyya4VolumeSet/Al-Sira%20al-Nabawiyya%20Vol%20${v}.pdf` })) },
    ],
  },
  {
    id: 'ibn-qayyim', title: 'Ibn al-Qayyim', arabic: 'ابن القيم',
    items: [
      ['Zad al-Maʿad: Provisions for the Hereafter', null, [1, 2, 3, 4].map(v => [`Volume ${v}`, `Zad-ul-Maad-Provisions-for-the-Hereafter-Vol.-${v}-Ibn-al-Qayyim.pdf`])],
      ['Provisions for the Hereafter (Zaad al-Maʿad, abridged)', null, 'Zaad%20al-Maad.pdf'],
      ['Ranks of the Divine Seekers (Madarij al-Salikin)', null, [['Part 1', 'Ranks%20of%20the%20Divine%20Seekers%20vol%201.pdf'], ['Part 2', 'Ranks%20of%20the%20Divine%20Seekers%20vol%202.pdf']]],
      ['The Remedy for Those Victimized by Sins (Ad-Daʼ wad-Dawaʼ)', null, "The_Remedy_For_Those_Victimized_by_Sins_Translation_of_ad_Da'_wad.pdf"],
      ['Al-Fawaid: A Collection of Wise Sayings', null, 'Al-FAWAID.pdf'],
      ['Healing with the Medicine of the Prophet', null, 'Healing-with-the-Medicine-of-the-Prophet-Ibn-al-Qayyim.pdf'],
      ['Driving the Souls to the Abodes of Happiness', null, 'Driving%20the%20souls%20to%20the%20Abodes%20of%20Happiness%20by%20Imam%20Ibn%20al-Qayyim%20al-Jawziyyah.pdf'],
      ['Supporting the Distressed Against the Tricks of Satan', null, 'Supporting-the-Distressed-Against-the-Tricks-of-Satan-Ibn-al-Qayyim.pdf'],
      ['The Spiritual Cure: An Explanation of Surah al-Fatihah', null, 'The Spiritual Cure.pdf'],
      ['Spiritual Disease and Its Cure', null, 'Spiritual%20Disease%20and%20Its%20Cure.pdf'],
      ['Remembrance of the Most Merciful', null, 'Remembrance%20of%20the%20Most%20Merciful%20-%20Ibn%20al-Qayyim.pdf'],
      ['Heartfelt Advice to a Friend', null, 'Heartfelt-Advice-to-a-Friend-Ibn-al-Qayyim.pdf'],
      ['Inner Dimensions of the Prayer', null, 'Inner%20dimensions%20of%20the%20prayer.pdf'],
      ['Tawbah: Turning to Allah in Repentance', null, 'Tawbah%20-%20Turning%20to%20Allah%20in%20Repentance%20-%20Ibn%20al-Qayyim.pdf'],
      ['The Way to Patience and Gratitude', null, 'Excellence-of-Patience-Gratefulness-Ibn-al-Qayyim-1.pdf'],
      ['Patience and Gratitude (abridged)', null, 'Patience_and_Gratitude.pdf'],
      ['The Soul’s Journey After Death', null, 'the_soul_journey.pdf'],
      ['Characteristics of the Hypocrites', null, 'Characteristics%20of%20the%20Hypocrites.pdf'],
      ['Men and the Universe: Reflections of Ibn al-Qayyim', null, 'Men%20&%20the%20Universe%20-%20Reflections%20of%20Ibn%20Al-Qayyem.pdf'],
      ['Ibn Qayyim al-Jawziyyah on Knowledge', null, 'Ibn%20Qayyim%20on%20Knowledge.pdf'],
      ['The Path to Guidance', null, 'guide.pdf'],
      ['Guidance to the Uncertain in Reply to the Jews and the Nazarenes', null, 'https://archive.org/download/GuidanceToTheUncertain/Guidance%20to%20The%20Uncertain.pdf'],
      ['Newborn Baby Guide', null, 'Newborn%20Baby%20Guide%20-%20Ibn%20al-Qayyim.pdf'],
      ['The Purification of the Soul', 'Compiled from Ibn Rajab, Ibn al-Qayyim and al-Ghazali', 'PurificationOfTheSoul.pdf'],
      ['Heaven’s Door', 'Compiled from Ibn Rajab, Ibn al-Qayyim and al-Ghazali', 'Heavens Door.pdf'],
      ['Waswasah', 'By Ibn Qudamah al-Maqdisi, listed with Ibn al-Qayyim’s works', 'Waswasah.pdf'],
      ['The Biography of Imam Ibn al-Qayyim', 'By Salahud-Din Ali Abdul-Mawjud', 'The%20Biography%20Of%20Imam%20Ibn%20Al-Qayyim%20by%20Salahud-Din%20Ali%20Abdul-Mawjud.pdf'],
      { id: 'ar-salat', title: 'The Prayer and the Ruling on Abandoning It (Kitab al-Salah)', author: 'Ibn Qayyim al-Jawziyyah', files: [], ar: 'salat', arOnly: true },
      { id: 'ar-jala', title: 'Jalaʾ al-Afham: Sending Blessings on the Prophet ﷺ', author: 'Ibn Qayyim al-Jawziyyah', files: [], ar: 'jala', arOnly: true },
    ],
  },
  {
    id: 'ibn-taymiyyah', title: 'Ibn Taymiyyah', arabic: 'ابن تيمية',
    items: [
      ['Kitab al-Iman: Book of Faith', null, 'Kitab%20Al-Iman.pdf'],
      ['Book of Emaan', null, 'Book%20of%20Emaan.pdf'],
      ['Sharh al-Aqeedah al-Wasitiyah', null, 'Sharh%20Al-Aqeedat-il-Wasitiyah.pdf'],
      ['The Friends of Allah and the Friends of Shaytan', null, 'The_Friends_of_Allah_-_The_Friends_of_Shaytan_Ibn_Taymiyyah.pdf'],
      ['Diseases of the Hearts and Their Cures', null, 'Diseases Of The Hearts And Their Cures.pdf'],
      ['Purify My Heart', null, 'Purify%20My%20Heart.pdf'],
      ['Gardens of Purification', null, 'Gardens_of_Purification_by_Shaykhul-Islam_Ibn_Taymiyyah.pdf'],
      ['The Principle of Love and Desire', null, 'Principle%20of%20Love%20and%20Desire%20final.pdf'],
      ['The Goodly Word (Al-Kalim al-Tayyib)', null, 'The Goodly Word .pdf'],
      ['Seeking Forgiveness', null, 'Seeking-Forgiveness-Ibn-Taymiyyah.pdf'],
      ['The Relief from Distress: An Explanation of the Duʿa of Yunus', null, 'The Relief From Distress.pdf'],
      ['The Nature of Fasting', null, 'Ibn_Taymiyyahs_The_Nature_Of_Fasting.pdf'],
      ['Ibn Taymiyyah Expounds on Islam', null, 'ibn_taymiyyah_expounds_on_islam.pdf'],
      ['The Political Shariyah on Reforming the Ruler and the Ruled', null, 'The%20Political%20Shariyah%20on%20Reforming%20The%20Ruler%20and%20The%20Ruled.pdf'],
      ['Enjoining Good, Forbidding Evil', null, 'Enjoining Right and forbidding wrong.pdf'],
      ['The Religious and Moral Doctrine of Jihad', null, 'moral doctrine of Jihad.pdf'],
      ['Fatwas of Muslim Women', null, 'women.pdf'],
      ['Essay on the Jinn', null, 'Ibn%20Taymiyahs%20Essay%20on%20the%20Jinn.pdf'],
      ['The Right Way', null, 'the-right-way.pdf'],
      ['Letters from Prison', null, 'Ibn Taymeeyahs Letters From Prison.pdf'],
      ['The Lofty Virtues of Ibn Taymiyyah', 'By al-Hafidh ʿUmar bin ʿAli al-Bazzar', 'TheLoftyVirtuesOfIbnTaymiyyah.pdf'],
      { id: 'ar-tadmuriyya', title: 'Al-Risalah al-Tadmuriyyah', author: 'Shaykh al-Islam Ibn Taymiyyah', files: [], ar: 'tadmuriyya', arOnly: true },
    ],
  },
  {
    id: 'more', title: 'More books',
    items: [
      { id: 'kitab-at-tawhid', title: 'Kitab at-Tawhid', author: 'Shaykh Muhammad ibn Abdul Wahhab', files: [{ label: 'PDF', url: KM + 'Kitab-At-Tauhid-The-Book-of-Monotheism-Sh.-Muhammad-bin-Abdul-Wahhab.pdf' }] },
      { id: 'ar-tahawiyya', title: 'Al-ʿAqidah al-Tahawiyyah', author: 'Abu Jaʿfar al-Tahawi', files: [], ar: 'tahawiyya', arOnly: true },
    ],
  },
];
// Expand the short [title, note, file(s)] form into book objects.
SHELVES.forEach(sh => {
  const author = sh.title === 'Ibn al-Qayyim' ? 'Ibn Qayyim al-Jawziyyah' : sh.title === 'Ibn Taymiyyah' ? 'Shaykh al-Islam Ibn Taymiyyah' : '';
  sh.items = sh.items.map((it, i) => {
    if (!Array.isArray(it)) return it;
    const [title, note, f] = it;
    const url = u => (/^https?:/.test(u) ? u : KM + u).replace(/ /g, '%20');
    const files = Array.isArray(f) ? f.map(([label, u]) => ({ label, url: url(u) })) : [{ label: 'PDF', url: url(f) }];
    return { id: `${sh.id}-${i + 1}`, title, author: note || author, note: files.length > 1 ? `${files.length} ${files[0].label.startsWith('Part') ? 'parts' : 'volumes'}` : '', files };
  });
});

// The Arabic original of each book (public domain), read in the app's own Arabic reader.
// Texts from the OpenITI corpus (CC BY-NC-SA 4.0); only the author's words are kept.
const AR_ORIGINAL = {
  'ibn-qayyim-1': 'zad', 'ibn-qayyim-2': 'zad', 'ibn-qayyim-3': 'madarij', 'ibn-qayyim-4': 'dawa', 'ibn-qayyim-5': 'fawaid',
  'ibn-qayyim-6': 'tibb', 'ibn-qayyim-7': 'hadi', 'ibn-qayyim-8': 'ighatha', 'ibn-qayyim-9': ['madarij', 'Its explanation of al-Fatiha opens Madarij al-Salikin.'],
  'ibn-qayyim-10': 'dawa', 'ibn-qayyim-11': 'wabil', 'ibn-qayyim-12': 'tabukiyya', 'ibn-qayyim-13': 'asrar-salat',
  'ibn-qayyim-14': ['madarij', 'The chapter on repentance (manzilat al-tawbah) is in Madarij al-Salikin.'],
  'ibn-qayyim-15': 'uddat', 'ibn-qayyim-16': 'uddat', 'ibn-qayyim-17': 'ruh', 'ibn-qayyim-18': 'munafiqin',
  'ibn-qayyim-19': 'miftah', 'ibn-qayyim-20': 'miftah', 'ibn-qayyim-22': 'hidayat', 'ibn-qayyim-23': 'tuhfa',
  'ibn-taymiyyah-1': 'iman', 'ibn-taymiyyah-2': 'iman', 'ibn-taymiyyah-3': ['wasitiyya', 'Ibn Taymiyyah\u2019s text that the commentary explains.'],
  'ibn-taymiyyah-4': 'furqan', 'ibn-taymiyyah-5': 'amrad', 'ibn-taymiyyah-8': 'mahabba', 'ibn-taymiyyah-9': 'kalim',
  'ibn-taymiyyah-14': 'siyasa', 'ibn-taymiyyah-15': 'amr', 'ibn-taymiyyah-21': 'alam', 'kitab-at-tawhid': 'tawhid', 'sira-ibn-kathir': 'sira',
};

// Publishers named on the books' title pages, for finding each book at its source.
const PUBLISHERS = [
  ['Al-Sira', 'Garnet Publishing'], ['Nature_Of_Fasting', 'Darussalam'], ['Kitab-At-Tauhid', 'Darussalam'],
  ['Biography%20Of%20Imam', 'Darussalam'], ['Heavens%20Door', 'Al-Firdous'], ['Spiritual%20Disease', 'Al-Firdous'],
  ['Relief%20From%20Distress', "Daar us-Sunnah"], ['Friends_of_Allah', "Daar us-Sunnah"], ['The_Remedy_For', 'IIPH'],
  ['Patience_and_Gratitude', 'Ta-Ha Publishers'],
];
SHELVES.forEach(sh => sh.items.forEach(b => {
  const ar = AR_ORIGINAL[b.id];
  if (ar && !b.arOnly) { b.ar = Array.isArray(ar) ? ar[0] : ar; b.arNote = Array.isArray(ar) ? ar[1] : ''; }
  const u = (b.files[0] && b.files[0].url) || '';
  const hit = PUBLISHERS.find(([k]) => u.includes(k));
  if (hit) b.publisher = hit[1];
}));

// Where each juz begins (surah, ayah).
const JUZ_STARTS = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 82], [6, 111], [7, 88], [8, 41],
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],
  [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
];

const KAABA = { lat: 21.422487, lon: 39.826206 };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem('tl:' + k); return v ? JSON.parse(v) : d; } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem('tl:' + k, JSON.stringify(v)); } catch (_) { /* storage unavailable */ } },
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad3 = n => String(n).padStart(3, '0');
const arDigits = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const vibrate = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };
// The element that scrolls: the phone frame on wide screens, the page on phones.
const scroller = () => { const s = $('#screen'); return s && getComputedStyle(s).overflowY === 'auto' ? s : null; };
const scrollTop = () => { const s = scroller(); if (s) s.scrollTop = 0; else window.scrollTo(0, 0); };

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

let toastTimer;
function toast(parts, kind) {
  const el = $('#toast');
  el.textContent = '';
  (Array.isArray(parts) ? parts : [parts]).forEach(p => {
    if (typeof p === 'string') el.append(p);
    else { const s = document.createElement('span'); s.className = 'tw'; s.lang = 'ar'; s.textContent = p.ar; el.append(s); }
  });
  el.className = 'toast' + (kind === 'bad' ? ' bad' : kind === 'warn' ? ' bad warn' : '');
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, kind === 'bad' ? 3200 : 2400);
}

/* ------------------------------------------------------------------ */
/*  Quran data (bundled Madinah Mushaf)                                */
/* ------------------------------------------------------------------ */

const Q = {
  meta: null, metaP: null,
  all: [], start: [],            // every ayah in order as [surah, ayah]; index of each surah's first ayah
  pages: new Map(), fonts: new Map(),
  base() { return settings.tajweed ? TAJWEED_BASE : MUSHAF_BASE; },
  // Switching between plain and tajweed pages: forget the loaded pages.
  reset() { this.pages = new Map(); this.chunks = new Map(); },

  load() {
    if (!this.metaP) {
      // The Bismillah is drawn from the official font's own outline (bismillah.json),
      // because some browsers (Safari) draw that very wide glyph with stray strokes.
      fetchJSON(MUSHAF_BASE + 'bismillah.json').then(b => { this.bism = b; }).catch(() => {});
      this.metaP = fetchJSON(MUSHAF_BASE + 'meta.json').then(m => {
        this.meta = m;
        m.chapters.forEach(c => { this.start[c.n] = this.all.length; for (let a = 1; a <= c.ayahs; a++) this.all.push([c.n, a]); });
        return m;
      });
      this.metaP.catch(() => { this.metaP = null; });
    }
    return this.metaP;
  },
  ch(n) { return this.meta.chapters[n - 1]; },
  gi(s, a) { return this.start[s] + a - 1; },
  ayahPage(s, a) { return this.meta.ayahPage[s - 1][a - 1]; },
  juzOfPage(p) { let j = 1; this.meta.juz.forEach((sp, i) => { if (p >= sp) j = i + 1; }); return j; },
  surahsOnPage(p) { return this.meta.chapters.filter(c => c.pages[0] <= p && c.pages[1] >= p); },

  fam(fid) { return fid === 'B' ? 'QCF_B' : 'QCF_' + fid; },
  bismSVG(x) {
    const b = this.bism && this.bism[`${x.fid}:${x.g.codePointAt(0).toString(16)}`];
    if (!b) return null;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 ${-b.y1} ${b.w} ${b.y1 - b.y0}`);
    svg.setAttribute('class', 'bism-svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'بسم الله الرحمن الرحيم');
    svg.style.width = (b.w / b.upem) + 'em';
    svg.style.height = ((b.y1 - b.y0) / b.upem) + 'em';
    const g = document.createElementNS(ns, 'g'); g.setAttribute('transform', 'scale(1,-1)');
    const p = document.createElementNS(ns, 'path'); p.setAttribute('d', b.d); p.setAttribute('fill', 'currentColor');
    g.append(p); svg.append(g);
    return svg;
  },
  font(fid) {
    if (!this.fonts.has(fid)) {
      const file = fid === 'B' ? 'QCF4_QBSML.woff2' : `QCF4_Hafs_${fid}_W.woff2`;
      const url = fid[0] === 'T' ? TAJWEED_FONT(fid.slice(1)) : `${MUSHAF_BASE}fonts/${file}`;
      const face = new FontFace(this.fam(fid), `url(${url})`, { display: 'block' });
      const p = face.load().then(f => { document.fonts.add(f); if (fid[0] === 'T') tajweedPalette(this.fam(fid)); return f; });
      p.catch(() => this.fonts.delete(fid));
      this.fonts.set(fid, p);
    }
    return this.fonts.get(fid);
  },

  // Pages are stored ten to a file (pages/01.json holds pages 1–10).
  chunks: new Map(),
  chunk(c) {
    if (!this.chunks.has(c)) {
      const pr = fetchJSON(`${this.base()}pages/${String(c).padStart(2, '0')}.json`);
      pr.catch(() => this.chunks.delete(c));
      this.chunks.set(c, pr);
    }
    return this.chunks.get(c);
  },
  page(p) {
    if (!this.pages.has(p)) {
      const c = Math.ceil(p / 10);
      const pr = this.chunk(c).then(list => this.index(list[(p - 1) % 10]));
      pr.catch(() => this.pages.delete(p));
      this.pages.set(p, pr);
    }
    return this.pages.get(p);
  },
  index(d) {
    const P = d.p;
    d.lines = d.l.map(line => line.map(el => {
      switch (el[0]) {
        case 'w': return { t: 'w', s: el[1], a: el[2], pos: el[3], text: el[4], g: el[5], fid: el[6] || d.f, p: P,
          id: `${el[1]}:${el[2]}:${el[3]}`, norm: Matcher.normalize(el[4]) };
        case 'e': return { t: 'e', s: el[1], a: el[2], g: el[3], fid: el[4] || d.f, p: P };
        case 'q': return { t: 'q', g: el[1], fid: el[2] || d.f };
        case 'h': return { t: 'h', s: el[1], g: el[2], fid: 'B' };
        default: return { t: 'b', g: el[1], fid: el[2] || d.f };
      }
    }));
    d.items = d.lines.flat();
    d.words = d.items.filter(x => x.t === 'w');
    d.words.forEach(w => { w.free = w.pos === 1 && Matcher.isMuqattaat(w.norm, w.s, w.a, 0); });
    d.fids = [...new Set(d.items.map(x => x.fid))];
    return d;
  },
  async pageReady(p) {
    const d = await this.page(p);
    await Promise.all(d.fids.map(f => this.font(f)));
    return d;
  },
  // All ayahs of a surah as {n, words, end}, read from its pages.
  async surah(s) {
    const c = this.ch(s);
    const ds = [];
    for (let p = c.pages[0]; p <= c.pages[1]; p++) ds.push(this.page(p));
    const pages = await Promise.all(ds);
    // Show the surah once the first pages' fonts are in; the rest load behind it.
    pages.forEach(d => d.fids.forEach(f => this.font(f).catch(() => {})));
    await Promise.all(pages.slice(0, 2).flatMap(d => d.fids.map(f => this.font(f)))).catch(() => {});
    const ayahs = Array.from({ length: c.ayahs }, (_, i) => ({ n: i + 1, words: [], end: null }));
    let bism = null, head = null;
    pages.forEach(d => d.lines.forEach((line, li) => line.forEach(x => {
      if (x.t === 'h' && x.s === s) { head = x; const next = d.lines[li + 1] && d.lines[li + 1][0]; if (next && next.t === 'b') bism = next; }
      if ((x.t === 'w' || x.t === 'e') && x.s === s) { const A = ayahs[x.a - 1]; if (x.t === 'w') A.words.push(x); else A.end = x; }
    })));
    return { ayahs, bism, head };
  },
  // The first ayah that begins on page p.
  async firstAyahOn(p) {
    const d = await this.page(p);
    const w = d.words.find(x => x.pos === 1) || d.words[0];
    return [w.s, w.a];
  },
};

/* ------------------------------------------------------------------ */
/*  State and settings                                                 */
/* ------------------------------------------------------------------ */

const settings = Object.assign({
  reciter: 'Muhammad_Ayyoub_128kbps', repeat: 1, fontSize: 30, translation: false, tafsir: false,
  autoNext: true, followWords: true, hide: false, listenRepeat: false, speed: 1, mistakePopups: true, mushaf: 'madinah', readMode: 'mushaf',
  engine: 'quran', checkLevel: 'tajweed', tajweed: true, strict: 'balanced', mushafZoom: 1,
}, store.get('settings', {}));
if (!RECITERS.some(r => r.id === settings.reciter)) settings.reciter = 'Muhammad_Ayyoub_128kbps';
settings.mushaf = 'madinah';

const state = { view: 'list', surahNum: null, surahData: null, selected: null };

// English translation (Sahih International), fetched per surah and kept.
const translations = new Map();
function getTranslation(s) {
  if (!translations.has(s)) {
    const p = fetchJSON(`data/translation/en.sahih/${s}.json`).then(r => {
      if (!r || !r.data || !Array.isArray(r.data.ayahs)) throw new Error('Unexpected response');
      return r.data.ayahs.map(a => a.text);
    });
    p.catch(() => translations.delete(s));
    translations.set(s, p);
  }
  return translations.get(s);
}

// Tafsir Ibn Kathir: per surah, a list of [fromAyah, toAyah, html]. Each passage
// is attached to its first ayah; the ayahs after it up to the next passage share it.
const tafsirs = new Map();
function getTafsir(s) {
  if (!tafsirs.has(s)) {
    const p = fetchJSON(`data/tafsir/ibn-kathir/${s}.json`).then(r => {
      const rows = (r.tafsirs || []).map(t => [+t.verse_key.split(':')[1], t.text || '']).sort((x, y) => x[0] - y[0]);
      const groups = [];
      rows.forEach(([a, html]) => {
        if (html.trim()) groups.push([a, a, html]);
        else if (groups.length) groups[groups.length - 1][1] = a;
      });
      return groups;
    });
    p.catch(() => tafsirs.delete(s));
    tafsirs.set(s, p);
  }
  return tafsirs.get(s);
}
async function tafsirFor(s, a) {
  const groups = await getTafsir(s);
  return groups.find(g => a >= g[0] && a <= g[1]) || null;
}
// Keep the published structure (headings, paragraphs, Arabic) and drop anything else.
function tafsirNode(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const out = document.createElement('div');
  out.className = 'tafsir-html';
  const allowed = new Set(['H1', 'H2', 'H3', 'H4', 'P', 'DIV', 'SPAN', 'B', 'STRONG', 'I', 'EM', 'BR', 'SUP', 'SUB', 'UL', 'OL', 'LI', 'BLOCKQUOTE']);
  const copy = (from, to) => from.childNodes.forEach(n => {
    if (n.nodeType === 3) { to.append(n.textContent); return; }
    if (n.nodeType !== 1) return;
    if (/^(SCRIPT|STYLE|IFRAME|OBJECT|NOSCRIPT|TEMPLATE)$/.test(n.tagName)) return;
    if (!allowed.has(n.tagName)) { copy(n, to); return; }
    const el = document.createElement(n.tagName);
    const txt = n.textContent || '';
    if (/[\u0600-\u06FF]/.test(txt) && (txt.match(/[\u0600-\u06FF]/g) || []).length > txt.replace(/\s/g, '').length * 0.5) { el.dir = 'rtl'; el.lang = 'ar'; el.className = 'ar'; }
    else if (/^(P|DIV|H\d|LI|BLOCKQUOTE)$/.test(n.tagName)) el.dir = 'auto';
    copy(n, el);
    to.append(el);
  });
  copy(doc.body, out);
  return out;
}
const ayahRange = (s, g) => g[0] === g[1] ? `${s}:${g[0]}` : `${s}:${g[0]}–${g[1]}`;

function currentReciter() { return RECITERS.find(r => r.id === settings.reciter) || RECITERS[0]; }
function reciterName() { const r = currentReciter(); return r.name + (r.style === 'Mujawwad' ? ' (Mujawwad)' : ''); }

// Ayah timings for full-surah recordings, per reciter and surah.
const timings = new Map();
// Full-surah timing for this reciter and surah, or null to play EveryAyah's per-ayah files
// (for surahs where Quran.com's timings don't match its recording).
function timedFor(r, s) { return r && r.timed && !(r.qdcSkip && r.qdcSkip.includes(s)) ? r.timed : null; }
function getTimings(timed, s) {
  const k = (timed.qdc ? 'qdc' + timed.qdc : timed.local || timed.read) + ':' + s;
  if (!timings.has(k)) {
    // Our own timings (data/timings/<reciter>/<surah>.json, [[start, end] ms per ayah]),
    // worked out by aligning the recording with the Quran phoneme model; or MP3Quran's.
    const mp3q = () => fetchJSON(`https://www.mp3quran.net/api/v3/ayat_timing?surah=${s}&read=${timed.read}`).then(list => {
      const byAyah = {};
      // MP3Quran's starts sit ~0.2-0.3 s early, in the previous ayah's last sound (measured
      // against our own timings): start a little later.
      list.forEach(t => { if (t.ayah > 0) byAyah[t.ayah] = [t.start_time / 1000 + (t.ayah > 1 ? 0.2 : 0), t.end_time / 1000 + 0.2]; });
      return byAyah;
    });
    const own = () => fetchJSON(`data/timings/${timed.local}/${s}.json`).then(list => { const byAyah = {}; list.forEach((t, i) => { byAyah[i + 1] = [t[0] / 1000, t[1] / 1000]; }); return byAyah; });
    // Quran.com: their full-surah recording, its ayah times and every word's time (segments).
    const qdc = () => fetchJSON(`https://api.quran.com/api/v4/chapter_recitations/${timed.qdc}/${s}?segments=true`).then(d => {
      const f = d.audio_file, byAyah = { url: f.audio_url, words: {} };
      f.timestamps.forEach(t => { const a = +t.verse_key.split(':')[1]; byAyah[a] = [t.timestamp_from / 1000, t.timestamp_to / 1000]; byAyah.words[a] = (t.segments || []).filter(x => x.length >= 3).map(x => [x[0], x[1] / 1000, x[2] / 1000]); });
      return byAyah;
    });
    const p = timed.qdc ? qdc() : timed.local ? (timed.read ? own().catch(mp3q) : own()) : mp3q();
    p.catch(() => timings.delete(k));
    timings.set(k, p);
  }
  return timings.get(k);
}

/* Hifz: track memorization page by page (Madinah mushaf, 604 pages) and plan murajaʿah.
   The reader chooses how many new pages and how many review pages a day. Review picks the
   pages that most need it: weak ones and the longest unrevised first. A recitation test of a
   page rates it automatically. Everything is kept on this phone. */
const hifz = {
  QNAME: { 1: 'Weak', 2: 'Good', 3: 'Strong' },
  JUZ_NAME: { 0.25: 'Quarter of a juz', 0.5: 'Half a juz', 1: '1 juz', 2: '2 juz' },
  data() {
    const d = store.get('hifz', null) || {};
    d.pages = d.pages || {}; d.days = d.days || {};
    d.plan = Object.assign({ newPer: 1, reviewJuz: 0.5, dir: 'fwd', start: 1 }, d.plan || {});
    if (![0.5, 1, 2].includes(d.plan.newPer)) d.plan.newPer = 1;
    if (![0.25, 0.5, 1, 2].includes(d.plan.reviewJuz)) d.plan.reviewJuz = 0.5;
    return d;
  },
  save(d) { store.set('hifz', d); },
  today() { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; },
  day(d) { const k = this.today(); d.days[k] = d.days[k] || { n: [], r: [] }; return d.days[k]; },
  memorized(d) { return Object.keys(d.pages).filter(p => d.pages[p].s === 'mem').map(Number); },
  set(p, st) {
    const d = this.data();
    if (!st) delete d.pages[p];
    else {
      const was = d.pages[p];
      d.pages[p] = Object.assign({ t: Date.now(), r: [] }, was || {}, { s: st });
      if (st === 'mem' && (!was || was.s !== 'mem')) { d.pages[p].m = Date.now(); const day = this.day(d); if (!day.n.includes(p)) day.n.push(p); }
    }
    if (st !== 'mem') { const day = d.days[this.today()]; if (day) day.n = day.n.filter(x => x !== p); }
    this.save(d);
  },
  review(p, q) {
    const d = this.data();
    const pg = d.pages[p] || (d.pages[p] = { s: 'mem', t: Date.now(), r: [] });
    pg.r = (pg.r || []).concat([[Date.now(), q]]).slice(-12);
    const day = this.day(d); if (!day.r.includes(p)) day.r.push(p);
    this.save(d);
  },
  last(pg) { return pg && pg.r && pg.r.length ? pg.r[pg.r.length - 1] : null; },
  // How much a memorized page needs review now: days since it was last revised, more for weak ones.
  need(pg) {
    const l = this.last(pg), since = (Date.now() - (l ? l[0] : (pg.m || pg.t || 0))) / 864e5;
    return since * (!l ? 1.2 : l[1] === 1 ? 3 : l[1] === 2 ? 1.5 : 1);
  },
  // The mushaf in review portions of the chosen size: quarter, half, one or two juz.
  portions(size) {
    const juz = Array.from({ length: 30 }, () => []);
    for (let p = 1; p <= 604; p++) juz[Q.juzOfPage(p) - 1].push(p);
    const out = [];
    if (size >= 1) { for (let j = 0; j < 30; j += size) out.push([].concat(...juz.slice(j, j + size))); return out; }
    const parts = Math.round(1 / size);
    juz.forEach(pg => { for (let k = 0; k < parts; k++) out.push(pg.slice(Math.round(k * pg.length / parts), Math.round((k + 1) * pg.length / parts))); });
    return out;
  },
  // Today's plan. Murajaʿah: the portion with the most need (weak and longest-unrevised pages),
  // read through in order; new: today's page (or half page), then the next in the chosen order.
  plan(d) {
    const day = d.days[this.today()] || { n: [], r: [] };
    const memSet = new Set(this.memorized(d));
    let review = [], portion = -1, custom = false;
    if (memSet.size) {
      const scored = this.portions(d.plan.reviewJuz).map((pages, i) => {
        const mine = pages.filter(p => memSet.has(p) && !day.n.includes(p));
        return { i, mine, score: mine.reduce((t, p) => t + this.need(d.pages[p]), 0) / Math.max(1, pages.length) };
      }).filter(x => x.mine.length).sort((a, b) => b.score - a.score);
      // Keep today's portion steady once started: the one holding pages already revised today.
      const started = scored.find(x => x.mine.some(p => day.r.includes(p)));
      let pick = started || scored[0] || { mine: [], i: -1 };
      // You chose today's murajaʿah yourself: a portion, or your own run of pages.
      const ch = day.pick;
      if (ch && ch.from) { const mine = []; for (let p = ch.from; p <= ch.to; p++) if (memSet.has(p) && !day.n.includes(p)) mine.push(p); if (mine.length) pick = { mine, i: -1, custom: true }; }
      else if (ch && ch.size === d.plan.reviewJuz) { const x = scored.find(y => y.i === ch.i); if (x) pick = x; }
      review = pick.mine; portion = pick.i; custom = !!pick.custom;
    }
    day.r.forEach(p => { if (!review.includes(p)) review.push(p); });
    const fresh = day.n.slice();
    Object.keys(d.pages).filter(p => d.pages[p].s === 'learn').map(Number).forEach(p => { if (!fresh.includes(p)) fresh.push(p); });
    const want = Math.ceil(d.plan.newPer);
    let p = d.plan.start; const step = d.plan.dir === 'back' ? -1 : 1;
    while (fresh.length < want && p >= 1 && p <= 604) { if (!d.pages[p] && !fresh.includes(p)) fresh.push(p); p += step; }
    return { fresh, review, day, portion, custom };
  },
  streak(d) {
    let n = 0; const t = new Date();
    for (let i = 0; i < 4000; i++) {
      const k = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`, x = d.days[k];
      if (x && (x.n.length || x.r.length)) n++; else if (!(i === 0)) break;   // today may still be ahead of you
      t.setDate(t.getDate() - 1);
    }
    return n;
  },
  pageLabel(p) { const cs = Q.surahsOnPage(p); return `${cs.map(c => c.en).join(', ')} · Juz ${Q.juzOfPage(p)}`; },
  ago(ts) { if (!ts) return 'not revised yet'; const dd = Math.floor((Date.now() - ts) / 864e5); return dd === 0 ? 'revised today' : dd === 1 ? 'revised yesterday' : `revised ${dd} days ago`; },
  // "1–11, 14" from a list of pages.
  ranges(ps) {
    const a = ps.slice().sort((x, y) => x - y), out = [];
    for (let i = 0; i < a.length; i++) { let j = i; while (j + 1 < a.length && a[j + 1] === a[j] + 1) j++; out.push(i === j ? `${a[i]}` : `${a[i]}–${a[j]}`); i = j; }
    return out.join(', ');
  },
  pagesText(ps) { return `${ps.length === 1 ? 'Page' : 'Pages'} ${this.ranges(ps)}`; },
  portionName(size, i) {
    if (i == null || i < 0) return this.JUZ_NAME[size];
    if (size === 2) return `Juz ${2 * i + 1}–${2 * i + 2}`;
    if (size === 1) return `Juz ${i + 1}`;
    if (size === 0.5) return `Juz ${Math.floor(i / 2) + 1}, ${i % 2 ? 'second' : 'first'} half`;
    return `Juz ${Math.floor(i / 4) + 1}, ${['first', 'second', 'third', 'fourth'][i % 4]} quarter`;
  },
  render() {
    const box = $('#hifz'); if (!box) return;
    if (!Q.meta) { box.innerHTML = '<p class="empty">Loading…</p>'; Q.load().then(() => this.render()).catch(() => {}); return; }
    const d = this.data(), { fresh, review, day, portion, custom } = this.plan(d), mem = this.memorized(d), pl = d.plan;
    const isMem = p => !!(d.pages[p] && d.pages[p].s === 'mem');
    const mic = '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
    const tick = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    const streak = this.streak(d);

    // New memorization: one card; folds to a single line once today's is done.
    let newCard;
    const todo = fresh.filter(p => !isMem(p)), doneNew = day.n.slice();
    if (!todo.length && doneNew.length) newCard = `<div class="hz-done">${tick}<span><b>New</b> · ${this.pagesText(doneNew)} memorized</span><button type="button" class="hz-link" data-hz="undo-new">Undo</button></div>`;
    else if (!todo.length) newCard = `<div class="hz-done muted"><span><b>New</b> · nothing left in this direction. Change where you start in Plan.</span></div>`;
    else {
      const half = pl.newPer === 0.5 ? (d.pages[todo[0]] && d.pages[todo[0]].h ? 'second half' : 'first half') : '';
      const show = half ? [todo[0]] : fresh;
      newCard = `<section class="hz-card">
        <div class="hz-k">New</div>
        <a class="hz-main" href="#page-${show[0]}"><b>${this.pagesText(show)}${half ? ` · ${half}` : ''}</b><span>${esc(Q.surahsOnPage(show[0]).map(c => c.en).join(', '))}</span></a>
        ${show.length > 1 ? `<div class="hz-pills">${show.map(p => `<button type="button" class="hz-pill${isMem(p) ? ' on' : ''}" data-hz="pg" data-p="${p}">${isMem(p) ? tick : ''}${p}</button>`).join('')}</div>` : ''}
        <div class="hz-cta"><button type="button" class="icon-btn" data-hz="test-new" aria-label="Recite it to check">${mic}</button>
          <button type="button" class="btn primary" data-hz="mem">${half ? 'Done' : 'Memorized'}</button></div>
      </section>`;
    }

    // Murajaʿah: today's portion as one card, rated once.
    let revCard;
    const left = review.filter(p => !day.r.includes(p)), pname = custom ? this.pagesText(review) : this.portionName(pl.reviewJuz, portion);
    if (!review.length) revCard = `<div class="hz-done muted"><span><b>Murajaʿah</b> · starts once you've memorized some pages.</span></div>`;
    else if (!left.length) { const l = this.last(d.pages[review[0]]); revCard = `<div class="hz-done">${tick}<span><b>Murajaʿah</b> · ${esc(pname)}${l ? ` · ${this.QNAME[l[1]]}` : ''}</span><button type="button" class="hz-link" data-hz="pick">More</button><button type="button" class="hz-link" data-hz="undo-rev">Undo</button></div>`; }
    else {
      const oldest = Math.min(...left.map(p => { const l = this.last(d.pages[p]); return l ? l[0] : 0; }));
      revCard = `<section class="hz-card">
        <div class="hz-k">Murajaʿah<button type="button" class="hz-link" data-hz="pick">Choose</button></div>
        <a class="hz-main" href="#page-${left[0]}"><b>${esc(pname)}</b><span>${custom ? `${left.length} page${left.length === 1 ? '' : 's'}${left.length < review.length ? ' left' : ''}` : this.pagesText(left)} · ${oldest ? this.ago(oldest) : 'not revised yet'}</span></a>
        <div class="hz-cta"><button type="button" class="icon-btn" data-hz="test-rev" aria-label="Recite it to check">${mic}</button>
          <span class="hz-rate">${[1, 2, 3].map(q => `<button type="button" class="chip-btn q${q}" data-hz="q${q}">${this.QNAME[q]}</button>`).join('')}</span></div>
      </section>`;
    }

    const juzRows = Array.from({ length: 30 }, (_, j) => {
      const pages = this.juzPages(j + 1), n = pages.filter(isMem).length;
      return `<div class="hz-juz"><button type="button" class="hz-jl" data-juz="${j + 1}"><b>Juz ${j + 1}</b><span>${n}/${pages.length}</span></button>
        <div class="hz-cells">${pages.map(p => { const pg = d.pages[p], l = this.last(pg); const cls = !pg ? '' : pg.s === 'learn' ? 'learn' : l && l[1] === 1 ? 'weak' : 'mem'; return `<button type="button" class="hz-c ${cls}" data-cell="${p}" aria-label="Page ${p}${cls ? ', ' + cls : ''}"></button>`; }).join('')}</div></div>`;
    }).join('');
    const opt = (vals, cur, fmt) => vals.map(v => `<option value="${v}"${+cur === v ? ' selected' : ''}>${fmt(v)}</option>`).join('');
    const pct = (mem.length / 604 * 100).toFixed(1);
    const chev = '<svg class="hz-chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>';
    box.innerHTML = `
      <div class="hz-top">
        <div class="hz-num"><b>${mem.length}</b><span>of 604 pages${mem.length ? ` · ${(mem.length / 20.13).toFixed(1)} juz` : ''}${streak > 1 ? ` · ${streak}-day streak` : ''}</span></div>
        <div class="hz-bar" aria-label="${pct}% of the Quran"><i style="width:${pct}%"></i></div>
      </div>
      <h2 class="lib-h">Today</h2>
      <div class="hz-today">${newCard}${revCard}</div>
      <div class="hz-menu">
        <button type="button" class="hz-mi" data-hz-log><span><b>Log what you know</b><small>Mark surahs, juz or pages in one go</small></span>${chev}</button>
        <details class="hz-mi-d"${store.get('hzPlanOpen', false) ? ' open' : ''} data-key="hzPlanOpen"><summary class="hz-mi"><span><b>Plan</b><small>${pl.newPer === 0.5 ? 'Half a page' : pl.newPer === 1 ? '1 page' : '2 pages'} a day · ${this.JUZ_NAME[pl.reviewJuz].toLowerCase()} murajaʿah</small></span>${chev}</summary>
          <div class="hz-plan">
            <label class="field"><span>New a day</span><select id="hzNew">${opt([0.5, 1, 2], pl.newPer, v => v === 0.5 ? 'Half a page' : v === 1 ? '1 page' : '2 pages')}</select></label>
            <label class="field"><span>Murajaʿah a day</span><select id="hzRev">${opt([0.25, 0.5, 1, 2], pl.reviewJuz, v => this.JUZ_NAME[v])}</select></label>
            <label class="field"><span>Order</span><select id="hzDir"><option value="fwd"${pl.dir === 'fwd' ? ' selected' : ''}>Page 1 → 604</option><option value="back"${pl.dir === 'back' ? ' selected' : ''}>Juz ʿAmma first</option></select></label>
            <label class="field"><span>Next new page</span><input id="hzStart" type="number" min="1" max="604" inputmode="numeric" value="${pl.start}"></label>
          </div></details>
        <details class="hz-mi-d"${store.get('hzMapOpen', false) ? ' open' : ''} data-key="hzMapOpen"><summary class="hz-mi"><span><b>Page map</b><small>Every page at a glance · tap one to change it</small></span>${chev}</summary>
          <div class="hz-legend"><span><i class="hz-c mem"></i>Memorized</span><span><i class="hz-c weak"></i>Weak</span><span><i class="hz-c learn"></i>Learning</span><span><i class="hz-c"></i>Not yet</span></div>
          <div class="hz-map">${juzRows}</div></details>
      </div>`;
  },
  // Logging what you already know in bulk: whole surahs, whole juz or a run of pages,
  // gathered into one selection and marked (or removed) with one tap.
  juzPages(j) {
    this._jp = this._jp || {};
    if (!this._jp[j]) { const a = []; for (let p = 1; p <= 604; p++) if (Q.juzOfPage(p) === j) a.push(p); this._jp[j] = a; }
    return this._jp[j];
  },
  surahPages(n) { const c = Q.ch(n), a = []; for (let p = c.pages[0]; p <= c.pages[1]; p++) a.push(p); return a; },
  sel: { tab: 'surah', s: new Set(), j: new Set(), from: '', to: '', q: '' },
  selPages() {
    const L = this.sel, out = new Set();
    L.s.forEach(n => this.surahPages(n).forEach(p => out.add(p)));
    L.j.forEach(j => this.juzPages(j).forEach(p => out.add(p)));
    const a = Math.round(+L.from), b = L.to === '' ? a : Math.round(+L.to);
    if (a >= 1 && a <= 604 && b >= 1 && b <= 604) for (let p = Math.min(a, b); p <= Math.max(a, b); p++) out.add(p);
    return [...out].sort((x, y) => x - y);
  },
  memCount(pages, d) { return pages.filter(p => d.pages[p] && d.pages[p].s === 'mem').length; },
  // Choosing today's murajaʿah: any portion with memorized pages, or your own page range.
  openPick() {
    const d = this.data(), size = d.plan.reviewJuz, { portion, custom } = this.plan(d), memSet = new Set(this.memorized(d));
    const auto = this.plan(Object.assign({}, d, { days: Object.assign({}, d.days, { [this.today()]: Object.assign({}, d.days[this.today()] || { n: [], r: [] }, { pick: null }) }) })).portion;
    const rows = this.portions(size).map((pages, i) => ({ i, mine: pages.filter(p => memSet.has(p)) })).filter(x => x.mine.length);
    const lastOf = ps => Math.max(0, ...ps.map(p => { const pg = d.pages[p], l = this.last(pg); return l ? l[0] : 0; }));
    const weak = ps => ps.filter(p => { const l = this.last(d.pages[p]); return l && l[1] === 1; }).length;
    $('#hzPickBody').innerHTML = `<ul class="hzl-list">${rows.map(x => { const w = weak(x.mine), on = !custom && x.i === portion;
      return `<li><button type="button" class="hzl-s${on ? ' on' : ''}" data-pi="${x.i}"><span class="hzl-t"><b>${esc(this.portionName(size, x.i))}${x.i === auto ? ' <em class="hzl-tag">Suggested</em>' : ''}</b>
        <small>${this.pagesText(x.mine)} · ${this.ago(lastOf(x.mine))}${w ? ` · ${w} weak` : ''}</small></span><i class="hzl-tick"></i></button></li>`; }).join('')}</ul>
      <h3 class="hzl-h">Or your own pages</h3>
      <div class="hzl-range">
        <label class="field"><span>From page</span><input id="hzpFrom" type="number" min="1" max="604" inputmode="numeric"${custom ? ` value="${this.data().days[this.today()].pick.from}"` : ''}></label>
        <label class="field"><span>To page</span><input id="hzpTo" type="number" min="1" max="604" inputmode="numeric"${custom ? ` value="${this.data().days[this.today()].pick.to}"` : ''}></label>
      </div>
      <div class="hzl-foot"><button type="button" class="hz-link" data-pick="auto">Use the suggestion</button><span class="hzl-sum"></span><button type="button" class="btn primary" data-pick="range">Review these pages</button></div>`;
    if (!$('#hzPickSheet').open) $('#hzPickSheet').showModal();
  },
  setPick(pick) {
    const d = this.data(), day = this.day(d);
    day.pick = pick; this.save(d);
    $('#hzPickSheet').close(); this.render();
  },
  initPick() {
    $('#hzPickSheet').addEventListener('click', e => {
      const r = e.target.closest('[data-pi]');
      if (r) { this.setPick({ size: this.data().plan.reviewJuz, i: +r.dataset.pi }); return; }
      const b = e.target.closest('[data-pick]'); if (!b) return;
      if (b.dataset.pick === 'auto') { this.setPick(null); return; }
      let a = Math.round(+$('#hzpFrom').value), z = Math.round(+$('#hzpTo').value || a);
      if (!(a >= 1 && a <= 604 && z >= 1 && z <= 604)) { toast('Type pages from 1 to 604.', 'warn'); return; }
      if (a > z) [a, z] = [z, a];
      const d = this.data(), has = this.memorized(d).some(p => p >= a && p <= z);
      if (!has) { toast(`None of pages ${a}–${z} are logged as memorized yet.`, 'warn'); return; }
      this.setPick({ from: a, to: z });
    });
  },
  openLog() {
    this.sel = { tab: store.get('hzLogTab', 'surah'), s: new Set(), j: new Set(), from: '', to: '', q: '' };
    this.renderLog();
    if (!$('#hzLogSheet').open) $('#hzLogSheet').showModal();
  },
  renderLog() {
    const L = this.sel, box = $('#hzLogBody');
    const tabs = [['surah', 'Surahs', L.s.size], ['juz', 'Juz', L.j.size], ['pages', 'Pages', L.from !== '' ? 1 : 0]];
    let body = '';
    if (L.tab === 'surah') body = `<div class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input id="hzlSearch" type="search" placeholder="Search surahs" autocomplete="off" value="${esc(L.q)}"></div>
      <ul class="hzl-list" id="hzlSurahs"></ul>`;
    else if (L.tab === 'juz') body = `<div class="hzl-juz" id="hzlJuz"></div>`;
    else body = `<div class="hzl-range">
        <label class="field"><span>From page</span><input id="hzlFrom" type="number" min="1" max="604" inputmode="numeric" placeholder="e.g. 582" value="${esc(String(L.from))}"></label>
        <label class="field"><span>To page</span><input id="hzlTo" type="number" min="1" max="604" inputmode="numeric" placeholder="e.g. 604" value="${esc(String(L.to))}"></label>
      </div><p class="lib-note" id="hzlRangeNote"></p>`;
    box.innerHTML = `<div class="mode-switch" role="tablist">${tabs.map(([id, t, n]) => `<button type="button" class="mode${id === L.tab ? ' active' : ''}" data-hzl-tab="${id}" role="tab">${t}${n ? ` <span class="hzl-badge">${n}</span>` : ''}</button>`).join('')}</div>
      ${body}
      <div class="hzl-foot"><span class="hzl-sum" id="hzlSum"></span>
        <button type="button" class="btn" data-hzl="clear">Remove</button>
        <button type="button" class="btn primary" data-hzl="mark">Mark memorized</button></div>`;
    this.fillLog();
  },
  // Refresh the list, grid and footer without rebuilding the inputs (keeps the keyboard up).
  fillLog() {
    const L = this.sel, d = this.data();
    const ul = $('#hzlSurahs');
    if (ul) {
      const raw = L.q.trim(), q = raw.toLowerCase().replace(/[^a-z0-9]/g, ''), qa = Matcher.normalize(raw);
      const rows = Q.meta.chapters.filter(c => !raw || String(c.n) === raw
        || (q && (c.en.toLowerCase().replace(/[^a-z0-9]/g, '').includes(q) || c.tr.toLowerCase().replace(/[^a-z0-9]/g, '').includes(q)))
        || (qa && Matcher.normalize(c.ar).includes(qa)));
      ul.innerHTML = rows.length ? rows.map(c => {
        const pages = this.surahPages(c.n), m = this.memCount(pages, d), all = m === pages.length;
        const pr = pages.length > 1 ? `pages ${pages[0]}–${pages[pages.length - 1]}` : `page ${pages[0]}`;
        return `<li><button type="button" class="hzl-s${L.s.has(c.n) ? ' on' : ''}" data-s="${c.n}" aria-pressed="${L.s.has(c.n)}">
          <span class="hzl-n">${c.n}</span><span class="hzl-t"><b>${esc(c.en)}</b><small>${pr}${all ? ' · memorized' : m ? ` · ${m} of ${pages.length} memorized` : ''}</small></span>
          <span class="hzl-ar" lang="ar">${esc(c.ar)}</span><i class="hzl-tick${all ? ' full' : ''}"></i></button></li>`;
      }).join('') : '<li class="lib-note">No surah matches.</li>';
    }
    const jg = $('#hzlJuz');
    if (jg) jg.innerHTML = Array.from({ length: 30 }, (_, i) => {
      const j = i + 1, pages = this.juzPages(j), m = this.memCount(pages, d);
      return `<button type="button" class="hzl-j${L.j.has(j) ? ' on' : ''}${m === pages.length ? ' full' : ''}" data-j="${j}" aria-pressed="${L.j.has(j)}"><b>${j}</b><small>${m === pages.length ? '✓' : m ? `${m}/${pages.length}` : ''}</small></button>`;
    }).join('');
    const note = $('#hzlRangeNote');
    if (note) {
      const a = Math.round(+L.from), b = L.to === '' ? a : Math.round(+L.to);
      note.textContent = L.from === '' ? 'Type the first and last page you know, for example 582 to 604 for Juz ʿAmma.'
        : a >= 1 && a <= 604 && b >= 1 && b <= 604 ? `${Math.abs(b - a) + 1} page${a === b ? '' : 's'}: ${this.pageLabel(Math.min(a, b)).split(' · ')[0]} to ${this.pageLabel(Math.max(a, b)).split(' · ')[0]}`
        : 'Pages go from 1 to 604.';
    }
    document.querySelectorAll('#hzLogBody [data-hzl-tab]').forEach(b => {
      const n = { surah: L.s.size, juz: L.j.size, pages: L.from !== '' ? 1 : 0 }[b.dataset.hzlTab];
      let badge = b.querySelector('.hzl-badge');
      if (n && !badge) { badge = document.createElement('span'); badge.className = 'hzl-badge'; b.append(' ', badge); }
      if (badge) { if (n) badge.textContent = n; else badge.remove(); }
    });
    const pages = this.selPages(), m = this.memCount(pages, d), has = pages.filter(p => d.pages[p]).length;
    $('#hzlSum').innerHTML = pages.length ? `<b>${pages.length} page${pages.length === 1 ? '' : 's'}</b>${m === pages.length ? 'already memorized' : m ? `${pages.length - m} new · ${m} already memorized` : 'all new'}` : '<b>Nothing chosen</b>pick what you know';
    const mk = $('#hzLogBody [data-hzl="mark"]'); mk.disabled = !pages.length; mk.hidden = !!pages.length && m === pages.length;
    $('#hzLogBody [data-hzl="clear"]').hidden = !has;
  },
  applyLog(mark) {
    const pages = this.selPages(); if (!pages.length) return;
    const d = this.data(), now = Date.now(); let n = 0;
    pages.forEach(p => {
      const pg = d.pages[p];
      if (mark) { if (!pg || pg.s !== 'mem') { d.pages[p] = Object.assign({ r: [] }, pg || {}, { s: 'mem', t: now, m: now - 7 * 864e5 }); delete d.pages[p].h; n++; } }
      else if (pg) { delete d.pages[p]; n++; }
    });
    if (!mark) Object.values(d.days).forEach(day => { day.n = day.n.filter(p => d.pages[p]); day.r = day.r.filter(p => d.pages[p]); });
    this.save(d);
    $('#hzLogSheet').close();
    toast(mark ? `${n} page${n === 1 ? '' : 's'} logged as memorized. They join your murajaʿah.` : `${n} page${n === 1 ? '' : 's'} removed from your hifz.`);
    this.render();
  },
  initLog() {
    const sh = $('#hzLogSheet');
    sh.addEventListener('click', e => {
      const L = this.sel, t = e.target;
      const tab = t.closest('[data-hzl-tab]');
      if (tab) { L.tab = tab.dataset.hzlTab; store.set('hzLogTab', L.tab); this.renderLog(); return; }
      const s = t.closest('[data-s]'); if (s) { const n = +s.dataset.s; L.s.has(n) ? L.s.delete(n) : L.s.add(n); this.fillLog(); return; }
      const j = t.closest('[data-j]'); if (j) { const n = +j.dataset.j; L.j.has(n) ? L.j.delete(n) : L.j.add(n); this.fillLog(); return; }
      const a = t.closest('[data-hzl]'); if (a) this.applyLog(a.dataset.hzl === 'mark');
    });
    sh.addEventListener('input', e => {
      const L = this.sel, t = e.target;
      if (t.id === 'hzlSearch') L.q = t.value;
      else if (t.id === 'hzlFrom') L.from = t.value;
      else if (t.id === 'hzlTo') L.to = t.value;
      else return;
      this.fillLog();
    });
  },
  // Recite to check: from the first page's first word, stopping after the last page.
  // A murajaʿah test also saves the rating for those pages.
  async test(pages, save) {
    const p = pages[0], last = pages[pages.length - 1];
    location.hash = 'page-' + p;
    try { const d = await Q.pageReady(p); const w = d.words[0]; setTimeout(() => rec.start(w.s, w.a, { scope: 'open', pos: w.pos, lastPage: last, hifz: save ? pages : null }), 700); } catch (_) {}
  },
  markNew(p) {
    this.set(p, 'mem');
    const d = this.data();
    if (d.plan.start === p) { d.plan.start = Math.max(1, Math.min(604, p + (d.plan.dir === 'back' ? -1 : 1))); this.save(d); }
  },
  init() {
    this.initLog(); this.initPick();
    $('#hifz').addEventListener('toggle', e => { const k = e.target.dataset && e.target.dataset.key; if (k) store.set(k, e.target.open); }, true);
    $('#hifz').addEventListener('click', e => {
      if (e.target.closest('[data-hz-log]')) { this.openLog(); return; }
      const cell = e.target.closest('[data-cell]');
      if (cell) {   // not yet → learning → memorized → not yet
        const p = +cell.dataset.cell, d = this.data(), cur = d.pages[p] && d.pages[p].s;
        this.set(p, !cur ? 'learn' : cur === 'learn' ? 'mem' : null);
        toast(`Page ${p}: ${!cur ? 'learning' : cur === 'learn' ? 'memorized' : 'cleared'}`);
        this.render(); return;
      }
      const jz = e.target.closest('[data-juz]');
      if (jz) {
        const j = +jz.dataset.juz, d = this.data(), pages = this.juzPages(j);
        const all = pages.every(p => d.pages[p] && d.pages[p].s === 'mem');
        pages.forEach(p => { if (all) delete d.pages[p]; else if (!d.pages[p] || d.pages[p].s !== 'mem') d.pages[p] = { s: 'mem', t: Date.now(), m: Date.now() - 7 * 864e5, r: [] }; });
        this.save(d); toast(all ? `Juz ${j} cleared` : `Juz ${j} marked memorized`); this.render(); return;
      }
      const b = e.target.closest('[data-hz]'); if (!b) return;
      const act = b.dataset.hz, d = this.data(), { fresh, review, day } = this.plan(d);
      const isMem = p => !!(d.pages[p] && d.pages[p].s === 'mem');
      const todo = fresh.filter(p => !isMem(p)), left = review.filter(p => !day.r.includes(p));
      if (act === 'pick') { this.openPick(); return; }
      if (act === 'test-new') { if (todo.length) this.test(todo, false); return; }
      if (act === 'test-rev') { if (left.length) this.test(left, true); return; }
      if (act === 'pg') { const p = +b.dataset.p; if (isMem(p)) this.set(p, 'learn'); else this.markNew(p); this.render(); return; }
      if (act === 'mem') {
        if (!todo.length) return;
        // Half a page a day: the first tap is the first half; the page is memorized with the second.
        if (d.plan.newPer === 0.5 && !(d.pages[todo[0]] && d.pages[todo[0]].h)) {
          const p = todo[0];
          d.pages[p] = Object.assign({ t: Date.now(), r: [] }, d.pages[p] || {}, { s: 'learn', h: 1 });
          this.day(d).h = 1; this.save(d);
          toast(`First half of page ${p} done. The second half is next.`); this.render(); return;
        }
        const ps = d.plan.newPer === 0.5 ? [todo[0]] : todo;
        ps.forEach(p => this.markNew(p));
        toast(`${this.pagesText(ps)} memorized. ${ps.length === 1 ? 'It joins' : 'They join'} your murajaʿah.`); this.render(); return;
      }
      if (act === 'undo-new') { day.n.slice().forEach(p => this.set(p, 'learn')); this.render(); return; }
      if (act === 'undo-rev') {
        const d2 = this.data(), dy = this.day(d2), t0 = new Date(); t0.setHours(0, 0, 0, 0);
        dy.r.forEach(p => { const pg = d2.pages[p]; if (pg && pg.r) pg.r = pg.r.filter(x => x[0] < t0.getTime()); });
        dy.r = []; this.save(d2); this.render(); return;
      }
      if (act[0] === 'q') {
        const q = +act[1]; left.forEach(p => this.review(p, q));
        toast(`Murajaʿah saved · ${this.QNAME[q]}`); this.render();
      }
    });
    $('#hifz').addEventListener('change', e => {
      const d = this.data(), t = e.target;
      if (t.id === 'hzNew') d.plan.newPer = +t.value;
      else if (t.id === 'hzRev') d.plan.reviewJuz = +t.value;
      else if (t.id === 'hzDir') { d.plan.dir = t.value; d.plan.start = t.value === 'back' ? 582 : 1; }
      else if (t.id === 'hzStart') d.plan.start = Math.max(1, Math.min(604, +t.value || 1));
      else return;
      this.save(d); this.render();
    });
  },
};

/* Keep the screen on the whole time the mushaf, the text view or a book is open, and while a
   recitation plays or you recite. The lock is let go as soon as you leave reading or the app
   goes to the background, and nothing runs on a timer; downloads wait while the battery is
   low and the phone isn't charging. */
const awake = {
  lock: null, battery: null,
  lowBattery() { const b = this.battery; return !!(b && !b.charging && b.level <= 0.2); },
  reading() { return ['mushaf', 'surah', 'pdf'].includes(state.view) || (state.view === 'library' && !!document.querySelector('#library .arb')); },
  wanted() {
    if (document.visibilityState !== 'visible') return false;
    if ((player.playing) || rec.active) return true;               // listening or reciting
    return settings.keepAwake !== false && this.reading();
  },
  async check() {
    if (this.busy) { this.again = true; return; }
    this.busy = true;
    try {
      const want = this.wanted();
      if (want && !this.lock && navigator.wakeLock) {
        try { const l = await navigator.wakeLock.request('screen'); this.lock = l; l.addEventListener('release', () => { if (this.lock === l) this.lock = null; }); } catch (_) { this.lock = null; }
      } else if (!want && this.lock) { const l = this.lock; this.lock = null; try { await l.release(); } catch (_) {} }
    } finally { this.busy = false; }
    if (this.again) { this.again = false; this.check(); }
  },
  touch() { if (!this.lock && this.wanted()) this.check(); },
  init() {
    // The phone drops the lock on its own sometimes (e.g. after the app was in the background): take it again on the next touch.
    document.addEventListener('pointerdown', () => this.touch(), { passive: true, capture: true });
    document.addEventListener('visibilitychange', () => this.check());
    if (navigator.getBattery) navigator.getBattery().then(b => { this.battery = b; const f = () => this.check(); b.addEventListener('levelchange', f); b.addEventListener('chargingchange', f); }).catch(() => {});
  },
};

/* Keep everything on this phone: when online, quietly download all the app's data (Quran,
   tajweed fonts, translation, tafsir, hadith, Arabic books, speech model) and the whole Quran
   in the chosen reciter's voice, so all of it works offline. Already-saved files are skipped. */
const offline = {
  running: false, stopReq: false, stat: { app: [0, 0], fonts: [0, 0], extras: [0, 0], audio: [0, 0], reciter: '' },
  on() { return settings.offlineAll === true; },
  // Surahs of the current reciter fully on this phone.
  doneSet() { return new Set(store.get('dl:' + settings.reciter, [])); },
  markDone(s) { const d = this.doneSet(); d.add(s); store.set('dl:' + settings.reciter, [...d]); },
  busy: new Map(),
  surahBtn(n, got) {
    const st = this.busy.get(n), done = got.has(n);
    return `<button type="button" class="icon-btn sdl${done ? ' done' : ''}${st != null ? ' busy' : ''}" data-dl="${n}" aria-label="${done ? 'Recitation saved for offline' : 'Download recitation for offline'}">${st != null ? `<span class="sdl-pc">${st}%</span>` : done ? '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/></svg>'}</button>`;
  },
  paintSurah(n) { const b = document.querySelector(`[data-dl="${n}"]`); if (b) b.outerHTML = this.surahBtn(n, this.doneSet()); },
  async surahUrls(r, s) {
    const tm = timedFor(r, s);
    if (tm) { const t = await getTimings(tm, s); return [t.url || `${tm.base}${pad3(s)}.mp3`]; }
    return Array.from({ length: Q.ch(s).ayahs }, (_, i) => `${AUDIO_BASE}/${r.id}/${pad3(s)}${pad3(i + 1)}.mp3`);
  },
  // Download one surah in the chosen reciter's voice.
  async downloadSurah(s) {
    if (this.busy.has(s)) return;
    const r = currentReciter();
    if (r.missing && r.missing.includes(s)) { toast(`${r.name} has no recording of ${Q.ch(s).en}.`, 'bad'); return; }
    if (!navigator.onLine) { toast('Connect to the internet to download.', 'bad'); return; }
    this.busy.set(s, 0); this.paintSurah(s);
    let ok = 0, urls = [];
    try { urls = await this.surahUrls(r, s); } catch (_) {}
    let i = 0;
    const work = async () => { while (i < urls.length) { const u = urls[i++]; try { if (!(await this.has(u))) await this.get(u); ok++; } catch (_) {} this.busy.set(s, Math.round(ok / urls.length * 100)); this.paintSurah(s); } };
    await Promise.all(Array.from({ length: urls.length > 1 ? 4 : 1 }, work));
    this.busy.delete(s);
    if (urls.length && ok === urls.length) { this.markDone(s); toast(`${Q.ch(s).en} saved for offline (${r.name}).`); }
    else toast(`${Q.ch(s).en} didn\u2019t fully download. Try again.`, 'bad');
    this.paintSurah(s);
  },
  async downloadAll() {
    const r = currentReciter(), todo = [];
    for (let s = 1; s <= 114; s++) if (!(r.missing && r.missing.includes(s)) && !this.doneSet().has(s)) todo.push(s);
    for (const s of todo) { if (!navigator.onLine) break; await this.downloadSurah(s); }
  },
  allowed() {
    const c = navigator.connection;
    if (!navigator.onLine) return false;
    if (c && c.saveData) return false;                                     // the phone's data saver
    if (awake.lowBattery()) return false;                                  // low battery, not charging
    if (this.on() && c && c.type === 'cellular' && !settings.offlineCellular && this.stat.app[0] >= this.stat.app[1]) return false;
    return true;
  },
  async has(url) { try { return !!(await caches.match(url, { ignoreSearch: !/^https?:/.test(url) })); } catch (_) { return false; } },
  async get(url, opts) { const r = await fetch(url, opts); if (!(r.ok || r.type === 'opaque')) throw new Error(r.status); await r.arrayBuffer(); },
  // Run fetches a few at a time, skipping what's saved; stops when asked or when offline.
  async pool(urls, key, n = 3, opts) {
    const st = this.stat[key]; st[0] = 0; st[1] = urls.length; let i = 0;
    const missed = [];
    const work = async () => {
      while (i < urls.length && !this.stopReq) {
        if (!this.allowed()) { this.stopReq = true; break; }
        const u = urls[i++];
        try {
          if (!(await this.has(u))) {
            await this.get(u, opts);
            // Saved? If the phone is out of space, stop and say so.
            // (the saving finishes a moment after the file arrives)
            let saved = false;
            for (const ms of [200, 800, 2500]) { await new Promise(r => setTimeout(r, ms)); if ((saved = await this.has(u))) break; }
            if (!saved) {
              missed.push(u);
              // Several in a row not saved: stop only if the phone really is out of space.
              if (++this.misses >= 3 && navigator.storage && navigator.storage.estimate) {
                try { const e = await navigator.storage.estimate(); if (e.quota && e.usage / e.quota > 0.92) { this.full = true; this.stopReq = true; } } catch (_) {}
                this.misses = 0;
              }
              continue;
            }
          }
          this.misses = 0; st[0]++;
        } catch (_) {}
        if (st[0] % 20 === 0) this.render();
      }
    };
    await Promise.all(Array.from({ length: n }, work));
    // One more try for files that didn't save the first time.
    if (missed.length && !this.stopReq) for (const u of missed) {
      if (this.stopReq || !this.allowed()) break;
      try { await this.get(u, opts); await new Promise(r => setTimeout(r, 1500)); if (await this.has(u)) st[0]++; } catch (_) {}
    }
    this.render();
  },
  audioUrls: async function (r) {
    const urls = [];
    for (let s = 1; s <= 114; s++) {
      if (r.missing && r.missing.includes(s)) continue;
      const tm = timedFor(r, s);
      if (tm) { try { const t = await getTimings(tm, s); urls.push(t.url || `${tm.base}${pad3(s)}.mp3`); } catch (_) {} }
      else for (let a = 1; a <= Q.ch(s).ayahs; a++) urls.push(`${AUDIO_BASE}/${r.id}/${pad3(s)}${pad3(a)}.mp3`);
      if (this.stopReq) break;
    }
    return urls;
  },
  async run() {
    if (this.running || !navigator.onLine || (navigator.connection && navigator.connection.saveData) || awake.lowBattery()) return;
    this.running = true; this.stopReq = false; this.full = false; this.misses = 0; this.render();
    try {
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      await Q.load();
      const list = (await (await fetch('offline-files.json')).json()).map(x => x[0]);
      // Always: what reading needs (Quran pages and text, translation, tafsir, timings).
      const core = list.filter(u => /^(mushaf|data|fonts)\//.test(u));
      await this.pool(core, 'app', 4);
      if (settings.tajweed && !this.stopReq) await this.pool(Array.from({ length: 604 }, (_, i) => TAJWEED_FONT(i + 1)), 'fonts', 4);
      // Only with "Keep everything": hadith, Arabic books, speech model, and all recitations.
      if (this.on() && !this.stopReq) {
        await this.pool(list.filter(u => !core.includes(u)), 'extras', 4);
        const r = currentReciter(); this.stat.reciter = r.name + (r.style ? ' · ' + r.style : '');
        if (!this.stopReq) await this.downloadAll();
      }
    } catch (_) {}
    this.running = false; this.render();
  },
  restart() { this.stopReq = true; const go = () => { if (this.running) setTimeout(go, 500); else this.run(); }; setTimeout(go, 300); },
  render() {
    const el = $('#offlineStatus'); if (!el) return;
    const pc = ([a, b]) => b ? Math.round(a / b * 100) : 0, st = this.stat;
    const parts = [`Quran for reading ${pc(st.app)}%`];
    if (settings.tajweed) parts.push(`tajweed colours ${pc(st.fonts)}%`);
    const done = this.doneSet().size;
    parts.push(`${currentReciter().name}: ${done} of 114 surahs saved`);
    if (this.on()) parts.push(`hadith, books and speech model ${pc(st.extras)}%`);
    el.textContent = (this.full ? 'Stopped: this phone is out of space. ' : this.running ? 'Downloading… ' : navigator.onLine ? '' : 'Paused (offline). ') + parts.join(' · ');
  },
};
window.addEventListener('online', () => setTimeout(() => offline.run(), 2000));
awake.init();
hifz.init();
setTimeout(() => offline.run(), 15000);   // after the app has settled

function applySettings() {
  document.documentElement.classList.toggle('tajweed-on', !!settings.tajweed);
  document.documentElement.style.setProperty('--quran-size', settings.fontSize + 'px');
  document.querySelectorAll('#readMode .mode').forEach(b => {
    const on = b.dataset.read === settings.readMode;
    b.classList.toggle('active', on); b.setAttribute('aria-checked', on);
  });
  updateControls();
}
function saveSettings() { store.set('settings', settings); applySettings(); }

/* ------------------------------------------------------------------ */
/*  Word highlighting shared by the mushaf and the text view           */
/* ------------------------------------------------------------------ */

// id -> {w, els[]} for every word on screen; ayah key -> end-marker elements.
const wordEls = new Map();
const endEls = new Map();
const peeks = new Set();
function resetWordEls() { wordEls.clear(); endEls.clear(); }
function registerWord(w, el) {
  const r = wordEls.get(w.id);
  if (r) r.els.push(el); else wordEls.set(w.id, { w, els: [el] });
}
function registerEnd(x, el) {
  const k = `${x.s}:${x.a}`;
  if (!endEls.has(k)) endEls.set(k, []);
  endEls.get(k).push(el);
}

function wordClass(w) {
  const key = `${w.s}:${w.a}`;
  let c = 'w';
  const st = rec.status.get(w.id);
  if (st) c += ' ' + st;
  else if (settings.hide && !peeks.has(w.id) && (state.view === 'mushaf' || state.view === 'surah') && memHidden(w)) c += ' hidden';
  if (rec.active && rec.nextId === w.id) c += ' next';
  if (player.playing && player.key() === key && !(settings.followWords && wordFollow.available())) c += ' playing';
  if (wordFollow.id === w.id) c += ' reading';
  if (state.selected === key) c += ' selected';
  const hl = highlights()[key];
  if (hl) c += ' hl-' + hl;
  return c;
}
// Memorization mode: every word is hidden until it has been recited, except the words
// before the place the recitation started (they stay as context).
function memHidden(w) {
  if (!rec.active || rec.auto || !rec.from) return true;
  return rec.inScope(w) !== 0;
}
// Word-by-word follow-along while a reciter plays. Each ayah's time is shared among its
// words in proportion to how long they take to say (sounds; a madd by its counts; a held
// ghunnah longer), from the reference phonemes.
const wordFollow = {
  id: null, line: null, fr: new Map(), raf: 0,
  fractions(s, a) {
    const k = `${s}:${a}`;
    if (this.fr.has(k)) return this.fr.get(k);
    if (!TajweedData.ready) { TajweedData.load().catch(() => {}); return null; }
    const un = Tajweed.units(), w = [];
    for (let pos = 1; ; pos++) {
      const W = Tajweed.word(s, a, pos); if (!W) break;
      w.push(W.wasl.reduce((t, id) => { const u = un[id]; return t + (!u ? 1 : u.madd ? u.madd / 2 : u.ghunnah ? 1.5 : 1); }, 0) + 0.3);
    }
    const tot = w.reduce((x, y) => x + y, 0), cum = [0];
    w.forEach(x => cum.push(cum[cum.length - 1] + x / tot));
    this.fr.set(k, cum);
    return cum;
  },
  set(id) {
    if (this.line && !this.line.isConnected) { this.line = null; this.id = null; }   // the page was redrawn
    if (id === this.id) return;
    const old = this.id && wordEls.get(this.id);
    if (old) old.els.forEach(el => el.classList.remove('reading'));
    this.id = id;
    const now = id && wordEls.get(id);
    const line = now && now.els[0] && now.els[0].closest('.mline');
    if (now) now.els.forEach(el => el.classList.add('reading'));
    if (line !== this.line) { if (this.line) this.line.classList.remove('reading-line'); if (line) line.classList.add('reading-line'); this.line = line; }
  },
  tick() {
    this.raf = 0;
    const p = player, el = p.audio;
    if (!settings.followWords || !p.playing || p.gi < 0 || p.inBism || !['mushaf', 'surah'].includes(state.view) || !wordFollow.available()) { this.set(null); if (p.playing) this.raf = requestAnimationFrame(() => this.tick()); return; }
    const [s, a] = Q.all[p.gi];
    const segs = p.words && p.words[a], t = el.currentTime;
    // The word whose time holds now (a reciter going back over words follows them too).
    let pos = null;
    if (segs) for (const [w, b, e] of segs) if (t >= b - 0.05 && t < e + 0.05) pos = w;
    if (pos == null && segs && segs.length && t >= segs[0][1]) { for (const [w, b] of segs) if (b <= t) pos = w; }
    this.set(pos ? `${s}:${a}:${pos}` : null);
    this.raf = requestAnimationFrame(() => this.tick());
  },
  start() { if (!this.raf) this.raf = requestAnimationFrame(() => this.tick()); },
  // Only for reciters with measured word timings (estimates were right only ~45% of the time).
  available() { return !!(currentReciter().words && player.words); },
};
function paintWords() {
  wordEls.forEach(({ w, els }) => { const c = wordClass(w); els.forEach(el => { if (el.className !== c) el.className = c; }); });
  const hls = highlights();
  endEls.forEach((els, k) => {
    const on = (player.playing && player.key() === k) || state.selected === k;
    els.forEach(el => { el.classList.toggle('lit', on); el.dataset.hl = hls[k] || ''; });
  });
  document.querySelectorAll('#ayahs .ayah').forEach(art => { art.dataset.hl = hls[`${state.surahNum}:${art.dataset.a}`] || ''; });
  if (state.view === 'surah') surahView.paintScores();
}

// Bring an ayah into view in whichever reader is open.
function follow(s, a) {
  if (state.view === 'surah' && state.surahNum === s) surahView.scrollTo(a);
  else if (state.view === 'mushaf') {
    const p = Q.ayahPage(s, a);
    if (p !== mushaf.page) mushaf.show(p, p > mushaf.page ? 'next' : 'prev');
  }
}

/* ------------------------------------------------------------------ */
/*  Views and routing                                                  */
/* ------------------------------------------------------------------ */

function showView(name) {
  // Recitation keeps playing on every screen (a small player shows); the mic stops.
  if (state.view !== name) rec.stop(false);
  state.view = name;
  ['list', 'surah', 'library', 'qibla', 'saved', 'hifz'].forEach(v => { $('#view-' + v).hidden = v !== name; });
  $('#reader').hidden = name !== 'mushaf';
  $('#pdfReader').hidden = name !== 'pdf';
  if (name !== 'pdf') pdfReader.close();
  if ($('#arbBar')) $('#arbBar').hidden = true;
  $('.app').classList.toggle('immersive', name === 'mushaf' || name === 'pdf');
  $('#backBtn').hidden = name !== 'surah';
  $('#toMushafBtn').hidden = name !== 'surah';
  const tab = ['surah', 'list', 'mushaf'].includes(name) ? 'quran' : name === 'pdf' ? 'library' : name;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  if (name !== 'mushaf' && name !== 'surah') resetWordEls();
  if (name === 'list') { setTitle('Quran', 'Madinah Mushaf · 114 surahs'); renderContinue(); renderSavedHome(); install.card(); }
  if (name === 'saved') { setTitle('Saved', 'Bookmarks, highlights and notes'); saved.render(); }
  if (name === 'hifz') { setTitle('Hifz', 'Memorization and murajaʿah'); hifz.render(); }
  if (name === 'qibla') { setTitle('Qibla', 'Direction of the Kaaba'); qibla.init(); }
  updateControls();
}
function setTitle(t, sub) { $('#viewTitle').textContent = t; $('#viewSub').textContent = sub || ''; document.title = t === 'Quran' ? APP_NAME : `${t} · ${APP_NAME}`; }

// In-app history, so Back returns to the screen you came from.
const navStack = [];
function goBack(fallback) {
  if (navStack.length > 1) history.back();
  else location.hash = fallback;
}

// Warm up the speech model when a reader opens, if it's already on the phone (no download
// unasked), so the first tap on the mic starts listening straight away.
let warmed = false;
function warmSpeech() {
  if (warmed || !window.QuranSpeech || !QuranSpeech.supported() || settings.engine === 'browser' || !('caches' in window)) return;
  warmed = true;
  const go = () => caches.match('models/quran-phoneme/model.int8.onnx', { ignoreSearch: true }).then(hit => { if (hit) QuranSpeech.preload(); else warmed = false; }).catch(() => { warmed = false; });
  (window.requestIdleCallback || (f => setTimeout(f, 2500)))(go, { timeout: 4000 });
}

async function route() {
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  const h = decodeURIComponent(location.hash.slice(1)) || 'quran';
  if (lectures.cur && !/^lec-[a-z0-9-]+-\d+$/.test(h)) lectures.stop();
  if (navStack.length > 1 && navStack[navStack.length - 2] === h) navStack.pop();
  else if (navStack[navStack.length - 1] !== h) navStack.push(h);
  let m;
  if ((m = h.match(/^surah-(\d+)(?:-(\d+))?$/))) { openSurah(+m[1], m[2] ? +m[2] : null); warmSpeech(); return; }
  if ((m = h.match(/^page-(\d+)$/))) { openMushaf(+m[1]); warmSpeech(); return; }
  if (h === 'mushaf') { openMushaf(store.get('mushafPage', 1)); warmSpeech(); return; }
  if ((m = h.match(/^hadith-([a-z0-9_]+)(?:-(\d+)(?:-(\d+))?)?$/))) { openLibrary(m[1], m[2] ? +m[2] : null, m[3] ? +m[3] : null); return; }
  if (h === 'inbox') { fileSharedBook(); return; }
  if ((m = h.match(/^ar-([a-z-]+?)(?:-(\d+)(?:-b(\d+))?)?$/))) { arReader.open(m[1], m[2] != null ? +m[2] : null, m[3] != null ? +m[3] : null); return; }
  if ((m = h.match(/^lec-([a-z0-9-]+?)(?:-(\d+))?$/))) { if (m[2]) lectures.watch(m[1], +m[2]); else lectures.page(m[1]); return; }
  if (h === 'lectures') { store.set('libTab', 'lectures'); location.replace('#library'); return; }
  if ((m = h.match(/^book-([a-z0-9-]+)$/))) { openBook(m[1]); return; }
  if ((m = h.match(/^read-([a-z0-9-]+?)-(\d+)(?:-p(\d+))?(?:-n(\d+))?$/))) { pdfReader.open(m[1], +m[2], { page: m[3] ? +m[3] : null, note: m[4] ? +m[4] : null }); return; }
  if (h === 'saved') { showView('saved'); scrollTop(); return; }
  if (h === 'hifz') { showView('hifz'); scrollTop(); return; }
  if (h === 'library') { openLibrary(); scrollTop(); return; }
  if (h === 'qibla') showView('qibla');
  else showView('list');
  scrollTop();
}

/* ------------------------------------------------------------------ */
/*  Surah list                                                         */
/* ------------------------------------------------------------------ */

async function initList() {
  try { await Q.load(); }
  catch (_) { $('#surahList').innerHTML = '<li class="empty">Could not load the Quran data. Reload the page to try again.</li>'; return; }
  Q.font('B').then(renderSurahList).catch(() => {});
  renderSurahList();
  renderContinue(); renderSavedHome();
}

function surahNameGlyph(n) { return String.fromCodePoint(0xF100 + n - 1); }

function renderSurahList() {
  if (!Q.meta) return;
  const raw = $('#surahSearch').value.trim();
  const q = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  const qa = Matcher.normalize(raw);
  const glyphs = Q.fonts.has('B');
  const rows = Q.meta.chapters.filter(c => !raw
    || String(c.n) === raw
    || (q && (c.en.toLowerCase().replace(/[^a-z0-9]/g, '').includes(q) || c.tr.toLowerCase().replace(/[^a-z0-9]/g, '').includes(q)))
    || (qa && Matcher.normalize(c.ar).includes(qa)));
  const got = offline.doneSet();
  $('#surahList').innerHTML = rows.length ? rows.map(c => `
    <li class="surah-li"><button class="surah-row" data-n="${c.n}">
      <span class="star">${c.n}</span>
      <span class="info"><b>${esc(c.en)}</b><span>${esc(c.tr)} · ${c.ayahs} ayahs</span></span>
      ${glyphs ? `<span class="sname" aria-label="${esc(c.ar)}">${surahNameGlyph(c.n)}</span>` : `<span class="arabic" lang="ar">${esc(c.ar)}</span>`}
    </button>${offline.surahBtn(c.n, got)}</li>`).join('') : '<li class="empty">No surah matches that search.</li>';
}

function renderContinue() {
  if (!Q.meta) return;
  const p = store.get('mushafPage', null);
  const last = store.get('lastRead', null);
  let html = '';
  if (!p && !last) html = `<a class="continue" href="#page-1"><span><small>Start reading</small><b>Al-Fatihah · Page 1</b></span><span class="cont-meta">Juz 1</span></a>`;
  const n = Q.meta ? savedItems().length : 0;
  const sc = $('#qaSavedSub'); if (sc) sc.textContent = n ? `${n} saved` : 'Bookmarks & notes';
  if (p) {
    const c = Q.surahsOnPage(p)[0];
    html += `<a class="continue" href="#page-${p}"><span><small>Continue in the mushaf</small><b>Page ${p} · ${esc(c ? c.en : '')}</b></span><span class="cont-meta">Juz ${Q.juzOfPage(p)}</span></a>`;
  }
  if (last && Q.meta.chapters[last.n - 1]) {
    const c = Q.ch(last.n);
    html += `<a class="continue alt" href="#surah-${c.n}-${last.a}"><span><small>Continue in text view</small><b>${esc(c.en)} · Ayah ${last.a}</b></span></a>`;
  }
  $('#continueCard').innerHTML = html;
}

/* ------------------------------------------------------------------ */
/*  Mushaf reader (page by page)                                       */
/* ------------------------------------------------------------------ */

function openMushaf(p) {
  showView('mushaf');
  mushaf.setChrome(true);
  Q.load().then(() => mushaf.show(Math.min(604, Math.max(1, p || 1))))
    .catch(() => { const st = $('#pageStatus'); st.hidden = false; st.textContent = 'Could not load the Quran data. Reload the page to try again.'; });
}

// Mushaf size: 1 = the printed page; larger sizes reflow the words into more lines.
function setMushafZoom(z, quiet) {
  z = Math.round(Math.min(2, Math.max(1, z)) * 4) / 4;
  if (z === (Number(settings.mushafZoom) || 1)) return;
  const wasZoomed = (Number(settings.mushafZoom) || 1) > 1.01;
  settings.mushafZoom = z; saveSettings();
  if ($('#setZoom')) $('#setZoom').value = z;
  if (state.view !== 'mushaf') return;
  const pg = $('#pageStage .mpage');
  if (pg && wasZoomed === z > 1.01) Q.page(mushaf.page).then(d => mushaf.fit(pg, d));
  else mushaf.show(mushaf.page);
  if (!quiet) { let h = $('#zoomHint'); if (!h) { h = document.createElement('div'); h.id = 'zoomHint'; h.className = 'zoom-hint'; document.body.append(h); } h.textContent = z === 1 ? 'Full page' : Math.round(z * 100) + '%'; h.hidden = false; clearTimeout(h.t); h.t = setTimeout(() => { h.hidden = true; }, 900); }
}

const mushaf = {
  page: 1, token: 0, chrome: true,

  async show(p, dir) {
    p = Math.min(604, Math.max(1, p));
    const t = ++this.token;
    const status = $('#pageStatus');
    const slow = setTimeout(() => { if (t === this.token) { status.hidden = false; status.innerHTML = '<span class="spinner" aria-hidden="true"></span>Loading page…'; } }, 150);
    let d;
    try { d = await Q.pageReady(p); }
    catch (_) {
      clearTimeout(slow);
      if (t !== this.token) return;
      status.hidden = false;
      status.innerHTML = '<p>This page could not load. Check your connection and try again.</p>';
      return;
    }
    clearTimeout(slow);
    if (t !== this.token) return;
    status.hidden = true;
    this.page = p;
    if (state.selected && !d.words.some(w => `${w.s}:${w.a}` === state.selected)) this.select(null);
    this.render(d, dir);
    if ($('#pageStage').classList.contains('scroll') && !this.keepScroll) $('#pageStage').scrollTop = 0;
    store.set('mushafPage', p);
    this.updateBars(d);
    if (pendingSelect) { const k = pendingSelect; pendingSelect = null; if (d.words.some(w => `${w.s}:${w.a}` === k)) this.select(k); }
    [p + 1, p - 1, p + 2].forEach(n => { if (n >= 1 && n <= 604) Q.pageReady(n).catch(() => {}); });
  },

  render(d, dir) {
    const stage = $('#pageStage');
    const old = stage.querySelector('.mpage');
    resetWordEls();
    const page = document.createElement('div');
    // Zoomed in: the page's words flow into more, shorter lines at a larger size.
    const zoomed = (Number(settings.mushafZoom) || 1) > 1.01;
    page.className = 'mpage' + (d.p <= 2 ? ' opening' : '') + (zoomed ? ' reflow' : '');
    page.dir = 'rtl';
    const surahs = Q.surahsOnPage(d.p);
    const juz = Q.juzOfPage(d.p);
    page.innerHTML = `
      <div class="mhead">
        <span>${esc(surahs.length > 2 ? 'سورة ' + surahs[0].ar + ' – ' + surahs[surahs.length - 1].ar : surahs.map(c => 'سورة ' + c.ar).join(' · '))}</span>
        <span>الجزء ${arDigits(juz)}</span>
      </div>
      <div class="mbody"></div>
      <div class="mfoot">${arDigits(d.p)}</div>`;
    const body = page.querySelector('.mbody');
    d.lines.forEach(line => {
      const row = document.createElement('div');
      const kind = line.length && line[0].t === 'h' ? 'hl' : line.length && line[0].t === 'b' ? 'bl' : 'tl';
      row.className = 'mline ' + kind;
      if (zoomed && kind === 'tl' && !line.length) return;
      line.forEach(x => {
        const sp = document.createElement('span');
        sp.textContent = x.g;
        sp.style.fontFamily = Q.fam(x.fid);
        if (x.t === 'w') { sp.dataset.s = x.s; sp.dataset.a = x.a; registerWord(x, sp); }
        else if (x.t === 'e') { sp.className = 'end'; sp.dataset.s = x.s; sp.dataset.a = x.a; registerEnd(x, sp); }
        else if (x.t === 'b') { const svg = Q.bismSVG(x); if (svg) { row.append(svg); return; } }
        else if (x.t === 'h') { sp.className = 'sh'; const fr = document.createElement('span'); fr.className = 'sh-frame'; fr.append(sp); row.append(fr); return; }
        row.append(sp);
        if (zoomed && kind === 'tl') row.append(' ');
      });
      if (zoomed && kind === 'tl') row.append(' ');
      body.append(row);
    });
    if (old) old.remove();
    stage.append(page);
    this.fit(page, d);
    paintWords();
    if (dir) { page.classList.add(dir === 'next' ? 'from-next' : 'from-prev'); }
  },

  // Size the page to the screen and scale the type so each line spans the full width.
  fit(page, d) {
    const stage = $('#pageStage');
    const cs = getComputedStyle(stage);
    const w = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const h = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const ratio = 0.66;
    // Phones held sideways: the page fills the width and scrolls, like a printed page held close.
    const sideways = stage.clientWidth > stage.clientHeight * 1.05 && stage.clientHeight < 700;
    const zoom = Math.min(2, Number(settings.mushafZoom) || 1);
    const reflow = page.classList.contains('reflow');
    stage.classList.toggle('scroll', sideways || reflow);
    let pw, ph;
    if (sideways || reflow) { pw = Math.floor(Math.min(w, sideways ? 720 : 760)); ph = Math.floor(pw / ratio); }
    else { pw = Math.floor(Math.min(w, h * ratio)); ph = Math.floor(Math.min(h, pw / ratio)); }
    page.style.width = pw + 'px';
    page.style.height = ph + 'px';
    const body = page.querySelector('.mbody');
    // Always measure on the printed 15-line layout, so every size is a multiple of 100%.
    if (reflow) page.classList.remove('reflow');
    const lineH = body.clientHeight / 15;
    body.style.setProperty('--line-h', lineH + 'px');
    // Measure natural line widths at a test size (as a printed page).
    body.style.fontSize = '100px';
    body.classList.add('measuring');
    let max = 0;
    body.querySelectorAll('.mline.tl').forEach(l => { max = Math.max(max, l.scrollWidth); });
    body.classList.remove('measuring');
    if (reflow) page.classList.add('reflow');
    const inner = body.clientWidth;
    let fs = max ? 97 * inner / max : lineH * 0.6;
    if (d.p <= 2) fs = Math.min(fs, lineH * 0.62);
    fs = Math.min(fs, lineH * 0.78);
    if (reflow) {
      // Same type as the printed page, scaled up; the page grows as tall as it needs.
      body.style.fontSize = (fs * zoom).toFixed(2) + 'px';
      body.style.setProperty('--line-h', (lineH * zoom).toFixed(1) + 'px');
      page.style.height = 'auto';
      return;
    }
    body.style.fontSize = fs.toFixed(2) + 'px';
    // Lines much shorter than the page (rare) are centred instead of stretched.
    body.querySelectorAll('.mline.tl').forEach(l => {
      let natural = 0; l.childNodes.forEach(c => { natural += c.getBoundingClientRect ? c.getBoundingClientRect().width : 0; });
      l.classList.toggle('short', natural < inner * 0.72);
    });
  },

  updateBars(d) {
    const surahs = Q.surahsOnPage(this.page);
    $('#readerTitle').textContent = surahs.length > 1 ? `${surahs[0].en} – ${surahs[surahs.length - 1].en}` : (surahs[0] ? surahs[0].en : 'Mushaf');
    $('#readerSub').textContent = `Page ${this.page} · Juz ${Q.juzOfPage(this.page)}`;
    const sl = $('#readerSlider');
    sl.value = this.page;
    sl.setAttribute('aria-valuetext', `Page ${this.page}`);
    const marked = bookmarks().some(b => b.p === this.page);
    $('#readerMark').classList.toggle('on', marked);
    $('#readerMark').setAttribute('aria-label', marked ? 'Remove bookmark' : 'Bookmark this page');
  },

  next() { if (this.page < 604) this.show(this.page + 1, 'next'); else toast('This is the last page.'); },
  prev() { if (this.page > 1) this.show(this.page - 1, 'prev'); else toast('This is the first page.'); },

  setChrome(on) { this.chrome = on; $('#reader').classList.toggle('chrome-off', !on); if (!on && this.hideSize) this.hideSize(); },

  select(key) {
    state.selected = key;
    const bar = $('#ayahBar');
    bar.hidden = !key;
    $('#transCard').hidden = true;
    if (key) { const [s] = key.split(':'); $('#ayahBarRef').textContent = key; $('#ayahBarName').textContent = Q.ch(+s).en; this.setChrome(true); }
    if (this.resetBar && (!key || key !== this.barKey)) this.resetBar();
    this.barKey = key;
    this.syncAyahBar();
    paintWords();
  },

  syncAyahBar() {
    if (!state.selected) return;
    const [s, a] = state.selected.split(':').map(Number);
    const marked = ayahMarks().some(m => m.s === s && m.a === a);
    $('#ayahMark').classList.toggle('on', marked);
    $('#ayahMark span').textContent = marked ? 'Saved' : 'Bookmark';
    const noted = !!notes.ayah()[state.selected];
    $('#ayahNote').classList.toggle('on', noted);
    $('#ayahNote span').textContent = noted ? 'Edit note' : 'Note';
    const hl = highlights()[state.selected] || '';
    $('#ayahMarkup').classList.toggle('on', noted || !!hl);
    document.querySelectorAll('#ayahBar [data-hl]').forEach(b => b.classList.toggle('active', b.dataset.hl === hl && !!hl));
  },

  // Starting ayah for play and recite: the selected ayah, or the first on the page.
  async startAyah() {
    if (state.selected) return state.selected.split(':').map(Number);
    return Q.firstAyahOn(this.page);
  },
};

function bookmarks() { return store.get('bookmarks', []); }
// Ayah bookmarks [{s, a, t}] and highlights {"s:a": color}.
function ayahMarks() { return store.get('ayahMarks', []); }
function highlights() { if (!highlights.cache) highlights.cache = store.get('highlights', {}); return highlights.cache; }
function setHighlight(key, color) {
  const h = highlights();
  if (color) h[key] = color; else delete h[key];
  store.set('highlights', h);
  paintWords();
}
function toggleAyahMark(s, a) {
  const list = ayahMarks();
  const i = list.findIndex(m => m.s === s && m.a === a);
  if (i >= 0) { list.splice(i, 1); toast('Bookmark removed.'); }
  else { list.unshift({ s, a, t: Date.now() }); toast(`${Q.ch(s).en} ${s}:${a} bookmarked.`); }
  store.set('ayahMarks', list.slice(0, 200));
  mushaf.syncAyahBar();
}
function toggleBookmark() {
  const list = bookmarks();
  const i = list.findIndex(b => b.p === mushaf.page);
  if (i >= 0) { list.splice(i, 1); toast('Bookmark removed.'); }
  else { list.unshift({ p: mushaf.page, t: Date.now() }); toast(`Page ${mushaf.page} bookmarked.`); }
  store.set('bookmarks', list.slice(0, 100));
  mushaf.updateBars();
}

// Go to a mushaf page (from the reader or from any other screen), optionally selecting an ayah.
function gotoPage(p, sel) {
  if (state.view === 'mushaf') { mushaf.show(p).then(() => { if (sel) mushaf.select(sel); }); return; }
  pendingSelect = sel || null; location.hash = `page-${p}`;
}
function openGoto(tab = 'surah') {
  const tabs = `<div class="mode-switch" role="tablist">${[['surah', 'Surah'], ['juz', 'Juz'], ['bookmarks', 'Bookmarks']].map(([t, l]) =>
    `<button type="button" class="mode${t === tab ? ' active' : ''}" data-goto-tab="${t}">${l}</button>`).join('')}</div>
    <div class="page-jump"><label for="pageJump">Page</label><input id="pageJump" type="number" min="1" max="604" inputmode="numeric" placeholder="1–604"><button type="button" class="btn small primary" id="pageJumpGo">Go</button></div>`;
  let content = '';
  if (tab === 'surah') {
    content = `<ol class="surah-list compact">${Q.meta.chapters.map(c => `
      <li><button type="button" class="surah-row" data-goto="${c.pages[0]}"><span class="star">${c.n}</span>
        <span class="info"><b>${esc(c.en)}</b><span>Page ${c.pages[0]} · Juz ${Q.juzOfPage(c.pages[0])}</span></span>
        <span class="arabic" lang="ar">${esc(c.ar)}</span></button></li>`).join('')}</ol>`;
  } else if (tab === 'juz') {
    content = `<ol class="juz-grid">${Q.meta.juz.map((p, i) => {
      const [s, a] = JUZ_STARTS[i];
      return `<li><button type="button" class="juz${Q.juzOfPage(mushaf.page) === i + 1 ? ' current' : ''}" data-goto="${p}"><span class="star">${i + 1}</span><span><b>Juz ${i + 1}</b><span>${esc(Q.ch(s).en)} ${s}:${a} · p. ${p}</span></span></button></li>`;
    }).join('')}</ol>`;
  } else {
    const pages = bookmarks(), ayahs = ayahMarks();
    const hls = Object.entries(highlights()).sort((x, y) => { const [a1, b1] = x[0].split(':').map(Number), [a2, b2] = y[0].split(':').map(Number); return a1 - a2 || b1 - b2; });
    const ayahRow = (key, extra) => { const [s, a] = key.split(':').map(Number); return `<li><button type="button" class="bm" data-goto-ayah="${key}"><b>${extra}${esc(Q.ch(s).en)} ${key}</b><span>Page ${Q.ayahPage(s, a)}</span></button></li>`; };
    const sec = (title, rows) => rows.length ? `<h3 class="goto-h">${title}</h3><ul class="mistakes">${rows.join('')}</ul>` : '';
    content = sec('Pages', pages.map(b => { const c = Q.surahsOnPage(b.p)[0]; return `<li><button type="button" class="bm" data-goto="${b.p}"><b>Page ${b.p} · ${esc(c ? c.en : '')}</b><span>${new Date(b.t).toLocaleDateString()}</span></button></li>`; }))
      + sec('Ayahs', ayahs.map(m => ayahRow(`${m.s}:${m.a}`, '')))
      + sec('Highlights', hls.map(([k, color]) => ayahRow(k, `<i class="dot hl-dot-${color}"></i>`)));
    if (!content) content = '<p class="note left">No bookmarks yet. Tap the bookmark icon at the top of a page, or tap an ayah and choose Bookmark or a highlight colour.</p>';
  }
  $('#gotoBody').innerHTML = tabs + content;
  if (!$('#gotoSheet').open) $('#gotoSheet').showModal();
}

/* ------------------------------------------------------------------ */
/*  Text view (one surah, with optional translation)                   */
/* ------------------------------------------------------------------ */

async function openSurah(n, ayahNum) {
  if (n < 1 || n > 114) { location.hash = 'quran'; return; }
  if (state.view === 'surah' && state.surahNum === n && state.surahData) {
    if (ayahNum) surahView.scrollTo(ayahNum);
    return;
  }
  showView('surah');
  state.surahNum = n;
  state.surahData = null;
  updateControls();
  $('#surahHead').innerHTML = '';
  $('#ayahs').innerHTML = '<div class="loading">Loading surah…</div>';
  try {
    await Q.load();
    const c = Q.ch(n);
    setTitle(c.en, `${c.tr} · ${c.ayahs} ayahs`);
    const data = await Q.surah(n);
    if (state.surahNum !== n) return;
    state.surahData = data;
    surahView.render(c, data);
    if (ayahNum) requestAnimationFrame(() => surahView.scrollTo(ayahNum, 'auto'));
    else scrollTop();
    if (settings.translation) surahView.loadTranslation(n);
    if (settings.tafsir) surahView.loadTafsir(n);
  } catch (e) {
    $('#ayahs').innerHTML = '<div class="loading">Could not load this surah. Check your connection and try again.</div>';
  }
}

const surahView = {
  render(c, data) {
    resetWordEls();
    const head = $('#surahHead');
    head.innerHTML = `<div class="surah-head">
        ${data.head ? `<div class="sh-frame big"><span class="sh" style="font-family:${Q.fam('B')}">${data.head.g}</span></div>` : ''}
        <div class="meta">${esc(c.en)} · ${esc(c.tr)} · ${c.place === 'makkah' ? 'Makki' : 'Madani'} · ${c.ayahs} ayahs · page ${c.pages[0]}</div>
        ${data.bism ? `<div class="bismillah" style="font-family:${Q.fam(data.bism.fid)}">${data.bism.g}</div>` : ''}
      </div>`;
    if (data.bism) { const svg = Q.bismSVG(data.bism); if (svg) head.querySelector('.bismillah').replaceChildren(svg); }
    const wrap = $('#ayahs');
    wrap.innerHTML = '';
    data.ayahs.forEach(A => {
      const art = document.createElement('article');
      art.className = 'ayah';
      art.id = 'ayah-' + A.n;
      art.dataset.a = A.n;
      art.innerHTML = `<div class="ayah-top">
          <span class="star">${c.n}:${A.n}</span><span class="score" hidden></span><span class="spacer"></span>
          <button class="icon-btn" data-act="play" aria-label="Play ayah ${A.n}"><svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg></button>
          <button class="icon-btn" data-act="recite" aria-label="Recite from ayah ${A.n}"><svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button>
        </div><p class="qtext" dir="rtl" lang="ar"></p><p class="translation" hidden></p>`;
      const p = art.querySelector('.qtext');
      A.words.forEach(w => {
        const sp = document.createElement('span');
        sp.textContent = w.g; sp.style.fontFamily = Q.fam(w.fid);
        registerWord(w, sp);
        p.append(sp, ' ');
      });
      if (A.end) { const e = document.createElement('span'); e.className = 'end'; e.textContent = A.end.g; e.style.fontFamily = Q.fam(A.end.fid); registerEnd(A.end, e); p.append(e); }
      A.el = art;
      wrap.append(art);
    });
    paintWords();
    this.showTranslations();
    this.showTafsir();
  },

  async loadTranslation(n) {
    try { this.loaded = { n, t: await getTranslation(n) }; }
    catch (_) { toast('The translation could not load. Check your connection.', 'bad'); return; }
    if (state.surahNum === n) this.showTranslations();
  },

  showTranslations() {
    const t = this.loaded && this.loaded.n === state.surahNum ? this.loaded.t : null;
    document.querySelectorAll('#ayahs .ayah').forEach(art => {
      const el = art.querySelector('.translation');
      const text = t && t[art.dataset.a - 1];
      el.hidden = !settings.translation || !text;
      if (text) el.textContent = text;
    });
  },

  async loadTafsir(n) {
    let groups;
    try { groups = await getTafsir(n); }
    catch (_) { toast('The tafsir could not load. Check your connection.', 'bad'); return; }
    if (state.surahNum !== n) return;
    this.tafsir = { n, groups };
    this.showTafsir();
  },

  showTafsir() {
    document.querySelectorAll('#ayahs .tafsir').forEach(el => el.remove());
    if (!settings.tafsir || !this.tafsir || this.tafsir.n !== state.surahNum) return;
    const n = state.surahNum;
    this.tafsir.groups.forEach(g => {
      const art = document.getElementById('ayah-' + g[1]);
      if (!art) return;
      const d = document.createElement('details');
      d.className = 'tafsir';
      d.innerHTML = `<summary>Tafsir Ibn Kathir · ${ayahRange(n, g)}</summary><div class="tafsir-text"></div>`;
      d.querySelector('.tafsir-text').append(tafsirNode(g[2]));
      art.append(d);
    });
  },

  scrollTo(a, behavior = 'smooth') {
    const el = document.getElementById('ayah-' + a);
    if (el) el.scrollIntoView({ behavior, block: 'center' });
  },

  visibleAyah() {
    const top = scroller() ? scroller().getBoundingClientRect().top : 0;
    const arts = document.querySelectorAll('#ayahs .ayah');
    for (const el of arts) if (el.getBoundingClientRect().bottom - top > 120) return +el.dataset.a;
    return 1;
  },

  paintScores() {
    if (!state.surahData) return;
    state.surahData.ayahs.forEach(A => {
      const badge = A.el && A.el.querySelector('.score');
      if (!badge) return;
      const inScope = A.words.filter(w => rec.ids.has(w.id));
      const done = inScope.filter(w => rec.status.has(w.id));
      if (!inScope.length || done.length < inScope.length) { badge.hidden = true; return; }
      const ok = done.filter(w => rec.status.get(w.id) === 'ok').length;
      badge.hidden = false;
      badge.textContent = `${ok}/${inScope.length}`;
      badge.classList.toggle('has-errors', ok < inScope.length);
      A.el.classList.toggle('reciting', false);
    });
  },
};

let scrollTimer;
function onScroll() {
  if (state.view !== 'surah' || !state.surahData) return;
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => store.set('lastRead', { n: state.surahNum, a: surahView.visibleAyah() }), 400);
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('scroll', () => { arReader.scrolled(); lectures.scrolled(); }, { passive: true });
window.addEventListener('resize', () => lectures.layout());
$('#screen').addEventListener('scroll', () => { arReader.scrolled(); lectures.scrolled(); }, { passive: true });
$('#screen').addEventListener('scroll', onScroll, { passive: true });

/* ------------------------------------------------------------------ */
/*  Reciter playback (ayah by ayah)                                    */
/* ------------------------------------------------------------------ */

const player = {
  audio: new Audio(),
  gi: -1, end: -1, left: 0, playing: false, once: false,

  key() { const k = Q.all[this.gi]; return k ? `${k[0]}:${k[1]}` : ''; },
  url(gi) { const [s, a] = Q.all[gi]; return `${AUDIO_BASE}/${settings.reciter}/${pad3(s)}${pad3(a)}.mp3`; },
  span: null, token: 0,

  // Play from ayah (s, a). In text view playback stops at the end of the surah;
  // in the mushaf it carries on through the Quran.
  play(s, a, opts = {}) {
    if (rec.active) rec.stop(false);
    this.gi = Q.gi(s, a); this.bismFor = -1; this.inBism = false;
    this.end = opts.end != null ? opts.end : state.view === 'surah' ? Q.gi(s, Q.ch(s).ayahs) : Q.all.length - 1;
    this.once = !!opts.once;
    this.left = this.once ? 1 : Number(settings.repeat) || 1;
    this.active = true;
    if (currentReciter().timed) monoFix.prime();   // a tap: the only time a phone lets audio processing start
    this.start();
  },

  async start() {
    const t = ++this.token;
    const [s, a] = Q.all[this.gi];
    const r = currentReciter();
    this.playing = true;
    follow(s, a);
    paintWords();
    this.mediaSession();
    updateControls();
    const fail = () => { if (t === this.token) { toast(navigator.onLine ? 'Could not play this recitation. Check your connection.' : 'This recitation isn\u2019t saved on your phone yet. Play it once with internet, and it plays offline after that.', 'bad'); this.stop(); } };
    if (r.missing && r.missing.includes(s)) { toast(`${r.name} has no recording of ${Q.ch(s).en}. Choose another reciter for this surah.`, 'bad'); this.stop(); return; }
    this.applySpeed();
    const tm = timedFor(r, s);
    if (tm) {
      // Full-surah file: seek to the ayah and stop at its end time.
      let times;
      try { times = await getTimings(tm, s); } catch (_) { fail(); return; }
      if (t !== this.token) return;
      this.span = times[a];
      if (!this.span) { fail(); return; }
      // Ayah 1 of a surah (not Al-Fatiha or At-Tawbah): start from the top of the recording,
      // with the reciter's basmala. Repeats of the ayah start at the ayah itself.
      this.ayahSpan = this.span; this.inBism = false;
      if (a === 1 && s !== 1 && s !== 9 && this.bismFor !== this.gi) {
        this.bismFor = this.gi;
        if (tm.qdc) {
          // Quran.com's surah recordings start at ayah 1: play the reciter's basmala (Al-Fatiha 1:1) first.
          try { const t1 = await getTimings(tm, 1); if (t !== this.token) return; times = t1; this.span = t1[1]; this.inBism = true; } catch (_) { /* go on without it */ }
        } else this.span = [0, this.span[1]];
      }
      // A few recordings have one channel in opposite phase, which cancels the voice on a
      // phone speaker: play those surahs from one channel.
      this.use(await monoFix.needed(tm, s));
      if (t !== this.token) return;
      const file = times.url || `${tm.base}${pad3(s)}.mp3`;
      this.words = times.words || null;
      const sameFile = this.audio.src.split('#')[0] === file;
      // The #t= fragment makes iPhones start at the ayah even when an early seek is ignored.
      if (!sameFile) this.audio.src = `${file}#t=${this.span[0].toFixed(2)}`;
      const seek = () => {
        if (t !== this.token || !this.span) return;
        if (Math.abs(this.audio.currentTime - this.span[0]) > 0.35) { try { this.audio.currentTime = this.span[0]; } catch (_) {} }
      };
      if (sameFile && this.audio.readyState >= 1) seek();
      else { this.audio.addEventListener('loadedmetadata', seek, { once: true }); this.audio.addEventListener('canplay', seek, { once: true }); }
      this.audio.addEventListener('playing', seek, { once: true });
      this.audio.play().catch(fail);
    } else {
      this.span = null; this.words = null;
      this.use(false);
      // Ayah 1 of a surah (not Al-Fatiha or At-Tawbah): the reciter's basmala first.
      this.inBism = a === 1 && s !== 1 && s !== 9 && this.bismFor !== this.gi;
      if (this.inBism) this.bismFor = this.gi;
      this.audio.src = this.inBism ? `${AUDIO_BASE}/${settings.reciter}/001001.mp3` : this.url(this.gi);
      this.audio.play().catch(fail);
      if (this.gi < this.end) { const n = new Audio(this.url(this.gi + 1)); n.preload = 'auto'; }
    }
  },

  applySpeed() {
    const r = Number(settings.speed) || 1;
    this.audio.defaultPlaybackRate = r;
    this.audio.playbackRate = r;
    this.audio.preservesPitch = true;
  },

  // Switch between the plain audio element and the one-channel one.
  use(fixed) {
    const el = fixed ? monoFix.element() : this.plain;
    if (!el || el === this.audio) return;
    switching = true; setTimeout(() => { switching = false; }, 400);
    const old = this.audio; this.audio = el; old.pause();
    this.applySpeed();
  },
  // active: a recitation is playing or paused (the small player shows on other screens)
  pause() { this.audio.pause(); this.playing = false; media.set('paused'); paintWords(); updateControls(); },
  stop() { this.audio.pause(); this.playing = false; this.active = false; media.set('paused'); paintWords(); updateControls(); },

  // here: is the paused ayah on the screen being read? Otherwise play starts afresh there.
  resumeOr(startFn, here) {
    if (this.playing) { this.pause(); return; }
    if (this.active && this.gi >= 0 && (!here || here(Q.all[this.gi])) && this.audio.src && !this.audio.ended && this.audio.currentTime > 0 && (!this.span || this.audio.currentTime < this.span[1])) {
      this.playing = true; this.audio.play().catch(() => {}); paintWords(); updateControls();
    } else startFn();
  },

  step(d) {
    if (this.gi < 0) return false;
    const gi = Math.min(Q.all.length - 1, Math.max(0, this.gi + d));
    const [s, a] = Q.all[gi];
    this.play(s, a, { end: this.end });
    return true;
  },

  ended() {
    if (this.inBism) { this.inBism = false; if (timedFor(currentReciter(), Q.all[this.gi][0])) { this.start(); return; } this.audio.src = this.url(this.gi); this.audio.play().catch(() => {}); return; }
    if (this.ayahSpan && this.span && this.span !== this.ayahSpan) this.span = this.ayahSpan;
    if (--this.left > 0) { this.audio.currentTime = this.span ? this.span[0] : 0; this.audio.play().catch(() => {}); return; }
    if (this.once) { this.stop(); return; }
    const gi = this.gi, end = this.end;
    if (settings.listenRepeat) {
      this.playing = false; paintWords(); updateControls();
      const [s, a] = Q.all[gi];
      rec.start(s, a, {
        scope: 'single',
        onDone: () => setTimeout(() => { if (gi < end) { const [s2, a2] = Q.all[gi + 1]; this.play(s2, a2, { end }); } }, 700),
      });
      return;
    }
    if (settings.autoNext && gi < end) { const [s, a] = Q.all[gi + 1]; this.play(s, a, { end }); }
    else this.stop();
  },

  mediaSession() {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    const [s, a] = Q.all[this.gi];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${Q.ch(s).en} · Ayah ${a}`, artist: reciterName(), album: APP_NAME,
      artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
    });
  },
};
player.plain = player.audio;
// Keeps the app's state in step with the audio when it's paused or resumed from outside the app.
let switching = false;
function wireAudio(el) {
  const mine = () => el === player.audio;
  el.addEventListener('loadedmetadata', () => { if (mine()) { player.applySpeed(); media.position(); } });
  el.addEventListener('ended', () => { if (mine() && player.playing) player.ended(); });
  el.addEventListener('timeupdate', () => { if (mine()) checkSpan(); });
  el.addEventListener('emptied', () => { if (mine()) { switching = true; setTimeout(() => { switching = false; }, 400); } });
  el.addEventListener('play', () => { if (!mine()) return; media.set('playing'); wordFollow.start(); if (!player.playing && player.gi >= 0) { player.playing = true; paintWords(); updateControls(); } });
  el.addEventListener('pause', () => {
    if (!mine() || switching || el.ended) return;
    // Pauses the app makes itself between ayahs are followed by play straight away.
    setTimeout(() => {
      if (!mine()) return;
      if (el.paused && player.playing && !el.ended) { player.playing = false; paintWords(); updateControls(); }
      if (el.paused) media.set('paused');
    }, 250);
  });
}
// One-channel playback for recordings whose two channels cancel each other.
const monoFix = {
  ctx: null, el: null, phase: new Map(),
  prime() {
    try {
      if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) this.ctx = new AC(); }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    } catch (_) {}
  },
  element() {
    if (this.el) return this.el;
    if (!this.ctx) return null;
    try {
      const el = new Audio(); el.crossOrigin = 'anonymous'; el.preload = 'auto';
      const src = this.ctx.createMediaElementSource(el), split = this.ctx.createChannelSplitter(2), merge = this.ctx.createChannelMerger(2);
      src.connect(split); split.connect(merge, 0, 0); split.connect(merge, 0, 1); merge.connect(this.ctx.destination); this.out = merge;
      wireAudio(el); this.el = el;
    } catch (_) { return null; }
    return this.el;
  },
  async needed(timed, s) {
    if (!timed.local) return false;
    if (!this.phase.has(timed.local)) this.phase.set(timed.local, fetchJSON(`data/timings/${timed.local}/phase.json`).catch(() => ({})));
    const ph = await this.phase.get(timed.local);
    if (!ph[s]) return false;
    this.prime();
    return !!this.element();
  },
};
// Full-surah recordings: treat reaching the ayah's end time as the end of the ayah.
// Checked on a timer and on 'timeupdate', which keeps firing when the phone is locked.
function checkSpan() {
  const p = player;
  // Started somewhere else in the surah file (a seek the browser ignored): go to the ayah.
  if (p.playing && p.span && !p.audio.paused && p.audio.readyState >= 1 && (p.audio.currentTime < p.span[0] - 1 || p.audio.currentTime > p.span[1] + 2)) {
    try { p.audio.currentTime = p.span[0]; } catch (_) {}
    return;
  }
  if (p.playing && p.span && !p.audio.paused && p.audio.currentTime >= p.span[1] - 0.05) {
    const sameSurahNext = !p.once && p.left <= 1 && !settings.listenRepeat && settings.autoNext && p.gi < p.end && Q.all[p.gi + 1][0] === Q.all[p.gi][0];
    if (!sameSurahNext) p.audio.pause();
    p.ended();
  }
}
setInterval(checkSpan, 80);
wireAudio(player.plain);

// Lock screen, Control Centre, headphones and car controls.
const media = {
  set(state) {
    if (!('mediaSession' in navigator)) return;
    try { navigator.mediaSession.playbackState = state; } catch (_) {}
  },
  position() {
    if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
    const a = player.audio;
    try {
      if (player.span) navigator.mediaSession.setPositionState({ duration: Math.max(0.1, player.span[1] - player.span[0]), position: Math.min(Math.max(0, a.currentTime - player.span[0]), player.span[1] - player.span[0]), playbackRate: a.playbackRate || 1 });
      else if (isFinite(a.duration) && a.duration > 0) navigator.mediaSession.setPositionState({ duration: a.duration, position: Math.min(a.currentTime, a.duration), playbackRate: a.playbackRate || 1 });
    } catch (_) {}
  },
};
if ('mediaSession' in navigator) {
  const on = (action, fn) => { try { navigator.mediaSession.setActionHandler(action, fn); } catch (_) {} };
  on('play', () => {
    if (player.gi < 0) return;
    if (player.audio.paused && player.audio.src && !player.audio.ended && (!player.span || player.audio.currentTime < player.span[1] - 0.1)) {
      player.playing = true; player.audio.play().catch(() => {}); paintWords(); updateControls();
    } else { const [s, a] = Q.all[player.gi]; player.play(s, a, { end: player.end }); }
  });
  on('pause', () => player.pause());
  on('stop', () => player.stop());
  on('previoustrack', () => player.step(-1));
  on('nexttrack', () => player.step(1));
  on('seekto', d => {
    if (d.seekTime == null) return;
    player.audio.currentTime = player.span ? player.span[0] + d.seekTime : d.seekTime;
    media.position();
  });
  on('seekbackward', null); on('seekforward', null);
}

/* ------------------------------------------------------------------ */
/*  Live recitation checking                                           */
/* ------------------------------------------------------------------ */

const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
// Tajweed reference (phonemes of every word) and the model's phoneme units, loaded on first use.
const TajweedData = {
  p: null,
  load() {
    if (!this.p) {
      this.p = Promise.all([fetch('models/quran-phoneme/tokens.txt').then(r => r.text()), fetchJSON('data/quran-ph.json')])
        .then(([tok, ref]) => { Tajweed.init(tok, ref); this.ready = true; return true; });
      this.p.catch(() => { this.p = null; });
    }
    return this.p;
  },
};
// 'quran': the Quran phoneme model on this device (speech.js). 'browser': the browser's recognizer.
function useQuranModel() { return settings.engine !== 'browser' && window.QuranSpeech && QuranSpeech.supported(); }
function canListen() {
  if (!useQuranModel() && !SpeechRec) { toast('This browser can\u2019t listen. Use Safari, Chrome or Edge.', 'bad'); return false; }
  return true;
}

// Find where in the Quran someone is reciting from a few heard words.
// search.json holds every word of the mushaf (normalized) in reading order.
const Finder = {
  words: null, ayahOf: null, ayahs: null, tri: null, loading: null,
  load() {
    if (!this.loading) {
      this.loading = fetchJSON(MUSHAF_BASE + 'search.json').then(d => {
        this.words = d.w.split(' ');
        this.ayahs = d.a;
        this.ayahOf = new Int32Array(this.words.length);
        d.a.forEach(([, , start], i) => { const end = i + 1 < d.a.length ? d.a[i + 1][2] : this.words.length; for (let k = start; k < end; k++) this.ayahOf[k] = i; });
        this.tri = new Map();
        for (let i = 0; i + 2 < this.words.length; i++) {
          const k = this.words[i] + ' ' + this.words[i + 1] + ' ' + this.words[i + 2];
          const list = this.tri.get(k);
          if (list) { if (list.length < 80) list.push(i); } else this.tri.set(k, [i]);
        }
        return this;
      });
      this.loading.catch(() => { this.loading = null; });
    }
    return this.loading;
  },
  // Vote for alignments of the heard words against the whole text; return the best
  // start word and how clearly it beats the next-best place.
  find(tokens) {
    if (!this.tri || tokens.length < 3) return null;
    const votes = new Map();
    for (let i = 0; i + 2 < tokens.length; i++) {
      const hits = this.tri.get(tokens[i] + ' ' + tokens[i + 1] + ' ' + tokens[i + 2]);
      if (!hits || hits.length > 40) continue;
      hits.forEach(p => { const st = p - i; votes.set(st, (votes.get(st) || 0) + 1); });
    }
    let best = null, bestN = 0, second = 0;
    votes.forEach((n, st) => { if (n > bestN) { second = bestN; bestN = n; best = st; } else if (n > second) second = n; });
    if (best === null) return null;
    let near = 0; votes.forEach((n, st) => { if (st !== best && Math.abs(st - best) <= 3) near = Math.max(near, n); });
    if (near === second) second = 0;
    return { start: best, score: bestN, margin: bestN - second };
  },
  wordAt(i) { const [s, a, st] = this.ayahs[this.ayahOf[i]]; return { s, a, pos: i - st + 1 }; },
};
const isAndroid = /Android/i.test(navigator.userAgent);
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const rec = {
  active: false, r: null,
  expected: [], ids: new Set(), status: new Map(), nextId: null,
  carried: '', fin: '', interim: '',
  scope: 'surah', from: null, nextPage: 0, done: false, feeding: null,
  onDone: null, announced: new Set(), curKey: '', wake: null, lastPos: 0,
  phon: false, H: [], P: new Set(), hSkip: 0, errors: new Map(),

  // scope: 'single' (one ayah), 'surah' (to the end of the surah), 'open' (on through the Quran).
  async start(s, a, opts = {}) {
    if (!canListen()) return;
    if (!window.isSecureContext) { toast('Open the app over https to use the microphone.', 'bad'); return; }
    if (this.active) this.stop(false);
    player.stop();
    this.scope = opts.scope || (state.view === 'surah' ? 'surah' : 'open');
    this.from = [s, a];
    this.fromPos = opts.pos || 1;
    this.auto = false; this.skip = 0; this.startedAt = Date.now();
    this.onDone = opts.onDone || null;
    this.lastPage = opts.lastPage || null; this.hifz = opts.hifz || null;   // a hifz test: just this page
    this.expected = []; this.ids = new Set(); this.status = new Map();
    this.carried = this.fin = this.interim = '';
    this.announced = new Set(); this.curKey = ''; this.nextId = null; this.lastPos = 0;
    this.phon = useQuranModel(); this.H = []; this.P = new Set(); this.R = new Set(); this.hSkip = 0; this.errors = new Map(); this.liveSt = null;
    this.nextPage = Q.ayahPage(s, a); this.done = false; this.feeding = null;
    this.active = true;
    updateControls();
    $('#heardText').textContent = `Recite ${Q.ch(s).en} ${s}:${a}…`;
    await this.feed(80);
    if (this.phon) { try { await TajweedData.load(); } catch (_) { toast('The tajweed data could not load. Check your connection and try again.', 'bad'); this.stop(false); return; } }
    if (!this.active) return;
    this.nextId = this.expected[0] && this.expected[0].id;
    paintWords();
    this.listen();
    try { navigator.wakeLock && navigator.wakeLock.request('screen').then(l => { this.wake = l; }).catch(() => {}); } catch (_) {}
  },

  // Listen first, find the ayah from the words heard, then follow from there.
  async startAuto() {
    if (!canListen()) return;
    if (!window.isSecureContext) { toast('Open the app over https to use the microphone.', 'bad'); return; }
    if (this.active) this.stop(false);
    player.stop();
    this.auto = true; this.skip = 0; this.scope = 'open'; this.onDone = null; this.startedAt = Date.now(); this.lastPage = null; this.hifz = null;
    this.expected = []; this.ids = new Set(); this.status = new Map();
    this.carried = this.fin = this.interim = '';
    this.announced = new Set(); this.curKey = ''; this.nextId = null; this.lastPos = 0; this.done = false; this.feeding = null;
    this.phon = useQuranModel(); this.H = []; this.P = new Set(); this.R = new Set(); this.hSkip = 0; this.errors = new Map(); this.liveSt = null;
    this.active = true;
    updateControls();
    $('#heardText').textContent = 'Start reciting from any ayah…';
    if (this.phon) TajweedData.load().catch(() => { toast('The tajweed data could not load. Check your connection.', 'bad'); this.stop(false); });
    else Finder.load().catch(() => { toast('The search index could not load. Check your connection.', 'bad'); this.stop(false); });
    this.listen();
    try { navigator.wakeLock && navigator.wakeLock.request('screen').then(l => { this.wake = l; }).catch(() => {}); } catch (_) {}
  },

  async detect(tokens) {
    if (!Finder.tri || this.detecting) return;
    const m = Finder.find(tokens);
    if (!m || m.score < 2 || m.margin < 1) return;
    // The first heard word that actually matches is where the recitation starts.
    let j = 0;
    while (j < tokens.length && !Matcher.similar(tokens[j], Finder.words[m.start + j] || '')) j++;
    if (j >= tokens.length || m.start + j < 0) return;
    const w = Finder.wordAt(m.start + j);
    this.detecting = true;
    this.auto = false; this.skip = j;
    this.from = [w.s, w.a]; this.fromPos = w.pos;
    this.nextPage = Q.ayahPage(w.s, w.a); this.done = false;
    toast(`Found ${Q.ch(w.s).en} ${w.s}:${w.a}`);
    try { await this.feed(80); } finally { this.detecting = false; }
    if (this.active) this.update(false);
  },

  // Recite anywhere, with the phoneme model: find the ayah from the sounds heard.
  async detectPh() {
    if (this.detecting || this.H.length < 10) return;
    const m = Tajweed.find(this.H.slice(-60));
    if (!m) return;
    const offset = Math.max(0, this.H.length - 60);
    this.detecting = true;
    this.auto = false; this.hSkip = offset + m.skip;
    this.from = [m.s, m.a]; this.fromPos = m.pos;
    this.nextPage = Q.ayahPage(m.s, m.a); this.done = false;
    toast(`Found ${Q.ch(m.s).en} ${m.s}:${m.a}`);
    try { await this.feed(80); } finally { this.detecting = false; }
    if (this.active) this.update(false);
  },

  inScope(w) {
    const [s, a] = this.from;
    if (w.s < s || (w.s === s && w.a < a)) return 0;           // before the start
    if (w.s === s && w.a === a && w.pos < (this.fromPos || 1)) return 0;
    if (this.scope === 'single') return w.s === s && w.a === a ? 1 : -1;
    if (this.scope === 'surah') return w.s === s ? 1 : -1;
    return 1;
  },

  // Load more expected words, a page at a time, until `want` more are queued.
  feed(want) {
    if (this.feeding) return this.feeding;
    this.feeding = (async () => {
      const target = this.expected.length + want;
      while (!this.done && this.expected.length < target && this.nextPage <= 604) {
        if (this.lastPage && this.nextPage > this.lastPage) { this.done = true; break; }
        const d = await Q.pageReady(this.nextPage++);
        for (const w of d.words) {
          const k = this.inScope(w);
          if (k < 0) { this.done = true; break; }
          if (k > 0) { this.expected.push(w); this.ids.add(w.id); }
        }
      }
      if (this.nextPage > 604) this.done = true;
    })().finally(() => { this.feeding = null; });
    return this.feeding;
  },

  listen() {
    if (useQuranModel()) { this.listenModel(); return; }
    const r = new SpeechRec();
    r.lang = 'ar-SA';
    r.continuous = !isAndroid;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onresult = e => {
      if (this.r !== r) return;
      let fin = '', interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) fin += ' ' + res[0].transcript; else interim += ' ' + res[0].transcript;
      }
      this.fin = fin; this.interim = interim;
      this.update(false);
    };
    r.onerror = e => {
      if (this.r !== r) return;
      const msg = {
        'not-allowed': 'Microphone access is blocked. Allow the microphone for this site in your browser settings.',
        'service-not-allowed': 'Speech recognition is turned off in this browser.',
        'network': 'Speech recognition needs an internet connection.',
        'language-not-supported': 'Arabic speech recognition is not available in this browser.',
        'audio-capture': 'No microphone was found.',
      }[e.error];
      if (msg) { toast(msg, 'bad'); this.stop(false); }
    };
    r.onend = () => {
      if (this.r !== r || !this.active) return;
      this.carried += ' ' + this.fin + ' ' + this.interim;
      this.fin = this.interim = '';
      this.listen();
    };
    this.r = r;
    try { r.start(); } catch (_) {}
  },

  listenModel() {
    const eng = QuranSpeech.create({
      onUnits: (units, pauses, silence, resets) => {
        if (this.r !== eng || !this.active) return;
        this.H = units; this.P = pauses; this.R = resets;
        // On a slow phone, check only the latest of what was heard instead of falling behind
        // working through every step.
        if (this.upT) return;
        this.upT = setTimeout(() => {
          this.upT = null;
          if (this.r !== eng || !this.active) return;
          const t = performance.now(); this.update(false); this.upCost = performance.now() - t;
        }, Math.min(600, 2 * (this.upCost || 0)));
      },
      onState: (st, info) => {
        if (this.r !== eng || !this.active) return;
        const heard = $('#heardText');
        if (st === 'loading') {
          const pct = info && info.total ? Math.round(info.loaded / info.total * 100) : 0;
          heard.textContent = `Getting the Quran speech model ready${pct ? ` (${pct}%)` : ''}…`;
        } else if (st === 'listening' && !this.H.length) heard.textContent = this.auto ? 'Start reciting from any ayah…' : 'Listening…';
      },
      onError: msg => {
        if (this.r !== eng) return;
        const known = { 'not-allowed': 'Microphone access is blocked. Allow the microphone for this site in your browser settings.', 'audio-capture': 'No microphone was found.' }[msg];
        if (known) { toast(known, 'bad'); this.stop(false); return; }
        toast('The Quran speech model couldn\u2019t start on this device. Try again, or switch to the phone\u2019s recognizer in Settings.', 'bad');
        this.stop(false);
      },
    });
    this.r = eng;
    eng.start().then(ok => { if (!ok && this.r === eng) this.stop(false); });
  },

  // What the model heard, as phonetic Arabic (shows the harakat it heard).
  // What the bar shows while you recite: the words you've just said (or, in memorization
  // mode, only where you are), not the model's raw sounds.
  heardText() {
    if (this.auto || !this.expected.length) return 'Listening… recite from anywhere';
    const p = Math.min(this.lastPos || 0, this.expected.length);
    if (!p) { const [s, a] = this.from; return `Recite ${Q.ch(s).en} ${s}:${a}…`; }
    const w = this.expected[p - 1];
    if (settings.hide) return `${Q.ch(w.s).en} ${w.s}:${w.a}`;
    return this.expected.slice(Math.max(0, p - 6), p).filter(x => x.s === w.s && x.a === w.a).map(x => x.text).join(' ');
  },
  checkPh(final) {
    const P = []; this.P.forEach(p => { if (p >= this.hSkip) P.push(p - this.hSkip); });
    // Incremental: settled words are kept, marks show once they hold (see Tajweed.live).
    if (!this.liveSt || this.liveSt.skip !== this.hSkip) this.liveSt = { skip: this.hSkip };
    const soft = new Set(); (this.R || []).forEach(q => { if (q >= this.hSkip) soft.add(q - this.hSkip); });
    return Tajweed.live(this.liveSt, this.expected, this.H.slice(this.hSkip), P, { soft, final, level: settings.checkLevel || 'tajweed', minSure: { gentle: 0.92, balanced: 0.8, strict: 0.5 }[settings.strict] || 0.8 });
  },

  transcript() { return `${this.carried} ${this.fin} ${this.interim}`; },

  apply(res) {
    this.status = new Map(); this.errors = new Map();
    this.expected.forEach((w, j) => { if (res.status[j]) this.status.set(w.id, res.status[j]); if (res.errors && res.errors[j]) this.errors.set(w.id, res.errors[j]); });
    this.lastPos = res.pos;
    this.nextId = this.active && this.expected[res.pos] ? this.expected[res.pos].id : null;
  },

  update(final) {
    if (!this.active) return;
    let res;
    if (this.phon) {
      if (this.H.length) $('#heardText').textContent = this.heardText();
      if (this.auto) { this.detectPh(); return; }
      if (this.detecting) return;
      res = this.checkPh(final);
    } else {
      const text = this.transcript();
      const words = text.trim().split(/\s+/).filter(Boolean);
      if (words.length) $('#heardText').textContent = words.slice(-8).join(' ');
      if (this.auto) { this.detect(Matcher.tokenize(text)); return; }
      if (this.detecting) return;
      const hasInterim = !final && this.interim.trim().length > 0;
      res = Matcher.align(this.expected, Matcher.tokenize(text).slice(this.skip), { final, hasInterim });
    }
    this.apply(res);
    paintWords();
    res.status.forEach((s, j) => {
      const key = j + ':' + s;
      if ((s === 'wrong' || s === 'skip' || s === 'tajweed') && !this.announced.has(key)) { this.announced.add(key); announceMistake(this.expected[j], s, res.errors && res.errors[j]); }
    });
    const cur = this.expected[Math.min(res.pos, this.expected.length - 1)];
    if (cur && `${cur.s}:${cur.a}` !== this.curKey) { this.curKey = `${cur.s}:${cur.a}`; follow(cur.s, cur.a); }
    if (!this.done && res.pos > this.expected.length - 40) this.feed(80).then(() => this.update(false));
    if (this.done && this.expected.length && res.pos >= this.expected.length) {
      if (this.scope === 'single') { const cb = this.onDone; this.stop(false); cb && cb(); }
      else this.stop(true);
    }
  },

  stop(showSummary) {
    if (!this.active) return;
    this.active = false;
    const r = this.r; this.r = null;
    if (r && typeof r.stop === 'function' && 'busy' in r) {
      // Quran model: let it finish checking what was already said.
      if (showSummary || r.busy) {
        updateControls();
        $('#heard').classList.add('checking');
        r.stop().then(out => { $('#heard').classList.remove('checking'); this.H = out.units; this.P = out.pauses; this.R = out.resets; this.finish(showSummary); });
        return;
      }
      r.abort();
    } else { try { r && r.abort(); } catch (_) {} }
    this.finish(showSummary);
  },

  finish(showSummary) {
    if (this.auto) {
      this.auto = false;
      try { this.wake && this.wake.release(); } catch (_) {}
      updateControls();
      const heardAny = this.phon ? this.H.length > 0 : Matcher.tokenize(this.transcript()).length > 0;
      if (showSummary) toast(heardAny ? 'Couldn\u2019t find that passage yet. Recite a few more words and try again.' : 'Nothing was heard. Check that the microphone is allowed.', 'bad');
      return;
    }
    const res = this.phon ? this.checkPh(true) : Matcher.align(this.expected, Matcher.tokenize(this.transcript()).slice(this.skip), { final: true });
    this.apply(res);
    paintWords();
    try { this.wake && this.wake.release(); } catch (_) {}
    this.wake = null;
    updateControls();
    if (showSummary) showSummaryFor(res);
  },
};

function fmtDuration(ms) { const s = Math.round(ms / 1000); return s < 60 ? `${s} sec` : `${Math.floor(s / 60)} min ${s % 60} sec`; }

function announceMistake(w, kind, errs) {
  vibrate(kind === 'tajweed' ? 40 : kind === 'wrong' ? [60, 40, 60] : 60);
  if (!settings.mistakePopups) return;
  const why = errs && errs.length ? ' · ' + errs[0].msg : '';
  if (kind === 'skip') toast([`${w.s}:${w.a} you skipped `, { ar: w.text }], 'bad');
  else toast([{ ar: w.text }, ` ${w.s}:${w.a}${why}`], kind === 'tajweed' ? 'warn' : 'bad');
}

function showSummaryFor(res) {
  const attempted = rec.expected.slice(0, res.pos);
  const ok = attempted.filter((_, j) => res.status[j] === 'ok').length;
  const mistakes = [];
  attempted.forEach((w, j) => {
    const s = res.status[j]; if (s !== 'wrong' && s !== 'skip' && s !== 'tajweed') return;
    // Words skipped together in one ayah are one row.
    const last = mistakes[mistakes.length - 1];
    if (s === 'skip' && last && last.s === 'skip' && last.w.s === w.s && last.w.a === w.a && last.j === j - 1) { last.w = Object.assign({}, last.w, { text: last.w.text + ' ' + w.text }); last.j = j; last.n++; return; }
    mistakes.push({ w, s, j, n: 1, e: res.errors ? res.errors[j] : null });
  });
  const wrong = mistakes.filter(m => m.s === 'wrong').length;
  const taj = mistakes.filter(m => m.s === 'tajweed').length;
  const skip = mistakes.filter(m => m.s === 'skip').reduce((t, m) => t + m.n, 0);
  const body = $('#summaryBody');
  // A hifz test: log the review of this page, rated by how it went.
  let hifzNote = '';
  if (rec.hifz && attempted.length) {
    const q = wrong + skip === 0 ? (taj <= 2 ? 3 : 2) : wrong + skip <= 3 ? 2 : 1;
    const ps = [].concat(rec.hifz); ps.forEach(p => hifz.review(p, q));
    if (state.view === 'hifz') hifz.render();
    hifzNote = `<p class="hifz-logged">Saved to Hifz: ${hifz.pagesText(ps).toLowerCase()} · ${hifz.QNAME[q]}</p>`;
  }
  if (!attempted.length) {
    body.innerHTML = '<p>No recitation was heard. Check that the microphone is allowed, then tap the mic and start reciting.</p>';
  } else {
    const pct = Math.round((ok / attempted.length) * 100);
    const f = attempted[0], l = attempted[attempted.length - 1];
    const nextGi = Math.min(Q.gi(l.s, l.a) + 1, Q.all.length - 1);
    body.innerHTML = `
      <p>${esc(Q.ch(f.s).en)} ${f.s}:${f.a} to ${l.s}:${l.a} · <b>${pct}%</b> of words correct · ${fmtDuration(Date.now() - rec.startedAt)}</p>
      <div class="stats">
        <div class="s-ok"><b>${ok}</b><span>Correct</span></div>
        <div class="s-bad"><b>${wrong}</b><span>Mistakes</span></div>
        ${rec.phon ? `<div class="s-taj"><b>${taj}</b><span>Tajweed</span></div>` : ''}
        <div class="s-skip"><b>${skip}</b><span>Skipped</span></div>
      </div>
      ${mistakes.length ? `<ul class="mistakes">${mistakes.map(m => `
        <li>
          <span class="kind ${m.s}" title="${m.s === 'wrong' ? 'Laḥn jalī: a clear mistake in a letter, vowel or sukun' : m.s === 'tajweed' ? 'Laḥn khafī: a tajweed rule (madd, ghunnah, idgham, qalqalah…)' : ''}">${m.s === 'wrong' ? 'Clear mistake' : m.s === 'tajweed' ? 'Tajweed' : 'Skipped'}</span>
          <span class="ref">${m.w.s}:${m.w.a}</span>
          <span class="word" lang="ar">${esc(m.w.text)}</span>
          ${m.e ? `<span class="why">${m.e.map(x => esc(x.msg)).join('<br>')}</span>` : ''}
          <button class="icon-btn" type="button" data-listen="${m.w.s}:${m.w.a}" aria-label="Hear ayah ${m.w.s}:${m.w.a}"><svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg></button>
        </li>`).join('')}</ul>` : '<p>No mistakes. Well done.</p>'}
      <div class="qibla-actions">
        ${mistakes.length ? `<button class="btn primary" type="button" data-retry="${mistakes[0].w.s}:${mistakes[0].w.a}">Retry from ${mistakes[0].w.s}:${mistakes[0].w.a}</button>` : ''}
        <button class="btn" type="button" data-retry="${Q.all[nextGi].join(':')}">Continue reciting</button>
      </div>`;
  }
  if (rec.phon) body.insertAdjacentHTML('beforeend', `<p class="rec-save">Marked something wrongly? This recitation is kept on your phone (Settings → Your recitations). <button type="button" class="linkish" data-save-rec>Share it</button> to send it in.</p>`);
  if (hifzNote) body.insertAdjacentHTML('afterbegin', hifzNote);
  $('#summarySheet').showModal();
}

// Recitations are kept on this phone (IndexedDB): the last 5, each up to 15 minutes.
const recordings = {
  list() { return store.get('recordings', []); },
  async add(r) {
    if (!r || !r.blob) return;
    const w = rec.expected && rec.expected[0];
    const p = rec.expected && rec.expected[Math.max(0, Math.min((rec.lastPos || 1) - 1, rec.expected.length - 1))];
    const it = { id: 'rec:' + Date.now(), t: Date.now(), secs: r.seconds, from: w ? `${w.s}:${w.a}` : '', to: p ? `${p.s}:${p.a}` : '', name: w ? Q.ch(w.s).en : 'Recitation' };
    try { await bookFiles.put(it.id, r.blob); } catch (_) { return; }
    const all = [it].concat(this.list());
    all.slice(5).forEach(x => bookFiles.del(x.id));
    store.set('recordings', all.slice(0, 5));
    this.render();
  },
  fileName(it) { const d = new Date(it.t), z = n => String(n).padStart(2, '0'); return `tilawah-${it.from ? it.from.replace(':', '-') : 'recitation'}-${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}.wav`; },
  async blob(it) { const b = await bookFiles.get(it.id); if (!b) toast('That recording is no longer on this phone.', 'bad'); return b; },
  render() {
    const ul = $('#recList'); if (!ul) return;
    const l = this.list();
    ul.innerHTML = l.length ? l.map(it => `<li data-rec="${esc(it.id)}">
      <span class="rec-info"><b>${esc(it.name)}${it.from ? ` ${esc(it.from)}${it.to && it.to !== it.from ? `–${esc(it.to.split(':')[0] === it.from.split(':')[0] ? it.to.split(':')[1] : it.to)}` : ''}` : ''}</b>
        <small>${new Date(it.t).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · ${it.secs >= 60 ? Math.floor(it.secs / 60) + ' min ' : ''}${it.secs % 60} s</small></span>
      <button type="button" class="icon-btn" data-rec-act="play" aria-label="Play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button>
      <button type="button" class="icon-btn" data-rec-act="share" aria-label="Share"><svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v7h14v-7"/></svg></button>
      <button type="button" class="icon-btn" data-rec-act="dl" aria-label="Download"><svg viewBox="0 0 24 24"><path d="M12 4v12M7 11l5 5 5-5"/><path d="M5 20h14"/></svg></button>
      <button type="button" class="icon-btn" data-rec-act="del" aria-label="Delete"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </li>`).join('') : '<li class="rec-empty">No recitations yet. Recite with the mic and it appears here.</li>';
  },
  audio: null,
  async act(id, act) {
    const it = this.list().find(x => x.id === id); if (!it) return;
    if (act === 'del') { await bookFiles.del(id); store.set('recordings', this.list().filter(x => x.id !== id)); this.render(); return; }
    const b = await this.blob(it); if (!b) return;
    const name = this.fileName(it);
    if (act === 'play') {
      if (this.audio) { this.audio.pause(); URL.revokeObjectURL(this.audio.src); }
      if (this.playing === id) { this.playing = null; this.audio = null; return; }
      this.audio = new Audio(URL.createObjectURL(b)); this.playing = id; this.audio.onended = () => { this.playing = null; };
      this.audio.play().catch(() => toast('Couldn’t play the recording.', 'bad'));
      return;
    }
    if (act === 'share') {
      const file = new File([b], name, { type: 'audio/wav' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); } catch (e) { if (e && e.name !== 'AbortError') toast('Sharing didn’t work here. Try Download instead.', 'bad'); } return; }
      toast('Sharing files isn’t supported here, so it was downloaded instead.');
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.append(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  },
};
QuranSpeech.onRecording = r => recordings.add(r);
$('#recList').addEventListener('click', e => {
  e.preventDefault();
  const b = e.target.closest('[data-rec-act]'), li = e.target.closest('[data-rec]');
  if (b && li) recordings.act(li.dataset.rec, b.dataset.recAct);
});
function saveRecitation() { const l = recordings.list(); if (l.length) recordings.act(l[0].id, 'share'); else toast('No recitation saved yet.', 'bad'); }

$('#summaryBody').addEventListener('click', e => {
  if (e.target.closest('[data-save-rec]')) { e.preventDefault(); saveRecitation(); return; }
  const b = e.target.closest('button');
  if (!b) return;
  $('#summarySheet').close();
  if (b.dataset.listen) { const [s, a] = b.dataset.listen.split(':').map(Number); player.play(s, a, { once: true }); }
  else if (b.dataset.retry) { const [s, a] = b.dataset.retry.split(':').map(Number); rec.start(s, a); }
});

/* Translation or tafsir of one ayah, shown over the mushaf page. */
async function showAyahPanel(s, a, mode) {
  const card = $('#transCard');
  const key = `${s}:${a}:${mode}`;
  card.dataset.key = key;
  card.dataset.mode = mode;
  card.classList.toggle('long', mode === 'tafsir');
  card.querySelectorAll('[data-tc]').forEach(b => b.classList.toggle('active', b.dataset.tc === mode));
  $('#tcRef').textContent = `${Q.ch(s).en} ${s}:${a}`;
  $('#tcText').textContent = mode === 'tafsir' ? 'Loading tafsir…' : 'Loading translation…';
  card.hidden = false;
  $('#tcText').scrollTop = 0;
  try {
    if (mode === 'tafsir') {
      const g = await tafsirFor(s, a);
      if (card.dataset.key !== key) return;
      $('#tcRef').textContent = g ? `${Q.ch(s).en} ${ayahRange(s, g)}` : `${Q.ch(s).en} ${s}:${a}`;
      $('#tcText').textContent = '';
      if (g) $('#tcText').append(tafsirNode(g[2])); else $('#tcText').textContent = 'No tafsir found for this ayah.';
    } else {
      const t = await getTranslation(s);
      if (card.dataset.key === key) $('#tcText').textContent = t[a - 1] || 'No translation found for this ayah.';
    }
  } catch (_) {
    if (card.dataset.key === key) $('#tcText').textContent = `The ${mode === 'tafsir' ? 'tafsir' : 'translation'} could not load. Check your internet connection and try again.`;
  }
}

/* Reciter picker, opened from the player or Settings. */
function syncSpeed() {
  document.querySelectorAll('#speedRow [data-speed]').forEach(b => b.classList.toggle('active', Number(b.dataset.speed) === Number(settings.speed)));
}
$('#speedRow').addEventListener('click', e => {
  const b = e.target.closest('[data-speed]');
  if (!b) return;
  settings.speed = Number(b.dataset.speed); saveSettings(); player.applySpeed(); syncSpeed();
});

function openReciters() {
  syncSpeed();
  $('#reciterList').innerHTML = reciterGroups().map(([g, list]) => `<li class="ro-group">${g}</li>` + list.map(r => `
    <li><label class="reciter-opt">
      <input type="radio" name="reciter" value="${esc(r.id)}"${r.id === settings.reciter ? ' checked' : ''}>
      <span class="ro-text"><b>${esc(r.name)}</b><span>${esc(r.style || 'Murattal')}${r.missing ? ' · not every surah' : ''}</span></span>
      <span class="ro-ar" lang="ar">${esc(r.arabic)}</span>
    </label></li>`.replace('<li>', `<li data-find="${esc(reciterKey(r))}">`)).join('')).join('');
  $('#reciterSearch').value = ''; filterReciters();
  const cur = $('#reciterList input:checked'); if (cur) setTimeout(() => cur.closest('li').scrollIntoView({ block: 'center' }), 50);
  $('#reciterSheet').showModal();
}
// Search: English or Arabic, ignoring harakat, hamza forms, "al-", spaces and dashes.
function findKey(t) {
  return String(t || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/(^|\s)(al|el|ال)[\s-]?/g, '$1').replace(/[^a-z0-9\u0600-\u06ff]+/g, '');
}
function reciterKey(r) { return [r.name, r.arabic, r.style, r.id].map(findKey).join('|'); }
function filterReciters() {
  const q = findKey($('#reciterSearch').value);
  let any = false, group = null, groupHas = false;
  const close = () => { if (group) group.hidden = !groupHas; };
  $('#reciterList').querySelectorAll('li').forEach(li => {
    if (li.classList.contains('ro-group')) { close(); group = li; groupHas = false; return; }
    const hit = !q || li.dataset.find.includes(q);
    li.hidden = !hit; if (hit) { groupHas = true; any = true; }
  });
  close();
  $('#reciterNone').hidden = any;
}
$('#reciterSearch').addEventListener('input', filterReciters);
$('#reciterSearch').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const first = $('#reciterList li:not([hidden]) input'); if (first) { first.checked = true; setReciter(first.value); $('#reciterSheet').close(); } } });
function setReciter(id) {
  setTimeout(() => { offline.restart(); renderSurahList(); }, 300);
  if (!RECITERS.some(r => r.id === id)) return;
  settings.reciter = id; saveSettings();
  $('#setReciter').value = id;
  if (player.playing) { player.left = player.once ? 1 : Number(settings.repeat) || 1; player.start(); }
  toast(`Reciter: ${reciterName()}`);
}
$('#reciterList').addEventListener('change', e => { if (e.target.name === 'reciter') { setReciter(e.target.value); $('#reciterSheet').close(); } });


/* ------------------------------------------------------------------ */
/*  Notes, and the Saved screen (bookmarks, highlights, notes)         */
/* ------------------------------------------------------------------ */

// Ayah notes {"s:a": {text, t}}; book notes per PDF file [{id, page, text, quote, hl, color, t}].
const notes = {
  ayah() { return store.get('ayahNotes', {}); },
  setAyah(key, text) {
    const all = this.ayah();
    if (text && text.trim()) all[key] = { text: text.trim(), t: Date.now() }; else delete all[key];
    store.set('ayahNotes', all);
  },
  pdf(key) { return store.get('pdfNotes:' + key, []); },
  savePdf(key, list) { store.set('pdfNotes:' + key, list); },
};

// One note editor for everything.
const noteEditor = {
  cb: null,
  open({ title, quote, text, onSave, onDelete }) {
    $('#noteTitle').textContent = title || 'Note';
    $('#noteQuote').hidden = !quote; $('#noteQuote').textContent = quote || '';
    $('#noteText').value = text || '';
    $('#noteDelete').hidden = !onDelete;
    this.cb = { onSave, onDelete };
    $('#noteSheet').showModal();
    setTimeout(() => $('#noteText').focus(), 50);
  },
};
$('#noteForm').addEventListener('submit', e => {
  e.preventDefault();
  const cb = noteEditor.cb; noteEditor.cb = null;
  $('#noteSheet').close();
  if (cb && cb.onSave) cb.onSave($('#noteText').value);
});
$('#noteDelete').addEventListener('click', () => {
  const cb = noteEditor.cb; noteEditor.cb = null;
  $('#noteSheet').close();
  if (cb && cb.onDelete) cb.onDelete();
});

function editAyahNote(s, a) {
  const key = `${s}:${a}`, cur = notes.ayah()[key];
  noteEditor.open({
    title: `Note on ${Q.ch(s).en} ${key}`, text: cur ? cur.text : '',
    onSave: t => { notes.setAyah(key, t); toast(t.trim() ? 'Note saved.' : 'Note removed.'); mushaf.syncAyahBar(); },
    onDelete: cur ? () => { notes.setAyah(key, ''); toast('Note removed.'); mushaf.syncAyahBar(); } : null,
  });
}

// Everything saved on this phone, newest first.
function savedItems() {
  const items = [];
  const book = id => { const f = findBook(id); return f ? f.b : null; };
  bookmarks().forEach(b => { const c = Q.meta ? Q.surahsOnPage(b.p)[0] : null; items.push({ kind: 'page', rm: ['bookmarks', x => x.p === b.p], t: b.t || 0, href: `#page-${b.p}`, title: `Page ${b.p}`, sub: c ? `${c.en} · Juz ${Q.juzOfPage(b.p)}` : '', group: 'Mushaf pages' }); });
  ayahMarks().forEach(m => items.push({ kind: 'ayah', rm: ['ayahMarks', x => x.s === m.s && x.a === m.a], t: m.t || 0, href: `#page-${Q.ayahPage(m.s, m.a)}`, sel: `${m.s}:${m.a}`, title: `${Q.ch(m.s).en} ${m.s}:${m.a}`, sub: 'Bookmarked ayah', group: 'Ayahs' }));
  Object.entries(highlights()).forEach(([k, color]) => { const [s, a] = k.split(':').map(Number); items.push({ kind: 'hl', rm: ['highlights', k], t: 0, color, href: `#page-${Q.ayahPage(s, a)}`, sel: k, title: `${Q.ch(s).en} ${k}`, sub: 'Highlighted ayah', group: 'Ayahs' }); });
  Object.entries(notes.ayah()).forEach(([k, n]) => { const [s, a] = k.split(':').map(Number); items.push({ kind: 'anote', rm: ['ayahNotes', k], note: true, t: n.t, href: `#page-${Q.ayahPage(s, a)}`, sel: k, title: `${Q.ch(s).en} ${k}`, sub: n.text, group: 'Quran' }); });
  for (let i = 0; i < localStorage.length; i++) {
    const am = (localStorage.key(i) || '').match(/^tl:(arMarks|arHl):(.+)$/);
    if (!am) continue;
    const slug = am[2], name = store.get('arTitle:' + slug, slug), key = am[1] + ':' + slug;
    if (am[1] === 'arMarks') store.get(key, []).forEach(m => items.push({ kind: 'bpage', rm: [key, x => x.p === m.p && x.b === m.b], t: m.t || 0, href: `#ar-${slug}-${m.p}-b${m.b}`, title: m.text || 'Bookmark', sub: name, group: name }));
    else { const ts = store.get('arHlT:' + slug, {}); Object.entries(store.get(key, {})).forEach(([k, color]) => { const [p, b] = k.split(':'); const v = ts[k] || [0, '']; items.push({ kind: 'bhl', rm: [key, k], t: v[0], color, href: `#ar-${slug}-${p}-b${b}`, title: v[1] || 'Highlight', sub: name, book: name, group: name }); }); }
  }
  for (let i = 0; i < localStorage.length; i++) {
    const lk = localStorage.key(i) || '';
    const m = lk.match(/^tl:(pdfMarks|pdfHl|pdfNotes):(.+):(\d+)$/);
    if (!m) continue;
    const [, type, id, fi] = m, b = book(id);
    if (!b) continue;
    const name = b.title + (b.files.length > 1 ? ` · ${b.files[+fi].label}` : '');
    const list = store.get(`${type}:${id}:${fi}`, []);
    if (type === 'pdfMarks') list.forEach(n => items.push({ kind: 'bpage', rm: [`${type}:${id}:${fi}`, x => x === n], t: 0, href: `#read-${id}-${fi}-p${n}`, title: `Page ${n}`, sub: name, group: name }));
    if (type === 'pdfHl') list.forEach(h => items.push({ kind: 'bhl', rm: [`${type}:${id}:${fi}`, x => x === h || (h.id != null && x.id === h.id)], t: h.t || 0, color: h.color, href: `#read-${id}-${fi}-p${h.page}`, title: `Page ${h.page}`, sub: h.text || 'Highlight', book: name, group: name }));
    if (type === 'pdfNotes') list.forEach(n => items.push({ kind: 'bnote', rm: [`${type}:${id}:${fi}`, x => x.id === n.id], note: true, t: n.t || 0, color: n.color, href: `#read-${id}-${fi}-p${n.page}-n${n.id}`, title: `Page ${n.page}`, sub: n.text, quote: n.quote, book: name, group: name }));
  }
  return items.sort((x, y) => y.t - x.t);
}

const ICONS = {
  page: '<path d="M6 4h12v17l-6-4-6 4z"/>',
  ayah: '<path d="M6 4h12v17l-6-4-6 4z"/>',
  bpage: '<path d="M6 4h12v17l-6-4-6 4z"/>',
  hl: '<path d="M4 20h16M7 16l9-9 3 3-9 9H7z"/>',
  bhl: '<path d="M4 20h16M7 16l9-9 3 3-9 9H7z"/>',
  anote: '<path d="M5 4h10l4 4v12H5z"/><path d="M9 12h6M9 16h4"/>',
  bnote: '<path d="M5 4h10l4 4v12H5z"/><path d="M9 12h6M9 16h4"/>',
};
// Remove a saved item (from the home screen or the Saved tab), with Undo.
const savedShown = [];
function removeSaved(it) {
  const [key, match] = it.rm;
  const before = localStorage.getItem('tl:' + key);
  const v = store.get(key, typeof match === 'string' ? {} : []);
  if (Array.isArray(v)) { store.set(key, v.filter(x => !match(x))); }
  else { delete v[match]; store.set(key, v); }
  highlights.cache = null;
  const refresh = () => { renderSavedHome(); if (state.view === 'saved') saved.render(); paintWords(); };
  refresh();
  const what = it.note ? 'Note' : it.kind === 'hl' || it.kind === 'bhl' ? 'Highlight' : 'Bookmark';
  toast(`${what} removed.`);
  const el = $('#toast'), b = document.createElement('button');
  b.type = 'button'; b.className = 'toast-undo'; b.textContent = 'Undo';
  b.addEventListener('click', () => { if (before == null) localStorage.removeItem('tl:' + key); else localStorage.setItem('tl:' + key, before); highlights.cache = null; refresh(); el.hidden = true; });
  el.append(b);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 5000);
}
document.addEventListener('click', e => {
  const b = e.target.closest('.saved-rm');
  if (!b) return;
  e.preventDefault();
  const it = savedShown[+b.dataset.rm];
  if (it) removeSaved(it);
});
function savedRow(it, inGroup) {
  const n = savedShown.push(it) - 1;
  return `<li class="saved-item"><button type="button" class="saved-rm" data-rm="${n}" aria-label="Remove ${esc(it.title)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button><a class="saved-row" href="${it.href}"${it.sel ? ` data-select="${it.sel}"` : ''}>
    <span class="sr-icon k-${it.kind}${it.color ? ' c-' + it.color : ''}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[it.kind]}</svg></span>
    <span class="sr-text"><b>${esc(it.title)}${it.book && !inGroup ? ` <em>${esc(it.book)}</em>` : ''}</b>${it.quote ? `<q>${esc(it.quote)}</q>` : ''}<span>${esc(it.sub || '')}</span></span>
  </a></li>`;
}

const saved = {
  tab: 'marks',
  render() {
    $$('[data-saved-tab]').forEach(b => b.classList.toggle('active', b.dataset.savedTab === this.tab));
    const q = ($('#savedSearch').value || '').trim().toLowerCase();
    let items = savedItems().filter(it => (this.tab === 'notes') === !!it.note);
    if (q) items = items.filter(it => [it.title, it.sub, it.book, it.quote].join(' ').toLowerCase().includes(q));
    if (!items.length) {
      $('#savedBody').innerHTML = `<p class="note">${q ? 'Nothing matches your search.' : this.tab === 'notes'
        ? 'No notes yet. Select an ayah and tap Note, or in a book tap the note icon or select some text and tap Add note.'
        : 'Nothing saved yet. Bookmark or highlight ayahs and pages in the mushaf, or bookmark and highlight pages in the books.'}</p>`;
      return;
    }
    // Group: Quran first, then each book.
    const groups = new Map();
    items.forEach(it => { if (!groups.has(it.group)) groups.set(it.group, []); groups.get(it.group).push(it); });
    const order = ['Quran', 'Ayahs', 'Mushaf pages'];
    const keys = [...groups.keys()].sort((a, b) => (order.indexOf(a) < 0 ? 9 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 9 : order.indexOf(b)) || a.localeCompare(b));
    $('#savedBody').innerHTML = keys.map(k => `<h3 class="goto-h">${esc(k)}</h3><ul class="saved-list">${groups.get(k).map(it => savedRow(it, true)).join('')}</ul>`).join('');
  },
};
$$('[data-saved-tab]').forEach(b => b.addEventListener('click', () => { saved.tab = b.dataset.savedTab; saved.render(); }));
$('#savedSearch').addEventListener('input', () => saved.render());
// Opening a saved ayah selects it on its page.
document.addEventListener('click', e => {
  const a = e.target.closest('a.saved-row[data-select]');
  if (a) pendingSelect = a.dataset.select;
});
let pendingSelect = null;

// Home screen: the latest bookmarks and notes, with a link to all of them.
function renderSavedHome() {
  const box = $('#savedHome');
  if (!box) return;
  const items = Q.meta ? savedItems() : [];
  if (!items.length) { box.hidden = true; return; }
  box.hidden = false;
  // A row of cards, newest first, that scrolls sideways.
  box.innerHTML = `<div class="sh-head"><h2>Bookmarks and notes</h2><a href="#saved">See all (${items.length})</a></div>
    <ul class="saved-cards">${items.slice(0, 10).map(it => savedRow(it)).join('')}</ul>`;
}

/* ------------------------------------------------------------------ */
/*  Controls                                                           */
/* ------------------------------------------------------------------ */

function updateControls() {
  awake.check();
  const playSvg = player.playing ? '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/>' : '<path d="M7 5l12 7-12 7z"/>';
  document.querySelectorAll('.play-icon').forEach(svg => { svg.innerHTML = playSvg; });
  ['#playBtn', '#mPlay'].forEach(id => $(id).setAttribute('aria-label', player.playing ? 'Pause recitation' : 'Play recitation'));
  ['#micBtn', '#mMic'].forEach(id => {
    $(id).classList.toggle('on', rec.active);
    $(id).setAttribute('aria-label', rec.active ? 'Stop and check recitation' : 'Start reciting');
  });
  $('#heard').hidden = !rec.active;
  $('#reciterName').textContent = reciterName();
  const sp = Number(settings.speed) || 1;
  $('#mReciterName').textContent = reciterName() + (sp !== 1 ? ` · ${sp}×` : '');
  $('#reciterName').textContent = reciterName() + (sp !== 1 ? ` · ${sp}×` : '');
  const c = state.surahNum && Q.meta ? Q.ch(state.surahNum) : null;
  $('#playerAyah').textContent = rec.active ? 'Listening to you'
    : player.gi >= 0 && player.key() ? `Ayah ${player.key()}` : c ? `${c.ayahs} ayahs` : '';
  if (rec.active && state.view === 'mushaf') mushaf.setChrome(true);
  syncDock();
  if ($('#qaListenSub')) $('#qaListenSub').textContent = player.playing ? 'Playing · tap to pause' : player.active ? 'Paused · tap to resume' : 'Where you left off';
  // Small player: which ayah is playing, then the reciter.
  if ($('#dock').classList.contains('mini') && player.gi >= 0 && Q.meta) {
    const [ps, pa] = Q.all[player.gi];
    $('#reciterName').textContent = `${Q.ch(ps).en} ${ps}:${pa}`;
    $('#playerAyah').textContent = reciterName();
  }
}
// The player bar: always in the surah view; elsewhere (home, library, saved, qibla) a small
// one while a recitation is playing or paused.
function syncDock() {
  const dock = $('#dock'); if (!dock) return;
  const mini = !['surah', 'mushaf', 'pdf'].includes(state.view);
  dock.hidden = !(state.view === 'surah' || (mini && player.active && player.gi >= 0));
  dock.classList.toggle('mini', mini);
  $('.app').classList.toggle('dock-on', mini && !dock.hidden);
}

/* ------------------------------------------------------------------ */
/*  Qibla                                                              */
/* ------------------------------------------------------------------ */

const qibla = {
  ready: false, lat: null, lon: null, bearing: null, heading: null, aligned: false, listening: false,

  init() {
    if (this.ready) return;
    this.ready = true;
    this.drawDial();
    const saved = store.get('loc', null);
    if (saved) this.setLocation(saved.lat, saved.lon, true);
  },

  drawDial() {
    const c = 150;
    let ticks = '';
    for (let d = 0; d < 360; d += 5) {
      const long = d % 30 === 0;
      const r1 = 138, r2 = long ? 124 : 131;
      const a = (d - 90) * Math.PI / 180;
      ticks += `<line x1="${c + r1 * Math.cos(a)}" y1="${c + r1 * Math.sin(a)}" x2="${c + r2 * Math.cos(a)}" y2="${c + r2 * Math.sin(a)}" style="stroke:var(--muted)" stroke-width="${long ? 2 : 1}"/>`;
    }
    const labels = [['N', 0], ['E', 90], ['S', 180], ['W', 270]].map(([t, d]) => {
      const a = (d - 90) * Math.PI / 180;
      return `<text x="${c + 108 * Math.cos(a)}" y="${c + 108 * Math.sin(a)}" text-anchor="middle" dominant-baseline="central" font-size="16" font-weight="700" style="fill:${t === 'N' ? 'var(--bad)' : 'var(--ink)'};font-family:var(--font-ui)">${t}</text>`;
    }).join('');
    $('#dial').innerHTML = `
      <circle class="dial-face" cx="${c}" cy="${c}" r="142" style="fill:var(--surface);stroke:var(--line)" stroke-width="2"/>
      ${ticks}${labels}
      <g id="kaabaMark" style="display:none">
        <line x1="${c}" y1="${c}" x2="${c}" y2="64" style="stroke:var(--accent)" stroke-width="4" stroke-linecap="round"/>
        <rect x="${c - 13}" y="34" width="26" height="26" rx="3" style="fill:var(--ink)"/>
        <rect x="${c - 13}" y="41" width="26" height="4" style="fill:var(--gold)"/>
      </g>
      <circle cx="${c}" cy="${c}" r="7" style="fill:var(--accent)"/>`;
  },

  setLocation(lat, lon, silent) {
    this.lat = lat; this.lon = lon;
    const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
    const φ1 = rad(lat), φ2 = rad(KAABA.lat), Δλ = rad(KAABA.lon - lon);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    this.bearing = (deg(Math.atan2(y, x)) + 360) % 360;
    const Δφ = φ2 - φ1;
    const h = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const km = 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    $('#qBearing').textContent = `${Math.round(this.bearing)}° ${compassPoint(this.bearing)}`;
    $('#qDistance').textContent = `${Math.round(km).toLocaleString()} km`;
    $('#qLocation').textContent = `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
    const mark = $('#kaabaMark');
    mark.style.display = '';
    mark.setAttribute('transform', `rotate(${this.bearing} 150 150)`);
    store.set('loc', { lat, lon });
    this.render();
    if (!silent) toast('Location set.');
  },

  locate() {
    if (!navigator.geolocation) { toast('Location is not available in this browser. Enter coordinates instead.', 'bad'); return; }
    $('#qiblaState').textContent = 'Finding your location…';
    navigator.geolocation.getCurrentPosition(
      p => this.setLocation(p.coords.latitude, p.coords.longitude),
      () => { toast('Location access was blocked. Allow location for this site, or enter coordinates below.', 'bad'); this.render(); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 600000 });
  },

  async startCompass() {
    if (this.listening) return;
    if (typeof DeviceOrientationEvent === 'undefined') { toast('This device has no compass. Use the bearing shown to face the Qibla.', 'bad'); return; }
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        if (await DeviceOrientationEvent.requestPermission() !== 'granted') { toast('Compass access was denied.', 'bad'); return; }
      } catch (_) { toast('Compass access was denied.', 'bad'); return; }
    }
    const evt = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(evt, e => this.onOrient(e), true);
    this.listening = true;
    $('#compassBtn').textContent = 'Compass on';
    $('#compassBtn').disabled = true;
    setTimeout(() => { if (this.heading === null) toast('No compass readings. On a computer, use the bearing shown to face the Qibla.'); }, 3000);
  },

  onOrient(e) {
    let h = null;
    if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
    else if ((e.absolute || e.type === 'deviceorientationabsolute') && e.alpha != null) h = 360 - e.alpha;
    if (h == null) return;
    const so = (screen.orientation && screen.orientation.angle) || 0;
    this.heading = (h + so + 360) % 360;
    this.render();
  },

  render() {
    const st = $('#qiblaState');
    if (this.heading !== null) $('#dial').style.transform = `rotate(${-this.heading}deg)`;
    if (this.bearing === null) { st.textContent = 'Find your location to see the Qibla direction.'; return; }
    if (this.heading === null) {
      st.className = 'qibla-state';
      st.textContent = `Face ${Math.round(this.bearing)}° clockwise from north (${compassPoint(this.bearing)}).`;
      return;
    }
    const diff = ((this.bearing - this.heading + 540) % 360) - 180;
    const aligned = Math.abs(diff) < 5;
    if (aligned && !this.aligned) vibrate(120);
    this.aligned = aligned;
    $('#dialWrap').classList.toggle('aligned', aligned);
    st.className = 'qibla-state' + (aligned ? ' aligned' : '');
    st.textContent = aligned ? 'You are facing the Qibla' : `Turn ${diff > 0 ? 'right' : 'left'} ${Math.round(Math.abs(diff))}°`;
  },
};

function compassPoint(b) {
  return ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][Math.round(b / 22.5) % 16];
}

/* ------------------------------------------------------------------ */
/*  Library: hadith collections and books                              */
/* ------------------------------------------------------------------ */

const H = {
  index: null, indexP: null, chapters: new Map(),
  load() {
    if (!this.indexP) {
      this.indexP = fetchJSON(HADITH_BASE + 'index.json').then(x => { this.index = x; return x; });
      this.indexP.catch(() => { this.indexP = null; });
    }
    return this.indexP;
  },
  book(slug) { return this.index.find(b => b.slug === slug); },
  chapter(slug, i) {
    const k = slug + '/' + i;
    if (!this.chapters.has(k)) {
      const p = fetchJSON(`${HADITH_BASE}${slug}/${i}.json`);
      p.catch(() => this.chapters.delete(k));
      this.chapters.set(k, p);
    }
    return this.chapters.get(k);
  },
};

async function openLibrary(slug, ch, num) {
  showView('library');
  $('#backBtn').hidden = !slug;
  const box = $('#library');
  if (!slug) { setTitle('Library', 'Hadith and books'); await renderShelves(); return; }
  try { await H.load(); } catch (_) { box.innerHTML = '<p class="empty">The library could not load. Reload the page to try again.</p>'; return; }
  const b = H.book(slug);
  if (!b) { location.hash = 'library'; return; }
  if (!ch) renderBook(b); else await renderChapter(b, ch, num);
}

async function renderShelves() {
  const box = $('#library');
  box.innerHTML = '<p class="empty">Loading library…</p>';
  try { await H.load(); } catch (_) { box.innerHTML = '<p class="empty">The library could not load. Reload the page to try again.</p>'; return; }
  await arCatalog();
  const have = new Set(await bookFiles.keys());
  const tab = store.get('libTab', 'books');
  const card = b => `<a class="hbook" href="#hadith-${b.slug}">
      <span class="hb-ar" lang="ar">${esc(b.ar)}</span>
      <b>${esc(b.en)}</b>
      <span>${b.count.toLocaleString()} hadith${b.chapters.length > 1 ? ` · ${b.chapters.length} books` : ''}</span>${b.english === false || (b.english === undefined && b.slug === 'darimi') ? '<span class="chip">Arabic only</span>' : ''}</a>`;
  const docIcon = '<svg viewBox="0 0 24 24"><path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4"/></svg>';
  const bookRow = b => {
    const one = b.files.length === 1;
    const href = b.arOnly ? '#ar-' + b.ar : b.mine || (one && !b.ar) ? '#read-' + b.id + '-0' : '#book-' + b.id;
    const got = b.files.filter((_, i) => have.has(`${b.id}:${i}`)).length;
    const arb = b.ar && AR_BOOKS.find(a => a.slug === b.ar);
    const find = [b.title, b.author, arb && arb.title].filter(Boolean).join(' ');
    return `<li data-find="${esc(findKey(find))}"><a class="brow" href="${href}">
      <span class="brow-icon${b.ar ? ' ar' : ''}" aria-hidden="true"${b.ar ? ' lang="ar"' : ''}>${b.ar ? 'ع' : docIcon}</span>
      <span class="info"><b>${esc(b.title)}</b>${arb ? `<span class="brow-ar" lang="ar" dir="rtl">${esc(arb.title)}</span>` : ''}<span>${esc([b.author, b.note].filter(Boolean).join(' · '))}</span></span>
      ${b.mine ? `<button type="button" class="icon-btn brow-rm" data-rm-book="${esc(b.id)}" aria-label="Remove ${esc(b.title)} from this phone"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`
        : (got ? `<span class="brow-tags"><span class="chip on">${one ? 'PDF' : `${got}/${b.files.length} PDFs`} ✓</span></span>` : '')}</a></li>`;
  };
  const tabs = [['books', 'Books'], ['lectures', 'Lectures'], ['hadith', 'Hadith'], ['mine', 'My books']];
  let body = '';
  if (tab === 'lectures') {
    const ls = await lectures.catalog();
    // Grouped by book, in the order of the library's Arabic books.
    const order = AR_BOOKS.map(a => a.slug).filter(sl => ls.some(s => s.book === sl));
    body = `<p class="lib-note">Scholars explaining the books in Arabic. The book text follows along under the video, and you can take notes as you watch.</p>
      ${order.map(sl => { const b = AR_BOOKS.find(a => a.slug === sl) || { title: '' };
        return `<h2 class="lib-h lec-bh" lang="ar" dir="rtl">${esc(b.title)}</h2><ul class="blist">${ls.filter(s => s.book === sl).map(s => { const last = store.get('lecLast:' + s.id, 0);
          return `<li><a class="brow" href="#lec-${s.id}"><span class="brow-icon lec-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/></svg></span>
            <span class="info"><b>${esc(s.scholar)}</b><span class="brow-ar" lang="ar" dir="rtl">${esc(s.scholarAr)}</span><span>${s.count} lessons${last ? ` · on lesson ${last}` : ''}</span></span></a></li>`; }).join('')}</ul>`; }).join('')}`;
  } else if (tab === 'hadith') {
    body = `<h2 class="lib-h">The nine books <span class="lib-h-note">as published on Sunnah.com</span></h2><div class="hgrid">${H.index.filter(b => b.group === 'nine').map(card).join('')}</div>
      <h2 class="lib-h">Selections</h2><div class="hgrid">${H.index.filter(b => b.group === 'selections').map(card).join('')}</div>`;
  } else if (tab === 'mine') {
    const mine = myShelfItems();
    body = `<p class="lib-note">Any PDF from your phone. It stays on this phone, with your highlights and notes.</p>
      <button type="button" class="btn add-book" id="addBook"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> Add a book</button>
      ${mine.length ? `<ul class="blist">${mine.map(bookRow).join('')}</ul>` : ''}`;
  } else {
    const filt = store.get('libFilter', 'all');
    const groups = [['all', 'All'], ['arabic', 'In Arabic'], ...SHELVES.map(sh => [sh.id, sh.title])];
    body = `<div class="search lib-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input id="libSearch" type="search" placeholder="Search books (English or Arabic)" autocomplete="off"></div>
      <nav class="chips lib-filters" aria-label="Filter books">${groups.map(([id, t]) => `<button type="button" class="chip-btn${id === filt ? ' on' : ''}" data-filter="${id}">${esc(t)}</button>`).join('')}</nav>
      <p class="lib-note lib-how">Books marked <span lang="ar" class="ar-chip-inline">ع</span> open in the original Arabic right here. For the English translation, download the PDF once and it opens here, offline.</p>
      ${SHELVES.map(sh => `<section class="lib-group" data-group="${sh.id}"><h2 class="lib-h">${esc(sh.title)}${sh.arabic ? ` <span class="shelf-ar" lang="ar">${sh.arabic}</span>` : ''}</h2>
        <ul class="blist">${sh.items.map(b => bookRow(b).replace('<li ', `<li data-ar="${b.ar ? 1 : 0}" `)).join('')}</ul></section>`).join('')}
      <p class="empty" id="libNone" hidden>No book matches that.</p>`;
  }
  box.innerHTML = `<div class="mode-switch lib-tabs" role="tablist">${tabs.map(([id, t]) => `<button type="button" class="mode${id === tab ? ' active' : ''}" data-lib-tab="${id}" role="tab">${t}</button>`).join('')}</div>` + body;
  box.querySelector('.lib-tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-lib-tab]'); if (!b) return;
    store.set('libTab', b.dataset.libTab); renderShelves();
  });
  if (tab === 'mine') {
    $('#addBook').addEventListener('click', addMyBook);
    box.querySelectorAll('[data-rm-book]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); removeMyBook(b.dataset.rmBook); }));
  }
  if (tab === 'books') {
    const apply = () => {
      const q = findKey($('#libSearch').value), f = store.get('libFilter', 'all');
      let any = false;
      box.querySelectorAll('.lib-group').forEach(g => {
        let has = false;
        const groupOk = f === 'all' || f === 'arabic' || g.dataset.group === f;
        g.querySelectorAll('li').forEach(li => {
          const ok = groupOk && (f !== 'arabic' || li.dataset.ar === '1') && (!q || li.dataset.find.includes(q));
          li.hidden = !ok; if (ok) has = true;
        });
        g.hidden = !has; if (has) any = true;
      });
      $('#libNone').hidden = any;
    };
    $('#libSearch').addEventListener('input', apply);
    box.querySelector('.lib-filters').addEventListener('click', e => {
      const b = e.target.closest('[data-filter]'); if (!b) return;
      store.set('libFilter', b.dataset.filter);
      box.querySelectorAll('.lib-filters .chip-btn').forEach(x => x.classList.toggle('on', x === b));
      apply();
    });
    apply();
  }
}

/* The app hosts no books (the translations belong to their publishers). A reader gets a
   book from its publisher and adds the PDF here; it is kept on this phone only. */
const bookFiles = {
  db: null,
  open() {
    if (!this.db) this.db = new Promise((res, rej) => {
      const r = indexedDB.open('tilawah-books', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('files');
      r.onsuccess = () => res(r.result); r.onerror = () => { this.db = null; rej(r.error); };
    });
    return this.db;
  },
  async run(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => { const t = db.transaction('files', mode); const q = fn(t.objectStore('files')); t.oncomplete = () => res(q.result); t.onerror = t.onabort = () => rej(t.error); });
  },
  get(k) { return this.run('readonly', s => s.get(k)).catch(() => null); },
  put(k, v) { return this.run('readwrite', s => s.put(v, k)); },
  del(k) { return this.run('readwrite', s => s.delete(k)).catch(() => {}); },
  keys() { return this.run('readonly', s => s.getAllKeys()).catch(() => []); },
};
function myBooks() { return store.get('myBooks', []); }
const MY_SHELF = { id: 'mine', title: 'My books' };
function myShelfItems() { return myBooks().map(m => ({ id: m.id, title: m.title, author: 'Added on this phone', note: '', files: [{ label: 'PDF' }], mine: true })); }
function findBook(id) {
  const mine = myShelfItems().find(x => x.id === id);
  if (mine) return { b: mine, sh: MY_SHELF };
  for (const sh of SHELVES) { const b = sh.items.find(x => x.id === id); if (b) return { b, sh }; }
  return null;
}
// Where to get a book: its publisher's page if known, otherwise a web search for it.
function bookSourceUrl(b) {
  if (b.source) return b.source;
  return 'https://www.google.com/search?q=' + encodeURIComponent(`"${b.title.replace(/\s*\(.*\)\s*/g, ' ').trim()}" ${b.author || ''} ${b.publisher || ''} book`.replace(/\s+/g, ' '));
}
// Read a PDF the reader picked and keep it on this phone.
async function addBookFile(file, key) {
  if (!file) return false;
  let head = '';
  try { head = String.fromCharCode(...new Uint8Array(await file.slice(0, 1024).arrayBuffer())); } catch (_) {}
  if (!head.includes('%PDF-')) { toast(/\.pdf$/i.test(file.name) ? 'That PDF didn\u2019t finish downloading. Download it again, then add it.' : 'That file isn\u2019t a PDF.', 'bad'); return false; }
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    await bookFiles.put(key, new Blob([await file.arrayBuffer()], { type: 'application/pdf' }));
    return true;
  } catch (_) { toast('There isn\u2019t enough space on this phone to keep that book.', 'bad'); return false; }
}
// One file picker kept in the page (phones, iPhones above all, ignore a picker that
// isn't part of the page, and then nothing happens on tap).
let pdfPickCb = null;
function pickPdf(onFile) {
  let inp = document.getElementById('pdfPicker');
  if (!inp) {
    inp = document.createElement('input');
    inp.type = 'file'; inp.id = 'pdfPicker'; inp.accept = 'application/pdf,.pdf';
    inp.setAttribute('aria-hidden', 'true'); inp.tabIndex = -1;
    inp.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;';
    inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; const cb = pdfPickCb; pdfPickCb = null; inp.value = ''; if (f && cb) cb(f); });
    document.body.append(inp);
  }
  pdfPickCb = onFile;
  inp.value = '';
  inp.click();
}
async function addMyBook() {
  pickPdf(async f => {
    const id = 'my-' + Date.now().toString(36);
    if (!(await addBookFile(f, id + ':0'))) return;
    const title = f.name.replace(/\.pdf$/i, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Book';
    store.set('myBooks', [{ id, title, t: Date.now() }].concat(myBooks()));
    location.hash = 'read-' + id + '-0';
  });
}
// A PDF shared to the app: file it under the listed book it matches (by file name),
// otherwise under My books, then open it.
async function fileSharedBook() {
  const got = await bookFiles.get('inbox');
  if (!got || !got.blob) { location.hash = 'library'; return; }
  const base = n => decodeURIComponent(String(n || '')).toLowerCase().replace(/\.pdf$/, '').replace(/[^a-z0-9]+/g, '');
  const name = base(got.name);
  let key = null;
  for (const sh of SHELVES) for (const b of sh.items) b.files.forEach((f, i) => {
    if (!key && f.url && base(f.url.split('/').pop()) === name) key = [b.id, i];
  });
  if (!key) {
    const id = 'my-' + Date.now().toString(36);
    store.set('myBooks', [{ id, title: decodeURIComponent(got.name).replace(/\.pdf$/i, '').replace(/[_]+/g, ' ').trim() || 'Book', t: Date.now() }].concat(myBooks()));
    key = [id, 0];
  }
  try { await bookFiles.put(`${key[0]}:${key[1]}`, got.blob); await bookFiles.del('inbox'); }
  catch (_) { toast('There isn\u2019t enough space on this phone to keep that book.', 'bad'); location.hash = 'library'; return; }
  toast('Book added. It\u2019s on this phone now and opens offline.');
  location.replace('#read-' + key[0] + '-' + key[1]);
}
async function removeMyBook(id) {
  const m = myBooks().find(x => x.id === id); if (!m) return;
  store.set('myBooks', myBooks().filter(x => x.id !== id));
  await bookFiles.del(id + ':0');
  toast(`Removed \u201c${m.title}\u201d from this phone.`);
  if (state.view === 'library') renderShelves();
}

async function openBook(id) {
  showView('library');
  await arCatalog();
  const found = findBook(id);
  if (!found) { location.hash = 'library'; return; }
  const { b, sh } = found;
  $('#backBtn').hidden = false;
  state.libBack = 'library';
  setTitle(sh.title, b.title);
  const arb = b.ar && (AR_BOOKS.find(a => a.slug === b.ar) || null);
  $('#library').innerHTML = `
    <div class="book-head"><b class="bh-title">${esc(b.title)}</b><span>${esc(b.author)}</span></div>
    ${b.ar ? `<h3 class="bk-sub">Arabic original</h3>
    <ul class="blist"><li><a class="brow" href="#ar-${b.ar}"><span class="brow-icon ar" aria-hidden="true" lang="ar">ع</span>
      <span class="info"><b lang="ar" dir="rtl" class="ar-title">${esc(arb ? arb.title : '')}</b><span>${esc(b.arNote || 'Read the whole book in Arabic, here in the app.')}</span></span></a></li></ul>
    <h3 class="bk-sub">English translation</h3>` : ''}
    <ul class="blist">${b.files.map((f, i) => {
      const pos = store.get(`pdfPos:${b.id}:${i}`, null);
      return `<li><a class="brow" href="#read-${b.id}-${i}">
      <span class="brow-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4"/></svg></span>
      <span class="info"><b>${esc(b.files.length > 1 ? f.label : 'English translation (PDF)')}</b><span>${pos ? `Continue from page ${pos}` : 'Download it, then add it to read here'}</span></span></a></li>`;
    }).join('')}</ul>`;
  scrollTop();
}

function renderBook(b) {
  setTitle(b.en, `${b.count.toLocaleString()} hadith`);
  state.libBack = 'library';
  const box = $('#library');
  box.innerHTML = `
    <div class="book-head"><span class="hb-ar" lang="ar">${esc(b.ar)}</span><span>${esc(b.author)}</span>${b.english === false || (b.english === undefined && b.slug === 'darimi') ? '<span>Sunnah.com has no English translation of this collection yet.</span>' : ''}</div>
    <form class="hjump" id="hJump"${b.chapters.some(c => c.to) ? '' : ' hidden'}>
      <label for="hJumpNum">Go to hadith</label>
      <input id="hJumpNum" type="number" min="1" inputmode="numeric" placeholder="Number">
      <button class="btn small primary" type="submit">Go</button>
    </form>
    ${b.chapters.length === 1 ? '' : `<ol class="surah-list compact">${b.chapters.map((c, i) => `
      <li><a class="surah-row" href="#hadith-${b.slug}-${i + 1}"><span class="star">${i + 1}</span>
        <span class="info"><b>${esc(c.en || (c.ar ? '' : 'Book ' + (i + 1)))}</b><span>${c.n} hadith${c.to ? ` · ${c.from}–${c.to}` : ''}</span></span>
        <span class="arabic ch-ar" lang="ar">${esc(c.ar)}</span></a></li>`).join('')}</ol>`}`;
  $('#hJump').addEventListener('submit', e => {
    e.preventDefault();
    const n = +$('#hJumpNum').value;
    const i = b.chapters.findIndex(c => c.to && n >= c.from && n <= c.to);
    if (i < 0) { toast(`Enter a hadith number from 1 to ${b.chapters[b.chapters.length - 1].to}.`, 'bad'); return; }
    location.hash = `hadith-${b.slug}-${i + 1}-${n}`;
  });
  if (b.chapters.length === 1) renderChapter(b, 1, null, true);
}

// Sunnah.com references: a collection number ("1234", "3033a") or a book reference ("Book 1, Hadith 2").
const hadithRef = (b, ref) => /^\d+[a-z]?$/i.test(ref) ? `${b.en} ${ref}` : `${b.en}, ${ref}`;
const hadithId = ref => String(ref).toLowerCase().replace(/[^a-z0-9]+/g, '-');

async function renderChapter(b, i, num, inline) {
  const c = b.chapters[i - 1];
  if (!c) { location.hash = 'hadith-' + b.slug; return; }
  if (!inline) { setTitle(c.en || c.ar || b.en, b.en); state.libBack = b.chapters.length === 1 ? 'library' : 'hadith-' + b.slug; }
  const box = $('#library');
  const list = document.createElement('div');
  list.className = 'hlist';
  list.innerHTML = '<p class="empty">Loading hadith…</p>';
  if (inline) box.append(list); else { box.innerHTML = ''; box.append(list); }
  let rows, chapters = [];
  try {
    const data = await H.chapter(b.slug, i);
    // Sunnah.com format: {chapters, h: [ref, arabic, narrator, english, chapterIndex, grade]}
    if (Array.isArray(data)) rows = data.map(([n, ar, nar, en]) => [String(n), ar, nar, en, -1, '']);
    else { rows = data.h; chapters = data.chapters || []; }
  } catch (_) { list.innerHTML = '<p class="empty">This chapter could not load. Check your connection and try again.</p>'; return; }
  const head = inline ? '' : `<div class="book-head"><span class="hb-ar" lang="ar">${esc(c.ar)}</span><span>${esc(b.en)} · book ${i}${c.to ? ` · hadith ${c.from}–${c.to}` : ''}</span></div>`;
  let lastCh = -1;
  list.innerHTML = head + rows.map(([n, ar, nar, en, ch, grade]) => {
    let sub = '';
    if (ch != null && ch >= 0 && ch !== lastCh && chapters[ch]) {
      lastCh = ch;
      const [no, cen, car] = chapters[ch];
      sub = `<div class="h-chapter"><span>${esc([no, cen].filter(Boolean).join(' '))}</span>${car ? `<span class="hb-ar" lang="ar">${esc(car)}</span>` : ''}</div>`;
    }
    return sub + `
    <article class="hadith" id="h-${hadithId(n)}">
      <div class="h-top"><span class="h-ref">${esc(hadithRef(b, n))}</span>
        <button class="icon-btn" type="button" data-copy="${esc(n)}" aria-label="Copy hadith ${esc(n)}"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></button></div>
      ${ar ? `<p class="h-ar" dir="rtl" lang="ar">${esc(ar)}</p>` : ''}
      ${nar ? `<p class="h-nar">${esc(nar)}</p>` : ''}
      ${en ? `<p class="h-en">${esc(en)}</p>` : '<p class="h-en muted">No English translation is available for this hadith.</p>'}
      ${grade ? `<p class="h-grade">${esc(grade)}</p>` : ''}
    </article>`;
  }).join('') + (inline ? '' : `
    <nav class="h-pager">
      ${i > 1 ? `<a class="btn" href="#hadith-${b.slug}-${i - 1}">Previous book</a>` : '<span></span>'}
      ${i < b.chapters.length ? `<a class="btn primary" href="#hadith-${b.slug}-${i + 1}">Next book</a>` : ''}
    </nav>`);
  list.onclick = async e => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const row = rows.find(r => String(r[0]) === btn.dataset.copy);
    if (!row) return;
    const text = [row[1], [row[2], row[3]].filter(Boolean).join(' '), hadithRef(b, row[0])].filter(Boolean).join('\n\n');
    try { await navigator.clipboard.writeText(text); toast('Hadith copied.'); }
    catch (_) { toast('Copy is not available here. Select the text to copy it.', 'bad'); }
  };
  if (num) requestAnimationFrame(() => { const want = hadithId(String(num)); const el = document.getElementById('h-' + want) || [...list.querySelectorAll('.hadith')].find(x => new RegExp(`^h-${want}[a-z]$`).test(x.id)); if (el) { el.scrollIntoView({ block: 'start' }); el.classList.add('flash'); } });
  else if (!inline) scrollTop();
}

/* ------------------------------------------------------------------ */
/*  Arabic originals reader                                            */
/* ------------------------------------------------------------------ */

let AR_BOOKS = [];
async function arCatalog() {
  if (!AR_BOOKS.length) { try { AR_BOOKS = await (await fetch('arbooks/catalog.json')).json(); } catch (_) {} }
  return AR_BOOKS;
}
const arReader = {
  slug: null, idx: null, part: null, saveT: null,
  async index(slug) {
    if (this.slug === slug && this.idx) return this.idx;
    const r = await fetch(`arbooks/${slug}/index.json`);
    if (!r.ok) throw new Error(r.status);
    this.idx = await r.json(); this.slug = slug;
    return this.idx;
  },
  size() { return store.get('arSize', 21); },
  async open(slug, part, block) {
    showView('library');
    state.libBack = part == null ? 'library' : 'ar-' + slug;
    const box = $('#library');
    box.innerHTML = '<p class="empty">Opening the book…</p>';
    let idx;
    try { idx = await this.index(slug); } catch (_) { box.innerHTML = '<p class="empty">This book could not load. Check your connection and try again.</p>'; return; }
    $('#backBtn').hidden = false;
    if (part == null) { await lectures.catalog(); this.cover(slug, idx); return; }
    part = Math.max(0, Math.min(idx.parts - 1, part));
    setTitle(idx.title, idx.author);
    let blocks;
    try { blocks = await (await fetch(`arbooks/${slug}/p${part}.json`)).json(); }
    catch (_) { box.innerHTML = '<p class="empty">This part of the book could not load. Check your connection and try again.</p>'; return; }
    const hl = store.get('arHl:' + slug, {}), marks = new Set(store.get('arMarks:' + slug, []).map(m => m.p + ':' + m.b));
    store.set('arTitle:' + slug, idx.title);
    box.innerHTML = `
      <div class="arb-bar">
        <a class="btn small" href="#ar-${slug}">Contents</a>
        <span class="arb-pos">Part ${part + 1} of ${idx.parts}</span>
        <span class="arb-size"><button type="button" class="icon-btn" data-arb-size="-1" aria-label="Smaller text">A−</button><button type="button" class="icon-btn" data-arb-size="1" aria-label="Larger text">A+</button></span>
      </div>
      <article class="arb" dir="rtl" lang="ar" style="--arb-size:${this.size()}px">${blocks.map(([l, t], i) => {
        const k = part + ':' + i, hc = hl[k], bm = marks.has(k), cls = (hc ? ' hl-' + hc : '') + (bm ? ' bm' : '');
        return l ? `<h${l + 2} class="arb-h${cls}" data-b="${i}" id="arb-${i}">${esc(t)}</h${l + 2}>` : `<p class="${cls.trim()}" data-b="${i}" id="arb-${i}">${esc(t)}</p>`;
      }).join('')}</article>
      <nav class="h-pager">
        ${part > 0 ? `<a class="btn" href="#ar-${slug}-${part - 1}">Previous part</a>` : '<span></span>'}
        ${part < idx.parts - 1 ? `<a class="btn primary" href="#ar-${slug}-${part + 1}">Next part</a>` : ''}
      </nav>
      <p class="arb-credit">${esc(idx.title)} — text from the OpenITI corpus (CC BY-NC-SA 4.0), the author\u2019s words only.</p>`;
    this.part = part;
    box.querySelectorAll('[data-arb-size]').forEach(b => b.addEventListener('click', () => {
      const v = Math.max(15, Math.min(34, this.size() + 2 * +b.dataset.arbSize));
      store.set('arSize', v); box.querySelector('.arb').style.setProperty('--arb-size', v + 'px');
    }));
    const target = block != null ? block : (() => { const p = store.get('arPos:' + slug, null); return p && p[0] === part ? p[1] : null; })();
    if (target) { const el = document.getElementById('arb-' + target); if (el) setTimeout(() => el.scrollIntoView({ block: 'start' }), 30); else scrollTop(); }
    else scrollTop();
    store.set('arPos:' + slug, [part, target || 0]);
    // Remember the place as the reader scrolls.
    this.els = [...box.querySelectorAll('.arb [data-b]')];
    box.querySelector('.arb').addEventListener('click', e => { const el = e.target.closest('[data-b]'); if (el) this.select(el); });
    awake.check();
    // Keep the next part ready for reading offline.
    if (part < idx.parts - 1) fetch(`arbooks/${slug}/p${part + 1}.json`).catch(() => {});
  },
  scrolled() {
    if (state.view !== 'library' || !this.els || !this.els.length || !this.els[0].isConnected) return;
    clearTimeout(this.saveT);
    const slug = this.slug, part = this.part;
    this.saveT = setTimeout(() => {
      let cur = this.els[0];
      for (const el of this.els) { if (el.getBoundingClientRect().top > 90) break; cur = el; }
      if (cur) store.set('arPos:' + slug, [part, +cur.dataset.b]);
    }, 300);
  },
  // Tap a paragraph: highlight it in a colour or bookmark it.
  select(el) {
    const prev = document.querySelector('.arb .sel'); if (prev) prev.classList.remove('sel');
    if (this.selEl === el) { this.selEl = null; this.bar(false); return; }
    this.selEl = el; el.classList.add('sel'); this.bar(true);
  },
  bar(show) {
    let b = $('#arbBar');
    if (!b) {
      b = document.createElement('div'); b.id = 'arbBar'; b.className = 'arb-tools';
      b.innerHTML = `<div class="hl-swatches">${['yellow', 'green', 'blue', 'pink'].map(c => `<button type="button" class="sw" data-hl="${c}" aria-label="Highlight ${c}"></button>`).join('')}</div>
        <button type="button" class="icon-btn" data-arb-act="unhl" aria-label="Remove highlight"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        <button type="button" class="icon-btn" data-arb-act="mark" aria-label="Bookmark"><svg viewBox="0 0 24 24"><path d="M6 4h12v17l-6-4-6 4z"/></svg></button>
        <button type="button" class="icon-btn" data-arb-act="copy" aria-label="Copy"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></button>`;
      document.body.append(b);
      b.addEventListener('click', e => {
        const el = this.selEl; if (!el || !el.isConnected) { this.bar(false); return; }
        const k = this.part + ':' + el.dataset.b, sw = e.target.closest('[data-hl]'), act = e.target.closest('[data-arb-act]');
        const hl = store.get('arHl:' + this.slug, {});
        el.className = el.className.replace(/\s*hl-\w+/g, '');
        if (sw) { hl[k] = sw.dataset.hl; el.classList.add('hl-' + sw.dataset.hl); store.set('arHl:' + this.slug, hl); }
        else if (act && act.dataset.arbAct === 'unhl') { delete hl[k]; store.set('arHl:' + this.slug, hl); }
        else if (act && act.dataset.arbAct === 'mark') {
          let ms = store.get('arMarks:' + this.slug, []);
          const on = ms.some(m => m.p + ':' + m.b === k);
          ms = on ? ms.filter(m => m.p + ':' + m.b !== k) : [{ p: this.part, b: +el.dataset.b, t: Date.now(), text: el.textContent.slice(0, 90) }].concat(ms);
          store.set('arMarks:' + this.slug, ms); el.classList.toggle('bm', !on);
          toast(on ? 'Bookmark removed.' : 'Bookmarked. It\u2019s in Saved.');
          if (hl[k]) el.classList.add('hl-' + hl[k]);
          return;
        }
        else if (act && act.dataset.arbAct === 'copy') { navigator.clipboard && navigator.clipboard.writeText(el.textContent).then(() => toast('Copied.')).catch(() => {}); if (hl[k]) el.classList.add('hl-' + hl[k]); return; }
        const t = store.get('arHlT:' + this.slug, {}); if (hl[k]) t[k] = [Date.now(), el.textContent.slice(0, 90)]; else delete t[k]; store.set('arHlT:' + this.slug, t);
        el.classList.remove('sel'); this.selEl = null; this.bar(false);
      });
    }
    b.hidden = !show;
    if (show && this.selEl) { const k = this.part + ':' + this.selEl.dataset.b; b.querySelector('[data-arb-act="mark"]').classList.toggle('on', store.get('arMarks:' + this.slug, []).some(m => m.p + ':' + m.b === k)); }
  },
  cover(slug, idx) {
    this.els = null; this.selEl = null; this.bar(false);
    setTitle(idx.title, idx.author);
    const pos = store.get('arPos:' + slug, null);
    const box = $('#library');
    const tocs = idx.toc.filter(t => t[0] <= Math.min(2, Math.max(...idx.toc.map(x => x[0]), 1)));
    box.innerHTML = `
      <div class="book-head arb-head"><b class="bh-title" lang="ar" dir="rtl">${esc(idx.title)}</b><span lang="ar" dir="rtl">${esc(idx.author)}</span>
        <span>${idx.words.toLocaleString()} words · ${idx.parts} part${idx.parts > 1 ? 's' : ''}</span></div>
      <div class="pdf-get arb-actions">
        <a class="btn primary" href="#ar-${slug}-${pos ? pos[0] : 0}${pos && pos[1] ? '-b' + pos[1] : ''}">${pos ? 'Continue reading' : 'Start reading'}</a>
        <button type="button" class="btn" id="arbSave">Save for offline</button>
      </div>
      ${lectures.forBook(slug).map(l => `<a class="brow lec-link" href="#lec-${l.id}"><span class="brow-icon lec-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/></svg></span><span class="info"><b>Lessons on this book</b><span>${esc(l.scholar)} · ${l.count} lessons</span></span></a>`).join('')}
      ${tocs.length >= 3 && tocs.length <= 250 ? `<h3 class="bk-sub">Contents</h3><ol class="arb-toc" dir="rtl" lang="ar">${tocs.map(([l, t, p, b]) => `<li class="l${l}"><a href="#ar-${slug}-${p}-b${b}">${esc(t)}</a></li>`).join('')}</ol>`
        : `<h3 class="bk-sub">Parts</h3><ol class="arb-toc parts">${Array.from({ length: idx.parts }, (_, i) => { const f = idx.toc.find(t => t[2] === i); return `<li><a href="#ar-${slug}-${i}"><b>Part ${i + 1}</b>${f ? ` <span lang="ar" dir="rtl">${esc(f[1].slice(0, 70))}</span>` : ''}</a></li>`; }).join('')}</ol>`}
      <p class="arb-credit">Text from the OpenITI corpus (CC BY-NC-SA 4.0). Modern editors\u2019 introductions and footnote numbers are left out; the author\u2019s words are unchanged.</p>`;
    scrollTop();
    $('#arbSave').addEventListener('click', async e => {
      const btn = e.currentTarget; btn.disabled = true;
      let done = 0;
      try {
        for (let i = 0; i < idx.parts; i++) { const r = await fetch(`arbooks/${slug}/p${i}.json`); if (!r.ok) throw 0; await r.arrayBuffer(); btn.textContent = `Saving… ${Math.round(++done / idx.parts * 100)}%`; }
        btn.textContent = 'Saved for offline'; toast('The whole book is on this phone now.');
      } catch (_) { btn.disabled = false; btn.textContent = 'Save for offline'; toast('Couldn\u2019t save the book. Check your connection and try again.', 'bad'); }
    });
  },
};


/* Lectures: scholars explaining the books in Arabic, played through YouTube's own embedded player. The book text sits under the video and
   follows the lesson: from the lesson timings in lectures/<series>.json, and from places you mark
   yourself ("The shaykh is here"). Notes are kept per lesson with the video time and the place in
   the book. Everything you add stays on this phone. */
const lectures = {
  list: null, sync: {}, player: null, cur: null, timer: null, lastScroll: 0, nowKey: null,
  async catalog() {
    if (!this.list) { try { this.list = await (await fetch('lectures/catalog.json')).json(); } catch (_) { this.list = []; } }
    return this.list;
  },
  async series(id) { return (await this.catalog()).find(s => s.id === id) || null; },
  forBook(slug) { return (this.list || []).filter(s => s.book === slug); },
  count(s) { const f = this.sync[s.id]; return f && f.lessons ? f.lessons.length : s.count; },
  async syncFile(id) {
    if (!(id in this.sync)) { try { const r = await fetch(`lectures/${id}.json`); this.sync[id] = r.ok ? await r.json() : null; } catch (_) { this.sync[id] = null; } }
    return this.sync[id];
  },
  ids(id) { const f = this.sync[id]; return f && f.lessons ? f.lessons.map(l => l.v) : store.get('lecIds:' + id, []); },
  titles(id) { const f = this.sync[id], t = store.get('lecTitles:' + id, {}); if (f && f.lessons) f.lessons.forEach((l, i) => { if (l.title) t[i + 1] = l.title; }); return t; },
  prog(id) { return store.get('lecProg:' + id, {}); },
  notes(id) { return store.get('lecNotes:' + id, []); },
  fmt(t) { t = Math.max(0, Math.floor(t || 0)); const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); },
  // Where the book is at time t in lesson n: the last timing at or before t (the lesson's own
  // timings and the places you marked), else where the lesson before it ended, else the start.
  points(s, n) {
    const v = this.ids(s.id)[n - 1], f = this.sync[s.id], own = v ? store.get('lecSync:' + v, []) : [];
    const built = f && f.lessons ? ((f.lessons[n - 1] || {}).sync || []) : v && f && f.videos && f.videos[v] ? f.videos[v].sync || [] : [];
    return built.map(x => x.concat('b')).concat(own.map(x => x.concat('u'))).sort((a, b) => a[0] - b[0]);
  },
  startOf(s, n) {
    const pts = this.points(s, n); if (pts.length) return [pts[0][1], pts[0][2]];
    for (let k = n - 1; k >= 1; k--) { const q = this.points(s, k); if (q.length) { const l = q[q.length - 1]; return [l[1], l[2]]; } const e = store.get(`lecEnd:${s.id}:${k}`, null); if (e) return e; }
    return [0, 0];
  },
  at(s, n, t) {
    const pts = this.points(s, n); let hit = null;
    for (const x of pts) { if (x[0] <= t + 0.5) hit = x; else break; }
    return hit ? [hit[1], hit[2], hit[3]] : this.startOf(s, n).concat('s');
  },
  async page(id) {   // the series: its lessons, where you are, your notes
    const s = await this.series(id); if (!s) { location.hash = 'library'; return; }
    this.stop(); await arCatalog(); await this.syncFile(id);
    showView('library'); state.libBack = 'lectures'; $('#backBtn').hidden = false;
    const b = AR_BOOKS.find(a => a.slug === s.book) || { title: '' };
    setTitle(s.title || b.title, s.scholar);
    const prog = this.prog(id), titles = this.titles(id), notes = this.notes(id), last = store.get('lecLast:' + id, 0);
    $('#library').innerHTML = `
      <div class="book-head lec-head"><b class="bh-title" lang="ar" dir="rtl">${esc(b.title)}</b><span>${esc(s.scholar)} <span lang="ar" dir="rtl">· ${esc(s.scholarAr)}</span></span>
        <span>${s.count} lessons · in Arabic · ${esc(s.channel)} on YouTube</span></div>
      <div class="pdf-get arb-actions"><a class="btn primary" href="#lec-${id}-${last || 1}">${last ? `Continue lesson ${last}` : 'Start lesson 1'}</a>
        <a class="btn" href="#ar-${s.book}">Read the book</a></div>
      <p class="lib-note">The book follows along under the video. Plays from YouTube, so it needs internet.</p>
      <ol class="lec-list">${Array.from({ length: s.count }, (_, i) => { const n = i + 1, p = prog[n], nn = notes.filter(x => x.n === n).length;
        const pct = p && p[1] ? Math.min(100, Math.round(p[0] / p[1] * 100)) : 0;
        return `<li><a class="lec-row${n === last ? ' cur' : ''}" href="#lec-${id}-${n}"><span class="lec-n">${n}</span><span class="lec-t"><b>${titles[n] ? esc(titles[n]) : `Lesson ${n}`}</b>
          <small>${pct >= 95 ? 'Watched' : pct ? `${pct}% watched` : 'Not started'}${nn ? ` · ${nn} note${nn > 1 ? 's' : ''}` : ''}</small>${pct ? `<i class="lec-pg"><i style="width:${pct}%"></i></i>` : ''}</span></a></li>`; }).join('')}</ol>`;
    scrollTop();
  },
  async watch(id, n) {
    const s = await this.series(id); if (!s) { location.hash = 'library'; return; }
    n = Math.max(1, Math.min(s.count, n));
    await arCatalog(); await this.syncFile(id);
    showView('library'); state.libBack = 'lec-' + id; $('#backBtn').hidden = false;
    setTitle(`Lesson ${n} of ${s.count}`, s.scholar);
    const box = $('#library');
    let idx; try { idx = await arReader.index(s.book); } catch (_) { box.innerHTML = '<p class="empty">The book could not load. Check your connection and try again.</p>'; return; }
    store.set('lecLast:' + id, n);
    const parts = [];
    try { for (let p = 0; p < idx.parts; p++) parts.push(await (await fetch(`arbooks/${s.book}/p${p}.json`)).json()); }
    catch (_) { box.innerHTML = '<p class="empty">The book could not load. Check your connection and try again.</p>'; return; }
    const hl = store.get('arHl:' + s.book, {}), notes = this.notes(id);
    const noted = new Set(notes.map(x => x.p + ':' + x.b));
    const icon = (d, label, attr) => `<button type="button" class="icon-btn" ${attr} aria-label="${label}"><svg viewBox="0 0 24 24">${d}</svg></button>`;
    box.innerHTML = `
      <div class="lec-video"><div class="lec-frame"><div id="lecPlayer"></div>${navigator.onLine ? '' : '<p class="lec-off">You’re offline. Lectures play from YouTube, so connect to watch.</p>'}</div>
        <div class="lec-bar">
          ${icon('<path d="M15 6l-6 6 6 6"/>', 'Previous lesson', `data-lec="prev"${n === 1 ? ' disabled' : ''}`)}
          <button type="button" class="lec-follow on" data-lec="follow" aria-pressed="true"><i></i>Follow along</button>
          <span class="lec-sp"></span>
          ${icon('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>', 'Add a note here', 'data-lec="note"')}
          <button type="button" class="lec-notes-btn" data-lec="notes">Notes${notes.filter(x => x.n === n).length ? ` <b>${notes.filter(x => x.n === n).length}</b>` : ''}</button>
          ${icon('<path d="M9 6l6 6-6 6"/>', 'Next lesson', `data-lec="next"${n === s.count ? ' disabled' : ''}`)}
        </div></div>
      <p class="lec-hint" id="lecHint"></p>
      <article class="arb lec" dir="rtl" lang="ar" style="--arb-size:${arReader.size()}px">${parts.map((blocks, p) => blocks.map(([l, t], i) => {
        const k = p + ':' + i, cls = (hl[k] ? ' hl-' + hl[k] : '') + (noted.has(k) ? ' has-note' : '');
        return l ? `<h${l + 2} class="arb-h${cls}" data-p="${p}" data-b="${i}" id="lb-${p}-${i}">${esc(t)}</h${l + 2}>` : `<p class="${cls.trim()}" data-p="${p}" data-b="${i}" id="lb-${p}-${i}">${esc(t)}</p>`;
      }).join('')).join('')}</article>
      <p class="arb-credit">${esc(idx.title)} — text from the OpenITI corpus (CC BY-NC-SA 4.0). Lesson by ${esc(s.scholar)}, played from ${esc(s.channel)} on YouTube.</p>`;
    this.cur = { s, n, follow: true, t: 0 };
    this.layout();
    const [p0, b0] = this.startOf(s, n);
    this.show(p0, b0, true);
    this.hint();
    box.querySelector('.lec-bar').addEventListener('click', e => this.barClick(e));
    box.querySelector('.arb').addEventListener('click', e => { const el = e.target.closest('[data-b]'); if (el) this.pick(el); });
    this.lastScroll = 0;
    this.load(s, n);
    awake.check();
  },
  hint() {
    const c = this.cur, h = $('#lecHint'); if (!c || !h) return;
    const built = this.points(c.s, c.n).some(x => x[3] === 'b');
    h.textContent = built ? '' : 'Tap the paragraph the shaykh is reading and choose “The shaykh is here”. The text then follows this lesson by itself, every time you watch it.';
    h.hidden = built;
  },
  // YouTube's embedded player (privacy-enhanced host), loaded only when a lesson is opened.
  api() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (!this.apiP) this.apiP = new Promise((res, rej) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) try { prev(); } catch (_) {} res(window.YT); };
      const sc = document.createElement('script'); sc.src = 'https://www.youtube.com/iframe_api'; sc.async = true;
      sc.onerror = () => { this.apiP = null; rej(new Error('offline')); };
      document.head.append(sc);
    });
    return this.apiP;
  },
  async load(s, n) {
    let YT; try { YT = await this.api(); } catch (_) { return; }
    if (!this.cur || this.cur.s !== s || !document.getElementById('lecPlayer')) return;
    const resume = (this.prog(s.id)[n] || [0, 0]), start = resume[1] && resume[0] / resume[1] < 0.95 ? Math.floor(resume[0]) : 0;
    // Each lesson by its own video when the lessons are listed (a playlist's order can differ).
    const vid = this.ids(s.id)[n - 1], f = this.sync[s.id], byId = !!(f && f.lessons && vid);
    this.byId = byId;
    this.player = new YT.Player('lecPlayer', Object.assign({
      host: 'https://www.youtube-nocookie.com', width: '100%', height: '100%',
      playerVars: Object.assign({ playsinline: 1, rel: 0, start, autoplay: this.autoNext ? 1 : 0 }, byId ? {} : { listType: 'playlist', list: s.playlist, index: n - 1 }),
      events: {
        onReady: () => this.ready(),
        onStateChange: e => this.state(e.data),
      },
    }, byId ? { videoId: vid } : {}));
    this.autoNext = false;
  },
  ready() {
    const c = this.cur, pl = this.player; if (!c || !pl) return;
    try { const ids = !this.byId && pl.getPlaylist && pl.getPlaylist(); if (ids && ids.length) { store.set('lecIds:' + c.s.id, ids); this.hint(); const [p, b] = this.startOf(c.s, c.n); this.show(p, b, true); } } catch (_) {}
    const sk = store.get('lecSeek', null);
    if (sk && sk[0] === c.s.id && sk[1] === c.n) { store.set('lecSeek', null); this.seek(sk[2]); }
  },
  state(st) {
    const c = this.cur, pl = this.player; if (!c || !pl) return;
    // The playlist moved on to the next lesson by itself.
    try { const i = this.byId ? -1 : pl.getPlaylistIndex(); if (i >= 0 && i + 1 !== c.n) { this.save(); c.n = i + 1; store.set('lecLast:' + c.s.id, c.n); history.replaceState(null, '', '#lec-' + c.s.id + '-' + c.n); navStack[navStack.length - 1] = 'lec-' + c.s.id + '-' + c.n; setTitle(`Lesson ${c.n} of ${c.s.count}`, c.s.scholar); this.hint(); } } catch (_) {}
    try { const d = pl.getVideoData && pl.getVideoData(); if (d && d.title) { const t = this.titles(c.s.id); if (t[c.n] !== d.title) { t[c.n] = d.title; store.set('lecTitles:' + c.s.id, t); } } } catch (_) {}
    clearInterval(this.timer); this.timer = null;
    if (st === 1) this.timer = setInterval(() => this.tick(), 1000);   // only while it plays
    else this.save();
    if (st === 0) {
      const [p, b] = this.at(c.s, c.n, 1e9); store.set(`lecEnd:${c.s.id}:${c.n}`, [p, b]);
      // On to the next lesson.
      if (this.byId && c.n < this.count(c.s)) { this.autoNext = true; setTimeout(() => { if (this.cur === c) location.hash = `lec-${c.s.id}-${c.n + 1}`; }, 1500); }
    }
  },
  tick() {
    const c = this.cur, pl = this.player; if (!c || !pl || !pl.getCurrentTime) return;
    c.t = pl.getCurrentTime();
    const [p, b] = this.at(c.s, c.n, c.t);
    this.show(p, b, false);
    if (Math.floor(c.t) % 10 === 0) this.save();
  },
  save() {
    const c = this.cur, pl = this.player; if (!c || !pl || !pl.getCurrentTime) return;
    try { const t = pl.getCurrentTime(), d = pl.getDuration(); if (d > 0) { const pr = this.prog(c.s.id); pr[c.n] = [Math.round(t), Math.round(d)]; store.set('lecProg:' + c.s.id, pr); } } catch (_) {}
  },
  // Mark the passage being explained; scroll to it unless you've just scrolled the text yourself.
  show(p, b, force) {
    const key = p + ':' + b; if (key === this.nowKey && !force) return;
    this.nowKey = key;
    document.querySelectorAll('.arb.lec .now').forEach(el => el.classList.remove('now'));
    const el = document.getElementById(`lb-${p}-${b}`); if (!el) return;
    el.classList.add('now');
    if (this.cur && (force || (this.cur.follow && Date.now() - this.lastScroll > 6000))) {
      this.layout();
      this.autoAt = Date.now();
      el.scrollIntoView({ block: 'start', behavior: force ? 'auto' : 'smooth' });
    }
  },
  // The video stays pinned under the top bar; the passage scrolls in just below it.
  layout() {
    const tb = document.querySelector('.topbar'), vid = document.querySelector('.lec-video'), art = document.querySelector('.arb.lec');
    if (!vid || !art) return;
    const h = tb ? tb.getBoundingClientRect().height : 0;
    vid.style.top = h + 'px';
    art.style.setProperty('--lec-off', Math.round(h + vid.getBoundingClientRect().height + 12) + 'px');
  },
  scrolled() { if (this.cur && Date.now() - (this.autoAt || 0) > 900) this.lastScroll = Date.now(); },
  barClick(e) {
    const b = e.target.closest('[data-lec]'); if (!b || b.disabled) return;
    const c = this.cur; if (!c) return;
    const a = b.dataset.lec;
    if (a === 'prev' || a === 'next') { this.save(); location.hash = `lec-${c.s.id}-${c.n + (a === 'next' ? 1 : -1)}`; return; }
    if (a === 'follow') { c.follow = !c.follow; b.classList.toggle('on', c.follow); b.setAttribute('aria-pressed', c.follow); if (c.follow) { this.lastScroll = 0; this.nowKey = null; const [p, q] = this.at(c.s, c.n, this.time()); this.show(p, q, true); } return; }
    if (a === 'note') { const now = document.querySelector('.arb.lec .now'); this.noteSheet(now ? +now.dataset.p : 0, now ? +now.dataset.b : 0); return; }
    if (a === 'notes') this.notesSheet();
  },
  time() { try { return this.player && this.player.getCurrentTime ? this.player.getCurrentTime() : 0; } catch (_) { return 0; } },
  pause() { try { this.player && this.player.pauseVideo && this.player.pauseVideo(); } catch (_) {} },
  seek(t) { try { if (this.player && this.player.seekTo) { this.player.seekTo(t, true); this.player.playVideo(); } } catch (_) {} },
  // Tap a paragraph: the shaykh is here / note / highlight.
  pick(el) {
    const prev = document.querySelector('.arb.lec .sel'); if (prev) prev.classList.remove('sel');
    let bar = $('#lecTools');
    if (this.selEl === el && bar && !bar.hidden) { this.selEl = null; bar.hidden = true; return; }
    this.selEl = el; el.classList.add('sel');
    if (!bar) {
      bar = document.createElement('div'); bar.id = 'lecTools'; bar.className = 'arb-tools lec-tools';
      bar.innerHTML = `<button type="button" class="btn small primary" data-lt="here">The shaykh is here</button>
        <button type="button" class="btn small" data-lt="note">Note</button>
        <div class="hl-swatches">${['yellow', 'green', 'blue', 'pink'].map(c => `<button type="button" class="sw" data-hl="${c}" aria-label="Highlight ${c}"></button>`).join('')}</div>
        <button type="button" class="icon-btn" data-lt="unhl" aria-label="Remove highlight"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
      document.body.append(bar);
      bar.addEventListener('click', e => this.toolClick(e));
    }
    bar.hidden = false;
  },
  closeTools() { const bar = $('#lecTools'); if (bar) bar.hidden = true; if (this.selEl) this.selEl.classList.remove('sel'); this.selEl = null; },
  toolClick(e) {
    const el = this.selEl, c = this.cur; if (!el || !el.isConnected || !c) { this.closeTools(); return; }
    const p = +el.dataset.p, b = +el.dataset.b, k = p + ':' + b;
    const sw = e.target.closest('[data-hl]'), a = e.target.closest('[data-lt]');
    if (sw || (a && a.dataset.lt === 'unhl')) {
      const hl = store.get('arHl:' + c.s.book, {}); el.className = el.className.replace(/\s*hl-\w+/g, '');
      if (sw) { hl[k] = sw.dataset.hl; el.classList.add('hl-' + sw.dataset.hl); } else delete hl[k];
      store.set('arHl:' + c.s.book, hl);
      const t = store.get('arHlT:' + c.s.book, {}); if (hl[k]) t[k] = [Date.now(), el.textContent.slice(0, 90)]; else delete t[k]; store.set('arHlT:' + c.s.book, t);
      this.closeTools(); return;
    }
    if (!a) return;
    if (a.dataset.lt === 'here') {
      const v = this.ids(c.s.id)[c.n - 1];
      if (!v) { toast('Start the video first, then mark the place.', 'warn'); return; }
      const t = Math.round(this.time() * 10) / 10;
      const own = store.get('lecSync:' + v, []).filter(x => Math.abs(x[0] - t) > 3);
      own.push([t, p, b]); own.sort((x, y) => x[0] - y[0]); store.set('lecSync:' + v, own);
      this.closeTools(); this.nowKey = null; this.lastScroll = 0; this.show(p, b, false); this.hint();
      toast(`Marked at ${this.fmt(t)}. The text follows from here.`); return;
    }
    if (a.dataset.lt === 'note') { this.closeTools(); this.noteSheet(p, b); }
  },
  noteSheet(p, b, edit) {
    const c = this.cur; if (!c) return;
    const t = edit ? edit.t : this.time();
    const el = document.getElementById(`lb-${p}-${b}`);
    this.pause();
    $('#lecNoteBody').innerHTML = `<p class="lec-at"><span class="lec-chip">${this.fmt(t)}</span> Lesson ${c.n}</p>
      ${el ? `<blockquote class="lec-q" dir="rtl" lang="ar">${esc(el.textContent.slice(0, 160))}${el.textContent.length > 160 ? '…' : ''}</blockquote>` : ''}
      <textarea id="lecNoteText" rows="5" placeholder="Your note">${edit ? esc(edit.text) : ''}</textarea>
      <div class="lec-note-acts">${edit ? '<button type="button" class="btn" data-ln="del">Delete</button>' : ''}<button type="button" class="btn primary" data-ln="save">Save note</button></div>`;
    const sh = $('#lecNoteSheet');
    sh.querySelector('[data-ln="save"]').onclick = () => {
      const text = $('#lecNoteText').value.trim(); if (!text) { $('#lecNoteText').focus(); return; }
      let ns = this.notes(c.s.id);
      if (edit) ns = ns.map(x => x.at === edit.at ? Object.assign({}, x, { text }) : x);
      else ns.push({ n: c.n, t: Math.round(t), p, b, text, at: Date.now() });
      store.set('lecNotes:' + c.s.id, ns); sh.close(); this.marks(); toast('Note saved.');
    };
    const del = sh.querySelector('[data-ln="del"]');
    if (del) del.onclick = () => { store.set('lecNotes:' + c.s.id, this.notes(c.s.id).filter(x => x.at !== edit.at)); sh.close(); this.marks(); toast('Note deleted.'); };
    if (!sh.open) sh.showModal();
    setTimeout(() => $('#lecNoteText').focus(), 50);
  },
  marks() {   // refresh note markers and the count
    const c = this.cur; if (!c) return;
    const ns = this.notes(c.s.id), set = new Set(ns.map(x => x.p + ':' + x.b));
    document.querySelectorAll('.arb.lec [data-b]').forEach(el => el.classList.toggle('has-note', set.has(el.dataset.p + ':' + el.dataset.b)));
    const k = ns.filter(x => x.n === c.n).length, btn = document.querySelector('[data-lec="notes"]');
    if (btn) btn.innerHTML = `Notes${k ? ` <b>${k}</b>` : ''}`;
  },
  notesSheet(all) {
    const c = this.cur; if (!c) return;
    const ns = this.notes(c.s.id).filter(x => all || x.n === c.n).sort((a, b) => a.n - b.n || a.t - b.t);
    const body = $('#lecNotesBody');
    body.innerHTML = `<div class="mode-switch small"><button type="button" class="mode${all ? '' : ' active'}" data-nl="this">This lesson</button><button type="button" class="mode${all ? ' active' : ''}" data-nl="all">All lessons</button></div>
      ${ns.length ? `<ul class="lec-nlist">${ns.map(x => `<li><button type="button" class="lec-nrow" data-at="${x.at}"><span class="lec-chip">${all ? `L${x.n} · ` : ''}${this.fmt(x.t)}</span><span>${esc(x.text)}</span></button><button type="button" class="hz-link" data-edit="${x.at}">Edit</button></li>`).join('')}</ul>`
        : `<p class="lib-note">${all ? 'No notes yet.' : 'No notes on this lesson yet. Tap the pencil while you watch, or tap a paragraph and choose Note.'}</p>`}`;
    body.onclick = e => {
      const m = e.target.closest('[data-nl]'); if (m) { this.notesSheet(m.dataset.nl === 'all'); return; }
      const ed = e.target.closest('[data-edit]'); const row = e.target.closest('[data-at]');
      const x = ed ? this.notes(c.s.id).find(y => y.at === +ed.dataset.edit) : row ? this.notes(c.s.id).find(y => y.at === +row.dataset.at) : null;
      if (!x) return;
      if (ed) { $('#lecNotesSheet').close(); this.noteSheet(x.p, x.b, x); return; }
      $('#lecNotesSheet').close();
      if (x.n !== c.n) { store.set('lecSeek', [c.s.id, x.n, x.t]); location.hash = `lec-${c.s.id}-${x.n}`; return; }
      this.seek(x.t); this.nowKey = null; this.lastScroll = Date.now(); this.show(x.p, x.b, true);
    };
    if (!$('#lecNotesSheet').open) $('#lecNotesSheet').showModal();
  },
  stop() {
    clearInterval(this.timer); this.timer = null;
    if (this.player) { this.save(); try { this.player.destroy(); } catch (_) {} }
    this.player = null; this.cur = null; this.nowKey = null; this.closeTools();
  },
};

/* ------------------------------------------------------------------ */
/*  Book reader (PDF.js)                                               */
/* ------------------------------------------------------------------ */

let pdfjsReady = null;
function loadPdfJs() {
  if (!pdfjsReady) {
    pdfjsReady = new Promise((resolve, reject) => {
      if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
      const s = document.createElement('script');
      s.src = 'vendor/pdf.min.js';
      s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js'; resolve(window.pdfjsLib); };
      s.onerror = () => { pdfjsReady = null; reject(new Error('Could not load the book reader')); };
      document.head.append(s);
    });
  }
  return pdfjsReady;
}


const pdfReader = {
  doc: null, task: null, id: null, fi: 0, zoom: 1, page: 1, token: 0, observer: null, rendered: new Map(),

  async open(id, fi, opts = {}) {
    const found = findBook(id);
    if (!found || !found.b.files[fi]) { location.hash = 'library'; return; }
    const { b } = found;
    const file = b.files[fi];
    showView('pdf');
    this.close(true);
    const t = ++this.token;
    this.id = id; this.fi = fi;
    $('#pdfTitle').textContent = b.title;
    $('#pdfSub').textContent = b.files.length > 1 ? file.label : b.author;
    $('#pdfPages').innerHTML = '';
    $('#pdfPageCount').textContent = '';
    const st = $('#pdfStatus');
    st.hidden = false;
    st.innerHTML = '<span class="spinner" aria-hidden="true"></span><p>Opening the book…</p>';
    let lib;
    try { lib = await loadPdfJs(); } catch (_) { this.fail(b, fi); return; }
    let doc = null;
    const blob = await bookFiles.get(`${id}:${fi}`);
    if (t !== this.token) return;
    if (!blob) { this.need(b, fi); return; }
    try {
      const data = new Uint8Array(await blob.arrayBuffer());
      if (t !== this.token) return;
      this.task = lib.getDocument({ data });
      doc = await this.task.promise;
    } catch (_) { if (t !== this.token) return; }
    if (t !== this.token) { doc && doc.destroy(); return; }
    if (!doc) { this.fail(b, fi); return; }
    this.doc = doc;
    st.hidden = true;
    $('#pdfPageCount').textContent = `of ${doc.numPages}`;
    $('#pdfPageNum').max = doc.numPages;
    await this.layout();
    const saved = store.get(`pdfPos:${id}:${fi}`, 1);
    const target = Math.min(opts.page || saved, doc.numPages);
    this.goTo(target, 'auto');
    if (opts.page) setTimeout(() => this.flash(target, opts.note), 700);
  },

  fail(b, fi) {
    const st = $('#pdfStatus');
    st.hidden = false;
    st.innerHTML = `<p>This PDF couldn\u2019t be opened. It may be damaged or protected.</p>
      <div class="pdf-get"><button type="button" class="btn" id="pdfReplace">Choose another PDF</button></div>`;
    $('#pdfReplace').addEventListener('click', () => this.addFor(b, fi));
  },
  // The book isn't on this phone yet: where to get it, and a button to add the PDF.
  need(b, fi) {
    const st = $('#pdfStatus');
    st.hidden = false;
    const file = b.files[fi];
    st.innerHTML = `<div class="pdf-need">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4"/></svg>
      <p><b>${esc(b.title)}</b>${b.files.length > 1 ? ` \u00b7 ${esc(file.label)}` : ''}</p>
      <p>This translation belongs to its publisher${b.publisher ? ` (${esc(b.publisher)})` : ''}, so it isn\u2019t stored in the app. Download the PDF, then tap <b>Add the PDF</b> and choose it. It stays on this phone and opens here with your highlights and notes.</p>
      <div class="pdf-get">
        <a class="btn" href="${esc(file.url && /^https?:/.test(file.url) ? file.url : bookSourceUrl(b))}" target="_blank" rel="noopener" download>Download the PDF</a>
        <button type="button" class="btn primary" id="pdfAdd">Add the PDF</button>
      </div>
      <p class="pdf-hint" hidden>${isIOS ? 'On iPhone: when the PDF opens, tap Share \u2192 Save to Files. Then come back here, tap Add the PDF and choose it (Browse \u2192 Downloads or On My iPhone).' : 'When the download finishes, open it and tap Share \u2192 Tilawah (with the app on your home screen), or come back here, tap Add the PDF and choose it from Downloads.'}</p></div>`;
    $('#pdfAdd').addEventListener('click', () => this.addFor(b, fi));
    st.querySelector('.pdf-get a').addEventListener('click', () => {
      const hint = st.querySelector('.pdf-hint'); if (hint) hint.hidden = false;
    });
  },
  addFor(b, fi) {
    pickPdf(async f => {
      const st = $('#pdfStatus'); st.hidden = false;
      st.innerHTML = '<span class="spinner" aria-hidden="true"></span><p>Adding the book…</p>';
      if (await addBookFile(f, `${b.id}:${fi}`)) { toast('Book added. It\u2019s on this phone now and opens offline.'); this.open(b.id, fi); }
      else this.need(b, fi);
    });
  },

  // Lay out a placeholder for every page, sized from the first page, and draw pages as they scroll into view.
  async layout() {
    const doc = this.doc;
    const first = await doc.getPage(1);
    const vp = first.getViewport({ scale: 1 });
    const width = Math.min($('#pdfScroll').clientWidth - 16, 900) * this.zoom;
    this.baseRatio = vp.height / vp.width;
    const pages = $('#pdfPages');
    pages.innerHTML = '';
    pages.style.width = width + 'px';
    this.rendered.clear();
    if (this.observer) this.observer.disconnect();
    this.observer = new IntersectionObserver(entries => entries.forEach(e => {
      const n = +e.target.dataset.page;
      if (e.isIntersecting) this.draw(n, e.target); else this.undraw(n, e.target);
    }), { root: $('#pdfScroll'), rootMargin: '150% 0px' });
    for (let n = 1; n <= doc.numPages; n++) {
      const box = document.createElement('div');
      box.className = 'pdf-page';
      box.dataset.page = n;
      box.style.height = Math.round(width * this.baseRatio) + 'px';
      box.innerHTML = `<span class="pdf-num">${n}</span>`;
      pages.append(box);
      this.observer.observe(box);
    }
  },

  async draw(n, box) {
    if (this.rendered.has(n) || !this.doc) return;
    const t = this.token;
    this.rendered.set(n, null);
    try {
      const page = await this.doc.getPage(n);
      if (t !== this.token) return;
      const w = box.clientWidth;
      const vp1 = page.getViewport({ scale: 1 });
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const vp = page.getViewport({ scale: (w / vp1.width) * dpr });
      const c = document.createElement('canvas');
      c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      box.style.height = Math.round(vp.height / dpr) + 'px';
      await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      if (t !== this.token || !this.rendered.has(n)) return;
      box.querySelectorAll('canvas, .textLayer, .hlLayer').forEach(x => x.remove());
      box.append(c);
      const hl = document.createElement('div');
      hl.className = 'hlLayer';
      box.append(hl);
      this.paintHighlights(n, box);
      // Invisible, selectable text over the page, so passages can be highlighted.
      const tl = document.createElement('div');
      tl.className = 'textLayer';
      const cssVp = page.getViewport({ scale: w / vp1.width });
      tl.style.setProperty('--scale-factor', cssVp.scale);
      box.append(tl);
      try {
        await window.pdfjsLib.renderTextLayer({ textContentSource: page.streamTextContent(), container: tl, viewport: cssVp, textDivs: [] }).promise;
        if (!tl.textContent.trim()) box.classList.add('no-text');
      } catch (_) {}
      this.rendered.set(n, c);
    } catch (_) { this.rendered.delete(n); }
  },

  undraw(n, box) {
    if (!this.rendered.has(n)) return;
    this.rendered.delete(n);
    box.querySelectorAll('canvas, .textLayer, .hlLayer').forEach(x => x.remove());
  },

  key() { return `${this.id}:${this.fi}`; },
  marks() { return store.get('pdfMarks:' + this.key(), []); },
  hls() { return store.get('pdfHl:' + this.key(), []); },

  paintHighlights(n, box) {
    const layer = box.querySelector('.hlLayer');
    if (!layer) return;
    layer.innerHTML = '';
    // Note markers: next to their highlight, or down the page's edge.
    box.querySelectorAll('.pnote').forEach(x => x.remove());
    const hls = this.hls();
    this.notes().filter(x => x.page === n).forEach((x, i) => {
      const h = x.hl && hls.find(y => y.id === x.hl);
      const r = h && h.rects[0];
      const m = document.createElement('button');
      m.type = 'button'; m.className = 'pnote'; m.dataset.note = x.id;
      m.setAttribute('aria-label', 'Open note: ' + x.text.slice(0, 60));
      m.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 4h10l4 4v12H5z"/><path d="M9 12h6M9 16h4"/></svg>';
      m.style.top = r ? `calc(${r[1] * 100}% - 6px)` : `${4 + i * 7}%`;
      box.append(m);
    });
    this.hls().filter(h => h.page === n).forEach(h => h.rects.forEach(([x, y, w, ht]) => {
      const d = document.createElement('div');
      d.className = 'phl phl-' + h.color;
      d.style.cssText = `left:${x * 100}%;top:${y * 100}%;width:${w * 100}%;height:${ht * 100}%`;
      layer.append(d);
    }));
  },

  repaint(n) {
    const box = $('#pdfPages').children[n - 1];
    if (box) this.paintHighlights(n, box);
  },

  // Save the current text selection as a highlight on its page.
  highlightSelection(color, withNote) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const byPage = new Map();
    for (const r of range.getClientRects()) {
      if (r.width < 1 || r.height < 1) continue;
      const box = [...$('#pdfPages').children].find(b => { const p = b.getBoundingClientRect(); return r.top + r.height / 2 >= p.top && r.top + r.height / 2 <= p.bottom; });
      if (!box) continue;
      const p = box.getBoundingClientRect();
      const n = +box.dataset.page;
      if (!byPage.has(n)) byPage.set(n, []);
      byPage.get(n).push([(r.left - p.left) / p.width, (r.top - p.top) / p.height, r.width / p.width, r.height / p.height]);
    }
    if (!byPage.size) return;
    const list = this.hls();
    const text = sel.toString().replace(/\s+/g, ' ').trim().slice(0, 300);
    const made = [];
    byPage.forEach((rects, page) => { const h = { id: Date.now() + made.length, page, rects, color, text, t: Date.now() }; list.push(h); made.push(h); });
    store.set('pdfHl:' + this.key(), list);
    byPage.forEach((_, page) => this.repaint(page));
    sel.removeAllRanges();
    $('#pdfHlBar').hidden = true;
    if (withNote) this.editNote(null, { page: made[0].page, quote: text, hl: made[0].id, color });
    else toast('Highlighted.');
  },

  // Notes on this book: on a page, or on a highlighted passage.
  notes() { return notes.pdf(this.key()); },
  editNote(id, fresh) {
    const list = this.notes();
    const n = id != null ? list.find(x => x.id === id) : null;
    const page = n ? n.page : fresh.page;
    noteEditor.open({
      title: `Note · page ${page}`, quote: n ? n.quote : fresh.quote, text: n ? n.text : '',
      onSave: text => {
        const all = this.notes();
        if (!text.trim()) { if (n) { this.savePdfNotes(all.filter(x => x.id !== n.id)); toast('Note removed.'); } this.repaint(page); return; }
        if (n) { const x = all.find(y => y.id === n.id); if (x) { x.text = text.trim(); x.t = Date.now(); } }
        else all.push({ id: Date.now(), page, text: text.trim(), quote: fresh.quote || '', hl: fresh.hl || null, color: fresh.color || null, t: Date.now() });
        this.savePdfNotes(all); this.repaint(page); toast('Note saved.');
      },
      onDelete: n ? () => { this.savePdfNotes(this.notes().filter(x => x.id !== n.id)); this.repaint(page); toast('Note removed.'); } : null,
    });
  },
  savePdfNotes(list) { notes.savePdf(this.key(), list); },
  // Opened from Saved: show the page's annotation.
  flash(page, noteId) {
    const box = $('#pdfPages').children[page - 1];
    if (!box) return;
    box.classList.add('flash'); setTimeout(() => box.classList.remove('flash'), 1600);
    if (noteId != null) { const n = this.notes().find(x => x.id === noteId); if (n) this.editNote(n.id); }
  },

  toggleMark() {
    if (!this.doc) return;
    const n = this.currentPage();
    const list = this.marks();
    const i = list.indexOf(n);
    if (i >= 0) { list.splice(i, 1); toast('Bookmark removed.'); } else { list.push(n); list.sort((a, b) => a - b); toast(`Page ${n} bookmarked.`); }
    store.set('pdfMarks:' + this.key(), list);
    this.syncMark();
  },

  syncMark() {
    const on = !!this.doc && this.marks().includes(this.currentPage());
    $('#pdfMark').classList.toggle('on', on);
    $('#pdfMark').setAttribute('aria-label', on ? 'Remove bookmark' : 'Bookmark this page');
  },

  openMarks() {
    const marks = this.marks(), hls = this.hls();
    const body = $('#pdfMarksBody');
    body.innerHTML = (marks.length ? `<h3 class="goto-h">Pages</h3><ul class="mistakes">${marks.map(n => `<li><button type="button" class="bm" data-pdf-page="${n}"><b>Page ${n}</b></button></li>`).join('')}</ul>` : '')
      + (hls.length ? `<h3 class="goto-h">Highlights</h3><ul class="mistakes">${hls.map((h, i) => `<li class="hl-item">
          <button type="button" class="bm" data-pdf-page="${h.page}"><b><i class="dot hl-dot-${h.color}"></i>Page ${h.page}</b><span class="hl-snip">${esc(h.text || '')}</span></button>
          <button type="button" class="icon-btn" data-pdf-del="${i}" aria-label="Delete highlight"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></li>`).join('')}</ul>` : '')
      + (this.notes().length ? `<h3 class="goto-h">Notes</h3><ul class="mistakes">${this.notes().slice().sort((a, b) => a.page - b.page).map(x => `<li class="hl-item">
          <button type="button" class="bm" data-pdf-note="${x.id}"><b>Page ${x.page}</b>${x.quote ? `<span class="hl-snip">“${esc(x.quote)}”</span>` : ''}<span class="hl-snip">${esc(x.text)}</span></button>
          <button type="button" class="icon-btn" data-pdf-note-del="${x.id}" aria-label="Delete note"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></li>`).join('')}</ul>` : '')
      || '<p class="note left">No bookmarks, highlights or notes yet. Tap the bookmark icon to save a page, the note icon to write on a page, select some text to highlight it or add a note, or tap the marker and drag over any part of a page (also for scanned books).</p>';
    if (!$('#pdfMarksSheet').open) $('#pdfMarksSheet').showModal();
  },

  currentPage() {
    const sc = $('#pdfScroll');
    const mid = sc.getBoundingClientRect().top + sc.clientHeight / 3;
    for (const box of $('#pdfPages').children) { const r = box.getBoundingClientRect(); if (r.bottom >= mid) return +box.dataset.page; }
    return 1;
  },

  goTo(n, behavior = 'smooth') {
    const box = $('#pdfPages').children[n - 1];
    if (box) box.scrollIntoView({ behavior, block: 'start' });
  },

  async setZoom(z) {
    if (!this.doc) return;
    const keep = this.currentPage();
    this.zoom = Math.min(3, Math.max(0.6, z));
    await this.layout();
    this.goTo(keep, 'auto');
  },

  close(keepView) {
    this.token++;
    if (window.pdfAnnot) { pdfAnnot.close(); if (pdfAnnot.area) pdfAnnot.setArea(false); }
    if (this.observer) { this.observer.disconnect(); this.observer = null; }
    try { this.task && this.task.destroy(); } catch (_) {}
    try { this.doc && this.doc.destroy(); } catch (_) {}
    this.doc = null; this.task = null; this.rendered.clear();
    if (!keepView) $('#pdfPages').innerHTML = '';
  },
};

// Tap a highlight to recolour it, add a note or remove it; the marker highlights an area
// (any page, including scanned books whose text can't be selected).
var pdfAnnot = {
  cur: null, area: false,
  hitAt(box, e) {
    const r = box.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height, n = +box.dataset.page;
    return pdfReader.hls().find(h => h.page === n && h.rects.some(([a, b, w, hh]) => x >= a && x <= a + w && y >= b - 0.004 && y <= b + hh + 0.004)) || null;
  },
  open(h) { this.cur = h; $('#pdfHlPop').hidden = false; $('#pdfHlBar').hidden = true; $$('#pdfHlPop [data-phc]').forEach(b => b.classList.toggle('active', b.dataset.phc === h.color)); },
  close() { this.cur = null; $('#pdfHlPop').hidden = true; },
  update(fn) {
    const list = pdfReader.hls(), h = this.cur && list.find(x => x.id === this.cur.id);
    if (!h) { this.close(); return; }
    const keep = fn(h, list);
    store.set('pdfHl:' + pdfReader.key(), keep || list); pdfReader.repaint(h.page);
  },
  setArea(on) { this.area = on; $('#pdfReader').classList.toggle('area-mode', on); $('#pdfArea').setAttribute('aria-pressed', on); $('#pdfAreaHint').hidden = !on; if (on) this.close(); },
};

(function wirePdf() {
  let t;
  $('#pdfArea').addEventListener('click', () => pdfAnnot.setArea(!pdfAnnot.area));
  // Tap on a highlight (when no text is being selected): its menu.
  $('#pdfPages').addEventListener('click', e => {
    if (pdfAnnot.area || e.target.closest('.pnote')) return;
    const sel = window.getSelection(); if (sel && !sel.isCollapsed) return;
    const box = e.target.closest('.pdf-page'); if (!box) return;
    const h = pdfAnnot.hitAt(box, e);
    if (h) pdfAnnot.open(h); else pdfAnnot.close();
  });
  $$('#pdfHlPop [data-phc]').forEach(b => b.addEventListener('click', () => { pdfAnnot.update(h => { h.color = b.dataset.phc; }); pdfAnnot.close(); }));
  $('#pdfHlPopDel').addEventListener('click', () => {
    const h = pdfAnnot.cur; if (!h) return;
    pdfAnnot.update((x, list) => list.filter(y => y.id !== x.id));
    // a note attached to it stays, as a note on the page
    pdfReader.savePdfNotes(pdfReader.notes().map(n => n.hl === h.id ? Object.assign(n, { hl: null }) : n)); pdfReader.repaint(h.page);
    pdfAnnot.close(); toast('Highlight removed.');
  });
  $('#pdfHlPopNote').addEventListener('click', () => {
    const h = pdfAnnot.cur; if (!h) return; pdfAnnot.close();
    const n = pdfReader.notes().find(x => x.hl === h.id);
    if (n) pdfReader.editNote(n.id); else pdfReader.editNote(null, { page: h.page, quote: h.text || '', hl: h.id, color: h.color });
  });
  // Marker: drag a box over the page.
  let drag = null;
  $('#pdfPages').addEventListener('pointerdown', e => {
    if (!pdfAnnot.area) return;
    const box = e.target.closest('.pdf-page'); if (!box) return;
    e.preventDefault();
    const r = box.getBoundingClientRect(), d = document.createElement('div'); d.className = 'area-draft'; box.append(d);
    drag = { box, r, x0: (e.clientX - r.left) / r.width, y0: (e.clientY - r.top) / r.height, d, id: e.pointerId };
    box.setPointerCapture && box.setPointerCapture(e.pointerId);
  });
  $('#pdfPages').addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const x = Math.min(1, Math.max(0, (e.clientX - drag.r.left) / drag.r.width)), y = Math.min(1, Math.max(0, (e.clientY - drag.r.top) / drag.r.height));
    const a = Math.min(x, drag.x0), b = Math.min(y, drag.y0); drag.rect = [a, b, Math.abs(x - drag.x0), Math.abs(y - drag.y0)];
    Object.assign(drag.d.style, { left: a * 100 + '%', top: b * 100 + '%', width: drag.rect[2] * 100 + '%', height: drag.rect[3] * 100 + '%' });
  });
  const endDrag = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const { box, rect, d } = drag; drag = null; d.remove();
    if (!rect || rect[2] < 0.02 || rect[3] < 0.008) return;
    const page = +box.dataset.page, list = pdfReader.hls();
    list.push({ id: Date.now(), page, rects: [rect], color: 'yellow', text: '', area: true, t: Date.now() });
    store.set('pdfHl:' + pdfReader.key(), list); pdfReader.repaint(page);
    pdfAnnot.setArea(false); toast('Highlighted. Tap it to change the colour, add a note or remove it.');
  };
  $('#pdfPages').addEventListener('pointerup', endDrag);
  $('#pdfPages').addEventListener('pointercancel', e => { if (drag && e.pointerId === drag.id) { drag.d.remove(); drag = null; } });
  $('#pdfScroll').addEventListener('scroll', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      if (!pdfReader.doc) return;
      const n = pdfReader.currentPage();
      $('#pdfPageNum').value = n;
      store.set(`pdfPos:${pdfReader.id}:${pdfReader.fi}`, n);
      pdfReader.syncMark();
    }, 150);
  }, { passive: true });
  $('#pdfBack').addEventListener('click', () => goBack('library'));
  $('#pdfMark').addEventListener('click', () => pdfReader.toggleMark());
  $('#pdfList').addEventListener('click', () => pdfReader.openMarks());
  $('#pdfNote').addEventListener('click', () => { if (pdfReader.doc) pdfReader.editNote(null, { page: pdfReader.currentPage() }); });
  $('#pdfHlNote').addEventListener('pointerdown', e => e.preventDefault());
  $('#pdfHlNote').addEventListener('click', () => pdfReader.highlightSelection('yellow', true));
  $('#pdfPages').addEventListener('click', e => { const m = e.target.closest('.pnote'); if (m) { e.stopPropagation(); pdfReader.editNote(+m.dataset.note); } });
  $('#pdfMarksBody').addEventListener('click', e => {
    const nb = e.target.closest('[data-pdf-note]');
    if (nb) { $('#pdfMarksSheet').close(); const n = pdfReader.notes().find(x => x.id === +nb.dataset.pdfNote); if (n) { pdfReader.goTo(n.page); setTimeout(() => pdfReader.flash(n.page, n.id), 500); } return; }
    const nd = e.target.closest('[data-pdf-note-del]');
    if (nd) { const id = +nd.dataset.pdfNoteDel; const n = pdfReader.notes().find(x => x.id === id); pdfReader.savePdfNotes(pdfReader.notes().filter(x => x.id !== id)); if (n) pdfReader.repaint(n.page); toast('Note removed.'); pdfReader.openMarks(); return; }
    const del = e.target.closest('[data-pdf-del]');
    if (del) {
      const list = pdfReader.hls(); const [h] = list.splice(+del.dataset.pdfDel, 1);
      store.set('pdfHl:' + pdfReader.key(), list); if (h) pdfReader.repaint(h.page); pdfReader.openMarks(); return;
    }
    const go = e.target.closest('[data-pdf-page]');
    if (go) { $('#pdfMarksSheet').close(); pdfReader.goTo(+go.dataset.pdfPage); }
  });
  // Show the highlight colours while text on a page is selected.
  document.addEventListener('selectionchange', () => {
    if (state.view !== 'pdf') return;
    const sel = window.getSelection();
    const inText = sel && !sel.isCollapsed && sel.anchorNode && sel.anchorNode.parentElement && sel.anchorNode.parentElement.closest('.textLayer');
    $('#pdfHlBar').hidden = !inText;
  });
  document.querySelectorAll('#pdfHlBar [data-phl]').forEach(b => {
    b.addEventListener('pointerdown', e => e.preventDefault());
    b.addEventListener('click', () => pdfReader.highlightSelection(b.dataset.phl));
  });
  $('#pdfZoomIn').addEventListener('click', () => pdfReader.setZoom(pdfReader.zoom * 1.25));
  $('#pdfZoomOut').addEventListener('click', () => pdfReader.setZoom(pdfReader.zoom / 1.25));
  $('#pdfGoto').addEventListener('submit', e => {
    e.preventDefault();
    const n = +$('#pdfPageNum').value;
    if (pdfReader.doc && n >= 1 && n <= pdfReader.doc.numPages) pdfReader.goTo(n);
    $('#pdfPageNum').blur();
  });
})();

/* ------------------------------------------------------------------ */
/*  Install to the home screen                                         */
/* ------------------------------------------------------------------ */

const install = {
  prompt: null,
  standalone() { return navigator.standalone === true || matchMedia('(display-mode: standalone)').matches; },
  ios() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); },
  card() {
    const el = $('#installCard');
    if (this.standalone() || store.get('installDismissed', false) || (!this.ios() && !this.prompt)) { el.innerHTML = ''; return; }
    el.innerHTML = `<div class="install-card">
      <img src="icons/icon-192.png" alt="" width="44" height="44">
      <span><b>Install Tilawah</b><small>Add it to your home screen to open it like an App Store app, full screen and offline.</small></span>
      <button type="button" class="btn small primary" data-install>Install</button>
      <button type="button" class="icon-btn" data-install-close aria-label="Not now"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>`;
  },
  async start() {
    if (this.prompt) { this.prompt.prompt(); const r = await this.prompt.userChoice.catch(() => null); this.prompt = null; this.card(); if (r && r.outcome === 'accepted') toast('Installing Tilawah…'); return; }
    const share = '<svg class="inline-ic" viewBox="0 0 24 24"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11v9h12v-9"/></svg>';
    const steps = this.standalone() ? '<p>Tilawah is already installed. You\u2019re using the installed app.</p>'
      : this.ios() ? `<ol class="install-steps">
          <li>Open this page in <b>Safari</b>.</li>
          <li>Tap the <b>Share</b> button ${share} at the bottom of the screen (on iPad, at the top).</li>
          <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
          <li>Tap <b>Add</b>. Tilawah appears on your home screen and opens full screen, like an App Store app.</li></ol>`
      : `<ol class="install-steps">
          <li>In <b>Chrome</b> or <b>Edge</b>, open the browser menu (\u22ee).</li>
          <li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li>
          <li>Confirm. Tilawah opens in its own window from your home screen or app list.</li></ol>`;
    $('#installBody').innerHTML = steps;
    $('#installSheet').showModal();
  },
};
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); install.prompt = e; install.card(); });
window.addEventListener('appinstalled', () => { install.prompt = null; install.card(); toast('Tilawah is installed.'); });
document.addEventListener('click', e => {
  if (e.target.closest('[data-install]')) install.start();
  if (e.target.closest('[data-install-close]')) { store.set('installDismissed', true); install.card(); }
});
document.documentElement.classList.toggle('standalone', install.standalone());

/* ------------------------------------------------------------------ */
/*  Wiring                                                             */
/* ------------------------------------------------------------------ */

function initSettingsSheet() {
  const sel = $('#setReciter');
  sel.innerHTML = reciterGroups().map(([g, list]) => `<optgroup label="${g}">${list.map(r => `<option value="${esc(r.id)}">${esc(r.name)}</option>`).join('')}</optgroup>`).join('');
  const sync = () => {
    sel.value = settings.reciter;
    $('#setRepeat').value = String(settings.repeat);
    $('#setFont').value = settings.fontSize;
    $('#setZoom').value = settings.mushafZoom || 1;
    $('#setTajweed').checked = !!settings.tajweed;
    $('#setTranslation').checked = settings.translation;
    $('#setTafsir').checked = settings.tafsir;
    $('#setAutoNext').checked = settings.autoNext;
    $('#setFollow').checked = settings.followWords !== false;
    $('#setHide').checked = settings.hide;
    $('#setListenRepeat').checked = settings.listenRepeat;
    $('#setPopups').checked = settings.mistakePopups;
    $('#setAwake').checked = settings.keepAwake !== false;
    $('#setOffline').checked = offline.on(); $('#setOfflineCell').checked = !!settings.offlineCellular; offline.render();
    $('#setLevel').value = settings.checkLevel || 'tajweed';
    $('#setStrict').value = settings.strict || 'balanced';
    $('#setLevel').disabled = !(window.QuranSpeech && QuranSpeech.supported()) || settings.engine === 'browser';
    $('#setEngine').value = useQuranModel() || settings.engine !== 'browser' ? 'quran' : 'browser';
    $('#setEngine').querySelector('[value=quran]').disabled = !(window.QuranSpeech && QuranSpeech.supported());
    $('#setEngine').querySelector('[value=browser]').disabled = !SpeechRec;
    $('#installBtn').textContent = install.standalone() ? 'Tilawah is installed' : 'Install Tilawah on this device';
  };
  sync();
  sel.addEventListener('change', () => setReciter(sel.value));
  $('#setRepeat').addEventListener('change', e => { settings.repeat = +e.target.value; saveSettings(); });
  $('#setFont').addEventListener('input', e => { settings.fontSize = +e.target.value; saveSettings(); });
  $('#setZoom').addEventListener('change', e => { setMushafZoom(+e.target.value); });
  $('#setTajweed').addEventListener('change', e => {
    settings.tajweed = e.target.checked; saveSettings();
    document.documentElement.classList.toggle('tajweed-on', settings.tajweed);
    Q.reset();
    if (state.view === 'mushaf') mushaf.show(mushaf.page);
    else if (state.view === 'surah') route();
  });
  $('#setTranslation').addEventListener('change', e => {
    settings.translation = e.target.checked; saveSettings();
    if (state.view === 'surah') { if (settings.translation) surahView.loadTranslation(state.surahNum); else surahView.showTranslations(); }
  });
  $('#setTafsir').addEventListener('change', e => {
    settings.tafsir = e.target.checked; saveSettings();
    if (state.view === 'surah') { if (settings.tafsir) surahView.loadTafsir(state.surahNum); else surahView.showTafsir(); }
  });
  $('#setAutoNext').addEventListener('change', e => { settings.autoNext = e.target.checked; saveSettings(); });
  $('#setFollow').addEventListener('change', e => { settings.followWords = e.target.checked; saveSettings(); wordFollow.set(null); paintWords(); });
  $('#setHide').addEventListener('change', e => { settings.hide = e.target.checked; saveSettings(); paintWords(); });
  $('#setListenRepeat').addEventListener('change', e => { settings.listenRepeat = e.target.checked; saveSettings(); });
  $('#setPopups').addEventListener('change', e => { settings.mistakePopups = e.target.checked; saveSettings(); });
  $('#setAwake').addEventListener('change', e => { settings.keepAwake = e.target.checked; saveSettings(); awake.check(); });
  $('#setOffline').addEventListener('change', e => { settings.offlineAll = e.target.checked; saveSettings(); if (e.target.checked) offline.restart(); else offline.stopReq = true; offline.render(); });
  $('#setOfflineCell').addEventListener('change', e => { settings.offlineCellular = e.target.checked; saveSettings(); offline.restart(); });
  $('#offlineAllAudio').addEventListener('click', e => { e.preventDefault(); toast(`Downloading every surah for ${reciterName()}…`); offline.downloadAll().then(() => offline.render()); });
  $('#offlineClear').addEventListener('click', async e => {
    e.preventDefault();
    offline.stopReq = true;
    try { const k = (await caches.keys()).filter(n => n.includes('audio')); await Promise.all(k.map(n => caches.delete(n))); } catch (_) {}
    Object.keys(localStorage).filter(k => k.startsWith('tl:dl:')).forEach(k => localStorage.removeItem(k));
    settings.offlineAll = false; saveSettings(); $('#setOffline').checked = false; offline.render(); renderSurahList();
    toast('Downloaded recitations deleted.');
  });
  $('#installBtn').addEventListener('click', () => { $('#settingsSheet').close(); install.start(); });
  $('#setStrict').addEventListener('change', e => { settings.strict = e.target.value; saveSettings(); if (rec.active && rec.phon) rec.update(false); });
  $('#setLevel').addEventListener('change', e => { settings.checkLevel = e.target.value; saveSettings(); if (rec.active && rec.phon) rec.update(false); });
  $('#setEngine').addEventListener('change', e => { $('#setLevel').disabled = e.target.value === 'browser'; settings.engine = e.target.value; saveSettings(); if (rec.active) rec.stop(false); if (settings.engine === 'quran' && window.QuranSpeech) QuranSpeech.preload(); });
  const open = () => { sync(); recordings.render(); $('#settingsSheet').showModal(); };
  $('#settingsBtn').addEventListener('click', open);
  $('#readerSettings').addEventListener('click', open);
}

// Surah list, read mode and text-view actions.
document.addEventListener('click', e => {
  const dl = e.target.closest('#surahList [data-dl]');
  if (dl) { e.preventDefault(); const n = +dl.dataset.dl; if (!offline.doneSet().has(n)) offline.downloadSurah(n); else toast(`${Q.ch(n).en} is saved for offline (${reciterName()}).`); return; }
  const row = e.target.closest('#surahList .surah-row');
  if (row) {
    const n = +row.dataset.n;
    location.hash = settings.readMode === 'mushaf' ? `page-${Q.ch(n).pages[0]}` : `surah-${n}`;
    return;
  }
  const mode = e.target.closest('#readMode [data-read]');
  if (mode) { settings.readMode = mode.dataset.read; saveSettings(); if (!$('#juzList').hidden) renderJuzList(); return; }
  const act = e.target.closest('#ayahs [data-act]');
  if (act) {
    const a = +act.closest('.ayah').dataset.a;
    if (act.dataset.act === 'play') player.play(state.surahNum, a);
    else rec.start(state.surahNum, a, { scope: 'surah' });
  }
});
document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

$('#surahSearch').addEventListener('input', renderSurahList);
$('#qaGoto').addEventListener('click', () => { if (Q.meta) openGoto('surah'); });
// Listen: from the page you were reading (the small player shows here).
$('#qaListen').addEventListener('click', () => {
  if (!Q.meta) return;
  if (player.active) { player.resumeOr(() => {}); return; }
  const [s, a] = Q.firstAyahOn(store.get('mushafPage', 1));
  player.play(s, a);
});
// The Quran section: surahs or juz.
function renderJuzList() {
  if (!Q.meta) return;
  const cur = Q.juzOfPage(store.get('mushafPage', 1));
  $('#juzList').innerHTML = Q.meta.juz.map((p, i) => {
    const [s, a] = JUZ_STARTS[i];
    const href = settings.readMode === 'mushaf' ? `#page-${p}` : `#surah-${s}-${a}`;
    return `<li><a class="juz${cur === i + 1 ? ' current' : ''}" href="${href}"><span class="star">${i + 1}</span><span><b>Juz ${i + 1}</b><span>${esc(Q.ch(s).en)} ${s}:${a} · p. ${p}</span></span></a></li>`;
  }).join('');
}
$('#browseTabs').addEventListener('click', e => {
  const b = e.target.closest('[data-browse]'); if (!b) return;
  const juz = b.dataset.browse === 'juz';
  $$('#browseTabs .mode').forEach(x => x.classList.toggle('active', x === b));
  $('#juzList').hidden = !juz; $('#surahList').hidden = juz; $('#surahSearchBox').hidden = juz;
  if (juz) renderJuzList();
});
$('#findBtn').addEventListener('click', () => {
  openMushaf(store.get('mushafPage', 1));
  setTimeout(() => rec.startAuto(), 300);
});
$('#backBtn').addEventListener('click', () => goBack(state.view === 'library' ? (state.libBack || 'library') : 'quran'));
$('#toMushafBtn').addEventListener('click', () => {
  if (!state.surahNum || !Q.meta) return;
  location.hash = 'page-' + Q.ayahPage(state.surahNum, surahView.visibleAyah());
});

// Text view dock
// In the small player (other screens) the title goes back to the ayah being recited.
$('#dockReciter').addEventListener('click', () => {
  if ($('#dock').classList.contains('mini') && player.gi >= 0) { const [s, a] = Q.all[player.gi]; pendingSelect = null; location.hash = settings.readMode === 'mushaf' ? `page-${Q.ayahPage(s, a)}` : `surah-${s}-${a}`; return; }
  openReciters();
});
$('#dockClose').addEventListener('click', () => { player.stop(); syncDock(); });
$('#playBtn').addEventListener('click', () => player.resumeOr(() => player.play(state.surahNum, surahView.visibleAyah()), ([s]) => state.view !== 'surah' || s === state.surahNum));
$('#prevBtn').addEventListener('click', () => { if (!player.step(-1)) player.play(state.surahNum, Math.max(1, surahView.visibleAyah() - 1)); });
$('#nextBtn').addEventListener('click', () => { if (!player.step(1)) player.play(state.surahNum, Math.min(Q.ch(state.surahNum).ayahs, surahView.visibleAyah() + 1)); });
$('#micBtn').addEventListener('click', () => {
  if (rec.active) rec.stop(true);
  else if (state.surahData) rec.start(state.surahNum, player.playing ? Q.all[player.gi][1] : surahView.visibleAyah(), { scope: 'surah' });
});

// Mushaf reader
(function wireReader() {
  const stage = $('#pageStage');
  let x0 = null, y0 = 0;
  stage.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; });
  stage.addEventListener('pointercancel', () => { x0 = null; });
  const hint = text => { let h = $('#zoomHint'); if (!h) { h = document.createElement('div'); h.id = 'zoomHint'; h.className = 'zoom-hint'; document.body.append(h); } h.textContent = text; h.hidden = false; clearTimeout(h.t); h.t = setTimeout(() => { h.hidden = true; }, 700); };
  // Touch: the page follows a sideways drag and turns on release (or on a quick flick);
  // up-and-down is left to scrolling; two fingers pinch the size.
  let g = null;
  const pageEl = () => { const l = stage.querySelectorAll('.mpage'); return l[l.length - 1] || null; };
  const tdist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const settle = (el, x, done) => { if (!el) { done && done(); return; } el.style.transition = 'transform .18s ease-out'; el.style.transform = x ? `translateX(${x}px)` : ''; setTimeout(() => { if (!done) { el.style.transition = ''; } else done(); }, 180); };
  stage.addEventListener('touchstart', e => {
    if (e.touches.length === 2) { if (g && g.dir === 'h') settle(pageEl(), 0); g = { pinch: true, d: tdist(e.touches), z: Number(settings.mushafZoom) || 1, target: null }; return; }
    if (e.touches.length === 1 && !(g && g.pinch)) g = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now(), dir: null, dx: 0 };
  }, { passive: true });
  stage.addEventListener('touchmove', e => {
    if (!g) return;
    if (g.pinch) {
      if (e.touches.length < 2) return;
      e.preventDefault();
      const z = Math.round(Math.min(2, Math.max(1, g.z * tdist(e.touches) / g.d)) * 4) / 4;
      if (z !== g.target) { g.target = z; hint(z === 1 ? 'Full page' : Math.round(z * 100) + '%'); }
      return;
    }
    const t = e.touches[0], dx = t.clientX - g.x, dy = t.clientY - g.y;
    if (!g.dir) { if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) g.dir = 'h'; else if (Math.abs(dy) > 10) g.dir = 'v'; }
    if (g.dir !== 'h') return;
    e.preventDefault();
    // Swiping right turns to the next page (as in a printed mushaf); resist past the first/last page.
    const edge = (dx > 0 && mushaf.page >= 604) || (dx < 0 && mushaf.page <= 1);
    g.dx = edge ? dx * 0.25 : dx;
    const el = pageEl(); if (el) { el.style.transition = 'none'; el.style.transform = `translateX(${g.dx}px)`; }
  }, { passive: false });
  const endTouch = e => {
    if (!g) return;
    if (g.pinch) { if (e.touches.length < 2) { const z = g.target; g = null; if (z != null) setMushafZoom(z, true); } return; }
    if (e.touches.length) return;
    const G = g; g = null;
    if (G.dir !== 'h') return;
    x0 = null;   // not a tap
    const el = pageEl(), dt = Math.max(1, performance.now() - G.t), v = G.dx / dt;
    const go = (Math.abs(G.dx) > 70 || (Math.abs(G.dx) > 28 && Math.abs(v) > 0.35)) && !((G.dx > 0 && mushaf.page >= 604) || (G.dx < 0 && mushaf.page <= 1));
    if (!go) { settle(el, 0); return; }
    const w = stage.clientWidth;
    settle(el, G.dx > 0 ? w : -w, () => { G.dx > 0 ? mushaf.next() : mushaf.prev(); });
  };
  stage.addEventListener('touchend', endTouch);
  stage.addEventListener('touchcancel', e => { if (g && g.dir === 'h') settle(pageEl(), 0); g = null; });
  ['gesturestart', 'gesturechange'].forEach(t => stage.addEventListener(t, e => e.preventDefault()));
  stage.addEventListener('pointerup', e => {
    if (x0 === null) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    x0 = null;
    // Mouse: drag right for the next page, as pages turn in a printed mushaf (touch is handled above).
    if (e.pointerType !== 'touch' && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { dx > 0 ? mushaf.next() : mushaf.prev(); return; }
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) return;
    const word = e.target.closest('[data-s]');
    // Tap a marked word to see what was wrong with it.
    if (word && rec.errors.size) {
      const hit = [...wordEls.values()].find(r => r.els.includes(word));
      const errs = hit && rec.errors.get(hit.w.id);
      if (errs) { toast([{ ar: hit.w.text }, ' ' + errs.map(x => x.msg).join(' · ')], errs.some(x => x.sev === 'wrong') ? 'bad' : 'warn'); return; }
    }
    // Memorization mode: tap a hidden word to peek at it for a moment.
    if (word && word.classList.contains('hidden')) {
      const id = [...wordEls.values()].find(r => r.els.includes(word))?.w.id;
      if (id) { peeks.add(id); setTimeout(() => { peeks.delete(id); paintWords(); }, 1600); }
      if (rec.active) { paintWords(); return; }
    }
    if (word && rec.active) return;
    if (word) { const k = `${word.dataset.s}:${word.dataset.a}`; mushaf.select(state.selected === k ? null : k); return; }
    const r = stage.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    if (fx < 0.18) mushaf.next();
    else if (fx > 0.82) mushaf.prev();
    else if (state.selected) mushaf.select(null);
    else mushaf.setChrome(!mushaf.chrome);
  });
  document.addEventListener('keydown', e => {
    if (state.view !== 'mushaf' || document.querySelector('dialog[open]') || e.target.closest('input')) return;
    if (e.key === 'ArrowLeft') mushaf.next();
    else if (e.key === 'ArrowRight') mushaf.prev();
  });
  $('#readerBack').addEventListener('click', () => { location.hash = 'quran'; });
  $('#readerMark').addEventListener('click', toggleBookmark);
  $('#readerGoto').addEventListener('click', () => openGoto('surah'));
  $('#readerSlider').addEventListener('change', e => mushaf.show(+e.target.value));
  $('#readerSlider').addEventListener('input', e => { $('#readerSub').textContent = `Page ${e.target.value} · Juz ${Q.meta ? Q.juzOfPage(+e.target.value) : ''}`; });
  // Play: the selected ayah if one is selected (and not already the one playing), else resume or start the page.
  $('#mPlay').addEventListener('click', () => {
    if (state.selected && !(player.playing && player.key() === state.selected)) { const [s, a] = state.selected.split(':').map(Number); player.play(s, a); return; }
    player.resumeOr(async () => { const [s, a] = await mushaf.startAyah(); player.play(s, a); }, ([s, a]) => Q.ayahPage(s, a) === mushaf.page);
  });
  // Mark: highlight colours and a note, shown only when asked for.
  const markup = open => { $('#abMain').hidden = open; $('#abMarkup').hidden = !open; $('#ayahMarkup').setAttribute('aria-expanded', open); };
  $('#ayahMarkup').addEventListener('click', () => markup(true));
  $('#abBack').addEventListener('click', () => markup(false));
  mushaf.resetBar = () => markup(false);
  // Mushaf size: a small slider under the top bar.
  const sizePop = $('#sizePop'), sizeBtn = $('#readerSize');
  const showSize = on => { sizePop.hidden = !on; sizeBtn.setAttribute('aria-expanded', on); if (on) { $('#sizeSlider').value = settings.mushafZoom || 1; $('#sizeVal').textContent = Math.round((settings.mushafZoom || 1) * 100) + '%'; } };
  sizeBtn.addEventListener('click', e => { e.stopPropagation(); showSize(sizePop.hidden); });
  let sizeT;
  $('#sizeSlider').addEventListener('input', e => { const z = +e.target.value; $('#sizeVal').textContent = Math.round(z * 100) + '%'; clearTimeout(sizeT); sizeT = setTimeout(() => setMushafZoom(z, true), 120); });
  document.addEventListener('pointerdown', e => { if (!sizePop.hidden && !e.target.closest('#sizePop, #readerSize')) showSize(false); });
  mushaf.hideSize = () => showSize(false);
  $('#mMic').addEventListener('click', async () => {
    if (rec.active) { rec.stop(true); return; }
    if (state.selected) { const [s, a] = state.selected.split(':').map(Number); mushaf.select(null); rec.start(s, a, { scope: 'open' }); }
    else rec.startAuto();
  });
  $('#ayahRecite').addEventListener('click', () => { const [s, a] = state.selected.split(':').map(Number); mushaf.select(null); rec.start(s, a, { scope: 'open' }); });
  const sel = () => state.selected.split(':').map(Number);
  $('#ayahText').addEventListener('click', () => showAyahPanel(...sel(), 'translation'));
  $('#ayahTafsir').addEventListener('click', () => showAyahPanel(...sel(), 'tafsir'));
  $('#transCard').addEventListener('click', e => {
    const tab = e.target.closest('[data-tc]');
    if (!tab) return;
    const [s, a] = $('#transCard').dataset.key.split(':').map(Number);
    showAyahPanel(s, a, tab.dataset.tc);
  });
  $('#transClose').addEventListener('click', () => { $('#transCard').hidden = true; });
  $('#transOpen').addEventListener('click', () => {
    const [s, a, mode] = $('#transCard').dataset.key.split(':');
    settings[mode] = true; saveSettings();
    mushaf.select(null); location.hash = `surah-${s}-${a}`;
  });
  $('#mReciter').addEventListener('click', openReciters);
  $('#ayahClose').addEventListener('click', () => mushaf.select(null));
  $('#ayahMark').addEventListener('click', () => toggleAyahMark(...sel()));
  $('#ayahNote').addEventListener('click', () => editAyahNote(...sel()));
  document.querySelectorAll('#ayahBar [data-hl]').forEach(b => b.addEventListener('click', () => {
    setHighlight(state.selected, b.dataset.hl);
    mushaf.syncAyahBar();
    toast(b.dataset.hl ? 'Ayah highlighted.' : 'Highlight removed.');
  }));
  $('#gotoBody').addEventListener('click', e => {
    const tab = e.target.closest('[data-goto-tab]');
    if (tab) { openGoto(tab.dataset.gotoTab); return; }
    if (e.target.id === 'pageJumpGo') {
      const p = +$('#pageJump').value;
      if (p >= 1 && p <= 604) { $('#gotoSheet').close(); gotoPage(p); } else toast('Enter a page from 1 to 604.', 'bad');
      return;
    }
    const ga = e.target.closest('[data-goto-ayah]');
    if (ga) {
      const [s, a] = ga.dataset.gotoAyah.split(':').map(Number);
      $('#gotoSheet').close();
      gotoPage(Q.ayahPage(s, a), `${s}:${a}`);
      return;
    }
    const go = e.target.closest('[data-goto]');
    if (go) { $('#gotoSheet').close(); gotoPage(+go.dataset.goto); }
  });
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (state.view === 'mushaf') { const pg = $('#pageStage .mpage'); if (pg) Q.page(mushaf.page).then(d => mushaf.fit(pg, d)); } }, 200);
  });
})();

$('#locateBtn').addEventListener('click', () => qibla.locate());
$('#compassBtn').addEventListener('click', () => qibla.startCompass());
$('#manualForm').addEventListener('submit', e => {
  e.preventDefault();
  const lat = parseFloat($('#manLat').value), lon = parseFloat($('#manLon').value);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180 || isNaN(lat) || isNaN(lon)) { toast('Latitude must be between -90 and 90, longitude between -180 and 180.', 'bad'); return; }
  qibla.setLocation(lat, lon);
});

window.addEventListener('hashchange', route);
initSettingsSheet();
applySettings();
initList();
route();

if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
