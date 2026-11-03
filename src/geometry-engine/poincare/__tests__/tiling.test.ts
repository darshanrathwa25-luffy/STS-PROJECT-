import { describe, it, expect } from 'vitest';
import {
  Point,
  interiorAngles,
  reflectAcross,
  diskDistance,
  dragMove,
  mobiusApply,
  mobiusCompose,
  mobiusInverse,
  translationTo,
  centralTile,
  generateTiling,
  isHyperbolicTiling,
} from '../index';
import { circleMeasurements, sphericalCirclePoints, sphericalDistance } from '../../index';

const pts = [
  { x: 0.1, y: 0.2 },
  { x: -0.5, y: 0.3 },
  { x: 0.6, y: -0.4 },
  { x: 0, y: -0.85 },
];

describe('Möbius moves', () => {
  it('drag carries one point exactly to another and keeps every distance', () => {
    const m = dragMove({ x: 0.3, y: 0.1 }, { x: -0.2, y: 0.5 });
    const moved = mobiusApply(m, { x: 0.3, y: 0.1 });
    expect(moved.x).toBeCloseTo(-0.2, 9);
    expect(moved.y).toBeCloseTo(0.5, 9);
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++)
        expect(diskDistance(mobiusApply(m, pts[i]), mobiusApply(m, pts[j]))).toBeCloseTo(diskDistance(pts[i], pts[j]), 8);
  });

  it('composition and inverse behave', () => {
    const a = translationTo({ x: 0.4, y: -0.2 });
    const b = translationTo({ x: -0.1, y: 0.6 });
    const z = { x: 0.2, y: 0.3 };
    const ab = mobiusApply(mobiusCompose(b, a), z);
    const step = mobiusApply(b, mobiusApply(a, z));
    expect(ab.x).toBeCloseTo(step.x, 9);
    const back = mobiusApply(mobiusInverse(a), mobiusApply(a, z));
    expect(back.x).toBeCloseTo(z.x, 9);
    expect(back.y).toBeCloseTo(z.y, 9);
  });

  it('diskDistance agrees with the ported Point class', () => {
    const d = Point.givenCoordinates(0.1, 0.2).hyperbolicDistanceTo(Point.givenCoordinates(0.6, -0.4));
    expect(diskDistance(pts[0], pts[2])).toBeCloseTo(d, 8);
  });
});

describe('Reflections and tilings', () => {
  it('reflection fixes its line, is its own inverse, and keeps distances', () => {
    const r = reflectAcross({ x: 0.2, y: 0.1 }, { x: -0.3, y: 0.4 });
    const a = r({ x: 0.2, y: 0.1 });
    expect(a.x).toBeCloseTo(0.2, 9);
    const z = { x: 0.5, y: -0.3 };
    const back = r(r(z));
    expect(back.x).toBeCloseTo(z.x, 9);
    expect(diskDistance(r(pts[0]), r(pts[1]))).toBeCloseTo(diskDistance(pts[0], pts[1]), 8);
  });

  it('knows which {p, q} are hyperbolic', () => {
    expect(isHyperbolicTiling(7, 3)).toBe(true);
    expect(isHyperbolicTiling(6, 4)).toBe(true);
    expect(isHyperbolicTiling(6, 3)).toBe(false); // the flat honeycomb
    expect(isHyperbolicTiling(4, 4)).toBe(false); // flat squares
    expect(isHyperbolicTiling(5, 3)).toBe(false); // a dodecahedron: spherical
  });

  for (const [p, q] of [
    [7, 3],
    [6, 4],
    [4, 5],
    [8, 3],
  ]) {
    it(`{${p}, ${q}}: every tile has corners of 360°/${q}, and tiles don't repeat`, () => {
      const tiles = generateTiling(centralTile(p, q), { maxTiles: 400 });
      expect(tiles.length).toBeGreaterThan(30);
      for (const t of tiles.slice(0, 60)) {
        const angles = interiorAngles(t.vertices.map((v) => Point.givenCoordinates(v.x, v.y)));
        angles.forEach((a) => expect(a).toBeCloseTo((2 * Math.PI) / q, 4));
      }
      const keys = new Set(tiles.map((t) => `${t.center.x.toFixed(5)},${t.center.y.toFixed(5)}`));
      expect(keys.size).toBe(tiles.length);
    });
  }
});

describe('Circles on three surfaces', () => {
  it('flat is 2πr, sphere less, hyperbolic more', () => {
    const r = 1.5;
    const flat = circleMeasurements('euclidean', r);
    const sphere = circleMeasurements('spherical', r);
    const hyp = circleMeasurements('hyperbolic', r);
    expect(flat.circumference).toBeCloseTo(2 * Math.PI * r, 12);
    expect(sphere.circumference).toBeLessThan(flat.circumference);
    expect(hyp.circumference).toBeGreaterThan(flat.circumference);
  });

  it('on the sphere the biggest circle is the equator, and it shrinks again after', () => {
    const R = 2.5;
    const eq = circleMeasurements('spherical', (Math.PI * R) / 2, R).circumference;
    expect(eq).toBeCloseTo(2 * Math.PI * R, 9);
    expect(circleMeasurements('spherical', Math.PI * R * 0.75, R).circumference).toBeLessThan(eq);
  });

  it('sphere circle points really are at distance r from the centre', () => {
    const R = 2.5;
    const centre = { x: 0.4, y: 1.1, z: Math.sqrt(R * R - 0.16 - 1.21) };
    for (const p of sphericalCirclePoints(centre, 1.3, R, 24)) {
      expect(sphericalDistance(centre, p, R)).toBeCloseTo(1.3, 9);
    }
  });
});
