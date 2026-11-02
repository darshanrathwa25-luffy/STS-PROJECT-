import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGeometryStore, GeometryKind, HyperbolicRepresentation } from '../../store/geometryStore';
import { EuclideanScene } from '../../scenes/EuclideanScene';
import { SphericalScene } from '../../scenes/SphericalScene';
import { HyperbolicScene } from '../../scenes/HyperbolicScene';
import { PseudosphereScene } from '../../scenes/PseudosphereScene';
import { HyperbolicCompareView } from './HyperbolicCompareView';
import { RotateCcw, Info, Disc, Waves, Sparkles } from 'lucide-react';

export const GeometryCanvas: React.FC = () => {
  const {
    geometry,
    setGeometry,
    hyperbolicRepresentation,
    setHyperbolicRepresentation,
    instructionText,
    orbitSensitivity,
    cameraResetSeq,
    resetCamera,
    experiment,
  } = useGeometryStore();

  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Reset camera when sequence increments or geometry changes
  useEffect(() => {
    if (controlsRef.current) {
      if (geometry === 'spherical') {
        controlsRef.current.object.position.set(0, 2.5, 6.5);
      } else if (geometry === 'euclidean') {
        controlsRef.current.object.position.set(0, 8.5, 9.5);
      } else {
        if (hyperbolicRepresentation === 'pseudosphere') {
          controlsRef.current.object.position.set(0, 4, 6.5);
        } else {
          // Orthogonal view for Poincare disk
          controlsRef.current.object.position.set(0, 7.2, 7.2);
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
        </div>
        <HyperbolicCompareView />
      </div>
    );
  }

  const geometryTabs: { id: GeometryKind; label: string; sub: string }[] = [
    { id: 'euclidean', label: 'Euclidean', sub: 'Flat (K = 0)' },
    { id: 'spherical', label: 'Spherical', sub: 'Round (K > 0)' },
    { id: 'hyperbolic', label: 'Hyperbolic', sub: 'Curved (K < 0)' },
  ];

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

      {/* Floating Geometry Selector (Top Center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex bg-[#12141A]/95 backdrop-blur-md p-1 rounded-xl border border-[#292C35] shadow-panel">
        {geometryTabs.map((g) => {
          const active = geometry === g.id;
          return (
            <button
              key={g.id}
              onClick={() => setGeometry(g.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition flex flex-col items-center ${
                active
                  ? 'bg-[#181B22] text-[#69A3FF] border border-[#69A3FF]/40 font-semibold shadow-sm'
                  : 'text-[#858B9A] hover:text-[#E8EAF0] hover:bg-[#181B22]/40'
              }`}
            >
              <span className="font-bold tracking-wide">{g.label}</span>
              <span className="text-[9px] font-mono opacity-70">{g.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Hyperbolic Model Switcher (Pill beneath selector when in hyperbolic mode) */}
      {geometry === 'hyperbolic' && experiment !== 'tessellation' && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-10 flex bg-[#12141A]/90 backdrop-blur-md p-0.5 rounded-lg border border-[#292C35] text-[11px]">
          <button
            onClick={() => setHyperbolicRepresentation('poincare')}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition ${
              hyperbolicRepresentation === 'poincare'
                ? 'bg-[#181B22] text-[#69A3FF] font-semibold'
                : 'text-[#858B9A] hover:text-[#E8EAF0]'
            }`}
          >
            <Disc className="w-3 h-3" />
            <span>Poincaré Disk</span>
          </button>
          <button
            onClick={() => setHyperbolicRepresentation('pseudosphere')}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition ${
              hyperbolicRepresentation === 'pseudosphere'
                ? 'bg-[#181B22] text-[#69A3FF] font-semibold'
                : 'text-[#858B9A] hover:text-[#E8EAF0]'
            }`}
          >
            <Waves className="w-3 h-3" />
            <span>Pseudosphere</span>
          </button>
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
          <span>Reset</span>
        </button>
      </div>

      {/* Small Contextual Discovery Instruction (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none max-w-md">
        <div className="bg-[#12141A]/90 backdrop-blur-md border border-[#292C35] rounded-xl px-3.5 py-2.5 shadow-panel flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#69A3FF] shrink-0 mt-0.5" />
          <p className="text-xs text-[#E8EAF0] leading-snug font-medium font-sans">
            {instructionText}
          </p>
        </div>
      </div>
    </div>
  );
};
