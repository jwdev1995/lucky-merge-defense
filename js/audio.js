// WebAudio 합성 효과음 (외부 파일 없음)
export class Audio {
  constructor() { this.ctx = null; this.muted = localStorage.getItem('lmd-mute') === '1'; this.lastShot = 0; }
  ensure() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; } } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  toggle() { this.muted = !this.muted; localStorage.setItem('lmd-mute', this.muted ? '1' : '0'); return this.muted; }
  tone(freq, dur, type = 'square', vol = 0.08, slide = 0) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + dur);
  }
  play(name) {
    if (this.muted || !this.ctx) return;
    const now = performance.now();
    switch (name) {
      case 'shot': if (now - this.lastShot < 70) return; this.lastShot = now; this.tone(520, 0.05, 'triangle', 0.025, -200); break;
      case 'summon_common': this.tone(440, 0.12, 'square', 0.06); break;
      case 'summon_rare': this.tone(523, 0.1, 'square', 0.07); setTimeout(() => this.tone(659, 0.15, 'square', 0.07), 90); break;
      case 'summon_epic': [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.16, 'square', 0.08), i * 90)); break;
      case 'summon_legend': [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'sawtooth', 0.08), i * 100)); break;
      case 'summon_mythic': case 'mythic': [392, 523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'sawtooth', 0.09), i * 90)); break;
      case 'merge': this.tone(330, 0.08, 'square', 0.07, 300); setTimeout(() => this.tone(880, 0.2, 'triangle', 0.08), 90); break;
      case 'coin': this.tone(988, 0.07, 'square', 0.06); setTimeout(() => this.tone(1319, 0.12, 'square', 0.06), 60); break;
      case 'upgrade': this.tone(660, 0.1, 'triangle', 0.08, 220); break;
      case 'fail': this.tone(200, 0.25, 'sawtooth', 0.07, -80); break;
      case 'warn': this.tone(220, 0.3, 'square', 0.08); setTimeout(() => this.tone(220, 0.3, 'square', 0.08), 350); break;
      case 'boss': [110, 110, 98].forEach((f, i) => setTimeout(() => this.tone(f, 0.4, 'sawtooth', 0.12), i * 300)); break;
      case 'bosskill': [784, 988, 1175, 1568].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'square', 0.09), i * 110)); break;
      case 'lose': [392, 349, 311, 262].forEach((f, i) => setTimeout(() => this.tone(f, 0.4, 'sawtooth', 0.1), i * 250)); break;
      case 'win': [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'square', 0.09), i * 130)); break;
    }
  }
}
