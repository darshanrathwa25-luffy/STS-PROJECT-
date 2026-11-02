import { Point2D, Point3D, GeodesicCurve } from '../shared/types';
import { normalize2D, sub2D, add2D, scale2D } from '../shared/vectors';

/**
 * Generate discrete points for a straight Euclidean geodesic segment
 */
export function generateEuclideanSegment(
  p1: Point2D,
  p2: Point2D,
  samples = 32,
  yOffset = 0.02
): GeodesicCurve {
  const points: Point3D[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = p1.x + t * (p2.x - p1.x);
    const z = p1.y + t * (p2.y - p1.y); // mapped to X-Z plane in Three.js
    points.push({ x, y: yOffset, z });
  }

  return {
    id: `euclidean-seg-${Math.random().toString(36).substring(2, 7)}`,
    kind: 'euclidean',
    points,
    isComplete: false,
  };
}

/**
 * Generate a complete Euclidean line extending across bounds
 */
export function generateEuclideanLine(
  origin: Point2D,
  direction: Point2D,
  extent = 12,
  samples = 64,
  yOffset = 0.02
): GeodesicCurve {
  const dir = normalize2D(direction);
  const pStart = add2D(origin, scale2D(dir, -extent));
  const pEnd = add2D(origin, scale2D(dir, extent));

  const points: Point3D[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = pStart.x + t * (pEnd.x - pStart.x);
    const z = pStart.y + t * (pEnd.y - pStart.y);
    points.push({ x, y: yOffset, z });
  }

  return {
    id: `euclidean-line-${Math.random().toString(36).substring(2, 7)}`,
    kind: 'euclidean',
    points,
    isComplete: true,
  };
}

