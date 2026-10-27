// Runs Tarteel's Quran speech model (Whisper base, fine-tuned on recitation)
// on this device. Audio never leaves the phone.
import { pipeline, env } from './vendor/transformers/transformers.min.js';

const base = new URL('./', self.location.href).href;
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = base + 'models/';
env.useBrowserCache = true; // keep the model on the phone after the first download
env.backends.onnx.wasm.wasmPaths = base + 'vendor/transformers/';
env.backends.onnx.wasm.numThreads = 1;

let asr = null;
let loading = null;

function load() {
  if (!loading) {
    const seen = new Map();
    loading = pipeline('automatic-speech-recognition', 'whisper-base-quran', {
      dtype: 'int8',
      device: 'wasm',
      progress_callback: p => {
        if (p.status === 'progress' && p.total) {
          seen.set(p.file, [p.loaded, p.total]);
          let a = 0, b = 0; seen.forEach(([x, y]) => { a += x; b += y; });
          self.postMessage({ type: 'progress', loaded: a, total: b });
        }
      },
    }).then(p => { asr = p; self.postMessage({ type: 'ready' }); return p; });
    loading.catch(e => { loading = null; self.postMessage({ type: 'error', message: String(e && e.message || e) }); });
  }
  return loading;
}

self.onmessage = async e => {
  const m = e.data;
  if (m.type === 'load') { load().catch(() => {}); return; }
  if (m.type === 'run') {
    try {
      await load();
      const t0 = performance.now();
      const out = await asr(m.audio, { language: 'arabic', task: 'transcribe' });
      self.postMessage({ type: 'text', id: m.id, text: out.text || '', ms: performance.now() - t0, seconds: m.audio.length / 16000 });
    } catch (err) {
      self.postMessage({ type: 'text', id: m.id, text: '', error: String(err && err.message || err) });
    }
  }
};
