import { describe, it, expect, beforeEach } from 'vitest';
import { useGeometryStore } from '../geometryStore';
import {
  euclideanTriangle,
  sphericalTriangle,
  saddleTriangle,
  DEFAULT_SPHERE_RADIUS,
} from '../../geometry-engine';

describe('Triangle Lab (Phase 3a Explore Mode State & Logic)', () => {
  beforeEach(() => {
    useGeometryStore.getState().resetLab();
  });

  it('flat world triangle maintains angle sum of exactly 180 deg +/- 0.05', () => {
    const state = useGeometryStore.getState();
    const { p1, p2, p3 } = state.flatTriangle;
    const tri = euclideanTriangle(p1, p2, p3);

    expect(tri.angleSumDeg).toBeCloseTo(180.0, 1);
  });

  it('spherical world default triangle has angle sum strictly > 180 deg', () => {
    const state = useGeometryStore.getState();
    const { p1, p2, p3 } = state.sphereTriangle;
    const tri = sphericalTriangle(p1, p2, p3, DEFAULT_SPHERE_RADIUS);

    expect(tri.angleSumDeg).toBeGreaterThan(180.0);
    expect(tri.excessOrDefect).toBeGreaterThan(0);
  });

  it('saddle world default triangle has angle sum strictly < 180 deg', () => {
    const state = useGeometryStore.getState();
    const { p1, p2, p3 } = state.saddleTriangle;
    const tri = saddleTriangle(p1, p2, p3);

    expect(tri.angleSumDeg).toBeLessThan(180.0);
    expect(tri.defectDeg).toBeGreaterThan(0);
  });

  it('switching world preserves side lengths across geometries', () => {
    const store = useGeometryStore.getState();
    const initialSides = { a: 1.0, b: 1.0, c: 1.0 };
    store.setSides(initialSides);

    // Switch to sphere
    store.setWorld('sphere');
    const sphereState = useGeometryStore.getState();
    expect(sphereState.world).toBe('sphere');

    const sTri = sphericalTriangle(
      sphereState.sphereTriangle.p1,
      sphereState.sphereTriangle.p2,
      sphereState.sphereTriangle.p3,
      DEFAULT_SPHERE_RADIUS
    );
    expect(sTri.a).toBeCloseTo(1.0, 1);
    expect(sTri.b).toBeCloseTo(1.0, 1);
    expect(sTri.c).toBeCloseTo(1.0, 1);

    // Switch to hyperbolic saddle
    store.setWorld('hyperbolic');
    const hypState = useGeometryStore.getState();
    expect(hypState.world).toBe('hyperbolic');

    const hTri = saddleTriangle(
      hypState.saddleTriangle.p1,
      hypState.saddleTriangle.p2,
      hypState.saddleTriangle.p3
    );
    expect(hTri.sides[0]).toBeCloseTo(1.0, 1);
    expect(hTri.sides[1]).toBeCloseTo(1.0, 1);
    expect(hTri.sides[2]).toBeCloseTo(1.0, 1);
  });

  it('nudgeSelectedVertex updates active vertex coordinates', () => {
    useGeometryStore.getState().setWorld('flat');
    useGeometryStore.getState().setSelectedVertex('p1');

    const prevPt = { ...useGeometryStore.getState().flatTriangle.p1 };
    useGeometryStore.getState().nudgeSelectedVertex(0.1, 0.1);

    const nextState = useGeometryStore.getState();
    expect(nextState.flatTriangle.p1.x).toBeCloseTo(prevPt.x + 0.1, 4);
    expect(nextState.flatTriangle.p1.y).toBeCloseTo(prevPt.y + 0.1, 4);
  });

  it('cycleSelectedVertex rotates p1 -> p2 -> p3 -> p1', () => {
    const store = useGeometryStore.getState();
    store.setSelectedVertex('p1');

    store.cycleSelectedVertex(false);
    expect(useGeometryStore.getState().selectedVertex).toBe('p2');

    store.cycleSelectedVertex(false);
    expect(useGeometryStore.getState().selectedVertex).toBe('p3');

    store.cycleSelectedVertex(false);
    expect(useGeometryStore.getState().selectedVertex).toBe('p1');
  });

  it('detects sphere excess question solved when sum > 185 deg', () => {
    const store = useGeometryStore.getState();
    store.setWorld('sphere');

    // Default sphere triangle already has sum > 185
    const tri = sphericalTriangle(
      store.sphereTriangle.p1,
      store.sphereTriangle.p2,
      store.sphereTriangle.p3,
      DEFAULT_SPHERE_RADIUS
    );

    if (tri.angleSumDeg > 185) {
      store.markQuestionSolved('tri_sphere', true);
    }

    expect(useGeometryStore.getState().solvedQuestions['tri_sphere']).toBe(true);
  });
});
