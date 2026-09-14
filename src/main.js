import './style.css';
import { Profile } from './profile.js';
import { Game } from './game.js';
import { View, Portrait } from './view.js';
import { UI } from './ui.js';
import { Sound } from './audio.js';
const params = new URLSearchParams(location.search),
  testing = import.meta.env.DEV && params.has('test');
let storage = null;
try {
  if (!testing) storage = localStorage;
} catch {}
const profile = new Profile(storage);
let game = new Game(profile),
  view,
  portrait,
  ui,
  quality = 0;
const sound = new Sound(),
  keys = new Set();
let frameTimes = [],
  fps = 60,
  last = performance.now(),
  accumulator = 0,
  saveTimer = 0;
const canvas = document.querySelector('#world');
try {
  view = new View(canvas, game);
} catch (error) {
  document.querySelector('#menu').innerHTML =
    '<h1>Üç boyutlu sahne açılamadı.</h1><p>WebGL 2 destekleyen bir tarayıcıda donanım hızlandırmayı açıp yeniden dene.</p>';
  throw error;
}
function replace(next) {
  keys.clear();
  accumulator = 0;
  for (const [, a] of view.actors) view.scene.remove(a.n);
  view.actors.clear();
  for (const [, n] of view.props) view.scene.remove(n);
  view.props.clear();
  for (const e of view.effects) view.scene.remove(e.n);
  view.effects = [];
  game = next;
  view.game = game;
  game.inView = (p) => {
    const v = view.project(p.x, 0.5, p.z);
    return v.x > -50 && v.x < innerWidth + 50 && v.y > -50 && v.y < innerHeight + 50;
  };
  view.refreshPlayer();
  view.focus.set(game.player.x, 0, game.player.z);
}
function showcase() {
  const p = new Profile();
  p.character = profile.character;
  p.costume = profile.costume;
  p.fur = profile.fur;
  p.cloth = profile.cloth;
  p.eye = profile.eye;
  const g = new Game(p, 44);
  g.demo = true;
  g.start();
  g.health = g.maxHealth = 500;
  g.stats.patience = 20;
  g.rep = 100;
  g.wave = 3;
  g.waveTime = 75;
  g.spawnTimer = 24;
  g.guestTimer = 8;
  g.apply('knife');
  g.apply('pan');
  g.apply('decor');
  g.player.x = -6;
  g.player.z = 3;
  g.player.angle = Math.PI;
  for (let i = 0; i < 4; i++) {
    const c = g.spawnGuest(),
      t = g.tables[c.table];
    c.x = t.x + Math.sign(t.x) * 1.6;
    c.z = t.z;
    c.path = [];
    c.state = 'seated';
    c.angle = t.x < 0 ? -Math.PI / 2 : Math.PI / 2;
    t.state = i === 0 ? 'eating' : i === 1 ? 'ready' : i === 2 ? 'order' : 'cooking';
    if (i === 0) {
      t.progress = t.duration = 18;
      t.eatAge = 0;
      t.servedAt = -1;
      t.flightFrom = { x: t.x, z: t.z };
    }
    if (i === 3) t.progress = 4.5;
  }
  for (let i = 0; i < 6; i++) {
    const e = g.spawnEnemy(i);
    e.x = -16 + i * 3;
    e.z = 14 + (i % 2) * 3;
  }
  g.events = [];
  return g;
}
ui = new UI(profile, {
  portrait: (c, p) => {
    if (portrait) {
      portrait.renderer.dispose();
      portrait.renderer.forceContextLoss();
    }
    portrait = new Portrait(c);
    portrait.set(p);
  },
  custom: () => view.refreshPlayer(),
  start: (demo) => {
    replace(demo ? showcase() : new Game(profile));
    if (!demo) game.start();
  },
  pause: () => {
    game.pause();
    keys.clear();
  },
  choose: (i) => {
    game.choose(i);
    keys.clear();
  },
  menu: () => {
    game.profile.save();
    replace(new Game(profile));
  },
  sound: () => sound.toggle(),
  soundOn: () => sound.enabled,
  quality: () => {
    quality = 1 - quality;
    view.renderer.setPixelRatio(Math.min(devicePixelRatio, quality ? 2 : 1.5));
    view.sun.shadow.mapSize.set(quality ? 3072 : 2048, quality ? 3072 : 2048);
    view.sun.shadow.map?.dispose();
    view.sun.shadow.map = null;
    view.resize();
  },
  qualityName: () => (quality ? 'Yüksek' : 'Dengeli'),
});
const movementKeys = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
]);
addEventListener('keydown', (e) => {
  if (movementKeys.has(e.code) && game.state !== 'menu') {
    e.preventDefault();
    if (game.state === 'playing') keys.add(e.code);
    if (e.code === 'Space' && !e.repeat && game.state === 'playing') game.input.dash = true;
  }
  if (e.code === 'Escape' && !e.repeat) {
    e.preventDefault();
    game.pause();
    keys.clear();
  }
});
addEventListener('keyup', (e) => keys.delete(e.code));
function blur() {
  keys.clear();
  if (game.state === 'playing') game.pause();
}
addEventListener('blur', blur);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) blur();
});
addEventListener('resize', () => view.resize());
addEventListener('beforeunload', () => game.profile.save());
function frame(now) {
  const elapsed = Math.min((now - last) / 1000, 0.1);
  last = now;
  frameTimes.push(elapsed * 1000);
  if (frameTimes.length > 300) frameTimes.shift();
  fps = fps * 0.96 + (1 / Math.max(0.001, elapsed)) * 0.04;
  if (game.state === 'playing') {
    game.input.x =
      (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
      (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    game.input.z =
      (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) -
      (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
    accumulator += elapsed;
    let steps = 0;
    while (accumulator >= 1 / 60 && steps++ < 6) {
      game.update(1 / 60);
      accumulator -= 1 / 60;
      if (game.state !== 'playing') {
        accumulator = 0;
        keys.clear();
        break;
      }
    }
  } else accumulator = 0;
  for (const e of game.events) sound.play(e);
  view.render(elapsed);
  if (game.state === 'menu') portrait.render(now / 1000);
  else ui.update(game, view, fps);
  saveTimer += elapsed;
  if (saveTimer > 3) {
    saveTimer = 0;
    if (game.profile.dirty) game.profile.save();
    if (game.profile.saveError)
      ui.toast('Kayıt yapılamadı; bu oturumdaki ilerlemen bellekte tutuluyor.');
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if (testing) {
  window.__mikTest = {
    get game() {
      return game;
    },
    get view() {
      return view;
    },
    get profile() {
      return profile;
    },
    start: () => {
      replace(new Game(profile, 12));
      game.start();
      ui.menu.hidden = true;
      ui.markers.hidden = false;
    },
    showcase: () => {
      replace(showcase());
      ui.menu.hidden = true;
      ui.lastState = '';
    },
    snapshot: () => ({
      state: game.state,
      time: game.time,
      player: { ...game.player },
      health: game.health,
      served: game.served,
      kills: game.kills,
      guests: game.guests.map((g) => ({
        id: g.id,
        state: g.state,
        table: g.table,
        patience: g.patience,
      })),
      enemies: game.enemies.length,
      tables: game.tables.map((t) => ({ id: t.id, state: t.state, progress: t.progress })),
      carried: [...game.carried],
      xp: { ...game.xp },
      slots: game.slots,
      offers: game.offers.map((p) => p.id),
      drawCalls: view.renderer.info.render.calls,
      triangles: view.renderer.info.render.triangles,
      geometries: view.renderer.info.memory.geometries,
    }),
    performance: () => {
      const sorted = [...frameTimes].sort((a, b) => a - b);
      return {
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        max: Math.max(...sorted),
        frames: sorted.length,
        drawCalls: view.renderer.info.render.calls,
        triangles: view.renderer.info.render.triangles,
        geometries: view.renderer.info.memory.geometries,
      };
    },
  };
}
