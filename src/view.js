import * as T from 'three';
import {
  mouse,
  rig,
  enemy,
  food,
  weapon,
  plant,
  table,
  group,
  box,
  ball,
  cylinder,
  ring,
  rod,
  bake,
  material,
} from './art.js';
import { TABLES, COLORS as C } from './config.js';
const mix = T.MathUtils.lerp,
  vec = new T.Vector3();
export class View {
  constructor(canvas, game) {
    this.game = game;
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFShadowMap;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.scene = new T.Scene();
    this.scene.background = new T.Color('#d5d9bf');
    this.scene.fog = new T.Fog('#d5d9bf', 55, 95);
    this.scene.add(new T.HemisphereLight('#fff4d7', '#749185', 2.6));
    this.sun = new T.DirectionalLight('#fff1ce', 3.1);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, {
      left: -22,
      right: 22,
      top: 22,
      bottom: -22,
      near: 1,
      far: 85,
    });
    this.sun.shadow.bias = -0.0003;
    this.sun.shadow.normalBias = 0.025;
    this.sun.shadow.radius = 3;
    this.scene.add(this.sun, this.sun.target);
    this.camera = new T.OrthographicCamera(-15, 15, 11.75, -11.75, 0.1, 150);
    this.focus = new T.Vector3(0, 0, 3);
    this.actors = new Map();
    this.props = new Map();
    this.effects = [];
    this.frames = [];
    this.lastT = 0;
    this.world();
    this.player = mouse(game.profile);
    this.playerRig = rig(this.player);
    this.scene.add(this.player);
    this.halo = ring(this.scene, [0, 0.035, 0], 0.64, 0.035, C.gold);
    this.halo.castShadow = false;
    this.resize();
    game.inView = (p) => {
      const s = this.project(p.x, 0.5, p.z);
      return s.x > -50 && s.x < this.width + 50 && s.y > -50 && s.y < this.height + 50;
    };
  }
  resize() {
    this.width = innerWidth;
    this.height = innerHeight;
    this.renderer.setSize(this.width, this.height);
    const w = (11.75 * this.width) / this.height;
    Object.assign(this.camera, { left: -w, right: w, top: 11.75, bottom: -11.75 });
    this.camera.updateProjectionMatrix();
  }
  world() {
    const w = group(this.scene);
    box(w, [0, -0.28, 2], [65, 0.5, 53], '#a9b393');
    const geom = new T.BoxGeometry(1.97, 0.035, 1.97),
      matrix = new T.Matrix4();
    for (let shade = 0; shade < 4; shade++) {
      const tiles = [];
      for (let x = -31; x < 32; x += 2)
        for (let z = -23; z < 28; z += 2)
          if ((((x + 31) / 2) * 7 + ((z + 23) / 2) * 3) % 4 === shade) tiles.push([x, 0.008, z]);
      const im = new T.InstancedMesh(
        geom,
        material(['#d5ccb0', '#dcd3ba', '#d2c8ad', '#d9cfb5'][shade]),
        tiles.length,
      );
      tiles.forEach((p, i) => {
        matrix.makeTranslation(...p);
        im.setMatrixAt(i, matrix);
      });
      im.receiveShadow = true;
      w.add(im);
    }
    for (const x of [-18, 0, 18]) box(w, [x, 0.045, 10], [3, 0.025, 31], '#b7bd9e');
    for (const z of [0, 13, 20]) box(w, [0, 0.042, z], [46, 0.028, 2.6], '#b7bd9e');
    box(w, [0, 0.06, -6.4], [24, 0.08, 4.8], '#72918b');
    const kitchen = group(w);
    box(kitchen, [0, 1.25, -8.8], [24, 2.5, 0.42], C.teal);
    box(kitchen, [0, 2.58, -8.8], [24.5, 0.16, 0.62], C.cream);
    for (let x = -11; x < 12; x += 2) {
      box(kitchen, [x, 1.3, -8.54], [1.84, 1.72, 0.06], '#467f71');
      box(kitchen, [x, 1.26, -8.49], [1.59, 0.03, 0.03], C.mint);
    }
    box(kitchen, [0, 0.7, -5.8], [7.6, 1.4, 1.4], C.teal);
    box(kitchen, [0, 1.44, -5.8], [7.9, 0.16, 1.62], C.cream);
    for (const x of [-3, -1, 1, 3]) {
      box(kitchen, [x, 0.74, -5.07], [1.8, 1.05, 0.045], '#5e9481');
      rod(kitchen, [x - 0.25, 1, -5.02], [x + 0.25, 1, -5.02], 0.025, C.gold);
    }
    box(kitchen, [-8.6, 0.85, -6.8], [2.5, 1.7, 1.5], '#cfbfa0');
    box(kitchen, [-8.6, 0.69, -6.01], [1.8, 1.05, 0.05], C.ink);
    box(kitchen, [-8.6, 0.65, -5.96], [1.42, 0.67, 0.04], '#d38b4e');
    for (let i = 0; i < 3; i++)
      ball(kitchen, [-9 + i * 0.4, 0.51, -5.92], [0.3, 0.5, 0.025], C.gold);
    for (const x of [-9.35, -8.9, -8.45, -8]) cylinder(kitchen, [x, 1.6, -6.8], 0.13, 0.12, C.ink);
    cylinder(kitchen, [-8.6, 1.88, -6.8], 0.52, 0.4, C.teal);
    ring(kitchen, [-8.6, 2.1, -6.8], 0.5, 0.035, C.gold);
    box(kitchen, [8.5, 0.77, -6.8], [3, 1.54, 1.5], '#9f7855');
    box(kitchen, [8.5, 1.57, -6.8], [3.2, 0.12, 1.7], C.cream);
    box(kitchen, [8, 1.65, -6.7], [1.4, 0.07, 0.8], '#bca16d');
    for (let j = 0; j < 3; j++) {
      ball(kitchen, [8 + j * 0.17, 1.78, -6.8], [0.21, 0.21, 0.21], C.coral);
      ball(kitchen, [9.25, 1.74, -6.9 + j * 0.2], [0.25, 0.1, 0.28], C.mint);
    }
    for (const x of [-11.5, 11.5]) {
      rod(kitchen, [x, 0, -5.5], [x, 4, -5.5], 0.075, C.cream);
      rod(kitchen, [x, 4, -5.5], [x, 3.7, -8.8], 0.07, C.cream);
    }
    for (let i = 0; i < 24; i++) {
      const awning = box(
        kitchen,
        [-11.5 + i, 3.6, -7.4],
        [1, 0.09, 3.45],
        i % 2 ? C.cream : C.coral,
      );
      awning.rotation.x = 0.1;
      box(kitchen, [-11.5 + i, 3.41, -5.71], [1, 0.32, 0.08], i % 2 ? C.cream : C.coral);
    }
    bake(kitchen);
    this.partitions = group(w);
    for (const x of [-4, 4])
      for (const z of [2.4, 5.6]) {
        box(this.partitions, [x, 0.46, z], [0.45, 0.92, 1.8], C.teal);
        box(this.partitions, [x, 0.96, z], [0.57, 0.1, 1.94], C.cream);
      }
    bake(this.partitions);
    this.express = group(w);
    for (let z = -3; z < 24; z += 2)
      for (const x of [-0.22, 0.22]) {
        const b = box(this.express, [x, 0.095, z], [0.06, 0.015, 0.52], C.gold);
        b.rotation.y = x < 0 ? -0.75 : 0.75;
      }
    bake(this.express, false);
    this.express.visible = false;
    this.portals = group(w);
    for (const x of [-23, 23]) {
      ring(this.portals, [x, 0.13, 10], 0.85, 0.12, C.purple);
      cylinder(this.portals, [x, 0.065, 10], 0.75, 0.03, C.ink);
      for (let i = 0; i < 6; i++)
        ball(
          this.portals,
          [x + Math.cos(i) * 0.88, 0.22, 10 + Math.sin(i) * 0.88],
          [0.15, 0.15, 0.15],
          C.gold,
        );
    }
    bake(this.portals, false);
    this.portals.visible = false;
    this.decor = group(w);
    for (const [x, z] of TABLES) {
      const p = plant();
      p.position.set(x + 2.5, 0, z - 1.5);
      this.decor.add(p);
    }
    this.decor.visible = false;
    for (let i = 0; i < TABLES.length; i++) {
      const t = table(i);
      t.position.set(TABLES[i][0], 0, TABLES[i][1]);
      w.add(t);
    }
    for (const x of [-29, 29]) for (const z of [-19, -10, 2, 14, 24]) this.tree(w, x, z);
    for (const z of [-21, 26]) for (const x of [-20, -10, 0, 10, 20]) this.tree(w, x, z);
    for (const x of [-26, 26])
      for (const z of [-15, 7, 21]) {
        const p = plant();
        p.position.set(x, 0, z);
        p.scale.setScalar(1.5);
        w.add(p);
      }
    for (const x of [-31.5, 31.5]) box(w, [x, 0.2, 2], [0.3, 0.4, 51], C.teal);
    for (const z of [-23.5, 27.5]) box(w, [0, 0.2, z], [63, 0.4, 0.3], C.teal);
  }
  tree(parent, x, z) {
    const g = group(parent);
    g.position.set(x, 0, z);
    cylinder(g, [0, 0.06, 0], 1.25, 0.12, '#9fab89');
    cylinder(g, [0, 1.1, 0], 0.18, 2.2, '#9c7857');
    for (let i = 0; i < 5; i++)
      ball(
        g,
        [Math.cos(i * 2.4) * 0.66, 2.2 + i * 0.22, Math.sin(i * 2.4) * 0.66],
        [1.9, 1.7, 1.8],
        i % 2 ? '#7ca28b' : '#99b392',
      );
    bake(g);
  }
  project(x, y, z) {
    vec.set(x, y, z).project(this.camera);
    return { x: ((vec.x + 1) * this.width) / 2, y: ((1 - vec.y) * this.height) / 2 };
  }
  pose(n, r, time, moving, kind = '', age = 0, patience = 1) {
    const walk = moving ? Math.sin(time * 12) : Math.sin(time * 2) * 0.07;
    n.position.y = moving ? Math.abs(walk) * 0.065 : 0;
    r.head.rotation.set(Math.sin(time * 2) * 0.025, 0, 0);
    r.armL.rotation.set(walk * 0.35, 0, 0.08);
    r.armR.rotation.set(-walk * 0.35, 0, -0.08);
    r.footL.position.y = 0.12 + Math.max(0, walk) * 0.1;
    r.footR.position.y = 0.12 + Math.max(0, -walk) * 0.1;
    for (const k of ['mouth', 'spoon', 'pad', 'sponge', 'heldKnife', 'heldSoda'])
      if (r[k]) r[k].visible = false;
    if (kind === 'eating') {
      const cycle = (age % 0.95) / 0.95,
        lift = Math.sin(Math.PI * Math.min(1, cycle / 0.8));
      r.armR.rotation.set(0.7 + 1.4 * Math.max(0, lift), 0, -0.45);
      r.armL.rotation.x = 0.65;
      r.spoon.visible = true;
      r.morsel.visible = cycle < 0.58;
      r.head.rotation.x = 0.07 + Math.sin(age * 15) * 0.03;
      r.mouth.visible = true;
      r.mouth.scale.y = 0.018 + (Math.sin(age * 24) * 0.5 + 0.5) * 0.048;
    } else if (kind === 'waiting') {
      r.head.rotation.y = Math.sin(age * 0.8) * 0.19;
      const fidget = Math.max(0, Math.sin(age * 1.7));
      r.footR.position.y += fidget * (1 - patience) * 0.16;
      if (age % 9 > 6.8) {
        r.armR.rotation.x = 1.9;
        r.mouth.visible = true;
        r.mouth.scale.y = 0.1;
        r.head.rotation.x = -0.1;
      } else r.armL.rotation.x = 0.45 + Math.sin(age * 2) * 0.08;
    } else if (kind === 'pay') {
      r.armR.rotation.x = 1.3;
      r.head.rotation.x = 0.13;
    } else if (kind === 'order') {
      r.armL.rotation.x = 1.4;
      r.armR.rotation.x = 1.15 + Math.sin(time * 20) * 0.12;
      r.pad.visible = true;
      r.head.rotation.x = 0.16;
    } else if (kind === 'clean') {
      r.armR.rotation.x = 1.1 + Math.sin(time * 17) * 0.4;
      r.sponge.visible = true;
      r.head.rotation.x = 0.15;
    } else if (kind === 'serve' || kind === 'pickup') {
      r.armL.rotation.x = 1.25;
      r.armR.rotation.x = 1.4;
      r.head.rotation.x = 0.12;
    }
  }
  actor(entity, type) {
    const key = type + entity.id;
    if (!this.actors.has(key)) {
      const n =
        type === 'e'
          ? enemy(entity.kind, entity.boss)
          : mouse({
              guest: true,
              character: 'mik',
              fur: entity.id % 4,
              cloth:
                entity.kind === 'vip'
                  ? '#d9ae52'
                  : entity.kind === 'student'
                    ? 2
                    : entity.kind === 'regular'
                      ? 1
                      : entity.id % 4,
              eye: entity.kind === 'vip' ? 'sharp' : entity.kind === 'regular' ? 'sleepy' : 'round',
            });
      const size = type === 'e' ? (entity.boss ? 1.7 : 1) : 0.84;
      n.scale.setScalar(size);
      this.scene.add(n);
      this.actors.set(key, { n, r: type === 'g' ? rig(n) : null, size, entity });
    }
    return this.actors.get(key);
  }
  prop(key, builder) {
    if (!this.props.has(key)) {
      const n = builder();
      this.props.set(key, n);
      this.scene.add(n);
    }
    return this.props.get(key);
  }
  effect(type, event) {
    if (this.effects.length >= 64) return;
    const n = group(this.scene);
    let duration = 0.55;
    if (type === 'coins') {
      duration = 1.65;
      for (let i = 0; i < 4; i++) {
        const c = cylinder(n, [i * 0.1, 0, 0], 0.11, 0.04, C.gold, 0.5);
        c.rotation.x = Math.PI / 2;
      }
    } else if (type === 'power' || type === 'bell' || type === 'dash') {
      duration = type === 'power' ? 1.5 : 0.5;
      ring(n, [0, 0.04, 0], type === 'bell' ? 1 : 0.5, 0.025, type === 'dash' ? C.cream : C.gold);
      if (type === 'power')
        for (let i = 0; i < 6; i++)
          ball(n, [Math.cos(i) * 0.9, 0.4, Math.sin(i) * 0.9], [0.09, 0.09, 0.09], C.gold);
    } else {
      for (let i = 0; i < 4; i++)
        ball(n, [0, 0.6, 0], [0.08, 0.08, 0.08], type === 'clean' ? C.cream : C.gold);
    }
    this.effects.push({ n, type, event, start: this.game.time, duration });
  }
  render(dt) {
    const g = this.game,
      t = g.time,
      p = g.player;
    const active = g.state === 'playing';
    this.focus.lerp(new T.Vector3(p.x, 0, p.z), 1 - Math.exp(-dt * 6));
    this.camera.position.copy(this.focus).add(new T.Vector3(0, 25, 27.8));
    this.camera.lookAt(this.focus);
    this.camera.updateMatrixWorld();
    this.sun.position.set(this.focus.x - 14, 30, this.focus.z + 10);
    this.sun.target.position.copy(this.focus);
    this.partitions.visible = !g.perks.boulevard;
    this.express.visible = !!g.perks.express;
    this.portals.visible = !!g.perks.portal;
    this.decor.visible = !!g.perks.decor;
    this.player.position.set(p.x, 0, p.z);
    this.player.rotation.y = p.angle;
    this.pose(this.player, this.playerRig, t, p.moving, p.action);
    if (p.strike > 0) {
      this.playerRig.armR.rotation.x = 1.25 + Math.sin((p.strike / 0.24) * Math.PI) * 0.8;
      this.playerRig[p.strikeKind === 'knife' ? 'heldKnife' : 'heldSoda'].visible = true;
    }
    if (p.power > 0) {
      this.player.position.y += Math.abs(Math.sin((1.5 - p.power) * 7)) * 0.18;
      this.playerRig.armL.rotation.z = -0.5;
      this.playerRig.armR.rotation.z = 0.5;
    }
    this.player.visible = !(p.hurt > 0 && Math.floor(t * 14) % 2);
    this.player.scale.set(1, p.dash > 0 ? 0.83 : 1, 1);
    this.halo.position.set(p.x, 0.08, p.z);
    const alive = new Set();
    for (const guest of g.guests) {
      const k = 'g' + guest.id;
      alive.add(k);
      const { n, r } = this.actor(guest, 'g');
      n.position.set(guest.x, 0, guest.z);
      n.rotation.y = guest.angle;
      const state =
        guest.pay > 0
          ? 'pay'
          : guest.state === 'seated'
            ? g.tables[guest.table].state === 'eating'
              ? 'eating'
              : 'waiting'
            : '';
      this.pose(
        n,
        r,
        t,
        guest.state === 'walking' || (guest.state === 'leaving' && !guest.pay),
        state,
        guest.state === 'seated' && state === 'eating' ? g.tables[guest.table].eatAge : guest.age,
        guest.patience / guest.maxPatience,
      );
      if (guest.state === 'seated') n.position.y += 0.38;
    }
    for (const e of g.enemies) {
      const k = 'e' + e.id;
      alive.add(k);
      const { n, size } = this.actor(e, 'e');
      n.position.set(e.x, e.hit > 0 ? Math.sin((e.hit / 0.18) * Math.PI) * 0.12 : 0, e.z);
      n.rotation.set(0, e.angle, e.hit > 0 ? Math.sin(e.hit * 35) * 0.12 : 0);
      n.scale.set(size * (e.hit ? 1.07 : 1), size * (e.hit ? 0.9 : 1), size);
      for (let i = 0; i < 4; i++) {
        const leg = n.getObjectByName('leg' + i);
        if (leg) leg.rotation.x = e.attack ? 0 : Math.sin(t * 10 + (i % 2) * Math.PI) * 0.42;
      }
      const club = n.getObjectByName('club');
      if (club)
        club.rotation.x = e.attack
          ? -e.attack * 1.7
          : e.swing > 0
            ? Math.sin((e.swing / 0.24) * Math.PI) * 1.3
            : 0;
    }
    for (const ev of g.events.splice(0)) {
      if (ev.type === 'death') {
        const key = 'e' + ev.enemy.id,
          actor = this.actors.get(key);
        if (actor) {
          this.actors.delete(key);
          this.effects.push({
            n: actor.n,
            type: 'death',
            event: ev,
            start: t,
            duration: 0.72,
            size: actor.size,
          });
        }
      } else if (['coins', 'power', 'bell', 'dash', 'hit', 'clean'].includes(ev.type))
        this.effect(ev.type, { x: p.x, z: p.z, ...ev });
    }
    for (const [key, a] of this.actors)
      if (!alive.has(key)) {
        this.scene.remove(a.n);
        this.actors.delete(key);
      }
    const propsAlive = new Set();
    const use = (key, builder) => {
      propsAlive.add(key);
      return this.prop(key, builder);
    };
    for (const table of g.tables) {
      const served = table.state === 'eating' || table.state === 'dirty',
        carried = g.carried.indexOf(table.id),
        ready = table.state === 'ready' && carried < 0;
      if (!served && !ready && carried < 0) continue;
      const f = use('food' + table.id + ':' + table.dish, () => food(table.dish));
      f.rotation.set(0, 0, 0);
      f.scale.setScalar(1);
      if (served) {
        f.position.set(table.x, 1.34, table.z + 0.18);
        if (table.state === 'eating' && t - table.servedAt < 0.48) {
          const u = (t - table.servedAt) / 0.48;
          f.position.set(
            mix(table.flightFrom.x, table.x, u),
            1.34 + Math.sin(u * Math.PI) * 1.1,
            mix(table.flightFrom.z, table.z + 0.18, u),
          );
          f.rotation.y = (1 - u) * 0.5;
          f.scale.setScalar(0.85 + 0.15 * u);
        }
      } else if (carried >= 0) {
        const a = p.angle,
          ox = 0.65 + (carried % 2) * 0.55,
          oz = carried >= 2 ? 0.55 : 0;
        f.position.set(
          p.x + Math.cos(a) * ox + Math.sin(a) * oz,
          1.15 + Math.floor(carried / 2) * 0.22,
          p.z - Math.sin(a) * ox + Math.cos(a) * oz,
        );
        f.scale.setScalar(0.53);
        this.playerRig.armL.rotation.x = 0.9;
      } else {
        const index = g.tables
          .filter((v) => v.state === 'ready' && !g.carried.includes(v.id))
          .indexOf(table);
        f.position.set(-3 + (index % 5) * 1.45, 1.54 + Math.floor(index / 5) * 0.28, -5.8);
        f.scale.setScalar(0.85);
      }
      const fraction =
        table.state === 'dirty'
          ? 1
          : table.state === 'eating'
            ? Math.max(0, (table.eatAge - 0.4) / (table.duration - 0.4))
            : 0;
      const count = [3, 6, 6, 4][table.dish];
      for (let i = 0; i < count; i++)
        f.getObjectByName('portion' + i).visible = i >= Math.floor(fraction * count);
      f.getObjectByName('crumbs').visible = table.state === 'dirty';
      const liq = f.getObjectByName('liquid');
      if (liq) liq.visible = fraction < 1;
      if (table.state === 'eating' || ready) {
        const steam = use('steam' + table.id, () => {
          const n = group();
          for (let i = 0; i < 3; i++) ball(n, [0, 0, 0], [0.07, 0.14, 0.07], C.cream);
          return n;
        });
        steam.position.copy(f.position);
        steam.children.forEach((p, i) => {
          const u = (t * 0.6 + i / 3) % 1;
          p.position.set(Math.sin(t + i) * 0.14, 0.35 + u * 0.6, Math.cos(t + i) * 0.1);
          const size = Math.sin(u * Math.PI) * 0.85;
          p.scale.set(0.07 * size, 0.14 * size, 0.07 * size);
        });
      }
    }
    for (const s of g.shots) {
      const n = use('shot' + s.id, () => weapon(s.kind));
      n.position.set(s.x, 0.85, s.z);
      n.rotation.y = s.kind === 'knife' ? Math.atan2(-s.vx, -s.vz) : t * 12;
    }
    for (let i = 0; i < (g.perks.pan || 0); i++) {
      const n = use('pan' + i, () => weapon('pan')),
        a = t * 2.7 + (i * Math.PI * 2) / g.perks.pan;
      n.position.set(p.x + Math.cos(a) * 3, 0.85, p.z + Math.sin(a) * 3);
      n.rotation.y = -a;
    }
    for (const c of g.clouds) {
      const n = use('cloud' + c.id, () => weapon('pepper'));
      n.position.set(c.x, 0.07, c.z);
      n.scale.setScalar(c.radius * Math.min(1, c.life));
      n.rotation.y = t * 0.2;
    }
    for (const e of g.enemies)
      if (e.attack > 0) {
        const n = use('warn' + e.id, () => ring(group(), [0, 0.08, 0], 0.7, 0.035, C.coral).parent);
        n.position.set(e.x, 0, e.z);
        n.scale.setScalar(1 + (0.6 - e.attack) * 0.7);
      }
    for (const [key, n] of this.props)
      if (!propsAlive.has(key)) {
        this.scene.remove(n);
        this.props.delete(key);
      }
    for (const fx of [...this.effects]) {
      const u = (t - fx.start) / fx.duration,
        n = fx.n,
        e = fx.event;
      if (u >= 1) {
        this.scene.remove(n);
        this.effects.splice(this.effects.indexOf(fx), 1);
        continue;
      }
      if (fx.type === 'death') {
        n.rotation.z = ((e.enemy.id % 2 ? 1 : -1) * Math.min(1, u * 2) * Math.PI) / 2;
        n.position.y = Math.sin(u * Math.PI) * 0.25;
        n.scale.setScalar(fx.size * (1 - Math.max(0, (u - 0.55) / 0.45)));
      } else if (fx.type === 'coins') {
        const flight = Math.max(0, (u - 0.48) / 0.52);
        const drop = Math.min(1, u / 0.23),
          sx = e.from ? mix(e.from.x, e.x, drop) : e.x,
          sz = e.from ? mix(e.from.z, e.z, drop) : e.z;
        n.position.set(
          mix(sx, p.x, flight),
          1.4 + Math.sin(drop * Math.PI) * 0.5 + Math.sin(flight * Math.PI) * 1.4,
          mix(sz, p.z, flight),
        );
        n.rotation.y = t * 5;
        n.scale.setScalar(1 - flight * 0.7);
      } else if (fx.type === 'power' || fx.type === 'bell' || fx.type === 'dash') {
        n.position.set(e.x, 0, e.z);
        n.scale.setScalar(0.7 + u * (fx.type === 'bell' ? 4 : 1.8));
        if (fx.type === 'power') n.position.y = u * 0.8;
      } else {
        n.position.set(e.x, 0.3, e.z);
        n.children.forEach((c, i) => {
          c.position.set(
            Math.cos(i * 1.57) * u * 0.65,
            Math.sin(u * Math.PI) * 0.4,
            Math.sin(i * 1.57) * u * 0.65,
          );
          c.scale.setScalar(0.08 * (1 - u));
        });
      }
    }
    this.renderer.render(this.scene, this.camera);
    this.lastT = t;
  }
  refreshPlayer() {
    this.scene.remove(this.player);
    this.player = mouse(this.game.profile);
    this.playerRig = rig(this.player);
    this.scene.add(this.player);
  }
  dispose() {
    this.renderer.dispose();
  }
}
export class Portrait {
  constructor(canvas) {
    this.renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.setSize(320, 330, false);
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.scene = new T.Scene();
    this.scene.add(new T.HemisphereLight('#fff3d5', '#84a296', 3));
    const sun = new T.DirectionalLight('#fff1d5', 3);
    sun.position.set(-3, 5, 4);
    this.scene.add(sun);
    const rim = new T.DirectionalLight('#b7e3da', 2);
    rim.position.set(3, 3, -4);
    this.scene.add(rim);
    this.camera = new T.PerspectiveCamera(32, 320 / 330, 0.1, 20);
    this.camera.position.set(2, 1.9, -4.5);
    this.camera.lookAt(0, 1.1, 0);
    cylinder(this.scene, [0, -0.04, 0], 0.95, 0.12, C.teal);
  }
  set(profile) {
    if (this.model) this.scene.remove(this.model);
    this.model = mouse(profile);
    this.scene.add(this.model);
    this.r = rig(this.model);
  }
  render(t) {
    this.model.rotation.y = Math.sin(t * 0.3) * 0.18;
    this.r.head.rotation.y = Math.sin(t * 0.8) * 0.07;
    this.model.position.y = Math.sin(t * 1.8) * 0.025;
    this.renderer.render(this.scene, this.camera);
  }
}
