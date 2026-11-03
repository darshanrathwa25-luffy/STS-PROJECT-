import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';
import { useGeometryStore } from '../store/geometryStore';
import {
  DEFAULT_SPHERE_RADIUS,
  generateCompleteGreatCircle,
  generateGreatCircleArc,
  intersectGreatCircles,
  projectToSphere,
  degToRad,
} from '../geometry-engine';
import { palette } from '../theme/palette';

const SceneLabel: React.FC<{ position: [number, number, number]; children: React.ReactNode }> = ({ position, children }) => (
  <Html position={position} center zIndexRange={[10, 0]} className="pointer-events-none select-none">
    <span className="font-serif italic text-[20px] leading-none text-ink">{children}</span>
  </Html>
);

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

  const { showGrid, showConstruction } = appearance;
  const { candidateAngleDeg, showFan } = parallelExperiment;
  const R = DEFAULT_SPHERE_RADIUS;


  // Circle of latitude through P (35° N), drawn just above the surface
  const latitudePoints = useMemo(() => {
    const lat = (35 * Math.PI) / 180;
    const r = R * Math.cos(lat) * 1.003;
    const y = R * Math.sin(lat) * 1.003;
    return Array.from({ length: 97 }, (_, i) => {
      const t = (i / 96) * 2 * Math.PI;
      return new THREE.Vector3(r * Math.cos(t), y, r * Math.sin(t));
    });
  }, [R]);

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

      {/* Solid paper globe: hides the far side so the lines read clearly */}
      <mesh>
        <sphereGeometry args={[R * 0.995, 64, 64]} />
        <meshStandardMaterial color={palette.paperRaised} emissive={palette.paperSunk} emissiveIntensity={0.55} roughness={1} metalness={0} />
      </mesh>

      {/* Guide rings */}
      {showGrid &&
        guideRings.map((pts, idx) => (
          <Line key={idx} points={pts} color={palette.rule} lineWidth={1.4} transparent opacity={0.4} />
        ))}

      {/* Parallel lines experiment rendering */}
      {parallelData && showConstruction && (
        <group>
          {/* Reference Equator Great Circle */}
          <Line points={parallelData.refPoints} color={palette.ink} lineWidth={3} />

          <SceneLabel position={[R * 0.75, -0.25, R * 0.72]}>L</SceneLabel>
          <SceneLabel position={[0.3, parallelData.p3D.y + 0.25, parallelData.p3D.z + 0.1]}>P</SceneLabel>

          {/* The circle of latitude through P: never meets the equator, but it isn't a great circle */}
          <Line points={latitudePoints} color={palette.inkMuted} lineWidth={1.5} dashed dashSize={0.12} gapSize={0.08} />
          <SceneLabel position={[-R * 0.62, parallelData.p3D.y + 0.12, R * 0.52]}>
            <span className="not-italic font-sans text-[12px] text-ink-muted whitespace-nowrap">35° N, not a straight line</span>
          </SceneLabel>

          {/* Point P */}
          <mesh position={parallelData.p3D}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={palette.blue} />
          </mesh>

          {/* Fan circles */}
          {parallelData.fanCircles.map((fanPts, idx) => (
            <Line key={idx} points={fanPts} color={palette.ruleStrong} lineWidth={1.4} transparent opacity={0.3} />
          ))}

          {/* Active Candidate Great Circle */}
          <Line points={parallelData.candPoints} color={palette.red} lineWidth={3} />

          {/* Antipodal intersection points with pulsating rings */}
          {parallelData.intPts3D.map((pt, idx) => (
            <group key={idx} position={pt}>
              <mesh>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshBasicMaterial color={palette.red} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Triangle arcs */}
      {showConstruction &&
        triangleArcs.map((arcPts, idx) => (
          <Line key={idx} points={arcPts} color={palette.blue} lineWidth={3} />
        ))}

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
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshBasicMaterial color={isSelected ? palette.blue : palette.ink} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

