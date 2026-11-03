import React from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { palette } from '../../theme/palette';

type Vec3 = [number, number, number];

interface VertexHandleProps {
  position: Vec3;
  /** Where the label sits relative to the vertex (scene units), usually pointing away from the triangle. */
  labelOffset: Vec3;
  label: string;
  angleDeg: number;
  selected: boolean;
  dragging: boolean;
  showLabel?: boolean;
  /** World colour, used for the selection ring. */
  color: string;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}

/** Draggable triangle corner shared by the sphere and saddle scenes. */
export const VertexHandle: React.FC<VertexHandleProps> = ({
  position,
  labelOffset,
  label,
  angleDeg,
  selected,
  dragging,
  showLabel = true,
  color,
  onPointerDown,
}) => (
  <group position={position}>
    {/* Generous invisible hit area so the corner is easy to grab */}
    <mesh onPointerDown={onPointerDown}>
      <sphereGeometry args={[0.22, 12, 12]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>

    <mesh scale={dragging ? 1.25 : 1}>
      <sphereGeometry args={[0.07, 20, 20]} />
      <meshBasicMaterial color={palette.ink} />
    </mesh>

    {selected && (
      <mesh scale={dragging ? 1.25 : 1}>
        <sphereGeometry args={[0.115, 20, 20]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} depthWrite={false} />
      </mesh>
    )}

    {showLabel && (
      <Html position={labelOffset} center distanceFactor={6} className="pointer-events-none select-none">
        <div className="flex items-baseline gap-1 px-1.5 py-0.5 bg-paper-raised border border-rule-strong text-ink whitespace-nowrap">
          <span className="font-serif italic text-[15px] leading-none">{label}</span>
          <span className="font-mono text-[12px] leading-none tabular">{angleDeg.toFixed(1)}°</span>
        </div>
      </Html>
    )}
  </group>
);

/** Offset pointing from the centroid through the vertex, scaled to `dist`. */
export function outwardOffset(vertex: Vec3, centroid: Vec3, dist: number, lift = 0): Vec3 {
  const d: Vec3 = [vertex[0] - centroid[0], vertex[1] - centroid[1], vertex[2] - centroid[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1;
  return [(d[0] / len) * dist, (d[1] / len) * dist + lift, (d[2] / len) * dist];
}
