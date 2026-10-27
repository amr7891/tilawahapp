# Tilawah — Quran app prototype

A phone-friendly web app (installable to the home screen) with:

- **Full mushaf** — the King Fahd Complex Madinah Mushaf (1441 AH, 604 pages, 15 lines), drawn page by page exactly as printed, with surah headers, ayah markers, waqf signs and rub' al-hizb marks. Swipe or tap the page edges to turn pages, tap the middle to hide the bars, go to any surah, juz or page, bookmark pages and ayahs, highlight ayahs in four colours, and pick up where you stopped. Works offline for pages you've opened. Dark mode included.
- **Play and recite on the page** — tap any word to select its ayah, then play it or recite from it. While a reciter plays, the current ayah is highlighted on the page; while you recite, each word turns green, red (wrong) or amber (skipped), and the page turns with you.
- **Text view** — one surah at a time in the same Madinah script, with the English translation (Sahih International) as an option, off by default.
- **Reciters, ayah by ayah** — Muhammad Ayyub, Mahmoud Khalil Al-Husary, Abdur-Rahman as-Sudais, Maher Al-Muaiqly, Abdul Basit (Murattal and Mujawwad), Abu Bakr al-Shatri, Raad Muhammad al-Kurdi, Saad al-Ghamdi, Saud al-Shuraim and Yasser al-Dossari. Tap the reciter's name on the player (or Settings → Reciter) to switch. Playback speed 0.75×–2×, repeat each ayah 1–10 times, continuous play, lock-screen controls.
- **Translation and tafsir on the page** — select an ayah in the mushaf and tap Translation or Tafsir to read the English meaning or Tafsir Ibn Kathir without leaving the page. In text view, both can be switched on in Settings.
- **Recite to find** — start reciting anywhere in the Quran, without choosing an ayah first. After a few words the app finds where you are, opens that page and follows you word by word (like Tarteel). Tap the mic in the mushaf with no ayah selected, or Recite to find an ayah on the Quran screen.
- **Live recitation checking** — each word turns green, red or amber as you recite, with an optional pop-up showing the correct word, and a summary at the end (score, time, mistakes with buttons to hear the ayah or retry). In memorization mode, tap a hidden word to peek at it.
- **Memorization mode** — words stay hidden while you recite and appear as you say them.
- **Listen and repeat** — the reciter plays an ayah, then the mic opens for you to repeat it, then the next ayah plays.
- **Qibla finder** — GPS bearing and distance to the Kaaba, a live compass on phones, manual coordinates as a fallback.
- **Library** — all nine main hadith books and the eight selections exactly as published on Sunnah.com (51,775 hadith with Arabic, English, chapter headings, grades and Sunnah.com's own reference numbers; jump to any hadith number, copy), plus shelves for the Sirah (Ibn Kathir's Al-Sira al-Nabawiyya, 4 volumes), Ibn al-Qayyim (27 books), Ibn Taymiyyah (21 books) and Kitab at-Tawhid. Books open in the app's own reader.

## Put it online free with GitHub Pages (works on iPhone)

Everything the app needs is inside this folder (Quran pages, translation, tafsir, hadith, all 57 books and the speech model), so GitHub can host it on its own, free, with no proxy and no usage credits.

1. Make a free account at github.com.
2. Install **GitHub Desktop** (free) from desktop.github.com and sign in. The app is about 920 MB and 1,100 files, which is too much for the website's upload box.
3. In GitHub Desktop: **File → Add Local Repository**, choose the `tilawah` folder, and click **create a repository** when it offers. Name it `tilawah`, then **Create Repository**.
4. Click **Publish repository**, untick **Keep this code private** (free GitHub Pages sites must be public), then **Publish**. The first upload takes a while.
5. On github.com, open the `tilawah` repository → **Settings** → **Pages**. Under **Branch**, choose `main` and `/ (root)`, then **Save**.
6. After a few minutes the page shows your link: `https://YOUR-USERNAME.github.io/tilawah/`.
7. On your iPhone, open that link in **Safari** and tap **Install** on the Quran screen (or Share → Add to Home Screen).

To update the app later: replace the files in the folder, then in GitHub Desktop type a short summary, click **Commit to main**, then **Push origin**. The installed app picks up the new version the next time it's opened online.

GitHub Pages sites can be up to 1 GB; this app uses about 920 MB of that.

## Run it on a computer

In this folder run `python3 -m http.server 8000` and open http://localhost:8000. The microphone works on localhost; on a phone the app needs https (GitHub Pages gives you that).

## Add books

Put the PDF in the `books/` folder and add an entry to a shelf in `SHELVES` near the top of `app.js` with its file name, e.g. `['My Book', null, 'books/my-book.pdf']`.

## Change the reciters

In `app.js`, edit `RECITERS` near the top. Each `id` is a folder name on everyayah.com (the audio URL is `https://everyayah.com/data/<id>/001001.mp3` for Al-Fatiha ayah 1). To use your own audio host, change `AUDIO_BASE`; files must be named `SSSAAA.mp3` (surah and ayah, three digits each).

## Rename the app

Change `APP_NAME` in `app.js`, the `<title>` in `index.html`, and `name`/`short_name` in `manifest.webmanifest`.

## How the recitation check works, and its limits

**Quran speech model (default).** Tarteel AI's `whisper-base-ar-quran`, a speech model trained on Quran recitation, runs on the phone itself (in `speech-worker.js`, with ONNX Runtime through Transformers.js, both in `vendor/transformers`). The app cuts your recitation at natural pauses and checks each piece, so marks appear a moment after you pause rather than word by word. The model (about 80 MB, in `models/whisper-base-quran`) downloads the first time you recite and is kept on the phone; after that it works offline and no audio leaves the device.

**Phone's built-in recognizer** (Settings → Reciting → Recitation checking). Faster, word by word, but it's a general Arabic recognizer (on Chrome, Google's service), so it handles tajweed and elongation less well, and it needs internet.

`matcher.js` compares what was heard with the expected words of the mushaf: small spelling differences, how a word sounds (long vowels, silent lam, stopping forms), repeated phrases, extra words, words cut in the wrong place, skipped words and whole skipped ayahs. It catches wrong, missing and skipped words; it does not judge tajweed.

## Data sources

No Quran text, tafsir or hadith is written or edited by hand anywhere in the app.

- **Quran text, page layout and script:** King Fahd Glorious Quran Printing Complex, Madinah Mushaf 1441 AH (calligraphy by Uthman Taha), QCF v4 fonts, from the open `quran-qcf4` dataset. Stored in `mushaf/madinah/`. That dataset leaves out the waqf signs; they were restored from the official fonts, each placed directly after the word it belongs to. The font files may be used for displaying the Quran; redistributing them in a published app needs the rights holders' permission (see `mushaf/madinah/LICENSE.md`).
- **Tafsir Ibn Kathir (English, abridged):** saved in `data/tafsir/` exactly as published by the Quran.com API, with its headings, paragraphs and Arabic quotations. The app only removes code when showing it; it never changes the text.
- **English translation of the Quran:** Sahih International, saved in `data/translation/` exactly as published by the Al Quran Cloud API.
- **Bismillah:** drawn from the outline of the Bismillah glyph in the King Fahd Complex font itself (`mushaf/madinah/bismillah.json`), because Safari draws that very wide glyph with stray strokes.
- **Speech model:** `tarteel-ai/whisper-base-ar-quran` (Apache 2.0), converted for phones as described in `models/whisper-base-quran/README.md`. Runtime: Transformers.js and ONNX Runtime Web (Apache 2.0 / MIT).
- **Fonts:** Figtree and Amiri Quran (SIL Open Font License), in `fonts/`.
- **Hadith:** the nine books and the selections, copied from Sunnah.com's pages (Arabic, English, chapter headings, grades and references as shown there). Hadith that Sunnah.com has no English for, such as all of Sunan ad-Darimi, are shown in Arabic only. `tools/build_hadith.py` turns a Sunnah.com export into the files in `hadith/`.
- **Recitation audio:** EveryAyah.com (per-ayah files) and MP3Quran.net (full-surah recordings, cut into ayahs with MP3Quran's published ayah timings, used for Saad al-Ghamdi and Raad Muhammad al-Kurdi).
- **Books:** classical works by Ibn Kathir, Ibn al-Qayyim, Ibn Taymiyyah and Muhammad ibn Abdul Wahhab, in English translation, in `books/`. The PDFs were collected from Kalamullah.com and the Internet Archive (`tools/book_urls.txt`), which gather them; they are not the authors or translators. Some were made smaller (images re-compressed, nothing else changed; page counts checked). The original works are centuries old; the English translations are modern and belong to their translators and publishers, so check with them before a public release.

## Reading books inside the app

Book PDFs open in the app's own reader (zoom, go to page, page bookmarks, highlight passages by selecting text, remembers where you stopped, night view in dark mode). Scanned books are images of pages, so they can be bookmarked but not highlighted. Every book is in the `books/` folder and is read from your own site; each one is saved on the phone the first time it's opened, so it works offline afterwards.

## Offline

After the first visit the app's files are kept on the phone. Quran pages, hadith, translation, tafsir and books are kept as you open them, and recitations from EveryAyah are kept once played. Streaming new recitations needs internet.
