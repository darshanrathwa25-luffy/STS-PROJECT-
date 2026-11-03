import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGeometryStore } from '../../store/geometryStore';
import { SphericalTriangleScene } from './SphericalTriangleScene';
import { SaddleTriangleScene } from './SaddleTriangleScene';
import { saddlePosition } from '../../geometry-engine';
import { palette } from '../../theme/palette';

/**
 * The sphere and saddle triangle pages. Kept in its own module so Three.js is only
 * downloaded when one of those pages opens (TriangleLabStage loads it lazily).
 */
const TriangleCanvas3D: React.FC = () => {
  const { world, orbitSensitivity, cameraResetSeq, isDragging } = useGeometryStore();

  // State rather than a ref, so framing re-runs once the controls exist (e.g. on a direct link)
  const [controls, setControls] = useState<OrbitControlsImpl | null>(null);

  // Camera orientation & reset: frame the current triangle rather than a fixed spot
  useEffect(() => {
    if (!controls) return;
    const { sphereTriangle: s, saddleTriangle: h } = useGeometryStore.getState();
    if (world === 'sphere') {
      // Look at the sphere from the direction of the triangle's centroid
      const cx = s.p1.x + s.p2.x + s.p3.x;
      const cy = s.p1.y + s.p2.y + s.p3.y;
      const cz = s.p1.z + s.p2.z + s.p3.z;
      const len = Math.hypot(cx, cy, cz) || 1;
      const dist = 7.0;
      controls.object.position.set((cx / len) * dist, (cy / len) * dist, (cz / len) * dist);
      controls.target.set(0, 0, 0);
    } else if (world === 'hyperbolic') {
      // Orbit around the triangle's centroid on the surface (scene is y-up)
      const u = (h.p1.x + h.p2.x + h.p3.x) / 3;
      const v = (h.p1.y + h.p2.y + h.p3.y) / 3;
      const c = saddlePosition(u, v);
      controls.target.set(c.x, c.z, c.y);
      controls.object.position.set(c.x + 0.6, c.z + 3.6, c.y + 4.4);
    }
    controls.update();
  }, [cameraResetSeq, world, controls]);

  return (
    <Canvas camera={{ position: [0, 4.0, 5.5], fov: 45 }} gl={{ antialias: true, alpha: false }} style={{ background: palette.paper }}>
      <color attach="background" args={[palette.paper]} />

      {/* Soft studio light: the surfaces should read like printed figures */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[6, 10, 8]} intensity={0.7} />
      <directionalLight position={[-8, -4, -6]} intensity={0.2} />

      {/* Orbit Controls (Disabled while dragging a vertex to prevent camera conflict) */}
      <OrbitControls
        ref={setControls}
        makeDefault
        enabled={!isDragging}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.7 * orbitSensitivity}
        zoomSpeed={0.8}
        enablePan={false}
        minDistance={2.0}
        maxDistance={15.0}
      />

      {world === 'sphere' && <SphericalTriangleScene />}
      {world === 'hyperbolic' && <SaddleTriangleScene />}
    </Canvas>
  );
};

export default TriangleCanvas3D;
