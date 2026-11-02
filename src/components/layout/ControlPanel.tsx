import React, { useState, useMemo } from 'react';
import {
  useGeometryStore,
  PresetType,
  GeometryKind,
  HyperbolicRepresentation,
} from '../../store/geometryStore';
import { ParallelLinesExperiment } from '../experiments/ParallelLinesExperiment';
import { TriangleExperiment } from '../experiments/TriangleExperiment';
import { CircleExperiment } from '../experiments/CircleExperiment';
import { ShortestPathExperiment } from '../experiments/ShortestPathExperiment';
import {
  Sparkles,
  Layers,
  Wrench,
  Ruler,
  Sliders,
  Camera,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Activity,
  Disc,
  Waves,
  Columns,
  CircleDot,
  Route,
  Triangle,
} from 'lucide-react';

export const ControlPanel: React.FC = () => {
  const {
    geometry,
    setGeometry,
    preset,
    setPreset,
    hyperbolicRepresentation,
    setHyperbolicRepresentation,
    appearance,
    setAppearance,
    orbitSensitivity,
    setOrbitSensitivity,
    resetCamera,
    soundEnabled,
    setSoundEnabled,
    points,
  } = useGeometryStore();

  // Accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    presets: true,
    feature: true,
    measurements: true,
    appearance: false,
    camera: false,
  });

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Presets configuration with guided scientific learning experiments
  const presetsList: { id: PresetType; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'parallel-lines',
      label: 'Parallel Lines',
      desc: '5th Postulate & Parallels (Euclid vs Bolyai)',
      icon: <Activity className="w-3.5 h-3.5 text-[#69A3FF]" />,
    },
    {
      id: 'triangle',
      label: 'Geodesic Triangle',
      desc: 'Angle sum, excess/defect & Gauss-Bonnet',
      icon: <Triangle className="w-3.5 h-3.5 text-[#FFD166]" />,
    },
    {
      id: 'circle',
      label: 'Circle Experiment',
      desc: 'Circumference & area scaling across K',
      icon: <CircleDot className="w-3.5 h-3.5 text-[#06D6A0]" />,
    },
    {
      id: 'shortest-path',
      label: 'Shortest Path',
      desc: 'Intrinsic geodesic straightness (κ_g = 0)',
      icon: <Route className="w-3.5 h-3.5 text-[#69A3FF]" />,
    },
    {
      id: 'hero-sphere',
      label: 'Hero Overview',
      desc: 'Canonical manifold coordinates',
      icon: <Sparkles className="w-3.5 h-3.5 text-[#858B9A]" />,
    },
  ];

  return (
    <aside className="w-[330px] shrink-0 h-full bg-[#12141A] border-l border-[#292C35] overflow-y-auto overflow-x-hidden flex flex-col divide-y divide-[#20232B] select-none text-[#E8EAF0]">
      {/* 1. Presets / Experiments Section */}
      <div className="p-3.5">
        <button
          onClick={() => toggleSection('presets')}
          className="w-full flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-[#858B9A] hover:text-[#E8EAF0] transition"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#69A3FF]" />
            <span>Guided Experiments</span>
          </div>
          {openSections.presets ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {openSections.presets && (
          <div className="mt-2.5 space-y-1.5">
            {presetsList.map((p) => {
              const active = preset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all ${
                    active
                      ? 'bg-[#181B22] border-[#69A3FF]/40 text-[#E8EAF0] shadow-sm'
                      : 'bg-[#0D0F14]/60 border-[#20232B] text-[#858B9A] hover:text-[#E8EAF0] hover:bg-[#181B22]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {p.icon}
                      <span className="text-xs font-semibold">{p.label}</span>
                    </div>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-[#69A3FF]" />}
                  </div>
                  <div className="text-[10px] text-[#858B9A] mt-0.5 pl-5">{p.desc}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Hyperbolic Representation Selector (shown when geometry === 'hyperbolic') */}
      {geometry === 'hyperbolic' && (
        <div className="p-3.5 bg-[#0D0F14]/70">
          <label className="text-[10px] font-mono uppercase tracking-wider text-[#69A3FF] block mb-2 font-bold">
            Hyperbolic Representation
          </label>
          <div className="grid grid-cols-3 gap-1 bg-[#12141A] p-1 rounded-lg border border-[#20232B]">
            {[
              { id: 'poincare', label: 'Disk', icon: <Disc className="w-3 h-3" /> },
              { id: 'pseudosphere', label: 'Surface', icon: <Waves className="w-3 h-3" /> },
              { id: 'compare', label: 'Dual', icon: <Columns className="w-3 h-3" /> },
            ].map((r) => {
              const active = hyperbolicRepresentation === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setHyperbolicRepresentation(r.id as HyperbolicRepresentation)}
                  className={`py-1 px-1.5 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition ${
                    active
                      ? 'bg-[#181B22] text-[#69A3FF] border border-[#69A3FF]/40 font-semibold'
                      : 'text-[#858B9A] hover:text-[#E8EAF0]'
                  }`}
                >
                  {r.icon}
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-[#858B9A] mt-1.5 leading-snug">
            {hyperbolicRepresentation === 'poincare' &&
              'Poincaré Disk: Complete conformal coordinate chart (K = -1). Authoritative for distance and angle metric.'}
            {hyperbolicRepresentation === 'pseudosphere' &&
              'Pseudosphere: Local 3D embedding with constant negative curvature. Contains Hilbert cuspidal singularity.'}
            {hyperbolicRepresentation === 'compare' &&
              'Dual View: Compare the complete conformal disk side-by-side with the local physical tractricoid.'}
          </p>
        </div>
      )}

      {/* 3. Active Guided Experiment Stage Container */}
      <div className="p-3.5">
        <button
          onClick={() => toggleSection('feature')}
          className="w-full flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-[#858B9A] hover:text-[#E8EAF0] transition"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#69A3FF]" />
            <span>Interactive Experiment</span>
          </div>
          {openSections.feature ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {openSections.feature && (
          <div className="mt-2.5">
            {preset === 'parallel-lines' ? (
              <ParallelLinesExperiment />
            ) : preset === 'triangle' ? (
              <TriangleExperiment />
            ) : preset === 'circle' ? (
              <CircleExperiment />
            ) : preset === 'shortest-path' ? (
              <ShortestPathExperiment />
            ) : (
              <ParallelLinesExperiment />
            )}
          </div>
        )}
      </div>

      {/* 4. Measurements Section */}
      <div className="p-3.5">
        <button
          onClick={() => toggleSection('measurements')}
          className="w-full flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-[#858B9A] hover:text-[#E8EAF0] transition"
        >
          <div className="flex items-center gap-2">
            <Ruler className="w-3.5 h-3.5 text-[#69A3FF]" />
            <span>Metric Measurements</span>
          </div>
          {openSections.measurements ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {openSections.measurements && (
          <div className="mt-2.5 space-y-2 bg-[#0D0F14] p-3 rounded-lg border border-[#292C35] text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[#20232B]">
              <span className="text-[#858B9A]">Gaussian Curvature (K)</span>
              <span className="font-mono font-semibold text-[#69A3FF]">
                {geometry === 'euclidean'
                  ? 'K = 0.00'
                  : geometry === 'spherical'
                  ? 'K = +0.160 (+1/R²)'
                  : 'K = -1.000'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#20232B]">
              <span className="text-[#858B9A]">Manifold Type</span>
              <span className="font-mono text-[#E8EAF0]">
                {geometry === 'euclidean'
                  ? 'ℝ² Flat Plane'
                  : geometry === 'spherical'
                  ? 'S² Sphere (R = 2.5)'
                  : 'ℍ² Hyperbolic Space'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#20232B]">
              <span className="text-[#858B9A]">Placed Points</span>
              <span className="font-mono text-[#E8EAF0]">{points.length}</span>
            </div>
            <div className="pt-1">
              <div className="text-[10px] text-[#858B9A] uppercase tracking-wider font-mono">
                Distance Metric ds²
              </div>
              <div className="text-[11px] font-mono text-[#69A3FF] mt-0.5 break-all">
                {geometry === 'euclidean' && 'ds² = dx² + dy²'}
                {geometry === 'spherical' && 'ds² = R²(dθ² + sin²θ dφ²)'}
                {geometry === 'hyperbolic' && 'ds² = 4(dx² + dy²) / (1 - x² - y²)²'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Appearance Controls */}
      <div className="p-3.5">
        <button
          onClick={() => toggleSection('appearance')}
          className="w-full flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-[#858B9A] hover:text-[#E8EAF0] transition"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-[#69A3FF]" />
            <span>Appearance & Grid</span>
          </div>
          {openSections.appearance ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {openSections.appearance && (
          <div className="mt-2.5 space-y-3 bg-[#0D0F14] p-3 rounded-lg border border-[#292C35] text-xs">
            <div>
              <div className="flex justify-between text-xs text-[#858B9A] mb-1">
                <span>Particle Density</span>
                <span className="font-mono text-[#E8EAF0]">{appearance.particleCount}</span>
              </div>
              <input
                type="range"
                min={2000}
                max={12000}
                step={500}
                value={appearance.particleCount}
                onChange={(e) => setAppearance({ particleCount: parseInt(e.target.value) })}
                className="w-full accent-[#69A3FF] h-1.5 bg-[#1F2229] rounded cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-[#20232B] space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#858B9A]">Particle Surface</span>
                <input
                  type="checkbox"
                  checked={appearance.showSurface}
                  onChange={(e) => setAppearance({ showSurface: e.target.checked })}
                  className="accent-[#69A3FF] rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#858B9A]">Coordinate Grid</span>
                <input
                  type="checkbox"
                  checked={appearance.showGrid}
                  onChange={(e) => setAppearance({ showGrid: e.target.checked })}
                  className="accent-[#69A3FF] rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#858B9A]">Construction Lines</span>
                <input
                  type="checkbox"
                  checked={appearance.showConstruction}
                  onChange={(e) => setAppearance({ showConstruction: e.target.checked })}
                  className="accent-[#69A3FF] rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 6. Camera Controls */}
      <div className="p-3.5">
        <button
          onClick={() => toggleSection('camera')}
          className="w-full flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-[#858B9A] hover:text-[#E8EAF0] transition"
        >
          <div className="flex items-center gap-2">
            <Camera className="w-3.5 h-3.5 text-[#69A3FF]" />
            <span>Camera Controls</span>
          </div>
          {openSections.camera ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {openSections.camera && (
          <div className="mt-2.5 space-y-3 bg-[#0D0F14] p-3 rounded-lg border border-[#292C35] text-xs">
            <div>
              <div className="flex justify-between text-xs text-[#858B9A] mb-1">
                <span>Orbit Sensitivity</span>
                <span className="font-mono text-[#E8EAF0]">{orbitSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.1}
                value={orbitSensitivity}
                onChange={(e) => setOrbitSensitivity(parseFloat(e.target.value))}
                className="w-full accent-[#69A3FF] h-1.5 bg-[#1F2229] rounded cursor-pointer"
              />
            </div>
            <button
              onClick={resetCamera}
              className="w-full py-1.5 bg-[#181B22] hover:bg-[#202530] text-[#E8EAF0] rounded border border-[#292C35] flex items-center justify-center gap-1.5 font-medium transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#69A3FF]" />
              <span>Reset Camera</span>
            </button>
          </div>
        )}
      </div>

      {/* 7. Sound Toggle (Footer) */}
      <div className="p-3.5 mt-auto">
        <div className="bg-[#0D0F14] p-2.5 rounded-lg border border-[#292C35] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#69A3FF]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#858B9A]" />
            )}
            <div>
              <div className="text-xs font-semibold text-[#E8EAF0]">Procedural Audio</div>
              <div className="text-[10px] text-[#858B9A]">Web Audio synthesis</div>
            </div>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-2.5 py-1 text-xs font-medium rounded transition ${
              soundEnabled
                ? 'bg-[#69A3FF] text-[#090A0D] font-bold'
                : 'bg-[#181B22] text-[#858B9A] border border-[#292C35]'
            }`}
          >
            {soundEnabled ? 'Enabled' : 'Muted'}
          </button>
        </div>
      </div>
    </aside>
  );
};
