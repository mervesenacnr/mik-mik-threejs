import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { Profile, PROFILE_KEY } from '../src/profile.js';
import { Navigation, distance } from '../src/navigation.js';
import { TABLES, POOLS, PERKS } from '../src/config.js';
const make = () => {
  const g = new Game(new Profile(), 41);
  g.start();
  g.spawnTimer = 999;
  g.guestTimer = 999;
  return g;
};
const advance = (g, seconds) => {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) g.update(1 / 60);
};
test('proximity restaurant loop: order, cook, collect, serve, eat, pay and clean exactly once', () => {
  const g = make(),
    guest = g.spawnGuest(),
    t = g.tables[0];
  guest.state = 'seated';
  guest.x = t.x - 1.6;
  guest.z = t.z;
  t.state = 'order';
  g.player.x = t.x + 2;
  g.player.z = t.z;
  advance(g, 0.7);
  assert.equal(t.state, 'cooking');
  advance(g, 4.6);
  assert.equal(t.state, 'ready');
  assert.equal(g.carried.length, 0);
  g.player.x = 0;
  g.player.z = -4.4;
  advance(g, 0.05);
  assert.deepEqual(g.carried, [0]);
  g.player.x = t.x + 2;
  g.player.z = t.z;
  advance(g, 0.05);
  assert.equal(t.state, 'eating');
  assert.equal(g.carried.length, 0);
  advance(g, 4.1);
  assert.equal(g.served, 1);
  assert.equal(g.profile.stats.served, 1);
  assert.equal(g.profile.wallet, 1);
  assert.equal(g.money, 14);
  assert.equal(g.xp.kitchen, 2);
  assert.equal(g.xp.combat, 0);
  assert.equal(g.events.filter((e) => e.type === 'coins').length, 1);
  advance(g, 1);
  assert.equal(t.state, 'empty');
  assert.equal(g.served, 1);
});
test('unserved guests lose patience and invalidate carried food', () => {
  const g = make(),
    guest = g.spawnGuest(),
    t = g.tables[0];
  guest.state = 'seated';
  guest.patience = 0.01;
  t.state = 'ready';
  g.carried = [0];
  advance(g, 0.1);
  assert.equal(t.state, 'dirty');
  assert.equal(g.rep, 88);
  assert.equal(g.missed, 1);
  assert.equal(g.carried.length, 0);
  assert.equal(g.money, 0);
});
test('pause and upgrade freeze simulation, cooldowns, meals and rewards', () => {
  const g = make();
  g.spawnGuest();
  g.player.dashLeft = 2;
  g.pause();
  const before = JSON.stringify([g.time, g.guests, g.tables, g.player]);
  advance(g, 2);
  assert.equal(JSON.stringify([g.time, g.guests, g.tables, g.player]), before);
  g.pause();
  assert.equal(g.state, 'playing');
  g.offer('combat');
  const time = g.time;
  advance(g, 2);
  assert.equal(g.time, time);
  g.pause();
  assert.equal(g.state, 'upgrade');
  assert.equal(g.choose(-1), false);
  assert.equal(g.state, 'upgrade');
  assert.equal(g.choose(0), true);
});
test('human spawn distribution follows cats/dogs and human takes 5 soda / 3 melee hits', () => {
  assert.ok(POOLS[0].every((k) => k === 0));
  assert.ok(!POOLS[1].includes(5));
  for (const pool of POOLS.slice(2)) {
    const count = pool.filter((k) => k === 5).length;
    assert.ok(count / pool.length <= 0.12);
  }
  for (const [damage, hits] of [
    [14, 5],
    [26, 3],
    [30, 3],
    [999999, 3],
  ]) {
    const g = make();
    g.wave = 3;
    const e = g.spawnEnemy(5);
    for (let i = 1; i < hits; i++) {
      g.hurt(e, damage);
      assert.ok(e.hp > 0, `${damage} survives ${i}`);
    }
    g.hurt(e, damage);
    assert.equal(g.kills, 1);
    assert.equal(g.enemies.length, 0);
    g.hurt(e, damage);
    assert.equal(g.kills, 1);
    assert.equal(g.xp.combat, 4);
    assert.equal(g.xp.kitchen, 0);
  }
});
test('6+6 inventory prioritizes new items and upgrades occupied items at capacity', () => {
  const g = make();
  assert.ok(g.available('combat').every((p) => p.id !== 'pressure'));
  for (const id of ['knife', 'pan', 'pepper', 'bell', 'reload']) assert.ok(g.apply(id));
  assert.equal(g.slots.combat.length, 6);
  assert.equal(g.allowed('reach'), false);
  assert.ok(g.available('combat').every((p) => g.slots.combat.includes(p.id)));
  for (let i = 0; i < 3; i++) g.apply('knife');
  assert.equal(g.perks.knife, 4);
  assert.equal(g.allowed('knife'), false);
  for (const id of ['clean', 'capacity', 'speed', 'range', 'hands', 'oven']) g.apply(id);
  assert.equal(g.slots.kitchen.length, 6);
  assert.equal(g.allowed('tips'), false);
});
test('automation evolutions require IV, offered once, replace base slot', () => {
  const g = make();
  assert.equal(g.allowed('robot'), false);
  assert.equal(g.allowed('belt'), false);
  for (let i = 0; i < 4; i++) {
    g.apply('clean');
    g.apply('capacity');
  }
  g.offer('kitchen');
  assert.ok(g.offers.some((p) => p.id === 'robot'));
  assert.ok(g.offers.some((p) => p.id === 'belt'));
  const robot = g.offers.findIndex((p) => p.id === 'robot');
  g.choose(robot);
  assert.ok(g.slots.kitchen.includes('robot'));
  assert.ok(!g.slots.kitchen.includes('clean'));
  g.offer('kitchen');
  assert.ok(!g.offers.some((p) => p.id === 'belt'));
  assert.equal(g.slots.kitchen.length, 2);
});
test('combat level two guarantees first active weapon choice', () => {
  const g = make();
  g.addXP('combat', 8);
  advance(g, 0.05);
  assert.deepEqual(
    g.offers.map((p) => p.id),
    ['knife', 'pan', 'pepper'],
  );
  assert.equal(g.level.kitchen, 1);
  assert.equal(g.level.combat, 2);
});
test('map paths reach every chair, kitchen, perimeter and both sides of partitions', () => {
  const n = new Navigation();
  for (const [x, z] of [
    ...TABLES.map(([x, z]) => [x + Math.sign(x) * 1.6, z]),
    [0, -4.5],
    [-29, -21],
    [29, 25],
  ]) {
    const to = { x, z },
      path = n.path({ x: 0, z: 8 }, to);
    assert.ok(path.length, `path ${x},${z}`);
    assert.ok(distance(path.at(-1), to) < 0.8);
    assert.ok(path.every((p) => n.walkable(p, 0.22)));
  }
  assert.equal(n.walkable({ x: 4, z: 2.4 }), false);
  n.rebuild(true);
  assert.equal(n.walkable({ x: 4, z: 2.4 }), true);
});
test('dash moves faster, grants invulnerability, respects world bounds and cooldown', () => {
  const g = make();
  g.player.x = 30;
  g.player.z = 0;
  g.input = { x: 1, z: 0, dash: true };
  g.update(1 / 60);
  const health = g.health;
  g.damagePlayer(50);
  assert.equal(g.health, health);
  advance(g, 0.3);
  assert.ok(g.player.x < 32);
  assert.ok(g.player.dashLeft > 2);
  assert.equal(g.player.dash, 0);
  const n = make();
  n.input = { x: 1, z: 0, dash: false };
  n.update(1 / 60);
  assert.ok(n.player.x < 0.11);
});
test('achievement unlocks and permanent spending survive independent save roundtrip', () => {
  const data = new Map(),
    store = { getItem: (k) => data.get(k), setItem: (k, v) => data.set(k, v) },
    p = new Profile(store);
  assert.equal(p.choose('character', 'zip'), false);
  p.record('served', 10);
  assert.equal(p.open('service'), true);
  assert.equal(p.wallet, 10);
  assert.equal(p.choose('character', 'zip'), true);
  assert.equal(p.buy('speed'), true);
  assert.equal(p.wallet, 0);
  assert.equal(p.buy('speed'), false);
  p.record('wave', 4);
  assert.equal(p.wallet, 20);
  p.record('wave', 4);
  assert.equal(p.wallet, 20);
  p.choose('fur', 3);
  p.choose('eye', 'sharp');
  p.save();
  const loaded = new Profile(store);
  assert.equal(loaded.character, 'zip');
  assert.equal(loaded.training.speed, 1);
  assert.equal(loaded.fur, 3);
  assert.equal(loaded.eye, 'sharp');
  assert.ok(data.has(PROFILE_KEY));
});
test('profile clamps malformed and locked selections and handles storage failures', () => {
  const p = new Profile({
    getItem: () => '{oops',
    setItem: () => {
      throw Error('full');
    },
  });
  assert.equal(p.save(), false);
  assert.equal(p.saveError, true);
  p.load({
    wallet: -200,
    training: { speed: 100 },
    fur: 900,
    cloth: -1,
    character: 'tok',
    costume: 'royal',
    difficulty: 2,
    eye: 'evil',
  });
  assert.equal(p.wallet, 0);
  assert.equal(p.training.speed, 5);
  assert.equal(p.fur, 3);
  assert.equal(p.cloth, 0);
  assert.equal(p.character, 'mik');
  assert.equal(p.costume, 'chef');
  assert.equal(p.difficulty, 0);
  assert.equal(p.eye, 'round');
  assert.equal(p.choose('fur', 100), false);
});
test('new day traits, wave transitions, boss victory and loss count once', () => {
  const p = new Profile();
  p.record('kills', 75);
  p.choose('character', 'tok');
  p.training.health = 2;
  const g = new Game(p);
  g.start();
  assert.equal(g.maxHealth, 140);
  g.waveTime = 0;
  g.spawnTimer = g.guestTimer = 999;
  g.update(0.02);
  assert.equal(g.state, 'upgrade');
  g.choose(0);
  assert.equal(g.wave, 2);
  assert.equal(g.waveTime, 65);
  g.wave = 6;
  g.waveTime = 0;
  g.bossDefeated = true;
  g.queue = [];
  g.update(0.02);
  assert.equal(g.state, 'ended');
  assert.equal(g.won, true);
  assert.equal(p.stats.wins, 1);
  g.finish(true);
  assert.equal(p.stats.wins, 1);
  assert.equal(p.difficultyOpen(2), true);
  const lost = make();
  lost.health = 0;
  lost.update(0.02);
  assert.equal(lost.state, 'ended');
  assert.equal(lost.won, false);
});
test('all perk definitions can be applied within their own slot budgets', () => {
  for (const perk of PERKS) {
    const g = make();
    if (perk.id === 'robot') for (let i = 0; i < 4; i++) g.apply('clean');
    if (perk.id === 'belt') for (let i = 0; i < 4; i++) g.apply('capacity');
    assert.ok(g.apply(perk.id), perk.id);
  }
});
test('crowd simulation remains bounded and finite', () => {
  const g = make();
  g.wave = 4;
  g.health = g.maxHealth = 100000;
  for (let i = 0; i < 120; i++) g.spawnEnemy(i % 6);
  assert.equal(g.enemies.length, 96);
  g.updateWeapons = () => {};
  advance(g, 2);
  assert.equal(g.enemies.length, 96);
  assert.ok(g.enemies.every((e) => Number.isFinite(e.x) && Number.isFinite(e.z)));
});
