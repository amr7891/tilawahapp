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

    // Resample to 16 kHz, low-passing first (windowed sinc, cut at 7.6 kHz) so high sounds
    // like the sibilants don't fold back into the speech band.
    let firTaps = null, firRate = 0, hist = new Float32Array(0), phase = 0;
    function down(input, inRate) {
      if (inRate === RATE) return new Float32Array(input);
      if (firRate !== inRate) {
        firRate = inRate; const N = 63, fc = 7600 / inRate; firTaps = new Float32Array(N); let sum = 0;
        for (let i = 0; i < N; i++) { const m = i - (N - 1) / 2; const sinc = m === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * m) / (Math.PI * m); const w = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)) + 0.08 * Math.cos(4 * Math.PI * i / (N - 1)); firTaps[i] = sinc * w; sum += firTaps[i]; }
        for (let i = 0; i < N; i++) firTaps[i] /= sum;
        hist = new Float32Array(N - 1); phase = 0;
      }
      const N = firTaps.length, buf = new Float32Array(hist.length + input.length);
      buf.set(hist); buf.set(input, hist.length);
      const ratio = inRate / RATE, out = [];
      let t = phase;
      for (; t + N <= buf.length; t += ratio) {
        const i0 = Math.floor(t); let acc = 0;
        for (let k = 0; k < N; k++) acc += buf[i0 + k] * firTaps[k];
        out.push(acc);
      }
      const keepFrom = Math.floor(t);
      hist = buf.slice(Math.min(keepFrom, buf.length - (N - 1)));
      phase = t - Math.min(keepFrom, buf.length - (N - 1));
      return Float32Array.from(out);
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
        // The device's own rate (asking Safari for 16 kHz with a 48 kHz microphone is buggy on
        // some iOS versions); down() resamples with a proper low-pass filter.
        ctx = new AC();
        if (ctx.state === 'suspended') { try { await ctx.resume(); } catch (_) {} }
        try { src = ctx.createMediaStreamSource(stream); }
        catch (_) { try { ctx.close(); } catch (e) {} ctx = new AC(); if (ctx.state === 'suspended') { try { await ctx.resume(); } catch (e) {} } src = ctx.createMediaStreamSource(stream); }
        firRate = 0;
        const mute = ctx.createGain(); mute.gain.value = 0;
        const send = block => { if (!running) return; const d = down(block, ctx.sampleRate); worker.postMessage({ type: 'audio', data: d }, [d.buffer]); };
        // Capture on the audio thread (AudioWorklet), so a busy page never drops audio;
        // older browsers fall back to a ScriptProcessor.
        node = null;
        if (ctx.audioWorklet && typeof AudioWorkletNode === 'function') {
          try {
            await ctx.audioWorklet.addModule('mic-worklet.js');
            node = new AudioWorkletNode(ctx, 'mic-capture', { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1, channelCountMode: 'explicit' });
            node.port.onmessage = e => send(e.data);
          } catch (_) { node = null; }
        }
        if (!node) {
          node = ctx.createScriptProcessor(4096, 1, 1);
          node.onaudioprocess = ev => send(ev.inputBuffer.getChannelData(0));
        }
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
        try { if (node) { node.onaudioprocess = null; if (node.port) node.port.onmessage = null; } src && src.disconnect(); node && node.disconnect(); } catch (_) {}
        try { stream && stream.getTracks().forEach(t => t.stop()); } catch (_) {}
        try { ctx && ctx.close(); } catch (_) {}
        node = src = stream = ctx = null;
      },
      get busy() { return true; },
    };
  }

  root.QuranSpeech = { supported, create, preload: ensureWorker, get ready() { return ready; } };
})(this);
