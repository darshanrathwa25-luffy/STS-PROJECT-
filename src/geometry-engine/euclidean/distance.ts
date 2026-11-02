import { Point2D, TriangleMeasurements } from '../shared/types';
import { dist2D, distSq2D } from '../shared/vectors';

/**
 * Euclidean distance: d = sqrt((x2 - x1)^2 + (y2 - y1)^2)
 */
export function euclideanDistance(p1: Point2D, p2: Point2D): number {
  return dist2D(p1, p2);
}

export function euclideanDistanceSq(p1: Point2D, p2: Point2D): number {
  return distSq2D(p1, p2);
}

/**
 * Calculate distance from point P to line defined by two points A and B
 */
export function euclideanPointToLineDistance(p: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return euclideanDistance(p, a);
  const numerator = Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x);
  return numerator / Math.sqrt(l2);
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

/**
 * Compute triangle interior angles and area (K = 0).
 * Always returns angles in (0, pi) and never NaN.
 * Flags degenerate: true for coincident, collinear or invalid vertices.
 */
export function euclideanTriangle(a: Point2D, b: Point2D, c: Point2D): TriangleMeasurements {
  const sideA = euclideanDistance(b, c);
  const sideB = euclideanDistance(a, c);
  const sideC = euclideanDistance(a, b);

  let degenerate = false;
  if (sideA < 1e-7 || sideB < 1e-7 || sideC < 1e-7) {
    degenerate = true;
  }

  const denomA = 2 * sideB * sideC;
  const denomB = 2 * sideA * sideC;
  const denomC = 2 * sideA * sideB;

  if (denomA < 1e-14 || denomB < 1e-14 || denomC < 1e-14) {
    degenerate = true;
  }

  const cosAlphaRaw = denomA > 1e-14 ? (sideB * sideB + sideC * sideC - sideA * sideA) / denomA : 1;
  const cosBetaRaw = denomB > 1e-14 ? (sideA * sideA + sideC * sideC - sideB * sideB) / denomB : 1;
  const cosGammaRaw = denomC > 1e-14 ? (sideA * sideA + sideB * sideB - sideC * sideC) / denomC : 1;

  const resA = safeAcos(cosAlphaRaw);
  const resB = safeAcos(cosBetaRaw);
  const resC = safeAcos(cosGammaRaw);

  if (resA.clampedDegenerate || resB.clampedDegenerate || resC.clampedDegenerate) {
    degenerate = true;
  }

  const alpha = resA.angle;
  const beta = resB.angle;
  const gamma = resC.angle;

  if (
    alpha <= 1e-6 || beta <= 1e-6 || gamma <= 1e-6 ||
    alpha >= Math.PI - 1e-6 || beta >= Math.PI - 1e-6 || gamma >= Math.PI - 1e-6
  ) {
    degenerate = true;
  }

  // Area via 2D cross product
  const area = 0.5 * Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
  if (area < 1e-7) {
    degenerate = true;
  }

  const angleSum = alpha + beta + gamma;

  return {
    a: sideA,
    b: sideB,
    c: sideC,
    alpha,
    beta,
    gamma,
    angleSum,
    angleSumDeg: (angleSum * 180) / Math.PI,
    area,
    excessOrDefect: 0,
    degenerate,
  };
}

