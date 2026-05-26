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

    // Pitch variation per shot
    const pitchFactor = 0.95 + Math.random() * 0.1;

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
    filter.frequency.setValueAtTime(3000 * pitchFactor, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.1);

    // Громкость
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 1.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    // Низкочастотный удар
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(150 * pitchFactor, now);
    osc.frequency.exponentialRampToValueAtTime(50 * pitchFactor, now + 0.05);
    
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(this.masterVolume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    osc.connect(oscGain).connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.15);
    osc.start(now);
    osc.stop(now + 0.05);

    // Echo 1: delayed copy at now + 0.15
    const echo1 = ctx.createBufferSource();
    echo1.buffer = buffer;
    const echo1Filter = ctx.createBiquadFilter();
    echo1Filter.type = 'lowpass';
    echo1Filter.frequency.value = 1500;
    const echo1Gain = ctx.createGain();
    echo1Gain.gain.setValueAtTime(this.masterVolume * 0.45, now + 0.15);
    echo1Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);
    echo1.connect(echo1Filter).connect(echo1Gain).connect(ctx.destination);
    echo1.start(now + 0.15);
    echo1.stop(now + 0.27);

    // Echo 2: delayed copy at now + 0.28
    const echo2 = ctx.createBufferSource();
    echo2.buffer = buffer;
    const echo2Filter = ctx.createBiquadFilter();
    echo2Filter.type = 'lowpass';
    echo2Filter.frequency.value = 800;
    const echo2Gain = ctx.createGain();
    echo2Gain.gain.setValueAtTime(this.masterVolume * 0.2, now + 0.28);
    echo2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    echo2.connect(echo2Filter).connect(echo2Gain).connect(ctx.destination);
    echo2.start(now + 0.28);
    echo2.stop(now + 0.38);
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

  // === ГАРАЖНАЯ ДВЕРЬ ===
  playGarageDoor(opening: boolean) {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Heavy rumble noise (rolling shutter)
    const bufferSize = Math.floor(ctx.sampleRate * 0.8);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const envelope = Math.sin(t * Math.PI) * 0.6;
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.setValueAtTime(600, now);
    lpFilter.frequency.linearRampToValueAtTime(400, now + 0.8);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.5, now);
    noiseGain.gain.linearRampToValueAtTime(this.masterVolume * 0.35, now + 0.6);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    noise.connect(lpFilter).connect(noiseGain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.8);

    // Low-frequency motor sweep
    const motor = ctx.createOscillator();
    motor.type = 'sawtooth';
    if (opening) {
      motor.frequency.setValueAtTime(60, now);
      motor.frequency.linearRampToValueAtTime(90, now + 0.7);
    } else {
      motor.frequency.setValueAtTime(90, now);
      motor.frequency.linearRampToValueAtTime(55, now + 0.7);
    }

    const motorFilter = ctx.createBiquadFilter();
    motorFilter.type = 'lowpass';
    motorFilter.frequency.value = 200;

    const motorGain = ctx.createGain();
    motorGain.gain.setValueAtTime(this.masterVolume * 0.4, now);
    motorGain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, now + 0.6);
    motorGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    motor.connect(motorFilter).connect(motorGain).connect(ctx.destination);
    motor.start(now);
    motor.stop(now + 0.75);

    // Metallic clang at the end (door hitting stop)
    const clang = ctx.createOscillator();
    clang.frequency.setValueAtTime(opening ? 180 : 220, now + 0.7);
    clang.type = 'sine';

    const clangGain = ctx.createGain();
    clangGain.gain.setValueAtTime(0, now);
    clangGain.gain.setValueAtTime(this.masterVolume * 0.6, now + 0.7);
    clangGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    clang.connect(clangGain).connect(ctx.destination);
    clang.start(now + 0.7);
    clang.stop(now + 0.85);
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

  // === ЗВУК СМЕРТИ ===
  playDeath() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Low rumble oscillator
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 1.0);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(this.masterVolume * 0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    // Noise burst (impact)
    const bufferSize = Math.floor(ctx.sampleRate * 0.5);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 6) * 0.6;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(oscGain).connect(ctx.destination);
    noise.connect(filter).connect(noiseGain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.0);
    noise.start(now);
    noise.stop(now + 0.5);
  }

  // === РАЗРУШЕНИЕ БРОНИ ===
  playArmorBreak() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Cracking/crumbling noise
    const bufferSize = Math.floor(ctx.sampleRate * 0.3);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 8) * 0.7;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 1.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    // Low thud for impact
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    osc.type = 'sine';

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(this.masterVolume * 0.6, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    osc.connect(oscGain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.3);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // === РАЗБИТИЕ СТЕКЛА ===
  playGlassBreak() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // High-frequency noise burst (shattering)
    const bufferSize = Math.floor(ctx.sampleRate * 0.2);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 10) * 0.8;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    // Resonant tinkle
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(4000, now);
    osc.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
    osc.type = 'sine';

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(this.masterVolume * 0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    osc.connect(oscGain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.2);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // === ЗВУК КАРАБКАНЬЯ ===
  playClimb() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Short metallic tap (footstep on metal rung)
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(1200 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
    osc.type = 'sine';

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(this.masterVolume * 0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    // Brief noise component
    const bufferSize = Math.floor(ctx.sampleRate * 0.04);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.4;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(oscGain).connect(ctx.destination);
    noise.connect(noiseGain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
    noise.start(now);
    noise.stop(now + 0.04);
  }

  // === ЗВУК КОЛЮЧЕЙ ПРОВОЛОКИ ===
  playBarbedWireDamage() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Scratching/tearing noise
    const bufferSize = Math.floor(ctx.sampleRate * 0.15);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 12) * 0.5 * (1 + Math.sin(t * 80));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2500;
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.15);
  }

  // === ЗВУК РЕСПАВНА ===
  playRespawn() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Rising tone (ascending notes)
    const notes = [330, 440, 554, 659]; // E4, A4, C#5, E5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      osc.type = 'sine';

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, now + i * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.3);
    });
  }

  // === ТЕРМИНАЛ: ЗАГРУЗОЧНЫЙ ЗВУК ===
  playTerminalStartup() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // 3 ascending tones: C4, E4, G4
    const notes = [261.63, 329.63, 392.00];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      osc.type = 'sine';

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + i * 0.2);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.25, now + i * 0.2 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.4);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.4);
    });
  }

  // === ТЕРМИНАЛ: КЛИК КНОПКИ ===
  playTerminalClick() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.frequency.value = 1200;
    osc.type = 'sine';

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  // === ТЕРМИНАЛ: ОТКРЫТИЕ ОКНА ===
  playTerminalWindowOpen() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    osc.type = 'sine';

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // === ТЕРМИНАЛ: ЗАКРЫТИЕ ОКНА ===
  playTerminalWindowClose() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
    osc.type = 'sine';

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // === ТЕРМИНАЛ: ОШИБКА ===
  playTerminalError() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Two harsh low beeps
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      osc.frequency.value = 200;
      osc.type = 'square';

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.masterVolume * 0.3, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.08);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.08);
    }
  }

  // === ЗВУК ГИЛЬЗЫ ===
  playShellCasing() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // High-pitched metallic clink oscillator
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(4000, now);
    osc.type = 'sine';

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(this.masterVolume * 0.15, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(oscGain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);

    // Tiny noise burst through highpass filter
    const bufferSize = Math.floor(ctx.sampleRate * 0.03);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 40);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    noise.connect(filter).connect(noiseGain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.03);
  }

  // === МЕХАНИЧЕСКИЙ ЦИКЛ ЗАТВОРА ===
  playMechanicalCycle() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Square wave oscillator for bolt click
    const osc = ctx.createOscillator();
    osc.frequency.value = 700;
    osc.type = 'square';

    const bpFilter = ctx.createBiquadFilter();
    bpFilter.type = 'bandpass';
    bpFilter.frequency.value = 1000;
    bpFilter.Q.value = 2;

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(this.masterVolume * 0.12, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(bpFilter).connect(oscGain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);

    // Tiny noise burst for metallic slide texture
    const bufferSize = Math.floor(ctx.sampleRate * 0.02);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 40);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = 2000;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    noise.connect(hpFilter).connect(noiseGain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.02);
  }

  // === SHOTGUN BLAST ===
  playShotgunBlast() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Deep bass boom noise
    const bufferSize = Math.floor(ctx.sampleRate * 0.25);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 8) * 0.9;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 1.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    // Low oscillator
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(this.masterVolume * 1.2, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    osc.connect(oscGain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.25);
    osc.start(now);
    osc.stop(now + 0.08);

    // Echo 1
    const echo1 = ctx.createBufferSource();
    echo1.buffer = buffer;
    const e1f = ctx.createBiquadFilter();
    e1f.type = 'lowpass'; e1f.frequency.value = 800;
    const e1g = ctx.createGain();
    e1g.gain.setValueAtTime(this.masterVolume * 0.5, now + 0.2);
    e1g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    echo1.connect(e1f).connect(e1g).connect(ctx.destination);
    echo1.start(now + 0.2);
    echo1.stop(now + 0.35);

    // Echo 2
    const echo2 = ctx.createBufferSource();
    echo2.buffer = buffer;
    const e2f = ctx.createBiquadFilter();
    e2f.type = 'lowpass'; e2f.frequency.value = 400;
    const e2g = ctx.createGain();
    e2g.gain.setValueAtTime(this.masterVolume * 0.25, now + 0.35);
    e2g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    echo2.connect(e2f).connect(e2g).connect(ctx.destination);
    echo2.start(now + 0.35);
    echo2.stop(now + 0.5);
  }

  // === SHOTGUN PUMP ===
  playShotgunPump() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // First click
    const osc1 = ctx.createOscillator();
    osc1.frequency.value = 500; osc1.type = 'square';
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(this.masterVolume * 0.4, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc1.connect(g1).connect(ctx.destination);
    osc1.start(now); osc1.stop(now + 0.04);

    // Slide noise
    const bufSize = Math.floor(ctx.sampleRate * 0.15);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 10) * 0.4;
    }
    const n = ctx.createBufferSource(); n.buffer = buf;
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 1200; nf.Q.value = 1;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(this.masterVolume * 0.3, now + 0.04);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    n.connect(nf).connect(ng).connect(ctx.destination);
    n.start(now + 0.04); n.stop(now + 0.19);

    // Second click
    const osc2 = ctx.createOscillator();
    osc2.frequency.value = 700; osc2.type = 'square';
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(this.masterVolume * 0.45, now + 0.2);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
    osc2.connect(g2).connect(ctx.destination);
    osc2.start(now + 0.2); osc2.stop(now + 0.23);
  }

  // === PISTOL SHOT ===
  playPistolShot() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Sharp crack noise
    const bufferSize = Math.floor(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 25) * 0.8;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 1500;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 1.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    // Low thump
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(this.masterVolume * 0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    noise.connect(hp).connect(gain).connect(ctx.destination);
    osc.connect(oscGain).connect(ctx.destination);
    noise.start(now); noise.stop(now + 0.08);
    osc.start(now); osc.stop(now + 0.04);

    // Short echo
    const echo = ctx.createBufferSource();
    echo.buffer = buffer;
    const ef = ctx.createBiquadFilter();
    ef.type = 'lowpass'; ef.frequency.value = 1000;
    const eg = ctx.createGain();
    eg.gain.setValueAtTime(this.masterVolume * 0.3, now + 0.1);
    eg.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    echo.connect(ef).connect(eg).connect(ctx.destination);
    echo.start(now + 0.1); echo.stop(now + 0.18);
  }

  // === PISTOL SLIDE ===
  playPistolSlide() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.frequency.value = 2000; osc.type = 'square';
    const og = ctx.createGain();
    og.gain.setValueAtTime(this.masterVolume * 0.25, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(og).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.03);

    // Noise burst
    const bufSize = Math.floor(ctx.sampleRate * 0.02);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) { d[i] = (Math.random() * 2 - 1) * Math.exp(-(i / bufSize) * 30); }
    const n = ctx.createBufferSource(); n.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2500; bp.Q.value = 2;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(this.masterVolume * 0.2, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    n.connect(bp).connect(ng).connect(ctx.destination);
    n.start(now); n.stop(now + 0.02);
  }

  // === PISTOL MAG RELEASE ===
  playPistolMagRelease() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.frequency.value = 1500; osc.type = 'sine';
    const g = ctx.createGain();
    g.gain.setValueAtTime(this.masterVolume * 0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    osc.connect(g).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.02);
  }

  // === TASER BUZZ ===
  playTaserBuzz() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Low sawtooth hum
    const osc = ctx.createOscillator();
    osc.frequency.value = 50; osc.type = 'sawtooth';
    const og = ctx.createGain();
    og.gain.setValueAtTime(this.masterVolume * 0.15, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    // Noise modulated at 120Hz
    const bufSize = Math.floor(ctx.sampleRate * 0.3);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / ctx.sampleRate;
      d[i] = (Math.random() * 2 - 1) * (0.5 + 0.5 * Math.sin(t * 120 * Math.PI * 2)) * 0.3;
    }
    const n = ctx.createBufferSource(); n.buffer = buf;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(this.masterVolume * 0.2, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(og).connect(ctx.destination);
    n.connect(ng).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.3);
    n.start(now); n.stop(now + 0.3);
  }

  // === TASER FIRE ===
  playTaserFire() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Loud crackle noise through highpass
    const bufSize = Math.floor(ctx.sampleRate * 0.15);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 6) * 0.9;
    }
    const n = ctx.createBufferSource(); n.buffer = buf;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(this.masterVolume * 1.5, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    // Oscillator sweep
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(8000, now);
    osc.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
    const og = ctx.createGain();
    og.gain.setValueAtTime(this.masterVolume * 0.5, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    n.connect(hp).connect(ng).connect(ctx.destination);
    osc.connect(og).connect(ctx.destination);
    n.start(now); n.stop(now + 0.15);
    osc.start(now); osc.stop(now + 0.1);
  }

  // === TASER WIRE SHOT ===
  playTaserWireShot() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Puff sound - low noise through lowpass
    const bufSize = Math.floor(ctx.sampleRate * 0.1);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 12) * 0.5;
    }
    const n = ctx.createBufferSource(); n.buffer = buf;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 800;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(this.masterVolume * 0.4, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    // Brief osc
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.06);
    const og = ctx.createGain();
    og.gain.setValueAtTime(this.masterVolume * 0.3, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    n.connect(lp).connect(ng).connect(ctx.destination);
    osc.connect(og).connect(ctx.destination);
    n.start(now); n.stop(now + 0.1);
    osc.start(now); osc.stop(now + 0.06);
  }

  // === SHOTGUN RELOAD SHELL ===
  playShotgunReloadShell() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Metallic click
    const osc = ctx.createOscillator();
    osc.frequency.value = 1000; osc.type = 'sine';
    const og = ctx.createGain();
    og.gain.setValueAtTime(this.masterVolume * 0.3, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(og).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.03);

    // Small noise burst
    const bufSize = Math.floor(ctx.sampleRate * 0.02);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) { d[i] = (Math.random() * 2 - 1) * Math.exp(-(i / bufSize) * 30); }
    const n = ctx.createBufferSource(); n.buffer = buf;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(this.masterVolume * 0.2, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    n.connect(ng).connect(ctx.destination);
    n.start(now); n.stop(now + 0.02);
  }

  // === ТЕРМИНАЛ: ФОНОВЫЙ ГУЛ ===
  startTerminalHum(): () => void {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    osc.frequency.value = 60;
    osc.type = 'sine';

    const gain = ctx.createGain();
    gain.gain.value = this.masterVolume * 0.03;

    osc.connect(gain).connect(ctx.destination);
    osc.start();

    return () => {
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      setTimeout(() => { try { osc.stop(); } catch (_) { /* already stopped */ } }, 150);
    };
  }
}

// Синглтон
export const soundSystem = new SoundSystem();
