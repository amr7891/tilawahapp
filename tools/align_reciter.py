import json, numpy as np, sys, os
exec(open(__import__('os').path.join(__import__('os').path.dirname(__file__),'align_common.py')).read().split("def viterbi")[0])
NEG=-1e9
def viterbi(lp, units, free_end=False):
    S=2*len(units)+1; T=len(lp)
    lab=np.full(S,B); lab[1::2]=units
    dp=np.full(S,NEG); dp[0]=lp[0,B]; dp[1]=lp[0,lab[1]]
    bp=np.zeros((T,S),np.int8)
    skip=np.zeros(S,bool)
    if len(units)>1: skip[3::2]=np.array(units[1:])!=np.array(units[:-1])
    for t in range(1,T):
        a=dp; b=np.concatenate([[NEG],dp[:-1]]); c=np.concatenate([[NEG,NEG],dp[:-2]]); c=np.where(skip,c,NEG)
        m=np.maximum(np.maximum(a,b),c)
        bp[t]=np.where(m==a,0,np.where(m==b,1,2))
        dp=m+lp[t,lab]
    s=int(S-1 if dp[S-1]>dp[S-2] else S-2); score=max(dp[S-1],dp[S-2])
    first=np.full(len(units),-1)
    for t in range(T-1,-1,-1):
        if s%2==1: first[s//2]=t
        s-=int(bp[t,s])
    return first, score/T
ISTI=None
def opener_units():
    global ISTI
    ws=REF['0:1']; isti=tokenize(''.join(w[0] for w in ws))
    b=REF['0:2']; basm=tokenize(''.join(w[0] for w in b[:-1])+(b[-1][1] or b[-1][0]))
    return isti, basm
def align_long(lp, dur, s, n, MS=40):
    seqs=[ayah_units(s,a) for a in range(1,n+1)]
    isti,basm=opener_units()
    starts=[None]*n
    t0=0; a0=0
    rate=None
    first_window=True
    while a0<n:
        # take ayahs until ~900 units or 14 ayahs
        a1=a0; tot=0
        while a1<n and (a1-a0<14) and tot+len(seqs[a1])<=900 or a1==a0: tot+=len(seqs[a1]); a1+=1
        last = a1>=n
        est_frames = tot*(rate or 6.5)   # ~260 ms per unit at most at the start
        L = len(lp)-t0 if last else int(min(len(lp)-t0, est_frames*1.9 + 400))
        win=lp[t0:t0+L]
        best=None
        pre_opts=[[]]
        if first_window: pre_opts=[[],basm,isti+basm,isti] if s not in (1,9) else [[],isti]
        for pre in pre_opts:
            units=list(pre)+[u for q in seqs[a0:a1] for u in q]
            f,sc=viterbi(win,units)
            if best is None or sc>best[1]: best=(f,sc,len(pre))
        f,sc,np_=best
        idx=np_; st=[]
        for q in seqs[a0:a1]: st.append(int(f[idx])+t0); idx+=len(q)
        keep = (a1-a0) if last else max(1,(a1-a0)-3)
        for k in range(keep): starts[a0+k]=st[k]
        if not last:
            # learn the pace from what was aligned
            span=st[keep]-t0 if keep<len(st) else None
            u=sum(len(q) for q in seqs[a0:a0+keep])
            if span and u: rate=max(3.0,min(12.0,span/u*1.15))
            t0=max(t0,st[keep]-10); a0+=keep
        else: a0=a1
        first_window=False
    res=[]
    for k in range(n):
        b=max(0,starts[k]*MS-150)
        e=starts[k+1]*MS-150 if k+1<n else int(dur*1000)
        res.append([b,e])
    return res
if __name__=='__main__':
    raw,s,n=sys.argv[1],int(sys.argv[2]),int(sys.argv[3])
    lp,dur=logprobs(raw)
    print(json.dumps(align_long(lp,dur,s,n)))
