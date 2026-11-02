import { Point2D, Point3D, GeodesicCurve } from '../shared/types';
import {
  computeGeodesicThroughPoints,
  computeGeodesicThroughPointAndAngle,
  HyperbolicGeodesicDef,
} from './poincareDisk';
import { norm2D, normSq2D } from '../shared/vectors';

/**
 * Sample discrete 3D points for a complete hyperbolic geodesic in the Poincaré disk
 * (Mapped to X-Z plane with slight Y offset for rendering)
 */
export function generateHyperbolicGeodesicCurve(
  def: HyperbolicGeodesicDef,
  samples = 80,
  diskRadius = 1.0,
  yOffset = 0.015
): GeodesicCurve {
  const points: Point3D[] = [];
  const [i1, i2] = def.idealEndpoints;

  if (def.isDiameter) {
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = (i1.x + t * (i2.x - i1.x)) * diskRadius;
      const z = (i1.y + t * (i2.y - i1.y)) * diskRadius;
      points.push({ x, y: yOffset, z });
    }
  } else if (def.circle) {
    const { center, radius } = def.circle;
    const a1 = Math.atan2(i1.y - center.y, i1.x - center.x);
    const a2 = Math.atan2(i2.y - center.y, i2.x - center.x);

    // Direction pointing from circle center towards disk origin (0, 0)
    const targetAngle = Math.atan2(-center.y, -center.x);

    // Find the angular span that contains targetAngle
    let span = a2 - a1;
    while (span > Math.PI) span -= 2 * Math.PI;
    while (span < -Math.PI) span += 2 * Math.PI;

    // Check if a1 + span / 2 points towards origin, else invert direction
    const midAngle = a1 + span / 2;
    const testPoint = {
      x: center.x + radius * Math.cos(midAngle),
      y: center.y + radius * Math.sin(midAngle),
    };

    let startAngle = a1;
    let endAngle = a1 + span;

    if (normSq2D(testPoint) > 1.0001) {
      if (span > 0) {
        endAngle = a1 + (span - 2 * Math.PI);
      } else {
        endAngle = a1 + (span + 2 * Math.PI);
      }
    }

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const theta = startAngle + t * (endAngle - startAngle);
      const x = (center.x + radius * Math.cos(theta)) * diskRadius;
      const z = (center.y + radius * Math.sin(theta)) * diskRadius;
      points.push({ x, y: yOffset, z });
    }
  }

  return {
    id: `hyperbolic-geo-${Math.random().toString(36).substring(2, 7)}`,
    kind: 'hyperbolic',
    points,
    isComplete: true,
    idealEndpoints: [i1, i2],
  };
}

/**
 * Generate geodesic connecting two interior points u and v
 */
export function generateHyperbolicSegment(
  u: Point2D,
  v: Point2D,
  samples = 40,
  diskRadius = 1.0,
  yOffset = 0.018
): GeodesicCurve {
  const def = computeGeodesicThroughPoints(u, v);
  const points: Point3D[] = [];

  if (def.isDiameter) {
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = (u.x + t * (v.x - u.x)) * diskRadius;
      const z = (u.y + t * (v.y - u.y)) * diskRadius;
      points.push({ x, y: yOffset, z });
    }
  } else if (def.circle) {
    const { center, radius } = def.circle;
    const aU = Math.atan2(u.y - center.y, u.x - center.x);
    const aV = Math.atan2(v.y - center.y, v.x - center.x);

    let span = aV - aU;
    while (span > Math.PI) span -= 2 * Math.PI;
    while (span < -Math.PI) span += 2 * Math.PI;

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const theta = aU + t * span;
      const x = (center.x + radius * Math.cos(theta)) * diskRadius;
      const z = (center.y + radius * Math.sin(theta)) * diskRadius;
      points.push({ x, y: yOffset, z });
    }
  }

  return {
    id: `hyperbolic-seg-${Math.random().toString(36).substring(2, 7)}`,
    kind: 'hyperbolic',
    points,
    isComplete: false,
  };
}

/**
 * Generate geodesic through point P with tangent angle
 */
export function generateHyperbolicThroughPointAndAngle(
  p: Point2D,
  theta: number,
  samples = 80,
  diskRadius = 1.0
): GeodesicCurve {
  const def = computeGeodesicThroughPointAndAngle(p, theta);
  return generateHyperbolicGeodesicCurve(def, samples, diskRadius);
}

