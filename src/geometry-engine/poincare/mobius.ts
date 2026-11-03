// Moving the hyperbolic plane around inside the Poincaré disk. Not part of upstream
// hyperbolic-canvas. Points are plain complex numbers {x, y} for speed: the tiling
// transforms thousands of them while you drag.

export interface C {
  x: number;
  y: number;
}

export const cAdd = (a: C, b: C): C => ({ x: a.x + b.x, y: a.y + b.y });
export const cSub = (a: C, b: C): C => ({ x: a.x - b.x, y: a.y - b.y });
export const cMul = (a: C, b: C): C => ({ x: a.x * b.x - a.y * b.y, y: a.x * b.y + a.y * b.x });
export const cConj = (a: C): C => ({ x: a.x, y: -a.y });
export const cAbs2 = (a: C) => a.x * a.x + a.y * a.y;
export const cScale = (a: C, k: number): C => ({ x: a.x * k, y: a.y * k });
export function cDiv(a: C, b: C): C {
  const d = cAbs2(b);
  return { x: (a.x * b.x + a.y * b.y) / d, y: (a.y * b.x - a.x * b.y) / d };
}

/**
 * An orientation-preserving isometry of the disk: z ↦ (a·z + b) / (b̄·z + ā),
 * with |a|² − |b|² = 1. Every "slide" and "turn" of the hyperbolic plane is one.
 */
export interface Mobius {
  a: C;
  b: C;
}

export const MOBIUS_IDENTITY: Mobius = { a: { x: 1, y: 0 }, b: { x: 0, y: 0 } };

function normalize(m: Mobius): Mobius {
  const k = Math.sqrt(Math.max(1e-300, cAbs2(m.a) - cAbs2(m.b)));
  return { a: cScale(m.a, 1 / k), b: cScale(m.b, 1 / k) };
}

export function mobiusApply(m: Mobius, z: C): C {
  return cDiv(cAdd(cMul(m.a, z), m.b), cAdd(cMul(cConj(m.b), z), cConj(m.a)));
}

/** first, then second. */
export function mobiusCompose(second: Mobius, first: Mobius): Mobius {
  return normalize({
    a: cAdd(cMul(second.a, first.a), cMul(second.b, cConj(first.b))),
    b: cAdd(cMul(second.a, first.b), cMul(second.b, cConj(first.a))),
  });
}

export function mobiusInverse(m: Mobius): Mobius {
  return { a: cConj(m.a), b: cScale(m.b, -1) };
}

/** The hyperbolic translation that carries the centre to p (|p| < 1). */
export function translationTo(p: C): Mobius {
  const k = 1 / Math.sqrt(1 - cAbs2(p));
  return { a: { x: k, y: 0 }, b: cScale(p, k) };
}

/** The isometry that carries `from` to `to` (used when you drag the plane). */
export function dragMove(from: C, to: C): Mobius {
  return mobiusCompose(translationTo(to), mobiusInverse(translationTo(from)));
}

/**
 * The hyperbolic straight line through a and b: either a diameter (direction of the
 * line through the origin) or a circle meeting the rim at right angles.
 */
export type GeodesicShape = { kind: 'diameter'; dir: C } | { kind: 'circle'; center: C; radius: number };

export function geodesicThrough(a: C, b: C): GeodesicShape {
  // A circle orthogonal to the unit circle through a satisfies c·a = (1 + |a|²) / 2
  const det = a.x * b.y - a.y * b.x;
  if (Math.abs(det) < 1e-12) {
    const d = cAbs2(a) > cAbs2(b) ? a : b;
    const len = Math.sqrt(cAbs2(d)) || 1;
    return { kind: 'diameter', dir: { x: d.x / len, y: d.y / len } };
  }
  const ra = (1 + cAbs2(a)) / 2;
  const rb = (1 + cAbs2(b)) / 2;
  const center = { x: (ra * b.y - rb * a.y) / det, y: (rb * a.x - ra * b.x) / det };
  return { kind: 'circle', center, radius: Math.sqrt(Math.max(0, cAbs2(center) - 1)) };
}

/** Reflection in the hyperbolic line through a and b (an isometry that reverses orientation). */
export function reflectAcross(a: C, b: C): (z: C) => C {
  const g = geodesicThrough(a, b);
  if (g.kind === 'diameter') {
    const { dir } = g;
    return (z) => {
      const dot = z.x * dir.x + z.y * dir.y;
      return { x: 2 * dot * dir.x - z.x, y: 2 * dot * dir.y - z.y };
    };
  }
  const { center, radius } = g;
  const r2 = radius * radius;
  return (z) => {
    const d = cSub(z, center);
    return cAdd(center, cScale(d, r2 / cAbs2(d)));
  };
}

/** Hyperbolic distance between two disk points (curvature −1). */
export function diskDistance(a: C, b: C): number {
  const num = 2 * cAbs2(cSub(a, b));
  const den = (1 - cAbs2(a)) * (1 - cAbs2(b));
  return Math.acosh(1 + num / den);
}
