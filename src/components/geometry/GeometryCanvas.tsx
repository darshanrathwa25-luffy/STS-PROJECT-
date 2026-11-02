import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGeometryStore, HyperbolicRepresentation } from '../../store/geometryStore';
import { EuclideanScene } from '../../scenes/EuclideanScene';
import { SphericalScene } from '../../scenes/SphericalScene';
import { HyperbolicScene } from '../../scenes/HyperbolicScene';
import { PseudosphereScene } from '../../scenes/PseudosphereScene';
import { HyperbolicCompareView } from './HyperbolicCompareView';
import { RotateCcw, Info, AlertTriangle, Layers, Disc, Waves, Columns } from 'lucide-react';

export const GeometryCanvas: React.FC = () => {
  const {
    geometry,
    hyperbolicRepresentation,
    setHyperbolicRepresentation,
    instructionText,
    orbitSensitivity,
    cameraResetSeq,
    resetCamera,
  } = useGeometryStore();

  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Reset camera when sequence increments or geometry changes
  useEffect(() => {
    if (controlsRef.current) {
      if (geometry === 'spherical') {
        controlsRef.current.object.position.set(0, 2.5, 6.5);
      } else if (geometry === 'euclidean') {
        controlsRef.current.object.position.set(0, 9, 11);
      } else {
        if (hyperbolicRepresentation === 'pseudosphere') {
          controlsRef.current.object.position.set(0, 4, 6.5);
        } else {
          controlsRef.current.object.position.set(0, 7.5, 7.5);
        }
      }
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [cameraResetSeq, geometry, hyperbolicRepresentation]);

  // If user chose dual hyperbolic representation compare mode
  if (geometry === 'hyperbolic' && hyperbolicRepresentation === 'compare') {
    return (
      <div className="relative w-full h-full">
        {/* Floating Representation Switcher */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex bg-[#12141A]/95 backdrop-blur-md p-1 rounded-lg border border-[#292C35] shadow-panel">
          <button
            onClick={() => setHyperbolicRepresentation('poincare')}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#858B9A] hover:text-[#E8EAF0] rounded"
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Poincaré Disk</span>
          </button>
          <button
            onClick={() => setHyperbolicRepresentation('pseudosphere')}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#858B9A] hover:text-[#E8EAF0] rounded"
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Curved Surface</span>
          </button>
          <button
            onClick={() => setHyperbolicRepresentation('compare')}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-[#181B22] text-[#69A3FF] border border-[#69A3FF]/40 rounded font-semibold"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Compare</span>
          </button>
        </div>
        <HyperbolicCompareView />
      </div>
    );
  }

  const curvatureLabel =
    geometry === 'euclidean'
      ? { k: 'K = 0', name: 'Zero Curvature', sub: 'Flat Manifold' }
      : geometry === 'spherical'
      ? { k: 'K = +1/R²', name: 'Positive Curvature', sub: 'Elliptic Manifold (R = 2.5)' }
      : hyperbolicRepresentation === 'pseudosphere'
      ? { k: 'K = -1/R²', name: 'Negative Curvature', sub: 'Pseudosphere (Local 3D Embedding)' }
      : { k: 'K = -1', name: 'Negative Curvature', sub: 'Hyperbolic Poincaré Disk (Conformal)' };

  return (
    <div className="relative w-full h-full bg-[#090A0D] overflow-hidden select-none">
      {/* Three.js R3F Canvas */}
      <Canvas
        camera={{ position: [0, 6, 7.5], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#090A0D' }}
      >
        <color attach="background" args={['#090A0D']} />

        {/* Ambient & Directional Lights */}
        <ambientLight intensity={0.65} />
        <directionalLight position={[10, 15, 10]} intensity={0.8} />
        <directionalLight position={[-10, -10, -5]} intensity={0.25} color="#69A3FF" />

        {/* Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.7 * orbitSensitivity}
          zoomSpeed={0.8}
          panSpeed={0.6}
          minDistance={1.8}
          maxDistance={25}
        />

        {/* Geometry Scenes */}
        {geometry === 'euclidean' && <EuclideanScene />}
        {geometry === 'spherical' && <SphericalScene />}
        {geometry === 'hyperbolic' && (
          hyperbolicRepresentation === 'pseudosphere' ? <PseudosphereScene /> : <HyperbolicScene />
        )}
      </Canvas>

      {/* Floating Curvature Badge (Top-Left) */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="bg-[#12141A]/85 backdrop-blur-md border border-[#292C35] rounded-lg px-3 py-2 shadow-panel">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#69A3FF] animate-pulse" />
            <span className="text-xs font-mono font-bold text-[#E8EAF0]">{curvatureLabel.k}</span>
            <span className="text-[11px] text-[#858B9A] border-l border-[#292C35] pl-2">{curvatureLabel.name}</span>
          </div>
          <div className="text-[10px] text-[#858B9A] font-mono mt-0.5">{curvatureLabel.sub}</div>
        </div>
      </div>

      {/* Hyperbolic Representation Selector (Top Center) */}
      {geometry === 'hyperbolic' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex bg-[#12141A]/90 backdrop-blur-md p-1 rounded-lg border border-[#292C35] shadow-panel">
          <button
            onClick={() => setHyperbolicRepresentation('poincare')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition ${
              hyperbolicRepresentation === 'poincare'
                ? 'bg-[#181B22] text-[#69A3FF] border border-[#69A3FF]/40 font-semibold'
                : 'text-[#858B9A] hover:text-[#E8EAF0]'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Poincaré Disk</span>
          </button>
          <button
            onClick={() => setHyperbolicRepresentation('pseudosphere')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition ${
              hyperbolicRepresentation === 'pseudosphere'
                ? 'bg-[#181B22] text-[#69A3FF] border border-[#69A3FF]/40 font-semibold'
                : 'text-[#858B9A] hover:text-[#E8EAF0]'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Curved Surface</span>
          </button>
          <button
            onClick={() => setHyperbolicRepresentation('compare')}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#858B9A] hover:text-[#E8EAF0] rounded transition"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Compare</span>
          </button>
        </div>
      )}

      {/* Floating Scientific Warning on Pseudosphere */}
      {geometry === 'hyperbolic' && hyperbolicRepresentation === 'pseudosphere' && (
        <div className="absolute top-16 left-4 z-10 max-w-sm pointer-events-none">
          <div className="bg-[#12141A]/90 backdrop-blur-md border border-amber-500/40 rounded-lg p-2.5 shadow-panel text-xs">
            <div className="flex items-center gap-1.5 font-mono font-bold text-amber-400 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>LOCAL EMBEDDING — PARTIAL MODEL</span>
            </div>
            <p className="text-[11px] text-[#858B9A] mt-1 leading-snug font-sans">
              Hilbert's Theorem (1901) proves that no complete, smooth surface of constant negative curvature can exist in Euclidean 3D space. The pseudosphere is only a local patch with a cuspidal singularity at its rim. The Poincaré disk remains the authoritative global metric.
            </p>
          </div>
        </div>
      )}

      {/* Camera Reset (Top-Right) */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={resetCamera}
          className="bg-[#12141A]/80 hover:bg-[#181B22] text-[#858B9A] hover:text-[#E8EAF0] border border-[#292C35] rounded-lg p-2 transition shadow-panel backdrop-blur-md flex items-center gap-1.5 text-xs font-medium"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset View</span>
        </button>
      </div>

      {/* Contextual Interaction Hint (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none max-w-md">
        <div className="bg-[#12141A]/90 backdrop-blur-md border border-[#292C35] rounded-lg px-3 py-2 shadow-panel flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#69A3FF] shrink-0 mt-0.5" />
          <p className="text-xs text-[#E8EAF0] leading-snug font-sans">
            {instructionText}
          </p>
        </div>
      </div>
    </div>
  );
};
