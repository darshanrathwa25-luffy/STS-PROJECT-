import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { useGeometryStore } from '../store/geometryStore';
import {
  DEFAULT_SPHERE_RADIUS,
  generateCompleteGreatCircle,
  generateGreatCircleArc,
  intersectGreatCircles,
  projectToSphere,
  degToRad,
  sphericalTriangle,
} from '../geometry-engine';

export const SphericalScene: React.FC = () => {
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
  const R = DEFAULT_SPHERE_RADIUS;

  // Fibonacci sphere particle distribution
  const particleGeo = useMemo(() => {
    const count = particleCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < count; i++) {
      const theta = (2 * Math.PI * i) / goldenRatio;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);

      const x = R * Math.sin(phi) * Math.cos(theta);
      const y = R * Math.cos(phi);
      const z = R * Math.sin(phi) * Math.sin(theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Silver-white with subtle latitude brightness variation
      const brightness = 0.8 + 0.2 * Math.abs(Math.sin(phi));
      colors[i * 3] = 0.88 * brightness;
      colors[i * 3 + 1] = 0.92 * brightness;
      colors[i * 3 + 2] = 1.0 * brightness;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [particleCount, R]);

  const pointsMatRef = useRef<THREE.PointsMaterial>(null);
  useFrame(({ clock }) => {
    if (pointsMatRef.current) {
      pointsMatRef.current.opacity = 0.55 + Math.sin(clock.getElapsedTime() * 1.5) * 0.05;
    }
  });

  // Latitude and longitude guide rings
  const guideRings = useMemo(() => {
    const rings: THREE.Vector3[][] = [];
    const samples = 64;

    // Equator (y = 0)
    const eq: THREE.Vector3[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * 2 * Math.PI;
      eq.push(new THREE.Vector3(R * Math.cos(t), 0, R * Math.sin(t)));
    }
    rings.push(eq);

    // Prime meridian (x = 0)
    const pm: THREE.Vector3[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * 2 * Math.PI;
      pm.push(new THREE.Vector3(0, R * Math.cos(t), R * Math.sin(t)));
    }
    rings.push(pm);

    // Parallels at +-30 deg
    const lat30 = degToRad(30);
    const r30 = R * Math.cos(lat30);
    const y30 = R * Math.sin(lat30);
    const p30a: THREE.Vector3[] = [];
    const p30b: THREE.Vector3[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * 2 * Math.PI;
      p30a.push(new THREE.Vector3(r30 * Math.cos(t), y30, r30 * Math.sin(t)));
      p30b.push(new THREE.Vector3(r30 * Math.cos(t), -y30, r30 * Math.sin(t)));
    }
    rings.push(p30a, p30b);

    return rings;
  }, [R]);

  // Parallel lines experiment on sphere
  const parallelData = useMemo(() => {
    if (experiment !== 'parallel-lines') return null;

    // Reference L: Equator great circle (normal y = 1)
    const nEquator = { x: 0, y: 1, z: 0 };
    const equatorCurve = generateCompleteGreatCircle(nEquator, 120, R, 1.002);
    const refPoints = equatorCurve.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));

    // External point P at latitude 35° on prime meridian (x = 0)
    const latP = degToRad(35);
    const pVec = {
      x: 0,
      y: R * Math.sin(latP),
      z: R * Math.cos(latP),
    };
    const p3D = new THREE.Vector3(pVec.x, pVec.y, pVec.z);

    // Candidate circle through P with angle theta
    const angleRad = degToRad(candidateAngleDeg);
    const tEast = { x: 1, y: 0, z: 0 };
    const tNorth = { x: 0, y: Math.cos(latP), z: -Math.sin(latP) };

    const candidateTangent = {
      x: tEast.x * Math.cos(angleRad) + tNorth.x * Math.sin(angleRad),
      y: tEast.y * Math.cos(angleRad) + tNorth.y * Math.sin(angleRad),
      z: tEast.z * Math.cos(angleRad) + tNorth.z * Math.sin(angleRad),
    };

    const nCandidate = {
      x: pVec.y * candidateTangent.z - pVec.z * candidateTangent.y,
      y: pVec.z * candidateTangent.x - pVec.x * candidateTangent.z,
      z: pVec.x * candidateTangent.y - pVec.y * candidateTangent.x,
    };

    const candCurve = generateCompleteGreatCircle(nCandidate, 120, R, 1.003);
    const candPoints = candCurve.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));

    // Analytical intersection with Equator
    const intInfo = intersectGreatCircles(nEquator, nCandidate, R * 1.004);
    const intPts3D = intInfo.points.map(
      (p) => new THREE.Vector3((p as { x: number; y: number; z: number }).x, (p as { x: number; y: number; z: number }).y, (p as { x: number; y: number; z: number }).z)
    );

    // Fan lines
    const fanCircles: THREE.Vector3[][] = [];
    if (showFan) {
      const angles = [-60, -40, -20, 0, 20, 40, 60];
      for (const a of angles) {
        if (Math.abs(a - candidateAngleDeg) > 3) {
          const r = degToRad(a);
          const tFan = {
            x: tEast.x * Math.cos(r) + tNorth.x * Math.sin(r),
            y: tEast.y * Math.cos(r) + tNorth.y * Math.sin(r),
            z: tEast.z * Math.cos(r) + tNorth.z * Math.sin(r),
          };
          const nFan = {
            x: pVec.y * tFan.z - pVec.z * tFan.y,
            y: pVec.z * tFan.x - pVec.x * tFan.z,
            z: pVec.x * tFan.y - pVec.y * tFan.x,
          };
          const fCurve = generateCompleteGreatCircle(nFan, 60, R, 1.001);
          fanCircles.push(fCurve.points.map((p) => new THREE.Vector3(p.x, p.y, p.z)));
        }
      }
    }

    return {
      refPoints,
      p3D,
      candPoints,
      intPts3D,
      fanCircles,
    };
  }, [experiment, candidateAngleDeg, showFan, R]);

  // Handle triangle preset geodesic arcs
  const triangleArcs = useMemo(() => {
    if (experiment !== 'triangle') return [];
    if (points.length < 3) return [];

    const arcs: THREE.Vector3[][] = [];
    const pA = points[0].position;
    const pB = points[1].position;
    const pC = points[2].position;

    const arcAB = generateGreatCircleArc(pA, pB, 48, R, 1.003);
    const arcBC = generateGreatCircleArc(pB, pC, 48, R, 1.003);
    const arcCA = generateGreatCircleArc(pC, pA, 48, R, 1.003);

    arcs.push(
      arcAB.points.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
      arcBC.points.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
      arcCA.points.map((p) => new THREE.Vector3(p.x, p.y, p.z))
    );

    return arcs;
  }, [experiment, points, R]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    if (tool === 'point') {
      e.stopPropagation();
      const proj = projectToSphere(e.point, R);
      addPoint({
        position: proj,
        nativeCoords: proj,
        label: `Spherical(${proj.x.toFixed(1)}, ${proj.y.toFixed(1)}, ${proj.z.toFixed(1)})`,
      });
    }
  };

  return (
    <group>
      {/* Invisible sphere collider for pointer interaction */}
      <mesh onPointerDown={handlePointerDown} visible={false}>
        <sphereGeometry args={[R, 32, 32]} />
        <meshBasicMaterial />
      </mesh>

      {/* Particle sphere surface */}
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

      {/* Guide rings */}
      {showGrid &&
        guideRings.map((pts, idx) => (
          <line key={idx}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={pts.length}
                array={new Float32Array(pts.flatMap((v) => [v.x, v.y, v.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#2B3245" transparent opacity={0.4} />
          </line>
        ))}

      {/* Parallel lines experiment rendering */}
      {parallelData && showConstruction && (
        <group>
          {/* Reference Equator Great Circle */}
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

          {/* Fan circles */}
          {parallelData.fanCircles.map((fanPts, idx) => (
            <line key={idx}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={fanPts.length}
                  array={new Float32Array(fanPts.flatMap((v) => [v.x, v.y, v.z]))}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#4A5568" transparent opacity={0.3} />
            </line>
          ))}

          {/* Active Candidate Great Circle */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={parallelData.candPoints.length}
                array={new Float32Array(parallelData.candPoints.flatMap((v) => [v.x, v.y, v.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#EF476F" linewidth={2} />
          </line>

          {/* Antipodal intersection points with pulsating rings */}
          {parallelData.intPts3D.map((pt, idx) => (
            <group key={idx} position={pt}>
              <mesh>
                <sphereGeometry args={[0.07, 16, 16]} />
                <meshBasicMaterial color="#FFD166" />
              </mesh>
            </group>
          ))}
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

