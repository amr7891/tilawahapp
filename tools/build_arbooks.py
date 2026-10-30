"""Turn OpenITI mARkdown texts (classical Arabic, CC BY-NC-SA 4.0) into the app's
Arabic reader files: arbooks/<slug>/index.json + p<n>.json chunks.
Only the author's own text is kept: modern editors' introductions are cut and their
footnote numbers removed. Nothing in the author's words is changed."""
import json, os, re, sys
RAW = sys.argv[1]; OUT = sys.argv[2]
BOOKS = [
  # slug, file stem, Arabic title, author, cut-before (regex of the first line of the author's text) or None
  ('zad', '0751IbnQayyimJawziyya.ZadMacad', 'زاد المعاد في هدي خير العباد', 'ابن قيم الجوزية', None),
  ('madarij', '0751IbnQayyimJawziyya.MadarijSalikin', 'مدارج السالكين', 'ابن قيم الجوزية', None),
  ('dawa', '0751IbnQayyimJawziyya.DaWaDawa', 'الداء والدواء (الجواب الكافي)', 'ابن قيم الجوزية', None),
  ('fawaid', '0751IbnQayyimJawziyya.Fawaid', 'الفوائد', 'ابن قيم الجوزية', None),
  ('tibb', '0751IbnQayyimJawziyya.TibbNabawi', 'الطب النبوي', 'ابن قيم الجوزية', r'^### \| فصول نافعة'),
  ('hadi', '0751IbnQayyimJawziyya.HadiArwah', 'حادي الأرواح إلى بلاد الأفراح', 'ابن قيم الجوزية', None),
  ('ighatha', '0751IbnQayyimJawziyya.IghathatLahfan', 'إغاثة اللهفان من مصايد الشيطان', 'ابن قيم الجوزية', None),
  ('wabil', '0751IbnQayyimJawziyya.WabilSayyib', 'الوابل الصيب من الكلم الطيب', 'ابن قيم الجوزية', None),
  ('tabukiyya', '0751IbnQayyimJawziyya.RisalaTabukiyya', 'الرسالة التبوكية', 'ابن قيم الجوزية', None),
  ('asrar-salat', '0751IbnQayyimJawziyya.AsrarSalat', 'أسرار الصلاة', 'ابن قيم الجوزية', None),
  ('uddat', '0751IbnQayyimJawziyya.CuddatSabirin', 'عدة الصابرين وذخيرة الشاكرين', 'ابن قيم الجوزية', None),
  ('ruh', '0751IbnQayyimJawziyya.RuhFiKalam', 'الروح', 'ابن قيم الجوزية', None),
  ('munafiqin', '0751IbnQayyimJawziyya.SifatMunafiqin', 'صفات المنافقين', 'ابن قيم الجوزية', None),
  ('miftah', '0751IbnQayyimJawziyya.MiftahDarSacada', 'مفتاح دار السعادة', 'ابن قيم الجوزية', None),
  ('hidayat', '0751IbnQayyimJawziyya.HidayatHayara', 'هداية الحيارى في أجوبة اليهود والنصارى', 'ابن قيم الجوزية', None),
  ('tuhfa', '0751IbnQayyimJawziyya.TuhfatMawdud', 'تحفة المودود بأحكام المولود', 'ابن قيم الجوزية', None),
  ('iman', '0728IbnTaymiyya.Iman', 'كتاب الإيمان', 'ابن تيمية', None),
  ('wasitiyya', '0728IbnTaymiyya.CaqidaWasitiyya', 'العقيدة الواسطية', 'ابن تيمية', r'^# بسم الله'),
  ('furqan', '0728IbnTaymiyya.FurqanBaynaAwliya', 'الفرقان بين أولياء الرحمن وأولياء الشيطان', 'ابن تيمية', None),
  ('amrad', '0728IbnTaymiyya.AmradQulub', 'أمراض القلوب وشفاؤها', 'ابن تيمية', None),
  ('mahabba', '0728IbnTaymiyya.QacidaFiMahabba', 'قاعدة في المحبة', 'ابن تيمية', None),
  ('kalim', '0728IbnTaymiyya.KalimTayyib', 'الكلم الطيب', 'ابن تيمية', None),
  ('siyasa', '0728IbnTaymiyya.SiyasaSharciyya', 'السياسة الشرعية في إصلاح الراعي والرعية', 'ابن تيمية', None),
  ('amr', '0728IbnTaymiyya.AmrBiMacruf', 'الأمر بالمعروف والنهي عن المنكر', 'ابن تيمية', None),
  ('alam', '0749IbnCaliSirajDinBazzar.AclamCaliyya', 'الأعلام العلية في مناقب ابن تيمية', 'عمر بن علي البزار', None),
  ('tawhid', '1206IbnCabdWahhab.Tawhid', 'كتاب التوحيد', 'محمد بن عبد الوهاب', None),
  ('sira', '0774IbnKathir.SiraNabawiyya', 'السيرة النبوية', 'ابن كثير', r'^### \| ذكر أخبار العرب'),
  ('tahawiyya', '0321Tahawi.MatnCaqida', 'العقيدة الطحاوية', 'أبو جعفر الطحاوي', None),
  ('tadmuriyya', '0728IbnTaymiyya.RisalaTadmuriyya', 'الرسالة التدمرية', 'ابن تيمية', None),
  ('salat', '0751IbnQayyimJawziyya.Salat', 'الصلاة وحكم تاركها', 'ابن قيم الجوزية', None),
  ('jala', '0751IbnQayyimJawziyya.JalaAfham', 'جلاء الأفهام في فضل الصلاة والسلام على خير الأنام', 'ابن قيم الجوزية', None),
]
# books whose editions number each paragraph: the numbers are the editor's, not the author's
NUMBERED = {'tahawiyya'}
# added later: their stray '$' markers are dropped (the older books keep their block layout unchanged)
NEW = {'tahawiyya', 'tadmuriyya', 'salat', 'jala'}
CHUNK = 60000
def clean(t):
    t = re.sub(r'PageV\d+P\d+', '', t)
    t = re.sub(r'\bms\d+\b', '', t)
    t = re.sub(r'@QB@\s*', '{', t); t = re.sub(r'\s*@QE@', '}', t)
    t = re.sub(r'\s*\(\d{1,4}\)\s*(?=[\s.,،؛:\]\)"]|$)', ' ', t)   # editors' footnote numbers
    t = t.replace('{', '﴿').replace('}', '﴾')            # Quran: ﴿ ﴾
    return re.sub(r'\s+', ' ', t).strip()
os.makedirs(OUT, exist_ok=True)
catalog = []
for slug, stem, title, author, cut in BOOKS:
    lines = open(os.path.join(RAW, stem + '.txt'), encoding='utf8').read().split('\n')
    body = lines[lines.index('#META#Header#End#') + 1:]
    if cut:
        k = next(i for i, l in enumerate(body) if re.search(cut, l)); body = body[k:]
    blocks = []
    for l in body:
        if l.startswith('#META'): continue
        if l.startswith('### '):
            m = re.match(r'### (\|+)\s*(.*)', l)
            lvl = min(3, len(m.group(1))) if m else 1
            txt = clean(m.group(2) if m else l[4:])
            if txt: blocks.append([lvl, txt])
        elif l.startswith('# '):
            txt = clean(l[2:])
            if txt: blocks.append([0, txt])
        elif l.startswith('~~'):
            txt = clean(l[2:])
            if txt and blocks: blocks[-1][1] = (blocks[-1][1] + ' ' + txt).strip()
            elif txt: blocks.append([0, txt])
    if slug in NUMBERED: blocks = [[b[0], re.sub(r'^\$?\s*\d{1,3}\s+', '', b[1])] for b in blocks]
    if slug in NEW: blocks = [[b[0], re.sub(r'^\$\s*', '', b[1])] for b in blocks]
    blocks = [b for b in blocks if b[1] not in ('...', '…', '.')]
    # an edition's own index (فهرس) at the end is not the author's
    for i in range(len(blocks) - 1, max(-1, len(blocks) - 400), -1):
        if blocks[i][0] > 0 and re.match(r'^(ال)?فهر(س|ست)|^فهارس', blocks[i][1]): blocks = blocks[:i]; break
    parts, cur, size, toc = [], [], 0, []
    for b in blocks:
        if cur and ((size > CHUNK and b[0] > 0) or size > 2 * CHUNK): parts.append(cur); cur, size = [], 0
        if b[0] > 0 and len(re.sub(r'[\d\s\-–.]', '', b[1])) >= 3: toc.append([b[0], b[1][:120], len(parts), len(cur)])
        cur.append(b); size += len(b[1])
    if cur: parts.append(cur)
    d = os.path.join(OUT, slug); os.makedirs(d, exist_ok=True)
    for f in os.listdir(d): os.remove(os.path.join(d, f))
    for i, p in enumerate(parts):
        json.dump(p, open(os.path.join(d, f'p{i}.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
    words = sum(len(b[1].split()) for b in blocks)
    json.dump({'title': title, 'author': author, 'parts': len(parts), 'words': words, 'toc': toc,
               'source': 'OpenITI ' + stem.split('.')[-1] if False else 'OpenITI: ' + stem}, open(os.path.join(d, 'index.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
    catalog.append({'slug': slug, 'title': title, 'author': author, 'parts': len(parts), 'words': words})
    print(f'{slug:12} parts {len(parts):4} blocks {len(blocks):6} toc {len(toc):5} words {words}')
json.dump(catalog, open(os.path.join(OUT, 'catalog.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
