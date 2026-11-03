// SVG path builders for the Poincaré disk. They replace upstream hyperbolic-canvas's
// canvas.js (which drew on an HTML canvas); the geometry comes from the ported engine.
//
// Coordinates: the disk is the unit circle with y up. SVG's y runs down, so every
// point is written as (x, −y). A viewBox of about [-1, 1] then frames the disk.
import { Poincare } from '../../geometry-engine';

type Point = Poincare.Point;

const fmt = (n: number) => (Math.abs(n) < 1e-9 ? '0' : n.toFixed(5));
const sx = (p: Point) => fmt(p.getX());
const sy = (p: Point) => fmt(-p.getY());

/** SVG coordinates of a disk point. */
export const toSvg = (p: Point): [number, number] => [p.getX(), -p.getY()];

/** Path command that continues from p0 to p1 along the given geodesic. */
function arcAlong(geodesic: Poincare.Geodesic, p0: Point, p1: Point): string {
  if (geodesic instanceof Poincare.Circle) {
    const c = geodesic.getEuclideanCenter();
    const r = geodesic.getEuclideanRadius();
    // Cross product in SVG space decides which way round the arc goes. The part of a
    // geodesic circle inside the disk is always less than half the circle.
    const ax = p0.getX() - c.getX();
    const ay = -(p0.getY() - c.getY());
    const bx = p1.getX() - c.getX();
    const by = -(p1.getY() - c.getY());
    const sweep = ax * by - ay * bx > 0 ? 1 : 0;
    return `A ${fmt(r)} ${fmt(r)} 0 0 ${sweep} ${sx(p1)} ${sy(p1)}`;
  }
  return `L ${sx(p1)} ${sy(p1)}`;
}

/** The hyperbolic segment from p0 to p1, as a continuation (no move-to). */
function segmentTo(p0: Point, p1: Point): string {
  if (p0.equals(p1)) return '';
  return arcAlong(Poincare.Line.givenTwoPoints(p0, p1).getHyperbolicGeodesic(), p0, p1);
}

/** The hyperbolic segment between two points. */
export function segmentPath(p0: Point, p1: Point): string {
  return `M ${sx(p0)} ${sy(p0)} ${segmentTo(p0, p1)}`;
}

/** The whole hyperbolic line, from boundary to boundary. */
export function fullLinePath(line: Poincare.Line): string {
  const geodesic = line.getHyperbolicGeodesic();
  const ends = line.getIdealPoints();
  if (!geodesic || !ends || ends.length < 2) return '';
  return `M ${sx(ends[0])} ${sy(ends[0])} ${arcAlong(geodesic, ends[0], ends[1])}`;
}

/** The hyperbolic line through `from`, leaving it in `direction`. */
export function lineThroughPath(from: Point, direction: number): string {
  return fullLinePath(Poincare.Line.givenTwoPoints(from, from.hyperbolicDistantPoint(0.5, direction)));
}

/** A closed polygon with hyperbolic sides. */
export function polygonPath(vertices: Point[]): string {
  if (vertices.length < 2) return '';
  let d = `M ${sx(vertices[0])} ${sy(vertices[0])}`;
  for (let i = 0; i < vertices.length; i++) {
    d += ' ' + segmentTo(vertices[i], vertices[(i + 1) % vertices.length]);
  }
  return d + ' Z';
}

/** Euclidean centre (SVG space) and radius of a circle, for an SVG <circle>. */
export function circleGeometry(circle: Poincare.Circle): { cx: number; cy: number; r: number } {
  const c = circle.getEuclideanCenter();
  return { cx: c.getX(), cy: -c.getY(), r: circle.getEuclideanRadius() };
}
