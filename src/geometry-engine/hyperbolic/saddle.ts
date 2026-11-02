import { Point2D, Point3D } from '../shared/types';
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
 * Since K is negative everywhere, the minimum algebraic curvature is at the origin (-4*c^2),
 * and the maximum algebraic curvature (closest to 0) is at the furthest corner.
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

  // Eigenvalues of Weingarten matrix S = [[GL - FM, GM - FN], [-FL + EM, -FM + EN]] / W^2
  const a11 = (G * L - F * M) / (W * W);
  const a12 = (G * M - F * N) / (W * W);
  const a21 = (-F * L + E * M) / (W * W);
  const a22 = (-F * M + E * N) / (W * W);

  const trace = a11 + a22;
  const det = a11 * a22 - a12 * a21; // = K < 0
  const disc = Math.sqrt(Math.max(0, trace * trace - 4 * det));

  const k1 = 0.5 * (trace + disc); // > 0 (bends up)
  const k2 = 0.5 * (trace - disc); // < 0 (bends down)

  // Tangent vector directions in (du, dv)
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
  steps = 80,
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
 * Solves the boundary value problem for a geodesic connecting p1 to p2 on the saddle surface
 * via Newton shooting.
 */
export function saddleGeodesicBetween(
  p1: Point2D,
  p2: Point2D,
  steps = 80,
  c = DEFAULT_SADDLE_C
): { u: number; v: number; du: number; dv: number }[] {
  let du = p2.x - p1.x;
  let dv = p2.y - p1.y;

  for (let iter = 0; iter < 12; iter++) {
    const path = saddleGeodesicRK4(p1.x, p1.y, du, dv, steps, c);
    const end = path[path.length - 1];
    const errU = end.u - p2.x;
    const errV = end.v - p2.y;

    if (Math.hypot(errU, errV) < 1e-9) {
      return path;
    }

    const eps = 1e-6;
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

  return saddleGeodesicRK4(p1.x, p1.y, du, dv, steps, c);
}

/**
 * Discretized 3D points along the geodesic connecting p1 to p2 on the saddle.
 */
export function saddleGeodesicPoints3D(
  p1: Point2D,
  p2: Point2D,
  steps = 80,
  c = DEFAULT_SADDLE_C
): Point3D[] {
  const path = saddleGeodesicBetween(p1, p2, steps, c);
  return path.map((pt) => saddlePosition(pt.u, pt.v, c));
}

/**
 * Green's theorem potential g(r) for integrating K dA on the saddle surface:
 * dA = sqrt(1 + 4*c^2*r^2) du dv
 * K dA = -4*c^2 / (1 + 4*c^2*r^2)^(3/2) du dv
 * Integral of K dA over triangle T = oint_{dT} g(r) * (u dv - v du)
 * where g(r) = (1 - sqrt(1 + 4*c^2*r^2)) / (r^2 * sqrt(1 + 4*c^2*r^2))
 */
function greensPotential(u: number, v: number, c: number): number {
  const r2 = u * u + v * v;
  if (r2 < 1e-12) return -2 * c * c;
  const sqrtTerm = Math.sqrt(1 + 4 * c * c * r2);
  return (1 - sqrtTerm) / (r2 * sqrtTerm);
}

/**
 * Line integral of g(r)*(u dv - v du) along a discretized geodesic path.
 */
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

/**
 * Computes geodesic arc length in 3D along a discretized path.
 */
function pathArcLength(pts: Point3D[]): number {
  let len = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    len += Math.hypot(
      pts[i + 1].x - pts[i].x,
      pts[i + 1].y - pts[i].y,
      pts[i + 1].z - pts[i].z
    );
  }
  return len;
}

/**
 * Angle in radians between two 3D vectors.
 */
function vectorAngle3D(v1: Point3D, v2: Point3D): number {
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  return Math.acos(clamp(dot, -1, 1));
}

/**
 * Computes triangle measurements on the 3D saddle surface:
 * - Solves 3 boundary geodesics
 * - Measures true 3D Riemannian interior angles between tangent vectors
 * - Computes angle sum < 180° and defect = pi - sum
 * - Computes surface integral of Gaussian curvature via Green's theorem
 * - Cross-validates Gauss-Bonnet theorem: defect = -integral(K dA)
 */
export function saddleTriangle(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  c = DEFAULT_SADDLE_C
): SaddleTriangleMeasurements {
  const d12 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const d23 = Math.hypot(p3.x - p2.x, p3.y - p2.y);
  const d31 = Math.hypot(p1.x - p3.x, p1.y - p3.y);

  // Check degenerate: coincident vertices
  if (d12 < 1e-6 || d23 < 1e-6 || d31 < 1e-6) {
    const v3D = [saddlePosition(p1.x, p1.y, c), saddlePosition(p2.x, p2.y, c), saddlePosition(p3.x, p3.y, c)] as [Point3D, Point3D, Point3D];
    return {
      p1, p2, p3,
      vertices3D: v3D,
      edges3D: [[v3D[0], v3D[1]], [v3D[1], v3D[2]], [v3D[2], v3D[0]]],
      sides: [0, 0, 0],
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
    const v3D = [saddlePosition(p1.x, p1.y, c), saddlePosition(p2.x, p2.y, c), saddlePosition(p3.x, p3.y, c)] as [Point3D, Point3D, Point3D];
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

  // Ensure counter-clockwise orientation for positive boundary line integral
  let a = p1, b = p2, d = p3;
  let swapped = false;
  if (cross < 0) {
    b = p3;
    d = p2;
    swapped = true;
  }

  const gAB = saddleGeodesicBetween(a, b, 60, c);
  const gBD = saddleGeodesicBetween(b, d, 60, c);
  const gDA = saddleGeodesicBetween(d, a, 60, c);

  const edgeAB3D = gAB.map((pt) => saddlePosition(pt.u, pt.v, c));
  const edgeBD3D = gBD.map((pt) => saddlePosition(pt.u, pt.v, c));
  const edgeDA3D = gDA.map((pt) => saddlePosition(pt.u, pt.v, c));

  // Tangents at vertex A
  const tA_B = saddleTangent3D(a, gAB[0].du, gAB[0].dv, c);
  const endDA = gDA[gDA.length - 1];
  const tA_D = saddleTangent3D(a, -endDA.du, -endDA.dv, c);
  const angleA = vectorAngle3D(tA_B, tA_D);

  // Tangents at vertex B
  const tB_D = saddleTangent3D(b, gBD[0].du, gBD[0].dv, c);
  const endAB = gAB[gAB.length - 1];
  const tB_A = saddleTangent3D(b, -endAB.du, -endAB.dv, c);
  const angleB = vectorAngle3D(tB_D, tB_A);

  // Tangents at vertex D
  const tD_A = saddleTangent3D(d, gDA[0].du, gDA[0].dv, c);
  const endBD = gBD[gBD.length - 1];
  const tD_B = saddleTangent3D(d, -endBD.du, -endBD.dv, c);
  const angleD = vectorAngle3D(tD_A, tD_B);

  // Map back to original vertex order (p1, p2, p3)
  const alpha = angleA;
  const beta = swapped ? angleD : angleB;
  const gamma = swapped ? angleB : angleD;

  const edge12_3D = swapped ? edgeDA3D.slice().reverse() : edgeAB3D;
  const edge23_3D = swapped ? edgeBD3D.slice().reverse() : edgeBD3D;
  const edge31_3D = swapped ? edgeAB3D.slice().reverse() : edgeDA3D;

  const sideA = pathArcLength(edge23_3D); // side opposite p1
  const sideB = pathArcLength(edge31_3D); // side opposite p2
  const sideC = pathArcLength(edge12_3D); // side opposite p3

  const angleSum = alpha + beta + gamma;
  const defect = Math.PI - angleSum;

  // Surface integral of K dA via boundary line integral (counter-clockwise)
  const integralKdA = edgeLineIntegral(gAB, c) + edgeLineIntegral(gBD, c) + edgeLineIntegral(gDA, c);
  const defectFromIntegral = -integralKdA;
  const gaussBonnetDiscrepancy = Math.abs(defect - defectFromIntegral);

  const degenerate = defect <= 1e-5 || alpha <= 1e-4 || beta <= 1e-4 || gamma <= 1e-4;

  return {
    p1, p2, p3,
    vertices3D: [
      saddlePosition(p1.x, p1.y, c),
      saddlePosition(p2.x, p2.y, c),
      saddlePosition(p3.x, p3.y, c),
    ],
    edges3D: [edge12_3D, edge23_3D, edge31_3D],
    sides: [sideA, sideB, sideC],
    alpha,
    beta,
    gamma,
    angleSum,
    angleSumDeg: (angleSum * 180) / Math.PI,
    defect,
    defectDeg: (defect * 180) / Math.PI,
    integralKdA,
    defectFromIntegral,
    gaussBonnetDiscrepancy,
    degenerate,
  };
}
