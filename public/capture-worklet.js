class Capture16k extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.pos = 0;
    this.acc = 0;
    this.accN = 0;
    this.out = new Float32Array(320);
    this.n = 0;
  }

  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    // box-filter decimation: average the input samples that fall into each 16 kHz output sample
    for (let i = 0; i < ch.length; i++) {
      this.acc += ch[i];
      this.accN++;
      this.pos += 1;
      if (this.pos >= this.ratio) {
        this.pos -= this.ratio;
        this.out[this.n++] = this.acc / this.accN;
        this.acc = 0;
        this.accN = 0;
        if (this.n === 320) {
          let s = 0;
          for (let k = 0; k < 320; k++) s += this.out[k] * this.out[k];
          this.port.postMessage({ pcm: this.out, rms: Math.sqrt(s / 320) }, [this.out.buffer]);
          this.out = new Float32Array(320);
          this.n = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor("capture-16k", Capture16k);
