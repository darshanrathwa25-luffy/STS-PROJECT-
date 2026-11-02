import { Point2D, Point3D, ConstructedTriangle } from '../shared/types';
import { clamp } from '../shared/numerical';

export const DEFAULT_SADDLE_C = 0.5; // z = c * (u^2 - v^2), so K(0, 0) = -4*c^2 = -1.0
export const DEFAULT_SADDLE_DOMAIN = 2.0;

export interface SaddleTriangleMeasurements {
  p1: Point2D;
  p2: Point2D;
  p3: Point2D;
  vertices3D: [Point3D, Point3D, Point3D];
  edges3D: [Point3D[], Point3D[], Point3D[]];
  sides: [number, number, number];
  alpha: number;
  beta: number;
  gamma: number;
  angleSum: number;
  angleSumDeg: number;
  defect: number;
  defectDeg: number;
  integralKdA: number;
  defectFromIntegral: number;
  gaussBonnetDiscrepancy: number;
  degenerate: boolean;
}

export interface PrincipalCurvatureInfo {
  k1: number; // positive principal curvature (bends up)
  k2: number; // negative principal curvature (bends down)
  dir1: Point3D; // 3D unit tangent direction for k1
  dir2: Point3D; // 3D unit tangent direction for k2
}

export interface SaddleGeodesicResult {
  path: { u: number; v: number; du: number; dv: number }[];
  usedFallback: boolean;
  length: number;
}

/**
 * 3D position vector on the saddle Monge patch z = c * (u^2 - v^2).
 */
export function saddlePosition(u: number, v: number, c = DEFAULT_SADDLE_C): Point3D {
  return {
    x: u,
    y: v,
    z: c * (u * u - v * v),
  };
}

/**
 * Unit normal vector at (u, v) on the saddle Monge patch.
 * n = (-f_u, -f_v, 1) / sqrt(1 + f_u^2 + f_v^2)
 */
export function saddleNormal(u: number, v: number, c = DEFAULT_SADDLE_C): Point3D {
  const fu = 2 * c * u;
  const fv = -2 * c * v;
  const w = Math.sqrt(1 + fu * fu + fv * fv);
  return {
    x: -fu / w,
    y: -fv / w,
    z: 1 / w,
  };
}

/**
 * Gaussian curvature K(u, v) on the Monge patch z = c * (u^2 - v^2):
 * K = -4 * c^2 / (1 + 4 * c^2 * (u^2 + v^2))^2
 * Strictly negative everywhere on the surface.
 */
export function saddleGaussianCurvature(u: number, v: number, c = DEFAULT_SADDLE_C): number {
  const r2 = u * u + v * v;
  const denom = 1 + 4 * c * c * r2;
  return (-4 * c * c) / (denom * denom);
}

/**
 * Curvature range across a domain |u| <= domain, |v| <= domain.
 */
export function saddleCurvatureRange(
  domain = DEFAULT_SADDLE_DOMAIN,
  c = DEFAULT_SADDLE_C
): { min: number; max: number; maxMagnitude: number; minMagnitude: number } {
  const min = -4 * c * c; // Most negative (at origin u=0, v=0)
  const rCorner2 = 2 * domain * domain; // Furthest corner
  const denom = 1 + 4 * c * c * rCorner2;
  const max = (-4 * c * c) / (denom * denom); // Least negative (closest to 0)
  return {
    min,
    max,
    maxMagnitude: Math.abs(min),
    minMagnitude: Math.abs(max),
  };
}

/**
 * Computes principal curvatures and their 3D tangent directions at (u, v).
 * Demonstrates why Gaussian curvature is negative: one principal direction curves UP (k1 > 0)
 * while the orthogonal principal direction curves DOWN (k2 < 0).
 */
export function saddlePrincipalCurvatures(
  u: number,
  v: number,
  c = DEFAULT_SADDLE_C
): PrincipalCurvatureInfo {
  const fu = 2 * c * u;
  const fv = -2 * c * v;
  const fuu = 2 * c;
  const fvv = -2 * c;
  const fuv = 0;

  const E = 1 + fu * fu;
  const F = fu * fv;
  const G = 1 + fv * fv;
  const W = Math.sqrt(E * G - F * F);

  const L = fuu / W;
  const M = fuv / W;
  const N = fvv / W;

  const a11 = (G * L - F * M) / (W * W);
  const a12 = (G * M - F * N) / (W * W);
  const a21 = (-F * L + E * M) / (W * W);
  const a22 = (-F * M + E * N) / (W * W);

  const trace = a11 + a22;
  const det = a11 * a22 - a12 * a21; // = K < 0
  const disc = Math.sqrt(Math.max(0, trace * trace - 4 * det));

  const k1 = 0.5 * (trace + disc); // > 0 (bends up)
  const k2 = 0.5 * (trace - disc); // < 0 (bends down)

  let du1 = 1, dv1 = 0;
  if (Math.abs(a12) > 1e-9) {
    du1 = a12;
    dv1 = k1 - a11;
  } else if (Math.abs(a21) > 1e-9) {
    du1 = k1 - a22;
    dv1 = a21;
  }

  let du2 = 1, dv2 = 0;
  if (Math.abs(a12) > 1e-9) {
    du2 = a12;
    dv2 = k2 - a11;
  } else if (Math.abs(a21) > 1e-9) {
    du2 = k2 - a22;
    dv2 = a21;
  }

  const dir1 = saddleTangent3D({ x: u, y: v }, du1, dv1, c);
  const dir2 = saddleTangent3D({ x: u, y: v }, du2, dv2, c);

  return { k1, k2, dir1, dir2 };
}

/**
 * 3D unit tangent vector along a curve with velocity (du, dv) at point (u, v).
 */
export function saddleTangent3D(
  p: Point2D,
  du: number,
  dv: number,
  c = DEFAULT_SADDLE_C
): Point3D {
  const fu = 2 * c * p.x;
  const fv = -2 * c * p.y;
  const dz = fu * du + fv * dv;
  const len = Math.hypot(du, dv, dz);
  if (len < 1e-12) return { x: 0, y: 0, z: 1 };
  return {
    x: du / len,
    y: dv / len,
    z: dz / len,
  };
}

/**
 * RK4 integration for the geodesic ODE on the Monge patch z = c * (u^2 - v^2):
 * d^2 u / dt^2 = -lambda * f_u
 * d^2 v / dt^2 = -lambda * f_v
 * where lambda = (f_uu * du^2 + 2 * f_uv * du * dv + f_vv * dv^2) / (1 + f_u^2 + f_v^2)
 */
export function saddleGeodesicRK4(
  u0: number,
  v0: number,
  du0: number,
  dv0: number,
  steps = 40,
  c = DEFAULT_SADDLE_C
): { u: number; v: number; du: number; dv: number }[] {
  const dt = 1 / steps;
  let u = u0, v = v0, du = du0, dv = dv0;
  const path = [{ u, v, du, dv }];

  const accel = (uVal: number, vVal: number, duVal: number, dvVal: number) => {
    const W2 = 1 + 4 * c * c * (uVal * uVal + vVal * vVal);
    const lam = (2 * c * (duVal * duVal - dvVal * dvVal)) / W2;
    return {
      d2u: -2 * c * uVal * lam,
      d2v: 2 * c * vVal * lam,
    };
  };

  for (let i = 0; i < steps; i++) {
    const a1 = accel(u, v, du, dv);
    const u2 = u + 0.5 * dt * du;
    const v2 = v + 0.5 * dt * dv;
    const du2 = du + 0.5 * dt * a1.d2u;
    const dv2 = dv + 0.5 * dt * a1.d2v;

    const a2 = accel(u2, v2, du2, dv2);
    const u3 = u + 0.5 * dt * du2;
    const v3 = v + 0.5 * dt * dv2;
    const du3 = du + 0.5 * dt * a2.d2u;
    const dv3 = dv + 0.5 * dt * a2.d2v;

    const a3 = accel(u3, v3, du3, dv3);
    const u4 = u + dt * du3;
    const v4 = v + dt * dv3;
    const du4 = du + dt * a3.d2u;
    const dv4 = dv + dt * a3.d2v;

    const a4 = accel(u4, v4, du4, dv4);

    u += (dt / 6) * (du + 2 * du2 + 2 * du3 + du4);
    v += (dt / 6) * (dv + 2 * dv2 + 2 * dv3 + dv4);
    du += (dt / 6) * (a1.d2u + 2 * a2.d2u + 2 * a3.d2u + a4.d2u);
    dv += (dt / 6) * (a1.d2v + 2 * a2.d2v + 2 * a3.d2v + a4.d2v);

    path.push({ u, v, du, dv });
  }

  return path;
}

/**
 * Polyline relaxation fallback for geodesics (endpoints fixed) when shooting fails.
 * Minimizes geodesic curvature via 100 iterations of finite-difference relaxation.
 */
export function saddlePolylineRelax(
  p1: Point2D,
  p2: Point2D,
  steps = 50,
  iters = 120,
  c = DEFAULT_SADDLE_C
): { path: { u: number; v: number; du: number; dv: number }[]; length: number } {
  const uArr = new Float64Array(steps + 1);
  const vArr = new Float64Array(steps + 1);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    uArr[i] = p1.x + t * (p2.x - p1.x);
    vArr[i] = p1.y + t * (p2.y - p1.y);
  }

  for (let it = 0; it < iters; it++) {
    for (let i = 1; i < steps; i++) {
      const u = uArr[i], v = vArr[i];
      const du = (uArr[i + 1] - uArr[i - 1]) * 0.5;
      const dv = (vArr[i + 1] - vArr[i - 1]) * 0.5;
      const W2 = 1 + 4 * c * c * (u * u + v * v);
      const lam = (2 * c * (du * du - dv * dv)) / W2;
      const d2u = -2 * c * u * lam;
      const d2v = 2 * c * v * lam;

      const targetU = 0.5 * (uArr[i - 1] + uArr[i + 1]) - 0.5 * d2u;
      const targetV = 0.5 * (vArr[i - 1] + vArr[i + 1]) - 0.5 * d2v;
      uArr[i] += 0.45 * (targetU - u);
      vArr[i] += 0.45 * (targetV - v);
    }
  }

  const path: { u: number; v: number; du: number; dv: number }[] = [];
  let length = 0;

  for (let i = 0; i <= steps; i++) {
    const du = i < steps ? (uArr[i + 1] - uArr[i]) * steps : (uArr[steps] - uArr[steps - 1]) * steps;
    const dv = i < steps ? (vArr[i + 1] - vArr[i]) * steps : (vArr[steps] - vArr[steps - 1]) * steps;
    path.push({ u: uArr[i], v: vArr[i], du, dv });

    if (i < steps) {
      const z1 = c * (uArr[i] * uArr[i] - vArr[i] * vArr[i]);
      const z2 = c * (uArr[i + 1] * uArr[i + 1] - vArr[i + 1] * vArr[i + 1]);
      length += Math.hypot(uArr[i + 1] - uArr[i], vArr[i + 1] - vArr[i], z2 - z1);
    }
  }

  return { path, length };
}

/**
 * Solves the boundary value problem for a geodesic connecting p1 to p2 on the saddle surface.
 * Uses Newton-Raphson shooting with a polyline relaxation fallback.
 */
export function saddleGeodesicBetween(
  p1: Point2D,
  p2: Point2D,
  steps = 40,
  c = DEFAULT_SADDLE_C
): SaddleGeodesicResult {
  let du = p2.x - p1.x;
  let dv = p2.y - p1.y;

  for (let iter = 0; iter < 10; iter++) {
    const path = saddleGeodesicRK4(p1.x, p1.y, du, dv, steps, c);
    const end = path[path.length - 1];
    const errU = end.u - p2.x;
    const errV = end.v - p2.y;

    if (Math.hypot(errU, errV) < 1e-6) {
      let length = 0;
      for (let i = 0; i < path.length - 1; i++) {
        const pt1 = path[i], pt2 = path[i + 1];
        const z1 = c * (pt1.u * pt1.u - pt1.v * pt1.v);
        const z2 = c * (pt2.u * pt2.u - pt2.v * pt2.v);
        length += Math.hypot(pt2.u - pt1.u, pt2.v - pt1.v, z2 - z1);
      }
      return { path, usedFallback: false, length };
    }

    const eps = 1e-5;
    const pathU = saddleGeodesicRK4(p1.x, p1.y, du + eps, dv, steps, c);
    const endU = pathU[pathU.length - 1];
    const pathV = saddleGeodesicRK4(p1.x, p1.y, du, dv + eps, steps, c);
    const endV = pathV[pathV.length - 1];

    const j11 = (endU.u - end.u) / eps;
    const j12 = (endV.u - end.u) / eps;
    const j21 = (endU.v - end.v) / eps;
    const j22 = (endV.v - end.v) / eps;
    const det = j11 * j22 - j12 * j21;

    if (Math.abs(det) < 1e-14) break;

    du -= (j22 * errU - j12 * errV) / det;
    dv -= (-j21 * errU + j11 * errV) / det;
  }

  // Fallback to polyline relaxation
  const fallback = saddlePolylineRelax(p1, p2, steps, 100, c);
  return { path: fallback.path, usedFallback: true, length: fallback.length };
}

/**
 * Discretized 3D points along the geodesic connecting p1 to p2 on the saddle.
 */
export function saddleGeodesicPoints3D(
  p1: Point2D,
  p2: Point2D,
  steps = 40,
  c = DEFAULT_SADDLE_C
): Point3D[] {
  const { path } = saddleGeodesicBetween(p1, p2, steps, c);
  return path.map((pt) => saddlePosition(pt.u, pt.v, c));
}

/**
 * Geodesic arc length along the x-axis (v = 0) from 0 to u:
 * s(u) = int_0^u sqrt(1 + 4*c^2*t^2) dt
 */
export function xAxisArcLength(u: number, c = DEFAULT_SADDLE_C): number {
  const w = 2 * c * Math.abs(u);
  if (w < 1e-12) return 0;
  return (0.5 / (2 * c)) * (w * Math.sqrt(1 + w * w) + Math.log(w + Math.sqrt(1 + w * w)));
}

/**
 * Inverts xAxisArcLength to find coordinate u for given geodesic distance dist.
 */
export function invertXAxis(dist: number, c = DEFAULT_SADDLE_C): number {
  let u = dist;
  for (let i = 0; i < 6; i++) {
    const s = xAxisArcLength(u, c);
    const ds = Math.sqrt(1 + 4 * c * c * u * u);
    u -= (s - dist) / ds;
  }
  return u;
}

/**
 * Shoots from origin (0, 0) at angle alpha with speed 1 for total arc length b.
 */
export function shootFromOrigin(
  b: number,
  alpha: number,
  steps = 30,
  c = DEFAULT_SADDLE_C
): Point2D {
  const dt = b / steps;
  let u = 0, v = 0;
  let du = Math.cos(alpha), dv = Math.sin(alpha);

  const accel = (uVal: number, vVal: number, duVal: number, dvVal: number) => {
    const W2 = 1 + 4 * c * c * (uVal * uVal + vVal * vVal);
    const lam = (2 * c * (duVal * duVal - dvVal * dvVal)) / W2;
    return {
      d2u: -2 * c * uVal * lam,
      d2v: 2 * c * vVal * lam,
    };
  };

  for (let i = 0; i < steps; i++) {
    const a1 = accel(u, v, du, dv);
    const u2 = u + 0.5 * dt * du;
    const v2 = v + 0.5 * dt * dv;
    const du2 = du + 0.5 * dt * a1.d2u;
    const dv2 = dv + 0.5 * dt * a1.d2v;

    const a2 = accel(u2, v2, du2, dv2);
    const u3 = u + 0.5 * dt * du2;
    const v3 = v + 0.5 * dt * dv2;
    const du3 = du + 0.5 * dt * a2.d2u;
    const dv3 = dv + 0.5 * dt * a2.d2v;

    const a3 = accel(u3, v3, du3, dv3);
    const u4 = u + dt * du3;
    const v4 = v + dt * dv3;
    const du4 = du + dt * a3.d2u;
    const dv4 = dv + dt * a3.d2v;

    const a4 = accel(u4, v4, du4, dv4);

    u += (dt / 6) * (du + 2 * du2 + 2 * du3 + du4);
    v += (dt / 6) * (dv + 2 * dv2 + 2 * dv3 + dv4);
    du += (dt / 6) * (a1.d2u + 2 * a2.d2u + 2 * a3.d2u + a4.d2u);
    dv += (dt / 6) * (a1.d2v + 2 * a2.d2v + 2 * a3.d2v + a4.d2v);
  }

  return { x: u, y: v };
}

/**
 * Computes exact geodesic distance between two points on the saddle.
 */
export function geodesicDistanceOnSaddle(
  p1: Point2D,
  p2: Point2D,
  steps = 30,
  c = DEFAULT_SADDLE_C
): number {
  const res = saddleGeodesicBetween(p1, p2, steps, c);
  return res.length;
}

/**
 * Constructs a triangle on the saddle with given side lengths a, b, c:
 * - A is placed at the origin (0, 0).
 * - B is placed along the positive x-axis (geodesic by symmetry) at geodesic distance c.
 * - C is found by shooting from origin at angle alpha for length b and solving
 *   dist(B, C(alpha)) = a via secant method.
 * Returns null if impossible or outside the domain.
 */
export function constructSaddleTriangleFromSides(
  a: number,
  b: number,
  c_side: number,
  domain = DEFAULT_SADDLE_DOMAIN,
  c = DEFAULT_SADDLE_C,
  warmAlpha: number | null = null
): ConstructedTriangle<Point2D> | null {
  if (a <= 1e-5 || b <= 1e-5 || c_side <= 1e-5) return null;
  if (a + b <= c_side + 1e-6 || a + c_side <= b + 1e-6 || b + c_side <= a + 1e-6) return null;

  const uB = invertXAxis(c_side, c);
  if (Math.abs(uB) > domain) return null;

  const A: Point2D = { x: 0, y: 0 };
  const B: Point2D = { x: uB, y: 0 };

  const cosHyp = (Math.cosh(b) * Math.cosh(c_side) - Math.cosh(a)) / (Math.sinh(b) * Math.sinh(c_side));
  let alpha0 = warmAlpha !== null ? warmAlpha : Math.acos(clamp(cosHyp, -0.999, 0.999));
  let alpha1 = alpha0 + 0.01;

  let f0 = geodesicDistanceOnSaddle(B, shootFromOrigin(b, alpha0, 24, c), 24, c) - a;
  let f1 = geodesicDistanceOnSaddle(B, shootFromOrigin(b, alpha1, 24, c), 24, c) - a;

  for (let iter = 0; iter < 8; iter++) {
    if (Math.abs(f1) < 1e-5) break;
    const diff = f1 - f0;
    if (Math.abs(diff) < 1e-12) break;
    const dAlpha = (f1 * (alpha1 - alpha0)) / diff;
    alpha0 = alpha1;
    f0 = f1;
    alpha1 -= dAlpha;
    f1 = geodesicDistanceOnSaddle(B, shootFromOrigin(b, alpha1, 24, c), 24, c) - a;
  }

  const C = shootFromOrigin(b, alpha1, 30, c);

  if (Math.abs(C.x) > domain || Math.abs(C.y) > domain) {
    return null;
  }

  return { a: A, b: B, c: C };
}

function greensPotential(u: number, v: number, c: number): number {
  const r2 = u * u + v * v;
  if (r2 < 1e-12) return -2 * c * c;
  const sqrtTerm = Math.sqrt(1 + 4 * c * c * r2);
  return (1 - sqrtTerm) / (r2 * sqrtTerm);
}

function edgeLineIntegral(
  path: { u: number; v: number; du: number; dv: number }[],
  c: number
): number {
  let sum = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const midU = 0.5 * (path[i].u + path[i + 1].u);
    const midV = 0.5 * (path[i].v + path[i + 1].v);
    const du = path[i + 1].u - path[i].u;
    const dv = path[i + 1].v - path[i].v;
    const g = greensPotential(midU, midV, c);
    sum += g * (midU * dv - midV * du);
  }
  return sum;
}

function vectorAngle3D(v1: Point3D, v2: Point3D): number {
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  return Math.acos(clamp(dot, -1, 1));
}

/**
 * Computes triangle measurements on the 3D saddle surface.
 * Returns degenerate: true (never NaN) for collinear, coincident, or out-of-domain vertices.
 */
export function saddleTriangle(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  c = DEFAULT_SADDLE_C,
  domain = DEFAULT_SADDLE_DOMAIN
): SaddleTriangleMeasurements {
  const d12 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const d23 = Math.hypot(p3.x - p2.x, p3.y - p2.y);
  const d31 = Math.hypot(p1.x - p3.x, p1.y - p3.y);

  // Check out of domain
  const outOfDomain =
    Math.abs(p1.x) > domain || Math.abs(p1.y) > domain ||
    Math.abs(p2.x) > domain || Math.abs(p2.y) > domain ||
    Math.abs(p3.x) > domain || Math.abs(p3.y) > domain;

  const v3D = [
    saddlePosition(p1.x, p1.y, c),
    saddlePosition(p2.x, p2.y, c),
    saddlePosition(p3.x, p3.y, c),
  ] as [Point3D, Point3D, Point3D];

  // Check degenerate: coincident vertices or out of domain
  if (d12 < 1e-6 || d23 < 1e-6 || d31 < 1e-6 || outOfDomain) {
    return {
      p1, p2, p3,
      vertices3D: v3D,
      edges3D: [[v3D[0], v3D[1]], [v3D[1], v3D[2]], [v3D[2], v3D[0]]],
      sides: [d23, d31, d12],
      alpha: 0, beta: 0, gamma: 0,
      angleSum: 0, angleSumDeg: 0,
      defect: 0, defectDeg: 0,
      integralKdA: 0, defectFromIntegral: 0, gaussBonnetDiscrepancy: 0,
      degenerate: true,
    };
  }

  // Check 2D cross product for collinearity
  const cross = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
  if (Math.abs(cross) < 1e-6) {
    return {
      p1, p2, p3,
      vertices3D: v3D,
      edges3D: [[v3D[0], v3D[1]], [v3D[1], v3D[2]], [v3D[2], v3D[0]]],
      sides: [d23, d31, d12],
      alpha: 0, beta: 0, gamma: 0,
      angleSum: Math.PI, angleSumDeg: 180,
      defect: 0, defectDeg: 0,
      integralKdA: 0, defectFromIntegral: 0, gaussBonnetDiscrepancy: 0,
      degenerate: true,
    };
  }

  let a = p1, b = p2, d = p3;
  let swapped = false;
  if (cross < 0) {
    b = p3;
    d = p2;
    swapped = true;
  }

  const resAB = saddleGeodesicBetween(a, b, 40, c);
  const resBD = saddleGeodesicBetween(b, d, 40, c);
  const resDA = saddleGeodesicBetween(d, a, 40, c);

  const gAB = resAB.path;
  const gBD = resBD.path;
  const gDA = resDA.path;

  const edgeAB3D = gAB.map((pt) => saddlePosition(pt.u, pt.v, c));
  const edgeBD3D = gBD.map((pt) => saddlePosition(pt.u, pt.v, c));
  const edgeDA3D = gDA.map((pt) => saddlePosition(pt.u, pt.v, c));

  const tA_B = saddleTangent3D(a, gAB[0].du, gAB[0].dv, c);
  const endDA = gDA[gDA.length - 1];
  const tA_D = saddleTangent3D(a, -endDA.du, -endDA.dv, c);
  const angleA = vectorAngle3D(tA_B, tA_D);

  const tB_D = saddleTangent3D(b, gBD[0].du, gBD[0].dv, c);
  const endAB = gAB[gAB.length - 1];
  const tB_A = saddleTangent3D(b, -endAB.du, -endAB.dv, c);
  const angleB = vectorAngle3D(tB_D, tB_A);

  const tD_A = saddleTangent3D(d, gDA[0].du, gDA[0].dv, c);
  const endBD = gBD[gBD.length - 1];
  const tD_B = saddleTangent3D(d, -endBD.du, -endBD.dv, c);
  const angleD = vectorAngle3D(tD_A, tD_B);

  const alpha = isNaN(angleA) ? 0 : angleA;
  const beta = isNaN(swapped ? angleD : angleB) ? 0 : (swapped ? angleD : angleB);
  const gamma = isNaN(swapped ? angleB : angleD) ? 0 : (swapped ? angleB : angleD);

  const edge12_3D = swapped ? edgeDA3D.slice().reverse() : edgeAB3D;
  const edge23_3D = edgeBD3D;
  const edge31_3D = swapped ? edgeAB3D.slice().reverse() : edgeDA3D;

  const sideA = resBD.length;
  const sideB = swapped ? resAB.length : resDA.length;
  const sideC = swapped ? resDA.length : resAB.length;

  const angleSum = alpha + beta + gamma;
  const defect = Math.PI - angleSum;

  const integralKdA = edgeLineIntegral(gAB, c) + edgeLineIntegral(gBD, c) + edgeLineIntegral(gDA, c);
  const defectFromIntegral = -integralKdA;
  const gaussBonnetDiscrepancy = Math.abs(defect - defectFromIntegral);

  const degenerate = defect <= 1e-5 || alpha <= 1e-4 || beta <= 1e-4 || gamma <= 1e-4;

  return {
    p1, p2, p3,
    vertices3D: v3D,
    edges3D: [edge12_3D, edge23_3D, edge31_3D],
    sides: [sideA, sideB, sideC],
    alpha,
    beta,
    gamma,
    angleSum: isNaN(angleSum) ? 0 : angleSum,
    angleSumDeg: isNaN(angleSum) ? 0 : (angleSum * 180) / Math.PI,
    defect: isNaN(defect) ? 0 : defect,
    defectDeg: isNaN(defect) ? 0 : (defect * 180) / Math.PI,
    integralKdA: isNaN(integralKdA) ? 0 : integralKdA,
    defectFromIntegral: isNaN(defectFromIntegral) ? 0 : defectFromIntegral,
    gaussBonnetDiscrepancy: isNaN(gaussBonnetDiscrepancy) ? 0 : gaussBonnetDiscrepancy,
    degenerate,
  };
}
