import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGeometryStore } from '../../store/geometryStore';
import { EuclideanScene } from '../../scenes/EuclideanScene';
import { SphericalScene } from '../../scenes/SphericalScene';
import { HyperbolicScene } from '../../scenes/HyperbolicScene';

export const GeometryCanvas: React.FC = () => {
  const {
    world,
    orbitSensitivity,
    cameraResetSeq,
  } = useGeometryStore();

  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Reset camera when sequence increments or world changes
  useEffect(() => {
    if (controlsRef.current) {
      if (world === 'sphere') {
        controlsRef.current.object.position.set(0, 2.5, 6.5);
      } else if (world === 'flat') {
        controlsRef.current.object.position.set(0, 8.5, 9.5);
      } else {
        controlsRef.current.object.position.set(0, 5.0, 6.5);
      }
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [cameraResetSeq, world]);

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

        {/* Active World Geometry Scene */}
        {world === 'flat' && <EuclideanScene />}
        {world === 'sphere' && <SphericalScene />}
        {world === 'hyperbolic' && <HyperbolicScene />}
      </Canvas>
    </div>
  );
};
