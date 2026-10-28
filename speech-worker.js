// Live Quran phoneme recognition on this device.
// Audio (16 kHz) comes in from speech.js; Kaldi filterbank features are cut into
// 61-frame chunks (48-frame step) and run through the cache-aware streaming
// Zipformer CTC model in models/quran-phoneme. Each new phoneme unit is sent back
// with the model's next-best guesses, and long silences are marked as pauses.
// Audio never leaves the phone.
import * as ort from './vendor/ort/ort.wasm.min.mjs';
import './fbank.js';

const base = new URL('./', self.location.href).href;
ort.env.wasm.wasmPaths = base + 'vendor/ort/';
ort.env.wasm.numThreads = 1;

const MODEL = base + 'models/quran-phoneme/';
let io = null, session = null, loading = null;
let fb = null, frames = [], pos = 0, states = null, busy = false, flushing = false;
let prev = -1, blankRun = 0, nUnits = 0, frameNo = 0;
const PAUSE_FRAMES = 8; // 8 × 40 ms of silence = a pause
let pending = [], pendingPauses = [];

async function fetchCached(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not load ' + url.split('/').pop());
  return res;
}

function load() {
  if (!loading) {
    loading = (async () => {
      io = await (await fetchCached(MODEL + 'model-io.json')).json();
      const res = await fetchCached(MODEL + 'model.int8.onnx');
      const total = +res.headers.get('content-length') || 72705392;
      const reader = res.body.getReader(); const parts = []; let got = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        parts.push(value); got += value.length;
        self.postMessage({ type: 'progress', loaded: got, total });
      }
      const buf = new Uint8Array(got); let o = 0; parts.forEach(p => { buf.set(p, o); o += p.length; });
      session = await ort.InferenceSession.create(buf, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
      reset();
      self.postMessage({ type: 'ready' });
    })();
    loading.catch(e => { loading = null; self.postMessage({ type: 'error', message: String(e && e.message || e) }); });
  }
  return loading;
}

function zeroStates() {
  const s = {};
  for (const x of io.states) {
    const n = x.shape.reduce((a, b) => a * b, 1);
    s[x.input] = x.dtype === 'int64' ? new ort.Tensor('int64', new BigInt64Array(n), x.shape) : new ort.Tensor('float32', new Float32Array(n), x.shape);
  }
  return s;
}

function reset() {
  fb = Fbank.makeFbank({ bins: io.featureDim, highFreq: -400, snipEdges: false });
  frames = []; pos = 0; states = zeroStates();
  prev = -1; blankRun = 0; nUnits = 0; frameNo = 0; pending = []; pendingPauses = [];
}

async function runChunks() {
  if (busy || !session) return;
  busy = true;
  try {
    const T = io.chunkFrames, shift = io.chunkShift, D = io.featureDim, B = io.blankId;
    while (frames.length - pos >= T) {
      const x = new Float32Array(T * D);
      for (let i = 0; i < T; i++) x.set(frames[pos + i], i * D);
      const feeds = Object.assign({ [io.featureInput]: new ort.Tensor('float32', x, [1, T, D]) }, states);
      const out = await session.run(feeds);
      const next = {};
      for (const s of io.states) next[s.input] = out[s.output];
      states = next;
      const lp = out[io.logProbOutput];
      const [, n, V] = lp.dims; const data = lp.data;
      for (let t = 0; t < n; t++) {
        const row = t * V;
        let k = 0, best = -Infinity;
        for (let v = 0; v < V; v++) if (data[row + v] > best) { best = data[row + v]; k = v; }
        if (k === B) blankRun++;
        if (k !== prev && k !== B) {
          if (blankRun >= PAUSE_FRAMES && nUnits) pendingPauses.push(nUnits);
          blankRun = 0;
          // next-best guesses (probabilities), for the checker's benefit of the doubt
          const alt = [];
          for (let v = 0; v < V; v++) if (v !== B) { const p = Math.exp(data[row + v]); if (p >= 0.04) alt.push([v, Math.round(p * 1000) / 1000]); }
          alt.sort((a, b) => b[1] - a[1]);
          pending.push({ id: k, t: frameNo, alt: alt.slice(0, 4) });
          nUnits++;
        }
        prev = k; frameNo++;
      }
      pos += shift;
      // keep memory small
      if (pos > 2000) { frames = frames.slice(pos); pos = 0; }
      if (pending.length || pendingPauses.length) {
        self.postMessage({ type: 'units', units: pending, pauses: pendingPauses, silence: blankRun >= PAUSE_FRAMES });
        pending = []; pendingPauses = [];
      } else if (blankRun === PAUSE_FRAMES) self.postMessage({ type: 'units', units: [], pauses: [], silence: true });
    }
  } finally { busy = false; }
}

self.onmessage = async e => {
  const m = e.data;
  if (m.type === 'load') { load().catch(() => {}); return; }
  if (m.type === 'reset') { await load(); while (busy) await new Promise(r => setTimeout(r, 10)); reset(); return; }
  if (m.type === 'audio') {
    try { await load(); } catch (_) { return; }
    for (const f of fb.accept(m.data)) frames.push(f);
    runChunks();
    return;
  }
  if (m.type === 'flush') {
    try { await load(); } catch (_) { self.postMessage({ type: 'flushed' }); return; }
    while (busy) await new Promise(r => setTimeout(r, 10));
    // pad with silence so the last words get through the model
    const pad = io.chunkFrames + io.chunkShift;
    for (const f of fb.accept(new Float32Array(160 * pad))) frames.push(f);
    await runChunks();
    self.postMessage({ type: 'units', units: pending, pauses: pendingPauses, silence: true });
    pending = []; pendingPauses = [];
    self.postMessage({ type: 'flushed' });
  }
};
