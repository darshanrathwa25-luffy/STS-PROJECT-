import React, { useCallback, useId, useRef } from 'react';
import { palette } from '../../theme/palette';

export interface DiskPoint {
  x: number;
  y: number;
}

/** Map a pointer position to disk coordinates (unit disk, y up). */
export function useDiskPointer() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const toDisk = useCallback((clientX: number, clientY: number): DiskPoint | null => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: -local.y };
  }, []);
  return { svgRef, toDisk };
}

/** Keep a point strictly inside the disk (Euclidean radius ≤ max). */
export function clampToDisk(p: DiskPoint, max = 0.97): DiskPoint {
  const r = Math.hypot(p.x, p.y);
  return r <= max ? p : { x: (p.x / r) * max, y: (p.y / r) * max };
}

/** Euclidean radius on the map of a point at hyperbolic distance d from the centre. */
export const mapRadiusAt = (d: number) => Math.tanh(d / 2);

interface PoincareDiskProps {
  svgRef?: React.Ref<SVGSVGElement>;
  /** Draw rings at these hyperbolic distances from the centre. */
  rings?: number[];
  /** Label each ring with its distance. */
  labelRings?: boolean;
  className?: string;
  children?: React.ReactNode;
  onPointerDown?: React.PointerEventHandler<SVGSVGElement>;
  onPointerMove?: React.PointerEventHandler<SVGSVGElement>;
  onPointerUp?: React.PointerEventHandler<SVGSVGElement>;
  ariaLabel?: string;
}

/**
 * The Poincaré disk: the whole hyperbolic plane drawn inside a circle. Children are
 * SVG elements in disk coordinates with y flipped (use the helpers in ./paths).
 * Strokes use non-scaling widths, so pass widths in screen pixels.
 */
export const PoincareDisk: React.FC<PoincareDiskProps> = ({
  svgRef,
  rings = [],
  labelRings = false,
  className = '',
  children,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ariaLabel = 'Poincaré disk',
}) => {
  const clipId = `disk-clip-${useId().replace(/:/g, '')}`;
  return (
  <svg
    ref={svgRef}
    viewBox="-1.08 -1.08 2.16 2.16"
    preserveAspectRatio="xMidYMid meet"
    className={`w-full h-full select-none ${className}`}
    style={{ touchAction: 'none' }}
    onPointerDown={onPointerDown}
    onPointerMove={onPointerMove}
    onPointerUp={onPointerUp}
    onPointerCancel={onPointerUp}
    role="img"
    aria-label={ariaLabel}
  >
    <defs>
      <clipPath id={clipId}>
        <circle r="1" />
      </clipPath>
    </defs>

    <circle r="1" fill={palette.paperRaised} />

    {rings.map((d) => (
      <circle
        key={d}
        r={mapRadiusAt(d)}
        fill="none"
        stroke={palette.rule}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    ))}
    {labelRings &&
      // Outer rings crowd against the rim, so only the first few are numbered
      rings.filter((d) => mapRadiusAt(d) < 0.92).map((d) => (
        <text
          key={`l${d}`}
          x={-mapRadiusAt(d) + 0.012}
          y={-0.012}
          fontSize="0.04"
          fontFamily="'IBM Plex Mono', monospace"
          fill={palette.inkFaint}
          className="pointer-events-none"
        >
          {d}
        </text>
      ))}

    <g clipPath={`url(#${clipId})`}>{children}</g>

    {/* The boundary: every point on it is infinitely far from the centre */}
    <circle r="1" fill="none" stroke={palette.ink} strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
  </svg>
  );
};
