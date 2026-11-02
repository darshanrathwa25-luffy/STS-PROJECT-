import { Point2D, Circle2D } from '../shared/types';
import { cross2D, normSq2D, norm2D, dot2D, perp2D } from '../shared/vectors';
import { approxEqual, EPSILON } from '../shared/numerical';

export interface HyperbolicGeodesicDef {
  isDiameter: boolean;
  // For diameter:
  direction?: Point2D;
  // For orthogonal circle:
  circle?: Circle2D;
  // Ideal boundary points on |z| = 1
  idealEndpoints: [Point2D, Point2D];
}

/**
 * Compute the hyperbolic geodesic (diameter or orthogonal circle) passing through two points u and v
 */
export function computeGeodesicThroughPoints(
  u: Point2D,
  v: Point2D
): HyperbolicGeodesicDef {
  const cross = cross2D(u, v);

  // If u, v, and origin are collinear (or one is at origin), geodesic is a diameter
  if (approxEqual(cross, 0, 1e-6)) {
    const ref = normSq2D(u) > EPSILON ? u : v;
    const len = norm2D(ref);
    const dir: Point2D = len > EPSILON ? { x: ref.x / len, y: ref.y / len } : { x: 1, y: 0 };
    return {
      isDiameter: true,
      direction: dir,
      idealEndpoints: [dir, { x: -dir.x, y: -dir.y }],
    };
  }

  // Orthogonal circle circumcenter:
  // C0 . u = (1 + |u|^2) / 2
  // C0 . v = (1 + |v|^2) / 2
  const b1 = (1 + normSq2D(u)) / 2;
  const b2 = (1 + normSq2D(v)) / 2;

  const det = cross; // u.x * v.y - u.y * v.x
  const cx = (b1 * v.y - b2 * u.y) / det;
  const cy = (u.x * b2 - v.x * b1) / det;
  const cNormSq = cx * cx + cy * cy;

  const radius = Math.sqrt(Math.max(0, cNormSq - 1));
  const center: Point2D = { x: cx, y: cy };

  // Calculate ideal endpoints on the unit circle:
  // Radical axis is C0 . p = 1
  const cNorm = Math.sqrt(cNormSq);
  const midX = cx / cNormSq;
  const midY = cy / cNormSq;
  const chordDist = Math.sqrt(Math.max(0, 1 - 1 / cNormSq));
  const perpX = -cy / cNorm;
  const perpY = cx / cNorm;

  const ideal1: Point2D = {
    x: midX + chordDist * perpX,
    y: midY + chordDist * perpY,
  };
  const ideal2: Point2D = {
    x: midX - chordDist * perpX,
    y: midY - chordDist * perpY,
  };

  return {
    isDiameter: false,
    circle: { center, radius },
    idealEndpoints: [ideal1, ideal2],
  };
}

/**
 * Compute the hyperbolic geodesic passing through point P with tangent direction angle theta
 */
export function computeGeodesicThroughPointAndAngle(
  p: Point2D,
  theta: number
): HyperbolicGeodesicDef {
  const dir: Point2D = { x: Math.cos(theta), y: Math.sin(theta) };
  const normal = perp2D(dir); // (-sin(theta), cos(theta))

  const dot = dot2D(normal, p);

  // If normal . p is zero, the tangent line goes through origin -> diameter!
  if (approxEqual(dot, 0, 1e-6)) {
    return {
      isDiameter: true,
      direction: dir,
      idealEndpoints: [dir, { x: -dir.x, y: -dir.y }],
    };
  }

  const pNormSq = normSq2D(p);
  const lambda = (1 - pNormSq) / (2 * dot);

  const cx = p.x + lambda * normal.x;
  const cy = p.y + lambda * normal.y;
  const radius = Math.abs(lambda);
  const center: Point2D = { x: cx, y: cy };

  const cNormSq = cx * cx + cy * cy;
  const cNorm = Math.sqrt(cNormSq);

  const midX = cx / cNormSq;
  const midY = cy / cNormSq;
  const chordDist = Math.sqrt(Math.max(0, 1 - 1 / cNormSq));
  const perpX = -cy / cNorm;
  const perpY = cx / cNorm;

  const ideal1: Point2D = {
    x: midX + chordDist * perpX,
    y: midY + chordDist * perpY,
  };
  const ideal2: Point2D = {
    x: midX - chordDist * perpX,
    y: midY - chordDist * perpY,
  };

  return {
    isDiameter: false,
    circle: { center, radius },
    idealEndpoints: [ideal1, ideal2],
  };
}

