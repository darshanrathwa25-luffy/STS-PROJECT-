import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { useGeometryStore } from '../store/geometryStore';
import {
  generateEuclideanLine,
  intersectEuclideanLines,
  degToRad,
} from '../geometry-engine';

export const EuclideanScene: React.FC = () => {
  const {
    points,
    appearance,
    preset,
    parallelExperiment,
    tool,
    addPoint,
    selectPoint,
    selectedPointId,
    updatePoint,
  } = useGeometryStore();

  const { particleCount, pointSize, showGrid, showSurface, showConstruction } = appearance;
  const { candidateAngleDeg, showFan } = parallelExperiment;

  // Particle plane geometry
  const particleGeo = useMemo(() => {
    const count = particleCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Regular grid with subtle organic spacing
    const side = Math.floor(Math.sqrt(count));
    const extent = 12.0;
    const step = (extent * 2) / side;

    let idx = 0;
    for (let i = 0; i < side; i++) {
      for (let j = 0; j < side; j++) {
        const x = -extent + i * step + (Math.random() - 0.5) * 0.05;
        const z = -extent + j * step + (Math.random() - 0.5) * 0.05;
        const y = 0;

        positions[idx * 3] = x;
        positions[idx * 3 + 1] = y;
        positions[idx * 3 + 2] = z;

        // Silver-white with subtle falloff from center
        const dist = Math.hypot(x, z);
        const alpha = Math.max(0.2, 1.0 - dist / (extent * 1.2));
        colors[idx * 3] = 0.88 * alpha;
        colors[idx * 3 + 1] = 0.92 * alpha;
        colors[idx * 3 + 2] = 1.0 * alpha;

        idx++;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [particleCount]);

  // Points material ref for subtle pulse
  const pointsMatRef = useRef<THREE.PointsMaterial>(null);
  useFrame(({ clock }) => {
    if (pointsMatRef.current) {
      pointsMatRef.current.opacity = 0.55 + Math.sin(clock.getElapsedTime() * 1.5) * 0.05;
    }
  });

  // Parallel lines experiment geometry
  const parallelData = useMemo(() => {
    if (preset !== 'parallel-lines') return null;

    // Reference line L along X-axis at z = 0
    const refCurve = generateEuclideanLine({ x: 0, y: 0 }, { x: 1, y: 0 }, 10, 80, 0.03);
    const refPoints = refCurve.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));

    // External point P at (0, 0, 2)
    const P = { x: 0, y: 2 };
    const p3D = new THREE.Vector3(0, 0.04, 2);

    // Active candidate line
    const angleRad = degToRad(candidateAngleDeg);
    const dir = { x: Math.cos(angleRad), y: Math.sin(angleRad) };
    const candCurve = generateEuclideanLine(P, dir, 10, 80, 0.04);
    const candPoints = candCurve.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));

    // Test intersection
    const intersection = intersectEuclideanLines({ x: 0, y: 0 }, { x: 1, y: 0 }, P, dir);
    const isParallel = intersection.type === 'none';

    let intPt3D: THREE.Vector3 | null = null;
    if (intersection.type === 'unique' && intersection.points[0]) {
      const pt = intersection.points[0] as { x: number; y: number };
      if (Math.abs(pt.x) < 14) {
        intPt3D = new THREE.Vector3(pt.x, 0.05, 0);
      }
    }

    // Fan of candidate lines
    const fanLines: THREE.Vector3[][] = [];
    if (showFan) {
      const fanAngles = [-60, -45, -30, -15, 0, 15, 30, 45, 60];
      for (const a of fanAngles) {
        if (Math.abs(a - candidateAngleDeg) > 2) {
          const r = degToRad(a);
          const d = { x: Math.cos(r), y: Math.sin(r) };
          const c = generateEuclideanLine(P, d, 9, 40, 0.02);
          fanLines.push(c.points.map((p) => new THREE.Vector3(p.x, p.y, p.z)));
        }
      }
    }

    return {
      refPoints,
      p3D,
      candPoints,
      isParallel,
      intPt3D,
      fanLines,
    };
  }, [preset, candidateAngleDeg, showFan]);

  // Click handler on plane
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return; // only left click
    if (tool === 'point') {
      e.stopPropagation();
      const p = e.point;
      addPoint({
        position: { x: p.x, y: 0.04, z: p.z },
        nativeCoords: { x: p.x, y: p.z },
        label: `P(${p.x.toFixed(1)}, ${p.z.toFixed(1)})`,
      });
    }
  };

  return (
    <group>
      {/* Invisible interaction ground plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerDown={handlePointerDown}
        visible={false}
      >
        <planeGeometry args={[30, 30]} />
        <meshBasicMaterial />
      </mesh>

      {/* Particle plane */}
      {showSurface && (
        <points geometry={particleGeo}>
          <pointsMaterial
            ref={pointsMatRef}
            size={pointSize}
            vertexColors
            transparent
            opacity={0.6}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      )}

      {/* Coordinate grid */}
      {showGrid && (
        <gridHelper
          args={[20, 20, 0x3a4254, 0x1a1e28]}
          position={[0, 0.01, 0]}
        />
      )}

      {/* Parallel lines experiment visualization */}
      {parallelData && showConstruction && (
        <group>
          {/* Reference Line L */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={parallelData.refPoints.length}
                array={new Float32Array(parallelData.refPoints.flatMap((v) => [v.x, v.y, v.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#E0E4EC" linewidth={2} />
          </line>

          {/* External Point P */}
          <mesh position={parallelData.p3D}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#69A3FF" />
          </mesh>

          {/* Point P subtle ring */}
          <mesh position={[parallelData.p3D.x, parallelData.p3D.y, parallelData.p3D.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 0.25, 24]} />
            <meshBasicMaterial color="#69A3FF" transparent opacity={0.6} />
          </mesh>

          {/* Fan candidate lines */}
          {parallelData.fanLines.map((fanPts, idx) => (
            <line key={idx}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={fanPts.length}
                  array={new Float32Array(fanPts.flatMap((v) => [v.x, v.y, v.z]))}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#4A5568" transparent opacity={0.35} />
            </line>
          ))}

          {/* Active Candidate Line */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={parallelData.candPoints.length}
                array={new Float32Array(parallelData.candPoints.flatMap((v) => [v.x, v.y, v.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={parallelData.isParallel ? '#06D6A0' : '#EF476F'}
              linewidth={2}
            />
          </line>

          {/* Intersection marker */}
          {parallelData.intPt3D && (
            <mesh position={parallelData.intPt3D}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshBasicMaterial color="#EF476F" />
            </mesh>
          )}
        </group>
      )}

      {/* User placed points */}
      {points.map((pt) => {
        const isSelected = pt.id === selectedPointId;
        return (
          <group key={pt.id} position={[pt.position.x, pt.position.y, pt.position.z]}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                selectPoint(pt.id);
              }}
            >
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshBasicMaterial color={isSelected ? '#69A3FF' : '#E0E4EC'} />
            </mesh>
            {isSelected && (
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.2, 0.25, 24]} />
                <meshBasicMaterial color="#69A3FF" transparent opacity={0.8} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

