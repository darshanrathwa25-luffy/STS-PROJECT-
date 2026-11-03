import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGeometryStore } from '../../store/geometryStore';
import { EuclideanScene } from '../../scenes/EuclideanScene';
import { SphericalScene } from '../../scenes/SphericalScene';
import { palette } from '../../theme/palette';

/** The flat and sphere parallel-lines pages, in 3D. Loaded lazily by GeometryCanvas. */
const ParallelCanvas3D: React.FC = () => {
  const { world, orbitSensitivity, cameraResetSeq } = useGeometryStore();
  // State rather than a ref, so framing re-runs once the controls exist (e.g. on a direct link)
  const [controls, setControls] = useState<OrbitControlsImpl | null>(null);

  useEffect(() => {
    if (!controls) return;
    if (world === 'sphere') {
      controls.object.position.set(0, 2.5, 6.5);
    } else {
      controls.object.position.set(0, 8.5, 9.5);
    }
    controls.target.set(0, 0, 0);
    controls.update();
  }, [cameraResetSeq, world, controls]);

  return (
    <div className="relative w-full h-full bg-paper overflow-hidden select-none">
      <Canvas camera={{ position: [0, 6, 7.5], fov: 45 }} gl={{ antialias: true, alpha: false }} style={{ background: palette.paper }}>
        <color attach="background" args={[palette.paper]} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[10, 15, 10]} intensity={0.8} />
        <directionalLight position={[-10, -10, -5]} intensity={0.2} />
        <OrbitControls
          ref={setControls}
          makeDefault
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.7 * orbitSensitivity}
          zoomSpeed={0.8}
          panSpeed={0.6}
          minDistance={1.8}
          maxDistance={25}
        />
        {world === 'flat' && <EuclideanScene />}
        {world === 'sphere' && <SphericalScene />}
      </Canvas>
    </div>
  );
};

export default ParallelCanvas3D;
