"""Rebuild the app's hadith library from the Sunnah.com export.

Usage: python3 build_hadith.py sunnah-hadith.json[.gz] ../tilawah/hadith

The export holds, per collection: books -> chapters and hadith rows
[reference, in-book reference, chapter index, narrator, text, arabic, grade].
Text is copied exactly as exported; only blank-line runs are collapsed.
"""
import gzip, json, os, re, shutil, sys

SRC, OUT = sys.argv[1], sys.argv[2]
raw = gzip.open(SRC, 'rt', encoding='utf-8').read() if SRC.endswith('.gz') else open(SRC, encoding='utf-8').read()
lib = json.loads(raw)

# Sunnah.com slug -> app slug, group, titles.
COLLS = [
    ('bukhari', 'bukhari', 'nine', 'Sahih al-Bukhari', 'صحيح البخاري', 'Imam Muhammad ibn Ismail al-Bukhari'),
    ('muslim', 'muslim', 'nine', 'Sahih Muslim', 'صحيح مسلم', 'Imam Muslim ibn al-Hajjaj'),
    ('abudawud', 'abudawud', 'nine', 'Sunan Abi Dawud', 'سنن أبي داود', 'Imam Abu Dawud as-Sijistani'),
    ('tirmidhi', 'tirmidhi', 'nine', "Jami` at-Tirmidhi", 'جامع الترمذي', 'Imam at-Tirmidhi'),
    ('nasai', 'nasai', 'nine', "Sunan an-Nasa'i", 'سنن النسائي', "Imam an-Nasa'i"),
    ('ibnmajah', 'ibnmajah', 'nine', 'Sunan Ibn Majah', 'سنن ابن ماجه', 'Imam Ibn Majah'),
    ('malik', 'malik', 'nine', 'Muwatta Malik', 'موطأ مالك', 'Imam Malik ibn Anas'),
    ('ahmad', 'ahmed', 'nine', 'Musnad Ahmad', 'مسند أحمد', 'Imam Ahmad ibn Hanbal'),
    ('darimi', 'darimi', 'nine', 'Sunan ad-Darimi', 'سنن الدارمي', 'Imam ad-Darimi'),
    ('nawawi40', 'nawawi40', 'selections', 'The Forty Hadith of Imam Nawawi', 'الأربعون النووية', 'Imam Yahya ibn Sharaf an-Nawawi'),
    ('riyadussalihin', 'riyad_assalihin', 'selections', 'Riyad as-Salihin', 'رياض الصالحين', 'Imam Yahya ibn Sharaf an-Nawawi'),
    ('qudsi40', 'qudsi40', 'selections', '40 Hadith Qudsi', 'الأربعون القدسية', ''),
    ('shahwaliullah40', 'shahwaliullah40', 'selections', 'The Forty Hadith of Shah Waliullah', 'الأربعون لشاه ولي الله الدهلوي', 'Shah Waliullah Dehlawi'),
    ('adab', 'aladab_almufrad', 'selections', 'Al-Adab Al-Mufrad', 'الأدب المفرد', 'Imam al-Bukhari'),
    ('shamail', 'shamail_muhammadiyah', 'selections', "Ash-Shama'il Al-Muhammadiyah", 'الشمائل المحمدية', 'Imam at-Tirmidhi'),
    ('bulugh', 'bulugh_almaram', 'selections', 'Bulugh al-Maram', 'بلوغ المرام', 'Ibn Hajar al-Asqalani'),
    ('mishkat', 'mishkat_almasabih', 'selections', 'Mishkat al-Masabih', 'مشكاة المصابيح', 'al-Khatib at-Tabrizi'),
]

def tidy(t):
    return re.sub(r'\n{3,}', '\n\n', (t or '').strip())

def ref_label(ref):
    # Keep Sunnah.com's reference as written. Collection-wide numbers become just the
    # number ("Sahih al-Bukhari 1234" -> "1234"); book references stay whole
    # ("Book 1, Hadith 2").
    m = re.match(r'^Hadith\s+(\d+[a-z]?),\s*\d*\s*40 Hadith', ref) or re.match(r'^Hadith\s+(\d+[a-z]?)\b', ref)
    if m: return m.group(1)
    if re.match(r'^(Book|Introduction|Chapter)\b', ref, re.I): return ref
    m = re.search(r'\s(\d+[a-z]?)\s*$', ref)
    return m.group(1) if m else ref

if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)
index, total = [], 0
for sslug, slug, group, en, ar, author in COLLS:
    C = lib.get(sslug)
    if not C:
        print('MISSING', sslug); continue
    os.makedirs(f'{OUT}/{slug}')
    books, count = [], 0
    for i, b in enumerate([b for b in C['books'] if b['h']], 1):
        rows = []
        for ref, inbook, ch, narr, text, arabic, grade in b['h']:
            rows.append([ref_label(ref), tidy(arabic), tidy(narr), tidy(text), ch, tidy(grade), inbook])
        chapters = [[no, ce, ca] for no, ce, ca in b['chapters']]
        with open(f'{OUT}/{slug}/{i}.json', 'w', encoding='utf-8') as f:
            json.dump({'chapters': chapters, 'h': rows}, f, ensure_ascii=False, separators=(',', ':'))
        nums = [int(re.match(r'\d+', r[0]).group()) for r in rows if re.match(r'^\d+[a-z]?$', r[0])]
        books.append({'en': b['en'] or '', 'ar': b['ar'] or '', 'n': len(rows), 'from': min(nums) if nums else 0, 'to': max(nums) if nums else 0})
        count += len(rows)
    total += count
    index.append({'slug': slug, 'group': group, 'en': en, 'ar': ar, 'author': author, 'count': count,
                  'english': any(r[3] for b in C['books'] for r in [[0, 0, 0, h[4]] for h in b['h']]),
                  'chapters': books})
    print(f'{slug:22} {count:6} hadith  {len(books):3} books')
with open(f'{OUT}/index.json', 'w', encoding='utf-8') as f:
    json.dump(index, f, ensure_ascii=False, separators=(',', ':'))
print('total', total)
