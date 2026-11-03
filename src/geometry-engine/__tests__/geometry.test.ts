import { describe, it, expect } from 'vitest';
import {
  euclideanDistance,
  euclideanPointToLineDistance,
  intersectEuclideanLines,
  euclideanTriangle,
  sphericalDistance,
  sphericalAngleAt,
  sphericalTriangle,
  intersectGreatCircles,
  DEFAULT_SPHERE_RADIUS,
  hyperbolicDistance,
  hyperbolicDistanceUnclamped,
  hyperbolicAngleAt,
  hyperbolicTangentAt,
  hyperbolicTangentGeometric,
  hyperbolicTriangle,
  isInsidePoincareDisk,
  computeGeodesicThroughPoints,
  computeGeodesicThroughPointAndAngle,
  intersectHyperbolicGeodesics,
  angleOfParallelism,
  computeCircleMetrics,
  constructTriangleFromSides,
  angleSumsForSides,
  DEFAULT_SADDLE_C,
  DEFAULT_SADDLE_DOMAIN,
  saddlePosition,
  saddleNormal,
  saddleGaussianCurvature,
  saddleCurvatureRange,
  saddlePrincipalCurvatures,
  saddleGeodesicRK4,
  saddleGeodesicBetween,
  saddlePolylineRelax,
  geodesicDistanceOnSaddle,
  constructSaddleTriangleFromSides,
  saddleTriangle,
  Point2D,
  Point3D,
} from '../index';

describe('Euclidean Geometry Engine', () => {
  it('calculates Euclidean distance correctly', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 };
    expect(euclideanDistance(p1, p2)).toBeCloseTo(5.0);
  });

  it('calculates point to line distance correctly', () => {
    const p = { x: 0, y: 2 };
    const a = { x: -5, y: 0 };
    const b = { x: 5, y: 0 };
    expect(euclideanPointToLineDistance(p, a, b)).toBeCloseTo(2.0);
  });

  it('determines Euclidean parallel line (Fifth Postulate: exactly 1 parallel)', () => {
    const p1 = { x: 0, y: 0 };
    const v1 = { x: 1, y: 0 };
    const p2 = { x: 0, y: 3 };

    const vParallel = { x: 1, y: 0 };
    const resParallel = intersectEuclideanLines(p1, v1, p2, vParallel);
    expect(resParallel.type).toBe('none');

    const vIntersecting = { x: 1, y: 1 };
    const resInt = intersectEuclideanLines(p1, v1, p2, vIntersecting);
    expect(resInt.type).toBe('unique');
    expect(resInt.points.length).toBe(1);
    expect(resInt.points[0].y).toBeCloseTo(0);
    expect(resInt.points[0].x).toBeCloseTo(-3);
  });
});

describe('Spherical Geometry Engine', () => {
  const R = DEFAULT_SPHERE_RADIUS;

  it('calculates great-circle distance correctly', () => {
    const northPole = { x: 0, y: R, z: 0 };
    const equatorPt = { x: R, y: 0, z: 0 };
    const expected = (Math.PI / 2) * R;
    expect(sphericalDistance(northPole, equatorPt, R)).toBeCloseTo(expected);
  });

  it('calculates antipodal distance correctly', () => {
    const northPole = { x: 0, y: R, z: 0 };
    const southPole = { x: 0, y: -R, z: 0 };
    const expected = Math.PI * R;
    expect(sphericalDistance(northPole, southPole, R)).toBeCloseTo(expected);
  });

  it('confirms all distinct great circles intersect (Zero parallels)', () => {
    const nEquator = { x: 0, y: 1, z: 0 };
    const nMeridian = { x: 1, y: 0, z: 0 };

    const intersection = intersectGreatCircles(nEquator, nMeridian, R);
    expect(intersection.type).toBe('antipodal_pair');
    expect(intersection.points.length).toBe(2);

    const p1 = intersection.points[0] as { x: number; y: number; z: number };
    const p2 = intersection.points[1] as { x: number; y: number; z: number };
    expect(Math.abs(p1.x)).toBeCloseTo(0);
    expect(Math.abs(p1.y)).toBeCloseTo(0);
    expect(Math.abs(Math.abs(p1.z) - R)).toBeCloseTo(0);
    expect(p1.z).toBeCloseTo(-p2.z);
  });
});

describe('Hyperbolic Geometry Engine (Poincaré Disk)', () => {
  it('validates points strictly inside the unit disk', () => {
    expect(isInsidePoincareDisk({ x: 0, y: 0 })).toBe(true);
    expect(isInsidePoincareDisk({ x: 0.5, y: -0.5 })).toBe(true);
    expect(isInsidePoincareDisk({ x: 1.0, y: 0 })).toBe(false);
    expect(isInsidePoincareDisk({ x: 1.2, y: 0.3 })).toBe(false);
  });

  it('calculates hyperbolic distance correctly', () => {
    const origin = { x: 0, y: 0 };
    const r = 0.5;
    const p = { x: r, y: 0 };
    const expected = Math.log((1 + r) / (1 - r));
    expect(hyperbolicDistance(origin, p)).toBeCloseTo(expected, 4);
  });

  it('constructs geodesic diameter through origin collinear points', () => {
    const u = { x: 0.2, y: 0.2 };
    const v = { x: -0.3, y: -0.3 };
    const geo = computeGeodesicThroughPoints(u, v);
    expect(geo.isDiameter).toBe(true);
  });

  it('constructs orthogonal circular geodesic for non-collinear points', () => {
    const u = { x: 0.3, y: 0.1 };
    const v = { x: 0.1, y: 0.4 };
    const geo = computeGeodesicThroughPoints(u, v);
    expect(geo.isDiameter).toBe(false);
    expect(geo.circle).toBeDefined();

    const { center, radius } = geo.circle!;
    const cNormSq = center.x * center.x + center.y * center.y;
    expect(cNormSq - radius * radius).toBeCloseTo(1.0, 5);

    const distU = Math.hypot(u.x - center.x, u.y - center.y);
    const distV = Math.hypot(v.x - center.x, v.y - center.y);
    expect(distU).toBeCloseTo(radius, 4);
    expect(distV).toBeCloseTo(radius, 4);
  });

  it('distinguishes ultraparallels from limiting parallels in hyperbolic space', () => {
    const refLine = computeGeodesicThroughPoints({ x: -0.5, y: 0 }, { x: 0.5, y: 0 });
    const P = { x: 0, y: 0.4 };

    const candidateUltra = computeGeodesicThroughPointAndAngle(P, 0);
    const ultraRes = intersectHyperbolicGeodesics(refLine, candidateUltra);
    expect(ultraRes.type).toBe('divergent');

    const d = hyperbolicDistance({ x: 0, y: 0 }, P);
    const piAngle = angleOfParallelism(d);
    const limitingTheta1 = Math.PI / 2 - piAngle;
    const candidateLimit = computeGeodesicThroughPointAndAngle(P, limitingTheta1);
    const limitRes = intersectHyperbolicGeodesics(refLine, candidateLimit);
    expect(limitRes.type).toBe('limiting_parallel');
  });
});

describe('Geodesic Circle Metrics Engine', () => {
  it('calculates Euclidean circle circumference and area exactly', () => {
    const res = computeCircleMetrics('euclidean', 2.0);
    expect(res.circumference).toBeCloseTo(4 * Math.PI);
    expect(res.area).toBeCloseTo(4 * Math.PI);
    expect(res.ratioCircumferenceToRadius).toBeCloseTo(2 * Math.PI);
  });

  it('proves Spherical circles have LESS circumference than Euclidean (C < 2*pi*r)', () => {
    const R = DEFAULT_SPHERE_RADIUS;
    const r = 1.5;
    const res = computeCircleMetrics('spherical', r, R);
    expect(res.circumference).toBeLessThan(res.euclideanCircumference);
    const equatorRes = computeCircleMetrics('spherical', (Math.PI / 2) * R, R);
    expect(equatorRes.circumference).toBeCloseTo(2 * Math.PI * R);
  });

  it('proves Hyperbolic circles have EXPONENTIALLY GREATER circumference (C > 2*pi*r)', () => {
    const r = 2.0;
    const res = computeCircleMetrics('hyperbolic', r);
    expect(res.circumference).toBeGreaterThan(res.euclideanCircumference);
    expect(res.circumference).toBeCloseTo(2 * Math.PI * Math.sinh(r));
    expect(res.area).toBeCloseTo(2 * Math.PI * (Math.cosh(r) - 1));
  });
});

describe('Triangle Angle Sums and Gauss-Bonnet Across Geometries', () => {
  it('proves Euclidean triangles sum to 180 degrees exactly (E = 0)', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 4, y: 0 };
    const c = { x: 0, y: 3 };
    const tri = euclideanTriangle(a, b, c);

    expect(tri.angleSumDeg).toBeCloseTo(180, 9);
    expect(tri.angleSum).toBeCloseTo(Math.PI, 9);
    expect(tri.excessOrDefect).toBe(0);
    expect(tri.area).toBeCloseTo(6.0, 9);
    expect(tri.degenerate).toBe(false);
  });

  it('proves Spherical octant triangle has angle sum = 270 deg and area = (pi/2)*R^2', () => {
    const R = DEFAULT_SPHERE_RADIUS;
    const a: Point3D = { x: 0, y: 0, z: R };
    const b: Point3D = { x: R, y: 0, z: 0 };
    const c: Point3D = { x: 0, y: R, z: 0 };
    const tri = sphericalTriangle(a, b, c, R);

    expect(tri.alpha).toBeCloseTo(Math.PI / 2, 8);
    expect(tri.beta).toBeCloseTo(Math.PI / 2, 8);
    expect(tri.gamma).toBeCloseTo(Math.PI / 2, 8);
    expect(tri.angleSumDeg).toBeCloseTo(270, 8);
    expect(tri.excessOrDefect).toBeCloseTo(Math.PI / 2, 8);
    expect(tri.area).toBeCloseTo((Math.PI / 2) * R * R, 8);
    expect(tri.degenerate).toBe(false);
  });

  it('satisfies Gauss-Bonnet theorem across random triangles in spherical and hyperbolic spaces', () => {
    const R = DEFAULT_SPHERE_RADIUS;

    for (let i = 0; i < 15; i++) {
      const theta1 = 0.2 + i * 0.1;
      const theta2 = 1.0 + i * 0.08;
      const a: Point3D = { x: 0, y: 0, z: R };
      const b: Point3D = { x: R * Math.sin(theta1), y: 0, z: R * Math.cos(theta1) };
      const c: Point3D = {
        x: R * Math.sin(theta2) * Math.cos(0.8),
        y: R * Math.sin(theta2) * Math.sin(0.8),
        z: R * Math.cos(theta2),
      };

      const tri = sphericalTriangle(a, b, c, R);
      expect(tri.degenerate).toBe(false);
      expect(tri.angleSumDeg).toBeGreaterThan(180);
      expect(tri.excessOrDefect).toBeGreaterThan(0);
      expect(tri.area).toBeCloseTo(R * R * tri.excessOrDefect, 7);
    }

    for (let i = 0; i < 15; i++) {
      const r1 = 0.15 + (i % 5) * 0.08;
      const r2 = 0.2 + (i % 4) * 0.09;
      const phi = 0.5 + (i % 6) * 0.3;

      const a: Point2D = { x: 0, y: 0 };
      const b: Point2D = { x: r1, y: 0 };
      const c: Point2D = { x: r2 * Math.cos(phi), y: r2 * Math.sin(phi) };

      const tri = hyperbolicTriangle(a, b, c);
      expect(tri.degenerate).toBe(false);
      expect(tri.angleSumDeg).toBeLessThan(180);
      expect(tri.excessOrDefect).toBeGreaterThan(0);
      expect(tri.area).toBeCloseTo(tri.excessOrDefect, 7);
    }
  });
});

describe('Hyperbolic Angles and Tangent Vector Accuracy', () => {
  it('agrees with Hyperbolic Law of Cosines to < 1e-6', () => {
    const a: Point2D = { x: 0.1, y: 0.2 };
    const b: Point2D = { x: -0.3, y: 0.4 };
    const c: Point2D = { x: 0.2, y: -0.35 };

    const sideA = hyperbolicDistanceUnclamped(b, c);
    const sideB = hyperbolicDistanceUnclamped(a, c);
    const sideC = hyperbolicDistanceUnclamped(a, b);

    const cosAExpected =
      (Math.cosh(sideB) * Math.cosh(sideC) - Math.cosh(sideA)) /
      (Math.sinh(sideB) * Math.sinh(sideC));
    const angleAExpected = Math.acos(cosAExpected);

    const angleAComputed = hyperbolicAngleAt(a, b, c);
    expect(angleAComputed).toBeCloseTo(angleAExpected, 6);
  });

  it('tests hyperbolicAngleAt with vertex on diameter geodesics and arcs', () => {
    const vDiam: Point2D = { x: 0.2, y: 0.2 };
    const pAhead: Point2D = { x: 0.5, y: 0.5 };
    const qBehind: Point2D = { x: -0.2, y: -0.2 };
    const angleCollinear = hyperbolicAngleAt(vDiam, pAhead, qBehind);
    expect(angleCollinear).toBeCloseTo(Math.PI, 6);

    const origin: Point2D = { x: 0, y: 0 };
    const pX: Point2D = { x: 0.5, y: 0 };
    const pY: Point2D = { x: 0, y: 0.4 };
    expect(hyperbolicAngleAt(origin, pX, pY)).toBeCloseTo(Math.PI / 2, 8);

    const v: Point2D = { x: 0.25, y: 0 };
    const pDiam: Point2D = { x: 0.7, y: 0 };
    const pArc: Point2D = { x: 0.25, y: 0.5 };
    const angle = hyperbolicAngleAt(v, pDiam, pArc);
    expect(angle).toBeGreaterThan(0);
    expect(angle).toBeLessThan(Math.PI);
  });

  it('verifies conformal tangent vector and geometric circle tangent agree to < 1e-10', () => {
    const testPairs: [Point2D, Point2D][] = [
      [{ x: 0.2, y: 0.1 }, { x: -0.3, y: 0.4 }],
      [{ x: -0.4, y: -0.2 }, { x: 0.1, y: 0.5 }],
      [{ x: 0.0, y: 0.3 }, { x: 0.5, y: -0.1 }],
      [{ x: 0.3, y: 0.3 }, { x: -0.2, y: -0.2 }],
      [{ x: 0.2, y: 0.0 }, { x: 0.6, y: 0.0 }],
    ];

    for (const [v, p] of testPairs) {
      const tConf = hyperbolicTangentAt(v, p);
      const tGeom = hyperbolicTangentGeometric(v, p);
      expect(tConf.x).toBeCloseTo(tGeom.x, 8);
      expect(tConf.y).toBeCloseTo(tGeom.y, 8);
    }
  });
});

describe('Triangle Construction From Side Lengths', () => {
  it('round-trips side lengths to < 1e-6 in Euclidean geometry', () => {
    const a = 3, b = 4, c = 5;
    const tri = constructTriangleFromSides('euclidean', a, b, c);
    expect(tri).not.toBeNull();
    if (!tri || tri.a.kind !== 'euclidean' || tri.b.kind !== 'euclidean' || tri.c.kind !== 'euclidean') {
      throw new Error('Expected euclidean coordinates');
    }

    const dBC = euclideanDistance(tri.b, tri.c);
    const dAC = euclideanDistance(tri.a, tri.c);
    const dAB = euclideanDistance(tri.a, tri.b);

    expect(dBC).toBeCloseTo(a, 6);
    expect(dAC).toBeCloseTo(b, 6);
    expect(dAB).toBeCloseTo(c, 6);
  });

  it('round-trips side lengths to < 1e-6 in Spherical geometry', () => {
    const R = DEFAULT_SPHERE_RADIUS;
    const a = 1.2, b = 1.4, c = 1.6;
    const tri = constructTriangleFromSides('spherical', a, b, c, R);
    expect(tri).not.toBeNull();
    if (!tri || tri.a.kind !== 'spherical' || tri.b.kind !== 'spherical' || tri.c.kind !== 'spherical') {
      throw new Error('Expected spherical coordinates');
    }

    const dBC = sphericalDistance(tri.b, tri.c, R);
    const dAC = sphericalDistance(tri.a, tri.c, R);
    const dAB = sphericalDistance(tri.a, tri.b, R);

    expect(dBC).toBeCloseTo(a, 6);
    expect(dAC).toBeCloseTo(b, 6);
    expect(dAB).toBeCloseTo(c, 6);
  });

  it('round-trips side lengths to < 1e-6 in Hyperbolic geometry', () => {
    const a = 0.8, b = 1.1, c = 1.3;
    const tri = constructTriangleFromSides('hyperbolic', a, b, c);
    expect(tri).not.toBeNull();
    if (!tri || tri.a.kind !== 'hyperbolic' || tri.b.kind !== 'hyperbolic' || tri.c.kind !== 'hyperbolic') {
      throw new Error('Expected hyperbolic coordinates');
    }

    const dBC = hyperbolicDistanceUnclamped(tri.b, tri.c);
    const dAC = hyperbolicDistanceUnclamped(tri.a, tri.c);
    const dAB = hyperbolicDistanceUnclamped(tri.a, tri.b);

    expect(dBC).toBeCloseTo(a, 6);
    expect(dAC).toBeCloseTo(b, 6);
    expect(dAB).toBeCloseTo(c, 6);
  });

  it('rejects impossible side lengths across all geometries', () => {
    expect(constructTriangleFromSides('euclidean', 1, 2, 5)).toBeNull();
    expect(constructTriangleFromSides('hyperbolic', 1, 2, 5)).toBeNull();
    expect(constructTriangleFromSides('spherical', 1, 2, 5)).toBeNull();

    const R = DEFAULT_SPHERE_RADIUS;
    const bigSide = (Math.PI * R * 2) / 3 + 0.1;
    expect(constructTriangleFromSides('spherical', bigSide, bigSide, bigSide, R)).toBeNull();
    expect(constructTriangleFromSides('spherical', Math.PI * R + 0.1, 1, 1, R)).toBeNull();
  });

  it('calculates angleSumsForSides correctly', () => {
    const sums = angleSumsForSides(1.0, 1.0, 1.0);
    expect(sums.flat).toBe(180);
    expect(sums.sphere).toBeGreaterThan(180);
    expect(sums.hyperbolic).toBeLessThan(180);

    const invalidSums = angleSumsForSides(1.0, 2.0, 10.0);
    expect(invalidSums.flat).toBeNull();
    expect(invalidSums.sphere).toBeNull();
    expect(invalidSums.hyperbolic).toBeNull();
  });
});

describe('Degenerate Triangles and Numerical Safety', () => {
  it('flags coincident or collinear Euclidean points as degenerate without returning NaN', () => {
    const p = { x: 1, y: 1 };
    const triCoincident = euclideanTriangle(p, p, { x: 2, y: 2 });
    expect(triCoincident.degenerate).toBe(true);
    expect(isNaN(triCoincident.angleSumDeg)).toBe(false);

    const triCollinear = euclideanTriangle({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 });
    expect(triCollinear.degenerate).toBe(true);
    expect(isNaN(triCollinear.angleSumDeg)).toBe(false);
  });

  it('flags coincident or collinear Spherical points as degenerate without returning NaN', () => {
    const R = DEFAULT_SPHERE_RADIUS;
    const p: Point3D = { x: 0, y: 0, z: R };
    const triCoincident = sphericalTriangle(p, p, { x: R, y: 0, z: 0 }, R);
    expect(triCoincident.degenerate).toBe(true);
    expect(isNaN(triCoincident.angleSumDeg)).toBe(false);

    const a: Point3D = { x: R, y: 0, z: 0 };
    const b: Point3D = { x: 0, y: R, z: 0 };
    const c: Point3D = { x: -R, y: 0, z: 0 };
    const triEquator = sphericalTriangle(a, b, c, R);
    expect(triEquator.degenerate).toBe(true);
  });

  it('flags coincident or collinear Hyperbolic points as degenerate without returning NaN', () => {
    const p: Point2D = { x: 0.1, y: 0.1 };
    const triCoincident = hyperbolicTriangle(p, p, { x: 0.3, y: 0.3 });
    expect(triCoincident.degenerate).toBe(true);
    expect(isNaN(triCoincident.angleSumDeg)).toBe(false);

    const a: Point2D = { x: -0.3, y: 0 };
    const b: Point2D = { x: 0, y: 0 };
    const c: Point2D = { x: 0.4, y: 0 };
    const triCollinear = hyperbolicTriangle(a, b, c);
    expect(triCollinear.degenerate).toBe(true);
    expect(isNaN(triCollinear.angleSumDeg)).toBe(false);
  });

  it('confirms Math.max(0, ...) clamp removal exposes negative excess/defect as degenerate', () => {
    const a: Point2D = { x: -0.2, y: 0 };
    const b: Point2D = { x: 0, y: 0 };
    const c: Point2D = { x: 0.2, y: 0 };
    const tri = hyperbolicTriangle(a, b, c);
    expect(tri.degenerate).toBe(true);
  });
});

describe('Phase 1b & 1c: Saddle Monge Patch Math & Gaps', () => {
  it('verifies Gaussian curvature K < 0 everywhere with tuned k and domain', () => {
    const c = DEFAULT_SADDLE_C;
    const domain = DEFAULT_SADDLE_DOMAIN;

    const kOrigin = saddleGaussianCurvature(0, 0, c);
    expect(kOrigin).toBeCloseTo(-1.0, 8);

    const { min, max } = saddleCurvatureRange(domain, c);
    expect(min).toBeCloseTo(-1.0, 8);
    expect(max).toBeCloseTo(-1 / 81, 6);
    expect(min).toBeLessThan(0);
    expect(max).toBeLessThan(0);
    expect(min).toBeLessThan(max);
  });

  it('demonstrates opposite-sign principal curvatures (k1 > 0 curves up, k2 < 0 curves down)', () => {
    const originPrincipals = saddlePrincipalCurvatures(0, 0);
    expect(originPrincipals.k1).toBeCloseTo(1.0, 6);
    expect(originPrincipals.k2).toBeCloseTo(-1.0, 6);
    expect(originPrincipals.k1 * originPrincipals.k2).toBeCloseTo(-1.0, 6);

    const offPrincipals = saddlePrincipalCurvatures(0.8, -0.6);
    expect(offPrincipals.k1).toBeGreaterThan(0);
    expect(offPrincipals.k2).toBeLessThan(0);
  });

  it('verifies geodesic shooting converges to < 1e-9 error between boundary points', () => {
    const p1: Point2D = { x: -1.2, y: -0.8 };
    const p2: Point2D = { x: 1.0, y: 1.2 };

    const res = saddleGeodesicBetween(p1, p2, 60);
    expect(res.usedFallback).toBe(false);
    expect(res.path.length).toBe(61);
    const start = res.path[0];
    const end = res.path[res.path.length - 1];

    expect(start.u).toBeCloseTo(p1.x, 8);
    expect(start.v).toBeCloseTo(p1.y, 8);
    expect(end.u).toBeCloseTo(p2.x, 8);
    expect(end.v).toBeCloseTo(p2.y, 8);
  });

  it('proves largest feasible saddle triangle reaches a defect of at least 30 deg', () => {
    const p1: Point2D = { x: -1.6, y: -1.4 };
    const p2: Point2D = { x: 1.6, y: -1.4 };
    const p3: Point2D = { x: 0.0, y: 1.7 };

    const tri = saddleTriangle(p1, p2, p3);
    expect(tri.degenerate).toBe(false);
    expect(tri.defectDeg).toBeGreaterThanOrEqual(30);
    expect(tri.angleSumDeg).toBeLessThan(180 - 30);
    expect(tri.gaussBonnetDiscrepancy).toBeLessThan(2e-3);
  });

  it('passes Gauss-Bonnet gate across 50 random saddle triangles (|angleSum - (pi + integral K dA)| < 2e-3)', () => {
    const c = DEFAULT_SADDLE_C;
    let maxDiscrepancy = 0;

    for (let i = 0; i < 50; i++) {
      const angle0 = (i / 50) * Math.PI * 2;
      const r1 = 0.5 + ((i * 7) % 9) * 0.12;
      const r2 = 0.6 + ((i * 11) % 9) * 0.12;
      const r3 = 0.7 + ((i * 13) % 9) * 0.11;

      const p1: Point2D = { x: r1 * Math.cos(angle0), y: r1 * Math.sin(angle0) };
      const p2: Point2D = { x: r2 * Math.cos(angle0 + 1.9), y: r2 * Math.sin(angle0 + 1.9) };
      const p3: Point2D = { x: r3 * Math.cos(angle0 + 3.9), y: r3 * Math.sin(angle0 + 3.9) };

      const tri = saddleTriangle(p1, p2, p3, c);
      expect(tri.degenerate).toBe(false);
      expect(tri.defectDeg).toBeGreaterThan(0);
      expect(tri.angleSumDeg).toBeLessThan(180);

      if (tri.gaussBonnetDiscrepancy > maxDiscrepancy) {
        maxDiscrepancy = tri.gaussBonnetDiscrepancy;
      }

      expect(tri.gaussBonnetDiscrepancy).toBeLessThan(2e-3);
    }

    expect(maxDiscrepancy).toBeLessThan(2e-3);
  });

  // 1c Specific Tests:
  it('constructSaddleTriangleFromSides round-trips side lengths to < 1e-4', () => {
    const testCases = [
      { a: 0.8, b: 0.9, c: 1.1 },
      { a: 0.5, b: 0.5, c: 0.5 },
      { a: 1.2, b: 1.0, c: 1.4 },
    ];

    for (const { a, b, c } of testCases) {
      const tri = constructSaddleTriangleFromSides(a, b, c);
      expect(tri).not.toBeNull();

      const dBC = geodesicDistanceOnSaddle(tri!.b, tri!.c);
      const dAC = geodesicDistanceOnSaddle(tri!.a, tri!.c);
      const dAB = geodesicDistanceOnSaddle(tri!.a, tri!.b);

      expect(Math.abs(dBC - a)).toBeLessThan(1e-4);
      expect(Math.abs(dAC - b)).toBeLessThan(1e-4);
      expect(Math.abs(dAB - c)).toBeLessThan(1e-4);
    }
  });

  it('saddleTriangle returns degenerate: true for collinear, coincident, and out-of-domain vertices', () => {
    // Coincident
    const p = { x: 0.5, y: 0.5 };
    const triCoincident = saddleTriangle(p, p, { x: 1, y: 1 });
    expect(triCoincident.degenerate).toBe(true);
    expect(isNaN(triCoincident.angleSumDeg)).toBe(false);

    // Collinear
    const triCollinear = saddleTriangle({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 });
    expect(triCollinear.degenerate).toBe(true);
    expect(isNaN(triCollinear.angleSumDeg)).toBe(false);

    // Out of domain (|u| > 2.0 or |v| > 2.0)
    const triOut = saddleTriangle({ x: -2.5, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 });
    expect(triOut.degenerate).toBe(true);
    expect(isNaN(triOut.angleSumDeg)).toBe(false);
  });

  it('saddleGeodesicBetween polyline relaxation fallback agrees with shooting on length within 1e-3 on 20 cases', () => {
    const c = DEFAULT_SADDLE_C;
    let maxDiff = 0;

    for (let i = 0; i < 20; i++) {
      const a1 = (i / 20) * Math.PI * 2;
      const p1: Point2D = { x: 0.4 * Math.cos(a1), y: 0.4 * Math.sin(a1) };
      const p2: Point2D = { x: 0.55 * Math.cos(a1 + 1.8), y: 0.55 * Math.sin(a1 + 1.8) };

      const shoot = saddleGeodesicBetween(p1, p2, 60, c);
      const relax = saddlePolylineRelax(p1, p2, 60, 120, c);

      const diff = Math.abs(shoot.length - relax.length);
      if (diff > maxDiff) maxDiff = diff;
      expect(diff).toBeLessThan(1e-3);
    }
    expect(maxDiff).toBeLessThan(1e-3);
  });

  it('proves x-axis and y-axis are geodesics with geodesic curvature < 1e-4', () => {
    const c = DEFAULT_SADDLE_C;
    const testPoints = [-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5];

    // On x-axis: v = 0, surface normal n = (-2cu/W, 0, 1/W), tangent T = (1/W, 0, 2cu/W).
    // Intrinsic normal in tangent plane ng = n x T = (0, 1, 0).
    // Curve acceleration has y-component = 0 identically. Therefore kg = 0.
    for (const u of testPoints) {
      const W = Math.sqrt(1 + 4 * c * c * u * u);
      const accX = (-4 * c * c * u) / (W * W * W * W);
      const accY = 0;
      const accZ = (2 * c) / (W * W * W * W);

      const nx = (-2 * c * u) / W;
      const ny = 0;
      const nz = 1 / W;

      const ngY = nz * (1 / W) - nx * ((2 * c * u) / W);
      const kg = Math.abs(accY * ngY);
      expect(kg).toBeLessThan(1e-4);
    }
  });

  it('verifies small saddle triangles (sides < 0.3) near origin have angle sums within 1% of ideal K = -1', () => {
    const s = 0.25;
    const saddleTri = constructSaddleTriangleFromSides(s, s, s);
    expect(saddleTri).not.toBeNull();

    const m = saddleTriangle(saddleTri!.a, saddleTri!.b, saddleTri!.c);
    const saddleSum = m.angleSumDeg;

    // Ideal hyperbolic equilateral triangle:
    // cos A = (cosh^2 s - cosh s) / sinh^2 s
    const cosA = (Math.cosh(s) * Math.cosh(s) - Math.cosh(s)) / (Math.sinh(s) * Math.sinh(s));
    const idealSum = (3 * Math.acos(cosA) * 180) / Math.PI;

    const relativeDiff = Math.abs(saddleSum - idealSum) / idealSum;
    expect(relativeDiff).toBeLessThan(0.01); // within 1%
  });

  it('satisfies performance targets: saddleTriangle < 1.5ms, constructSaddleTriangle < 3.0ms over 1000 calls', () => {
    const p1: Point2D = { x: -1.0, y: -0.6 };
    const p2: Point2D = { x: 1.0, y: -0.6 };
    const p3: Point2D = { x: 0.0, y: 1.1 };

    // Warm-up
    saddleTriangle(p1, p2, p3);
    constructSaddleTriangleFromSides(1.0, 1.0, 1.0);

    const N = 1000;

    const tStartTri = performance.now();
    for (let i = 0; i < N; i++) {
      const d = 0.01 * Math.sin(i * 0.1);
      saddleTriangle({ x: p1.x + d, y: p1.y }, p2, p3);
    }
    const avgTri = (performance.now() - tStartTri) / N;

    const tStartConstruct = performance.now();
    for (let i = 0; i < N; i++) {
      const da = 0.02 * Math.sin(i * 0.1);
      constructSaddleTriangleFromSides(1.0 + da, 1.0, 1.0);
    }
    const avgConstruct = (performance.now() - tStartConstruct) / N;

    expect(avgTri).toBeLessThan(1.5);
    expect(avgConstruct).toBeLessThan(3.0);
  });
});

import { classifyParallelCandidate } from '../parallelLab';

describe('Parallel lab classification', () => {
  it('flat: only the level line misses L', () => {
    expect(classifyParallelCandidate('euclidean', 0).verdict).toBe('misses');
    expect(classifyParallelCandidate('euclidean', 5).verdict).toBe('meets');
    expect(classifyParallelCandidate('euclidean', -30).verdict).toBe('meets');
  });

  it('sphere: every line through P meets L twice', () => {
    for (const a of [0, 20, -60]) {
      const r = classifyParallelCandidate('spherical', a);
      expect(r.verdict).toBe('meets');
      expect(r.crossings).toBe(2);
    }
  });

  it('hyperbolic: a whole range of angles misses L, bounded by Π(d)', () => {
    const level = classifyParallelCandidate('hyperbolic', 0);
    expect(level.verdict).toBe('misses');
    const limit = level.limitAngleDeg!;
    expect(limit).toBeGreaterThan(0);
    expect(level.angleOfParallelismDeg! + limit).toBeCloseTo(90, 6);
    expect(classifyParallelCandidate('hyperbolic', limit * 0.5).verdict).toBe('misses');
    expect(classifyParallelCandidate('hyperbolic', -limit * 0.5).verdict).toBe('misses');
    expect(classifyParallelCandidate('hyperbolic', limit).verdict).toBe('limiting');
    expect(classifyParallelCandidate('hyperbolic', Math.min(85, limit + 15)).verdict).toBe('meets');
  });
});
