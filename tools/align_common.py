import onnxruntime as ort, json, numpy as np, sys, subprocess, os, kaldi_native_fbank as knf, math
ZP='/home/claude/work/zp/'
io=json.load(open(ZP+'model-io.json')); B=io['blankId']
so=ort.SessionOptions(); so.intra_op_num_threads=int(os.environ.get('THREADS','1'))
sess=ort.InferenceSession(ZP+'model.int8.onnx',so,providers=['CPUExecutionProvider'])
names=[o.name for o in sess.get_outputs()]
sys.path.insert(0,'/home/claude/tilawah')
REF=json.load(open('/home/claude/tilawah/data/quran-ph.json'))
toks={}; maxlen=1
for line in open(ZP+'tokens.txt',encoding='utf-8'):
    t,i=line.rstrip('\n').rsplit(' ',1); i=int(i)
    if t!='<blank>': toks[t]=i; maxlen=max(maxlen,len(t))
def tokenize(ph):
    out=[]; i=0
    while i<len(ph):
        for L in range(min(maxlen,len(ph)-i),0,-1):
            if ph[i:i+L] in toks: out.append(toks[ph[i:i+L]]); i+=L; break
        else: i+=1
    return out
def ayah_units(s,a):
    ws=REF[f'{s}:{a}']
    ph=''.join(w[0] for w in ws[:-1]) + (ws[-1][1] or ws[-1][0])   # stop at the ayah end
    if ws[0][2]: ph=ws[0][2]+ph[len(ws[0][0]):]                      # start form of the first word
    return tokenize(ph)
def logprobs(wav):
    a=np.fromfile(wav,dtype=np.int16).astype(np.float32)/32768
    o=knf.FbankOptions(); o.frame_opts.dither=0; o.frame_opts.snip_edges=False; o.mel_opts.num_bins=80; o.mel_opts.high_freq=-400
    f=knf.OnlineFbank(o); f.accept_waveform(16000,a); f.input_finished()
    F=np.array([f.get_frame(i) for i in range(f.num_frames_ready)],np.float32)
    T,sh=io['chunkFrames'],io['chunkShift']
    F=np.concatenate([F,np.full((T+sh,80),F.min(),np.float32)])
    st={x['input']:np.zeros(x['shape'],np.float32 if x['dtype']=='float32' else np.int64) for x in io['states']}
    out=[]; i=0
    while i+T<=len(F):
        feeds={'x':F[None,i:i+T]}; feeds.update(st); r=sess.run(None,feeds)
        for x in io['states']: st[x['input']]=r[names.index(x['output'])]
        out.append(r[0][0]); i+=sh
    return np.concatenate(out), len(a)/16000
def viterbi(lp, units):
    # CTC forced alignment; returns the frame where each unit is first emitted
    S=2*len(units)+1; T=len(lp)
    lab=np.full(S,B); lab[1::2]=units
    NEG=-1e9
    dp=np.full(S,NEG); dp[0]=lp[0,B]; dp[1]=lp[0,lab[1]]
    bp=np.zeros((T,S),np.int8)
    skip=np.zeros(S,bool); skip[3::2]=np.array(units[1:])!=np.array(units[:-1])
    for t in range(1,T):
        a=dp; b=np.concatenate([[NEG],dp[:-1]]); c=np.concatenate([[NEG,NEG],dp[:-2]]); c=np.where(skip,c,NEG)
        m=np.maximum(np.maximum(a,b),c)
        bp[t]=np.where(m==a,0,np.where(m==b,1,2))
        dp=m+lp[t,lab]
    s=int(S-1 if dp[S-1]>dp[S-2] else S-2)
    first=np.full(len(units),-1)
    for t in range(T-1,-1,-1):
        if s%2==1: first[s//2]=t
        s-=int(bp[t,s])
    return first
def align_surah(wav,s,nayahs):
    lp,dur=logprobs(wav)
    seqs=[]
    basm = s not in (1,9)
    if basm: seqs.append(tokenize(''.join(w[0] for w in REF['0:2'][:-1])+REF['0:2'][-1][1]))
    for a in range(1,nayahs+1): seqs.append(ayah_units(s,a))
    units=[u for q in seqs for u in q]; starts=np.cumsum([0]+[len(q) for q in seqs])
    first=viterbi(lp,units)
    fr=40
    st=[int(first[starts[k]])*fr for k in range(len(seqs))]
    res=[]
    k0=1 if basm else 0
    for k in range(k0,len(seqs)):
        b=max(0,st[k]-150)
        e=st[k+1]-150 if k+1<len(seqs) else int(dur*1000)
        res.append([b,e])
    return res
if __name__=='__main__':
    wav,s,n=sys.argv[1],int(sys.argv[2]),int(sys.argv[3])
    print(json.dumps(align_surah(wav,s,n)))
