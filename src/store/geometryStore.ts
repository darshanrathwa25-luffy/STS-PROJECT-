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
} from '../geometry-engine';
import { soundManager } from '../utils/audio';

export type WorldKind = 'flat' | 'sphere' | 'hyperbolic';
export type LabKind = 'triangle' | 'parallel';
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

  // STS & Discovery Progress
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

  setParallelState: (updates: Partial<ParallelState>) => void;
  markQuestionSolved: (id: string, solved?: boolean) => void;
  setReflectionText: (text: string) => void;
  setSoundEnabled: (enabled: boolean) => void;
  resetCamera: () => void;
  resetLab: () => void;

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
  isLanding: false,
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
      cameraResetSeq: get().cameraResetSeq + 1,
    });
    get().loadExperiment(get().experiment);
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
