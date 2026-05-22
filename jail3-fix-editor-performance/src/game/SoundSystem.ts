// Процедурные звуки через Web Audio API (без файлов)
export class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterVolume = 0.3;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // === ВЫСТРЕЛ AK-47 ===
  playGunshot() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Шум выстрела
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 15) * 0.8;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Фильтр для "тяжести" звука
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.1);

    // Громкость
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 1.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    // Низкочастотный удар
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);
    
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(this.masterVolume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    osc.connect(oscGain).connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.15);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // === УДАР КУЛАКОМ ===
  playPunch() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Глухой удар
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    // Шлепок
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 30);
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain).connect(ctx.destination);
    noise.connect(noiseGain).connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
    noise.start(now);
    noise.stop(now + 0.05);
  }

  // === ШАГИ ===
  playFootstep() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 25) * 0.3;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800 + Math.random() * 400;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.08);
  }

  // === ДВЕРЬ ОТКРЫТИЕ/ЗАКРЫТИЕ ===
  playDoor(opening: boolean) {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Металлический скрежет
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    
    if (opening) {
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(400, now + 0.3);
    } else {
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.3);
    }

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    // Лязг
    const osc2 = ctx.createOscillator();
    osc2.frequency.setValueAtTime(opening ? 600 : 300, now + 0.25);
    
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(this.masterVolume * 0.4, now + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc2.connect(gain2).connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
    osc2.start(now + 0.25);
    osc2.stop(now + 0.35);
  }

  // === ЗВУК ПОДБОРА ОРУЖИЯ ===
  playPickup() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // === ЗВУК ВЫБРОСА ОРУЖИЯ ===
  playDrop() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    // Звук падения
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 15) * 0.5;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.3, now + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain).connect(ctx.destination);
    noise.connect(noiseGain).connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
    noise.start(now);
    noise.stop(now + 0.25);
  }

  // === ЗВУК НАЧАЛА РАУНДА ===
  playRoundStart() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      osc.type = 'sine';

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, now + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.3);
    });
  }

  // === ЗВУК КОНЦА РАУНДА ===
  playRoundEnd() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const notes = [784, 659, 523]; // G5, E5, C5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      osc.type = 'sine';

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + i * 0.2);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, now + i * 0.2 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.4);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.4);
    });
  }

  // === ПЕРЕЗАРЯДКА ===
  playReload() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    // Щелчок магазина наружу
    const click1 = ctx.createOscillator(); click1.frequency.value = 800; click1.type = 'square';
    const g1 = ctx.createGain(); g1.gain.setValueAtTime(this.masterVolume * 0.3, now); g1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    click1.connect(g1).connect(ctx.destination); click1.start(now); click1.stop(now + 0.05);
    // Скольжение
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-(i / d.length) * 8) * 0.3;
    const n = ctx.createBufferSource(); n.buffer = buf;
    const gn = ctx.createGain(); gn.gain.setValueAtTime(this.masterVolume * 0.15, now + 0.3); gn.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    n.connect(gn).connect(ctx.destination); n.start(now + 0.3); n.stop(now + 0.5);
    // Щелчок магазина внутрь
    const click2 = ctx.createOscillator(); click2.frequency.value = 1200; click2.type = 'square';
    const g2 = ctx.createGain(); g2.gain.setValueAtTime(this.masterVolume * 0.4, now + 0.7); g2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    click2.connect(g2).connect(ctx.destination); click2.start(now + 0.7); click2.stop(now + 0.75);
    // Затвор
    const click3 = ctx.createOscillator(); click3.frequency.value = 600; click3.type = 'sawtooth';
    const g3 = ctx.createGain(); g3.gain.setValueAtTime(this.masterVolume * 0.2, now + 1.0); g3.gain.exponentialRampToValueAtTime(0.001, now + 1.08);
    click3.connect(g3).connect(ctx.destination); click3.start(now + 1.0); click3.stop(now + 1.08);
  }

  // === СУХОЙ ЩЕЛЧОК ===
  playDryFire() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator(); osc.frequency.value = 2000; osc.type = 'square';
    const gain = ctx.createGain(); gain.gain.setValueAtTime(this.masterVolume * 0.2, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain).connect(ctx.destination); osc.start(now); osc.stop(now + 0.03);
  }

  // === ПРИЗЕМЛЕНИЕ ===
  playLand() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-(i / d.length) * 15) * 0.5;
    const n = ctx.createBufferSource(); n.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
    const g = ctx.createGain(); g.gain.setValueAtTime(this.masterVolume * 0.4, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    n.connect(f).connect(g).connect(ctx.destination); n.start(now); n.stop(now + 0.12);
  }

  // === UI клик ===
  playClick() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.frequency.value = 1000;
    osc.type = 'sine';

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // === АТАКА ЗАТОЧКОЙ ===
  playShivAttack() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // High freq noise burst (sharp metallic slash)
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 20) * 0.7;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    // Resonant ring
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(3000, now);
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.08);
    osc.type = 'sine';

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(this.masterVolume * 0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    osc.connect(oscGain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.1);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // === АТАКА ДУБИНКОЙ ===
  playBatonAttack() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Low freq sweep (whoosh)
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    osc.type = 'sine';

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(this.masterVolume * 0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    // Impact noise
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 25) * 0.6;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.7, now + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(oscGain).connect(ctx.destination);
    noise.connect(filter).connect(noiseGain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
    noise.start(now + 0.05);
    noise.stop(now + 0.12);
  }

  // === БЛОК ЩИТОМ ===
  playShieldBlock() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Resonant metallic ring at ~300Hz
    const osc = ctx.createOscillator();
    osc.frequency.value = 300;
    osc.type = 'sine';

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(this.masterVolume * 0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    // Noise burst
    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 30) * 0.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(oscGain).connect(ctx.destination);
    noise.connect(noiseGain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
    noise.start(now);
    noise.stop(now + 0.06);
  }

  // === ЩЕЛЧОК ФОНАРИКА ===
  playFlashlightToggle() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Brief high-freq pulse (click)
    const osc = ctx.createOscillator();
    osc.frequency.value = 3500;
    osc.type = 'square';

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.025);
  }

  // === ЗВУК ЛЕЧЕНИЯ ===
  playHeal() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // 3 ascending sine tones (gentle chime)
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      osc.type = 'sine';

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.25, now + i * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.25);
    });
  }

  // === ЗВУК БИНТОВАНИЯ ===
  playBandageWrap() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Soft rustling (filtered noise with envelope)
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const envelope = Math.sin(t * Math.PI) * 0.4;
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.4);
  }
}

// Синглтон
export const soundSystem = new SoundSystem();
