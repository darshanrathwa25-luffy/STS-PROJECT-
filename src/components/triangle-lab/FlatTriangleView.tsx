import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { euclideanTriangle, Point2D } from '../../geometry-engine';

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

    const arcPath = `M ${vertex.x} ${-vertex.y} L ${startX} ${startY} A ${radius} ${radius} 0 0 ${sweep} ${endX} ${endY} Z`;

    // Midpoint for text label
    const midAngle = a1 + (sweep ? sweepAngle * 0.5 : -sweepAngle * 0.5);
    const textRadius = radius + 0.22;
    const textX = vertex.x + textRadius * Math.cos(midAngle);
    const textY = -vertex.y + textRadius * Math.sin(midAngle);

    return { arcPath, textX, textY };
  };

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
          stroke={Math.abs(x) < 1e-4 ? '#292C35' : '#141720'}
          strokeWidth={Math.abs(x) < 1e-4 ? 0.02 : 0.008}
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
          stroke={Math.abs(y) < 1e-4 ? '#292C35' : '#141720'}
          strokeWidth={Math.abs(y) < 1e-4 ? 0.02 : 0.008}
        />
      );
    }
    return lines;
  }, []);

  return (
    <div
      className="relative w-full h-full bg-[#090A0D] flex items-center justify-center overflow-hidden select-none"
      style={{ touchAction: 'none' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <svg
        ref={svgRef}
        viewBox="-3.2 -2.4 6.4 4.8"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full cursor-crosshair"
      >
        {/* Subtle Background Grid */}
        <g id="grid">{gridLines}</g>

        {/* Triangle Shaded Interior */}
        <polygon
          points={`${p1.x},${-p1.y} ${p2.x},${-p2.y} ${p3.x},${-p3.y}`}
          fill="#69A3FF"
          fillOpacity="0.14"
          stroke="#69A3FF"
          strokeWidth="0.035"
          strokeLinejoin="round"
        />

        {/* Interior Angle Arcs */}
        <path d={arcA.arcPath} fill="#69A3FF" fillOpacity="0.25" stroke="#69A3FF" strokeWidth="0.015" />
        <path d={arcB.arcPath} fill="#69A3FF" fillOpacity="0.25" stroke="#69A3FF" strokeWidth="0.015" />
        <path d={arcC.arcPath} fill="#69A3FF" fillOpacity="0.25" stroke="#69A3FF" strokeWidth="0.015" />

        {/* Degree Angle Labels */}
        <text
          x={arcA.textX}
          y={arcA.textY}
          fill="#E8EAF0"
          fontSize="0.15"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="600"
          textAnchor="middle"
          dominantBaseline="central"
          className="pointer-events-none drop-shadow"
        >
          {((tri.alpha * 180) / Math.PI).toFixed(1)}°
        </text>

        <text
          x={arcB.textX}
          y={arcB.textY}
          fill="#E8EAF0"
          fontSize="0.15"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="600"
          textAnchor="middle"
          dominantBaseline="central"
          className="pointer-events-none drop-shadow"
        >
          {((tri.beta * 180) / Math.PI).toFixed(1)}°
        </text>

        <text
          x={arcC.textX}
          y={arcC.textY}
          fill="#E8EAF0"
          fontSize="0.15"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="600"
          textAnchor="middle"
          dominantBaseline="central"
          className="pointer-events-none drop-shadow"
        >
          {((tri.gamma * 180) / Math.PI).toFixed(1)}°
        </text>

        {/* Edge Midpoint Side Labels */}
        <text
          x={(p2.x + p3.x) / 2}
          y={-(p2.y + p3.y) / 2 - 0.08}
          fill="#858B9A"
          fontSize="0.12"
          fontFamily="JetBrains Mono, monospace"
          textAnchor="middle"
          className="pointer-events-none"
        >
          a={tri.a.toFixed(2)}
        </text>
        <text
          x={(p1.x + p3.x) / 2 - 0.12}
          y={-(p1.y + p3.y) / 2}
          fill="#858B9A"
          fontSize="0.12"
          fontFamily="JetBrains Mono, monospace"
          textAnchor="middle"
          className="pointer-events-none"
        >
          b={tri.b.toFixed(2)}
        </text>
        <text
          x={(p1.x + p2.x) / 2}
          y={-(p1.y + p2.y) / 2 + 0.16}
          fill="#858B9A"
          fontSize="0.12"
          fontFamily="JetBrains Mono, monospace"
          textAnchor="middle"
          className="pointer-events-none"
        >
          c={tri.c.toFixed(2)}
        </text>

        {/* Draggable Vertex Handles (Min 24px Desktop, 44px Touch) */}
        {[
          { key: 'p1' as const, pt: p1, label: 'A' },
          { key: 'p2' as const, pt: p2, label: 'B' },
          { key: 'p3' as const, pt: p3, label: 'C' },
        ].map(({ key, pt, label }) => {
          const isSelected = selectedVertex === key;
          const isDraggingThis = activeDrag === key;

          return (
            <g
              key={key}
              transform={`translate(${pt.x}, ${-pt.y})`}
              className="cursor-grab active:cursor-grabbing transition-transform"
              onPointerDown={(e) => handlePointerDown(key, e)}
            >
              {/* Invisible Large Touch Target (44px equivalent) */}
              <circle r="0.3" fill="transparent" />

              {/* Pulsing selection aura */}
              {isSelected && (
                <circle
                  r="0.18"
                  fill="none"
                  stroke="#69A3FF"
                  strokeWidth="0.02"
                  strokeDasharray="0.04 0.02"
                  opacity="0.8"
                />
              )}

              {/* Visible Handle */}
              <circle
                r={isDraggingThis ? '0.12' : '0.10'}
                fill={isSelected ? '#69A3FF' : '#181B22'}
                stroke={isSelected ? '#FFFFFF' : '#69A3FF'}
                strokeWidth="0.025"
                className="transition-all duration-100"
              />

              {/* Vertex Label */}
              <text
                y="-0.16"
                fill={isSelected ? '#69A3FF' : '#E8EAF0'}
                fontSize="0.14"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
                textAnchor="middle"
                className="pointer-events-none select-none drop-shadow"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
