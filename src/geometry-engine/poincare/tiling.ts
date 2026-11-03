// Regular tilings of the hyperbolic plane, {p, q}: regular p-gons, q at every corner.
// Not part of upstream hyperbolic-canvas. Built by reflecting a central tile across
// its own sides, over and over, until the tiles are too small to see.
import { C, cAbs2, reflectAcross } from './mobius';

export interface Tile {
  vertices: C[];
  /** Hyperbolic centre of the tile (reflected along with the vertices). */
  center: C;
  /** Number of reflections from the first tile. */
  depth: number;
}

/** A {p, q} tiling exists on the hyperbolic plane exactly when (p − 2)(q − 2) > 4. */
export const isHyperbolicTiling = (p: number, q: number) => (p - 2) * (q - 2) > 4;

/**
 * Circumradius of the tile: from the right triangle (centre, corner, edge midpoint)
 * with angles π/p and π/q, cosh R = cot(π/p)·cot(π/q).
 */
export function tileCircumradius(p: number, q: number): number {
  return Math.acosh((1 / Math.tan(Math.PI / p)) * (1 / Math.tan(Math.PI / q)));
}

/** The {p, q} tile centred on the origin. */
export function centralTile(p: number, q: number, rotation = Math.PI / 2): Tile {
  const r = Math.tanh(tileCircumradius(p, q) / 2);
  const vertices = Array.from({ length: p }, (_, k) => {
    const t = rotation + (2 * Math.PI * k) / p;
    return { x: r * Math.cos(t), y: r * Math.sin(t) };
  });
  return { vertices, center: { x: 0, y: 0 }, depth: 0 };
}

export interface TilingOptions {
  /** Stop after this many tiles. */
  maxTiles?: number;
  /** Skip tiles smaller than this on the map (centre-to-corner, in disk units). */
  minSize?: number;
}

/** Every tile reachable from `seed` by reflections, largest first, down to `minSize` on the map. */
export function generateTiling(seed: Tile, { maxTiles = 2500, minSize = 0.004 }: TilingOptions = {}): Tile[] {
  const tiles: Tile[] = [seed];
  const seen = new Set<string>([key(seed.center)]);
  for (let i = 0; i < tiles.length && tiles.length < maxTiles; i++) {
    const t = tiles[i];
    const n = t.vertices.length;
    for (let e = 0; e < n && tiles.length < maxTiles; e++) {
      const reflect = reflectAcross(t.vertices[e], t.vertices[(e + 1) % n]);
      const center = reflect(t.center);
      if (cAbs2(center) >= 0.9999) continue;
      const k = key(center);
      if (seen.has(k)) continue;
      const vertices = t.vertices.map(reflect);
      if (size(center, vertices) < minSize) continue;
      seen.add(k);
      tiles.push({ vertices, center, depth: t.depth + 1 });
    }
  }
  return tiles;
}

function key(c: C): string {
  return `${Math.round(c.x * 1e6)},${Math.round(c.y * 1e6)}`;
}

function size(center: C, vertices: C[]): number {
  return Math.max(...vertices.map((v) => Math.hypot(v.x - center.x, v.y - center.y)));
}
