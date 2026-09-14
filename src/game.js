import { TABLES, PERKS, SINGLE, EVOLUTIONS, DIFFICULTIES, POOLS } from './config.js';
import { Navigation, distance, clamp } from './navigation.js';
export function random(seed = 87) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export class Game {
  constructor(profile, seed = Date.now()) {
    this.profile = profile;
    this.rand = random(seed);
    this.nav = new Navigation();
    this.state = 'menu';
    this.events = [];
    this.id = 1;
    this.time = 0;
    this.tables = TABLES.map(([x, z], i) => ({
      id: i,
      x,
      z,
      state: 'empty',
      dish: i % 4,
      progress: 0,
      guest: null,
      dirtyAge: 0,
      eatAge: 0,
      servedAt: 0,
    }));
    this.guests = [];
    this.enemies = [];
    this.shots = [];
    this.clouds = [];
    this.queue = [];
    this.perks = { pressure: 1 };
    this.slots = { kitchen: [], combat: ['pressure'] };
    this.evolutionOffered = new Set();
    this.xp = { kitchen: 0, combat: 0 };
    this.level = { kitchen: 1, combat: 1 };
    this.nextXP = { kitchen: 4, combat: 8 };
    this.carried = [];
    this.offers = [];
    this.player = {
      id: 'player',
      x: 0,
      z: 3,
      angle: 0,
      action: '',
      actionAge: 0,
      strike: 0,
      power: 0,
      hurt: 0,
      dash: 0,
      dashLeft: 0,
    };
    this.stats = {
      speed: 5.8,
      range: 2.65,
      capacity: 2,
      work: 1,
      clean: 1,
      cook: 1,
      patience: 1,
      tips: 1,
      damage: 14,
      haste: 1,
      power: 1,
      reach: 9,
      dashCD: 3.2,
    };
    this.health = this.maxHealth = 100;
    this.money = 0;
    this.served = 0;
    this.kills = 0;
    this.missed = 0;
    this.rep = 100;
    this.wave = 1;
    this.waveDuration = this.waveTime = 60;
    this.guestTimer = 1;
    this.spawnTimer = 8;
    this.spawnPending = 0;
    this.sector = 0;
    this.fireTimer = 0;
    this.knifeTimer = 0;
    this.pepperTimer = 0;
    this.panTimer = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.portalCD = 0;
    this.inView = () => false;
    this.input = { x: 0, z: 0, dash: false };
    this.diff = [...DIFFICULTIES[profile.difficulty]];
  }
  emit(type, data = {}) {
    this.events.push({ type, time: this.time, ...data });
    if (this.events.length > 256) this.events.shift();
  }
  start() {
    if (this.state !== 'menu') return;
    const t = this.profile.training,
      s = this.stats;
    s.speed *= 1 + 0.03 * t.speed;
    s.power *= 1 + 0.05 * t.damage;
    s.cook *= 1 + 0.05 * t.cook;
    s.clean *= 1 + 0.05 * t.clean;
    this.maxHealth += 8 * t.health;
    if (this.profile.character === 'zip') {
      s.speed *= 1.15;
      s.capacity++;
    }
    if (this.profile.character === 'tok') {
      this.maxHealth += 24;
      s.power *= 1.15;
      s.speed *= 0.92;
    }
    if (this.profile.character === 'nane') {
      s.cook *= 1.25;
      s.clean *= 1.2;
    }
    this.health = this.maxHealth;
    this.state = 'playing';
    this.profile.record('wave', 1);
    this.profile.save();
    this.emit('start');
  }
  pause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.input = { x: 0, z: 0, dash: false };
    } else if (this.state === 'paused') this.state = 'playing';
  }
  update(dt) {
    if (this.state !== 'playing') return;
    this.time += dt;
    this.waveTime = Math.max(0, this.waveTime - dt);
    const p = this.player;
    p.hurt = Math.max(0, p.hurt - dt);
    p.dashLeft = Math.max(0, p.dashLeft - dt);
    p.dash = Math.max(0, p.dash - dt);
    p.strike = Math.max(0, p.strike - dt);
    p.power = Math.max(0, p.power - dt);
    p.actionAge = Math.max(0, p.actionAge - dt);
    if (!p.actionAge) p.action = '';
    this.portalCD = Math.max(0, this.portalCD - dt);
    let { x, z } = this.input,
      len = Math.hypot(x, z);
    if (len) {
      x /= len;
      z /= len;
      p.angle = Math.atan2(-x, -z);
    }
    if (this.input.dash && !p.dashLeft) {
      p.dash = 0.2;
      p.dashLeft = this.stats.dashCD;
      p.dashDir = len ? { x, z } : { x: -Math.sin(p.angle), z: -Math.cos(p.angle) };
      this.emit('dash', { x: p.x, z: p.z });
    }
    this.input.dash = false;
    if (p.dash > 0) {
      x = p.dashDir.x;
      z = p.dashDir.z;
    }
    let speed = this.stats.speed * (p.dash > 0 ? 3 : 1);
    if (this.perks.express && Math.abs(p.x) < 1.55 && p.z > -4.5 && p.z < 23.5) speed *= 1.45;
    this.nav.move(p, x * speed * dt, z * speed * dt, 0.35);
    p.moving = !!(x || z);
    if (this.perks.portal && !this.portalCD)
      for (const px of [-23, 23])
        if (distance(p, { x: px, z: 10 }) < 0.85) {
          p.x = -px;
          this.portalCD = 2.5;
          this.emit('portal', { x: p.x, z: p.z });
          break;
        }
    this.guestTimer -= dt;
    if (this.guestTimer <= 0 && this.waveTime > 5) {
      this.spawnGuest();
      this.guestTimer = Math.max(2.7, 7.5 - this.wave * 0.65) + this.rand() - 0.5;
    }
    this.updateGuests(dt);
    this.updateTables(dt);
    this.service(dt);
    this.updateEnemies(dt);
    this.updateWeapons(dt);
    if (this.health <= 0 || this.rep <= 0) this.finish(false);
    else if (this.queue.length) this.offer(this.queue.shift(), false);
    else if (this.waveTime <= 0) {
      if (this.wave === 6) {
        if (this.bossDefeated) this.finish(true);
      } else this.offer('kitchen', true);
    }
  }
  spawnGuest() {
    if (this.guests.length >= 12) return null;
    const types = ['normal', ...['vip', 'student', 'regular'].filter((k) => this.perks[k])];
    const kind = types[Math.floor(this.rand() * types.length)],
      patience =
        Math.max(48, 82 - this.wave * 4) *
        this.stats.patience *
        (kind === 'vip' ? 0.8 : kind === 'student' ? 1.7 : 1);
    const g = {
      id: this.id++,
      x: this.rand() - 0.5,
      z: 7.7,
      kind,
      state: 'queue',
      table: -1,
      patience,
      maxPatience: patience,
      dish: Math.floor(this.rand() * 4),
      angle: 0,
      age: 0,
      pay: 0,
      path: [],
    };
    this.guests.push(g);
    this.assignTable(g);
    return g;
  }
  assignTable(g) {
    const t = this.tables.find((t) => t.state === 'empty');
    if (!t) return false;
    t.state = 'arriving';
    t.guest = g;
    t.dish = g.dish;
    t.progress = 0;
    g.table = t.id;
    g.state = 'walking';
    g.path = this.nav.path(g, { x: t.x + Math.sign(t.x) * 1.6, z: t.z });
    return true;
  }
  updateGuests(dt) {
    for (const g of [...this.guests]) {
      g.age += dt;
      if (g.pay > 0) {
        g.pay = Math.max(0, g.pay - dt);
        continue;
      }
      if (g.state === 'queue') {
        if (!this.assignTable(g)) {
          g.patience -= dt * 0.5;
          if (g.patience <= 0) this.loseGuest(g);
        }
      } else if (g.state === 'walking' || g.state === 'leaving') {
        if (g.path.length) {
          const to = g.path[0],
            d = distance(g, to);
          g.angle = Math.atan2(g.x - to.x, g.z - to.z);
          const step = Math.min(d, 2.8 * dt);
          if (d) {
            g.x += ((to.x - g.x) / d) * step;
            g.z += ((to.z - g.z) / d) * step;
          }
          if (d < 0.13) g.path.shift();
        } else if (g.state === 'leaving') this.guests = this.guests.filter((v) => v !== g);
        else {
          g.state = 'seated';
          const t = this.tables[g.table];
          t.state = 'order';
          g.angle = t.x < 0 ? -Math.PI / 2 : Math.PI / 2;
        }
      } else if (g.state === 'seated') {
        const t = this.tables[g.table];
        if (['order', 'cooking', 'ready'].includes(t.state)) {
          g.patience -= dt;
          if (g.patience <= 0) this.loseGuest(g);
        }
      }
    }
  }
  loseGuest(g) {
    if (g.state === 'leaving') return;
    this.rep = Math.max(0, this.rep - 12);
    this.missed++;
    if (g.table >= 0) {
      const t = this.tables[g.table];
      t.state = 'dirty';
      t.guest = null;
      t.progress = 0;
      t.dirtyAge = 0;
      this.carried = this.carried.filter((id) => id !== t.id);
    }
    g.state = 'leaving';
    g.path = this.nav.path(g, { x: 0, z: 8 });
    this.emit('miss', { x: g.x, z: g.z });
  }
  updateTables(dt) {
    for (const t of this.tables) {
      if (t.state === 'cooking') {
        t.progress -= dt * this.stats.cook;
        if (t.progress <= 0) {
          t.state = 'ready';
          this.emit('cooked', { table: t.id });
        }
      }
      if (t.state === 'eating') {
        t.progress -= dt;
        t.eatAge += dt;
        if (t.progress <= 0) this.completeMeal(t);
      }
      if (t.state === 'dirty') {
        t.dirtyAge += dt;
        if (this.perks.robot && t.dirtyAge >= 7) this.cleanTable(t);
      }
    }
  }
  action(kind, time = 0.2) {
    this.player.action = kind;
    this.player.actionAge = time;
  }
  service(dt) {
    const p = this.player,
      s = this.stats;
    if (distance(p, { x: 0, z: -4.5 }) < s.range + 1.4 || this.perks.belt) {
      for (const t of this.tables)
        if (
          t.state === 'ready' &&
          !this.carried.includes(t.id) &&
          this.carried.length < s.capacity
        ) {
          this.carried.push(t.id);
          this.action('pickup', 0.45);
          this.emit('pickup', { table: t.id });
        }
    }
    for (const t of this.tables) {
      if (distance(p, t) > s.range) continue;
      if (t.state === 'order') {
        t.progress += dt * s.work;
        this.action('order');
        if (t.progress >= 0.65) {
          t.state = 'cooking';
          t.progress = 4.5;
          this.emit('order', { table: t.id });
        }
      } else if (t.state === 'ready' && this.carried.includes(t.id)) {
        this.carried = this.carried.filter((id) => id !== t.id);
        t.state = 'eating';
        t.progress = t.duration = t.guest.kind === 'regular' ? 2.5 : 4;
        t.eatAge = 0;
        t.servedAt = this.time;
        t.flightFrom = { x: p.x + 0.5, z: p.z - 0.4 };
        this.action('serve', 0.45);
        this.emit('serve', { table: t.id });
        if (this.perks.bell) {
          for (const e of [...this.enemies])
            if (distance(e, t) < 4.5) this.hurt(e, s.damage * s.power * this.perks.bell);
          this.emit('bell', { x: t.x, z: t.z });
        }
      } else if (t.state === 'dirty') {
        t.progress += dt * s.clean;
        this.action('clean');
        if (t.progress >= 0.85) this.cleanTable(t);
      }
    }
  }
  completeMeal(t) {
    const g = t.guest;
    if (!g) return;
    const amount = Math.floor((12 + this.wave * 2) * (g.kind === 'vip' ? 3 : 1) * this.stats.tips);
    this.money += amount;
    this.served++;
    this.profile.record('served');
    this.addXP('kitchen', g.kind === 'student' ? 3 : 2);
    this.health = Math.min(this.maxHealth, this.health + 4);
    this.rep = Math.min(100, this.rep + (g.kind === 'regular' ? 6 : 1));
    this.emit('coins', {
      x: t.x + Math.sign(t.x) * 0.65,
      z: t.z + 0.45,
      from: { x: g.x, z: g.z },
      amount,
    });
    g.pay = 0.6;
    g.state = 'leaving';
    g.path = this.nav.path(g, { x: 0, z: 8 });
    t.guest = null;
    t.state = 'dirty';
    t.progress = 0;
    t.dirtyAge = 0;
  }
  cleanTable(t) {
    t.state = 'empty';
    t.progress = 0;
    t.guest = null;
    this.emit('clean', { x: t.x, z: t.z });
  }
  addXP(source, amount) {
    this.xp[source] += amount;
    while (this.xp[source] >= this.nextXP[source]) {
      this.xp[source] -= this.nextXP[source];
      this.level[source]++;
      this.nextXP[source] += source === 'combat' ? 6 : 3;
      this.queue.push(source);
    }
  }
  allowed(id) {
    const p = PERKS.find((p) => p.id === id);
    if (!p || (this.perks[id] || 0) >= (SINGLE.has(id) ? 1 : 4)) return false;
    if (EVOLUTIONS[id]) return this.perks[EVOLUTIONS[id]] === 4;
    const slots = this.slots[p.source];
    return slots.includes(id) || slots.length < 6;
  }
  available(source) {
    return PERKS.filter(
      (p) =>
        p.source === source &&
        this.allowed(p.id) &&
        (!EVOLUTIONS[p.id] || !this.evolutionOffered.has(p.id)) &&
        (EVOLUTIONS[p.id] || this.slots[source].length >= 6 || !this.perks[p.id]),
    );
  }
  offer(source, between = false) {
    this.state = 'upgrade';
    this.upgradeSource = source;
    this.between = between;
    let pool = this.available(source);
    this.offers = pool.filter((p) => EVOLUTIONS[p.id]);
    for (const p of this.offers) this.evolutionOffered.add(p.id);
    pool = pool.filter((p) => !this.offers.includes(p));
    while (this.offers.length < 3 && pool.length)
      this.offers.push(pool.splice(Math.floor(this.rand() * pool.length), 1)[0]);
    if (source === 'combat' && this.level.combat === 2 && this.slots.combat.length === 1)
      this.offers = PERKS.filter((p) => ['knife', 'pan', 'pepper'].includes(p.id));
    this.emit('upgrade');
  }
  choose(index) {
    if (this.state !== 'upgrade') return false;
    if (this.offers.length) {
      const p = this.offers[index];
      if (!p || !this.apply(p.id)) return false;
    }
    this.state = 'playing';
    if (this.between) {
      this.wave++;
      this.profile.record('wave', this.wave);
      this.waveDuration = this.waveTime = 60 + (this.wave - 1) * 5;
      this.rep = Math.min(100, this.rep + 10);
      this.guestTimer = 1;
    }
    this.emit('resume');
    return true;
  }
  apply(id) {
    if (!this.allowed(id)) return false;
    const p = PERKS.find((p) => p.id === id),
      slots = this.slots[p.source];
    if (EVOLUTIONS[id]) slots[slots.indexOf(EVOLUTIONS[id])] = id;
    else if (!slots.includes(id)) slots.push(id);
    this.perks[id] = (this.perks[id] || 0) + 1;
    const s = this.stats;
    switch (id) {
      case 'speed':
        s.speed *= 1.18;
        break;
      case 'range':
        s.range += 0.6;
        break;
      case 'capacity':
        s.capacity++;
        break;
      case 'dash':
        s.dashCD *= 0.75;
        break;
      case 'hands':
        s.work *= 1.3;
        break;
      case 'clean':
        s.clean *= 1.35;
        break;
      case 'oven':
        s.cook *= 1.3;
        break;
      case 'decor':
        s.patience *= 1.25;
        for (const g of this.guests) {
          g.patience *= 1.25;
          g.maxPatience *= 1.25;
        }
        break;
      case 'tips':
        s.tips *= 1.3;
        break;
      case 'pressure':
        s.damage *= 1.3;
        break;
      case 'reload':
        s.haste *= 1.25;
        break;
      case 'reach':
        s.reach += 2;
        break;
      case 'might':
        s.power *= 1.25;
        break;
      case 'boulevard':
        this.nav.rebuild(true);
        for (const g of this.guests)
          if (g.state === 'walking')
            g.path = this.nav.path(g, {
              x: this.tables[g.table].x + Math.sign(this.tables[g.table].x) * 1.6,
              z: this.tables[g.table].z,
            });
        break;
    }
    this.player.power = 1.5;
    this.emit('power', { source: p.source });
    return true;
  }
  spawnPoint() {
    const base = ((this.sector++ % 8) * Math.PI) / 4;
    for (let i = 0; i < 32; i++) {
      const a = base + (this.rand() - 0.5) * 0.36 + (Math.floor(i / 4) * Math.PI) / 4,
        r = 22 + this.rand() * 3,
        p = { x: this.player.x + Math.cos(a) * r, z: this.player.z + Math.sin(a) * r };
      if (this.nav.walkable(p, 0.65) && !this.inView(p)) return p;
    }
    return [
      { x: -29, z: -21 },
      { x: 29, z: -21 },
      { x: -29, z: 25 },
      { x: 29, z: 25 },
    ].sort((a, b) => distance(b, this.player) - distance(a, this.player))[0];
  }
  spawnEnemy(kind = null, boss = false) {
    if (this.enemies.length >= 96 && !boss) return null;
    const pool = POOLS[this.wave - 1];
    kind = boss ? 3 : (kind ?? pool[Math.floor(this.rand() * pool.length)]);
    const point = this.spawnPoint(),
      hp =
        (boss
          ? 600
          : kind === 5
            ? 60 + clamp(this.wave - 3, 0, 3) * 3
            : (18 + this.wave * 3.5) * [1, 1.3, 0.8, 2.8, 1.1, 1.8][kind]) * this.diff[1];
    const e = {
      id: this.id++,
      ...point,
      kind,
      boss,
      hp,
      maxHP: hp,
      angle: 0,
      attack: 0,
      recover: 0.3,
      hit: 0,
      swing: 0,
      slow: 0,
      path: [],
      repath: 0,
    };
    this.enemies.push(e);
    if (boss) {
      this.bossSpawned = true;
      this.emit('boss');
    }
    return e;
  }
  updateEnemies(dt) {
    this.spawnTimer -= dt;
    if (this.wave === 6 && !this.bossSpawned && this.waveTime < this.waveDuration - 8)
      this.spawnEnemy(3, true);
    if (this.spawnTimer <= 0 && this.waveTime > 4) {
      this.spawnPending += 3 + this.wave + this.diff[4];
      this.spawnTimer = Math.max(1.8, 3.8 - this.wave * 0.28);
    }
    if (this.spawnPending > 0) {
      this.spawnEnemy();
      this.spawnPending--;
    }
    const cells = new Map(),
      cell = (e) => `${Math.floor(e.x / 1.4)},${Math.floor(e.z / 1.4)}`;
    for (const e of this.enemies) {
      const k = cell(e);
      if (!cells.has(k)) cells.set(k, []);
      cells.get(k).push(e);
    }
    for (const e of this.enemies) {
      for (const k of ['hit', 'swing', 'slow', 'recover']) e[k] = Math.max(0, e[k] - dt);
      const d = distance(e, this.player);
      if (e.attack > 0) {
        e.attack = Math.max(0, e.attack - dt);
        if (!e.attack) {
          if (d < (e.boss ? 2.2 : 1.3)) this.damagePlayer((e.boss ? 22 : 7) * this.diff[2]);
          e.swing = 0.24;
          e.recover = 1.1;
          this.emit('swing', { x: e.x, z: e.z, angle: e.angle });
        }
      } else if (d < (e.boss ? 1.9 : 1.05) && !e.recover) e.attack = 0.6;
      else {
        let target = this.player,
          dx = target.x - e.x,
          dz = target.z - e.z,
          len = Math.hypot(dx, dz) || 1;
        dx /= len;
        dz /= len;
        if (e.kind === 4 && d > 5)
          target = {
            x: target.x - dz * 3 * (e.id % 2 ? 1 : -1),
            z: target.z + dx * 3 * (e.id % 2 ? 1 : -1),
          };
        e.repath -= dt;
        if (!this.nav.walkable({ x: e.x + dx * 0.9, z: e.z + dz * 0.9 }, 0.4) || e.path.length) {
          if (e.repath <= 0) {
            e.path = this.nav.path(e, target);
            e.repath = 1 + (e.id % 5) * 0.1;
          }
          while (e.path.length && distance(e, e.path[0]) < 0.2) e.path.shift();
          if (e.path.length) target = e.path[0];
        }
        dx = target.x - e.x;
        dz = target.z - e.z;
        len = Math.hypot(dx, dz) || 1;
        dx /= len;
        dz /= len;
        e.angle = Math.atan2(-dx, -dz);
        let sx = 0,
          sz = 0;
        const cx = Math.floor(e.x / 1.4),
          cz = Math.floor(e.z / 1.4);
        for (let x = -1; x <= 1; x++)
          for (let z = -1; z <= 1; z++)
            for (const other of cells.get(`${cx + x},${cz + z}`) || []) {
              if (e === other) continue;
              const gap = distance(e, other);
              if (gap > 0.01 && gap < 0.85) {
                sx += ((e.x - other.x) / gap) * (0.85 - gap) * 1.6;
                sz += ((e.z - other.z) / gap) * (0.85 - gap) * 1.6;
              }
            }
        let speed =
          (e.boss ? 1.65 : ([2.15, 2.5, 3.3, 1.55, 3][e.kind] ?? 2.8)) + this.wave * 0.045;
        speed *= this.diff[3] * (e.slow ? 0.45 : 1);
        const ml = Math.max(1, Math.hypot(dx + sx, dz + sz) / 1.25);
        this.nav.move(e, ((dx + sx) / ml) * speed * dt, ((dz + sz) / ml) * speed * dt);
      }
    }
  }
  damagePlayer(amount) {
    const p = this.player;
    if (p.dash || p.hurt || this.state !== 'playing') return;
    this.health = Math.max(0, this.health - amount);
    p.hurt = 0.95;
    this.emit('hurtPlayer', { x: p.x, z: p.z, amount });
  }
  nearest(range) {
    let best = null;
    for (const e of this.enemies) {
      const d = distance(e, this.player);
      if (d < range) {
        best = e;
        range = d;
      }
    }
    return best;
  }
  hurt(e, amount) {
    if (!e || e.hp <= 0) return;
    if (e.kind === 5) amount = Math.min(amount, e.maxHP * 0.34);
    e.hp -= amount;
    e.hit = 0.18;
    this.emit('hit', { x: e.x, z: e.z });
    if (e.hp <= 0) {
      this.enemies = this.enemies.filter((v) => v !== e);
      this.kills++;
      this.profile.record('kills');
      if (e.boss) this.bossDefeated = true;
      this.addXP('combat', e.boss ? 30 : e.kind === 3 ? 8 : 4);
      this.emit('death', { enemy: { ...e } });
    }
  }
  updateWeapons(dt) {
    const s = this.stats,
      p = this.player;
    this.fireTimer -= dt;
    this.knifeTimer -= dt;
    this.pepperTimer -= dt;
    this.panTimer -= dt;
    const target = this.nearest(s.reach);
    if (target) {
      if (this.fireTimer <= 0) {
        this.shots.push({
          id: this.id++,
          kind: 'soda',
          x: p.x + 0.35,
          z: p.z - 0.15,
          life: 1.5,
          target,
        });
        this.fireTimer = 0.52 / s.haste;
        p.strike = 0.24;
        p.strikeKind = 'soda';
        this.emit('fire');
      }
      if (this.perks.knife && this.knifeTimer <= 0) {
        const angle = Math.atan2(target.z - p.z, target.x - p.x),
          n = Math.min(4, this.perks.knife);
        for (let i = 0; i < n; i++) {
          const a = angle + (i - (n - 1) / 2) * 0.13;
          this.shots.push({
            id: this.id++,
            kind: 'knife',
            x: p.x,
            z: p.z,
            vx: Math.cos(a) * 23,
            vz: Math.sin(a) * 23,
            life: s.reach / 20,
            hits: new Set(),
            left: 2 + Math.floor(n / 2),
          });
        }
        this.knifeTimer = 0.8 / s.haste;
        p.strike = 0.24;
        p.strikeKind = 'knife';
      }
      if (this.perks.pepper && this.pepperTimer <= 0) {
        this.clouds.push({
          id: this.id++,
          x: p.x,
          z: p.z,
          radius: 2.1 + 0.3 * this.perks.pepper,
          life: 4,
          tick: 0,
        });
        this.pepperTimer = 2.7 / s.haste;
      }
    }
    for (const shot of [...this.shots]) {
      shot.life -= dt;
      if (shot.kind === 'soda') {
        const e = shot.target;
        if (e.hp <= 0) shot.life = 0;
        else {
          const d = distance(shot, e),
            step = Math.min(d, dt * 19);
          if (d) {
            shot.x += ((e.x - shot.x) / d) * step;
            shot.z += ((e.z - shot.z) / d) * step;
          }
          if (distance(shot, e) < 0.3) {
            this.hurt(e, s.damage * s.power);
            shot.life = 0;
          }
        }
      } else {
        const ox = shot.x,
          oz = shot.z;
        shot.x += shot.vx * dt;
        shot.z += shot.vz * dt;
        for (const e of [...this.enemies]) {
          if (shot.hits.has(e.id)) continue;
          const dx = shot.x - ox,
            dz = shot.z - oz,
            f = clamp(((e.x - ox) * dx + (e.z - oz) * dz) / (dx * dx + dz * dz || 1), 0, 1);
          if (Math.hypot(e.x - ox - f * dx, e.z - oz - f * dz) < (e.boss ? 0.9 : 0.55)) {
            shot.hits.add(e.id);
            this.hurt(e, (20 + this.perks.knife * 6) * s.power);
            if (--shot.left <= 0) {
              shot.life = 0;
              break;
            }
          }
        }
      }
      if (shot.life <= 0) this.shots = this.shots.filter((v) => v !== shot);
    }
    if (this.perks.pan && this.panTimer <= 0) {
      for (let i = 0; i < this.perks.pan; i++) {
        const a = this.time * 2.7 + (i * Math.PI * 2) / this.perks.pan,
          at = { x: p.x + Math.cos(a) * 3, z: p.z + Math.sin(a) * 3 };
        for (const e of [...this.enemies])
          if (distance(e, at) < 1) {
            this.hurt(e, (24 + 6 * this.perks.pan) * s.power);
            e.slow = 0.3;
          }
      }
      this.panTimer = 0.3;
    }
    for (const c of [...this.clouds]) {
      c.life -= dt;
      c.tick -= dt;
      if (c.tick <= 0) {
        for (const e of [...this.enemies])
          if (distance(e, c) < c.radius) {
            this.hurt(e, (7 + this.perks.pepper * 4) * s.power);
            e.slow = 0.7;
          }
        c.tick = 0.5;
      }
      if (c.life <= 0) this.clouds = this.clouds.filter((v) => v !== c);
    }
  }
  finish(won) {
    if (this.state === 'ended') return;
    this.state = 'ended';
    this.won = won;
    if (won) {
      this.profile.record('wins');
      if (this.profile.difficulty > 0) this.profile.record('hard_wins');
    }
    this.profile.best = Math.max(this.profile.best, this.money);
    this.profile.save();
    this.emit('end', { won });
  }
}
