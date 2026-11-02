import { Point2D, TriangleMeasurements } from '../shared/types';
import { normSq2D, distSq2D } from '../shared/vectors';

/**
 * Validate that a point lies strictly inside the unit Poincaré disk (|u| < 1)
 */
export function isInsidePoincareDisk(p: Point2D, margin = 1e-4): boolean {
  return normSq2D(p) < (1 - margin) ** 2;
}

function safeAcos(val: number): { angle: number; clampedDegenerate: boolean } {
  if (isNaN(val)) return { angle: 0, clampedDegenerate: true };
  let clampedDegenerate = false;
  if (val > 1) {
    if (val - 1 > 1e-6) clampedDegenerate = true;
    val = 1;
  } else if (val < -1) {
    if (-1 - val > 1e-6) clampedDegenerate = true;
    val = -1;
  }
  return { angle: Math.acos(val), clampedDegenerate };
}

function safeAcosh(val: number): { dist: number; clampedDegenerate: boolean } {
  if (isNaN(val)) return { dist: 0, clampedDegenerate: true };
  let clampedDegenerate = false;
  if (val < 1) {
    if (1 - val > 1e-6) clampedDegenerate = true;
    val = 1;
  }
  return { dist: Math.acosh(val), clampedDegenerate };
}

/**
 * Hyperbolic distance in the unit Poincaré disk model (curvature K = -1):
 * d = acosh(1 + 2 * |u - v|^2 / ((1 - |u|^2) * (1 - |v|^2)))
 *
 * Preserves a 0.9999 norm guard for rendering stability against boundary divergence.
 */
export function hyperbolicDistance(u: Point2D, v: Point2D): number {
  const normSqU = normSq2D(u);
  const normSqV = normSq2D(v);

  // Guard against points outside or on the boundary for rendering
  const safeU = Math.min(normSqU, 0.9999);
  const safeV = Math.min(normSqV, 0.9999);

  const diffSq = distSq2D(u, v);
  const denominator = (1 - safeU) * (1 - safeV);

  if (denominator <= 0) {
    return Infinity;
  }

  const arg = 1 + (2 * diffSq) / denominator;
  return Math.acosh(Math.max(1, arg));
}

/**
 * Unclamped hyperbolic distance for mathematical calculations and test validations.
 */
export function hyperbolicDistanceUnclamped(u: Point2D, v: Point2D): number {
  const normSqU = normSq2D(u);
  const normSqV = normSq2D(v);

  if (normSqU >= 1 || normSqV >= 1) {
    return Infinity;
  }

  const diffSq = distSq2D(u, v);
  const denominator = (1 - normSqU) * (1 - normSqV);

  if (denominator <= 0) {
    return Infinity;
  }

  const arg = 1 + (2 * diffSq) / denominator;
  const { dist } = safeAcosh(arg);
  return dist;
}

/**
 * Lobachevsky's Angle of Parallelism:
 * For an external point at perpendicular hyperbolic distance d from a line L,
 * the angle between the perpendicular segment and each of the two limiting parallels is:
 * Pi(d) = 2 * atan(exp(-d))
 */
export function angleOfParallelism(distance: number): number {
  return 2 * Math.atan(Math.exp(-distance));
}

/**
 * Computes the unit tangent vector at vertex `v` along the hyperbolic geodesic towards point `p`.
 * Uses the conformal property of the Poincaré disk: under the Möbius translation mapping v to 0,
 * geodesics map to straight Euclidean rays through 0, and the phase at v is preserved identically.
 */
export function hyperbolicTangentAt(v: Point2D, p: Point2D): Point2D {
  const dx = p.x - v.x;
  const dy = p.y - v.y;
  const A = 1 - (v.x * p.x + v.y * p.y);
  const B = -(v.x * p.y - v.y * p.x);
  const wx = dx * A + dy * B;
  const wy = dy * A - dx * B;
  const norm = Math.hypot(wx, wy);
  if (norm < 1e-12) {
    return { x: 0, y: 0 };
  }
  return {
    x: wx / norm,
    y: wy / norm,
  };
}

/**
 * Geometric calculation of the unit tangent vector at `v` towards `p` using explicit
 * diameter segments or orthogonal circular arcs.
 */
export function hyperbolicTangentGeometric(v: Point2D, p: Point2D): Point2D {
  const cross = Math.abs(v.x * p.y - v.y * p.x);
  const vNorm = Math.hypot(v.x, v.y);
  if (cross < 1e-9 || vNorm < 1e-9) {
    const dx = p.x - v.x;
    const dy = p.y - v.y;
    const dNorm = Math.hypot(dx, dy);
    if (dNorm < 1e-12) return { x: 0, y: 0 };
    return { x: dx / dNorm, y: dy / dNorm };
  }

  const d1 = (1 + v.x * v.x + v.y * v.y) / 2;
  const d2 = (1 + p.x * p.x + p.y * p.y) / 2;
  const det = v.x * p.y - v.y * p.x;
  const cx = (d1 * p.y - d2 * v.y) / det;
  const cy = (v.x * d2 - p.x * d1) / det;
  const R = Math.hypot(v.x - cx, v.y - cy);

  const thetaV = Math.atan2(v.y - cy, v.x - cx);
  const thetaP = Math.atan2(p.y - cy, p.x - cx);
  let dTheta = (thetaP - thetaV) % (2 * Math.PI);
  if (dTheta > Math.PI) dTheta -= 2 * Math.PI;
  if (dTheta < -Math.PI) dTheta += 2 * Math.PI;

  const sign = dTheta >= 0 ? 1 : -1;
  return {
    x: sign * (-(v.y - cy) / R),
    y: sign * ((v.x - cx) / R),
  };
}

/**
 * Computes the interior hyperbolic angle in radians at `vertex` between geodesics to `p` and `q`.
 */
export function hyperbolicAngleAt(vertex: Point2D, p: Point2D, q: Point2D): number {
  const t1 = hyperbolicTangentAt(vertex, p);
  const t2 = hyperbolicTangentAt(vertex, q);
  const norm1 = Math.hypot(t1.x, t1.y);
  const norm2 = Math.hypot(t2.x, t2.y);
  if (norm1 < 1e-9 || norm2 < 1e-9) {
    return 0;
  }
  const dot = t1.x * t2.x + t1.y * t2.y;
  const { angle } = safeAcos(dot);
  return angle;
}

/**
 * Hyperbolic triangle measurements:
 * Sum of angles < 180°
 * Area = defect = pi - (alpha + beta + gamma) (for K = -1)
 *
 * Angles are computed strictly internally using geodesic tangents.
 * Clamps and negative defects set degenerate: true without hiding defects.
 */
export function hyperbolicTriangle(
  a: Point2D,
  b: Point2D,
  c: Point2D
): TriangleMeasurements {
  const sideA = hyperbolicDistanceUnclamped(b, c);
  const sideB = hyperbolicDistanceUnclamped(a, c);
  const sideC = hyperbolicDistanceUnclamped(a, b);

  let degenerate = false;

  const normSqA = normSq2D(a);
  const normSqB = normSq2D(b);
  const normSqC = normSq2D(c);

  if (normSqA >= 0.9999 || normSqB >= 0.9999 || normSqC >= 0.9999) {
    degenerate = true;
  }

  if (sideA < 1e-6 || sideB < 1e-6 || sideC < 1e-6) {
    degenerate = true;
  }

  const alpha = hyperbolicAngleAt(a, b, c);
  const beta = hyperbolicAngleAt(b, c, a);
  const gamma = hyperbolicAngleAt(c, a, b);

  if (
    alpha <= 1e-6 || beta <= 1e-6 || gamma <= 1e-6 ||
    alpha >= Math.PI - 1e-6 || beta >= Math.PI - 1e-6 || gamma >= Math.PI - 1e-6
  ) {
    degenerate = true;
  }

  const angleSum = alpha + beta + gamma;
  const defect = Math.PI - angleSum; // No Math.max(0, ...) clamp

  if (defect <= 1e-6) {
    degenerate = true;
  }

  return {
    a: sideA,
    b: sideB,
    c: sideC,
    alpha,
    beta,
    gamma,
    angleSum,
    angleSumDeg: (angleSum * 180) / Math.PI,
    area: isNaN(defect) ? 0 : defect,
    excessOrDefect: isNaN(defect) ? 0 : defect,
    degenerate,
  };
}
