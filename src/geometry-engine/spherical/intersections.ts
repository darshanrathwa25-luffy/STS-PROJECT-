import { Point3D, IntersectionInfo } from '../shared/types';
import { cross3D, norm3D, normalize3D, scale3D, dot3D } from '../shared/vectors';
import { approxEqual, clamp } from '../shared/numerical';
import { DEFAULT_SPHERE_RADIUS } from './distance';

/**
 * Analytical intersection of two complete great circles on a sphere.
 * Defined by normal vectors n1 and n2 of their defining planes through origin.
 */
export function intersectGreatCircles(
  n1: Point3D,
  n2: Point3D,
  radius = DEFAULT_SPHERE_RADIUS
): IntersectionInfo {
  const norm1 = normalize3D(n1);
  const norm2 = normalize3D(n2);

  const cross = cross3D(norm1, norm2);
  const crossLength = norm3D(cross);

  if (approxEqual(crossLength, 0, 1e-5)) {
    // Normals are parallel or antiparallel -> same great circle
    return {
      type: 'coincident',
      points: [],
      description: 'The great circles are identical (coincident).',
    };
  }

  // Two antipodal points of intersection
  const lineDir = normalize3D(cross);
  const p1 = scale3D(lineDir, radius);
  const p2 = scale3D(lineDir, -radius);

  // Angle between planes = angle between normal vectors
  const cosAngle = clamp(Math.abs(dot3D(norm1, norm2)), -1, 1);
  const angle = Math.acos(cosAngle);

  return {
    type: 'antipodal_pair',
    points: [p1, p2],
    angle,
    description: `All distinct great circles intersect! They meet at two antipodal points at ${(
      (angle * 180) /
      Math.PI
    ).toFixed(1)}°. Zero parallel lines exist.`,
  };
}

