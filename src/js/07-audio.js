
/* ---------------------------- 20. 音频（WebAudio 实时合成，无外部资源） ---------------------------- */
const SFX = {
  ac: null, master: null, bus: null, mus: null, noise: null, muted: false,
  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ac = this.ac = new AC();
    this.master = ac.createGain(); this.master.gain.value = this.muted ? 0 : 0.9; this.master.connect(ac.destination);
    this.bus = ac.createGain(); this.bus.gain.value = 0.8; this.bus.connect(this.master);
    this.mus = ac.createGain(); this.mus.gain.value = 0.5; this.mus.connect(this.master);
    const n = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = n;
  },
  setMuted(m) { this.muted = m; if (this.ac) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ac.currentTime, 0.02); },
  tone(f, t, dur, type, vol, dest, f2) {
    const ac = this.ac; if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.bus); o.start(t); o.stop(t + dur + 0.03);
  },
  hiss(t, dur, vol, freq, type, dest) {
    const ac = this.ac; if (!ac) return;
    const s = ac.createBufferSource(); s.buffer = this.noise;
    const fl = ac.createBiquadFilter(); fl.type = type || 'bandpass'; fl.frequency.value = freq; fl.Q.value = 0.8;
    const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || this.bus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.03);
  },
  now() { this.init(); return this.ac ? this.ac.currentTime : 0; },
  coin() { const t = this.now(); this.tone(988, t, 0.07, 'sine', 0.3); this.tone(1319, t + 0.065, 0.2, 'sine', 0.28); this.tone(1976, t + 0.065, 0.14, 'triangle', 0.06); },
  jump() { const t = this.now(); this.tone(300, t, 0.17, 'triangle', 0.26, null, 640); this.hiss(t, 0.1, 0.06, 1800); },
  land() { const t = this.now(); this.hiss(t, 0.07, 0.16, 420, 'lowpass'); this.tone(120, t, 0.08, 'sine', 0.2, null, 70); },
  hit() { const t = this.now(); this.tone(160, t, 0.28, 'square', 0.16, null, 52); this.hiss(t, 0.16, 0.3, 900); this.tone(90, t, 0.2, 'sine', 0.36, null, 45); },
  clear() { this.tone(523, this.now(), 0.07, 'triangle', 0.12, null, 1047); },
  woosh() { this.hiss(this.now(), 0.08, 0.06, 2600); },
  tick(go) { this.tone(go ? 988 : 659, this.now(), go ? 0.3 : 0.1, 'square', 0.1); },
  stage() { const t = this.now(); [659, 784, 988].forEach((f, i) => this.tone(f, t + i * 0.09, 0.24, 'triangle', 0.2)); },
  star() { this.tone(880, this.now(), 0.16, 'sine', 0.26, null, 1760); },
  finish() {
    const t = this.now();
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, t + i * 0.09, 0.32, 'triangle', 0.2));
    [523, 659, 784].forEach(f => this.tone(f, t + 0.6, 1.1, 'sine', 0.1));
  },
  over() { const t = this.now(); [392, 330, 262, 196].forEach((f, i) => this.tone(f, t + i * 0.16, 0.32, 'triangle', 0.2)); },
  click() { this.tone(620, this.now(), 0.05, 'sine', 0.1); },
};
const NOTE = m => 440 * Math.pow(2, (m - 69) / 12);
const MUSIC = [
  { bpm: 122, wave: 'triangle', bass: 'triangle', chords: [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]], bassSteps: [0, 3, 6, 8, 11, 14], leadEvery: 2, kick: [0, 8], snare: [] },
  { bpm: 130, wave: 'square', bass: 'triangle', chords: [[45, 52, 57, 60], [41, 48, 53, 57], [48, 55, 60, 64], [43, 50, 55, 59]], bassSteps: [0, 3, 6, 8, 10, 14], leadEvery: 2, kick: [0, 8], snare: [4, 12] },
  { bpm: 142, wave: 'sawtooth', bass: 'sawtooth', chords: [[50, 57, 62, 65], [46, 53, 58, 62], [53, 60, 65, 69], [48, 55, 60, 64]], bassSteps: 'all', leadEvery: 1, kick: [0, 4, 8, 12], snare: [4, 12] },
];
const ARP = [0, 1, 2, 3, 2, 1, 0, 2, 1, 3, 2, 1, 0, 1, 2, 3];
/* 三段路配三套循环配乐：海边轻快 → 高架流行 → 街区电子 */
const Music = {
  on: false, step: 0, next: 0, timer: 0, stage: 0,
  start(stage) { SFX.init(); this.stage = stage; this.step = 0; this.on = true; if (SFX.ac) this.next = SFX.ac.currentTime + 0.06; if (!this.timer) this.timer = setInterval(() => this.tick(), 40); },
  stop() { this.on = false; },
  setStage(s) { this.stage = s; },
  tick() {
    const ac = SFX.ac; if (!ac || !this.on || paused) return;
    if (this.next < ac.currentTime - 0.2) this.next = ac.currentTime + 0.02;
    while (this.next < ac.currentTime + 0.16) { this.play(this.step, this.next); this.next += 30 / MUSIC[this.stage].bpm; this.step = (this.step + 1) % 64; }
  },
  play(s, t) {
    const m = MUSIC[this.stage], ch = m.chords[(s >> 4) & 3], bar = s & 15;
    if (m.bassSteps === 'all') SFX.tone(NOTE(ch[0] - 12 + (bar & 1 ? 12 : 0)), t, 0.11, m.bass, 0.13, SFX.mus);
    else if (m.bassSteps.indexOf(bar) >= 0) SFX.tone(NOTE(ch[0] - 12), t, 0.2, m.bass, 0.2, SFX.mus);
    if (bar === 0) SFX.tone(NOTE(ch[0]), t, 2.6 / m.bpm * 60, 'sine', 0.05, SFX.mus);
    if (bar % m.leadEvery === 0) SFX.tone(NOTE(ch[ARP[bar]] + 12), t, 0.15, m.wave, 0.04, SFX.mus);
    if (bar === 0 || bar === 10) SFX.tone(NOTE(ch[3] + 12), t, 0.3, 'triangle', 0.07, SFX.mus);
    if (m.kick.indexOf(bar) >= 0) SFX.tone(140, t, 0.12, 'sine', 0.34, SFX.mus, 44);
    if (m.snare.indexOf(bar) >= 0) SFX.hiss(t, 0.09, 0.1, 1900, 'bandpass', SFX.mus);
    if (bar & 1) SFX.hiss(t, 0.03, 0.035, 8000, 'highpass', SFX.mus);
  },
};
