/**
 * NEON DISTRICT - engine/physics.js
 * AABB collision detection and resolution, spatial grid
 */

const CELL_SIZE = 160; // spatial grid cell size

export class Physics {
  constructor() {
    this._grid = new Map();
  }

  // ── Spatial grid ──────────────────────────────
  _cellKey(cx, cy) { return `${cx},${cy}`; }

  _cellsFor(x, y, w, h) {
    const cx0 = Math.floor(x / CELL_SIZE);
    const cy0 = Math.floor(y / CELL_SIZE);
    const cx1 = Math.floor((x + w) / CELL_SIZE);
    const cy1 = Math.floor((y + h) / CELL_SIZE);
    const keys = [];
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        keys.push(this._cellKey(cx, cy));
      }
    }
    return keys;
  }

  /** Rebuild grid from buildings + props */
  buildGrid(buildings, props) {
    this._grid.clear();
    const add = (item, x, y, w, h) => {
      for (const key of this._cellsFor(x, y, w, h)) {
        if (!this._grid.has(key)) this._grid.set(key, []);
        this._grid.get(key).push({ x, y, w, h, item });
      }
    };
    for (const b of buildings) add(b, b.x, b.y, b.w, b.h);
    for (const p of props)     if (p.solid) add(p, p.x - p.w/2, p.y - p.h/2, p.w, p.h);
  }

  /** Get nearby solids for an entity */
  query(x, y, w, h) {
    const seen = new Set();
    const result = [];
    for (const key of this._cellsFor(x - w, y - h, w*2 + w, h*2 + h)) {
      const cell = this._grid.get(key);
      if (!cell) continue;
      for (const entry of cell) {
        if (seen.has(entry.item)) continue;
        seen.add(entry.item);
        result.push(entry);
      }
    }
    return result;
  }

  /** Simple AABB overlap test */
  overlaps(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx &&
           ay < by + bh && ay + ah > by;
  }

  /** Move entity with collision response — returns resolved { x, y } */
  moveAndSlide(ex, ey, ew, eh, dx, dy, solids) {
    // Try X
    let nx = ex + dx;
    let ny = ey;
    const hx = ew / 2, hy = eh / 2;

    for (const s of solids) {
      if (this.overlaps(nx - hx, ny - hy, ew, eh, s.x, s.y, s.w, s.h)) {
        if (dx > 0) nx = s.x - hx;
        else if (dx < 0) nx = s.x + s.w + hx;
      }
    }

    // Try Y
    ny = ey + dy;
    for (const s of solids) {
      if (this.overlaps(nx - hx, ny - hy, ew, eh, s.x, s.y, s.w, s.h)) {
        if (dy > 0) ny = s.y - hy;
        else if (dy < 0) ny = s.y + s.h + hy;
      }
    }

    return { x: nx, y: ny };
  }

  /** Circle vs AABB — returns true if overlapping */
  circleAABB(cx, cy, cr, bx, by, bw, bh) {
    const nearX = Math.max(bx, Math.min(cx, bx + bw));
    const nearY = Math.max(by, Math.min(cy, by + bh));
    const dx    = cx - nearX;
    const dy    = cy - nearY;
    return dx*dx + dy*dy < cr*cr;
  }

  /** Ray-AABB intersection test, returns t or Infinity */
  raycast(ox, oy, dx, dy, len, solids) {
    let tMin = Infinity;
    const invDx = dx !== 0 ? 1/dx : Infinity;
    const invDy = dy !== 0 ? 1/dy : Infinity;

    for (const s of solids) {
      const tx1 = (s.x          - ox) * invDx;
      const tx2 = (s.x + s.w    - ox) * invDx;
      const ty1 = (s.y          - oy) * invDy;
      const ty2 = (s.y + s.h    - oy) * invDy;

      const txMin = Math.min(tx1, tx2);
      const txMax = Math.max(tx1, tx2);
      const tyMin = Math.min(ty1, ty2);
      const tyMax = Math.max(ty1, ty2);

      const tEnter = Math.max(txMin, tyMin);
      const tExit  = Math.min(txMax, tyMax);

      if (tEnter < tExit && tEnter >= 0 && tEnter < len) {
        tMin = Math.min(tMin, tEnter);
      }
    }
    return tMin;
  }

  /** Distance from point to AABB */
  distToRect(px, py, rx, ry, rw, rh) {
    const dx = Math.max(rx - px, 0, px - (rx + rw));
    const dy = Math.max(ry - py, 0, py - (ry + rh));
    return Math.sqrt(dx*dx + dy*dy);
  }
}
