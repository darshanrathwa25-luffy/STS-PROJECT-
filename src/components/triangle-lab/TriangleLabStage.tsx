import React, { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGeometryStore } from '../../store/geometryStore';
import { FlatTriangleView } from './FlatTriangleView';
import { SphericalTriangleScene } from './SphericalTriangleScene';
import { SaddleTriangleScene } from './SaddleTriangleScene';
import { TriangleHUD } from './TriangleHUD';
import {
  euclideanTriangle,
  sphericalTriangle,
  saddleTriangle,
  DEFAULT_SPHERE_RADIUS,
} from '../../geometry-engine';

export const TriangleLabStage: React.FC = () => {
  const {
    world,
    orbitSensitivity,
    cameraResetSeq,
    isDragging,
    cycleSelectedVertex,
    nudgeSelectedVertex,
    flatTriangle,
    sphereTriangle,
    saddleTriangle: hTri,
    markQuestionSolved,
    solvedQuestions,
  } = useGeometryStore();

  const controlsRef = useRef<OrbitControlsImpl>(null);

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

  // Camera orientation & reset
  useEffect(() => {
    if (controlsRef.current) {
      if (world === 'sphere') {
        controlsRef.current.object.position.set(0, 1.5, 5.8);
      } else if (world === 'hyperbolic') {
        controlsRef.current.object.position.set(0, 4.2, 5.0);
      }
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [cameraResetSeq, world]);

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
    <div className="relative w-full h-full bg-[#090A0D] overflow-hidden select-none">
      {/* Dynamic Triangle HUD */}
      <TriangleHUD />

      {/* World Stage Display */}
      {world === 'flat' ? (
        // 1. Flat Euclidean World: Pure SVG Top-Down Renderer
        <FlatTriangleView />
      ) : (
        // 2 & 3. 3D Worlds: R3F Canvas for Sphere & Hyperbolic Saddle
        <Canvas
          camera={{ position: [0, 4.0, 5.5], fov: 45 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: '#090A0D' }}
        >
          <color attach="background" args={['#090A0D']} />

          {/* Lighting */}
          <ambientLight intensity={0.65} />
          <directionalLight position={[10, 15, 10]} intensity={0.85} />
          <directionalLight position={[-10, -5, -8]} intensity={0.3} color="#69A3FF" />

          {/* Orbit Controls (Disabled while dragging a vertex to prevent camera conflict) */}
          <OrbitControls
            ref={controlsRef}
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

      {/* Keyboard Accessibility Hint Pill */}
      <div className="absolute bottom-3 left-4 z-10 pointer-events-none hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#12141A]/80 border border-[#292C35]/60 text-[10px] font-mono text-[#858B9A]">
        <span>Tab: cycle vertex</span>
        <span>•</span>
        <span>Arrow keys: nudge</span>
      </div>
    </div>
  );
};
