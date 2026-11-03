import { describe, it, expect } from 'vitest';
import { Point, Line } from '../index';
import { hyperbolicDistance } from '../../hyperbolic/distance';
import { computeGeodesicThroughPoints } from '../../hyperbolic/poincareDisk';
import { intersectHyperbolicGeodesics } from '../../hyperbolic/intersections';

// The port and our original Poincaré-disk code are independent implementations;
// they should agree wherever they overlap.
const samples: [number, number, number, number][] = [
  [0.1, 0.2, -0.3, 0.4],
  [0.5, -0.1, 0.2, 0.6],
  [-0.7, 0.05, 0.6, -0.2],
  [0.0, 0.45, 0.3, 0.0],
  [0.85, 0.1, -0.2, -0.8],
];

describe('Poincaré port agrees with geometry-engine/hyperbolic', () => {
  it('hyperbolic distance', () => {
    for (const [ax, ay, bx, by] of samples) {
      const ours = hyperbolicDistance({ x: ax, y: ay }, { x: bx, y: by });
      const port = Point.givenCoordinates(ax, ay).hyperbolicDistanceTo(Point.givenCoordinates(bx, by));
      expect(port).toBeCloseTo(ours, 6);
    }
  });

  it('whether two lines meet', () => {
    const pairs: [[number, number], [number, number], [number, number], [number, number]][] = [
      [[-0.8, 0], [0.8, 0], [0, 0.45], [0.3, 0.5]], // nearly level line above L: misses
      [[-0.8, 0], [0.8, 0], [0, 0.45], [0.2, -0.3]], // crosses L
      [[-0.5, -0.5], [0.5, 0.5], [-0.5, 0.5], [0.5, -0.5]], // two diagonals: meet at the origin
      [[0.1, 0.6], [0.6, 0.1], [-0.1, -0.6], [-0.6, -0.1]], // opposite corners: miss
    ];
    for (const [a, b, c, d] of pairs) {
      const ours = intersectHyperbolicGeodesics(
        computeGeodesicThroughPoints({ x: a[0], y: a[1] }, { x: b[0], y: b[1] }),
        computeGeodesicThroughPoints({ x: c[0], y: c[1] }, { x: d[0], y: d[1] })
      );
      const port = Line.hyperbolicIntersect(
        Line.givenTwoPoints(Point.givenCoordinates(a[0], a[1]), Point.givenCoordinates(b[0], b[1])),
        Line.givenTwoPoints(Point.givenCoordinates(c[0], c[1]), Point.givenCoordinates(d[0], d[1]))
      );
      expect(port !== false).toBe(ours.type === 'unique');
      if (port && ours.type === 'unique') {
        const p = ours.points[0] as { x: number; y: number };
        expect(port.getX()).toBeCloseTo(p.x, 5);
        expect(port.getY()).toBeCloseTo(p.y, 5);
      }
    }
  });
});

import { classifyParallelCandidate, PARALLEL_LAB_SETUP } from '../../parallelLab';

describe('Parallel lab on the disk', () => {
  it("the port's line through P meets L exactly when the lab says it does", () => {
    const { P, L } = PARALLEL_LAB_SETUP.hyperbolic;
    const p = Point.givenCoordinates(P.x, P.y);
    // Not Line.X_AXIS: upstream builds its second point on the rim, so it is "off the plane"
    const l = Line.givenTwoPoints(Point.givenCoordinates(L[0].x, L[0].y), Point.givenCoordinates(L[1].x, L[1].y));
    for (let deg = -85; deg <= 85; deg += 5) {
      const verdict = classifyParallelCandidate('hyperbolic', deg).verdict;
      if (verdict === 'limiting') continue;
      const rad = (deg * Math.PI) / 180;
      const candidate = Line.givenTwoPoints(p, p.hyperbolicDistantPoint(0.5, rad));
      const meets = Line.hyperbolicIntersect(candidate, l) !== false;
      expect(meets, `θ = ${deg}°`).toBe(verdict === 'meets');
    }
  });
});
