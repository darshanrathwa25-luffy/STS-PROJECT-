import { Point2D, Point3D } from '../shared/types';
import {
  computeGeodesicThroughPoints,
  HyperbolicGeodesicDef,
} from './poincareDisk';
import { generateHyperbolicSegment } from './geodesics';
import { dist2D, normSq2D } from '../shared/vectors';

export interface HyperbolicTile {
  id: string;
  p: number;
  q: number;
  depth: number;
  center: Point2D;
  vertices: Point2D[];
  boundarySegments: Point3D[][];
}

export interface TessellationPattern {
  p: number;
  q: number;
  name: string;
  description: string;
}

export const VALID_PATTERNS: TessellationPattern[] = [
  { p: 7, q: 3, name: '{7, 3} Heptagonal', description: '7-sided regular heptagons, 3 meeting at each vertex.' },
  { p: 5, q: 4, name: '{5, 4} Pentagonal', description: 'Regular pentagons, 4 meeting at each vertex (right-angled tiles).' },
  { p: 8, q: 3, name: '{8, 3} Octagonal', description: '8-sided regular octagons, 3 meeting at each vertex.' },
  { p: 3, q: 7, name: '{3, 7} Triangular', description: 'Hyperbolic triangles, 7 meeting at each vertex.' },
];

/**
 * Circle inversion (hyperbolic reflection across an orthogonal circular geodesic)
 */
function invertAcrossCircle(p: Point2D, center: Point2D, radius: number): Point2D {
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  const d2 = dx * dx + dy * dy;
  if (d2 < 1e-10) return { x: 0, y: 0 };
  const factor = (radius * radius) / d2;
  return {
    x: center.x + dx * factor,
    y: center.y + dy * factor,
  };
}

/**
 * Line reflection (hyperbolic reflection across a straight diameter line passing through origin)
 */
function reflectAcrossLine(p: Point2D, dir: Point2D): Point2D {
  // Unit direction along diameter:
  const len = Math.hypot(dir.x, dir.y) || 1;
  const ux = dir.x / len;
  const uy = dir.y / len;
  // Reflection: 2 * (p . u) * u - p
  const dot = p.x * ux + p.y * uy;
  return {
    x: 2 * dot * ux - p.x,
    y: 2 * dot * uy - p.y,
  };
}

/**
 * Reflect a point across any hyperbolic geodesic
 */
function reflectPointAcrossGeodesic(p: Point2D, geo: HyperbolicGeodesicDef): Point2D {
  if (geo.isDiameter) {
    const dir = geo.direction || { x: 1, y: 0 };
    return reflectAcrossLine(p, dir);
  } else if (geo.circle) {
    return invertAcrossCircle(p, geo.circle.center, geo.circle.radius);
  }
  return p;
}

/**
 * Generate regular hyperbolic {p, q} tessellation in the Poincaré disk
 */
export function generateHyperbolicTessellation(
  p: number,
  q: number,
  maxDepth = 3,
  diskRadius = 3.5
): HyperbolicTile[] {
  // Validate hyperbolic condition: (p - 2)(q - 2) > 4
  if ((p - 2) * (q - 2) <= 4) {
    throw new Error(`Parameters {${p}, ${q}} are not hyperbolic: (p-2)(q-2) must be > 4`);
  }

  // Exact hyperbolic trigonometry:
  // cosh(r_v) = cot(pi/p) * cot(pi/q)
  const cotP = 1 / Math.tan(Math.PI / p);
  const cotQ = 1 / Math.tan(Math.PI / q);
  const coshRv = cotP * cotQ;
  // Euclidean radius of vertices for central polygon: R_v = sqrt((cosh(r_v) - 1)/(cosh(r_v) + 1))
  const rvNorm = Math.sqrt(Math.max(0, (coshRv - 1) / (coshRv + 1)));

  // Generate fundamental central polygon vertices
  const centralVertices: Point2D[] = [];
  for (let i = 0; i < p; i++) {
    const theta = (2 * Math.PI * i) / p;
    centralVertices.push({
      x: rvNorm * Math.cos(theta),
      y: rvNorm * Math.sin(theta),
    });
  }

  const tiles: HyperbolicTile[] = [];
  const visitedCenters: Point2D[] = [];

  const isDuplicateCenter = (c: Point2D): boolean => {
    return visitedCenters.some((vc) => dist2D(vc, c) < 0.04);
  };

  // Helper to discretize the p curved geodesic edges of a tile for 3D rendering
  const buildSegments = (verts: Point2D[]): Point3D[][] => {
    const segments: Point3D[][] = [];
    for (let i = 0; i < verts.length; i++) {
      const u = verts[i];
      const v = verts[(i + 1) % verts.length];
      const seg = generateHyperbolicSegment(u, v, 16, diskRadius, 0.015);
      segments.push(seg.points);
    }
    return segments;
  };

  // Queue of tiles to reflect
  interface QueueItem {
    depth: number;
    center: Point2D;
    vertices: Point2D[];
  }

  const queue: QueueItem[] = [];

  // Add layer 0 (central tile)
  const center0 = { x: 0, y: 0 };
  visitedCenters.push(center0);
  tiles.push({
    id: `tile-0-0`,
    p,
    q,
    depth: 0,
    center: center0,
    vertices: centralVertices,
    boundarySegments: buildSegments(centralVertices),
  });
  queue.push({ depth: 0, center: center0, vertices: centralVertices });

  // Breadth-first generation of neighbor layers
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.depth >= maxDepth) continue;

    for (let i = 0; i < current.vertices.length; i++) {
      const v1 = current.vertices[i];
      const v2 = current.vertices[(i + 1) % current.vertices.length];

      // Geodesic along this edge
      const edgeGeo = computeGeodesicThroughPoints(v1, v2);

      // Reflect current center across this edge
      const newCenter = reflectPointAcrossGeodesic(current.center, edgeGeo);

      // Check boundary distance and duplicates
      if (normSq2D(newCenter) >= 0.96) continue;
      if (isDuplicateCenter(newCenter)) continue;

      // Reflect all vertices across this edge
      const newVertices = current.vertices.map((v) => reflectPointAcrossGeodesic(v, edgeGeo));

      // Validate all vertices inside disk
      const allInside = newVertices.every((v) => normSq2D(v) < 0.99);
      if (!allInside) continue;

      visitedCenters.push(newCenter);
      const newTile: HyperbolicTile = {
        id: `tile-${current.depth + 1}-${tiles.length}`,
        p,
        q,
        depth: current.depth + 1,
        center: newCenter,
        vertices: newVertices,
        boundarySegments: buildSegments(newVertices),
      };

      tiles.push(newTile);
      queue.push({
        depth: current.depth + 1,
        center: newCenter,
        vertices: newVertices,
      });

      // Reasonable tile cap for 60fps performance
      if (tiles.length >= 180) break;
    }
    if (tiles.length >= 180) break;
  }

  return tiles;
}
