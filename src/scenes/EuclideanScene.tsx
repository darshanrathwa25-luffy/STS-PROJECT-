import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';
import { useGeometryStore } from '../store/geometryStore';
import {
  generateEuclideanLine,
  intersectEuclideanLines,
  degToRad,
} from '../geometry-engine';
import { palette } from '../theme/palette';

const SceneLabel: React.FC<{ position: [number, number, number]; children: React.ReactNode }> = ({ position, children }) => (
  <Html position={position} center className="pointer-events-none select-none">
    <span className="font-serif italic text-[20px] leading-none text-ink">{children}</span>
  </Html>
);

export const EuclideanScene: React.FC = () => {
  const {
    points,
    appearance,
    experiment,
    parallelExperiment,
    tool,
    addPoint,
    selectPoint,
    selectedPointId,
  } = useGeometryStore();

  const { showGrid, showConstruction } = appearance;
  const { candidateAngleDeg, showFan } = parallelExperiment;



  // Parallel lines experiment geometry
  const parallelData = useMemo(() => {
    if (experiment !== 'parallel-lines') return null;

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
  }, [experiment, candidateAngleDeg, showFan]);

  // Triangle lines in Euclidean space
  const triangleData = useMemo(() => {
    if (experiment !== 'triangle' || points.length < 3) return null;
    const pA = new THREE.Vector3(points[0].position.x, 0.04, points[0].position.z);
    const pB = new THREE.Vector3(points[1].position.x, 0.04, points[1].position.z);
    const pC = new THREE.Vector3(points[2].position.x, 0.04, points[2].position.z);
    return [pA, pB, pC, pA];
  }, [experiment, points]);

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

      {/* Coordinate grid */}
      {showGrid && (
        <gridHelper
          args={[20, 20, palette.ruleStrong, palette.rule]}
          position={[0, 0.01, 0]}
        />
      )}

      {/* Parallel lines experiment visualization */}
      {parallelData && showConstruction && (
        <group>
          {/* Reference Line L */}
          <Line points={parallelData.refPoints} color={palette.ink} lineWidth={3} />

          <SceneLabel position={[5.2, 0.05, -0.45]}>L</SceneLabel>
          <SceneLabel position={[0.45, 0.05, 2.35]}>P</SceneLabel>

          {/* External Point P */}
          <mesh position={parallelData.p3D}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color={palette.blue} />
          </mesh>

          {/* Point P subtle ring */}
          <mesh position={[parallelData.p3D.x, parallelData.p3D.y, parallelData.p3D.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 0.25, 24]} />
            <meshBasicMaterial color={palette.blue} transparent opacity={0.6} />
          </mesh>

          {/* Fan candidate lines */}
          {parallelData.fanLines.map((fanPts, idx) => (
            <Line key={idx} points={fanPts} color={palette.ruleStrong} lineWidth={1.4} transparent opacity={0.35} />
          ))}

          {/* Active Candidate Line */}
          <Line points={parallelData.candPoints} color={parallelData.isParallel ? palette.blue : palette.red} lineWidth={3} />

          {/* Intersection marker */}
          {parallelData.intPt3D && (
            <mesh position={parallelData.intPt3D}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshBasicMaterial color={palette.red} />
            </mesh>
          )}
        </group>
      )}

      {/* Triangle experiment visualization */}
      {triangleData && showConstruction && (
        <group>
          <Line points={triangleData} color={palette.blue} lineWidth={3} />
        </group>
      )}

      {/* User placed points */}
      {experiment !== 'parallel-lines' && points.map((pt) => {
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
              <meshBasicMaterial color={isSelected ? palette.blue : palette.ink} />
            </mesh>
            {isSelected && (
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.2, 0.25, 24]} />
                <meshBasicMaterial color={palette.blue} transparent opacity={0.8} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

