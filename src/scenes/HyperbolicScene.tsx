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
  computeCircleMetrics,
  degToRad,
  radToDeg,
} from '../geometry-engine';

export const HyperbolicScene: React.FC = () => {
  const {
    points,
    appearance,
    preset,
    parallelExperiment,
    circleRadius,
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
    // Hyperbolic distances d = 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0
    const dValues = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
    const samples = 72;
    const rings: { d: number; rNorm: number; points: THREE.Vector3[] }[] = [];

    for (const d of dValues) {
      const rNorm = Math.tanh(d / 2);
      const r = DISK_RADIUS * rNorm;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= samples; i++) {
        const theta = (i / samples) * 2 * Math.PI;
        pts.push(new THREE.Vector3(r * Math.cos(theta), 0.005, r * Math.sin(theta)));
      }
      rings.push({ d, rNorm, points: pts });
    }
    return rings;
  }, [DISK_RADIUS]);

  // Diameter geodesics through origin (0°, 45°, 90°, 135°)
  const diameterGeodesics = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];
    for (const a of angles) {
      lines.push([
        new THREE.Vector3(-DISK_RADIUS * Math.cos(a), 0.008, -DISK_RADIUS * Math.sin(a)),
        new THREE.Vector3(DISK_RADIUS * Math.cos(a), 0.008, DISK_RADIUS * Math.sin(a)),
      ]);
    }
    return lines;
  }, [DISK_RADIUS]);

  // Particle boundary at infinity |z| = 1 & interior particle grid
  const particleGeo = useMemo(() => {
    const boundaryCount = Math.floor(particleCount * 0.45);
    const interiorCount = particleCount - boundaryCount;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Dense rim particles at |z| = 1 (Ideal Boundary at infinity)
    for (let i = 0; i < boundaryCount; i++) {
      const theta = (i / boundaryCount) * 2 * Math.PI;
      const r = DISK_RADIUS * (0.995 + Math.random() * 0.01);
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = z;

      // Bright silver-white boundary
      colors[i * 3] = 0.95;
      colors[i * 3 + 1] = 0.97;
      colors[i * 3 + 2] = 1.0;
    }

    // Interior hyperbolic particles
    for (let i = 0; i < interiorCount; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const u = Math.random();
      const rNorm = Math.sqrt(u) * 0.97;
      const r = DISK_RADIUS * rNorm;

      const idx = boundaryCount + i;
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);

      positions[idx * 3] = x;
      positions[idx * 3 + 1] = 0;
      positions[idx * 3 + 2] = z;

      // Subtle falloff
      const alpha = 0.35 + 0.45 * (1 - rNorm);
      colors[idx * 3] = 0.8 * alpha;
      colors[idx * 3 + 1] = 0.85 * alpha;
      colors[idx * 3 + 2] = 0.95 * alpha;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [particleCount, DISK_RADIUS]);

  const pointsMatRef = useRef<THREE.PointsMaterial>(null);
  useFrame(({ clock }) => {
    if (pointsMatRef.current) {
      pointsMatRef.current.opacity = 0.6 + Math.sin(clock.getElapsedTime() * 1.5) * 0.05;
    }
  });

  // Parallel lines flagship experiment in Poincaré disk
  const parallelData = useMemo(() => {
    if (preset !== 'parallel-lines') return null;

    // Reference geodesic L: horizontal diameter along X-axis
    const refDef = computeGeodesicThroughPoints({ x: -0.8, y: 0 }, { x: 0.8, y: 0 });
    const refCurve = generateHyperbolicGeodesicCurve(refDef, 100, DISK_RADIUS, 0.02);
    const refPoints = refCurve.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));

    // External point P at (0, 0.45) in disk coordinates
    const P = { x: 0, y: 0.45 };
    const p3D = new THREE.Vector3(0, 0.035, P.y * DISK_RADIUS);

    // Lobachevsky angle of parallelism for this point
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
    let lineColor = '#69A3FF'; // ultraparallel cyan

    if (
      intersection.type === 'limiting_parallel' ||
      Math.abs(Math.abs(candidateAngleDeg) - limitAngleDeg) < 1.0
    ) {
      classification = 'limiting';
      lineColor = '#FFD166'; // gold for limiting parallel
    } else if (intersection.type === 'unique') {
      classification = 'intersecting';
      lineColor = '#EF476F'; // ruby for intersecting
    }

    // Interior intersection point
    let intPt3D: THREE.Vector3 | null = null;
    if (intersection.type === 'unique' && intersection.points[0]) {
      const pt = intersection.points[0] as { x: number; y: number };
      intPt3D = new THREE.Vector3(pt.x * DISK_RADIUS, 0.04, pt.y * DISK_RADIUS);
    }

    // Shared ideal boundary point if limiting
    let idealPt3D: THREE.Vector3 | null = null;
    if (classification === 'limiting' && intersection.points[0]) {
      const pt = intersection.points[0] as { x: number; y: number };
      idealPt3D = new THREE.Vector3(pt.x * DISK_RADIUS, 0.04, pt.y * DISK_RADIUS);
    }

    // Right-angle orthogonality markers at candidate endpoints on ideal boundary
    const [e1, e2] = candDef.idealEndpoints;
    const rightAngleMarkers: THREE.Vector3[][] = [];
    const size = 0.16;
    for (const ep of [e1, e2]) {
      // Ep is on unit circle: ep.x^2 + ep.y^2 = 1.
      // Unit radial vector toward origin is -ep
      // Tangent along rim is (-ep.y, ep.x)
      const rx = -ep.x;
      const ry = -ep.y;
      const tx = -ep.y;
      const ty = ep.x;

      const p0 = new THREE.Vector3(ep.x * DISK_RADIUS, 0.028, ep.y * DISK_RADIUS);
      const p1 = new THREE.Vector3((ep.x + size * rx) * DISK_RADIUS, 0.028, (ep.y + size * ry) * DISK_RADIUS);
      const p2 = new THREE.Vector3(
        (ep.x + size * rx + size * tx * 0.5) * DISK_RADIUS,
        0.028,
        (ep.y + size * ry + size * ty * 0.5) * DISK_RADIUS
      );
      const p3 = new THREE.Vector3(
        (ep.x + size * tx * 0.5) * DISK_RADIUS,
        0.028,
        (ep.y + size * ty * 0.5) * DISK_RADIUS
      );
      rightAngleMarkers.push([p1, p2, p3]);
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

          let fColor = '#4A5568';
          if (fInt.type === 'limiting_parallel' || Math.abs(Math.abs(a) - limitAngleDeg) < 0.5) {
            fColor = '#FFD166';
          } else if (fInt.type === 'divergent') {
            fColor = '#3B82F6';
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
      rightAngleMarkers,
    };
  }, [preset, candidateAngleDeg, showFan, DISK_RADIUS]);

  // Circle experiment geodesic circle
  const circleData = useMemo(() => {
    if (preset !== 'circle') return null;
    const rNorm = Math.tanh(circleRadius / 2);
    const rEuclid = rNorm * DISK_RADIUS;
    const samples = 72;
    const circlePoints: THREE.Vector3[] = [];
    for (let i = 0; i <= samples; i++) {
      const theta = (i / samples) * 2 * Math.PI;
      circlePoints.push(new THREE.Vector3(rEuclid * Math.cos(theta), 0.03, rEuclid * Math.sin(theta)));
    }
    const metrics = computeCircleMetrics('hyperbolic', circleRadius);
    return { circlePoints, metrics, rEuclid };
  }, [preset, circleRadius, DISK_RADIUS]);

  // Triangle preset geodesic arcs
  const triangleArcs = useMemo(() => {
    if (preset !== 'triangle') return [];
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
  }, [preset, points, DISK_RADIUS]);

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

      {/* Particle boundary and interior */}
      {showSurface && (
        <points geometry={particleGeo}>
          <pointsMaterial
            ref={pointsMatRef}
            size={pointSize}
            vertexColors
            transparent
            opacity={0.65}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      )}

      {/* Ideal Boundary Double Ring Outline (r = 1, d = infinity) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[DISK_RADIUS - 0.015, DISK_RADIUS + 0.015, 128]} />
        <meshBasicMaterial color="#69A3FF" transparent opacity={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[DISK_RADIUS + 0.02, DISK_RADIUS + 0.05, 128]} />
        <meshBasicMaterial color="#3A4356" transparent opacity={0.4} />
      </mesh>

      {/* Diameter Geodesics (Straight Euclidean lines through origin) */}
      {showGrid &&
        diameterGeodesics.map((pts, idx) => (
          <line key={`diam-${idx}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={pts.length}
                array={new Float32Array(pts.flatMap((v) => [v.x, v.y, v.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#222836" transparent opacity={0.6} />
          </line>
        ))}

      {/* Equal-Hyperbolic-Distance Concentric Rings: r = tanh(d/2) */}
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
            <lineBasicMaterial color="#1E2433" transparent opacity={0.5} />
          </line>
        ))}

      {/* Parallel lines experiment rendering */}
      {parallelData && showConstruction && (
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
            <lineBasicMaterial color="#E0E4EC" linewidth={2} />
          </line>

          {/* Point P */}
          <mesh position={parallelData.p3D}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#69A3FF" />
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

          {/* Right-angle 90° orthogonality markers at boundary */}
          {parallelData.rightAngleMarkers.map((markerPts, idx) => (
            <line key={`marker-${idx}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={markerPts.length}
                  array={new Float32Array(markerPts.flatMap((v) => [v.x, v.y, v.z]))}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#FFD166" linewidth={2} />
            </line>
          ))}

          {/* Interior intersection point */}
          {parallelData.intPt3D && (
            <mesh position={parallelData.intPt3D}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshBasicMaterial color="#EF476F" />
            </mesh>
          )}

          {/* Ideal boundary intersection point for limiting parallel */}
          {parallelData.idealPt3D && (
            <mesh position={parallelData.idealPt3D}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshBasicMaterial color="#FFD166" />
            </mesh>
          )}
        </group>
      )}

      {/* Circle experiment rendering */}
      {circleData && showConstruction && (
        <group>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={circleData.circlePoints.length}
                array={new Float32Array(circleData.circlePoints.flatMap((v) => [v.x, v.y, v.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#69A3FF" linewidth={2} />
          </line>
          {/* Origin center point */}
          <mesh position={[0, 0.03, 0]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshBasicMaterial color="#FFD166" />
          </mesh>
        </group>
      )}

      {/* Triangle arcs */}
      {showConstruction &&
        triangleArcs.map((arcPts, idx) => (
          <line key={idx}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={arcPts.length}
                array={new Float32Array(arcPts.flatMap((v) => [v.x, v.y, v.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#69A3FF" linewidth={2} />
          </line>
        ))}

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
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshBasicMaterial color={isSelected ? '#69A3FF' : '#E0E4EC'} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
