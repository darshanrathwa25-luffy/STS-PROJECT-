import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGeometryStore } from '../../store/geometryStore';
import { DEFAULT_SPHERE_RADIUS, sphericalCirclePoints } from '../../geometry-engine';
import { palette, worldColor } from '../../theme/palette';

const R = DEFAULT_SPHERE_RADIUS;
/** The circle is centred on the North Pole, so its edge is a line of latitude moving down the globe. */
const CENTRE = { x: 0, y: R, z: 0 };

const graticule = (() => {
  const lines: [number, number, number][][] = [];
  for (let deg = 0; deg < 180; deg += 30) {
    const rad = (deg * Math.PI) / 180;
    lines.push(
      Array.from({ length: 65 }, (_, t) => {
        const phi = (t / 64) * 2 * Math.PI;
        return [R * Math.cos(phi) * Math.sin(rad), R * Math.sin(phi), R * Math.cos(phi) * Math.cos(rad)] as [number, number, number];
      })
    );
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const phi = (lat * Math.PI) / 180;
    lines.push(
      Array.from({ length: 65 }, (_, t) => {
        const theta = (t / 64) * 2 * Math.PI;
        return [R * Math.cos(phi) * Math.cos(theta), R * Math.sin(phi), R * Math.cos(phi) * Math.sin(theta)] as [number, number, number];
      })
    );
  }
  return lines;
})();

const SphereCircleScene: React.FC<{ follow: boolean; onUserTurn: () => void }> = ({ follow, onUserTurn }) => {
  const r = useGeometryStore((s) => s.circles.sphere);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;

  // Once the reader turns the globe themselves, stop moving the camera for them
  useEffect(() => {
    if (!controls) return;
    controls.addEventListener('start', onUserTurn);
    return () => controls.removeEventListener('start', onUserTurn);
  }, [controls, onUserTurn]);

  // Follow the circle's edge: look from a little above the latitude it has reached,
  // so the ring stays in view all the way down to the South Pole
  useEffect(() => {
    if (!controls || !follow) return;
    const latitude = Math.PI / 2 - r / R;
    const elevation = Math.min((42 * Math.PI) / 180, Math.max((-40 * Math.PI) / 180, latitude + (25 * Math.PI) / 180));
    const dist = 7.6;
    controls.object.position.set(0, dist * Math.sin(elevation), dist * Math.cos(elevation));
    controls.target.set(0, 0, 0);
    controls.update();
  }, [r, controls, follow]);

  // The disc inside the circle (a spherical cap), built ring by ring so it hugs the sphere
  const cap = useMemo(() => {
    const rings = 32;
    const around = 96;
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= rings; i++) {
      const ring = i === 0 ? [CENTRE] : sphericalCirclePoints(CENTRE, (r * i) / rings, R * 1.004, around);
      for (let j = 0; j <= around; j++) {
        const p = ring[Math.min(j, ring.length - 1)];
        const k = i === 0 ? 1.004 : 1;
        positions.push(p.x * k, p.y * k, p.z * k);
      }
    }
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < around; j++) {
        const a = i * (around + 1) + j;
        const b = (i + 1) * (around + 1) + j;
        indices.push(a, b, b + 1, a, b + 1, a + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    return geo;
  }, [r]);

  const edge = useMemo(
    () => sphericalCirclePoints(CENTRE, r, R * 1.014, 128).map((p) => [p.x, p.y, p.z] as [number, number, number]),
    [r]
  );

  // The radius, drawn along the meridian facing the camera
  const radius = useMemo(
    () =>
      Array.from({ length: 41 }, (_, i) => {
        const a = (r / R) * (i / 40);
        return [0, R * 1.016 * Math.cos(a), R * 1.016 * Math.sin(a)] as [number, number, number];
      }),
    [r]
  );

  return (
    <group>
      <mesh>
        <sphereGeometry args={[R * 0.998, 64, 64]} />
        <meshStandardMaterial color={palette.paperRaised} emissive={palette.paperSunk} emissiveIntensity={0.55} roughness={1} metalness={0} />
      </mesh>
      {graticule.map((pts, i) => (
        <Line key={i} points={pts} color={palette.ruleStrong} lineWidth={0.8} transparent opacity={0.7} />
      ))}
      <mesh geometry={cap}>
        <meshBasicMaterial
          color={worldColor.sphere}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
      <Line points={edge} color={palette.ink} lineWidth={2.4} />
      <Line points={radius} color={palette.ink} lineWidth={1.5} dashed dashSize={0.1} gapSize={0.07} />
      <mesh position={[0, R * 1.008, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color={palette.ink} />
      </mesh>
    </group>
  );
};

/** The sphere circle page: its own canvas, loaded only when the page opens. */
const SphereCircleCanvas: React.FC = () => {
  const orbitSensitivity = useGeometryStore((s) => s.orbitSensitivity);
  // The camera follows the circle until the reader turns the globe by hand
  const [follow, setFollow] = useState(true);
  const stopFollowing = React.useCallback(() => setFollow(false), []);

  return (
  <div className="absolute inset-0 bg-paper">
    <Canvas camera={{ position: [0, 2.8, 6.8], fov: 45 }} gl={{ antialias: true }} style={{ background: palette.paper }}>
      <color attach="background" args={[palette.paper]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[6, 10, 8]} intensity={0.7} />
      <directionalLight position={[-8, -4, -6]} intensity={0.2} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.7 * orbitSensitivity}
        enablePan={false}
        minDistance={4}
        maxDistance={14}
      />
      <SphereCircleScene follow={follow} onUserTurn={stopFollowing} />
    </Canvas>
    <p className="absolute bottom-3 left-4 right-4 pointer-events-none text-[12px] text-ink-muted">
      The circle is centred on the North Pole. Drag to turn the globe; use the slider to change the radius.
    </p>
    {!follow && (
      <button
        type="button"
        onClick={() => setFollow(true)}
        className="absolute top-3 right-3 text-[12px] px-2.5 py-1 border border-rule-strong rounded-sm bg-paper-raised text-ink hover:bg-paper-sunk"
      >
        Follow the circle again
      </button>
    )}
  </div>
  );
};

export default SphereCircleCanvas;
