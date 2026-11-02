import { describe, it, expect } from 'vitest';
import {
  euclideanDistance,
  euclideanPointToLineDistance,
  intersectEuclideanLines,
  sphericalDistance,
  intersectGreatCircles,
  DEFAULT_SPHERE_RADIUS,
  hyperbolicDistance,
  isInsidePoincareDisk,
  computeGeodesicThroughPoints,
  computeGeodesicThroughPointAndAngle,
  intersectHyperbolicGeodesics,
  angleOfParallelism,
  cross3D,
  computeCircleMetrics,
  generatePseudosphereGeometry,
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
    // Distance from P to X-axis in hyperbolic metric: d = ln((1+0.4)/(1-0.4)) = ln(1.4/0.6) = 0.8473
    const candidateUltra = computeGeodesicThroughPointAndAngle(P, 0);
    const ultraRes = intersectHyperbolicGeodesics(refLine, candidateUltra);
    // At theta = 0, this line is ultraparallel (no intersection)
    expect(ultraRes.type).toBe('divergent');

    // Angle of parallelism Pi(d) = 2 * atan(exp(-d))
    const d = hyperbolicDistance({ x: 0, y: 0 }, P);
    const piAngle = angleOfParallelism(d);
    // The angle with respect to perpendicular (Y-axis, angle pi/2)
    // Limiting parallel angles are pi/2 - piAngle and pi/2 + piAngle
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
