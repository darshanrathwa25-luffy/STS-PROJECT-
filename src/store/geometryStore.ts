import { create } from 'zustand';
import { GeometryKind, Point2D, Point3D, GeodesicCurve } from '../geometry-engine';
import { soundManager } from '../utils/audio';

export type { GeometryKind };
export type ExperimentId = 'parallel-lines' | 'triangle' | 'tessellation';
export type ToolType = 'select' | 'point' | 'geodesic' | 'polygon' | 'measure';
export type AppMode = 'explore' | 'compare';
export type HyperbolicRepresentation = 'poincare' | 'pseudosphere' | 'compare';
export type StsCaseStudyId = 'history' | 'navigation' | 'gravity' | 'models';
export type AppSection = 'lab' | 'sts';

export interface ScenePoint {
  id: string;
  position: Point3D;
  nativeCoords: Point2D | Point3D;
  label: string;
  selected?: boolean;
}

export interface ParallelExperimentState {
  candidateAngleDeg: number;
  showFan: boolean;
  fanCount: number;
  verdict: string;
  classificationType: string;
  details: string;
}

export interface AppearanceState {
  particleCount: number;
  pointSize: number;
  surfaceOpacity: number;
  showGrid: boolean;
  showSurface: boolean;
  showConstruction: boolean;
  showAnnotations: boolean;
}

export interface GeometryStore {
  // Navigation & Mode
  geometry: GeometryKind;
  compareGeometry: GeometryKind;
  mode: AppMode;
  experiment: ExperimentId;
  tool: ToolType;

  // Hyperbolic Specific Representation
  hyperbolicRepresentation: HyperbolicRepresentation;

  // Infinite Tiles (Experiment 03) State
  tilingP: number;
  tilingQ: number;
  selectedTileId: string | null;
  hoveredTileId: string | null;
  showTileOutlines: boolean;
  showTileFill: boolean;

  // Audio
  soundEnabled: boolean;

  // Scene Elements (Draggable Points & Construction)
  points: ScenePoint[];
  geodesics: GeodesicCurve[];
  selectedPointId: string | null;

  // Parallel Lines Experiment State
  parallelExperiment: ParallelExperimentState;

  // Appearance & Camera
  appearance: AppearanceState;
  orbitSensitivity: number;
  cameraResetSeq: number;

  // Contextual instruction text
  instructionText: string;

  // Legacy / STS & Circle support
  appSection: AppSection;
  activeStsCaseStudy: StsCaseStudyId;
  circleRadius: number;

  // Actions
  setAppSection: (section: AppSection) => void;
  setStsCaseStudy: (id: StsCaseStudyId) => void;
  setCircleRadius: (radius: number) => void;
  setGeometry: (geometry: GeometryKind) => void;
  setCompareGeometry: (geometry: GeometryKind) => void;
  setMode: (mode: AppMode) => void;
  setExperiment: (experiment: ExperimentId) => void;
  setTool: (tool: ToolType) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHyperbolicRepresentation: (rep: HyperbolicRepresentation) => void;

  // Tiling actions
  setTilingPattern: (p: number, q: number) => void;
  setSelectedTileId: (id: string | null) => void;
  setHoveredTileId: (id: string | null) => void;
  setShowTileOutlines: (show: boolean) => void;
  setShowTileFill: (show: boolean) => void;

  // Point management
  addPoint: (point: Omit<ScenePoint, 'id'>) => void;
  updatePoint: (id: string, newPos: Point3D, newNative: Point2D | Point3D) => void;
  selectPoint: (id: string | null) => void;
  clearAll: () => void;

  // Parallel Experiment
  setCandidateAngle: (deg: number) => void;
  setShowFan: (show: boolean) => void;
  setParallelExperimentResult: (verdict: string, classificationType: string, details: string) => void;

  // Appearance & Camera
  setAppearance: (updates: Partial<AppearanceState>) => void;
  setOrbitSensitivity: (sensitivity: number) => void;
  resetCamera: () => void;
  setInstructionText: (text: string) => void;

  // Preset initializer
  loadExperiment: (exp: ExperimentId) => void;
}

export const useGeometryStore = create<GeometryStore>((set, get) => ({
  geometry: 'hyperbolic',
  compareGeometry: 'euclidean',
  mode: 'explore',
  experiment: 'tessellation',
  tool: 'select',
  hyperbolicRepresentation: 'poincare',
  soundEnabled: false,

  appSection: 'lab',
  activeStsCaseStudy: 'history',
  circleRadius: 1.0,

  // Default tiling is {7, 3} heptagonal tiling (as in reference Image 2)
  tilingP: 7,
  tilingQ: 3,
  selectedTileId: null,
  hoveredTileId: null,
  showTileOutlines: true,
  showTileFill: true,

  points: [],
  geodesics: [],
  selectedPointId: null,

  parallelExperiment: {
    candidateAngleDeg: 0,
    showFan: false,
    fanCount: 10,
    verdict: 'Infinitely many non-intersecting lines (Ultraparallels)',
    classificationType: 'ultraparallel',
    details: 'Through external point P, infinitely many non-intersecting geodesics exist.',
  },

  appearance: {
    particleCount: 4000,
    pointSize: 0.045,
    surfaceOpacity: 0.45,
    showGrid: true,
    showSurface: true,
    showConstruction: true,
    showAnnotations: true,
  },

  orbitSensitivity: 1.0,
  cameraResetSeq: 0,
  instructionText: 'Why do the tiles look smaller as you move outward? They look smaller, but are they?',

  setAppSection: (appSection) => set({ appSection }),
  setStsCaseStudy: (activeStsCaseStudy) => set({ activeStsCaseStudy }),
  setCircleRadius: (circleRadius) => set({ circleRadius }),

  setGeometry: (geometry: GeometryKind) => {
    soundManager.playGeometrySwitch();
    set({ geometry });
    get().loadExperiment(get().experiment);
  },

  setCompareGeometry: (compareGeometry: GeometryKind) => {
    set({ compareGeometry });
  },

  setMode: (mode: AppMode) => {
    soundManager.playSelectTick();
    set({ mode });
  },

  setExperiment: (experiment: ExperimentId) => {
    soundManager.playSelectTick();
    set({ experiment });
    get().loadExperiment(experiment);
  },

  setTool: (tool: ToolType) => {
    soundManager.playSelectTick();
    set({ tool });
  },

  setSoundEnabled: (enabled: boolean) => {
    soundManager.setEnabled(enabled);
    if (enabled) {
      soundManager.playSelectTick();
    }
    set({ soundEnabled: enabled });
  },

  setHyperbolicRepresentation: (hyperbolicRepresentation) => {
    soundManager.playSelectTick();
    set({ hyperbolicRepresentation });
  },

  setTilingPattern: (p, q) => {
    soundManager.playSelectTick();
    set({ tilingP: p, tilingQ: q, selectedTileId: null });
  },

  setSelectedTileId: (id) => {
    if (id) soundManager.playPointClick();
    set({ selectedTileId: id });
  },

  setHoveredTileId: (id) => {
    set({ hoveredTileId: id });
  },

  setShowTileOutlines: (show) => {
    set({ showTileOutlines: show });
  },

  setShowTileFill: (show) => {
    set({ showTileFill: show });
  },

  addPoint: (pointData) => {
    soundManager.playPointClick();
    const id = `pt-${Math.random().toString(36).substring(2, 7)}`;
    const newPt: ScenePoint = {
      ...pointData,
      id,
    };
    set((state) => ({ points: [...state.points, newPt], selectedPointId: id }));
  },

  updatePoint: (id, newPos, newNative) => {
    set((state) => ({
      points: state.points.map((p) =>
        p.id === id ? { ...p, position: newPos, nativeCoords: newNative } : p
      ),
    }));
  },

  selectPoint: (id) => {
    if (id) soundManager.playSelectTick();
    set({ selectedPointId: id });
  },

  clearAll: () => {
    soundManager.playSelectTick();
    set({ points: [], geodesics: [], selectedPointId: null });
  },

  setCandidateAngle: (deg) => {
    set((state) => ({
      parallelExperiment: {
        ...state.parallelExperiment,
        candidateAngleDeg: deg,
      },
    }));
  },

  setShowFan: (show) => {
    soundManager.playSelectTick();
    set((state) => ({
      parallelExperiment: {
        ...state.parallelExperiment,
        showFan: show,
      },
    }));
  },

  setParallelExperimentResult: (verdict, classificationType, details) => {
    set((state) => ({
      parallelExperiment: {
        ...state.parallelExperiment,
        verdict,
        classificationType,
        details,
      },
    }));
  },

  setAppearance: (updates) => {
    set((state) => ({ appearance: { ...state.appearance, ...updates } }));
  },

  setOrbitSensitivity: (sensitivity) => {
    set({ orbitSensitivity: sensitivity });
  },

  resetCamera: () => {
    soundManager.playSelectTick();
    set((state) => ({ cameraResetSeq: state.cameraResetSeq + 1 }));
  },

  setInstructionText: (text) => {
    set({ instructionText: text });
  },

  loadExperiment: (exp: ExperimentId) => {
    const { geometry } = get();

    if (exp === 'parallel-lines') {
      set({
        instructionText: 'Can you draw a line that never meets this one? Adjust the angle slider on the right.',
      });
    } else if (exp === 'triangle') {
      if (geometry === 'euclidean') {
        set({
          points: [
            { id: 'tri-1', position: { x: -2.8, y: 0.02, z: -1.2 }, nativeCoords: { x: -2.8, y: -1.2 }, label: 'A' },
            { id: 'tri-2', position: { x: 2.8, y: 0.02, z: -1.2 }, nativeCoords: { x: 2.8, y: -1.2 }, label: 'B' },
            { id: 'tri-3', position: { x: 0, y: 0.02, z: 2.4 }, nativeCoords: { x: 0, y: 2.4 }, label: 'C' },
          ],
          instructionText: 'Can you make a triangle with more than 180 degrees? Drag the vertices to see.',
        });
      } else if (geometry === 'spherical') {
        const R = 2.5;
        set({
          points: [
            { id: 'tri-1', position: { x: 0, y: R, z: 0 }, nativeCoords: { x: 0, y: R, z: 0 }, label: 'A' },
            { id: 'tri-2', position: { x: R, y: 0, z: 0 }, nativeCoords: { x: R, y: 0, z: 0 }, label: 'B' },
            { id: 'tri-3', position: { x: 0, y: 0, z: R }, nativeCoords: { x: 0, y: 0, z: R }, label: 'C' },
          ],
          instructionText: 'Can you make a triangle with more than 180 degrees? On a sphere, sum > 180°!',
        });
      } else {
        set({
          points: [
            { id: 'tri-1', position: { x: -0.45, y: 0.02, z: -0.35 }, nativeCoords: { x: -0.45, y: -0.35 }, label: 'A' },
            { id: 'tri-2', position: { x: 0.45, y: 0.02, z: -0.35 }, nativeCoords: { x: 0.45, y: -0.35 }, label: 'B' },
            { id: 'tri-3', position: { x: 0, y: 0.02, z: 0.55 }, nativeCoords: { x: 0, y: 0.55 }, label: 'C' },
          ],
          instructionText: 'Can you make a triangle with more than 180 degrees? In hyperbolic space, sum < 180°!',
        });
      }
    } else if (exp === 'tessellation') {
      // Automatically switch to hyperbolic when tessellation is chosen
      if (geometry !== 'hyperbolic') {
        set({ geometry: 'hyperbolic' });
      }
      set({
        instructionText: 'Why do the tiles look smaller as you move outward? They look smaller, but are they?',
      });
    }
  },
}));
