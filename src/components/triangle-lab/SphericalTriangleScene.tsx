import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useThree, ThreeEvent } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';
import { useGeometryStore } from '../../store/geometryStore';
import {
  sphericalTriangle,
  generateGreatCircleArc,
  DEFAULT_SPHERE_RADIUS,
  Point3D,
} from '../../geometry-engine';

export const SphericalTriangleScene: React.FC = () => {
  const {
    sphereTriangle,
    updateSphereVertex,
    selectedVertex,
    setSelectedVertex,
    setIsDragging,
  } = useGeometryStore();

  const { camera, raycaster, gl } = useThree();
  const [activeDrag, setActiveDrag] = useState<'p1' | 'p2' | 'p3' | null>(null);

  const R = DEFAULT_SPHERE_RADIUS;
  const { p1, p2, p3 } = sphereTriangle;

  // Live measurements
  const tri = useMemo(() => {
    return sphericalTriangle(p1, p2, p3, R);
  }, [p1, p2, p3, R]);

  // Sample great-circle edges
  const edgeAB = useMemo(() => generateGreatCircleArc(p1, p2, 40, R), [p1, p2, R]);
  const edgeBC = useMemo(() => generateGreatCircleArc(p2, p3, 40, R), [p2, p3, R]);
  const edgeCA = useMemo(() => generateGreatCircleArc(p3, p1, 40, R), [p3, p1, R]);

  const edgeAB_pts = useMemo(() => edgeAB.points.map((p) => [p.x, p.y, p.z] as [number, number, number]), [edgeAB]);
  const edgeBC_pts = useMemo(() => edgeBC.points.map((p) => [p.x, p.y, p.z] as [number, number, number]), [edgeBC]);
  const edgeCA_pts = useMemo(() => edgeCA.points.map((p) => [p.x, p.y, p.z] as [number, number, number]), [edgeCA]);

  // Subdivided spherical patch geometry
  const patchGeometry = useMemo(() => {
    const N = 12; // subdivision steps
    const positions: number[] = [];
    const indices: number[] = [];
    const v1 = new THREE.Vector3(p1.x, p1.y, p1.z);
    const v2 = new THREE.Vector3(p2.x, p2.y, p2.z);
    const v3 = new THREE.Vector3(p3.x, p3.y, p3.z);

    const grid: number[][] = [];
    let vertCount = 0;

    for (let i = 0; i <= N; i++) {
      grid[i] = [];
      const u = i / N;
      for (let j = 0; j <= N - i; j++) {
        const v = j / N;
        const w = 1 - u - v;

        const pt = new THREE.Vector3()
          .addScaledVector(v1, u)
          .addScaledVector(v2, v)
          .addScaledVector(v3, w)
          .normalize()
          .multiplyScalar(R * 1.002);

        positions.push(pt.x, pt.y, pt.z);
        grid[i][j] = vertCount++;
      }
    }

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N - i; j++) {
        const a = grid[i][j];
        const b = grid[i + 1][j];
        const c = grid[i][j + 1];

        indices.push(a, b, c);

        if (j < N - i - 1) {
          const d = grid[i + 1][j + 1];
          indices.push(b, d, c);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [p1, p2, p3, R]);

  // Graticule lines on sphere
  const graticuleLines = useMemo(() => {
    const lines: [number, number, number][][] = [];
    // Longitude lines
    for (let deg = 0; deg < 180; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const pts: [number, number, number][] = [];
      for (let t = 0; t <= 64; t++) {
        const phi = (t / 64) * 2 * Math.PI;
        pts.push([
          R * Math.cos(phi) * Math.sin(rad),
          R * Math.sin(phi),
          R * Math.cos(phi) * Math.cos(rad),
        ]);
      }
      lines.push(pts);
    }
    // Equator / Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const phi = (lat * Math.PI) / 180;
      const rRing = R * Math.cos(phi);
      const yRing = R * Math.sin(phi);
      const pts: [number, number, number][] = [];
      for (let t = 0; t <= 64; t++) {
        const theta = (t / 64) * 2 * Math.PI;
        pts.push([rRing * Math.cos(theta), yRing, rRing * Math.sin(theta)]);
      }
      lines.push(pts);
    }
    return lines;
  }, [R]);

  // Invisible sphere intersection for raycasting during drag
  const invisibleSphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(0, 0, 0), R), [R]);

  const handlePointerDown = (vertex: 'p1' | 'p2' | 'p3', e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    (e.nativeEvent.target as Element).setPointerCapture(e.pointerId);
    setActiveDrag(vertex);
    setSelectedVertex(vertex);
    setIsDragging(true);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!activeDrag) return;
    e.stopPropagation();

    const targetPt = new THREE.Vector3();
    if (raycaster.ray.intersectSphere(invisibleSphere, targetPt)) {
      targetPt.normalize().multiplyScalar(R);
      updateSphereVertex(activeDrag, { x: targetPt.x, y: targetPt.y, z: targetPt.z });
    }
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (activeDrag) {
      try {
        (e.nativeEvent.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture guard
      }
      setActiveDrag(null);
      setIsDragging(false);
    }
  };

  // Label visibility check against camera view
  const isFacingCamera = (p: Point3D) => {
    const v = new THREE.Vector3(p.x, p.y, p.z).normalize();
    const camDir = camera.position.clone().normalize();
    return v.dot(camDir) > 0.05;
  };

  return (
    <group
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Lit Solid Base Sphere */}
      <mesh receiveShadow>
        <sphereGeometry args={[R * 0.998, 48, 48]} />
        <meshStandardMaterial
          color="#10131A"
          roughness={0.75}
          metalness={0.15}
        />
      </mesh>

      {/* Graticule Latitude / Longitude lines */}
      {graticuleLines.map((pts, idx) => (
        <Line
          key={`grat_${idx}`}
          points={pts}
          color="#202533"
          lineWidth={1.0}
          transparent
          opacity={0.35}
        />
      ))}

      {/* Subdivided Spherical Triangle Patch */}
      <mesh geometry={patchGeometry}>
        <meshBasicMaterial
          color="#FFD166"
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Great Circle Triangle Edges */}
      <Line points={edgeAB_pts} color="#FFD166" lineWidth={2.8} />
      <Line points={edgeBC_pts} color="#FFD166" lineWidth={2.8} />
      <Line points={edgeCA_pts} color="#FFD166" lineWidth={2.8} />

      {/* Vertex Handles & Labels */}
      {[
        { key: 'p1' as const, pt: p1, label: 'A', angleDeg: (tri.alpha * 180) / Math.PI },
        { key: 'p2' as const, pt: p2, label: 'B', angleDeg: (tri.beta * 180) / Math.PI },
        { key: 'p3' as const, pt: p3, label: 'C', angleDeg: (tri.gamma * 180) / Math.PI },
      ].map(({ key, pt, label, angleDeg }) => {
        const isSelected = selectedVertex === key;
        const isDraggingThis = activeDrag === key;
        const facing = isFacingCamera(pt);

        return (
          <group key={key} position={[pt.x, pt.y, pt.z]}>
            {/* Visual Handle Sphere */}
            <mesh
              onPointerDown={(e) => handlePointerDown(key, e)}
              scale={isDraggingThis ? 1.3 : 1.0}
            >
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshBasicMaterial
                color={isSelected ? '#FFFFFF' : '#FFD166'}
              />
            </mesh>

            {/* Selection Aura */}
            {isSelected && (
              <mesh scale={1.5}>
                <sphereGeometry args={[0.09, 16, 16]} />
                <meshBasicMaterial color="#FFD166" transparent opacity={0.3} wireframe />
              </mesh>
            )}

            {/* Angle degree label via Html */}
            {facing && (
              <Html
                position={[0, 0.16, 0]}
                center
                distanceFactor={10}
                className="pointer-events-none select-none"
              >
                <div className="bg-[#12141A]/90 backdrop-blur-md px-1.5 py-0.5 rounded border border-[#FFD166]/40 text-[10px] font-mono font-bold text-[#FFD166] whitespace-nowrap shadow-md">
                  {label}: {angleDeg.toFixed(1)}°
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};
