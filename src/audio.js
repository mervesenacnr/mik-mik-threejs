export class Sound {
  constructor() {
    this.enabled = false;
    this.ctx = null;
    this.last = 0;
  }
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.ctx ??= new AudioContext();
      this.ctx.resume();
    }
    return this.enabled;
  }
  play(event) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const map = {
      order: [660, 0.06],
      pickup: [440, 0.08],
      serve: [880, 0.11],
      coins: [1100, 0.15],
      power: [780, 0.28],
      hit: [140, 0.035],
      dash: [260, 0.07],
      clean: [580, 0.08],
      death: [180, 0.06],
    };
    const a = map[event.type];
    if (!a) return;
    const now = this.ctx.currentTime;
    if (now - this.last < 0.035) return;
    this.last = now;
    const o = this.ctx.createOscillator(),
      gain = this.ctx.createGain();
    o.type = event.type === 'hit' ? 'triangle' : 'sine';
    o.frequency.setValueAtTime(a[0], now);
    o.frequency.exponentialRampToValueAtTime(
      a[0] * (event.type === 'coins' || event.type === 'power' ? 1.7 : 0.6),
      now + a[1],
    );
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + a[1]);
    o.connect(gain).connect(this.ctx.destination);
    o.start(now);
    o.stop(now + a[1] + 0.01);
  }
}
