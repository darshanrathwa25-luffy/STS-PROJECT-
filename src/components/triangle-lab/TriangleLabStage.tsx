import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGeometryStore } from '../../store/geometryStore';
import { FlatTriangleView } from './FlatTriangleView';
import { SphericalTriangleScene } from './SphericalTriangleScene';
import { SaddleTriangleScene } from './SaddleTriangleScene';
import {
  sphericalTriangle,
  saddleTriangle,
  saddlePosition,
  DEFAULT_SPHERE_RADIUS,
} from '../../geometry-engine';
import { palette } from '../../theme/palette';

export const TriangleLabStage: React.FC = () => {
  const {
    world,
    orbitSensitivity,
    cameraResetSeq,
    isDragging,
    cycleSelectedVertex,
    nudgeSelectedVertex,
    sphereTriangle,
    saddleTriangle: hTri,
    markQuestionSolved,
    solvedQuestions,
  } = useGeometryStore();

  // State rather than a ref, so framing re-runs once the controls exist (e.g. on a direct link)
  const [controls, setControls] = useState<OrbitControlsImpl | null>(null);

  // Keyboard navigation: Tab to cycle vertices, Arrow keys to nudge
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in reflection notes or an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        cycleSelectedVertex(e.shiftKey);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        nudgeSelectedVertex(0, 0.05);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nudgeSelectedVertex(0, -0.05);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nudgeSelectedVertex(-0.05, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nudgeSelectedVertex(0.05, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleSelectedVertex, nudgeSelectedVertex]);

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

  // Automated Question Solve Detection:
  // Q1 Sphere: solved when angle sum > 185°
  // Q2 Hyperbolic: solved when angle sum < 175°
  // Q3 Flat: solved when explored
  useEffect(() => {
    if (world === 'sphere' && !solvedQuestions['tri_sphere']) {
      const tri = sphericalTriangle(sphereTriangle.p1, sphereTriangle.p2, sphereTriangle.p3, DEFAULT_SPHERE_RADIUS);
      if (tri.angleSumDeg > 185) {
        markQuestionSolved('tri_sphere', true);
      }
    } else if (world === 'hyperbolic' && !solvedQuestions['tri_hyperbolic']) {
      const tri = saddleTriangle(hTri.p1, hTri.p2, hTri.p3);
      if (tri.angleSumDeg < 175 && !tri.degenerate) {
        markQuestionSolved('tri_hyperbolic', true);
      }
    }
  }, [world, sphereTriangle, hTri, solvedQuestions, markQuestionSolved]);

  return (
    <div className="absolute inset-0 bg-paper overflow-hidden select-none">
      {/* World Stage Display */}
      {world === 'flat' ? (
        // 1. Flat Euclidean World: Pure SVG Top-Down Renderer
        <FlatTriangleView />
      ) : (
        // 2 & 3. 3D Worlds: R3F Canvas for Sphere & Hyperbolic Saddle
        <Canvas
          camera={{ position: [0, 4.0, 5.5], fov: 45 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: palette.paper }}
        >
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

          {/* 3D Geometry Scenes */}
          {world === 'sphere' && <SphericalTriangleScene />}
          {world === 'hyperbolic' && <SaddleTriangleScene />}
        </Canvas>
      )}

      {/* Interaction hint */}
      <p className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none hidden md:block text-[12px] text-ink-muted">
        Drag a corner{world !== 'flat' && ', or drag the background to turn the view'}.{' '}
        <kbd className="font-mono text-[11px] px-1 border border-rule rounded-sm bg-paper-raised">Tab</kbd> picks a corner,{' '}
        <kbd className="font-mono text-[11px] px-1 border border-rule rounded-sm bg-paper-raised">←↑→↓</kbd> nudge it.
      </p>
    </div>
  );
};
