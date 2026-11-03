import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { useThree, ThreeEvent } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { useGeometryStore } from '../../store/geometryStore';
import {
  saddleTriangle,
  saddlePosition,
  saddleGeodesicPoints3D,
  DEFAULT_SADDLE_C,
  DEFAULT_SADDLE_DOMAIN,
} from '../../geometry-engine';
import type { Point3D } from '../../geometry-engine';
import { palette, worldColor } from '../../theme/palette';
import { VertexHandle, outwardOffset } from './VertexHandle';

// The engine returns saddle points as {x: u, y: v, z: height}. The scene is
// y-up (camera, drag plane, labels), so map height -> y and v -> z.
const toScene = (p: Point3D): [number, number, number] => [p.x, p.z, p.y];

export const SaddleTriangleScene: React.FC = () => {
  const {
    saddleTriangle: hTri,
    updateSaddleVertex,
    selectedVertex,
    setSelectedVertex,
    setIsDragging,
  } = useGeometryStore();

  const { raycaster } = useThree();
  const [activeDrag, setActiveDrag] = useState<'p1' | 'p2' | 'p3' | null>(null);

  const c = DEFAULT_SADDLE_C;
  const domain = DEFAULT_SADDLE_DOMAIN;
  const { p1, p2, p3 } = hTri;

  // Live measurements
  const tri = useMemo(() => {
    return saddleTriangle(p1, p2, p3, c);
  }, [p1, p2, p3, c]);

  // Compute 3D geodesic edges on the saddle
  const edgeAB = useMemo(() => saddleGeodesicPoints3D(p1, p2, 40, c), [p1, p2, c]);
  const edgeBC = useMemo(() => saddleGeodesicPoints3D(p2, p3, 40, c), [p2, p3, c]);
  const edgeCA = useMemo(() => saddleGeodesicPoints3D(p3, p1, 40, c), [p3, p1, c]);

  const edgeAB_pts = useMemo(() => edgeAB.map((p) => { const [x, y, z] = toScene(p); return [x, y + 0.005, z] as [number, number, number]; }), [edgeAB]);
  const edgeBC_pts = useMemo(() => edgeBC.map((p) => { const [x, y, z] = toScene(p); return [x, y + 0.005, z] as [number, number, number]; }), [edgeBC]);
  const edgeCA_pts = useMemo(() => edgeCA.map((p) => { const [x, y, z] = toScene(p); return [x, y + 0.005, z] as [number, number, number]; }), [edgeCA]);

  // Saddle surface mesh geometry
  const saddleMeshGeo = useMemo(() => {
    const steps = 36;
    const positions: number[] = [];
    const indices: number[] = [];
    const extent = domain;

    for (let i = 0; i <= steps; i++) {
      const u = -extent + (2 * extent * i) / steps;
      for (let j = 0; j <= steps; j++) {
        const v = -extent + (2 * extent * j) / steps;
        positions.push(...toScene(saddlePosition(u, v, c)));
      }
    }

    const rowSize = steps + 1;
    for (let i = 0; i < steps; i++) {
      for (let j = 0; j < steps; j++) {
        const a = i * rowSize + j;
        const b = (i + 1) * rowSize + j;
        const d = (i + 1) * rowSize + (j + 1);
        const cIdx = i * rowSize + (j + 1);

        indices.push(a, b, d);
        indices.push(a, d, cIdx);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [c, domain]);

  // Subdivided triangular patch on the saddle surface
  const patchGeometry = useMemo(() => {
    const N = 12;
    const positions: number[] = [];
    const indices: number[] = [];

    const grid: number[][] = [];
    let vertCount = 0;

    for (let i = 0; i <= N; i++) {
      grid[i] = [];
      const uFrac = i / N;
      for (let j = 0; j <= N - i; j++) {
        const vFrac = j / N;
        const wFrac = 1 - uFrac - vFrac;

        const uVal = uFrac * p1.x + vFrac * p2.x + wFrac * p3.x;
        const vVal = uFrac * p1.y + vFrac * p2.y + wFrac * p3.y;
        const [px, py, pz] = toScene(saddlePosition(uVal, vVal, c));

        // Slight normal offset (scene coordinates, y-up) to prevent z-fighting
        const W = Math.sqrt(1 + 4 * c * c * (uVal * uVal + vVal * vVal));
        const nx = (-2 * c * uVal) / W;
        const ny = 1 / W;
        const nz = (2 * c * vVal) / W;

        positions.push(
          px + nx * 0.006,
          py + ny * 0.006,
          pz + nz * 0.006
        );
        grid[i][j] = vertCount++;
      }
    }

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N - i; j++) {
        const a = grid[i][j];
        const b = grid[i + 1][j];
        const d = grid[i][j + 1];

        indices.push(a, b, d);

        if (j < N - i - 1) {
          const e = grid[i + 1][j + 1];
          indices.push(b, e, d);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [p1, p2, p3, c]);

  // Plane for raycasting (XZ plane at y = 0)
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

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

    const intersect = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(dragPlane, intersect)) {
      // Scene x = u, scene z = v (see toScene)
      const u = Math.max(-domain, Math.min(domain, intersect.x));
      const v = Math.max(-domain, Math.min(domain, intersect.z));
      updateSaddleVertex(activeDrag, { x: u, y: v });
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

  const p1_3D = saddlePosition(p1.x, p1.y, c);
  const p2_3D = saddlePosition(p2.x, p2.y, c);
  const p3_3D = saddlePosition(p3.x, p3.y, c);

  return (
    <group
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Saddle Surface Mesh */}
      <mesh geometry={saddleMeshGeo} receiveShadow>
        <meshStandardMaterial
          color={palette.paperRaised}
          emissive={palette.paperSunk}
          emissiveIntensity={0.45}
          roughness={1}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Surface Wireframe Overlay for Curvature Grids */}
      <mesh geometry={saddleMeshGeo}>
        <meshBasicMaterial
          color={palette.ruleStrong}
          wireframe
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* Subdivided Filled Triangle Patch */}
      <mesh geometry={patchGeometry}>
        <meshBasicMaterial
          color={worldColor.hyperbolic}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* True Geodesic Edges on the Saddle */}
      <Line points={edgeAB_pts} color={palette.ink} lineWidth={2.2} />
      <Line points={edgeBC_pts} color={palette.ink} lineWidth={2.2} />
      <Line points={edgeCA_pts} color={palette.ink} lineWidth={2.2} />

      {/* Vertex Handles & Angle Labels */}
      {(() => {
        const handles = [
          { key: 'p1' as const, pos: toScene(p1_3D), label: 'A', angleDeg: (tri.alpha * 180) / Math.PI },
          { key: 'p2' as const, pos: toScene(p2_3D), label: 'B', angleDeg: (tri.beta * 180) / Math.PI },
          { key: 'p3' as const, pos: toScene(p3_3D), label: 'C', angleDeg: (tri.gamma * 180) / Math.PI },
        ];
        const centroid = handles
          .reduce((acc, h) => [acc[0] + h.pos[0], acc[1] + h.pos[1], acc[2] + h.pos[2]], [0, 0, 0])
          .map((v) => v / 3) as [number, number, number];
        return handles.map(({ key, pos, label, angleDeg }) => (
          <VertexHandle
            key={key}
            position={[pos[0], pos[1] + 0.02, pos[2]]}
            labelOffset={outwardOffset(pos, centroid, 0.38, 0.12)}
            label={label}
            angleDeg={angleDeg}
            selected={selectedVertex === key}
            dragging={activeDrag === key}
            color={worldColor.hyperbolic}
            onPointerDown={(e) => handlePointerDown(key, e)}
          />
        ));
      })()}
    </group>
  );
};
