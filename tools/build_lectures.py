"""Build lectures/<series>.json and lectures/catalog.json from the exported follow-along data.

Input: batch files with blocks
  @@<idx>|<book>|<order>|<lessons>|<with timings>
  <reversed video id>|[title|]<points>
points: comma list; first item 't:part:block' (base 36 time delta and block), later items
'dt.db' (deltas) or 'dt:part:block' when the part changes.
meta.txt: idx|book|scholar|scholarAr|channel
"""
import json, os, sys, re

def decode(s):
    out, t, p, b = [], 0, None, 0
    for item in [x for x in s.split(',') if x]:
        if ':' in item:
            dt, pp, bb = item.split(':'); t += int(dt, 36); p = int(pp); b = int(bb, 36)
        else:
            dt, db = item.split('.'); t += int(dt, 36); b += int(db, 36)
        out.append([t, p, b])
    return out

def main(src, dest, skip):
    meta = {}
    for ln in open(os.path.join(src, 'meta.txt'), encoding='utf-8'):
        ln = ln.rstrip('\n')
        if not ln: continue
        i, book, en, ar, ch = ln.split('|')
        meta[int(i)] = dict(book=book, scholar=en, scholarAr=ar, channel=ch)
    series = {}
    for fn in sorted(f for f in os.listdir(src) if re.match(r'b\d+\.txt$', f)):
        cur = None
        for ln in open(os.path.join(src, fn), encoding='utf-8'):
            ln = ln.rstrip('\n')
            if not ln or ln in ('BEGINDATA', 'ENDDATA'): continue
            if ln.startswith('@@'):
                i = int(ln[2:].split('|')[0]); cur = series.setdefault(i, []); del cur[:]; continue
            parts = ln.split('|')
            rid, pts = parts[0], parts[-1]
            cur.append({'v': rid[::-1], 'sync': decode(pts)})
    cat = json.load(open(os.path.join(dest, 'catalog.json'), encoding='utf-8'))
    keep = [c for c in cat if not c.get('auto')]
    for i, lessons in sorted(series.items()):
        if i in skip or i not in meta: continue
        m = meta[i]
        timed = sum(1 for l in lessons if l['sync'])
        if timed < max(1, len(lessons) * 0.4): print('skip (few timings)', i, m['book'], m['scholar'], timed, len(lessons)); continue
        slug = re.sub(r'[^a-z]+', '-', m['scholar'].lower().replace('ā','a').replace('ī','i').replace('ū','u').replace('ḥ','h').replace('ṣ','s').replace('ḍ','d').replace('ṭ','t').replace('ẓ','z').replace('ʿ','').replace('ʾ','')).strip('-')
        slug = re.sub(r'^(shaykh|dr)-', '', slug)
        sid = f"{m['book']}-{slug}"[:60]
        json.dump({'book': m['book'], 'source': 'Arabic auto-captions of each lesson, matched to the text of the book', 'lessons': lessons},
                  open(os.path.join(dest, sid + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        keep = [c for c in keep if c['id'] != sid]
        keep.append(dict(id=sid, book=m['book'], title='', scholar=m['scholar'], scholarAr=m['scholarAr'], channel=m['channel'], playlist='', count=len(lessons), auto=1))
        print('ok', sid, len(lessons), timed)
    json.dump(keep, open(os.path.join(dest, 'catalog.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], {int(x) for x in sys.argv[3].split(',')} if len(sys.argv) > 3 else set())
