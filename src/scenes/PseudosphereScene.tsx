import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { generatePseudosphereGeometry } from '../geometry-engine';
import { useGeometryStore } from '../store/geometryStore';
import { AlertTriangle, Info } from 'lucide-react';

export const PseudosphereScene: React.FC = () => {
  const { appearance } = useGeometryStore();
  const { showSurface, showGrid, particleCount } = appearance;

  // Generate upper and lower sheets of the pseudosphere
  const upperMesh = useMemo(() => generatePseudosphereGeometry(1.8, 0.08, 2.8, 48, 64), []);
  const lowerMesh = useMemo(() => {
    // Mirror vertically for double-trumpet pseudosphere
    const m = generatePseudosphereGeometry(1.8, 0.08, 2.8, 48, 64);
    const pos = new Float32Array(m.vertices.length);
    const norms = new Float32Array(m.normals.length);
    for (let i = 0; i < m.vertices.length; i += 3) {
      pos[i] = m.vertices[i];
      pos[i + 1] = -m.vertices[i + 1]; // invert Y
      pos[i + 2] = m.vertices[i + 2];

      norms[i] = m.normals[i];
      norms[i + 1] = -m.normals[i + 1];
      norms[i + 2] = m.normals[i + 2];
    }
    return { ...m, vertices: pos, normals: norms };
  }, []);

  // Surface particles sampled on the tractricoid
  const particleGeo = useMemo(() => {
    const count = Math.min(particleCount, 4000);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const u = 0.1 + Math.random() * 2.5;
      const v = Math.random() * 2 * Math.PI;
      const sign = Math.random() > 0.5 ? 1 : -1;

      const sech = 1 / Math.cosh(u);
      const tanh = Math.tanh(u);
      const R = 1.8;

      const x = R * sech * Math.cos(v);
      const y = sign * (R * (u - tanh) - 1.2);
      const z = R * sech * Math.sin(v);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      colors[i * 3] = 0.85;
      colors[i * 3 + 1] = 0.9;
      colors[i * 3 + 2] = 1.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [particleCount]);

  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Gentle subtle rotation to appreciate 3D saddle curvature
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Upper Funnel Sheet */}
      {showSurface && (
        <mesh position={[0, 0, 0]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={upperMesh.vertices.length / 3}
              array={upperMesh.vertices}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-normal"
              count={upperMesh.normals.length / 3}
              array={upperMesh.normals}
              itemSize={3}
            />
            <bufferAttribute
              attach="index"
              count={upperMesh.indices.length}
              array={upperMesh.indices}
              itemSize={1}
            />
          </bufferGeometry>
          <meshStandardMaterial
            color="#121620"
            roughness={0.3}
            metalness={0.7}
            wireframe={false}
            side={THREE.DoubleSide}
            transparent
            opacity={0.88}
          />
        </mesh>
      )}

      {/* Lower Funnel Sheet */}
      {showSurface && (
        <mesh position={[0, 0, 0]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={lowerMesh.vertices.length / 3}
              array={lowerMesh.vertices}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-normal"
              count={lowerMesh.normals.length / 3}
              array={lowerMesh.normals}
              itemSize={3}
            />
            <bufferAttribute
              attach="index"
              count={lowerMesh.indices.length}
              array={lowerMesh.indices}
              itemSize={1}
            />
          </bufferGeometry>
          <meshStandardMaterial
            color="#121620"
            roughness={0.3}
            metalness={0.7}
            wireframe={false}
            side={THREE.DoubleSide}
            transparent
            opacity={0.88}
          />
        </mesh>
      )}

      {/* Coordinate Grid Lines (Meridians & Parallels) */}
      {showGrid && (
        <group>
          {upperMesh.uGridLines.map((pts, idx) => (
            <line key={`u-${idx}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={pts.length / 3}
                  array={pts}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#3A4A68" transparent opacity={0.45} />
            </line>
          ))}
          {upperMesh.vGridLines.map((pts, idx) => (
            <line key={`v-${idx}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={pts.length / 3}
                  array={pts}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#69A3FF" transparent opacity={0.35} />
            </line>
          ))}
        </group>
      )}

      {/* Cuspidal Edge Ring (u = 0 boundary where singularity occurs) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <ringGeometry args={[1.78, 1.82, 64]} />
        <meshBasicMaterial color="#FFD166" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Surface Particles */}
      <points geometry={particleGeo}>
        <pointsMaterial
          size={0.035}
          vertexColors
          transparent
          opacity={0.7}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
};

