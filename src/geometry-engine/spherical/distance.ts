import { Point3D } from '../shared/types';
import { dot3D, norm3D, cross3D } from '../shared/vectors';
import { clamp } from '../shared/numerical';

export const DEFAULT_SPHERE_RADIUS = 2.5;

/**
 * Spherical geodesic distance between two points on a sphere of radius R:
 * d = R * acos(clamp(dot(u, v) / (R * R), -1, 1))
 */
export function sphericalDistance(
  u: Point3D,
  v: Point3D,
  radius = DEFAULT_SPHERE_RADIUS
): number {
  const dot = dot3D(u, v);
  const cosTheta = clamp(dot / (radius * radius), -1, 1);
  return radius * Math.acos(cosTheta);
}

/**
 * Spherical triangle measurements:
 * Sum of angles > 180° (excess E = alpha + beta + gamma - pi)
 * Area = R^2 * E
 */
export function sphericalTriangle(
  a: Point3D,
  b: Point3D,
  c: Point3D,
  radius = DEFAULT_SPHERE_RADIUS
) {
  const sideA = sphericalDistance(b, c, radius);
  const sideB = sphericalDistance(a, c, radius);
  const sideC = sphericalDistance(a, b, radius);

  // Normal vectors of great-circle planes
  const nA = cross3D(b, c);
  const nB = cross3D(c, a);
  const nC = cross3D(a, b);

  // Angles between planes
  const angleBetween = (n1: Point3D, n2: Point3D) => {
    const l1 = norm3D(n1);
    const l2 = norm3D(n2);
    if (l1 === 0 || l2 === 0) return 0;
    const cosVal = clamp(dot3D(n1, n2) / (l1 * l2), -1, 1);
    // Interior dihedral angle is pi - acos(cosVal)
    return Math.PI - Math.acos(cosVal);
  };

  const alpha = angleBetween(nB, nC);
  const beta = angleBetween(nA, nC);
  const gamma = angleBetween(nA, nB);

  const angleSum = alpha + beta + gamma;
  const excess = Math.max(0, angleSum - Math.PI);
  const area = radius * radius * excess;

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
    excessOrDefect: excess,
  };
}

