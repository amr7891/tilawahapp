import json, multiprocessing as mp_
from quran_transcript import Aya, MoshafAttributes, quran_phonetizer
exec(open('/home/claude/work/build_ref.py').read().split("def do_ayah")[0])
ref=json.load(open('/home/claude/work/ref/quran_ref.json'))
def uth(s,a): return Aya(s,a).get().uthmani.split(' ')
def job(key):
    s,a=map(int,key.split(':')); out={}
    ws=uth(s,a)
    if a>1:  # first word joined to the previous ayah
        pw=uth(s,a-1)[-1]
        nxt = ws[1] if len(ws)>1 else (uth(s,a+1)[0] if f'{s}:{a+1}' in ref else None)
        tt=' '.join([pw,ws[0]]+([nxt] if nxt else [])); x=split_words(tt,phon(tt,s))[1][0]
        out['first']=x
    nk=f'{s}:{a+1}'
    if nk in ref:  # last word joined to the next ayah
        nw=uth(s,a+1)[0]
        prv = ws[-2] if len(ws)>1 else (uth(s,a-1)[-1] if a>1 else None)
        parts=([prv] if prv else [])+[ws[-1],nw]; tt=' '.join(parts); x=split_words(tt,phon(tt,s))[len(parts)-2][0]
        out['last']=x
    return key,out
if __name__=='__main__':
    res={}
    with mp_.Pool(2) as pool:
        for k,v in pool.imap(job, list(ref.keys()), chunksize=50): res[k]=v
    json.dump(res,open('/home/claude/work/ref/edges.json','w'),ensure_ascii=False)
    print('done',len(res))
