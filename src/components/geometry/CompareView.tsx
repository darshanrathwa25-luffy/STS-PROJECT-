import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GeometryKind } from '../../geometry-engine';
import { EuclideanScene } from '../../scenes/EuclideanScene';
import { SphericalScene } from '../../scenes/SphericalScene';
import { HyperbolicScene } from '../../scenes/HyperbolicScene';

export const CompareView: React.FC = () => {
  const [leftGeom, setLeftGeom] = useState<GeometryKind>('euclidean');
  const [rightGeom, setRightGeom] = useState<GeometryKind>('hyperbolic');

  const renderScene = (geom: GeometryKind) => {
    switch (geom) {
      case 'euclidean':
        return <EuclideanScene />;
      case 'spherical':
        return <SphericalScene />;
      case 'hyperbolic':
        return <HyperbolicScene />;
    }
  };

  const getBadge = (geom: GeometryKind) => {
    switch (geom) {
      case 'euclidean':
        return { k: 'K = 0', name: 'Euclidean Space (Flat)' };
      case 'spherical':
        return { k: 'K = +1/R²', name: 'Spherical Space (Positive)' };
      case 'hyperbolic':
        return { k: 'K = -1', name: 'Hyperbolic Space (Negative)' };
    }
  };

  const leftBadge = getBadge(leftGeom);
  const rightBadge = getBadge(rightGeom);

  return (
    <div className="w-full h-full grid grid-cols-2 bg-[#090A0D] divide-x divide-[#292C35] relative">
      {/* Left Viewport */}
      <div className="relative w-full h-full overflow-hidden">
        {/* Selector Header */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#12141A]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#292C35]">
          {(['euclidean', 'spherical', 'hyperbolic'] as GeometryKind[]).map((g) => (
            <button
              key={g}
              onClick={() => setLeftGeom(g)}
              className={`px-2 py-0.5 text-xs font-mono capitalize rounded ${
                leftGeom === g ? 'bg-[#181B22] text-[#69A3FF] border border-[#69A3FF]/40 font-semibold' : 'text-[#858B9A] hover:text-[#E8EAF0]'
              }`}
            >
              {g}
            </button>
          ))}
          <span className="text-[11px] font-mono text-[#E8EAF0] pl-2 border-l border-[#292C35]">{leftBadge.k}</span>
        </div>

        <Canvas camera={{ position: [0, 6, 8], fov: 45 }} style={{ background: '#090A0D' }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 15, 10]} intensity={0.8} />
          <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
          {renderScene(leftGeom)}
        </Canvas>
      </div>

      {/* Right Viewport */}
      <div className="relative w-full h-full overflow-hidden">
        {/* Selector Header */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#12141A]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#292C35]">
          {(['euclidean', 'spherical', 'hyperbolic'] as GeometryKind[]).map((g) => (
            <button
              key={g}
              onClick={() => setRightGeom(g)}
              className={`px-2 py-0.5 text-xs font-mono capitalize rounded ${
                rightGeom === g ? 'bg-[#181B22] text-[#69A3FF] border border-[#69A3FF]/40 font-semibold' : 'text-[#858B9A] hover:text-[#E8EAF0]'
              }`}
            >
              {g}
            </button>
          ))}
          <span className="text-[11px] font-mono text-[#E8EAF0] pl-2 border-l border-[#292C35]">{rightBadge.k}</span>
        </div>

        <Canvas camera={{ position: [0, 6, 8], fov: 45 }} style={{ background: '#090A0D' }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 15, 10]} intensity={0.8} />
          <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
          {renderScene(rightGeom)}
        </Canvas>
      </div>
    </div>
  );
};

