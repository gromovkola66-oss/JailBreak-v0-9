/**
 * Audio Manager - Programmatic sound effects via Web Audio API
 * No external audio files required.
 */

class AudioManager {
  constructor() {
    this.ctx = null;
    this.engineNodes = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      // Web Audio API not available
      this.initialized = false;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startEngine() {
    if (!this.initialized) this.init();
    if (!this.ctx) return;
    this.resume();

    if (this.engineNodes) return; // already running

    const ctx = this.ctx;

    // Master gain for engine sound
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);

    // Sawtooth oscillator 1 (base frequency)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 80;
    const gain1 = ctx.createGain();
    gain1.gain.value = 0.3;
    osc1.connect(gain1);
    gain1.connect(masterGain);

    // Sawtooth oscillator 2 (detuned for thickness)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = 82;
    const gain2 = ctx.createGain();
    gain2.gain.value = 0.3;
    osc2.connect(gain2);
    gain2.connect(masterGain);

    // Noise generator (for rocket roar texture)
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    // Filter noise to low rumble
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    filter.Q.value = 1;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.4;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);

    osc1.start();
    osc2.start();
    noise.start();

    this.engineNodes = { osc1, osc2, noise, masterGain, filter, gain1, gain2, noiseGain };
  }

  updateEngine(throttle) {
    if (!this.engineNodes) return;
    const { masterGain, osc1, osc2, filter } = this.engineNodes;
    // Volume proportional to throttle
    masterGain.gain.value = throttle * 0.25;
    // Frequency rises with throttle for intensity
    osc1.frequency.value = 80 + throttle * 40;
    osc2.frequency.value = 82 + throttle * 42;
    filter.frequency.value = 300 + throttle * 400;
  }

  stopEngine() {
    if (!this.engineNodes) return;
    const { osc1, osc2, noise, masterGain } = this.engineNodes;
    try {
      masterGain.gain.value = 0;
      osc1.stop();
      osc2.stop();
      noise.stop();
    } catch (e) {
      // Ignore if already stopped
    }
    this.engineNodes = null;
  }

  playExplosion() {
    if (!this.initialized) this.init();
    if (!this.ctx) return;
    this.resume();

    const ctx = this.ctx;

    // Noise burst for explosion
    const bufferSize = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.3));
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.value = 0.5;
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + 1.5);

    // Cleanup nodes after sound completes
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  playVictory() {
    if (!this.initialized) this.init();
    if (!this.ctx) return;
    this.resume();

    const ctx = this.ctx;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const duration = 0.3;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * duration);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * duration + duration * 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * duration);
      osc.stop(ctx.currentTime + i * duration + duration);

      // Cleanup nodes after sound completes
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    });
  }
}

export default AudioManager;
