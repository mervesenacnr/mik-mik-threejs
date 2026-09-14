import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { COLORS as C, FURS, CLOTHS } from './config.js';
const materials = new Map(),
  templates = new Map();
const sphere = new T.SphereGeometry(0.5, 24, 16),
  cube = new RoundedBoxGeometry(1, 1, 1, 2, 0.08);
export function material(color, metal = 0) {
  const key = color + ':' + metal;
  if (!materials.has(key))
    materials.set(
      key,
      new T.MeshStandardMaterial({ color, roughness: metal ? 0.32 : 0.76, metalness: metal }),
    );
  return materials.get(key);
}
export function group(parent, name = '') {
  const g = new T.Group();
  g.name = name;
  parent?.add(g);
  return g;
}
export function mesh(parent, geometry, pos, color, scale = [1, 1, 1], metal = 0) {
  const m = new T.Mesh(geometry, material(color, metal));
  m.position.set(...pos);
  m.scale.set(...scale);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
export const ball = (p, pos, size, color) => mesh(p, sphere, pos, color, size);
export const box = (p, pos, size, color) => mesh(p, cube, pos, color, size);
const cylinders = new Map(),
  rings = new Map();
export function cylinder(p, pos, r, h, color, metal = 0) {
  if (!cylinders.has(r + ':' + h)) cylinders.set(r + ':' + h, new T.CylinderGeometry(r, r, h, 24));
  return mesh(p, cylinders.get(r + ':' + h), pos, color, [1, 1, 1], metal);
}
export function ring(p, pos, r, tube, color) {
  const k = r + ':' + tube;
  if (!rings.has(k)) rings.set(k, new T.TorusGeometry(r, tube, 6, 40));
  const n = mesh(p, rings.get(k), pos, color);
  n.rotation.x = Math.PI / 2;
  return n;
}
export function rod(p, a, b, r, color) {
  const av = new T.Vector3(...a),
    bv = new T.Vector3(...b),
    d = bv.clone().sub(av);
  const n = cylinder(p, av.clone().add(bv).multiplyScalar(0.5).toArray(), r, d.length(), color);
  n.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
  return n;
}
function named(n, name) {
  n.name = name;
  n.userData.moving = true;
  return n;
}
export function bake(root, cast = true) {
  const geometries = [];
  for (const child of [...root.children]) {
    if (!child.isMesh || child.userData.moving) continue;
    child.updateMatrix();
    let g = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
    g.applyMatrix4(child.matrix);
    for (const k of Object.keys(g.attributes))
      if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    const colors = new Float32Array(g.attributes.position.count * 3),
      col = child.material.color;
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = col.r;
      colors[i + 1] = col.g;
      colors[i + 2] = col.b;
    }
    g.setAttribute('color', new T.BufferAttribute(colors, 3));
    geometries.push(g);
    root.remove(child);
  }
  if (!geometries.length) return;
  const geo = mergeGeometries(geometries);
  for (const g of geometries) g.dispose();
  const n = new T.Mesh(geo, vertexMaterial);
  n.castShadow = cast;
  n.receiveShadow = true;
  root.add(n);
}
const vertexMaterial = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.76 });
function instance(key, builder) {
  if (!templates.has(key)) {
    const n = new T.Group();
    builder(n);
    templates.set(key, n);
  }
  return templates.get(key).clone(true);
}
export function mouse(options = {}) {
  const {
    character = 'mik',
    costume = 'chef',
    fur = 0,
    cloth = 0,
    eye = 'round',
    guest = false,
  } = options;
  const f = typeof fur === 'string' ? fur : FURS[fur][1],
    co = typeof cloth === 'string' ? cloth : CLOTHS[cloth][1];
  const key = `mouse:${character}:${costume}:${f}:${co}:${eye}:${guest}`;
  return instance(key, (n) => {
    const body = ball(
      n,
      [0, 0.67, 0],
      [character === 'tok' && !guest ? 1.1 : 0.75, 0.98, 0.68],
      co,
    );
    const head = group(n, 'head');
    head.position.y = 1.23;
    ball(head, [0, 0.12, -0.02], [0.79, 0.72, 0.7], f);
    for (const side of [-1, 1]) {
      ball(head, [side * 0.4, 0.47, 0], [0.49, 0.55, 0.21], f);
      ball(head, [side * 0.4, 0.47, -0.105], [0.34, 0.4, 0.045], '#d69f99');
      const at = [side * 0.2, 0.18, -0.355];
      if (eye === 'sleepy') {
        ball(head, at, [0.18, 0.045, 0.09], C.ink);
        ball(head, [side * 0.21, 0.192, -0.406], [0.035, 0.012, 0.012], C.cream);
      } else {
        const shape =
          eye === 'sharp'
            ? [0.21, 0.125, 0.09]
            : eye === 'oval'
              ? [0.135, 0.23, 0.085]
              : [0.18, 0.21, 0.09];
        const white = ball(head, at, shape, '#fff9e7');
        white.rotation.z = eye === 'sharp' ? side * 0.2 : 0;
        ball(head, [side * 0.2, 0.178, -0.407], [shape[0] * 0.6, shape[1] * 0.73, 0.04], '#527571');
        ball(head, [side * 0.2, 0.178, -0.429], [shape[0] * 0.32, shape[1] * 0.52, 0.02], C.ink);
        ball(head, [side * 0.2 - 0.025, 0.207, -0.443], [0.041, 0.044, 0.014], '#ffffff');
      }
      const brow = ball(head, [side * 0.2, 0.315, -0.342], [0.19, 0.028, 0.04], '#68544b');
      brow.rotation.z = side * (eye === 'sharp' ? 0.25 : -0.1);
      ball(
        head,
        [side * 0.14, -0.03, -0.395],
        [0.3, 0.21, 0.23],
        new T.Color(f).lerp(new T.Color(C.cream), 0.35).getStyle(),
      );
      ball(head, [side * 0.27, -0.005, -0.39], [0.075, 0.045, 0.025], '#d29286');
      for (let j = 0; j < 3; j++)
        rod(
          head,
          [side * 0.24, -0.01 + j * 0.025, -0.48],
          [side * (0.49 + j * 0.025), -0.045 + j * 0.066, -0.47],
          0.006,
          '#786454',
        );
      ball(head, [side * 0.043, -0.14, -0.46], [0.075, 0.09, 0.055], C.cream);
      const arm = group(n, side < 0 ? 'armL' : 'armR');
      arm.position.set(side * (character === 'tok' && !guest ? 0.51 : 0.4), 0.96, -0.1);
      ball(arm, [0, -0.2, 0], [0.19, 0.43, 0.22], f);
      const foot = named(
        ball(
          n,
          [side * 0.2, 0.12, -0.1],
          [0.28, 0.2, character === 'zip' && !guest ? 0.55 : 0.4],
          f,
        ),
        side < 0 ? 'footL' : 'footR',
      );
      foot.castShadow = false;
      bake(arm);
    }
    ball(head, [0, 0.035, -0.558], [0.145, 0.11, 0.12], '#d78889');
    ball(head, [-0.025, 0.063, -0.612], [0.047, 0.021, 0.014], '#ffd5c2');
    named(ball(head, [0, -0.115, -0.55], [0.15, 0.018, 0.032], C.ink), 'mouth').visible = false;
    const tailCurve = new T.CatmullRomCurve3([
      new T.Vector3(0, 0.25, 0.3),
      new T.Vector3(0.1, 0.17, 0.7),
      new T.Vector3(0.22, 0.12, 1.05),
      new T.Vector3(0.13, 0.17, 1.25),
    ]);
    mesh(n, new T.TubeGeometry(tailCurve, 16, 0.038, 6, false), [0, 0, 0], '#c78f91');
    if (!guest) {
      box(n, [0, 0.66, -0.33], [0.44, 0.58, 0.04], C.cream);
      for (const x of [-0.13, 0.13])
        for (const y of [0.52, 0.72, 0.91]) ball(n, [x, y, -0.365], [0.05, 0.05, 0.025], C.gold);
      box(
        n,
        [0, 0.43, -0.366],
        [0.3, 0.15, 0.028],
        new T.Color(co).lerp(new T.Color(C.cream), 0.25).getStyle(),
      );
      for (const x of [-0.11, 0.11]) {
        const collar = box(n, [x, 1, -0.31], [0.17, 0.11, 0.075], C.cream);
        collar.rotation.z = x * 3;
      }
      if (character === 'mik' && costume === 'chef') {
        cylinder(head, [0, 0.59, 0], 0.29, 0.2, C.cream);
        for (const x of [-0.19, 0, 0.19]) ball(head, [x, 0.77, 0], [0.38, 0.39, 0.42], C.cream);
        box(n, [0.42, 0.55, 0], [0.16, 0.3, 0.22], '#856045');
        rod(n, [0.42, 0.64, 0], [0.42, 1.01, 0], 0.025, C.cream);
      }
      if (character === 'zip') {
        if (costume !== 'royal') {
          ball(head, [0, 0.44, 0.02], [0.82, 0.25, 0.66], co);
          ball(head, [0, 0.44, -0.34], [0.77, 0.065, 0.35], co);
          for (const x of [-0.18, 0.18]) {
            ball(head, [x, 0.55, -0.26], [0.25, 0.18, 0.06], C.gold);
            ball(head, [x, 0.56, -0.296], [0.18, 0.12, 0.025], '#648f95');
          }
        }
        rod(n, [-0.32, 1.04, -0.33], [0.34, 0.42, -0.35], 0.045, '#76543c');
        ball(n, [0.44, 0.53, 0], [0.43, 0.45, 0.32], '#87634c');
        box(n, [0.47, 0.62, -0.16], [0.25, 0.14, 0.04], C.gold);
      }
      if (character === 'tok') {
        for (const x of [-0.53, 0.53]) {
          ball(n, [x, 0.97, 0], [0.46, 0.3, 0.51], co);
          for (const z of [-0.15, 0, 0.15]) ball(n, [x, 1.13, z], [0.06, 0.06, 0.06], C.gold);
        }
        ball(n, [0, 0.43, 0], [1.13, 0.14, 0.81], '#72563f');
        box(n, [0, 0.43, -0.43], [0.19, 0.15, 0.065], C.gold);
        if (costume !== 'royal') ball(head, [0, 0.44, 0.02], [0.79, 0.1, 0.62], co);
      }
      if (character === 'nane') {
        ball(n, [0, 0.44, 0], [0.98, 0.24, 0.79], co);
        ball(n, [0, 0.72, 0.4], [0.61, 0.64, 0.38], '#8c6946');
        for (let i = 0; i < 7; i++) {
          const x = -0.3 + i * 0.1,
            l = ball(
              head,
              [x, 0.55 + Math.sin(i) * 0.07, 0.02],
              [0.18, 0.46, 0.12],
              i % 2 ? '#9db887' : '#67977d',
            );
          l.rotation.z = x * 1.9;
          ball(n, [x, 1, 0.46], [0.09, 0.45, 0.075], '#68967c');
        }
        for (const x of [-0.39, 0.39]) ball(head, [x, 0.37, -0.16], [0.14, 0.14, 0.14], C.gold);
      }
      if (costume === 'scarf') {
        ball(n, [0, 1.04, 0], [0.77, 0.18, 0.64], co);
        const flap = box(n, [0.26, 0.82, -0.38], [0.2, 0.42, 0.05], co);
        flap.rotation.z = -0.15;
      }
      if (costume === 'armor') {
        ball(n, [0, 0.73, -0.12], [0.84, 0.7, 0.56], co);
        box(n, [0, 0.77, -0.43], [0.15, 0.28, 0.04], C.gold);
      }
      if (costume === 'royal') {
        ball(n, [0, 0.7, 0.3], [0.99, 0.97, 0.2], co);
        for (let i = 0; i < 7; i++)
          ball(n, [-0.42 + i * 0.14, 0.27, 0.34], [0.16, 0.1, 0.16], C.cream);
        cylinder(head, [0, 0.57, 0], 0.34, 0.15, C.gold, 0.5);
        for (const x of [-0.23, 0, 0.23]) {
          box(head, [x, 0.73, 0], [0.1, 0.24, 0.18], C.gold);
          ball(head, [x, 0.87, 0], [0.085, 0.085, 0.085], C.gold);
        }
        ball(head, [0, 0.61, -0.34], [0.12, 0.16, 0.06], C.coral);
      }
    }
    const right = n.getObjectByName('armR'),
      left = n.getObjectByName('armL');
    const spoon = group(right, 'spoon');
    box(spoon, [0, -0.46, -0.025], [0.04, 0.28, 0.035], C.cream);
    ball(spoon, [0, -0.64, -0.025], [0.15, 0.085, 0.08], C.cream);
    named(ball(spoon, [0, -0.64, -0.072], [0.12, 0.1, 0.07], C.gold), 'morsel');
    spoon.visible = false;
    if (!guest) {
      const pad = group(left, 'pad');
      box(pad, [0, -0.43, -0.06], [0.28, 0.36, 0.04], C.cream);
      for (let j = 0; j < 3; j++)
        box(pad, [0, -0.35 - j * 0.07, -0.086], [0.19, 0.009, 0.008], C.teal);
      pad.visible = false;
      const sponge = group(right, 'sponge');
      box(sponge, [0, -0.44, -0.1], [0.3, 0.13, 0.19], C.mint);
      sponge.visible = false;
      const knife = group(right, 'heldKnife');
      box(knife, [0, -0.48, 0], [0.08, 0.2, 0.08], '#936440');
      box(knife, [0, -0.72, 0], [0.11, 0.31, 0.025], C.cream);
      knife.visible = false;
      const soda = group(right, 'heldSoda');
      cylinder(soda, [0, -0.47, -0.06], 0.07, 0.24, C.mint);
      cylinder(soda, [0, -0.3, -0.06], 0.035, 0.1, C.cream);
      soda.visible = false;
    }
    bake(head);
    bake(n);
  });
}
export function rig(model) {
  return Object.fromEntries(
    [
      'head',
      'armL',
      'armR',
      'footL',
      'footR',
      'mouth',
      'spoon',
      'morsel',
      'pad',
      'sponge',
      'heldKnife',
      'heldSoda',
    ].map((k) => [k, model.getObjectByName(k)]),
  );
}
export function enemy(kind, boss = false) {
  return instance(`enemy:${kind}:${boss}`, (n) => {
    if (kind === 5) {
      box(n, [0, 1.2, 0], [0.8, 0.86, 0.46], '#a96a52');
      ball(n, [0, 1.93, 0], [0.63, 0.7, 0.61], '#d9b18d');
      ball(n, [0, 2.2, 0.04], [0.66, 0.19, 0.65], '#3e4746');
      for (const x of [-0.14, 0.14]) ball(n, [x, 1.98, -0.295], [0.07, 0.08, 0.05], C.ink);
      ball(n, [0, 1.88, -0.32], [0.16, 0.15, 0.13], '#c99576');
      box(n, [0, 1.8, -0.295], [0.24, 0.03, 0.03], C.ink);
      for (const x of [-0.18, 0.18]) box(n, [x, 1.4, -0.238], [0.18, 0.2, 0.025], '#c18a65');
      box(n, [0, 0.87, 0], [0.84, 0.1, 0.48], '#684e3e');
      box(n, [0, 0.87, -0.26], [0.14, 0.11, 0.04], C.gold);
      for (const x of [-0.23, 0.23]) {
        const leg = group(n, x < 0 ? 'leg0' : 'leg1');
        leg.position.set(x, 0.83, 0);
        box(leg, [0, -0.32, 0], [0.28, 0.66, 0.34], C.ink);
        box(leg, [0, -0.69, -0.12], [0.32, 0.14, 0.52], '#685043');
        bake(leg);
      }
      const arm = group(n, 'club');
      arm.position.set(0.51, 1.53, 0);
      box(arm, [0, -0.3, 0], [0.23, 0.66, 0.25], '#a96a52');
      ball(arm, [0, -0.61, 0], [0.25, 0.25, 0.25], '#d9b18d');
      rod(arm, [0, -0.67, 0.15], [0, -0.67, -1.1], 0.095, '#856042');
      for (const z of [-0.45, -0.8]) box(arm, [0, -0.67, z], [0.21, 0.21, 0.05], '#bd9b71');
      bake(arm);
      box(n, [-0.5, 1.16, 0], [0.24, 0.77, 0.26], '#a96a52');
      bake(n);
      return;
    }
    const co = ['#bd936b', '#a37b58', '#5b5b6e', '#96989c', '#bd794e'][kind],
      dog = kind === 1 || kind === 3;
    ball(n, [0, 0.64, 0.1], [0.9, 0.8, 1.2], co);
    ball(n, [0, 0.96, -0.47], [0.75, 0.73, 0.73], co);
    for (const x of [-0.28, 0.28]) {
      if (dog) {
        const ear = ball(
          n,
          [x * 1.4, 1.01, -0.4],
          [0.27, 0.59, 0.23],
          new T.Color(co).multiplyScalar(0.75).getStyle(),
        );
        ear.rotation.z = x;
      } else {
        mesh(n, new T.ConeGeometry(0.17, 0.45, 3), [x, 1.39, -0.42], co);
        ball(n, [x, 1.38, -0.54], [0.11, 0.24, 0.03], '#d99894');
      }
      ball(n, [x * 0.63, 1.01, -0.8], [0.13, 0.15, 0.075], C.cream);
      ball(n, [x * 0.63, 1.01, -0.844], [0.055, 0.095, 0.025], C.ink);
      ball(n, [x * 0.63 - 0.015, 1.04, -0.857], [0.025, 0.026, 0.01], '#ffffff');
    }
    ball(
      n,
      [0, 0.8, -0.8],
      [0.46, 0.29, dog ? 0.42 : 0.23],
      new T.Color(co).lerp(new T.Color(C.cream), 0.25).getStyle(),
    );
    ball(n, [0, 0.87, dog ? -1 : -0.92], [0.18, 0.14, 0.09], C.ink);
    if (dog) {
      ring(n, [0, 0.8, -0.3], 0.37, 0.045, C.coral).rotation.x = 0;
      ball(n, [0, 0.43, -0.34], [0.14, 0.18, 0.045], C.gold);
    } else
      for (const side of [-1, 1])
        for (let j = 0; j < 3; j++)
          rod(n, [side * 0.2, 0.84, -0.92], [side * 0.47, 0.79 + j * 0.05, -0.92], 0.006, C.cream);
    let i = 0;
    for (const x of [-0.29, 0.29])
      for (const z of [-0.29, 0.46]) {
        const leg = group(n, `leg${i++}`);
        leg.position.set(x, 0.4, z);
        ball(leg, [0, -0.15, 0], [0.25, 0.5, 0.28], co);
        bake(leg);
      }
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(0, 0.6, 0.64),
      new T.Vector3(0.15, 0.82, 1),
      new T.Vector3(0.3, 1, 1.25),
    ]);
    mesh(n, new T.TubeGeometry(curve, 8, 0.085, 6, false), [0, 0, 0], co);
    if (kind === 3 || boss) {
      box(n, [0, 0.96, 0.16], [1, 0.2, 0.95], C.teal);
      for (const x of [-0.35, 0, 0.35]) ball(n, [x, 1.1, 0.15], [0.15, 0.15, 0.15], C.gold);
    }
    if (boss) cylinder(n, [0, 1.5, -0.4], 0.3, 0.26, C.gold);
    bake(n);
  });
}
export function weapon(kind) {
  return instance('weapon:' + kind, (n) => {
    if (kind === 'pepper') {
      for (let i = 0; i < 7; i++)
        ball(n, [Math.cos(i) * 0.65, 0.15, Math.sin(i) * 0.65], [0.6, 0.2, 0.6], '#c99364');
    } else if (kind === 'pan') {
      cylinder(n, [0, 0, 0], 0.47, 0.1, C.ink);
      ring(n, [0, 0.06, 0], 0.43, 0.027, '#91a7a5');
      box(n, [0, 0, 0.73], [0.14, 0.1, 0.72], '#98704c');
      for (const z of [0.55, 0.73]) ball(n, [0, 0.08, z], [0.065, 0.065, 0.065], C.gold);
    } else if (kind === 'knife') {
      box(n, [0, 0, -0.23], [0.15, 0.04, 0.58], C.cream);
      box(n, [0, 0, 0.17], [0.12, 0.09, 0.26], '#946745');
    } else ball(n, [0, 0, 0], [0.21, 0.21, 0.21], '#8fd7d0');
    bake(n, false);
  });
}
function slice(p, r, h, color) {
  const shape = new T.Shape();
  shape.moveTo(0, 0);
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 6 + (i * Math.PI) / 24;
    shape.lineTo(Math.sin(a) * r, -Math.cos(a) * r);
  }
  shape.closePath();
  const geo = new T.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: true,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    bevelSegments: 1,
    steps: 1,
  });
  geo.rotateX(-Math.PI / 2);
  return mesh(p, geo, [0, 0, 0], color);
}
export function food(kind) {
  return instance('food:' + kind, (n) => {
    cylinder(n, [0, 0.025, 0], 0.68, 0.055, C.cream);
    cylinder(n, [0, 0.06, 0], 0.59, 0.02, '#e2d5b6');
    ring(n, [0, 0.075, 0], 0.63, 0.025, C.cream);
    ring(n, [0, 0.079, 0], 0.56, 0.007, C.teal);
    const count = [3, 6, 6, 4][kind];
    for (let i = 0; i < count; i++) {
      const p = group(n, 'portion' + i),
        a = (i * Math.PI * 2) / count;
      if (kind === 0) {
        p.position.set(Math.cos(a) * 0.29, 0.085, Math.sin(a) * 0.29);
        cylinder(p, [0, 0.055, 0], 0.24, 0.09, '#c88b41');
        cylinder(p, [0, 0.155, 0], 0.23, 0.075, '#79503a');
        cylinder(p, [0, 0.205, 0], 0.25, 0.035, '#eab444');
        cylinder(p, [0, 0.237, 0], 0.21, 0.035, '#c56a43');
        for (let j = 0; j < 6; j++)
          ball(p, [Math.cos(j) * 0.21, 0.12, Math.sin(j) * 0.21], [0.18, 0.05, 0.13], '#80a057');
        ball(p, [0, 0.31, 0], [0.51, 0.22, 0.51], '#dba75e');
        for (let j = 0; j < 8; j++)
          ball(
            p,
            [Math.cos(j * 2.4) * 0.13, 0.41, Math.sin(j * 2.4) * 0.13],
            [0.025, 0.013, 0.05],
            '#f6e4b6',
          );
      }
      if (kind === 1) {
        p.position.y = 0.085;
        p.rotation.y = a;
        slice(p, 0.56, 0.08, '#c99250');
        slice(p, 0.51, 0.025, '#edbc56').position.y = 0.086;
        for (let j = 0; j < 4; j++)
          ball(
            p,
            [Math.sin(-0.36 + j * 0.24) * 0.53, 0.12, Math.cos(-0.36 + j * 0.24) * 0.53],
            [0.12, 0.12, 0.1],
            '#d69f57',
          );
        cylinder(p, [0, 0.13, 0.32], 0.075, 0.02, '#c66646');
        ball(p, [0.09, 0.15, 0.39], [0.07, 0.03, 0.13], '#6f9256');
        ball(p, [-0.07, 0.15, 0.24], [0.045, 0.03, 0.045], '#574b3f');
        ball(p, [-0.09, 0.15, 0.4], [0.12, 0.035, 0.07], C.cream);
      }
      if (kind === 2) {
        p.position.set(Math.cos(a) * 0.22, 0.28, Math.sin(a) * 0.22);
        ball(p, [0, 0, 0], [0.13, 0.07, 0.12], i % 2 ? '#709455' : '#f0c46b');
        ball(p, [0.03, 0.02, 0.03], [0.035, 0.015, 0.09], '#477c58');
      }
      if (kind === 3) {
        p.position.set(Math.cos(a) * 0.29, 0.085, Math.sin(a) * 0.29);
        p.rotation.y = -a;
        slice(p, 0.32, 0.19, '#eac15e');
        for (let j = 0; j < 2; j++)
          cylinder(p, [-0.04 + j * 0.09, 0.196, 0.19], 0.024, 0.005, '#bd913b');
        for (let j = 0; j < 4; j++)
          ball(
            p,
            [0.15 + (j % 2) * 0.07, 0.065 + Math.floor(j / 2) * 0.055, 0.14 + j * 0.045],
            [0.1, 0.1, 0.1],
            j % 2 ? '#9a6b92' : '#755478',
          );
        cylinder(p, [-0.12, 0.03, 0.14], 0.1, 0.04, '#c8a570');
      }
      bake(p, false);
    }
    if (kind === 2) {
      cylinder(n, [0, 0.15, 0], 0.51, 0.19, C.teal);
      ring(n, [0, 0.25, 0], 0.475, 0.035, C.cream);
      named(cylinder(n, [0, 0.269, 0], 0.425, 0.02, '#dca448'), 'liquid');
    }
    const crumbs = group(n, 'crumbs');
    for (let i = 0; i < 8; i++)
      ball(
        crumbs,
        [Math.cos(i * 2.4) * (0.16 + i * 0.04), 0.09, Math.sin(i * 2.4) * (0.16 + i * 0.04)],
        [0.055, 0.025, 0.04],
        '#be9759',
      );
    bake(crumbs, false);
    crumbs.visible = false;
    bake(n, false);
  });
}
export function plant() {
  return instance('plant', (n) => {
    cylinder(n, [0, 0.26, 0], 0.32, 0.52, '#bc7b5a');
    ring(n, [0, 0.52, 0], 0.31, 0.035, '#d3a080');
    cylinder(n, [0, 0.54, 0], 0.27, 0.03, '#655640');
    for (let i = 0; i < 7; i++) {
      const a = (i * Math.PI * 2) / 7,
        l = ball(
          n,
          [Math.cos(a) * 0.2, 0.87, Math.sin(a) * 0.2],
          [0.26, 0.85, 0.14],
          i % 2 ? C.teal : C.mint,
        );
      l.rotation.z = Math.cos(a) * 0.5;
      rod(n, [0, 0.52, 0], [Math.cos(a) * 0.3, 1.12, Math.sin(a) * 0.3], 0.012, '#648160');
      if (i % 2 === 0) {
        for (let j = 0; j < 4; j++)
          ball(
            n,
            [
              Math.cos(a) * 0.3 + Math.cos((j * Math.PI) / 2) * 0.06,
              1.2,
              Math.sin(a) * 0.3 + Math.sin((j * Math.PI) / 2) * 0.06,
            ],
            [0.1, 0.065, 0.1],
            C.coral,
          );
        ball(n, [Math.cos(a) * 0.3, 1.24, Math.sin(a) * 0.3], [0.065, 0.06, 0.065], C.gold);
      }
    }
    bake(n);
  });
}
export function table(index) {
  return instance('table:' + (index % 2), (n) => {
    cylinder(n, [0, 0.12, 0], 0.52, 0.2, C.ink);
    cylinder(n, [0, 0.65, 0], 0.13, 1.1, C.ink);
    cylinder(n, [0, 1.15, 0], 1.12, 0.18, '#a37b56');
    cylinder(n, [0, 1.26, 0], 1.04, 0.05, index % 2 ? C.mint : C.coral);
    ring(n, [0, 1.29, 0], 1.025, 0.019, C.gold);
    box(n, [0, 1.299, 0], [0.44, 0.012, 1.87], C.cream);
    for (const x of [-0.19, 0.19]) box(n, [x, 1.308, 0], [0.015, 0.008, 1.8], C.teal);
    cylinder(n, [0, 1.35, -0.28], 0.13, 0.12, C.cream);
    ball(n, [0, 1.47, -0.28], [0.2, 0.28, 0.2], C.gold);
    box(n, [0.65, 1.317, 0.1], [0.26, 0.02, 0.47], C.cream);
    rod(n, [0.76, 1.34, -0.03], [0.76, 1.34, 0.25], 0.011, C.ink);
    for (const z of [-0.08, -0.04, 0]) rod(n, [0.76, 1.34, z], [0.82, 1.34, z], 0.006, C.ink);
    for (const x of [-0.34, -0.14]) {
      cylinder(n, [x, 1.39, -0.65], 0.06, 0.17, x < -0.2 ? C.cream : '#876651');
      ball(n, [x, 1.48, -0.65], [0.12, 0.04, 0.12], C.ink);
    }
    for (const side of [-1, 1]) {
      const x = side * 1.43;
      box(n, [x, 0.65, 0], [0.68, 0.18, 0.7], C.teal);
      box(n, [x + side * 0.29, 1, 0], [0.12, 0.7, 0.7], C.teal);
      box(n, [x, 0.77, 0], [0.58, 0.07, 0.59], index % 2 ? C.coral : C.mint);
      for (const z of [-0.25, 0.25]) box(n, [x, 0.3, z], [0.12, 0.6, 0.1], '#86684f');
    }
    bake(n);
  });
}
