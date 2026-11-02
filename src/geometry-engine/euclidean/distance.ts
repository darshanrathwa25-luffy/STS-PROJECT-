import { Point2D } from '../shared/types';
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

/**
 * Compute triangle interior angles and area (K = 0)
 */
export function euclideanTriangle(a: Point2D, b: Point2D, c: Point2D) {
  const sideA = euclideanDistance(b, c);
  const sideB = euclideanDistance(a, c);
  const sideC = euclideanDistance(a, b);

  // Law of cosines
  const cosAlpha = (sideB * sideB + sideC * sideC - sideA * sideA) / (2 * sideB * sideC);
  const cosBeta = (sideA * sideA + sideC * sideC - sideB * sideB) / (2 * sideA * sideC);
  const cosGamma = (sideA * sideA + sideB * sideB - sideC * sideC) / (2 * sideA * sideB);

  const alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha)));
  const beta = Math.acos(Math.max(-1, Math.min(1, cosBeta)));
  const gamma = Math.acos(Math.max(-1, Math.min(1, cosGamma)));

  // Area via cross product
  const area = 0.5 * Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));

  return {
    a: sideA,
    b: sideB,
    c: sideC,
    alpha,
    beta,
    gamma,
    angleSum: alpha + beta + gamma,
    angleSumDeg: ((alpha + beta + gamma) * 180) / Math.PI, // strictly 180°
    area,
    excessOrDefect: 0,
  };
}

