import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { HyperbolicScene } from '../../scenes/HyperbolicScene';
import { PseudosphereScene } from '../../scenes/PseudosphereScene';
import { Info, AlertTriangle } from 'lucide-react';

export const HyperbolicCompareView: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col bg-[#090A0D] select-none">
      {/* Contextual STS Explanation Banner */}
      <div className="bg-[#12141A] border-b border-[#292C35] px-4 py-2.5 flex items-center justify-between text-xs text-[#E8EAF0] z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#69A3FF] shrink-0" />
          <span className="leading-snug">
            <strong className="text-[#69A3FF]">Dual Representation:</strong> Both visualizations help us understand negative curvature, but they represent different aspects of the same mathematical idea. The Poincaré disk defines a complete coordinate model; the pseudosphere shows a local 3D embedding.
          </span>
        </div>
      </div>

      {/* Side-by-Side Viewports */}
      <div className="flex-1 grid grid-cols-2 divide-x divide-[#292C35] relative overflow-hidden">
        {/* Left Viewport: Poincaré Disk Model */}
        <div className="relative w-full h-full overflow-hidden">
          <div className="absolute top-3 left-3 z-10 bg-[#12141A]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#292C35] shadow-panel">
            <div className="text-xs font-mono font-bold text-[#69A3FF]">POINCARÉ DISK MODEL</div>
            <div className="text-[10px] text-[#858B9A]">Complete Conformal Coordinate Model (K = -1)</div>
          </div>

          <Canvas camera={{ position: [0, 6.5, 6.5], fov: 45 }} style={{ background: '#090A0D' }}>
            <ambientLight intensity={0.65} />
            <directionalLight position={[10, 15, 10]} intensity={0.8} />
            <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
            <HyperbolicScene />
          </Canvas>
        </div>

        {/* Right Viewport: 3D Pseudosphere / Tractricoid */}
        <div className="relative w-full h-full overflow-hidden">
          <div className="absolute top-3 left-3 z-10 bg-[#12141A]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#292C35] shadow-panel">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#FFD166]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>LOCAL EMBEDDING — PARTIAL MODEL</span>
            </div>
            <div className="text-[10px] text-[#858B9A]">Tractricoid Surface (K = -1/R²) · Hilbert Singularity at Edge</div>
          </div>

          <Canvas camera={{ position: [0, 4, 6], fov: 45 }} style={{ background: '#090A0D' }}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 15, 10]} intensity={0.9} />
            <directionalLight position={[-10, -5, -5]} intensity={0.3} color="#69A3FF" />
            <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
            <PseudosphereScene />
          </Canvas>
        </div>
      </div>
    </div>
  );
};

