import type { GeometryKind, Point3D } from './shared/types';
import { DEFAULT_SPHERE_RADIUS } from './spherical/distance';

export interface CircleMeasurements {
  /** Distance around the circle. */
  circumference: number;
  area: number;
  /** The same for a flat circle of the same radius, for comparison. */
  flatCircumference: number;
  flatArea: number;
}

/**
 * Circumference and area of a circle of radius r (measured along the surface).
 *   flat:       2πr,              πr²
 *   sphere:     2πR·sin(r/R),     2πR²(1 − cos(r/R))     (shrinks again past the equator)
 *   hyperbolic: 2π·sinh r,        2π(cosh r − 1)         (curvature −1)
 */
export function circleMeasurements(kind: GeometryKind, r: number, R = DEFAULT_SPHERE_RADIUS): CircleMeasurements {
  const flatCircumference = 2 * Math.PI * r;
  const flatArea = Math.PI * r * r;
  if (kind === 'spherical') {
    return {
      circumference: 2 * Math.PI * R * Math.sin(r / R),
      area: 2 * Math.PI * R * R * (1 - Math.cos(r / R)),
      flatCircumference,
      flatArea,
    };
  }
  if (kind === 'hyperbolic') {
    return { circumference: 2 * Math.PI * Math.sinh(r), area: 2 * Math.PI * (Math.cosh(r) - 1), flatCircumference, flatArea };
  }
  return { circumference: flatCircumference, area: flatArea, flatCircumference, flatArea };
}

/** Largest radius a circle on the sphere can have: half way round, where it shrinks to the opposite point. */
export const sphereMaxCircleRadius = (R = DEFAULT_SPHERE_RADIUS) => Math.PI * R;

/** n + 1 points (closed loop) at surface distance r from `center` on a sphere of radius R. */
export function sphericalCirclePoints(center: Point3D, r: number, R = DEFAULT_SPHERE_RADIUS, n = 96): Point3D[] {
  const len = Math.hypot(center.x, center.y, center.z) || 1;
  const c = { x: center.x / len, y: center.y / len, z: center.z / len };
  // Any unit vector not parallel to c, then two perpendiculars to c
  const helper = Math.abs(c.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  let u = { x: helper.y * c.z - helper.z * c.y, y: helper.z * c.x - helper.x * c.z, z: helper.x * c.y - helper.y * c.x };
  const ul = Math.hypot(u.x, u.y, u.z);
  u = { x: u.x / ul, y: u.y / ul, z: u.z / ul };
  const v = { x: c.y * u.z - c.z * u.y, y: c.z * u.x - c.x * u.z, z: c.x * u.y - c.y * u.x };
  const a = r / R;
  const cosA = Math.cos(a);
  const sinA = Math.sin(a);
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = (i / n) * 2 * Math.PI;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    return {
      x: R * (cosA * c.x + sinA * (ct * u.x + st * v.x)),
      y: R * (cosA * c.y + sinA * (ct * u.y + st * v.y)),
      z: R * (cosA * c.z + sinA * (ct * u.z + st * v.z)),
    };
  });
}
