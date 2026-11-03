import React, { useMemo, useState } from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { Poincare } from '../../geometry-engine';
import { palette } from '../../theme/palette';
import {
  PoincareDisk,
  useDiskPointer,
  clampToDisk,
  circleGeometry,
  lineThroughPath,
  polygonPath,
  segmentPath,
  toSvg,
} from '../poincare';

const { Point, Circle, TAU } = Poincare;

/** Hyperbolic size of a footprint, and of the walker itself. */
const FOOTPRINT = 0.07;
const WALKER = 0.12;

const stroke = { vectorEffect: 'non-scaling-stroke' as const };

// ---------------------------------------------------------------- Walk

export const WalkFigure: React.FC = () => {
  const { walker, trail } = useGeometryStore((s) => s.disk);
  const here = Point.givenCoordinates(walker.x, walker.y);

  // Each footprint is a circle of the same hyperbolic size; the map shrinks them near the rim
  const footprints = useMemo(
    () =>
      trail.map((p) => circleGeometry(Circle.givenHyperbolicCenterRadius(Point.givenCoordinates(p.x, p.y), FOOTPRINT) as Poincare.Circle)),
    [trail]
  );
  const body = circleGeometry(Circle.givenHyperbolicCenterRadius(here, WALKER) as Poincare.Circle);
  const ahead = here.hyperbolicDistantPoint(0.45, walker.heading);

  return (
    <PoincareDisk rings={[1, 2, 3, 4, 5, 6]} labelRings ariaLabel="A walker on the Poincaré disk">
      {/* The straight line you are walking along, all the way to the rim */}
      <path d={lineThroughPath(here, walker.heading)} fill="none" stroke={palette.blue} strokeWidth={1.5} strokeDasharray="5 4" {...stroke} />

      {footprints.map((f, i) => (
        <circle key={i} cx={f.cx} cy={f.cy} r={f.r} fill={palette.inkMuted} fillOpacity={0.55} />
      ))}

      <path d={segmentPath(here, ahead)} fill="none" stroke={palette.ink} strokeWidth={3} strokeLinecap="round" {...stroke} />
      <circle cx={body.cx} cy={body.cy} r={body.r} fill={palette.yellow} stroke={palette.ink} strokeWidth={1.75} {...stroke} />
    </PoincareDisk>
  );
};

// ---------------------------------------------------------------- Circles

export const CirclesFigure: React.FC = () => {
  const { cx, cy, r } = useGeometryStore((s) => s.disk.circle);
  const setDiskCircle = useGeometryStore((s) => s.setDiskCircle);
  const { svgRef, toDisk } = useDiskPointer();
  const [dragging, setDragging] = useState(false);

  const center = Point.givenCoordinates(cx, cy);
  const circle = Circle.givenHyperbolicCenterRadius(center, r) as Poincare.Circle;
  const g = circleGeometry(circle);
  const edge = center.hyperbolicDistantPoint(r, 0);
  const [hx, hy] = toSvg(center);

  const move = (e: React.PointerEvent) => {
    if (!dragging) return;
    const p = toDisk(e.clientX, e.clientY);
    if (!p) return;
    const c = clampToDisk(p, 0.9);
    setDiskCircle({ cx: c.x, cy: c.y });
  };

  return (
    <PoincareDisk
      svgRef={svgRef}
      rings={[1, 2, 3]}
      onPointerMove={move}
      onPointerUp={() => setDragging(false)}
      ariaLabel="A hyperbolic circle on the Poincaré disk"
    >
      <circle cx={g.cx} cy={g.cy} r={g.r} fill={palette.yellow} fillOpacity={0.4} stroke={palette.ink} strokeWidth={2} {...stroke} />
      <path d={segmentPath(center, edge)} fill="none" stroke={palette.ink} strokeWidth={1.5} strokeDasharray="4 3" {...stroke} />
      <text
        x={(hx + toSvg(edge)[0]) / 2}
        y={(hy + toSvg(edge)[1]) / 2 - 0.025}
        fontSize="0.055"
        fontFamily="'Newsreader Variable', Georgia, serif"
        fontStyle="italic"
        textAnchor="middle"
        fill={palette.ink}
        className="pointer-events-none"
      >
        r
      </text>

      {/* Centre handle: drag it towards the rim to see the same circle drawn smaller */}
      <g
        className={dragging ? 'cursor-grabbing' : 'cursor-grab'}
        onPointerDown={(e) => {
          (e.currentTarget.ownerSVGElement as SVGSVGElement).setPointerCapture(e.pointerId);
          setDragging(true);
        }}
      >
        <circle cx={hx} cy={hy} r={0.07} fill="transparent" />
        <circle cx={hx} cy={hy} r={dragging ? 0.024 : 0.02} fill={palette.ink} />
      </g>
    </PoincareDisk>
  );
};

// ---------------------------------------------------------------- Tiles

/** Corner angle, how many tiles fit around the corner, and the gap left over. */
export function tilesAtCorner(sides: number, radius: number) {
  const angle = Poincare.regularPolygonCornerAngle(sides, radius);
  const fit = Math.floor(TAU / angle + 1e-6);
  const gap = Math.max(0, TAU - fit * angle);
  return { angle, fit, gap };
}

export const TilesFigure: React.FC = () => {
  const { sides, radius } = useGeometryStore((s) => s.disk.tiles);
  const { angle, fit, gap } = tilesAtCorner(sides, radius);

  const tiles = useMemo(() => {
    // The first tile's corner wedge starts straight up; the rest follow round the corner
    const base = Poincare.regularPolygonWithCornerAtOrigin(sides, radius, Math.PI / 2 + angle / 2);
    return Array.from({ length: fit }, (_, j) => Poincare.rotatePolygonAboutOrigin(base, j * angle));
  }, [sides, radius, angle, fit]);

  // Wedge showing the leftover gap at the shared corner
  const gapPath = useMemo(() => {
    if (gap < 0.005) return null;
    const rr = 0.13;
    const a0 = Math.PI / 2 + fit * angle;
    const a1 = Math.PI / 2 + TAU;
    const large = gap > Math.PI ? 1 : 0;
    return `M 0 0 L ${rr * Math.cos(a0)} ${-rr * Math.sin(a0)} A ${rr} ${rr} 0 ${large} 0 ${rr * Math.cos(a1)} ${-rr * Math.sin(a1)} Z`;
  }, [gap, fit, angle]);

  return (
    <PoincareDisk ariaLabel="Regular polygons meeting at a corner">
      {tiles.map((t, i) => (
        <path
          key={i}
          d={polygonPath(t.getVertices())}
          fill={palette.yellow}
          fillOpacity={i % 2 === 0 ? 0.9 : 0.55}
          stroke={palette.ink}
          strokeWidth={1.75}
          strokeLinejoin="round"
          {...stroke}
        />
      ))}
      {gapPath && <path d={gapPath} fill={palette.red} fillOpacity={0.75} />}
      <circle r={0.016} fill={palette.ink} />
    </PoincareDisk>
  );
};

// ---------------------------------------------------------------- Polygon

export const MAX_POLYGON_CORNERS = 8;

export const PolygonFigure: React.FC = () => {
  const vertices = useGeometryStore((s) => s.disk.polygon);
  const setDiskPolygon = useGeometryStore((s) => s.setDiskPolygon);
  const { svgRef, toDisk } = useDiskPointer();
  const [drag, setDrag] = useState<number | null>(null);

  const points = vertices.map((v) => Point.givenCoordinates(v.x, v.y));
  const simple = Poincare.isSimplePolygon(points);
  const m = points.length >= 3 && simple ? Poincare.measurePolygon(points) : null;

  const centroid = vertices.reduce((acc, v) => ({ x: acc.x + v.x / vertices.length, y: acc.y + v.y / vertices.length }), { x: 0, y: 0 });

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const target = e.target as Element;
    const index = target.getAttribute('data-vertex');
    e.currentTarget.setPointerCapture(e.pointerId);
    if (index !== null) {
      setDrag(Number(index));
      return;
    }
    const p = toDisk(e.clientX, e.clientY);
    if (!p || Math.hypot(p.x, p.y) >= 0.99 || vertices.length >= MAX_POLYGON_CORNERS) return;
    setDiskPolygon([...vertices, clampToDisk(p)]);
    setDrag(vertices.length);
  };

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drag === null) return;
    const p = toDisk(e.clientX, e.clientY);
    if (!p) return;
    const next = vertices.slice();
    next[drag] = clampToDisk(p);
    setDiskPolygon(next);
  };

  return (
    <PoincareDisk
      svgRef={svgRef}
      rings={[1, 2, 3]}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={() => setDrag(null)}
      className={vertices.length < MAX_POLYGON_CORNERS ? 'cursor-crosshair' : ''}
      ariaLabel="A polygon you can draw on the Poincaré disk"
    >
      {points.length >= 2 && (
        <path
          d={polygonPath(points)}
          fill={palette.yellow}
          fillOpacity={points.length >= 3 && simple ? 0.88 : 0}
          strokeDasharray={simple ? undefined : '5 4'}
          stroke={palette.ink}
          strokeWidth={2}
          strokeLinejoin="round"
          {...stroke}
        />
      )}

      {vertices.map((v, i) => {
        const dx = v.x - centroid.x;
        const dy = v.y - centroid.y;
        const len = Math.hypot(dx, dy) || 1;
        const lx = v.x + (dx / len) * 0.1;
        const ly = -(v.y + (dy / len) * 0.1);
        return (
          <g key={i}>
            {m && (
              <text
                x={lx}
                y={ly}
                fontSize="0.048"
                fontFamily="'IBM Plex Mono', monospace"
                textAnchor="middle"
                dominantBaseline="central"
                fill={palette.ink}
                className="pointer-events-none"
              >
                {((m.angles[i] * 180) / Math.PI).toFixed(1)}°
              </text>
            )}
            <circle data-vertex={i} cx={v.x} cy={-v.y} r={0.06} fill="transparent" className="cursor-grab" />
            <circle cx={v.x} cy={-v.y} r={drag === i ? 0.022 : 0.018} fill={palette.ink} className="pointer-events-none" />
          </g>
        );
      })}
    </PoincareDisk>
  );
};
