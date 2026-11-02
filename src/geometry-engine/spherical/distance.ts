import { Point3D, TriangleMeasurements } from '../shared/types';
import { dot3D, norm3D } from '../shared/vectors';

export const DEFAULT_SPHERE_RADIUS = 2.5;

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
 * Spherical geodesic distance between two points on a sphere of radius R:
 * d = R * acos(clamp(dot(u, v) / (R * R), -1, 1))
 */
export function sphericalDistance(
  u: Point3D,
  v: Point3D,
  radius = DEFAULT_SPHERE_RADIUS
): number {
  const dot = dot3D(u, v);
  const cosTheta = dot / (radius * radius);
  const { angle } = safeAcos(cosTheta);
  return radius * angle;
}

/**
 * Spherical triangle interior angle at vertex v between geodesic arcs to p1 and p2.
 * Tangent vector at v along great circle to p: (v . v) p - (p . v) v
 */
export function sphericalAngleAt(
  v: Point3D,
  p1: Point3D,
  p2: Point3D
): { angle: number; degenerate: boolean } {
  const vDotV = dot3D(v, v);
  const p1DotV = dot3D(p1, v);
  const p2DotV = dot3D(p2, v);

  const t1: Point3D = {
    x: vDotV * p1.x - p1DotV * v.x,
    y: vDotV * p1.y - p1DotV * v.y,
    z: vDotV * p1.z - p1DotV * v.z,
  };
  const t2: Point3D = {
    x: vDotV * p2.x - p2DotV * v.x,
    y: vDotV * p2.y - p2DotV * v.y,
    z: vDotV * p2.z - p2DotV * v.z,
  };

  const norm1 = norm3D(t1);
  const norm2 = norm3D(t2);

  if (norm1 < 1e-9 || norm2 < 1e-9) {
    return { angle: 0, degenerate: true };
  }

  const cosVal = dot3D(t1, t2) / (norm1 * norm2);
  const { angle, clampedDegenerate } = safeAcos(cosVal);
  return { angle, degenerate: clampedDegenerate };
}

/**
 * Spherical triangle measurements:
 * Sum of angles > 180° (excess E = alpha + beta + gamma - pi)
 * Area = R^2 * E
 *
 * Degenerate triangles (coincident, collinear, antipodal, or non-positive excess)
 * return degenerate: true and never NaN.
 */
export function sphericalTriangle(
  a: Point3D,
  b: Point3D,
  c: Point3D,
  radius = DEFAULT_SPHERE_RADIUS
): TriangleMeasurements {
  const sideA = sphericalDistance(b, c, radius);
  const sideB = sphericalDistance(a, c, radius);
  const sideC = sphericalDistance(a, b, radius);

  let degenerate = false;

  // Check side lengths: points too close or near antipodal
  if (
    sideA < 1e-6 || sideB < 1e-6 || sideC < 1e-6 ||
    sideA >= Math.PI * radius - 1e-6 ||
    sideB >= Math.PI * radius - 1e-6 ||
    sideC >= Math.PI * radius - 1e-6
  ) {
    degenerate = true;
  }

  const resA = sphericalAngleAt(a, b, c);
  const resB = sphericalAngleAt(b, c, a);
  const resC = sphericalAngleAt(c, a, b);

  if (resA.degenerate || resB.degenerate || resC.degenerate) {
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

  const angleSum = alpha + beta + gamma;
  const excess = angleSum - Math.PI; // No Math.max(0, ...) clamp

  if (excess <= 1e-6) {
    degenerate = true;
  }

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
    area: isNaN(area) ? 0 : area,
    excessOrDefect: isNaN(excess) ? 0 : excess,
    degenerate,
  };
}
