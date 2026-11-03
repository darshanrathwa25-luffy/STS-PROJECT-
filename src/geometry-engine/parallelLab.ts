import type { GeometryKind } from './shared/types';
import { intersectEuclideanLines } from './euclidean/intersections';
import { DEFAULT_SPHERE_RADIUS } from './spherical/distance';
import { hyperbolicDistance, angleOfParallelism } from './hyperbolic/distance';
import { computeGeodesicThroughPoints, computeGeodesicThroughPointAndAngle } from './hyperbolic/poincareDisk';
import { intersectHyperbolicGeodesics } from './hyperbolic/intersections';

/**
 * The fixed set-up of the Parallel lab, one per geometry. The scenes in
 * src/scenes draw exactly this: a line L and a point P off it.
 *   Euclidean:  L is the x-axis, P = (0, 2).
 *   Spherical:  L is the equator, P is at latitude 35° on the prime meridian.
 *   Hyperbolic: L is the horizontal diameter of the Poincaré disk, P = (0, 0.45).
 */
export const PARALLEL_LAB_SETUP = {
  euclidean: { P: { x: 0, y: 2 } },
  spherical: { latitudeDeg: 35 },
  hyperbolic: { P: { x: 0, y: 0.45 }, L: [{ x: -0.8, y: 0 }, { x: 0.8, y: 0 }] },
} as const;

export type ParallelVerdict = 'meets' | 'misses' | 'limiting';

export interface ParallelCandidateResult {
  verdict: ParallelVerdict;
  /** How many times the candidate line through P crosses L. */
  crossings: 0 | 1 | 2;
  /** Distance from P to L, measured in that geometry. */
  distance: number;
  /** Hyperbolic only: Π(d), the angle of parallelism, in degrees. */
  angleOfParallelismDeg?: number;
  /** Hyperbolic only: candidate angles with |θ| below this miss L (θ measured from L's direction). */
  limitAngleDeg?: number;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/**
 * Classify the line through P at angle `angleDeg` (measured from L's direction)
 * against L, in the given geometry.
 */
export function classifyParallelCandidate(kind: GeometryKind, angleDeg: number): ParallelCandidateResult {
  if (kind === 'euclidean') {
    const { P } = PARALLEL_LAB_SETUP.euclidean;
    const dir = { x: Math.cos(toRad(angleDeg)), y: Math.sin(toRad(angleDeg)) };
    const hit = intersectEuclideanLines({ x: 0, y: 0 }, { x: 1, y: 0 }, P, dir);
    const misses = hit.type === 'none';
    return { verdict: misses ? 'misses' : 'meets', crossings: misses ? 0 : 1, distance: P.y };
  }

  if (kind === 'spherical') {
    // Any two distinct great circles cross twice, at antipodal points.
    const distance = DEFAULT_SPHERE_RADIUS * toRad(PARALLEL_LAB_SETUP.spherical.latitudeDeg);
    return { verdict: 'meets', crossings: 2, distance };
  }

  const { P, L } = PARALLEL_LAB_SETUP.hyperbolic;
  const distance = hyperbolicDistance({ x: 0, y: 0 }, P);
  const piDeg = toDeg(angleOfParallelism(distance));
  const limitAngleDeg = 90 - piDeg;
  const hit = intersectHyperbolicGeodesics(
    computeGeodesicThroughPoints(L[0], L[1]),
    computeGeodesicThroughPointAndAngle(P, toRad(angleDeg))
  );

  let verdict: ParallelVerdict = 'misses';
  if (hit.type === 'limiting_parallel' || Math.abs(Math.abs(angleDeg) - limitAngleDeg) < 1.0) {
    verdict = 'limiting';
  } else if (hit.type === 'unique') {
    verdict = 'meets';
  }

  return {
    verdict,
    crossings: verdict === 'meets' ? 1 : 0,
    distance,
    angleOfParallelismDeg: piDeg,
    limitAngleDeg,
  };
}
