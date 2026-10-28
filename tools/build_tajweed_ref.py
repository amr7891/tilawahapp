import json, sys, multiprocessing as mp_
from quran_transcript import Aya, MoshafAttributes, quran_phonetizer
M = MoshafAttributes(rewaya='hafs', madd_monfasel_len=4, madd_mottasel_len=4, madd_mottasel_waqf=4, madd_aared_len=4)

def split_words(t, o):
    ph, mp = o.phonemes, o.mappings
    out = []; i = 0
    for w in t.split(' '):
        span = [x for x in mp[i:i+len(w)] if not x.deleted and x.pos[1] > x.pos[0]]
        if span:
            s = min(x.pos[0] for x in span); e = max(x.pos[1] for x in span)
            rules = []
            for x in mp[i:i+len(w)]:
                for r in (x.tajweed_rules or []):
                    rules.append([x.pos[0]-s, x.pos[1]-s, r.name.en, getattr(r, 'golden_len', 0) or 0])
            out.append([ph[s:e], rules])
        else:
            out.append(['', []])
        i += len(w) + 1
    return out

def phon(text, sura):
    try: return quran_phonetizer(text, M, sura_idx=sura)
    except Exception: return quran_phonetizer(text, M)

def do_ayah(sa):
    s, a = sa
    t = Aya(s, a).get().uthmani
    o = phon(t, s); full = split_words(t, o)
    ws = t.split(' ')
    res = []
    for i, (ph, rules) in enumerate(full):
        waqf = ibt = 0
        if i < len(ws) - 1:   # stopping on this word
            tt = ' '.join(ws[max(0, i-1):i+1]); oo = phon(tt, s); x = split_words(tt, oo)[-1][0]
            if x != ph: waqf = x
        if i > 0:             # starting from this word
            tt = ' '.join(ws[i:i+2]); oo = phon(tt, s); x = split_words(tt, oo)[0][0]
            if x != ph: ibt = x
        res.append([ph, waqf, ibt, rules])
    return f'{s}:{a}', res

if __name__ == '__main__':
    keys = []; a = Aya(1, 1)
    while True:
        g = a.get(); keys.append((g.sura_idx, g.aya_idx))
        if g.sura_idx == 114 and g.aya_idx == 6: break
        a = a.step(1)
    out = {}
    with mp_.Pool(2) as pool:
        for n, (k, v) in enumerate(pool.imap(do_ayah, keys, chunksize=20)):
            out[k] = v
            if n % 500 == 0: print(n, k, flush=True)
    json.dump(out, open('/home/claude/work/ref/quran_ref.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    print('done', len(out))
