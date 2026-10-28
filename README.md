# Tilawah — Quran app prototype

A phone-friendly web app (installable to the home screen) with:

- **Full mushaf** — the King Fahd Complex Madinah Mushaf (1441 AH, 604 pages, 15 lines), drawn page by page exactly as printed, with surah headers, ayah markers, waqf signs and rub' al-hizb marks. Swipe or tap the page edges to turn pages, tap the middle to hide the bars, go to any surah, juz or page, bookmark pages and ayahs, highlight ayahs in four colours, and pick up where you stopped. Works offline for pages you've opened. Dark mode included. Tajweed colours (Settings → Reading) switch to the King Fahd Complex's colour-coded pages (QPC V4 tajweed fonts, light and dark palettes, with a colour key). Turn the phone sideways and the page fills the width and scrolls.
- **Play and recite on the page** — tap any word to select its ayah, then play it or recite from it. While a reciter plays, the current ayah is highlighted on the page; while you recite, each word turns green, red (wrong) or amber (skipped), and the page turns with you.
- **Text view** — one surah at a time in the same Madinah script, with the English translation (Sahih International) as an option, off by default.
- **Reciters, ayah by ayah** — 23 recitations, A–Z, Murattal and Mujawwad listed separately: Abdul Basit (Murattal and Mujawwad), Abdullah Awad Al-Juhany, Abdur-Rahman as-Sudais, Abu Bakr al-Shatri, Badr Al-Turki, Bandar Baleela, Ali Al-Huthaify, Fares Abbad, Haitham Al-Dokhin, Hassan Saleh, Mahmoud Khalil Al-Husary, Maher Al-Muaiqly, Mishary Rashid Alafasy, Muhammad Al-Luhaidan, Muhammad Ayyub, Muhammad Barhaji, Muhammad Siddiq Al-Minshawi (Murattal and Mujawwad), Raad Muhammad al-Kurdi, Saad al-Ghamdi, Saud al-Shuraim and Yasser al-Dossari. Speed 0.75×–2×, repeat each ayah 1–10 times, continuous play, and play/pause/next/previous from the lock screen, Control Centre, headphones and car.
- **Translation and tafsir on the page** — select an ayah in the mushaf and tap Translation or Tafsir to read the English meaning or Tafsir Ibn Kathir without leaving the page. In text view, both can be switched on in Settings.
- **Recite to find** — start reciting anywhere in the Quran, without choosing an ayah first. After a few words the app finds where you are, opens that page and follows you word by word (like Tarteel). Tap the mic in the mushaf with no ayah selected, or Recite to find an ayah on the Quran screen.
- **Live recitation checking** — each word turns green, red or amber as you recite, with an optional pop-up showing the correct word, and a summary at the end (score, time, mistakes with buttons to hear the ayah or retry). In memorization mode, tap a hidden word to peek at it.
- **Memorization mode** — words stay hidden while you recite and appear as you say them.
- **Listen and repeat** — the reciter plays an ayah, then the mic opens for you to repeat it, then the next ayah plays.
- **Qibla finder** — GPS bearing and distance to the Kaaba, a live compass on phones, manual coordinates as a fallback.
- **Notes and Saved** — write a note on any ayah (ayah panel → Note), on any book page (note icon in the book's top bar) or on a passage (select text → Add note; it's highlighted too). Notes show as markers on the page. The Saved tab gathers bookmarks, highlights and notes from the mushaf and every book, grouped and searchable; the home screen shows the latest ones. Tapping a book item opens the book at that page and shows its note.
- **Mushaf size** — Settings → Reading → Mushaf size, or pinch the page: at 100% the exact 15-line printed page; larger sizes show the page's words in more, shorter lines that scroll. Text view size goes up to 64 px.
- **Library** — all nine main hadith books and the eight selections exactly as published on Sunnah.com (51,775 hadith with Arabic, English, chapter headings, grades and Sunnah.com's own reference numbers; jump to any hadith number, copy), plus a reading list for the Sirah, Ibn al-Qayyim, Ibn Taymiyyah and Kitab at-Tawhid. The app hosts no books: each reader gets a book from its publisher, adds the PDF, and it opens in the app's own reader. "My books" takes any PDF from the phone.

## Put it online free with GitHub Pages (works on iPhone)

Everything the app needs is inside this folder (Quran pages, translation, tafsir, hadith and the speech model), so GitHub can host it on its own, free, with no proxy and no usage credits.

1. Make a free account at github.com.
2. Install **GitHub Desktop** (free) from desktop.github.com and sign in. The app is about 900 MB and 1,100 files, which is too much for the website's upload box.
3. In GitHub Desktop: **File → Add Local Repository**, choose the `tilawah` folder, and click **create a repository** when it offers. Name it `tilawah`, then **Create Repository**.
4. Click **Publish repository**, untick **Keep this code private** (free GitHub Pages sites must be public), then **Publish**. The first upload takes a while.
5. On github.com, open the `tilawah` repository → **Settings** → **Pages**. Under **Branch**, choose `main` and `/ (root)`, then **Save**.
6. After a few minutes the page shows your link: `https://YOUR-USERNAME.github.io/tilawah/`.
7. On your iPhone, open that link in **Safari** and tap **Install** on the Quran screen (or Share → Add to Home Screen).

To update the app later: replace the files in the folder, then in GitHub Desktop type a short summary, click **Commit to main**, then **Push origin**. The installed app picks up the new version the next time it's opened online.

GitHub Pages sites can be up to 1 GB; this app uses about 900 MB of that.

## Run it on a computer

In this folder run `python3 -m http.server 8000` and open http://localhost:8000. The microphone works on localhost; on a phone the app needs https (GitHub Pages gives you that).

## Add books

Books aren't hosted. Add a title to a shelf in `SHELVES` near the top of `app.js` (`['Title', null, 'file-name.pdf']`); readers add the PDF themselves and it stays on their phone. Only host a book's PDF in `books/` if its publisher has given permission.

## Change the reciters

In `app.js`, edit `RECITERS` near the top. Each `id` is a folder name on everyayah.com (the audio URL is `https://everyayah.com/data/<id>/001001.mp3` for Al-Fatiha ayah 1). To use your own audio host, change `AUDIO_BASE`; files must be named `SSSAAA.mp3` (surah and ayah, three digits each).

## Rename the app

Change `APP_NAME` in `app.js`, the `<title>` in `index.html`, and `name`/`short_name` in `manifest.webmanifest`.

## How the recitation check works, and its limits

**Quran phoneme model (default).** A streaming speech model trained on Quran recitation runs on the phone itself (`speech-worker.js`, with ONNX Runtime Web in `vendor/ort`). It doesn't guess words: it writes down the sounds it hears, every haraka, shaddah, madd length, ghunnah, ikhfaʾ and qalqalah, about twice a second, so mistakes can't be "auto-corrected" away. The model (about 73 MB, `models/quran-phoneme`) downloads the first time you recite and is kept on the phone; after that it works offline and no audio leaves the device.

**Tajweed checker** (`tajweed.js`). Every word of the Quran has a reference pronunciation in Hafs ʿan ʿAsim (`data/quran-ph.json`), worked out by the open quran-transcript phonetizer: as read in continuous recitation, when you stop on the word (waqf) and when you start from it (ibtidaʾ), with each madd's type. Word by word, the app compares what was heard with it and names the mistake:

The rules and their names follow *Tajweed Rules of the Qur'an* (Kareema Carol Czerepinski, part one), Hafs ʿan ʿAsim by way of ash-Shāṭibiyyah:

- **Clear mistake** (laḥn jalī, red): a wrong or missing letter, a wrong haraka or sukun, a missing or extra shaddah, lām shamsiyyah / qamariyyah.
- **Tajweed** (laḥn khafī, amber, wavy line): a madd too short or too long for its type (natural 2; separated/munfaṣil 4 or 5; attached/muttaṣil 4 or 5, or 6 when stopping on its hamza; ʿāriḍ lis-sukūn 2, 4 or 6; līn when stopping 2, 4 or 6; compulsory/lāzim 6); the noon sakinah and tanween rules (iẓhār, idghām with and without ghunnah, iqlāb, ikhfāʾ); the meem sakinah rules (ikhfāʾ shafawī, idghām mithlayn, iẓhār shafawī); ghunnah on a doubled noon or meem; qalqalah ṣughrā and kubrā.
- **Skipped** (gold): words, phrases or ayahs left out.

Repeating is fine: going back over a word or phrase replaces the earlier attempt. Stutters, an opening taʿawwudh or basmala, stopping and starting anywhere, and joining ayahs are all allowed. Tap a marked word to see what was wrong. Settings → Reciting → What to check chooses all of this, letters and harakat only, or words only.

When the model is unsure (it heard the expected sound as a close second choice), a single difference in a word is not marked; several unsure differences in one word are. A single swap between letters from far-apart articulation points (fa for kaf) in an otherwise right word is taken as the model mishearing; swaps between letters a reader really mixes up (same or neighbouring makhraj, heavy/light pairs such as ص/س, ط/ت, ق/ك, ح/ه) are marked. The checker also measures the room as you recite (the share of correctly read sounds the model was unsure of); in an echoey or noisy room it only marks what it is very sure of. A word said wrongly is marked as a mistake, not as skipped, when the next words line up right after it.

While you recite, words about 15 behind you are settled and kept, so checking stays quick however long you recite, and a mark appears only once it has held for two updates (it doesn't flash up and vanish); a mark you've seen stays in the summary. The microphone is captured on the audio thread (AudioWorklet) and resampled to 16 kHz with a proper low-pass filter, so a busy phone doesn't drop audio.

Measured on professional recitations with one word of the text changed per ayah (a simulated mistake), clean audio: a wrong haraka is caught 99% of the time, a left-out letter 92%, a swapped letter 86–93% (close pairs such as ه/ح in Allah are hard for the model), a missing or extra shaddah 90%, a long vowel held where it should be short 87% (also at a word's end, e.g. ʿalā l- for ʿala l-), an extra letter 82%, a missing ghunnah (clear nun where ikhfaʾ/idgham needs ghunnah) 94%, ghunnah where there should be none 89%, a missing qalqalah 90%; about 1.1% of correctly read words are marked. Phone-quality audio: 79–94%, 1.6% marked. With strong room echo these fall to roughly 53–79%, 5.4% marked. Live, through the microphone path, a 6½-minute error-free recitation of Al-Mulk: 333 words followed, 8 marked (sounds the model itself misheard); learners' teacher-marked mistakes are caught as offline.

Recite anywhere steps over an opening taʿawwudh and basmala and decides the surah from the words after them (Al-Fatiha starts at its basmala, ayah 1); real surah openings from six reciters were located right 22 times of 24 (the other 2 in the right surah, an ayah or two later), single ayahs 70 of 72, none at a wrong place. The length of a pronoun's ṣilah before a hamza (bihī innahu) is not judged: the model hears it as 2 counts even from master reciters.

**Phone's built-in recognizer** (Settings → Reciting → Recitation checking). A general Arabic recognizer that checks words only, and needs internet.

## Data sources

No Quran text, tafsir or hadith is written or edited by hand anywhere in the app.

- **Quran text, page layout and script:** King Fahd Glorious Quran Printing Complex, Madinah Mushaf 1441 AH (calligraphy by Uthman Taha), QCF v4 fonts, from the open `quran-qcf4` dataset. Stored in `mushaf/madinah/`. That dataset leaves out the waqf signs; they were restored from the official fonts, each placed directly after the word it belongs to. The font files may be used for displaying the Quran; redistributing them in a published app needs the rights holders' permission (see `mushaf/madinah/LICENSE.md`).
- **Tafsir Ibn Kathir (English, abridged):** saved in `data/tafsir/` exactly as published by the Quran.com API, with its headings, paragraphs and Arabic quotations. The app only removes code when showing it; it never changes the text.
- **English translation of the Quran:** Sahih International, saved in `data/translation/` exactly as published by the Al Quran Cloud API.
- **Bismillah:** drawn from the outline of the Bismillah glyph in the King Fahd Complex font itself (`mushaf/madinah/bismillah.json`), because Safari draws that very wide glyph with stray strokes.
- **Speech model:** Quran-Lab's Quran phoneme Zipformer (`models/quran-phoneme/README.md`), under the Quran-Lab No-Profit License: **the app must stay free** (no sales, subscriptions, ads or other revenue). Runtime: ONNX Runtime Web (MIT).
- **Tajweed reference:** generated with quran-transcript (MIT, github.com/obadx/quran-transcript) by `tools/build_tajweed_ref.py` and `tools/build_tajweed_ref_edges.py`; Hafs ʿan ʿAsim, madd 4/4/4/4 as the reference, with the other permitted lengths accepted.
- **Fonts:** Figtree and Amiri Quran (SIL Open Font License), in `fonts/`.
- **Hadith:** the nine books and the selections, copied from Sunnah.com's pages (Arabic, English, chapter headings, grades and references as shown there). Hadith that Sunnah.com has no English for, such as all of Sunan ad-Darimi, are shown in Arabic only. `tools/build_hadith.py` turns a Sunnah.com export into the files in `hadith/`.
- **Word timings (follow-along):** Abdul Basit (Murattal and Mujawwad), As-Sudais, Ash-Shatri, Al-Husary, Alafasy, Al-Minshawi (Murattal and Mujawwad) and Ash-Shuraim play Quran.com's full-surah recordings (download.quranicaudio.com), with each ayah's and each word's time from the Quran.com API (api.quran.com, chapter_recitations with segments), so the word being recited is highlighted exactly. Their surah recordings start at ayah 1, so the basmala is played from the reciter's Al-Fatiha first.
- **Recitation audio:** EveryAyah.com (per-ayah files) and MP3Quran.net (full-surah recordings). The full-surah recordings are cut into ayahs with our own timings in `data/timings/`, made by `tools/align_reciter.py`: it lines each recording up with the Quran phoneme model, then moves each ayah start into the pause just before the reciter's first sound. (MP3Quran's published timings start most ayahs 0.3–0.7 s early, inside the end of the previous ayah.) Al-Juhany comes from MP3Quran because EveryAyah's files of him have the left and right channels in opposite phase, which cancels the voice on a phone speaker. Every full-surah recording was checked for the same fault: 20 of Hassan Saleh's surahs have it, and the app plays those from one channel (`data/timings/<reciter>/phase.json`; only those files go through Web Audio, so lock-screen playback of the rest is unchanged). Playing from the start of a surah recites the basmala first (not for Al-Fatiha, where it is the first ayah, or At-Tawbah).
- **Tajweed colours:** QPC V4 tajweed page fonts and glyph codes (King Fahd Glorious Quran Printing Complex), fonts served by Quran.com (verses.quran.foundation) and glyph codes and line layout from the Quran.com API (mushaf 19), in `mushaf/v4/`.
- **Books:** the app hosts none. The English translations belong to their translators and publishers, so the Library lists them, links to where to get them, and opens the PDF a reader adds (kept on that phone only, in IndexedDB).

## Reading books inside the app

Book PDFs open in the app's own reader (zoom, go to page, page bookmarks, highlights and notes, remembers where you stopped, night view in dark mode). The PDF a reader adds is kept on the phone, so it opens offline.

## Offline

After the first visit the app's files are kept on the phone. Quran pages, hadith, translation and tafsir are kept as you open them, and recitations from EveryAyah are kept once played. Streaming new recitations needs internet.
