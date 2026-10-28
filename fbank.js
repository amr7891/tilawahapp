/* Kaldi-compatible log-mel filterbank (the "fbank" features the phoneme model was
   trained on): 25 ms Povey window, 10 ms shift, pre-emphasis 0.97, DC removal,
   512-point FFT, power spectrum, triangular mel filters, natural log.
   Streaming: push audio in any block size, pull whole frames as they complete.
   Works in a worker or on the page (no DOM). */
(function (root) {
  'use strict';

  function melScale(f) { return 1127 * Math.log(1 + f / 700); }

  function makeFbank(opts) {
    const o = Object.assign({ rate: 16000, bins: 80, lowFreq: 20, highFreq: 0, preemph: 0.97, snipEdges: true, scale: 1 }, opts || {});
    const frameLen = Math.round(o.rate * 0.025);   // 400
    const shift = Math.round(o.rate * 0.010);      // 160
    let nfft = 1; while (nfft < frameLen) nfft <<= 1; // 512
    const half = nfft / 2;

    // Povey window
    const win = new Float32Array(frameLen);
    for (let i = 0; i < frameLen; i++) win[i] = Math.pow(0.5 - 0.5 * Math.cos(2 * Math.PI * i / (frameLen - 1)), 0.85);

    // Mel filters (Kaldi: computed on FFT bin centres, in mel space)
    const nyq = o.rate / 2;
    const high = o.highFreq > 0 ? o.highFreq : nyq + o.highFreq;
    const mLow = melScale(o.lowFreq), mHigh = melScale(high), dm = (mHigh - mLow) / (o.bins + 1);
    const binHz = o.rate / nfft;
    const filters = [];
    for (let b = 0; b < o.bins; b++) {
      const l = mLow + b * dm, c = mLow + (b + 1) * dm, r = mLow + (b + 2) * dm;
      let first = -1; const w = [];
      for (let k = 0; k < half; k++) {
        const m = melScale(binHz * k);
        let v = 0;
        if (m > l && m < r) v = m <= c ? (m - l) / (c - l) : (r - m) / (r - c);
        if (v > 0) { if (first < 0) first = k; w.push(v); } else if (first >= 0 && w.length) { /* keep contiguous */ }
      }
      filters.push({ first: Math.max(0, first), w: Float32Array.from(w) });
    }

    // FFT tables
    const cos = new Float32Array(half), sin = new Float32Array(half);
    for (let i = 0; i < half; i++) { cos[i] = Math.cos(2 * Math.PI * i / nfft); sin[i] = -Math.sin(2 * Math.PI * i / nfft); }
    const rev = new Uint16Array(nfft);
    for (let i = 0, bits = Math.log2(nfft); i < nfft; i++) { let x = i, y = 0; for (let j = 0; j < bits; j++) { y = (y << 1) | (x & 1); x >>= 1; } rev[i] = y; }
    const re = new Float32Array(nfft), im = new Float32Array(nfft);
    function fft() {
      for (let i = 0; i < nfft; i++) { const j = rev[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
      for (let size = 2; size <= nfft; size <<= 1) {
        const hs = size >> 1, step = nfft / size;
        for (let s = 0; s < nfft; s += size) for (let k = 0; k < hs; k++) {
          const wr = cos[k * step], wi = sin[k * step], a = s + k, b = a + hs;
          const tr = re[b] * wr - im[b] * wi, ti = re[b] * wi + im[b] * wr;
          re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        }
      }
    }

    const frame = new Float32Array(frameLen);
    const power = new Float32Array(half + 1);
    function compute(buf, start, out) {
      // copy with optional reflection at the start (snip_edges = false)
      for (let i = 0; i < frameLen; i++) {
        let idx = start + i;
        if (idx < 0) idx = -idx - 1;
        frame[i] = buf[idx] * o.scale;
      }
      let mean = 0; for (let i = 0; i < frameLen; i++) mean += frame[i]; mean /= frameLen;
      for (let i = 0; i < frameLen; i++) frame[i] -= mean;
      for (let i = frameLen - 1; i > 0; i--) frame[i] -= o.preemph * frame[i - 1];
      frame[0] -= o.preemph * frame[0];
      re.fill(0); im.fill(0);
      for (let i = 0; i < frameLen; i++) re[i] = frame[i] * win[i];
      fft();
      for (let k = 0; k <= half; k++) power[k] = re[k] * re[k] + im[k] * im[k];
      for (let b = 0; b < o.bins; b++) {
        const f = filters[b]; let e = 0;
        for (let j = 0; j < f.w.length; j++) e += f.w[j] * power[f.first + j];
        out[b] = Math.log(Math.max(e, 1.1920929e-07));
      }
    }

    // streaming state
    let buf = new Float32Array(0), offset = 0, next = o.snipEdges ? 0 : -((frameLen - shift) >> 1);
    return {
      bins: o.bins,
      accept(samples) {
        const nb = new Float32Array(buf.length + samples.length); nb.set(buf); nb.set(samples, buf.length); buf = nb;
        const frames = [];
        while (next + frameLen - offset <= buf.length) {
          const out = new Float32Array(o.bins);
          compute(buf, next - offset, out);
          frames.push(out);
          next += shift;
        }
        // drop audio no longer needed
        const keep = Math.max(0, next - offset);
        if (keep > 0 && next - offset > 0) { buf = buf.slice(keep); offset += keep; }
        return frames;
      },
      reset() { buf = new Float32Array(0); offset = 0; next = o.snipEdges ? 0 : -((frameLen - shift) >> 1); },
    };
  }

  const api = { makeFbank };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Fbank = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
