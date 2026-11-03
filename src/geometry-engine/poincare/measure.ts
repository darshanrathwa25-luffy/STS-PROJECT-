// Measurements on the Poincaré disk used by the disk lab. Not part of upstream
// hyperbolic-canvas; built on the ported classes. Curvature is K = −1 throughout.
import { TAU } from './constants';
import { Angle } from './angle';
import { Point } from './point';
import { Polygon } from './polygon';
import { Line } from './line';
import { geodesicThrough } from './mobius';

/** Signed Euclidean area of the vertex polygon; > 0 when the vertices run anticlockwise. */
function orientation(vertices: Point[]): number {
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    area += a.getX() * b.getY() - b.getX() * a.getY();
  }
  return area / 2;
}

/**
 * The direction (radians) in which the hyperbolic segment from `from` to `to` leaves
 * `from`: the tangent of its geodesic circle there, or the straight direction for a
 * diameter. Used instead of upstream Point.hyperbolicAngleTo, which fails when its
 * two tangent lines come out exactly parallel.
 */
export function hyperbolicDirection(from: Point, to: Point): number {
  const a = { x: from.getX(), y: from.getY() };
  const b = { x: to.getX(), y: to.getY() };
  const g = geodesicThrough(a, b);
  const chord = { x: b.x - a.x, y: b.y - a.y };
  if (g.kind === 'diameter') return Angle.normalize(Math.atan2(chord.y, chord.x));
  let t = { x: -(a.y - g.center.y), y: a.x - g.center.x };
  // The arc inside the disk is under a semicircle, so its tangent leans towards the chord
  if (t.x * chord.x + t.y * chord.y < 0) t = { x: -t.x, y: -t.y };
  return Angle.normalize(Math.atan2(t.y, t.x));
}

/**
 * Interior angle (radians) at each vertex of a polygon with hyperbolic sides.
 * The angle is measured between the geodesics to the two neighbouring vertices,
 * on the inside of the polygon. Repeated vertices give an angle of 0.
 */
export function interiorAngles(vertices: Point[]): number[] {
  const n = vertices.length;
  const ccw = orientation(vertices) >= 0;
  return vertices.map((v, i) => {
    const prev = vertices[(i + n - 1) % n];
    const next = vertices[(i + 1) % n];
    if (v.equals(prev) || v.equals(next)) return 0;
    const toPrev = hyperbolicDirection(v, prev);
    const toNext = hyperbolicDirection(v, next);
    return ccw ? Angle.normalize(toPrev - toNext) : Angle.normalize(toNext - toPrev);
  });
}

/** True if p lies on the hyperbolic segment from a to b (within tolerance). */
function onSegment(p: Point, a: Point, b: Point): boolean {
  return Math.abs(a.hyperbolicDistanceTo(p) + p.hyperbolicDistanceTo(b) - a.hyperbolicDistanceTo(b)) < 1e-6;
}

/**
 * False if any two non-adjacent sides cross. Angles and area are only meaningful
 * for simple polygons; a "bow tie" gives nonsense.
 */
export function isSimplePolygon(vertices: Point[]): boolean {
  const n = vertices.length;
  if (n < 4) return true;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue; // adjacent sides share a corner
      const a0 = vertices[i];
      const a1 = vertices[(i + 1) % n];
      const b0 = vertices[j];
      const b1 = vertices[(j + 1) % n];
      if (a0.equals(a1) || b0.equals(b1)) continue;
      const x = Line.hyperbolicIntersect(Line.givenTwoPoints(a0, a1), Line.givenTwoPoints(b0, b1));
      if (x && onSegment(x, a0, a1) && onSegment(x, b0, b1)) return false;
    }
  }
  return true;
}

export interface PolygonMeasurements {
  angles: number[];
  angleSum: number;
  /** (n − 2)π, the angle sum of a flat polygon with the same number of sides. */
  flatAngleSum: number;
  /** flatAngleSum − angleSum. By Gauss–Bonnet with K = −1 this equals the area. */
  defect: number;
  area: number;
}

export function measurePolygon(vertices: Point[]): PolygonMeasurements {
  const angles = interiorAngles(vertices);
  const angleSum = angles.reduce((a, b) => a + b, 0);
  const flatAngleSum = (vertices.length - 2) * Math.PI;
  const defect = flatAngleSum - angleSum;
  return { angles, angleSum, flatAngleSum, defect, area: defect };
}

/**
 * Corner angle of a regular hyperbolic n-gon with circumradius R.
 * From the right triangle (centre, vertex, edge midpoint): cosh R = cot(π/n)·cot(α/2).
 * As R → 0 this tends to the flat value π − 2π/n.
 */
export function regularPolygonCornerAngle(n: number, radius: number): number {
  return 2 * Math.atan(1 / (Math.cosh(radius) * Math.tan(Math.PI / n)));
}

/** Circumradius giving corner angle `angle`, or NaN if that angle is not smaller than the flat one. */
export function regularPolygonRadiusForCornerAngle(n: number, angle: number): number {
  const c = (1 / Math.tan(Math.PI / n)) * (1 / Math.tan(angle / 2));
  return c >= 1 ? Math.acosh(c) : NaN;
}

/**
 * A regular n-gon of circumradius R with one vertex exactly at the origin and its
 * centre in direction `centerDirection`. Rotating it about the origin (a hyperbolic
 * isometry) lays copies around that shared corner.
 */
export function regularPolygonWithCornerAtOrigin(n: number, radius: number, centerDirection: number): Polygon {
  const center = Point.givenHyperbolicPolarCoordinates(radius, centerDirection);
  const towardOrigin = Angle.opposite(centerDirection);
  const vertices: Point[] = [Point.ORIGIN];
  for (let i = 1; i < n; i++) {
    vertices.push(center.hyperbolicDistantPoint(radius, towardOrigin + (TAU / n) * i));
  }
  return new Polygon({ vertices });
}

/** Rotate every vertex of a polygon about the origin. */
export function rotatePolygonAboutOrigin(polygon: Polygon, angle: number): Polygon {
  return new Polygon({ vertices: polygon.getVertices().map((v) => v.rotateAboutOrigin(angle)) });
}

/** Circumference and area of a flat circle of radius r, for comparison with the disk. */
export const flatCircleCircumference = (r: number) => TAU * r;
export const flatCircleArea = (r: number) => Math.PI * r * r;
