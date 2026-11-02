import { Point2D, IntersectionInfo } from '../shared/types';
import { cross2D, sub2D, dot2D, norm2D, normalize2D } from '../shared/vectors';
import { approxEqual, EPSILON } from '../shared/numerical';

/**
 * Analytical intersection of two complete Euclidean lines
 * L1: p1 + t * v1
 * L2: p2 + s * v2
 */
export function intersectEuclideanLines(
  p1: Point2D,
  v1: Point2D,
  p2: Point2D,
  v2: Point2D
): IntersectionInfo {
  const dir1 = normalize2D(v1);
  const dir2 = normalize2D(v2);

  const det = cross2D(dir1, dir2);
  const diff = sub2D(p2, p1);

  if (approxEqual(det, 0, 1e-5)) {
    // Parallel or coincident
    const crossDiff = cross2D(diff, dir1);
    if (approxEqual(crossDiff, 0, 1e-4)) {
      return {
        type: 'coincident',
        points: [p1],
        description: 'Lines are identical (infinitely many shared points).',
      };
    }
    return {
      type: 'none',
      points: [],
      description: 'Lines are parallel (direction vectors are collinear, zero intersections).',
    };
  }

  // Intersect at unique point
  // p1 + t * dir1 = p2 + s * dir2
  // t * (dir1 x dir2) = diff x dir2
  const t = cross2D(diff, dir2) / det;
  const intPt: Point2D = {
    x: p1.x + t * dir1.x,
    y: p1.y + t * dir1.y,
  };

  const cosAngle = Math.abs(dot2D(dir1, dir2));
  const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

  return {
    type: 'unique',
    points: [intPt],
    angle,
    description: `Intersect at a single unique point (${intPt.x.toFixed(2)}, ${intPt.y.toFixed(2)}) with angle ${(
      (angle * 180) /
      Math.PI
    ).toFixed(1)}°.`,
  };
}

