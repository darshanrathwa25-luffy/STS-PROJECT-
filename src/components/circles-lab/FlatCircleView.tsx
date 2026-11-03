import React, { useCallback, useRef, useState } from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { palette, worldColor } from '../../theme/palette';

export const FLAT_CIRCLE_MAX = 2.2;

/** A circle on the flat plane, with a handle on its edge to change the radius. */
export const FlatCircleView: React.FC = () => {
  const r = useGeometryStore((s) => s.circles.flat);
  const setCircleRadius = useGeometryStore((s) => s.setCircleRadius);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const toPlane = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: -local.y };
  }, []);

  const grid = [];
  for (let x = -3; x <= 3; x += 0.5) grid.push(<line key={`x${x}`} x1={x} y1={-2.4} x2={x} y2={2.4} stroke={palette.rule} strokeWidth={0.006} />);
  for (let y = -2; y <= 2; y += 0.5) grid.push(<line key={`y${y}`} x1={-3.2} y1={y} x2={3.2} y2={y} stroke={palette.rule} strokeWidth={0.006} />);

  return (
    <div className="absolute inset-0 bg-paper select-none">
      <svg
        ref={svgRef}
        viewBox="-3.2 -2.4 6.4 4.8"
        className="w-full h-full"
        style={{ touchAction: 'none' }}
        onPointerMove={(e) => {
          if (!dragging) return;
          const p = toPlane(e.clientX, e.clientY);
          if (p) setCircleRadius('flat', Math.min(FLAT_CIRCLE_MAX, Math.max(0.1, Math.round(Math.hypot(p.x, p.y) * 20) / 20)));
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        role="img"
        aria-label="A circle on a flat plane"
      >
        {grid}
        <circle r={r} fill={worldColor.flat} fillOpacity={0.85} stroke={palette.ink} strokeWidth={0.028} />
        <line x1={0} y1={0} x2={r} y2={0} stroke={palette.paperRaised} strokeWidth={0.02} strokeDasharray="0.06 0.05" />
        <text
          x={r / 2}
          y={-0.08}
          fontSize="0.2"
          fontFamily="'Newsreader Variable', Georgia, serif"
          fontStyle="italic"
          textAnchor="middle"
          fill={palette.paperRaised}
          className="pointer-events-none"
        >
          r
        </text>
        <circle r={0.05} fill={palette.paperRaised} />
        <g
          className={dragging ? 'cursor-grabbing' : 'cursor-grab'}
          onPointerDown={(e) => {
            (e.currentTarget.ownerSVGElement as SVGSVGElement).setPointerCapture(e.pointerId);
            setDragging(true);
          }}
        >
          <circle cx={r} cy={0} r={0.3} fill="transparent" />
          <circle cx={r} cy={0} r={dragging ? 0.085 : 0.07} fill={palette.ink} />
        </g>
      </svg>
      <p className="absolute bottom-3 left-4 right-4 pointer-events-none text-[12px] text-ink-muted">
        Drag the dot on the edge to change the radius.
      </p>
    </div>
  );
};
