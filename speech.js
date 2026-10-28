/* On-device Quran recitation listening.
   Records the microphone, sends the audio (16 kHz) to speech-worker.js, which runs
   a Quran-trained phoneme model live, and passes back what was heard as phoneme
   units — every haraka, madd length, ghunnah and qalqalah — for tajweed.js to check. */
(function (root) {
  'use strict';

  const RATE = 16000;
  let worker = null, ready = false, loadErr = null;
  const listeners = new Set();

  function ensureWorker() {
    if (worker) return worker;
    worker = new Worker('speech-worker.js', { type: 'module' });
    worker.onmessage = e => listeners.forEach(fn => fn(e.data));
    worker.onerror = e => { loadErr = (e && e.message) || 'The speech model could not start.'; listeners.forEach(fn => fn({ type: 'error', message: loadErr })); };
    listeners.add(m => { if (m.type === 'ready') ready = true; if (m.type === 'error') loadErr = m.message; });
    worker.postMessage({ type: 'load' });
    return worker;
  }

  function supported() {
    return typeof WebAssembly === 'object' && typeof Worker === 'function' &&
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) &&
      !!(root.AudioContext || root.webkitAudioContext);
  }

  function create(opts) {
    const onUnits = opts.onUnits || (() => {});
    const onState = opts.onState || (() => {});
    const onError = opts.onError || (() => {});
    let stream = null, ctx = null, node = null, src = null, running = false, flushWait = null;
    const units = [], pauses = new Set();

    const listener = m => {
      if (m.type === 'progress') onState('loading', { loaded: m.loaded, total: m.total });
      else if (m.type === 'ready') onState('listening');
      else if (m.type === 'error') onError(m.message);
      else if (m.type === 'units') {
        m.pauses.forEach(p => pauses.add(p));
        if (m.units.length) units.push(...m.units);
        if (m.silence && units.length) pauses.add(units.length);
        onUnits(units, pauses, !!m.silence);
      } else if (m.type === 'flushed' && flushWait) { const f = flushWait; flushWait = null; f(); }
    };

    function down(input, inRate) {
      const ratio = inRate / RATE, n = Math.floor(input.length / ratio), out = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const a = Math.floor(i * ratio), b = Math.min(input.length, Math.floor((i + 1) * ratio));
        let s = 0; for (let j = a; j < b; j++) s += input[j];
        out[i] = s / Math.max(1, b - a);
      }
      return out;
    }

    return {
      async start() {
        if (loadErr) { onError(loadErr); return false; }
        listeners.add(listener);
        ensureWorker();
        worker.postMessage({ type: 'reset' });
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
        node.onaudioprocess = ev => {
          if (!running) return;
          const d = down(ev.inputBuffer.getChannelData(0), ctx.sampleRate);
          worker.postMessage({ type: 'audio', data: d }, [d.buffer]);
        };
        src.connect(node); node.connect(mute); mute.connect(ctx.destination);
        running = true;
        return true;
      },
      // Stop the microphone; resolves once the last words have been heard.
      stop() {
        const wasRunning = running;
        running = false;
        this.release();
        if (!wasRunning || !worker) { listeners.delete(listener); return Promise.resolve({ units, pauses }); }
        return new Promise(res => {
          flushWait = () => { listeners.delete(listener); res({ units, pauses }); };
          worker.postMessage({ type: 'flush' });
          setTimeout(() => { if (flushWait) { const f = flushWait; flushWait = null; f(); } }, 8000);
        });
      },
      abort() { running = false; this.release(); listeners.delete(listener); },
      release() {
        try { node && (node.onaudioprocess = null); src && src.disconnect(); node && node.disconnect(); } catch (_) {}
        try { stream && stream.getTracks().forEach(t => t.stop()); } catch (_) {}
        try { ctx && ctx.close(); } catch (_) {}
        node = src = stream = ctx = null;
      },
      get busy() { return true; },
    };
  }

  root.QuranSpeech = { supported, create, preload: ensureWorker, get ready() { return ready; } };
})(this);
