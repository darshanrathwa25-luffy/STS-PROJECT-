import { Point3D, GeodesicCurve } from '../shared/types';
import {
  dot3D,
  cross3D,
  norm3D,
  normalize3D,
  scale3D,
  add3D,
} from '../shared/vectors';
import { clamp, EPSILON } from '../shared/numerical';
import { DEFAULT_SPHERE_RADIUS } from './distance';

/**
 * Project any non-zero 3D point onto the sphere of radius R
 */
export function projectToSphere(
  p: Point3D,
  radius = DEFAULT_SPHERE_RADIUS
): Point3D {
  const n = normalize3D(p);
  return scale3D(n, radius);
}

/**
 * Spherical coordinates (lat in [-pi/2, pi/2], lon in [-pi, pi]) to Cartesian
 */
export function sphericalToCartesian(
  lat: number,
  lon: number,
  radius = DEFAULT_SPHERE_RADIUS
): Point3D {
  const cosLat = Math.cos(lat);
  return {
    x: radius * cosLat * Math.sin(lon),
    y: radius * Math.sin(lat),
    z: radius * cosLat * Math.cos(lon),
  };
}

/**
 * Cartesian to spherical coordinates
 */
export function cartesianToSpherical(
  p: Point3D,
  radius = DEFAULT_SPHERE_RADIUS
): { lat: number; lon: number } {
  const normP = norm3D(p);
  const r = normP < EPSILON ? radius : normP;
  const lat = Math.asin(clamp(p.y / r, -1, 1));
  const lon = Math.atan2(p.x, p.z);
  return { lat, lon };
}

/**
 * Generate discrete points along a great circle arc between points u and v
 * using Spherical Linear Interpolation (SLERP)
 */
export function generateGreatCircleArc(
  u: Point3D,
  v: Point3D,
  samples = 48,
  radius = DEFAULT_SPHERE_RADIUS,
  radialOffset = 1.002
): GeodesicCurve {
  const pu = projectToSphere(u, radius * radialOffset);
  const pv = projectToSphere(v, radius * radialOffset);

  const dot = clamp(dot3D(pu, pv) / ((radius * radialOffset) ** 2), -1, 1);
  const omega = Math.acos(dot);

  const points: Point3D[] = [];

  if (omega < EPSILON) {
    points.push(pu, pv);
  } else {
    const sinOmega = Math.sin(omega);
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const factorU = Math.sin((1 - t) * omega) / sinOmega;
      const factorV = Math.sin(t * omega) / sinOmega;
      const pt = add3D(scale3D(pu, factorU), scale3D(pv, factorV));
      points.push(pt);
    }
  }

  return {
    id: `sphere-arc-${Math.random().toString(36).substring(2, 7)}`,
    kind: 'spherical',
    points,
    isComplete: false,
  };
}

/**
 * Generate a complete 360° great circle geodesic on the sphere
 * Given by normal vector n of the cutting plane through origin
 */
export function generateCompleteGreatCircle(
  normal: Point3D,
  samples = 120,
  radius = DEFAULT_SPHERE_RADIUS,
  radialOffset = 1.003
): GeodesicCurve {
  const n = normalize3D(normal);

  // Construct orthonormal basis (e1, e2) spanning the plane perpendicular to n
  const arbitrary = Math.abs(n.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const e1 = normalize3D(cross3D(arbitrary, n));
  const e2 = normalize3D(cross3D(n, e1));

  const effectiveRadius = radius * radialOffset;
  const points: Point3D[] = [];

  for (let i = 0; i <= samples; i++) {
    const theta = (i / samples) * 2 * Math.PI;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    const pt = add3D(
      scale3D(e1, effectiveRadius * cosT),
      scale3D(e2, effectiveRadius * sinT)
    );
    points.push(pt);
  }

  return {
    id: `sphere-circle-${Math.random().toString(36).substring(2, 7)}`,
    kind: 'spherical',
    points,
    isComplete: true,
  };
}

/**
 * Generate complete great circle passing through point P with tangent direction T
 */
export function generateGreatCircleThroughPointAndTangent(
  point: Point3D,
  tangent: Point3D,
  samples = 120,
  radius = DEFAULT_SPHERE_RADIUS
): GeodesicCurve {
  const normal = cross3D(point, tangent);
  return generateCompleteGreatCircle(normal, samples, radius);
}

