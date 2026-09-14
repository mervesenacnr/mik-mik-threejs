import { MAP, TABLES } from './config.js';
export const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export class Navigation {
  constructor() {
    this.rebuild(false);
  }
  rebuild(open) {
    this.obstacles = [
      { x: 0, z: -8.8, w: 23.8, d: 0.35 },
      { x: 0, z: -5.8, w: 7.6, d: 1.4 },
      { x: -8.6, z: -6.8, w: 2.5, d: 1.5 },
      { x: 8.5, z: -6.8, w: 3, d: 1.5 },
      ...TABLES.map(([x, z]) => ({ x, z, w: 2.15, d: 2.15 })),
    ];
    if (!open)
      for (const x of [-4, 4])
        for (const z of [2.4, 5.6]) this.obstacles.push({ x, z, w: 0.45, d: 1.8 });
    this.cache = new Map();
  }
  walkable(p, r = 0.32) {
    if (p.x < MAP.minX + r || p.x > MAP.maxX - r || p.z < MAP.minZ + r || p.z > MAP.maxZ - r)
      return false;
    return !this.obstacles.some(
      (o) => Math.abs(p.x - o.x) < o.w / 2 + r && Math.abs(p.z - o.z) < o.d / 2 + r,
    );
  }
  move(p, dx, dz, r = 0.32) {
    const n = { x: p.x + dx, z: p.z + dz };
    if (this.walkable(n, r)) {
      p.x = n.x;
      p.z = n.z;
    } else {
      if (this.walkable({ x: n.x, z: p.z }, r)) p.x = n.x;
      if (this.walkable({ x: p.x, z: n.z }, r)) p.z = n.z;
    }
  }
  cell(p) {
    return { x: Math.round(p.x * 2), z: Math.round(p.z * 2) };
  }
  nearest(p) {
    const c = this.cell(p);
    for (let ring = 0; ring < 8; ring++)
      for (let x = -ring; x <= ring; x++)
        for (let z = -ring; z <= ring; z++) {
          const v = { x: (c.x + x) / 2, z: (c.z + z) / 2 };
          if (this.walkable(v, 0.22)) return this.cell(v);
        }
    return c;
  }
  path(start, end) {
    const a = this.nearest(start),
      b = this.nearest(end),
      key = (p) => `${p.x},${p.z}`,
      goal = key(b),
      startKey = key(a),
      cacheKey = `${startKey}>${goal}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey).map((p) => ({ ...p }));
    const open = [{ ...a, g: 0, f: 0 }],
      cost = new Map([[startKey, 0]]),
      parents = new Map(),
      seen = new Set();
    let done = false,
      limit = 0;
    while (open.length && limit++ < 15000) {
      let at = 0;
      for (let i = 1; i < open.length; i++) if (open[i].f < open[at].f) at = i;
      const u = open.splice(at, 1)[0],
        uk = key(u);
      if (seen.has(uk)) continue;
      seen.add(uk);
      if (uk === goal) {
        done = true;
        break;
      }
      for (let dx = -1; dx <= 1; dx++)
        for (let dz = -1; dz <= 1; dz++) {
          if (!dx && !dz) continue;
          const v = { x: u.x + dx, z: u.z + dz },
            vk = key(v);
          if (seen.has(vk) || !this.walkable({ x: v.x / 2, z: v.z / 2 }, 0.22)) continue;
          if (
            dx &&
            dz &&
            (!this.walkable({ x: v.x / 2, z: u.z / 2 }, 0.22) ||
              !this.walkable({ x: u.x / 2, z: v.z / 2 }, 0.22))
          )
            continue;
          const g = u.g + Math.hypot(dx, dz);
          if (g >= (cost.get(vk) ?? Infinity)) continue;
          cost.set(vk, g);
          parents.set(vk, uk);
          open.push({ ...v, g, f: g + Math.hypot(v.x - b.x, v.z - b.z) });
        }
    }
    if (!done) return [];
    const result = [];
    let cur = goal;
    while (cur !== startKey) {
      const [x, z] = cur.split(',').map(Number);
      result.unshift({ x: x / 2, z: z / 2 });
      cur = parents.get(cur);
      if (!cur) break;
    }
    if (this.cache.size > 300) this.cache.clear();
    this.cache.set(cacheKey, result);
    return result.map((p) => ({ ...p }));
  }
}
