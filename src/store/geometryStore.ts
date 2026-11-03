import { create } from 'zustand';
import {
  Point2D,
  Point3D,
  GeometryKind,
  GeodesicCurve,
  constructTriangleFromSides,
  constructSaddleTriangleFromSides,
  euclideanTriangle,
  sphericalTriangle,
  saddleTriangle,
  DEFAULT_SPHERE_RADIUS,
  Poincare,
} from '../geometry-engine';
import { soundManager } from '../utils/audio';

export type WorldKind = 'flat' | 'sphere' | 'hyperbolic';
export type LabKind = 'triangle' | 'parallel' | 'circle' | 'disk' | 'reflection';
export type DiskExploration = 'walk' | 'tiles' | 'tiling' | 'polygon';
/** Tutorial: predict, then a goal, then the explanation. Explorer: everything open. */
export type LearningMode = 'tutorial' | 'explorer';

/** Disk-lab state, kept as plain numbers (points are rebuilt with the Poincaré engine). */
export interface DiskState {
  exploration: DiskExploration;
  /** Walker position in the disk and the direction it faces (radians). */
  walker: { x: number; y: number; heading: number };
  /** Every position the walker has stood on, oldest first. */
  trail: { x: number; y: number }[];
  /** Hyperbolic distance walked so far. */
  walked: number;
  /** Circle centre in the disk and hyperbolic radius. */
  circle: { cx: number; cy: number; r: number };
  /** Regular polygon: number of sides and hyperbolic circumradius. */
  tiles: { sides: number; radius: number };
  /** Vertices of the free polygon, in the disk. */
  polygon: { x: number; y: number }[];
  /** The {p, q} tiling, where its first ("home") tile's centre now is, and a rebuild counter. */
  tiling: { p: number; q: number; home: { x: number; y: number }; seq: number };
}

/** Circle radius (measured along the surface) on the flat and sphere circle pages. */
export interface CircleLabState {
  flat: number;
  sphere: number;
}
export type AppMode = 'explore' | 'compare';

// Legacy compatibility types
export type { GeometryKind };
export type ExperimentId = 'parallel-lines' | 'triangle';
export type ToolType = 'select' | 'point' | 'geodesic' | 'polygon' | 'measure';
export type HyperbolicRepresentation = 'saddle' | 'poincare';
export type StsCaseStudyId = 'history' | 'navigation' | 'gravity' | 'models';
export type AppSection = 'lab' | 'sts';

export interface ScenePoint {
  id: string;
  position: Point3D;
  nativeCoords: Point2D | Point3D;
  label: string;
  selected?: boolean;
}

export interface ParallelState {
  theta: number;        // Angle of candidate line in degrees
  h: number;            // Distance from point P to line L
  showFan: boolean;     // Show family of candidate lines
  fanCount: number;     // Number of fan lines
  verdict: string;      // Classification verdict text
  classificationType: string;
  details: string;
}

export interface TriangleSides {
  a: number;
  b: number;
  c: number;
}

export interface GeometryStoreState {
  // Navigation & Core Architecture
  world: WorldKind;
  lab: LabKind;
  appMode: AppMode;
  isLanding: boolean;
  detailsOpen: boolean;

  // Triangle Lab Shared State
  sides: TriangleSides;
  sizeScale: number;
  driver: WorldKind | null;

  // Per-world Triangle Native Vertices
  flatTriangle: { p1: Point2D; p2: Point2D; p3: Point2D };
  sphereTriangle: { p1: Point3D; p2: Point3D; p3: Point3D };
  saddleTriangle: { p1: Point2D; p2: Point2D; p3: Point2D };

  // Parallel Lines Lab State
  parallel: ParallelState;

  // Circles lab (the hyperbolic page uses disk.circle)
  circles: CircleLabState;

  // Poincaré disk lab
  disk: DiskState;

  // Active interaction & selection
  selectedVertex: 'p1' | 'p2' | 'p3' | null;
  isDragging: boolean;

  // STS & Discovery Progress
  mode: LearningMode;
  /** The option the student predicted, per question id (tutorial mode). */
  predictions: Record<string, string>;
  /** Small per-question memory for goals, e.g. "has tilted the line away from level". */
  goalFlags: Record<string, Record<string, boolean>>;
  solvedQuestions: Record<string, boolean>;
  reflectionText: string;
  soundEnabled: boolean;

  // Camera & View Settings
  orbitSensitivity: number;
  cameraResetSeq: number;

  // Compatibility fields for existing scenes
  geometry: GeometryKind;
  experiment: ExperimentId;
  tool: ToolType;
  hyperbolicRepresentation: HyperbolicRepresentation;
  appSection: AppSection;
  activeStsCaseStudy: StsCaseStudyId;
  instructionText: string;
  points: ScenePoint[];
  geodesics: GeodesicCurve[];
  selectedPointId: string | null;
  parallelExperiment: ParallelState & { candidateAngleDeg: number };
  appearance: {
    particleCount: number;
    pointSize: number;
    surfaceOpacity: number;
    showGrid: boolean;
    showSurface: boolean;
    showConstruction: boolean;
    showAnnotations: boolean;
  };

  // Actions
  setWorld: (world: WorldKind) => void;
  setLab: (lab: LabKind) => void;
  setAppMode: (mode: AppMode) => void;
  setIsLanding: (isLanding: boolean) => void;
  setDetailsOpen: (open: boolean) => void;
  setSides: (sides: TriangleSides) => void;
  setSizeScale: (scale: number) => void;
  setDriver: (driver: WorldKind | null) => void;

  updateFlatVertex: (vertex: 'p1' | 'p2' | 'p3', pos: Point2D) => void;
  updateSphereVertex: (vertex: 'p1' | 'p2' | 'p3', pos: Point3D) => void;
  updateSaddleVertex: (vertex: 'p1' | 'p2' | 'p3', pos: Point2D) => void;
  setSelectedVertex: (v: 'p1' | 'p2' | 'p3' | null) => void;
  setIsDragging: (isDragging: boolean) => void;
  cycleSelectedVertex: (reverse?: boolean) => void;
  nudgeSelectedVertex: (dx: number, dy: number) => void;

  setParallelState: (updates: Partial<ParallelState>) => void;
  markQuestionSolved: (id: string, solved?: boolean) => void;
  setMode: (mode: LearningMode) => void;
  setPrediction: (questionId: string, optionId: string) => void;
  setGoalFlags: (questionId: string, flags: Record<string, boolean>) => void;
  /** Forget the prediction, goal progress and discovery for one question, and reset the lab. */
  restartQuestion: (questionId: string) => void;
  setReflectionText: (text: string) => void;
  setSoundEnabled: (enabled: boolean) => void;
  resetCamera: () => void;
  resetLab: () => void;

  // Disk lab and guided path
  setDiskExploration: (exploration: DiskExploration) => void;
  diskWalk: (distance: number) => void;
  diskTurn: (radians: number) => void;
  resetDiskWalk: () => void;
  setDiskCircle: (updates: Partial<DiskState['circle']>) => void;
  setDiskTiles: (updates: Partial<DiskState['tiles']>) => void;
  setDiskPolygon: (points: DiskState['polygon']) => void;
  setTiling: (p: number, q: number) => void;
  /** Record where the home tile has been dragged to. */
  setTilingHome: (home: { x: number; y: number }) => void;
  resetTilingView: () => void;
  setCircleRadius: (world: WorldKind, r: number) => void;
  /** Open a stop on the guided path: switches lab, world and exploration together. */
  goToStep: (step: { lab: LabKind; world?: WorldKind; exploration?: DiskExploration }) => void;

  // Compatibility actions
  setGeometry: (geo: GeometryKind) => void;
  setExperiment: (exp: ExperimentId) => void;
  setTool: (tool: ToolType) => void;
  setHyperbolicRepresentation: (rep: HyperbolicRepresentation) => void;
  setAppSection: (section: AppSection) => void;
  setStsCaseStudy: (id: StsCaseStudyId) => void;
  setInstructionText: (text: string) => void;
  setAppearance: (updates: Partial<GeometryStoreState['appearance']>) => void;
  setOrbitSensitivity: (sensitivity: number) => void;
  setCandidateAngle: (deg: number) => void;
  setShowFan: (show: boolean) => void;
  setParallelExperimentResult: (verdict: string, classificationType: string, details: string) => void;
  loadExperiment: (exp: ExperimentId) => void;
  addPoint: (point: Omit<ScenePoint, 'id'>) => void;
  updatePoint: (id: string, newPos: Point3D, newNative: Point2D | Point3D) => void;
  selectPoint: (id: string | null) => void;
  clearAll: () => void;
}

// Canonical default side lengths
const DEFAULT_SIDES: TriangleSides = { a: 1.2, b: 1.2, c: 1.2 };

// Initial native coordinates
const INITIAL_FLAT_TRIANGLE = {
  p1: { x: -0.9, y: -0.6 },
  p2: { x: 0.9, y: -0.6 },
  p3: { x: 0.0, y: 0.8 },
};

const INITIAL_SPHERE_TRIANGLE = {
  p1: { x: 0, y: 0, z: DEFAULT_SPHERE_RADIUS },
  p2: { x: 1.3, y: 0, z: Math.sqrt(DEFAULT_SPHERE_RADIUS ** 2 - 1.3 ** 2) },
  p3: { x: 0.65, y: 1.1, z: Math.sqrt(Math.max(0.1, DEFAULT_SPHERE_RADIUS ** 2 - 0.65 ** 2 - 1.1 ** 2)) },
};

const INITIAL_SADDLE_TRIANGLE = {
  p1: { x: 0, y: 0 },
  p2: { x: 1.0, y: 0 },
  p3: { x: 0.5, y: 0.8 },
};

const INITIAL_DISK: DiskState = {
  exploration: 'walk',
  walker: { x: 0, y: 0, heading: 0 },
  trail: [{ x: 0, y: 0 }],
  walked: 0,
  circle: { cx: 0, cy: 0, r: 1 },
  tiles: { sides: 6, radius: 0.3 },
  polygon: [
    { x: -0.35, y: -0.25 },
    { x: 0.4, y: -0.3 },
    { x: 0.05, y: 0.45 },
  ],
  tiling: { p: 7, q: 3, home: { x: 0, y: 0 }, seq: 0 },
};

const INITIAL_CIRCLES: CircleLabState = { flat: 1, sphere: 1 };

/** How far out the walker may go; beyond this the map position is indistinguishable from the rim. */
export const DISK_WALK_LIMIT = 8;

function worldToGeometryKind(world: WorldKind): GeometryKind {
  if (world === 'flat') return 'euclidean';
  if (world === 'sphere') return 'spherical';
  return 'hyperbolic';
}

function geometryKindToWorld(kind: GeometryKind): WorldKind {
  if (kind === 'euclidean') return 'flat';
  if (kind === 'spherical') return 'sphere';
  return 'hyperbolic';
}

export const useGeometryStore = create<GeometryStoreState>((set, get) => ({
  // Core Architecture State
  world: 'flat',
  lab: 'triangle',
  appMode: 'explore',
  isLanding: true,
  detailsOpen: false,

  sides: DEFAULT_SIDES,
  sizeScale: 1.0,
  driver: 'flat',

  flatTriangle: INITIAL_FLAT_TRIANGLE,
  sphereTriangle: INITIAL_SPHERE_TRIANGLE,
  saddleTriangle: INITIAL_SADDLE_TRIANGLE,

  parallel: {
    theta: 0,
    h: 1.2,
    showFan: false,
    fanCount: 8,
    verdict: 'One unique parallel line (Euclid V)',
    classificationType: 'unique',
    details: 'Through point P, exactly one line never intersects L.',
  },

  disk: INITIAL_DISK,
  circles: INITIAL_CIRCLES,

  selectedVertex: 'p1',
  isDragging: false,

  mode: 'tutorial',
  predictions: {},
  goalFlags: {},
  solvedQuestions: {},
  reflectionText: '',
  soundEnabled: false,

  orbitSensitivity: 1.0,
  cameraResetSeq: 0,

  // Compatibility fields
  geometry: 'euclidean',
  experiment: 'triangle',
  tool: 'select',
  hyperbolicRepresentation: 'saddle',
  appSection: 'lab',
  activeStsCaseStudy: 'history',
  instructionText: 'Can you make a triangle with angles that do not add up to 180°?',
  points: [],
  geodesics: [],
  selectedPointId: null,
  parallelExperiment: {
    candidateAngleDeg: 0,
    theta: 0,
    h: 1.2,
    showFan: false,
    fanCount: 8,
    verdict: 'One unique parallel line (Euclid V)',
    classificationType: 'unique',
    details: 'Through point P, exactly one line never intersects L.',
  },
  appearance: {
    particleCount: 2000,
    pointSize: 0.045,
    surfaceOpacity: 0.45,
    showGrid: true,
    showSurface: true,
    showConstruction: true,
    showAnnotations: true,
  },

  // Actions
  setWorld: (newWorld) => {
    const prev = get();
    soundManager.playTick();
    const geo = worldToGeometryKind(newWorld);

    // Rebuild triangle for new world if in explore mode
    let updatedFlat = prev.flatTriangle;
    let updatedSphere = prev.sphereTriangle;
    let updatedSaddle = prev.saddleTriangle;

    const { a, b, c } = prev.sides;

    if (newWorld === 'flat') {
      const constructed = constructTriangleFromSides('euclidean', a, b, c);
      if (constructed) {
        const cA = constructed.a as { x: number; y: number };
        const cB = constructed.b as { x: number; y: number };
        const cC = constructed.c as { x: number; y: number };
        updatedFlat = {
          p1: { x: cA.x - cB.x / 2, y: cA.y - cC.y / 3 },
          p2: { x: cB.x - cB.x / 2, y: cB.y - cC.y / 3 },
          p3: { x: cC.x - cB.x / 2, y: cC.y - cC.y / 3 },
        };
      }
    } else if (newWorld === 'sphere') {
      // Clamp side lengths to spherical limits if necessary
      const clampedA = Math.min(a, 2.5);
      const clampedB = Math.min(b, 2.5);
      const clampedC = Math.min(c, 2.5);
      const constructed = constructTriangleFromSides('spherical', clampedA, clampedB, clampedC);
      if (constructed) {
        updatedSphere = {
          p1: constructed.a as Point3D,
          p2: constructed.b as Point3D,
          p3: constructed.c as Point3D,
        };
      }
    } else if (newWorld === 'hyperbolic') {
      // Clamp side lengths to feasible saddle patch domain
      const clampedA = Math.min(Math.max(a, 0.3), 1.5);
      const clampedB = Math.min(Math.max(b, 0.3), 1.5);
      const clampedC = Math.min(Math.max(c, 0.3), 1.5);
      const constructed = constructSaddleTriangleFromSides(clampedA, clampedB, clampedC);
      if (constructed) {
        updatedSaddle = {
          p1: constructed.a,
          p2: constructed.b,
          p3: constructed.c,
        };
      }
    }

    set({
      world: newWorld,
      geometry: geo,
      flatTriangle: updatedFlat,
      sphereTriangle: updatedSphere,
      saddleTriangle: updatedSaddle,
      cameraResetSeq: prev.cameraResetSeq + 1,
    });

    // Sync legacy scene points
    prev.loadExperiment(prev.experiment);
  },

  setLab: (lab) => {
    soundManager.playTick();
    const exp = lab === 'parallel' ? 'parallel-lines' : 'triangle';
    set({ lab, experiment: exp });
    get().loadExperiment(exp);
  },

  setAppMode: (appMode) => {
    soundManager.playTick();
    set({ appMode });
  },

  setIsLanding: (isLanding) => {
    soundManager.playTick();
    set({ isLanding });
  },

  setDetailsOpen: (detailsOpen) => {
    soundManager.playTick();
    set({ detailsOpen });
  },

  setSides: (sides) => {
    set({ sides });
  },

  setSizeScale: (sizeScale) => {
    set({ sizeScale });
  },

  setDriver: (driver) => {
    set({ driver });
  },

  updateFlatVertex: (vertex, pos) => {
    const cur = get().flatTriangle;
    const next = { ...cur, [vertex]: pos };
    const tri = euclideanTriangle(next.p1, next.p2, next.p3);
    set({
      flatTriangle: next,
      sides: { a: tri.a, b: tri.b, c: tri.c },
      driver: 'flat',
    });
  },

  updateSphereVertex: (vertex, pos) => {
    const cur = get().sphereTriangle;
    const next = { ...cur, [vertex]: pos };
    const tri = sphericalTriangle(next.p1, next.p2, next.p3);
    set({
      sphereTriangle: next,
      sides: { a: tri.a, b: tri.b, c: tri.c },
      driver: 'sphere',
    });
  },

  updateSaddleVertex: (vertex, pos) => {
    const cur = get().saddleTriangle;
    const next = { ...cur, [vertex]: pos };
    const tri = saddleTriangle(next.p1, next.p2, next.p3);
    set({
      saddleTriangle: next,
      sides: { a: tri.sides[0], b: tri.sides[1], c: tri.sides[2] },
      driver: 'hyperbolic',
    });
  },

  setSelectedVertex: (selectedVertex) => set({ selectedVertex }),

  setIsDragging: (isDragging) => set({ isDragging }),

  cycleSelectedVertex: (reverse = false) => {
    const cur = get().selectedVertex || 'p1';
    const order: ('p1' | 'p2' | 'p3')[] = ['p1', 'p2', 'p3'];
    const idx = order.indexOf(cur);
    const nextIdx = reverse ? (idx + 2) % 3 : (idx + 1) % 3;
    soundManager.playTick();
    set({ selectedVertex: order[nextIdx] });
  },

  nudgeSelectedVertex: (dx, dy) => {
    const state = get();
    const vKey = state.selectedVertex || 'p1';
    const w = state.world;

    if (w === 'flat') {
      const curPt = state.flatTriangle[vKey];
      const nextX = Math.max(-2.5, Math.min(2.5, curPt.x + dx));
      const nextY = Math.max(-2.5, Math.min(2.5, curPt.y + dy));
      state.updateFlatVertex(vKey, { x: nextX, y: nextY });
    } else if (w === 'sphere') {
      const curPt = state.sphereTriangle[vKey];
      const R = DEFAULT_SPHERE_RADIUS;
      const target = { x: curPt.x + dx, y: curPt.y + dy, z: curPt.z };
      const len = Math.hypot(target.x, target.y, target.z);
      if (len > 1e-4) {
        state.updateSphereVertex(vKey, {
          x: (target.x / len) * R,
          y: (target.y / len) * R,
          z: (target.z / len) * R,
        });
      }
    } else {
      const curPt = state.saddleTriangle[vKey];
      const nextU = Math.max(-1.8, Math.min(1.8, curPt.x + dx));
      const nextV = Math.max(-1.8, Math.min(1.8, curPt.y + dy));
      state.updateSaddleVertex(vKey, { x: nextU, y: nextV });
    }
  },

  setParallelState: (updates) => {
    const current = get().parallel;
    const next = { ...current, ...updates };
    set({
      parallel: next,
      parallelExperiment: {
        ...get().parallelExperiment,
        ...next,
        candidateAngleDeg: next.theta,
      },
    });
  },

  setMode: (mode) => {
    soundManager.playTick();
    set({ mode });
  },

  setPrediction: (questionId, optionId) => {
    soundManager.playTick();
    set((state) => ({ predictions: { ...state.predictions, [questionId]: optionId } }));
  },

  setGoalFlags: (questionId, flags) => {
    set((state) => ({ goalFlags: { ...state.goalFlags, [questionId]: { ...state.goalFlags[questionId], ...flags } } }));
  },

  restartQuestion: (questionId) => {
    const { [questionId]: _p, ...predictions } = get().predictions;
    const { [questionId]: _f, ...goalFlags } = get().goalFlags;
    const { [questionId]: _s, ...solvedQuestions } = get().solvedQuestions;
    set({ predictions, goalFlags, solvedQuestions });
    get().resetLab();
  },

  markQuestionSolved: (id, solved = true) => {
    soundManager.playTick();
    set((state) => ({
      solvedQuestions: { ...state.solvedQuestions, [id]: solved },
    }));
  },

  setReflectionText: (reflectionText) => {
    set({ reflectionText });
  },

  setSoundEnabled: (enabled) => {
    soundManager.setEnabled(enabled);
    if (enabled) {
      soundManager.playTick();
    }
    set({ soundEnabled: enabled });
  },

  resetCamera: () => {
    soundManager.playTick();
    set((state) => ({ cameraResetSeq: state.cameraResetSeq + 1 }));
  },

  resetLab: () => {
    soundManager.playTick();
    const world = get().world;
    set({
      flatTriangle: INITIAL_FLAT_TRIANGLE,
      sphereTriangle: INITIAL_SPHERE_TRIANGLE,
      saddleTriangle: INITIAL_SADDLE_TRIANGLE,
      sides: DEFAULT_SIDES,
      sizeScale: 1.0,
      parallel: {
        theta: 0,
        h: 1.2,
        showFan: false,
        fanCount: 8,
        verdict: 'One unique parallel line (Euclid V)',
        classificationType: 'unique',
        details: 'Through point P, exactly one line never intersects L.',
      },
      parallelExperiment: { ...get().parallelExperiment, theta: 0, showFan: false, candidateAngleDeg: 0 },
      disk: { ...INITIAL_DISK, exploration: get().disk.exploration, tiling: { ...INITIAL_DISK.tiling, p: get().disk.tiling.p, q: get().disk.tiling.q, seq: get().disk.tiling.seq + 1 } },
      circles: INITIAL_CIRCLES,
      cameraResetSeq: get().cameraResetSeq + 1,
    });
    get().loadExperiment(get().experiment);
  },

  setDiskExploration: (exploration) => {
    soundManager.playTick();
    set({ disk: { ...get().disk, exploration } });
  },

  diskWalk: (distance) => {
    const { disk } = get();
    const here = Poincare.Point.givenCoordinates(disk.walker.x, disk.walker.y);
    if (here.getHyperbolicRadius() >= DISK_WALK_LIMIT && distance > 0) {
      // Facing outward beyond the limit: only allow steps that come back in
      const ahead = here.hyperbolicDistantPoint(distance, disk.walker.heading);
      if (ahead.getHyperbolicRadius() >= here.getHyperbolicRadius()) return;
    }
    const next = here.hyperbolicDistantPoint(distance, disk.walker.heading);
    const x = next.getX();
    const y = next.getY();
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    set({
      disk: {
        ...disk,
        walker: { x, y, heading: next.getDirection() },
        trail: [...disk.trail, { x, y }].slice(-400),
        walked: disk.walked + Math.abs(distance),
      },
    });
  },

  diskTurn: (radians) => {
    const { disk } = get();
    set({ disk: { ...disk, walker: { ...disk.walker, heading: Poincare.Angle.normalize(disk.walker.heading + radians) } } });
  },

  resetDiskWalk: () => {
    const { disk } = get();
    set({ disk: { ...disk, walker: INITIAL_DISK.walker, trail: INITIAL_DISK.trail, walked: 0 } });
  },

  setDiskCircle: (updates) => {
    const { disk } = get();
    set({ disk: { ...disk, circle: { ...disk.circle, ...updates } } });
  },

  setDiskTiles: (updates) => {
    const { disk } = get();
    set({ disk: { ...disk, tiles: { ...disk.tiles, ...updates } } });
  },

  setDiskPolygon: (polygon) => {
    set({ disk: { ...get().disk, polygon } });
  },

  setTiling: (p, q) => {
    soundManager.playTick();
    const { disk } = get();
    set({ disk: { ...disk, tiling: { p, q, home: { x: 0, y: 0 }, seq: disk.tiling.seq + 1 } } });
  },

  setTilingHome: (home) => {
    const { disk } = get();
    set({ disk: { ...disk, tiling: { ...disk.tiling, home } } });
  },

  resetTilingView: () => {
    const { disk } = get();
    set({ disk: { ...disk, tiling: { ...disk.tiling, home: { x: 0, y: 0 }, seq: disk.tiling.seq + 1 } } });
  },

  setCircleRadius: (world, r) => {
    if (world === 'hyperbolic') {
      get().setDiskCircle({ r });
    } else {
      set({ circles: { ...get().circles, [world]: r } });
    }
  },

  goToStep: ({ lab, world, exploration }) => {
    if (world && world !== get().world) get().setWorld(world);
    if (lab !== get().lab) get().setLab(lab);
    if (exploration && exploration !== get().disk.exploration) get().setDiskExploration(exploration);
    set({ isLanding: false });
  },

  // Compatibility implementations
  setGeometry: (geo) => {
    get().setWorld(geometryKindToWorld(geo));
  },

  setExperiment: (exp) => {
    get().setLab(exp === 'parallel-lines' ? 'parallel' : 'triangle');
  },

  setTool: (tool) => set({ tool }),
  setHyperbolicRepresentation: (hyperbolicRepresentation) => set({ hyperbolicRepresentation }),
  setAppSection: (appSection) => set({ appSection }),
  setStsCaseStudy: (activeStsCaseStudy) => set({ activeStsCaseStudy }),
  setInstructionText: (instructionText) => set({ instructionText }),
  setAppearance: (updates) => set((state) => ({ appearance: { ...state.appearance, ...updates } })),
  setOrbitSensitivity: (orbitSensitivity) => set({ orbitSensitivity }),
  setCandidateAngle: (deg) => get().setParallelState({ theta: deg }),
  setShowFan: (showFan) => get().setParallelState({ showFan }),
  setParallelExperimentResult: (verdict, classificationType, details) =>
    get().setParallelState({ verdict, classificationType, details }),

  loadExperiment: (exp) => {
    const geo = get().geometry;
    let initialPoints: ScenePoint[] = [];

    if (exp === 'triangle') {
      if (geo === 'euclidean') {
        initialPoints = [
          { id: 'p1', position: { x: -2, y: 0, z: -1.5 }, nativeCoords: { x: -2, y: -1.5 }, label: 'A' },
          { id: 'p2', position: { x: 2, y: 0, z: -1.5 }, nativeCoords: { x: 2, y: -1.5 }, label: 'B' },
          { id: 'p3', position: { x: 0, y: 0, z: 2 }, nativeCoords: { x: 0, y: 2 }, label: 'C' },
        ];
      } else if (geo === 'spherical') {
        const R = DEFAULT_SPHERE_RADIUS;
        initialPoints = [
          { id: 'p1', position: { x: 0, y: R, z: 0 }, nativeCoords: { x: 0, y: R, z: 0 }, label: 'A' },
          { id: 'p2', position: { x: R, y: 0, z: 0 }, nativeCoords: { x: R, y: 0, z: 0 }, label: 'B' },
          { id: 'p3', position: { x: 0, y: 0, z: R }, nativeCoords: { x: 0, y: 0, z: R }, label: 'C' },
        ];
      } else {
        initialPoints = [
          { id: 'p1', position: { x: 0, y: 0, z: 0 }, nativeCoords: { x: 0, y: 0 }, label: 'A' },
          { id: 'p2', position: { x: 1.0, y: 0, z: 0.5 }, nativeCoords: { x: 1.0, y: 0 }, label: 'B' },
          { id: 'p3', position: { x: 0.5, y: 0.8, z: -0.195 }, nativeCoords: { x: 0.5, y: 0.8 }, label: 'C' },
        ];
      }
    } else {
      // Parallel lines setup
      if (geo === 'euclidean') {
        initialPoints = [
          { id: 'p1', position: { x: -4, y: 0, z: -1.5 }, nativeCoords: { x: -4, y: -1.5 }, label: 'L1' },
          { id: 'p2', position: { x: 4, y: 0, z: -1.5 }, nativeCoords: { x: 4, y: -1.5 }, label: 'L2' },
          { id: 'p3', position: { x: 0, y: 0, z: 1.5 }, nativeCoords: { x: 0, y: 1.5 }, label: 'P' },
        ];
      } else if (geo === 'spherical') {
        const R = DEFAULT_SPHERE_RADIUS;
        initialPoints = [
          { id: 'p1', position: { x: -R, y: 0, z: 0 }, nativeCoords: { x: -R, y: 0, z: 0 }, label: 'L1' },
          { id: 'p2', position: { x: R, y: 0, z: 0 }, nativeCoords: { x: R, y: 0, z: 0 }, label: 'L2' },
          { id: 'p3', position: { x: 0, y: R * 0.7, z: R * 0.7 }, nativeCoords: { x: 0, y: R * 0.7, z: R * 0.7 }, label: 'P' },
        ];
      } else {
        initialPoints = [
          { id: 'p1', position: { x: -0.7, y: 0, z: 0 }, nativeCoords: { x: -0.7, y: 0 }, label: 'L1' },
          { id: 'p2', position: { x: 0.7, y: 0, z: 0 }, nativeCoords: { x: 0.7, y: 0 }, label: 'L2' },
          { id: 'p3', position: { x: 0, y: 0.45, z: 0 }, nativeCoords: { x: 0, y: 0.45 }, label: 'P' },
        ];
      }
    }

    set({ points: initialPoints, selectedPointId: null });
  },

  addPoint: (point) => {
    soundManager.playTick();
    const newPoint: ScenePoint = { ...point, id: `pt_${Date.now()}` };
    set((state) => ({ points: [...state.points, newPoint] }));
  },

  updatePoint: (id, newPos, newNative) => {
    set((state) => ({
      points: state.points.map((p) =>
        p.id === id ? { ...p, position: newPos, nativeCoords: newNative } : p
      ),
    }));
  },

  selectPoint: (selectedPointId) => {
    soundManager.playTick();
    set({ selectedPointId });
  },

  clearAll: () => {
    soundManager.playTick();
    set({ points: [], geodesics: [], selectedPointId: null });
  },
}));
