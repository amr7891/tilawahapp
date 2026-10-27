/* On-device Quran speech recognition.
   Records the microphone, cuts the recitation at natural pauses, and sends each
   piece to speech-worker.js, which runs Tarteel's Quran-trained Whisper model on
   the phone. Results come back as text, in order, like the browser recognizer's
   final and interim results, so the matcher works the same with either. */
(function (root) {
  'use strict';

  const RATE = 16000;
  const FRAME = 320;            // 20 ms
  const END_SILENCE = 25;       // 500 ms of quiet ends a piece
  const MIN_SPEECH = 6;         // 120 ms of sound starts one
  const PRE_ROLL = 12;          // keep 240 ms before the sound starts
  const MAX_FRAMES = 600;       // 12 s: cut long pieces at the quietest moment

  let worker = null, ready = false, loadErr = null;
  const waiting = new Map();
  let nextId = 1;
  const listeners = new Set();
  let speed = null;             // seconds of audio processed per second

  function ensureWorker() {
    if (worker) return worker;
    worker = new Worker('speech-worker.js', { type: 'module' });
    worker.onmessage = e => {
      const m = e.data;
      if (m.type === 'progress' || m.type === 'ready' || m.type === 'error') {
        if (m.type === 'ready') ready = true;
        if (m.type === 'error') loadErr = m.message;
        listeners.forEach(fn => fn(m));
        return;
      }
      if (m.type === 'text') {
        if (m.seconds && m.ms) { const s = m.seconds / (m.ms / 1000); speed = speed == null ? s : speed * 0.6 + s * 0.4; }
        const cb = waiting.get(m.id); waiting.delete(m.id);
        cb && cb(m);
      }
    };
    worker.onerror = e => { loadErr = (e && e.message) || 'The speech model could not start.'; listeners.forEach(fn => fn({ type: 'error', message: loadErr })); };
    worker.postMessage({ type: 'load' });
    return worker;
  }

  function transcribe(audio) {
    ensureWorker();
    const id = nextId++;
    return new Promise(res => { waiting.set(id, res); worker.postMessage({ type: 'run', id, audio }, [audio.buffer]); });
  }

  function supported() {
    return typeof WebAssembly === 'object' && typeof Worker === 'function' &&
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) &&
      !!(root.AudioContext || root.webkitAudioContext);
  }

  function create(opts) {
    const onText = opts.onText || (() => {});
    const onState = opts.onState || (() => {});
    const onError = opts.onError || (() => {});
    let stream = null, ctx = null, node = null, src = null;
    let running = false;
    // audio state
    let carry = new Float32Array(0);
    let pending = [];             // frames of the current piece
    let pre = [];                 // recent quiet frames
    let speechRun = 0, silenceRun = 0, inSpeech = false;
    let noise = 0.004;
    // results
    const parts = [];             // final text per piece, in order
    let order = 0, interim = '', busyInterim = false, lastInterim = 0;
    let inFlight = 0;
    let flushWaiters = [];

    const listener = m => {
      if (m.type === 'progress') onState('loading', { loaded: m.loaded, total: m.total });
      else if (m.type === 'ready') onState('ready');
      else if (m.type === 'error') onError(m.message);
    };

    function emit() { onText(parts.filter(Boolean).join(' '), interim); }

    function concat(frames) {
      const out = new Float32Array(frames.length * FRAME);
      frames.forEach((f, i) => out.set(f, i * FRAME));
      return out;
    }

    function sendPiece(frames) {
      if (frames.length < MIN_SPEECH + 5) return;
      const k = order++;
      inFlight++;
      onState('checking');
      transcribe(concat(frames)).then(m => {
        parts[k] = (m.text || '').trim();
        if (m.error) onError(m.error);
        inFlight--;
        interim = '';
        emit();
        if (!inFlight) { onState(running ? 'listening' : 'idle'); flushWaiters.splice(0).forEach(fn => fn()); }
      });
    }

    function maybeInterim() {
      // Only on devices fast enough to spare the time, and never ahead of a final piece.
      if (busyInterim || inFlight || !inSpeech || pending.length < 125) return;
      if (speed == null || speed < 1.6) return;
      const now = Date.now();
      if (now - lastInterim < 1800) return;
      lastInterim = now; busyInterim = true;
      transcribe(concat(pending)).then(m => {
        busyInterim = false;
        if (!inFlight && inSpeech) { interim = (m.text || '').trim(); emit(); }
      });
    }

    function onFrame(f) {
      let e = 0; for (let i = 0; i < f.length; i++) e += f[i] * f[i];
      const rms = Math.sqrt(e / f.length);
      const loud = rms > Math.max(noise * 3, 0.006);
      if (!loud) noise = noise * 0.98 + rms * 0.02; else noise = Math.min(noise, noise * 0.999 + rms * 0.001);
      if (!inSpeech) {
        pre.push(f); if (pre.length > PRE_ROLL) pre.shift();
        speechRun = loud ? speechRun + 1 : 0;
        if (speechRun >= MIN_SPEECH) { inSpeech = true; pending = pre.slice(); pre = []; silenceRun = 0; onState('hearing'); }
        return;
      }
      pending.push(f);
      silenceRun = loud ? 0 : silenceRun + 1;
      if (silenceRun >= END_SILENCE) {
        const piece = pending.slice(0, pending.length - END_SILENCE + 8);
        pending = []; inSpeech = false; speechRun = 0;
        sendPiece(piece);
      } else if (pending.length >= MAX_FRAMES) {
        // Cut at the quietest frame in the last 2 seconds.
        let cut = pending.length - 1, low = Infinity;
        for (let i = pending.length - 100; i < pending.length; i++) {
          let s = 0; const g = pending[i]; for (let j = 0; j < g.length; j += 4) s += g[j] * g[j];
          if (s < low) { low = s; cut = i; }
        }
        const piece = pending.slice(0, cut + 1);
        pending = pending.slice(cut + 1);
        sendPiece(piece);
      } else maybeInterim();
    }

    function onAudio(input, inRate) {
      // Down-sample to 16 kHz by averaging.
      const ratio = inRate / RATE;
      const n = Math.floor(input.length / ratio);
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const a = Math.floor(i * ratio), b = Math.min(input.length, Math.floor((i + 1) * ratio));
        let s = 0; for (let j = a; j < b; j++) s += input[j];
        out[i] = s / Math.max(1, b - a);
      }
      const buf = new Float32Array(carry.length + out.length);
      buf.set(carry); buf.set(out, carry.length);
      let o = 0;
      for (; o + FRAME <= buf.length; o += FRAME) onFrame(buf.slice(o, o + FRAME));
      carry = buf.slice(o);
    }

    return {
      async start() {
        if (loadErr) { onError(loadErr); return false; }
        listeners.add(listener);
        ensureWorker();
        onState(ready ? 'listening' : 'loading', null);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
        } catch (e) {
          onError(e && e.name === 'NotAllowedError' ? 'not-allowed' : 'audio-capture');
          return false;
        }
        const AC = root.AudioContext || root.webkitAudioContext;
        ctx = new AC();
        if (ctx.state === 'suspended') { try { await ctx.resume(); } catch (_) {} }
        src = ctx.createMediaStreamSource(stream);
        node = ctx.createScriptProcessor(4096, 1, 1);
        const mute = ctx.createGain(); mute.gain.value = 0;
        node.onaudioprocess = ev => { if (running) onAudio(ev.inputBuffer.getChannelData(0), ctx.sampleRate); };
        src.connect(node); node.connect(mute); mute.connect(ctx.destination);
        running = true;
        if (ready) onState('listening');
        return true;
      },
      // Stop the microphone; resolves with the full text once every piece is checked.
      stop() {
        if (running) {
          running = false;
          if (inSpeech && pending.length) { const piece = pending; pending = []; inSpeech = false; sendPiece(piece); }
          this.release();
        }
        if (!inFlight) return Promise.resolve(parts.filter(Boolean).join(' '));
        return new Promise(res => flushWaiters.push(() => res(parts.filter(Boolean).join(' '))));
      },
      abort() { running = false; this.release(); listeners.delete(listener); },
      release() {
        try { node && (node.onaudioprocess = null); src && src.disconnect(); node && node.disconnect(); } catch (_) {}
        try { stream && stream.getTracks().forEach(t => t.stop()); } catch (_) {}
        try { ctx && ctx.close(); } catch (_) {}
        node = src = stream = ctx = null;
      },
      get busy() { return inFlight > 0; },
    };
  }

  root.QuranSpeech = { supported, create, preload: ensureWorker, get ready() { return ready; } };
})(this);
