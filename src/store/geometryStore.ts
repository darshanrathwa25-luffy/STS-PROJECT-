import { create } from 'zustand';
import { GeometryKind, Point2D, Point3D, GeodesicCurve } from '../geometry-engine';
import { soundManager } from '../utils/audio';

export type { GeometryKind };
export type PresetType =
  | 'hero-sphere'
  | 'parallel-lines'
  | 'triangle'
  | 'circle'
  | 'shortest-path'
  | 'geodesic-path'
  | 'grid';

export type ToolType = 'select' | 'point' | 'geodesic' | 'polygon' | 'measure';
export type AppMode = 'explore' | 'compare';
export type AppSection = 'lab' | 'sts';
export type HyperbolicRepresentation = 'poincare' | 'pseudosphere' | 'compare';
export type StsCaseStudyId = 'history' | 'navigation' | 'gravity' | 'models';

export interface ScenePoint {
  id: string;
  // Position mapped into 3D scene
  position: Point3D;
  // Original coordinates in the mathematical space
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
  appSection: AppSection;
  geometry: GeometryKind;
  compareGeometry: GeometryKind;
  mode: AppMode;
  preset: PresetType;
  tool: ToolType;

  // Hyperbolic Specific Representation
  hyperbolicRepresentation: HyperbolicRepresentation;

  // STS Lens
  activeStsCaseStudy: StsCaseStudyId;

  // Audio
  soundEnabled: boolean;

  // Scene Elements
  points: ScenePoint[];
  geodesics: GeodesicCurve[];
  selectedPointId: string | null;

  // Parallel Lines Flagship Experiment
  parallelExperiment: ParallelExperimentState;

  // Circle Experiment
  circleRadius: number;

  // Appearance & Camera
  appearance: AppearanceState;
  orbitSensitivity: number;
  cameraResetSeq: number;

  // Interaction hints
  instructionText: string;

  // Actions
  setAppSection: (section: AppSection) => void;
  setGeometry: (geometry: GeometryKind) => void;
  setCompareGeometry: (geometry: GeometryKind) => void;
  setMode: (mode: AppMode) => void;
  setPreset: (preset: PresetType) => void;
  setTool: (tool: ToolType) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHyperbolicRepresentation: (rep: HyperbolicRepresentation) => void;
  setStsCaseStudy: (study: StsCaseStudyId) => void;
  setCircleRadius: (r: number) => void;

  // Point management
  addPoint: (point: Omit<ScenePoint, 'id'>) => void;
  updatePoint: (id: string, newPos: Point3D, newNative: Point2D | Point3D) => void;
  selectPoint: (id: string | null) => void;
  clearAll: () => void;

  // Parallel Experiment
  setCandidateAngle: (deg: number) => void;
  setShowFan: (show: boolean) => void;
  setParallelExperimentResult: (verdict: string, classificationType: string, details: string) => void;

  // Appearance
  setAppearance: (updates: Partial<AppearanceState>) => void;
  setOrbitSensitivity: (sensitivity: number) => void;
  resetCamera: () => void;
  setInstructionText: (text: string) => void;

  // Presets initializer
  loadPreset: (preset: PresetType) => void;
}

export const useGeometryStore = create<GeometryStore>((set, get) => ({
  appSection: 'lab',
  geometry: 'hyperbolic',
  compareGeometry: 'euclidean',
  mode: 'explore',
  preset: 'parallel-lines',
  tool: 'select',
  hyperbolicRepresentation: 'poincare',
  activeStsCaseStudy: 'history',
  soundEnabled: false,

  points: [],
  geodesics: [],
  selectedPointId: null,

  parallelExperiment: {
    candidateAngleDeg: 0,
    showFan: false,
    fanCount: 10,
    verdict: 'Evaluating geodesic relationship...',
    classificationType: 'evaluating',
    details: 'Adjust candidate angle to observe intersection properties.',
  },

  circleRadius: 1.5,

  appearance: {
    particleCount: 5000,
    pointSize: 0.045,
    surfaceOpacity: 0.45,
    showGrid: true,
    showSurface: true,
    showConstruction: true,
    showAnnotations: true,
  },

  orbitSensitivity: 1.0,
  cameraResetSeq: 0,
  instructionText: 'Explore non-Euclidean geometry. Use the controls on the right to navigate experiments.',

  setAppSection: (appSection: AppSection) => {
    soundManager.playSelectTick();
    set({ appSection });
  },

  setGeometry: (geometry: GeometryKind) => {
    soundManager.playGeometrySwitch();
    set({ geometry });
    // Re-apply preset for this geometry
    get().loadPreset(get().preset);
  },

  setCompareGeometry: (compareGeometry: GeometryKind) => {
    set({ compareGeometry });
  },

  setMode: (mode: AppMode) => {
    soundManager.playSelectTick();
    set({ mode });
  },

  setPreset: (preset: PresetType) => {
    soundManager.playSelectTick();
    set({ preset });
    get().loadPreset(preset);
  },

  setTool: (tool: ToolType) => {
    soundManager.playSelectTick();
    let hint = '';
    switch (tool) {
      case 'select':
        hint = 'Select Mode: Click points or curves to inspect properties. Drag to move.';
        break;
      case 'point':
        hint = 'Add Point: Click directly on the geometric surface to create a vertex.';
        break;
      case 'geodesic':
        hint = 'Draw Geodesic: Click two points to compute the minimal path curve.';
        break;
      case 'polygon':
        hint = 'Polygon: Click 3 points to form a geodesic triangle and measure angle sum.';
        break;
      case 'measure':
        hint = 'Measure: Click two points to inspect geodesic metric distance.';
        break;
    }
    set({ tool, instructionText: hint });
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

  setStsCaseStudy: (activeStsCaseStudy) => {
    soundManager.playSelectTick();
    set({ activeStsCaseStudy });
  },

  setCircleRadius: (circleRadius) => {
    set({ circleRadius });
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

  loadPreset: (preset) => {
    const { geometry } = get();
    if (preset === 'hero-sphere') {
      if (geometry === 'spherical') {
        const R = 2.5;
        const ptA: ScenePoint = {
          id: 'pt-alpha',
          position: { x: 0, y: R, z: 0 },
          nativeCoords: { x: 0, y: R, z: 0 },
          label: 'A (North Pole)',
        };
        const ptB: ScenePoint = {
          id: 'pt-beta',
          position: { x: R, y: 0, z: 0 },
          nativeCoords: { x: R, y: 0, z: 0 },
          label: 'B (Equator East)',
        };
        const ptC: ScenePoint = {
          id: 'pt-gamma',
          position: { x: 0, y: 0, z: R },
          nativeCoords: { x: 0, y: 0, z: R },
          label: 'C (Equator Prime)',
        };
        set({
          points: [ptA, ptB, ptC],
          instructionText: 'Hero Sphere: Great circles form tri-rectangular triangle (angle sum = 270°, excess = 90°).',
        });
      } else if (geometry === 'euclidean') {
        const ptA: ScenePoint = {
          id: 'pt-1',
          position: { x: -3, y: 0.02, z: -2 },
          nativeCoords: { x: -3, y: -2 },
          label: 'P1',
        };
        const ptB: ScenePoint = {
          id: 'pt-2',
          position: { x: 3, y: 0.02, z: -2 },
          nativeCoords: { x: 3, y: -2 },
          label: 'P2',
        };
        set({
          points: [ptA, ptB],
          instructionText: 'Euclidean Plane: Flat coordinate grid (K = 0). Geodesics are straight Euclidean lines.',
        });
      } else {
        const ptA: ScenePoint = {
          id: 'pt-hyp-1',
          position: { x: 0, y: 0.02, z: 0 },
          nativeCoords: { x: 0, y: 0 },
          label: 'Origin (0, 0)',
        };
        const ptB: ScenePoint = {
          id: 'pt-hyp-2',
          position: { x: 0.6, y: 0.02, z: 0.2 },
          nativeCoords: { x: 0.6, y: 0.2 },
          label: 'Point B',
        };
        set({
          points: [ptA, ptB],
          instructionText: 'Poincaré Disk: Curvature K = -1. Boundary circle represents infinity (ideal boundary).',
        });
      }
    } else if (preset === 'parallel-lines') {
      set({
        instructionText: 'Parallel Lines Experiment: Observe how many complete geodesics pass through P without intersecting L.',
      });
    } else if (preset === 'triangle') {
      if (geometry === 'euclidean') {
        set({
          points: [
            { id: 'tri-1', position: { x: -3, y: 0.02, z: -1.5 }, nativeCoords: { x: -3, y: -1.5 }, label: 'A' },
            { id: 'tri-2', position: { x: 3, y: 0.02, z: -1.5 }, nativeCoords: { x: 3, y: -1.5 }, label: 'B' },
            { id: 'tri-3', position: { x: 0, y: 0.02, z: 2.5 }, nativeCoords: { x: 0, y: 2.5 }, label: 'C' },
          ],
          instructionText: 'Euclidean Triangle: Sum of interior angles is strictly 180° (α + β + γ = π). Drag vertices to test!',
        });
      } else if (geometry === 'spherical') {
        const R = 2.5;
        set({
          points: [
            { id: 'tri-1', position: { x: 0, y: R, z: 0 }, nativeCoords: { x: 0, y: R, z: 0 }, label: 'A' },
            { id: 'tri-2', position: { x: R, y: 0, z: 0 }, nativeCoords: { x: R, y: 0, z: 0 }, label: 'B' },
            { id: 'tri-3', position: { x: 0, y: 0, z: R }, nativeCoords: { x: 0, y: 0, z: R }, label: 'C' },
          ],
          instructionText: 'Spherical Triangle: Sum of interior angles > 180° (Excess E = α + β + γ - π > 0, Area = R²·E).',
        });
      } else {
        set({
          points: [
            { id: 'tri-1', position: { x: -0.4, y: 0.02, z: -0.3 }, nativeCoords: { x: -0.4, y: -0.3 }, label: 'A' },
            { id: 'tri-2', position: { x: 0.4, y: 0.02, z: -0.3 }, nativeCoords: { x: 0.4, y: -0.3 }, label: 'B' },
            { id: 'tri-3', position: { x: 0, y: 0.02, z: 0.5 }, nativeCoords: { x: 0, y: 0.5 }, label: 'C' },
          ],
          instructionText: 'Hyperbolic Triangle: Sum of interior angles < 180° (Defect δ = π - (α + β + γ) > 0, Area = δ).',
        });
      }
    } else if (preset === 'circle') {
      set({
        instructionText: 'Geodesic Circle Experiment: Measure circumference & area as radius increases. Compare with flat Euclidean space.',
      });
    } else if (preset === 'shortest-path') {
      if (geometry === 'euclidean') {
        set({
          points: [
            { id: 'sp-1', position: { x: -4, y: 0.02, z: -2 }, nativeCoords: { x: -4, y: -2 }, label: 'A' },
            { id: 'sp-2', position: { x: 4, y: 0.02, z: 2 }, nativeCoords: { x: 4, y: 2 }, label: 'B' },
          ],
          instructionText: 'Shortest Path (Euclidean): The straight line segment minimizes distance d = √((x₂-x₁)²+(y₂-y₁)²).',
        });
      } else if (geometry === 'spherical') {
        const R = 2.5;
        set({
          points: [
            { id: 'sp-1', position: { x: -R * 0.8, y: R * 0.5, z: 0 }, nativeCoords: { x: -R * 0.8, y: R * 0.5, z: 0 }, label: 'Tokyo' },
            { id: 'sp-2', position: { x: R * 0.7, y: R * 0.6, z: 0.5 }, nativeCoords: { x: R * 0.7, y: R * 0.6, z: 0.5 }, label: 'London' },
          ],
          instructionText: 'Shortest Path (Spherical): The great circle arc is the unique minimal path on a sphere.',
        });
      } else {
        set({
          points: [
            { id: 'sp-1', position: { x: -0.6, y: 0.02, z: -0.3 }, nativeCoords: { x: -0.6, y: -0.3 }, label: 'A' },
            { id: 'sp-2', position: { x: 0.5, y: 0.02, z: 0.4 }, nativeCoords: { x: 0.5, y: 0.4 }, label: 'B' },
          ],
          instructionText: 'Shortest Path (Hyperbolic): The circular arc orthogonal to the boundary is intrinsically straight.',
        });
      }
    } else if (preset === 'grid') {
      set({
        instructionText: 'Coordinate Geodesic Net: Displaying fundamental coordinate curves in current geometry.',
      });
    } else if (preset === 'geodesic-path') {
      set({
        instructionText: 'Geodesic Path: Computing the shortest path along the geometric manifold.',
      });
    }
  },
}));
