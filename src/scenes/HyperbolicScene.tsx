import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';
import { useGeometryStore } from '../store/geometryStore';
import {
  computeGeodesicThroughPointAndAngle,
  computeGeodesicThroughPoints,
  generateHyperbolicGeodesicCurve,
  generateHyperbolicSegment,
  intersectHyperbolicGeodesics,
  angleOfParallelism,
  hyperbolicDistance,
  degToRad,
  radToDeg,
} from '../geometry-engine';
import { palette } from '../theme/palette';

const SceneLabel: React.FC<{ position: [number, number, number]; children: React.ReactNode }> = ({ position, children }) => (
  <Html position={position} center className="pointer-events-none select-none">
    <span className="font-serif italic text-[20px] leading-none text-ink">{children}</span>
  </Html>
);

export const HyperbolicScene: React.FC = () => {
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

  const DISK_RADIUS = 3.5;

  // Concentric equal-hyperbolic-distance rings using r = tanh(d / 2)
  const hyperbolicRings = useMemo(() => {
    const dValues = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
    const samples = 72;
    const rings: { d: number; points: THREE.Vector3[] }[] = [];

    for (const d of dValues) {
      const rNorm = Math.tanh(d / 2);
      const r = DISK_RADIUS * rNorm;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= samples; i++) {
        const theta = (i / samples) * 2 * Math.PI;
        pts.push(new THREE.Vector3(r * Math.cos(theta), 0.005, r * Math.sin(theta)));
      }
      rings.push({ d, points: pts });
    }
    return rings;
  }, [DISK_RADIUS]);


  // Parallel lines experiment data
  const parallelData = useMemo(() => {
    if (experiment !== 'parallel-lines') return null;

    // Reference geodesic L: horizontal diameter along X-axis
    const refDef = computeGeodesicThroughPoints({ x: -0.8, y: 0 }, { x: 0.8, y: 0 });
    const refCurve = generateHyperbolicGeodesicCurve(refDef, 100, DISK_RADIUS, 0.02);
    const refPoints = refCurve.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));

    // External point P at (0, 0.45) in disk coordinates
    const P = { x: 0, y: 0.45 };
    const p3D = new THREE.Vector3(0, 0.035, P.y * DISK_RADIUS);

    // Angle calculations
    const hypDist = hyperbolicDistance({ x: 0, y: 0 }, P);
    const piAngle = angleOfParallelism(hypDist);
    const piAngleDeg = radToDeg(piAngle);
    const limitAngleDeg = 90 - piAngleDeg;

    // Active candidate geodesic
    const angleRad = degToRad(candidateAngleDeg);
    const candDef = computeGeodesicThroughPointAndAngle(P, angleRad);
    const candCurve = generateHyperbolicGeodesicCurve(candDef, 100, DISK_RADIUS, 0.025);
    const candPoints = candCurve.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));

    // Analytical intersection
    const intersection = intersectHyperbolicGeodesics(refDef, candDef);

    let classification: 'ultraparallel' | 'limiting' | 'intersecting' = 'ultraparallel';
    let lineColor: string = palette.blue; // ultraparallel cyan

    if (
      intersection.type === 'limiting_parallel' ||
      Math.abs(Math.abs(candidateAngleDeg) - limitAngleDeg) < 1.0
    ) {
      classification = 'limiting';
      lineColor = palette.ochre; // gold for limiting parallel
    } else if (intersection.type === 'unique') {
      classification = 'intersecting';
      lineColor = palette.red; // ruby for intersecting
    }

    let intPt3D: THREE.Vector3 | null = null;
    if (intersection.type === 'unique' && intersection.points[0]) {
      const pt = intersection.points[0] as { x: number; y: number };
      intPt3D = new THREE.Vector3(pt.x * DISK_RADIUS, 0.04, pt.y * DISK_RADIUS);
    }

    let idealPt3D: THREE.Vector3 | null = null;
    if (classification === 'limiting' && intersection.points[0]) {
      const pt = intersection.points[0] as { x: number; y: number };
      idealPt3D = new THREE.Vector3(pt.x * DISK_RADIUS, 0.04, pt.y * DISK_RADIUS);
    }

    // Fan curves
    const fanCurves: { points: THREE.Vector3[]; color: string }[] = [];
    if (showFan) {
      const fanAngles = [-70, -50, -limitAngleDeg, -20, 0, 20, limitAngleDeg, 50, 70];
      for (const a of fanAngles) {
        if (Math.abs(a - candidateAngleDeg) > 2) {
          const r = degToRad(a);
          const fDef = computeGeodesicThroughPointAndAngle(P, r);
          const fCurve = generateHyperbolicGeodesicCurve(fDef, 60, DISK_RADIUS, 0.015);
          const fInt = intersectHyperbolicGeodesics(refDef, fDef);

          let fColor: string = palette.ruleStrong;
          if (fInt.type === 'limiting_parallel' || Math.abs(Math.abs(a) - limitAngleDeg) < 0.5) {
            fColor = palette.ochre;
          } else if (fInt.type === 'divergent') {
            fColor = palette.blue;
          }

          fanCurves.push({
            points: fCurve.points.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
            color: fColor,
          });
        }
      }
    }

    return {
      refPoints,
      p3D,
      candPoints,
      lineColor,
      classification,
      intPt3D,
      idealPt3D,
      fanCurves,
    };
  }, [experiment, candidateAngleDeg, showFan, DISK_RADIUS]);

  // Triangle preset geodesic arcs
  const triangleArcs = useMemo(() => {
    if (experiment !== 'triangle') return [];
    if (points.length < 3) return [];

    const arcs: THREE.Vector3[][] = [];
    const pA = points[0].nativeCoords as { x: number; y: number };
    const pB = points[1].nativeCoords as { x: number; y: number };
    const pC = points[2].nativeCoords as { x: number; y: number };

    const segAB = generateHyperbolicSegment(pA, pB, 40, DISK_RADIUS, 0.02);
    const segBC = generateHyperbolicSegment(pB, pC, 40, DISK_RADIUS, 0.02);
    const segCA = generateHyperbolicSegment(pC, pA, 40, DISK_RADIUS, 0.02);

    arcs.push(
      segAB.points.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
      segBC.points.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
      segCA.points.map((p) => new THREE.Vector3(p.x, p.y, p.z))
    );

    return arcs;
  }, [experiment, points, DISK_RADIUS]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    if (tool === 'point') {
      e.stopPropagation();
      const p = e.point;
      const r = Math.hypot(p.x, p.z);
      if (r < DISK_RADIUS * 0.96) {
        const u = { x: p.x / DISK_RADIUS, y: p.z / DISK_RADIUS };
        addPoint({
          position: { x: p.x, y: 0.03, z: p.z },
          nativeCoords: u,
          label: `H(${u.x.toFixed(2)}, ${u.y.toFixed(2)})`,
        });
      }
    }
  };

  return (
    <group>
      {/* Invisible disk collider */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerDown={handlePointerDown}
        visible={false}
      >
        <circleGeometry args={[DISK_RADIUS, 64]} />
        <meshBasicMaterial />
      </mesh>

      {/* Deep Navy/Black Disk Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
        <circleGeometry args={[DISK_RADIUS, 64]} />
        <meshBasicMaterial color={palette.paperRaised} />
      </mesh>

      {/* Crisp Circular Boundary Rim (r = 1, infinity) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[DISK_RADIUS - 0.02, DISK_RADIUS + 0.02, 128]} />
        <meshBasicMaterial color={palette.ink} transparent opacity={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[DISK_RADIUS + 0.03, DISK_RADIUS + 0.06, 128]} />
        <meshBasicMaterial color={palette.ruleStrong} transparent opacity={0.4} />
      </mesh>

      {/* Concentric equal-hyperbolic-distance rings */}
      {showGrid &&
        hyperbolicRings.map((ring, idx) => (
          <Line key={`ring-${idx}`} points={ring.points} color={palette.rule} lineWidth={1} />
        ))}

      {/* ============================================================== */}
      {/* EXPERIMENT 01: PARALLEL LINES */}
      {/* ============================================================== */}
      {experiment === 'parallel-lines' && parallelData && showConstruction && (
        <group>
          {/* Reference Geodesic L */}
          <Line points={parallelData.refPoints} color={palette.ink} lineWidth={3} />

          <SceneLabel position={[DISK_RADIUS * 0.82, 0.05, -0.3]}>L</SceneLabel>
          <SceneLabel position={[0.35, 0.05, parallelData.p3D.z + 0.3]}>P</SceneLabel>

          {/* External Point P */}
          <mesh position={parallelData.p3D}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={palette.blue} />
          </mesh>

          {/* Fan curves */}
          {parallelData.fanCurves.map((fan, idx) => (
            <Line key={idx} points={fan.points} color={fan.color} lineWidth={1.4} transparent opacity={0.35} />
          ))}

          {/* Active Candidate Geodesic */}
          <Line points={parallelData.candPoints} color={parallelData.lineColor} lineWidth={3} />

          {/* Interior intersection point */}
          {parallelData.intPt3D && (
            <mesh position={parallelData.intPt3D}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshBasicMaterial color={palette.red} />
            </mesh>
          )}

          {/* Ideal boundary intersection point for limiting parallel */}
          {parallelData.idealPt3D && (
            <mesh position={parallelData.idealPt3D}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshBasicMaterial color={palette.ochre} />
            </mesh>
          )}
        </group>
      )}

      {/* ============================================================== */}
      {/* EXPERIMENT 02: TRIANGLE PLAYGROUND */}
      {/* ============================================================== */}
      {experiment === 'triangle' && showConstruction && (
        <group>
          {triangleArcs.map((arcPts, idx) => (
            <Line key={`tri-arc-${idx}`} points={arcPts} color={palette.blue} lineWidth={3} />
          ))}
        </group>
      )}

      {/* Draggable / Selectable Points */}
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
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshBasicMaterial color={isSelected ? palette.blue : palette.ink} />
            </mesh>
            {isSelected && (
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.16, 0.22, 24]} />
                <meshBasicMaterial color={palette.blue} transparent opacity={0.8} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};
