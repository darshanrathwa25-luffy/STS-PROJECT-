import {
  GeometryKind,
  NativeCoords,
  ConstructedTriangle,
  TriangleSidesAngleSums,
} from './types';
import { clamp } from './numerical';
import { DEFAULT_SPHERE_RADIUS } from '../spherical/distance';

/**
 * Constructs native coordinates for a triangle with side lengths a, b, c in the specified world:
 * Side a is opposite vertex A (length between B and C).
 * Side b is opposite vertex B (length between A and C).
 * Side c is opposite vertex C (length between A and B).
 *
 * Vertex A is anchored at the canonical origin (0, 0) or North Pole (0, 0, R).
 * Vertex B is placed along the canonical primary axis at distance c.
 * Vertex C is placed using the world's law of cosines for angle A.
 *
 * Returns null if a triangle with side lengths a, b, c cannot exist in that geometry.
 */
export function constructTriangleFromSides(
  world: GeometryKind,
  a: number,
  b: number,
  c: number,
  sphereRadius = DEFAULT_SPHERE_RADIUS
): ConstructedTriangle<NativeCoords> | null {
  if (a <= 1e-6 || b <= 1e-6 || c <= 1e-6) {
    return null;
  }

  if (world === 'euclidean') {
    // Standard triangle inequalities
    if (a + b <= c + 1e-7 || a + c <= b + 1e-7 || b + c <= a + 1e-7) {
      return null;
    }

    const cosA = (b * b + c * c - a * a) / (2 * b * c);
    if (Math.abs(cosA) > 1 + 1e-6) return null;
    const angleA = Math.acos(clamp(cosA, -1, 1));

    return {
      a: { kind: 'euclidean', x: 0, y: 0 },
      b: { kind: 'euclidean', x: c, y: 0 },
      c: { kind: 'euclidean', x: b * Math.cos(angleA), y: b * Math.sin(angleA) },
    };
  }

  if (world === 'spherical') {
    const R = sphereRadius;
    const aHat = a / R;
    const bHat = b / R;
    const cHat = c / R;

    // Euler spherical triangle criteria: each side in (0, pi), perimeter < 2pi
    if (aHat >= Math.PI - 1e-6 || bHat >= Math.PI - 1e-6 || cHat >= Math.PI - 1e-6) {
      return null;
    }
    if (aHat + bHat + cHat >= 2 * Math.PI - 1e-6) {
      return null;
    }
    if (
      aHat >= bHat + cHat - 1e-7 ||
      bHat >= aHat + cHat - 1e-7 ||
      cHat >= aHat + bHat - 1e-7
    ) {
      return null;
    }

    const denomA = Math.sin(bHat) * Math.sin(cHat);
    if (denomA < 1e-12) return null;

    const cosA = (Math.cos(aHat) - Math.cos(bHat) * Math.cos(cHat)) / denomA;
    if (Math.abs(cosA) > 1 + 1e-6) return null;
    const angleA = Math.acos(clamp(cosA, -1, 1));

    return {
      a: { kind: 'spherical', x: 0, y: 0, z: R },
      b: { kind: 'spherical', x: R * Math.sin(cHat), y: 0, z: R * Math.cos(cHat) },
      c: {
        kind: 'spherical',
        x: R * Math.sin(bHat) * Math.cos(angleA),
        y: R * Math.sin(bHat) * Math.sin(angleA),
        z: R * Math.cos(bHat),
      },
    };
  }

  if (world === 'hyperbolic') {
    // Hyperbolic triangle inequalities
    if (a + b <= c + 1e-7 || a + c <= b + 1e-7 || b + c <= a + 1e-7) {
      return null;
    }

    const denomA = Math.sinh(b) * Math.sinh(c);
    if (denomA < 1e-12) return null;

    const cosA = (Math.cosh(b) * Math.cosh(c) - Math.cosh(a)) / denomA;
    if (Math.abs(cosA) > 1 + 1e-6) return null;
    const angleA = Math.acos(clamp(cosA, -1, 1));

    // Poincaré disk coordinates: Euclidean distance r = tanh(d / 2)
    const rB = Math.tanh(c / 2);
    const rC = Math.tanh(b / 2);

    return {
      a: { kind: 'hyperbolic', x: 0, y: 0 },
      b: { kind: 'hyperbolic', x: rB, y: 0 },
      c: {
        kind: 'hyperbolic',
        x: rC * Math.cos(angleA),
        y: rC * Math.sin(angleA),
      },
    };
  }

  return null;
}

/**
 * Computes triangle angle sums in degrees for given side lengths across all three geometries.
 * Returns null for any geometry where side lengths cannot form a valid triangle.
 */
export function angleSumsForSides(
  a: number,
  b: number,
  c: number,
  sphereRadius = DEFAULT_SPHERE_RADIUS
): TriangleSidesAngleSums {
  let flat: number | null = null;
  let sphere: number | null = null;
  let hyperbolic: number | null = null;

  if (a > 1e-6 && b > 1e-6 && c > 1e-6) {
    // Flat
    if (a + b > c + 1e-7 && a + c > b + 1e-7 && b + c > a + 1e-7) {
      flat = 180;
    }

    // Sphere
    const R = sphereRadius;
    const aHat = a / R;
    const bHat = b / R;
    const cHat = c / R;

    if (
      aHat < Math.PI - 1e-6 &&
      bHat < Math.PI - 1e-6 &&
      cHat < Math.PI - 1e-6 &&
      aHat + bHat + cHat < 2 * Math.PI - 1e-6 &&
      aHat < bHat + cHat - 1e-7 &&
      bHat < aHat + cHat - 1e-7 &&
      cHat < aHat + bHat - 1e-7
    ) {
      const denomA = Math.sin(bHat) * Math.sin(cHat);
      const denomB = Math.sin(aHat) * Math.sin(cHat);
      const denomC = Math.sin(aHat) * Math.sin(bHat);

      if (denomA > 1e-12 && denomB > 1e-12 && denomC > 1e-12) {
        const cosA = (Math.cos(aHat) - Math.cos(bHat) * Math.cos(cHat)) / denomA;
        const cosB = (Math.cos(bHat) - Math.cos(aHat) * Math.cos(cHat)) / denomB;
        const cosC = (Math.cos(cHat) - Math.cos(aHat) * Math.cos(bHat)) / denomC;

        if (
          Math.abs(cosA) <= 1 + 1e-6 &&
          Math.abs(cosB) <= 1 + 1e-6 &&
          Math.abs(cosC) <= 1 + 1e-6
        ) {
          const angA = Math.acos(clamp(cosA, -1, 1));
          const angB = Math.acos(clamp(cosB, -1, 1));
          const angC = Math.acos(clamp(cosC, -1, 1));
          sphere = ((angA + angB + angC) * 180) / Math.PI;
        }
      }
    }

    // Hyperbolic
    if (a + b > c + 1e-7 && a + c > b + 1e-7 && b + c > a + 1e-7) {
      const denomA = Math.sinh(b) * Math.sinh(c);
      const denomB = Math.sinh(a) * Math.sinh(c);
      const denomC = Math.sinh(a) * Math.sinh(b);

      if (denomA > 1e-12 && denomB > 1e-12 && denomC > 1e-12) {
        const cosA = (Math.cosh(b) * Math.cosh(c) - Math.cosh(a)) / denomA;
        const cosB = (Math.cosh(a) * Math.cosh(c) - Math.cosh(b)) / denomB;
        const cosC = (Math.cosh(a) * Math.cosh(b) - Math.cosh(c)) / denomC;

        if (
          Math.abs(cosA) <= 1 + 1e-6 &&
          Math.abs(cosB) <= 1 + 1e-6 &&
          Math.abs(cosC) <= 1 + 1e-6
        ) {
          const angA = Math.acos(clamp(cosA, -1, 1));
          const angB = Math.acos(clamp(cosB, -1, 1));
          const angC = Math.acos(clamp(cosC, -1, 1));
          hyperbolic = ((angA + angB + angC) * 180) / Math.PI;
        }
      }
    }
  }

  return { flat, sphere, hyperbolic };
}

