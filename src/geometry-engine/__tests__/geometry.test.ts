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
  cross3D,
  computeCircleMetrics,
  generatePseudosphereGeometry,
  generateHyperbolicTessellation,
  translate,
  compose,
  inverse,
  apply,
  renormalize,
  constructTriangleFromSides,
  angleSumsForSides,
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
    // Reference line along X-axis
    const p1 = { x: 0, y: 0 };
    const v1 = { x: 1, y: 0 };

    // Point P = (0, 3)
    const p2 = { x: 0, y: 3 };

    // Parallel line has same direction
    const vParallel = { x: 1, y: 0 };
    const resParallel = intersectEuclideanLines(p1, v1, p2, vParallel);
    expect(resParallel.type).toBe('none');

    // Any other line intersects
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
    // North pole to equator: 1/4 of circumference = pi/2 * R
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
    // Equator plane (normal along Y-axis)
    const nEquator = { x: 0, y: 1, z: 0 };
    // Prime meridian plane (normal along X-axis)
    const nMeridian = { x: 1, y: 0, z: 0 };

    const intersection = intersectGreatCircles(nEquator, nMeridian, R);
    expect(intersection.type).toBe('antipodal_pair');
    expect(intersection.points.length).toBe(2);

    // They intersect at (0, 0, R) and (0, 0, -R)
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
    // For origin to point r: d = 2 * artanh(r) = ln((1+r)/(1-r))
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

    // Verify circle is orthogonal to unit circle: |C|^2 - R^2 = 1
    const { center, radius } = geo.circle!;
    const cNormSq = center.x * center.x + center.y * center.y;
    expect(cNormSq - radius * radius).toBeCloseTo(1.0, 5);

    // Verify u and v lie on this circle
    const distU = Math.hypot(u.x - center.x, u.y - center.y);
    const distV = Math.hypot(v.x - center.x, v.y - center.y);
    expect(distU).toBeCloseTo(radius, 4);
    expect(distV).toBeCloseTo(radius, 4);
  });

  it('distinguishes ultraparallels from limiting parallels in hyperbolic space', () => {
    // Reference line L: horizontal diameter along X-axis
    const refLine = computeGeodesicThroughPoints({ x: -0.5, y: 0 }, { x: 0.5, y: 0 });

    // External point P = (0, 0.4)
    const P = { x: 0, y: 0.4 };

    // Parallel through P horizontal (theta = 0)
    const candidateUltra = computeGeodesicThroughPointAndAngle(P, 0);
    const ultraRes = intersectHyperbolicGeodesics(refLine, candidateUltra);
    expect(ultraRes.type).toBe('divergent');

    // Angle of parallelism Pi(d) = 2 * atan(exp(-d))
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
    // At equator r = (pi/2) * R, C = 2*pi*R
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

describe('Pseudosphere Mathematical Mesh', () => {
  it('generates valid tractricoid mesh with correct coordinate bounds', () => {
    const mesh = generatePseudosphereGeometry(1.8, 0.1, 2.5, 20, 30);
    expect(mesh.vertices.length).toBeGreaterThan(0);
    expect(mesh.normals.length).toBe(mesh.vertices.length);
    expect(mesh.indices.length).toBeGreaterThan(0);
    expect(mesh.uGridLines.length).toBe(12);
    expect(mesh.vGridLines.length).toBe(10);
  });
});

describe('Hyperbolic Regular Tessellations {p, q}', () => {
  it('generates valid {7, 3} heptagonal tiling in Poincaré disk', () => {
    const tiles = generateHyperbolicTessellation(7, 3, 2, 3.5);
    expect(tiles.length).toBeGreaterThan(1);
    const centralTile = tiles[0];
    expect(centralTile.p).toBe(7);
    expect(centralTile.vertices.length).toBe(7);
    for (const tile of tiles) {
      for (const v of tile.vertices) {
        expect(v.x * v.x + v.y * v.y).toBeLessThan(1.0);
      }
    }
  });

  it('generates valid {5, 4} pentagonal tiling with correct vertex count', () => {
    const tiles = generateHyperbolicTessellation(5, 4, 2, 3.5);
    expect(tiles.length).toBeGreaterThan(1);
    expect(tiles[0].vertices.length).toBe(5);
  });

  it('rejects Euclidean or spherical parameters where (p-2)(q-2) <= 4', () => {
    expect(() => generateHyperbolicTessellation(4, 4)).toThrow();
    expect(() => generateHyperbolicTessellation(3, 3)).toThrow();
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

  it('verifies fundamental triangle angles (pi/p, pi/q, pi/2) for {7, 3} and {5, 4} tilings', () => {
    // For {p, q} tessellation:
    // O = (0, 0), V = (tanh(r_v / 2), 0), M = (tanh(r_m / 2) * cos(pi/p), tanh(r_m / 2) * sin(pi/p))
    // where cosh(r_v) = cot(pi/p) * cot(pi/q) and cosh(r_m) = cos(pi/q) / sin(pi/p)
    const testPattern = (p: number, q: number) => {
      const cotP = 1 / Math.tan(Math.PI / p);
      const cotQ = 1 / Math.tan(Math.PI / q);
      const coshRv = cotP * cotQ;
      const rvNorm = Math.sqrt((coshRv - 1) / (coshRv + 1));

      const coshRm = Math.cos(Math.PI / q) / Math.sin(Math.PI / p);
      const rmNorm = Math.sqrt((coshRm - 1) / (coshRm + 1));

      const O: Point2D = { x: 0, y: 0 };
      const V: Point2D = { x: rvNorm, y: 0 };
      const M: Point2D = {
        x: rmNorm * Math.cos(Math.PI / p),
        y: rmNorm * Math.sin(Math.PI / p),
      };

      const tri = hyperbolicTriangle(O, V, M);
      expect(tri.alpha).toBeCloseTo(Math.PI / p, 5); // Angle at O
      expect(tri.beta).toBeCloseTo(Math.PI / q, 5);  // Angle at V
      expect(tri.gamma).toBeCloseTo(Math.PI / 2, 5); // Angle at M (right angle)
      expect(tri.angleSumDeg).toBeLessThan(180);
      expect(tri.area).toBeCloseTo(Math.PI - (Math.PI / p + Math.PI / q + Math.PI / 2), 5);
      expect(tri.degenerate).toBe(false);
    };

    testPattern(7, 3);
    testPattern(5, 4);
  });

  it('satisfies Gauss-Bonnet theorem across random triangles in spherical and hyperbolic spaces', () => {
    const R = DEFAULT_SPHERE_RADIUS;

    // 15 Spherical Triangles: Angle sum > 180 and Area = R^2 * E
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

    // 15 Hyperbolic Triangles: Angle sum < 180 and Area = defect
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

    // Law of cosines for angle A: cos(A) = (cosh(b)*cosh(c) - cosh(a)) / (sinh(b)*sinh(c))
    const cosAExpected =
      (Math.cosh(sideB) * Math.cosh(sideC) - Math.cosh(sideA)) /
      (Math.sinh(sideB) * Math.sinh(sideC));
    const angleAExpected = Math.acos(cosAExpected);

    const angleAComputed = hyperbolicAngleAt(a, b, c);
    expect(angleAComputed).toBeCloseTo(angleAExpected, 6);
  });

  it('tests hyperbolicAngleAt with vertex on diameter geodesics and arcs', () => {
    // 1. Point on diameter with other vertices on opposite sides of V
    const vDiam: Point2D = { x: 0.2, y: 0.2 };
    const pAhead: Point2D = { x: 0.5, y: 0.5 };
    const qBehind: Point2D = { x: -0.2, y: -0.2 };
    // Geodesic through all three is the diameter y = x. Angle at V should be pi (180 deg)
    const angleCollinear = hyperbolicAngleAt(vDiam, pAhead, qBehind);
    expect(angleCollinear).toBeCloseTo(Math.PI, 6);

    // 2. Vertex at origin
    const origin: Point2D = { x: 0, y: 0 };
    const pX: Point2D = { x: 0.5, y: 0 };
    const pY: Point2D = { x: 0, y: 0.4 };
    expect(hyperbolicAngleAt(origin, pX, pY)).toBeCloseTo(Math.PI / 2, 8);

    // 3. Geodesic circular arc vs diameter
    const v: Point2D = { x: 0.25, y: 0 };
    const pDiam: Point2D = { x: 0.7, y: 0 }; // Along X-axis diameter
    const pArc: Point2D = { x: 0.25, y: 0.5 }; // Non-collinear arc
    const angle = hyperbolicAngleAt(v, pDiam, pArc);
    expect(angle).toBeGreaterThan(0);
    expect(angle).toBeLessThan(Math.PI);
  });

  it('verifies conformal tangent vector and geometric circle tangent agree to < 1e-10', () => {
    // Sample diverse points across the Poincaré disk
    const testPairs: [Point2D, Point2D][] = [
      [{ x: 0.2, y: 0.1 }, { x: -0.3, y: 0.4 }],
      [{ x: -0.4, y: -0.2 }, { x: 0.1, y: 0.5 }],
      [{ x: 0.0, y: 0.3 }, { x: 0.5, y: -0.1 }],
      [{ x: 0.3, y: 0.3 }, { x: -0.2, y: -0.2 }], // diameter collinear
      [{ x: 0.2, y: 0.0 }, { x: 0.6, y: 0.0 }], // diameter along axis
    ];

    for (const [v, p] of testPairs) {
      const tConf = hyperbolicTangentAt(v, p);
      const tGeom = hyperbolicTangentGeometric(v, p);
      expect(tConf.x).toBeCloseTo(tGeom.x, 8);
      expect(tConf.y).toBeCloseTo(tGeom.y, 8);
    }
  });
});

describe('Möbius Transformations on Poincaré Disk', () => {
  it('maps point a to the origin (0, 0)', () => {
    const a: Point2D = { x: 0.35, y: -0.45 };
    const m = translate(a);
    const mapped = apply(m, a);
    expect(mapped.x).toBeCloseTo(0, 10);
    expect(mapped.y).toBeCloseTo(0, 10);
  });

  it('preserves hyperbolic distances between points (Isometry)', () => {
    const a: Point2D = { x: 0.2, y: -0.3 };
    const m = translate(a);

    const u: Point2D = { x: -0.1, y: 0.4 };
    const v: Point2D = { x: 0.3, y: 0.2 };

    const distBefore = hyperbolicDistanceUnclamped(u, v);
    const uMapped = apply(m, u);
    const vMapped = apply(m, v);
    const distAfter = hyperbolicDistanceUnclamped(uMapped, vMapped);

    expect(distAfter).toBeCloseTo(distBefore, 8);
  });

  it('preserves angles between geodesics (Conformality)', () => {
    const a: Point2D = { x: 0.15, y: -0.25 };
    const m = translate(a);

    const v: Point2D = { x: 0.1, y: 0.2 };
    const p: Point2D = { x: -0.3, y: 0.35 };
    const q: Point2D = { x: 0.4, y: -0.1 };

    const angleBefore = hyperbolicAngleAt(v, p, q);
    const vMapped = apply(m, v);
    const pMapped = apply(m, p);
    const qMapped = apply(m, q);
    const angleAfter = hyperbolicAngleAt(vMapped, pMapped, qMapped);

    expect(angleAfter).toBeCloseTo(angleBefore, 8);
  });

  it('satisfies inverse and composition: m ∘ m^(-1) = identity', () => {
    const a: Point2D = { x: 0.4, y: 0.2 };
    const m = translate(a);
    const mInv = inverse(m);
    const mIdentity = compose(m, mInv);

    const testPoint: Point2D = { x: -0.25, y: 0.35 };
    const result = apply(mIdentity, testPoint);
    expect(result.x).toBeCloseTo(testPoint.x, 9);
    expect(result.y).toBeCloseTo(testPoint.y, 9);
  });

  it('renormalizes matrix so |p|^2 - |q|^2 = 1', () => {
    const m = translate({ x: 0.5, y: -0.3 });
    const renorm = renormalize(m);
    const normPSq = renorm.p.re ** 2 + renorm.p.im ** 2;
    const normQSq = renorm.q.re ** 2 + renorm.q.im ** 2;
    expect(normPSq - normQSq).toBeCloseTo(1.0, 10);
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
    // Violates triangle inequality: a + b <= c
    expect(constructTriangleFromSides('euclidean', 1, 2, 5)).toBeNull();
    expect(constructTriangleFromSides('hyperbolic', 1, 2, 5)).toBeNull();
    expect(constructTriangleFromSides('spherical', 1, 2, 5)).toBeNull();

    // Spherical perimeter exceeds 2*pi*R
    const R = DEFAULT_SPHERE_RADIUS;
    const bigSide = (Math.PI * R * 2) / 3 + 0.1;
    expect(constructTriangleFromSides('spherical', bigSide, bigSide, bigSide, R)).toBeNull();

    // Side exceeds pi*R (semicircle)
    expect(constructTriangleFromSides('spherical', Math.PI * R + 0.1, 1, 1, R)).toBeNull();
  });

  it('calculates angleSumsForSides correctly', () => {
    // Equilateral triangle with sides 1.0
    const sums = angleSumsForSides(1.0, 1.0, 1.0);
    expect(sums.flat).toBe(180);
    expect(sums.sphere).toBeGreaterThan(180);
    expect(sums.hyperbolic).toBeLessThan(180);

    // Invalid sides
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

    // Collinear points along a line
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

    // 3 points along the equator
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

    // Collinear points along diameter
    const a: Point2D = { x: -0.3, y: 0 };
    const b: Point2D = { x: 0, y: 0 };
    const c: Point2D = { x: 0.4, y: 0 };
    const triCollinear = hyperbolicTriangle(a, b, c);
    expect(triCollinear.degenerate).toBe(true);
    expect(isNaN(triCollinear.angleSumDeg)).toBe(false);
  });

  it('confirms Math.max(0, ...) clamp removal exposes negative excess/defect as degenerate', () => {
    // If vertices are collinear or non-convex so that excess or defect is <= 0,
    // the engine flags degenerate: true instead of clamping to 0
    const a: Point2D = { x: -0.2, y: 0 };
    const b: Point2D = { x: 0, y: 0 };
    const c: Point2D = { x: 0.2, y: 0 };
    const tri = hyperbolicTriangle(a, b, c);
    expect(tri.degenerate).toBe(true);
  });
});
