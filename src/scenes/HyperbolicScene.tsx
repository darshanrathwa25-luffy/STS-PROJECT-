import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
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

  const { particleCount, pointSize, showGrid, showSurface, showConstruction } = appearance;
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

  // Particle boundary at infinity |z| = 1
  const particleGeo = useMemo(() => {
    const count = Math.min(particleCount, 3000);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = (i / count) * 2 * Math.PI;
      const r = DISK_RADIUS * (0.995 + Math.random() * 0.01);
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = z;

      colors[i * 3] = 0.92;
      colors[i * 3 + 1] = 0.95;
      colors[i * 3 + 2] = 1.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [particleCount, DISK_RADIUS]);

  const pointsMatRef = useRef<THREE.PointsMaterial>(null);
  useFrame(({ clock }) => {
    if (pointsMatRef.current) {
      pointsMatRef.current.opacity = 0.65 + Math.sin(clock.getElapsedTime() * 1.5) * 0.05;
    }
  });

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

      {/* Particle rim at boundary |z| = 1 */}
      {showSurface && (
        <points geometry={particleGeo}>
          <pointsMaterial
            ref={pointsMatRef}
            size={pointSize}
            vertexColors
            transparent
            opacity={0.7}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      )}

      {/* Crisp Circular Boundary Rim (r = 1, infinity) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[DISK_RADIUS - 0.02, DISK_RADIUS + 0.02, 128]} />
        <meshBasicMaterial color={palette.blue} transparent opacity={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[DISK_RADIUS + 0.03, DISK_RADIUS + 0.06, 128]} />
        <meshBasicMaterial color={palette.ruleStrong} transparent opacity={0.4} />
      </mesh>

      {/* Concentric equal-hyperbolic-distance rings */}
      {showGrid &&
        hyperbolicRings.map((ring, idx) => (
          <line key={`ring-${idx}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={ring.points.length}
                array={new Float32Array(ring.points.flatMap((v) => [v.x, v.y, v.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color={palette.rule} transparent opacity={0.5} />
          </line>
        ))}

      {/* ============================================================== */}
      {/* EXPERIMENT 01: PARALLEL LINES */}
      {/* ============================================================== */}
      {experiment === 'parallel-lines' && parallelData && showConstruction && (
        <group>
          {/* Reference Geodesic L */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={parallelData.refPoints.length}
                array={new Float32Array(parallelData.refPoints.flatMap((v) => [v.x, v.y, v.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color={palette.ink} linewidth={2} />
          </line>

          {/* External Point P */}
          <mesh position={parallelData.p3D}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={palette.blue} />
          </mesh>

          {/* Fan curves */}
          {parallelData.fanCurves.map((fan, idx) => (
            <line key={idx}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={fan.points.length}
                  array={new Float32Array(fan.points.flatMap((v) => [v.x, v.y, v.z]))}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color={fan.color} transparent opacity={0.35} />
            </line>
          ))}

          {/* Active Candidate Geodesic */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={parallelData.candPoints.length}
                array={new Float32Array(parallelData.candPoints.flatMap((v) => [v.x, v.y, v.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color={parallelData.lineColor} linewidth={2} />
          </line>

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
            <line key={`tri-arc-${idx}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={arcPts.length}
                  array={new Float32Array(arcPts.flatMap((v) => [v.x, v.y, v.z]))}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color={palette.blue} linewidth={2.5} />
            </line>
          ))}
        </group>
      )}

      {/* Draggable / Selectable Points */}
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
