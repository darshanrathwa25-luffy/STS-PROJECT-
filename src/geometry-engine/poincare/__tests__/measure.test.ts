import { describe, it, expect } from 'vitest';
import {
  Point,
  Polygon,
  measurePolygon,
  interiorAngles,
  regularPolygonCornerAngle,
  regularPolygonRadiusForCornerAngle,
  regularPolygonWithCornerAtOrigin,
} from '../index';

describe('Poincaré measurements', () => {
  it('a tiny triangle is almost flat', () => {
    const tri = [Point.givenCoordinates(0, 0), Point.givenCoordinates(0.01, 0), Point.givenCoordinates(0, 0.01)];
    const m = measurePolygon(tri);
    expect(m.angleSum).toBeCloseTo(Math.PI, 3);
    expect(m.defect).toBeGreaterThan(0);
  });

  it('a large triangle has a large defect, and never more than π', () => {
    const big = [0, 2.1, 4.2].map((a) => Point.givenHyperbolicPolarCoordinates(6, a));
    const m = measurePolygon(big);
    expect(m.defect).toBeGreaterThan(2.5);
    expect(m.defect).toBeLessThan(Math.PI);
  });

  it('angle order does not depend on the direction the vertices run', () => {
    const pts = [Point.givenCoordinates(-0.3, -0.2), Point.givenCoordinates(0.4, -0.1), Point.givenCoordinates(0.1, 0.5)];
    const a = interiorAngles(pts);
    const b = interiorAngles([...pts].reverse()).reverse();
    a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 9));
  });

  it('the corner-angle formula matches a constructed regular polygon', () => {
    for (const n of [3, 4, 6, 7]) {
      for (const r of [0.2, 0.8, 1.5]) {
        const gon = Polygon.givenHyperbolicNCenterRadius(n, Point.givenCoordinates(0.1, -0.05), r) as Polygon;
        const measured = interiorAngles(gon.getVertices());
        const expected = regularPolygonCornerAngle(n, r);
        measured.forEach((a) => expect(a).toBeCloseTo(expected, 5));
      }
    }
  });

  it('small regular polygons approach the flat corner angle', () => {
    expect(regularPolygonCornerAngle(6, 1e-6)).toBeCloseTo((2 * Math.PI) / 3, 6);
    expect(regularPolygonCornerAngle(4, 1e-6)).toBeCloseTo(Math.PI / 2, 6);
  });

  it('finds the size at which k hexagons fit around a corner', () => {
    expect(Number.isNaN(regularPolygonRadiusForCornerAngle(6, (2 * Math.PI) / 3))).toBe(false); // flat limit, R = 0
    expect(Number.isNaN(regularPolygonRadiusForCornerAngle(6, (2 * Math.PI) / 2))).toBe(true); // 2 cannot fit
    for (const k of [4, 5, 7]) {
      const r = regularPolygonRadiusForCornerAngle(6, (2 * Math.PI) / k);
      expect(regularPolygonCornerAngle(6, r)).toBeCloseTo((2 * Math.PI) / k, 9);
      const gon = regularPolygonWithCornerAtOrigin(6, r, Math.PI / 2);
      expect(gon.getVertices()[0].equals(Point.ORIGIN)).toBe(true);
      expect(interiorAngles(gon.getVertices())[0]).toBeCloseTo((2 * Math.PI) / k, 5);
    }
  });
});
