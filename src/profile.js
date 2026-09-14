import { ACHIEVEMENTS, TRAINING, CHARACTERS, COSTUMES } from './config.js';
export const PROFILE_KEY = 'mik-mik-threejs-profile-v1';
export class Profile {
  constructor(storage = null) {
    this.storage = storage;
    this.wallet = 0;
    this.stats = { served: 0, kills: 0, wave: 0, wins: 0, hard_wins: 0 };
    this.training = Object.fromEntries(TRAINING.map((t) => [t[0], 0]));
    this.character = 'mik';
    this.costume = 'chef';
    this.fur = 0;
    this.cloth = 0;
    this.eye = 'round';
    this.difficulty = 0;
    this.best = 0;
    this.unlocked = new Set();
    this.notices = [];
    this.dirty = false;
    this.saveError = false;
    try {
      const s = JSON.parse(storage?.getItem(PROFILE_KEY) || 'null');
      if (s) this.load(s);
    } catch {}
  }
  load(s) {
    const n = (v, max = 1e9) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
    this.wallet = n(s.wallet);
    this.best = n(s.best);
    for (const k in this.stats) this.stats[k] = n(s.stats?.[k]);
    for (const k in this.training) this.training[k] = n(s.training?.[k], 5);
    for (const a of ACHIEVEMENTS) if (this.stats[a[2]] >= a[3]) this.unlocked.add(a[0]);
    if (CHARACTERS.some((c) => c.id === s.character && this.open(c.unlock)))
      this.character = s.character;
    if (COSTUMES.some((c) => c[0] === s.costume && this.open(c[2]))) this.costume = s.costume;
    this.fur = n(s.fur, 3);
    this.cloth = n(s.cloth, 3);
    if (['round', 'sharp', 'sleepy', 'oval'].includes(s.eye)) this.eye = s.eye;
    this.difficulty = n(s.difficulty, 2);
    if (!this.difficultyOpen(this.difficulty)) this.difficulty = 0;
  }
  open(id) {
    return !id || this.unlocked.has(id);
  }
  difficultyOpen(i) {
    return Number.isInteger(i) && i >= 0 && i < 3 && (i < 2 || this.open('victory'));
  }
  record(key, amount = 1) {
    if (!(key in this.stats) || amount < 0) return;
    const before = this.stats[key];
    this.stats[key] = key === 'wave' ? Math.max(before, amount) : before + amount;
    if (key === 'served') this.wallet += amount;
    if (key === 'kills') this.wallet += Math.floor(this.stats.kills / 10) - Math.floor(before / 10);
    if (key === 'wins') this.wallet += 30;
    for (const a of ACHIEVEMENTS) {
      if (!this.open(a[0]) && this.stats[a[2]] >= a[3]) {
        this.unlocked.add(a[0]);
        this.notices.push(a[1]);
        if (a[0] === 'survivor') this.wallet += 20;
        if (a[0] === 'hard_win') this.wallet += 50;
      }
    }
    this.dirty = true;
  }
  price(id) {
    return 10 + 10 * this.training[id];
  }
  buy(id) {
    if (!(id in this.training) || this.training[id] >= 5 || this.wallet < this.price(id))
      return false;
    this.wallet -= this.price(id);
    this.training[id]++;
    this.save();
    return true;
  }
  choose(key, value) {
    if (key === 'character' && !CHARACTERS.some((c) => c.id === value && this.open(c.unlock)))
      return false;
    if (key === 'costume' && !COSTUMES.some((c) => c[0] === value && this.open(c[2]))) return false;
    if (key === 'difficulty' && !this.difficultyOpen(value)) return false;
    if (['fur', 'cloth'].includes(key) && (!Number.isInteger(value) || value < 0 || value > 3))
      return false;
    if (key === 'eye' && !['round', 'sharp', 'sleepy', 'oval'].includes(value)) return false;
    if (!['character', 'costume', 'difficulty', 'fur', 'cloth', 'eye'].includes(key)) return false;
    this[key] = value;
    this.save();
    return true;
  }
  save() {
    try {
      this.storage?.setItem(
        PROFILE_KEY,
        JSON.stringify({
          version: 1,
          wallet: this.wallet,
          stats: this.stats,
          training: this.training,
          character: this.character,
          costume: this.costume,
          fur: this.fur,
          cloth: this.cloth,
          eye: this.eye,
          difficulty: this.difficulty,
          best: this.best,
        }),
      );
      this.dirty = false;
      this.saveError = false;
      return true;
    } catch {
      this.dirty = true;
      this.saveError = true;
      return false;
    }
  }
}
