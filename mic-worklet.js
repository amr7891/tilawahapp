// Microphone capture on the audio thread. Sends 4096-sample blocks to the page, which
// queue up even if the page is busy for a moment (so no audio is lost).
class MicCapture extends AudioWorkletProcessor {
  constructor() { super(); this.buf = new Float32Array(4096); this.n = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      let i = 0;
      while (i < ch.length) {
        const k = Math.min(ch.length - i, this.buf.length - this.n);
        this.buf.set(ch.subarray(i, i + k), this.n); this.n += k; i += k;
        if (this.n === this.buf.length) { this.port.postMessage(this.buf, [this.buf.buffer]); this.buf = new Float32Array(4096); this.n = 0; }
      }
    }
    return true;
  }
}
registerProcessor('mic-capture', MicCapture);
