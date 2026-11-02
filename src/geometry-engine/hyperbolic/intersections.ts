import { Point2D, IntersectionInfo, IntersectionType } from '../shared/types';
import {
  dot2D,
  cross2D,
  norm2D,
  normalize2D,
  sub2D,
  dist2D,
  normSq2D,
} from '../shared/vectors';
import { approxEqual, EPSILON } from '../shared/numerical';
import { HyperbolicGeodesicDef } from './poincareDisk';
import { hyperbolicDistance } from './distance';

/**
 * Analytical intersection of two complete hyperbolic geodesics in the Poincaré disk
 */
export function intersectHyperbolicGeodesics(
  g1: HyperbolicGeodesicDef,
  g2: HyperbolicGeodesicDef
): IntersectionInfo {
  const [e1a, e1b] = g1.idealEndpoints;
  const [e2a, e2b] = g2.idealEndpoints;

  // Check coincidence (same endpoints)
  const isCoincident =
    (dist2D(e1a, e2a) < 1e-3 && dist2D(e1b, e2b) < 1e-3) ||
    (dist2D(e1a, e2b) < 1e-3 && dist2D(e1b, e2a) < 1e-3);

  if (isCoincident) {
    return {
      type: 'coincident',
      points: [],
      description: 'The geodesics are identical (coincident).',
    };
  }

  // Check limiting parallel: share exactly 1 ideal endpoint on |z| = 1
  const match1a = dist2D(e1a, e2a) < 1e-3 ? e1a : dist2D(e1a, e2b) < 1e-3 ? e1a : null;
  const match1b = dist2D(e1b, e2a) < 1e-3 ? e1b : dist2D(e1b, e2b) < 1e-3 ? e1b : null;
  const sharedIdeal = match1a || match1b;

  if (sharedIdeal) {
    return {
      type: 'limiting_parallel',
      points: [sharedIdeal],
      description: `Limiting parallel (asymptotically parallel): meets at infinity on the ideal boundary at (${sharedIdeal.x.toFixed(2)}, ${sharedIdeal.y.toFixed(2)}). Zero interior intersections.`,
    };
  }

  // Case 1: Both are diameters
  if (g1.isDiameter && g2.isDiameter) {
    const dir1 = g1.direction || { x: 1, y: 0 };
    const dir2 = g2.direction || { x: 0, y: 1 };
    const cross = cross2D(dir1, dir2);

    if (approxEqual(cross, 0, 1e-5)) {
      return {
        type: 'coincident',
        points: [],
        description: 'Both diameters are identical.',
      };
    }
    return {
      type: 'unique',
      points: [{ x: 0, y: 0 }],
      angle: Math.acos(Math.max(-1, Math.min(1, Math.abs(dot2D(dir1, dir2))))),
      description: 'Intersect at the center of the disk (0, 0).',
    };
  }

  // Case 2: One is diameter, one is circle
  if (g1.isDiameter || g2.isDiameter) {
    const diam = g1.isDiameter ? g1 : g2;
    const circ = g1.isDiameter ? g2 : g1;
    const dir = normalize2D(diam.direction || { x: 1, y: 0 });
    const c = circ.circle!.center;

    const b = dot2D(dir, c);
    const disc = b * b - 1;

    if (disc < -1e-5) {
      return {
        type: 'divergent',
        points: [],
        description: 'Ultraparallel (divergent): no intersection in interior or on boundary. Infinitely many such lines exist.',
      };
    }

    if (approxEqual(disc, 0, 1e-5)) {
      const t = b > 0 ? 1 : -1;
      const pt: Point2D = { x: t * dir.x, y: t * dir.y };
      return {
        type: 'limiting_parallel',
        points: [pt],
        description: 'Limiting parallel: tangents at the boundary circle.',
      };
    }

    // Two roots: t1 * t2 = 1. The interior root has |t| < 1
    const sqrtDisc = Math.sqrt(Math.max(0, disc));
    const r1 = b + sqrtDisc;
    const r2 = b - sqrtDisc;
    const tInt = Math.abs(r1) < 1 ? r1 : r2;

    const intPt: Point2D = { x: tInt * dir.x, y: tInt * dir.y };
    return {
      type: 'unique',
      points: [intPt],
      description: `Intersect at interior point (${intPt.x.toFixed(2)}, ${intPt.y.toFixed(2)}).`,
    };
  }

  // Case 3: Both are orthogonal circles C1 and C2
  const c1 = g1.circle!.center;
  const c2 = g2.circle!.center;

  const diffCenters = sub2D(c2, c1);
  const distCenters = norm2D(diffCenters);

  if (distCenters < 1e-6) {
    return {
      type: 'coincident',
      points: [],
      description: 'Circles share the same center and radius.',
    };
  }

  // Radical axis passes through origin in direction perpendicular to (c2 - c1)
  const v = normalize2D({ x: -diffCenters.y, y: diffCenters.x });
  const b = dot2D(v, c1);
  const disc = b * b - 1;

  if (disc < -1e-5) {
    return {
      type: 'divergent',
      points: [],
      description: 'Ultraparallel (divergent): lines never meet in the hyperbolic plane and diverge towards infinity. Infinitely many exist through this point.',
    };
  }

  if (approxEqual(disc, 0, 1e-4)) {
    const t = b > 0 ? 1 : -1;
    const pt: Point2D = { x: t * v.x, y: t * v.y };
    return {
      type: 'limiting_parallel',
      points: [pt],
      description: 'Limiting parallel: shares an ideal boundary point at infinity.',
    };
  }

  // Interior intersection point (|t| < 1)
  const sqrtDisc = Math.sqrt(Math.max(0, disc));
  const t1 = b + sqrtDisc;
  const t2 = b - sqrtDisc;
  const tInt = Math.abs(t1) < 1 ? t1 : t2;

  const intPt: Point2D = { x: tInt * v.x, y: tInt * v.y };

  return {
    type: 'unique',
    points: [intPt],
    description: `Intersect at interior hyperbolic point (${intPt.x.toFixed(2)}, ${intPt.y.toFixed(2)}).`,
  };
}

