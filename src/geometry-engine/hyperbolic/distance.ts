import { Point2D } from '../shared/types';
import { normSq2D, distSq2D } from '../shared/vectors';
import { clamp } from '../shared/numerical';

/**
 * Validate that a point lies strictly inside the unit Poincaré disk (|u| < 1)
 */
export function isInsidePoincareDisk(p: Point2D, margin = 1e-4): boolean {
  return normSq2D(p) < (1 - margin) ** 2;
}

/**
 * Hyperbolic distance in the unit Poincaré disk model (curvature K = -1):
 * d = acosh(1 + 2 * |u - v|^2 / ((1 - |u|^2) * (1 - |v|^2)))
 */
export function hyperbolicDistance(u: Point2D, v: Point2D): number {
  const normSqU = normSq2D(u);
  const normSqV = normSq2D(v);

  // Guard against points outside or on the boundary
  const safeU = Math.min(normSqU, 0.9999);
  const safeV = Math.min(normSqV, 0.9999);

  const diffSq = distSq2D(u, v);
  const denominator = (1 - safeU) * (1 - safeV);

  if (denominator <= 0) {
    return Infinity;
  }

  const arg = 1 + (2 * diffSq) / denominator;
  // arcosh(x) for x >= 1
  return Math.acosh(Math.max(1, arg));
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
 * Hyperbolic triangle measurements:
 * Sum of angles < 180°
 * Area = defect = pi - (alpha + beta + gamma)
 */
export function hyperbolicTriangle(
  a: Point2D,
  b: Point2D,
  c: Point2D,
  alpha: number,
  beta: number,
  gamma: number
) {
  const sideA = hyperbolicDistance(b, c);
  const sideB = hyperbolicDistance(a, c);
  const sideC = hyperbolicDistance(a, b);

  const angleSum = alpha + beta + gamma;
  const defect = Math.max(0, Math.PI - angleSum);

  return {
    a: sideA,
    b: sideB,
    c: sideC,
    alpha,
    beta,
    gamma,
    angleSum,
    angleSumDeg: (angleSum * 180) / Math.PI,
    area: defect,
    excessOrDefect: defect,
  };
}

