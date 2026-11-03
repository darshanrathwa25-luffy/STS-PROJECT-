import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { euclideanTriangle, Point2D } from '../../geometry-engine';
import { palette, worldColor } from '../../theme/palette';

export const FlatTriangleView: React.FC = () => {
  const {
    flatTriangle,
    updateFlatVertex,
    selectedVertex,
    setSelectedVertex,
    setIsDragging,
  } = useGeometryStore();

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeDrag, setActiveDrag] = useState<'p1' | 'p2' | 'p3' | null>(null);

  const { p1, p2, p3 } = flatTriangle;

  // Calculate live Euclidean measurements
  const tri = useMemo(() => {
    return euclideanTriangle(p1, p2, p3);
  }, [p1, p2, p3]);

  // Convert screen client coordinates to SVG mathematical space
  const screenToWorld = useCallback((clientX: number, clientY: number): Point2D | null => {
    if (!svgRef.current) return null;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const svgPt = pt.matrixTransform(ctm.inverse());
    // In our SVG space: mathematical x is svgPt.x, mathematical y is -svgPt.y
    return {
      x: Math.max(-2.5, Math.min(2.5, svgPt.x)),
      y: Math.max(-2.2, Math.min(2.2, -svgPt.y)),
    };
  }, []);

  const handlePointerDown = (vertex: 'p1' | 'p2' | 'p3', e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setActiveDrag(vertex);
    setSelectedVertex(vertex);
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag) return;
    const worldPt = screenToWorld(e.clientX, e.clientY);
    if (worldPt) {
      updateFlatVertex(activeDrag, worldPt);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDrag) {
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture guard
      }
      setActiveDrag(null);
      setIsDragging(false);
    }
  };

  // Helper to construct angle arc path between two neighbor vertices
  const createAngleArc = (
    vertex: Point2D,
    vTo1: Point2D,
    vTo2: Point2D,
    radius = 0.32
  ) => {
    const dx1 = vTo1.x - vertex.x;
    const dy1 = -(vTo1.y - vertex.y); // in SVG space (+y is down)
    const dx2 = vTo2.x - vertex.x;
    const dy2 = -(vTo2.y - vertex.y);

    const a1 = Math.atan2(dy1, dx1);
    const a2 = Math.atan2(dy2, dx2);

    let diff = a2 - a1;
    while (diff < 0) diff += 2 * Math.PI;
    while (diff >= 2 * Math.PI) diff -= 2 * Math.PI;

    // Check direction
    const sweep = diff > Math.PI ? 0 : 1;
    const sweepAngle = diff > Math.PI ? 2 * Math.PI - diff : diff;

    const startX = vertex.x + radius * Math.cos(a1);
    const startY = -vertex.y + radius * Math.sin(a1);
    const endX = vertex.x + radius * Math.cos(a1 + (sweep ? sweepAngle : -sweepAngle));
    const endY = -vertex.y + radius * Math.sin(a1 + (sweep ? sweepAngle : -sweepAngle));

    const arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 0 ${sweep} ${endX} ${endY}`;

    return { arcPath };
  };

  // Labels sit outside the triangle: push each one away from the centroid (SVG space, y down)
  const centroid = { x: (p1.x + p2.x + p3.x) / 3, y: -(p1.y + p2.y + p3.y) / 3 };
  const awayFromCentroid = (x: number, y: number, dist: number) => {
    const dx = x - centroid.x;
    const dy = y - centroid.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: x + (dx / len) * dist, y: y + (dy / len) * dist };
  };
  const vertexLabel = (pt: Point2D) => awayFromCentroid(pt.x, -pt.y, 0.36);
  const sideLabel = (a: Point2D, b: Point2D) => awayFromCentroid((a.x + b.x) / 2, -(a.y + b.y) / 2, 0.2);

  const arcA = createAngleArc(p1, p2, p3);
  const arcB = createAngleArc(p2, p3, p1);
  const arcC = createAngleArc(p3, p1, p2);

  // SVG grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    for (let x = -2.5; x <= 2.5; x += 0.5) {
      lines.push(
        <line
          key={`gx_${x}`}
          x1={x}
          y1={-2.4}
          x2={x}
          y2={2.4}
          stroke={palette.rule}
          strokeWidth={Math.abs(x) < 1e-4 ? 0.012 : 0.006}
        />
      );
    }
    for (let y = -2.0; y <= 2.0; y += 0.5) {
      lines.push(
        <line
          key={`gy_${y}`}
          x1={-2.8}
          y1={y}
          x2={2.8}
          y2={y}
          stroke={palette.rule}
          strokeWidth={Math.abs(y) < 1e-4 ? 0.012 : 0.006}
        />
      );
    }
    return lines;
  }, []);

  return (
    <div
      className="relative w-full h-full bg-paper flex items-center justify-center overflow-hidden select-none"
      style={{ touchAction: 'none' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <svg
        ref={svgRef}
        viewBox="-3.2 -2.4 6.4 4.8"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        {/* Subtle Background Grid */}
        <g id="grid">{gridLines}</g>

        {/* Triangle body: a flat block of the world colour, edged in ink */}
        <polygon
          points={`${p1.x},${-p1.y} ${p2.x},${-p2.y} ${p3.x},${-p3.y}`}
          fill={worldColor.flat}
          fillOpacity="0.88"
          stroke={palette.ink}
          strokeWidth="0.028"
          strokeLinejoin="round"
        />

        {/* Angle arcs */}
        {[arcA, arcB, arcC].map((arc, i) => (
          <path key={i} d={arc.arcPath} fill="none" stroke={palette.paperRaised} strokeWidth="0.018" />
        ))}

        {/* Side lengths, outside each edge */}
        {[
          { name: 'a', value: tri.a, pos: sideLabel(p2, p3) },
          { name: 'b', value: tri.b, pos: sideLabel(p1, p3) },
          { name: 'c', value: tri.c, pos: sideLabel(p1, p2) },
        ].map(({ name, value, pos }) => (
          <text
            key={name}
            x={pos.x}
            y={pos.y}
            fill={palette.inkMuted}
            fontSize="0.13"
            fontFamily="'IBM Plex Mono', monospace"
            textAnchor="middle"
            dominantBaseline="central"
            className="pointer-events-none"
          >
            <tspan fontFamily="'Newsreader Variable', Georgia, serif" fontStyle="italic" fontSize="0.15">{name}</tspan>
            {` ${value.toFixed(2)}`}
          </text>
        ))}

        {/* Draggable corners with their angle */}
        {[
          { key: 'p1' as const, pt: p1, label: 'A', angle: tri.alpha },
          { key: 'p2' as const, pt: p2, label: 'B', angle: tri.beta },
          { key: 'p3' as const, pt: p3, label: 'C', angle: tri.gamma },
        ].map(({ key, pt, label, angle }) => {
          const isSelected = selectedVertex === key;
          const isDraggingThis = activeDrag === key;
          const lp = vertexLabel(pt);

          return (
            <g key={key}>
              <text
                x={lp.x}
                y={lp.y}
                fill={palette.ink}
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none select-none"
              >
                <tspan fontFamily="'Newsreader Variable', Georgia, serif" fontStyle="italic" fontSize="0.2">{label}</tspan>
                <tspan fontFamily="'IBM Plex Mono', monospace" fontSize="0.13" dx="0.06">
                  {((angle * 180) / Math.PI).toFixed(1)}°
                </tspan>
              </text>

              <g
                transform={`translate(${pt.x}, ${-pt.y})`}
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => handlePointerDown(key, e)}
              >
                {/* Invisible touch target (about 44px) */}
                <circle r="0.3" fill="transparent" />
                {isSelected && (
                  <circle r="0.15" fill={palette.paperRaised} fillOpacity="0.6" stroke={palette.ink} strokeWidth="0.014" />
                )}
                <circle r={isDraggingThis ? 0.085 : 0.07} fill={palette.ink} />
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
