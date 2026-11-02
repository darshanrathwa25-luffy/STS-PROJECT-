import { GeometryKind } from './types';
import { DEFAULT_SPHERE_RADIUS } from '../spherical/distance';

export interface CircleMetricsResult {
  radius: number;
  circumference: number;
  area: number;
  euclideanCircumference: number;
  euclideanArea: number;
  ratioCircumferenceToRadius: number; // in Euclidean this is always 2*pi approx 6.283
  differenceRatio: number; // (C - C_euc) / C_euc
  explanation: string;
}

/**
 * Calculate exact circumference and area of a geodesic circle of radius r
 * across Euclidean, Spherical, and Hyperbolic geometries.
 */
export function computeCircleMetrics(
  kind: GeometryKind,
  r: number,
  sphereRadius = DEFAULT_SPHERE_RADIUS
): CircleMetricsResult {
  const cEuc = 2 * Math.PI * r;
  const aEuc = Math.PI * r * r;

  let c = cEuc;
  let a = aEuc;
  let explanation = '';

  if (kind === 'euclidean') {
    c = cEuc;
    a = aEuc;
    explanation = 'In flat space, circumference is strictly linear C = 2πr and area is quadratic A = πr². The ratio C/r is constant (2π ≈ 6.283).';
  } else if (kind === 'spherical') {
    const R = sphereRadius;
    // C = 2 * pi * R * sin(r / R)
    c = 2 * Math.PI * R * Math.sin(r / R);
    // A = 2 * pi * R^2 * (1 - cos(r / R))
    a = 2 * Math.PI * R * R * (1 - Math.cos(r / R));
    explanation = `In positive curvature (K = +1/R²), circles have LESS perimeter and area than in Euclidean space (C < 2πr). At the equator (r = ${(
      (Math.PI / 2) *
      R
    ).toFixed(2)}), circumference peaks and then begins shrinking toward zero at the antipodal pole!`;
  } else {
    // Hyperbolic (K = -1)
    // C = 2 * pi * sinh(r)
    c = 2 * Math.PI * Math.sinh(r);
    // A = 2 * pi * (cosh(r) - 1)
    a = 2 * Math.PI * (Math.cosh(r) - 1);
    explanation =
      'In negative curvature (K = -1), space expands exponentially! Circumference C = 2π·sinh(r) and area A = 2π·(cosh(r)-1) grow exponentially fast, far exceeding flat Euclidean circles.';
  }

  const ratio = r > 0 ? c / r : 2 * Math.PI;
  const diffRatio = (c - cEuc) / cEuc;

  return {
    radius: r,
    circumference: c,
    area: a,
    euclideanCircumference: cEuc,
    euclideanArea: aEuc,
    ratioCircumferenceToRadius: ratio,
    differenceRatio: diffRatio,
    explanation,
  };
}

