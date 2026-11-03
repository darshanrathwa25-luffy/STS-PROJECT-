import type { GeometryStoreState } from '../store/geometryStore';
import {
  euclideanTriangle,
  sphericalTriangle,
  saddleTriangle,
  classifyParallelCandidate,
  DEFAULT_SPHERE_RADIUS,
  Poincare,
} from '../geometry-engine';

export interface GoalResult {
  met: boolean;
  /** Flags to remember for next time (e.g. "the student has tilted the line"). */
  flags?: Record<string, boolean>;
}

type GoalCheck = (s: GeometryStoreState, flags: Record<string, boolean>) => GoalResult;

const deg = (rad: number) => (rad * 180) / Math.PI;

/**
 * One check per question. Each is met only by something the student does, never
 * by the state a page starts in (the start states are checked in goals.test.ts).
 */
export const GOALS: Record<string, GoalCheck> = {
  tri_flat: (s) => {
    const t = euclideanTriangle(s.flatTriangle.p1, s.flatTriangle.p2, s.flatTriangle.p3);
    const angles = [t.alpha, t.beta, t.gamma].map(deg);
    return { met: Math.max(...angles) > 120 || Math.min(...angles) < 15 };
  },

  tri_sphere: (s) => {
    const t = sphericalTriangle(s.sphereTriangle.p1, s.sphereTriangle.p2, s.sphereTriangle.p3, DEFAULT_SPHERE_RADIUS);
    return { met: !t.degenerate && t.angleSumDeg >= 200 };
  },

  tri_hyperbolic: (s) => {
    const t = saddleTriangle(s.saddleTriangle.p1, s.saddleTriangle.p2, s.saddleTriangle.p3);
    return { met: !t.degenerate && t.angleSumDeg <= 140 };
  },

  par_flat: (s, flags) => {
    const theta = s.parallelExperiment.candidateAngleDeg;
    const tilted = flags.tilted || Math.abs(theta) >= 10;
    const misses = classifyParallelCandidate('euclidean', theta).verdict === 'misses';
    return { met: tilted && misses, flags: tilted && !flags.tilted ? { tilted: true } : undefined };
  },

  par_sphere: (s) => ({ met: Math.abs(s.parallelExperiment.candidateAngleDeg) >= 60 }),

  par_hyperbolic: (s) => ({
    met: classifyParallelCandidate('hyperbolic', s.parallelExperiment.candidateAngleDeg).verdict === 'limiting',
  }),

  disk_walk: (s) => ({
    met: Poincare.Point.givenCoordinates(s.disk.walker.x, s.disk.walker.y).getHyperbolicRadius() >= 4,
  }),

  circ_flat: (s) => ({ met: s.circles.flat >= 2 }),

  circ_sphere: (s) => ({ met: s.circles.sphere > (Math.PI * DEFAULT_SPHERE_RADIUS) / 2 + 0.2 }),

  circ_hyperbolic: (s) => ({ met: s.disk.circle.r >= 3 }),

  disk_tiles: (s) => {
    const { sides, radius } = s.disk.tiles;
    const angle = Poincare.regularPolygonCornerAngle(sides, radius);
    const fit = Math.floor((2 * Math.PI) / angle + 1e-6);
    const gap = 2 * Math.PI - fit * angle;
    return { met: sides === 6 && fit >= 4 && gap < (0.5 * Math.PI) / 180 };
  },

  disk_tiling: (s) => ({ met: Poincare.diskDistance(s.disk.tiling.home, { x: 0, y: 0 }) >= 2 }),

  disk_polygon: (s) => {
    if (s.disk.polygon.length !== 3) return { met: false };
    const pts = s.disk.polygon.map((v) => Poincare.Point.givenCoordinates(v.x, v.y));
    if (!Poincare.isSimplePolygon(pts)) return { met: false };
    return { met: deg(Poincare.measurePolygon(pts).defect) >= 90 };
  },
};
