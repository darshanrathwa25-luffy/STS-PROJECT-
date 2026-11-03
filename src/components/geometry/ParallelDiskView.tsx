import React, { useMemo } from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { Poincare, PARALLEL_LAB_SETUP, classifyParallelCandidate, ParallelVerdict } from '../../geometry-engine';
import { palette } from '../../theme/palette';
import { PoincareDisk, fullLinePath, segmentPath, toSvg } from '../poincare';

const { Point, Line } = Poincare;

// Same colours as ParallelControls and the flat and sphere scenes
const VERDICT_COLOR: Record<ParallelVerdict, string> = {
  meets: palette.red,
  misses: palette.blue,
  limiting: palette.ochre,
};

const stroke = { vectorEffect: 'non-scaling-stroke' as const };

const { P: P_COORDS, L: L_COORDS } = PARALLEL_LAB_SETUP.hyperbolic;
const P = Point.givenCoordinates(P_COORDS.x, P_COORDS.y);
const L = Line.givenTwoPoints(Point.givenCoordinates(L_COORDS[0].x, L_COORDS[0].y), Point.givenCoordinates(L_COORDS[1].x, L_COORDS[1].y));

const lineAt = (deg: number) => Line.givenTwoPoints(P, P.hyperbolicDistantPoint(0.5, (deg * Math.PI) / 180));

/** The Parallel lab's saddle world, drawn flat on the Poincaré disk. */
export const ParallelDiskView: React.FC = () => {
  const { candidateAngleDeg, showFan } = useGeometryStore((s) => s.parallelExperiment);
  const result = classifyParallelCandidate('hyperbolic', candidateAngleDeg);
  const limit = result.limitAngleDeg ?? 0;

  const candidate = lineAt(candidateAngleDeg);
  const crossing = result.verdict === 'meets' ? Line.hyperbolicIntersect(candidate, L) : false;

  // For a limiting parallel, the end it shares with L on the rim
  const sharedEnd = useMemo(() => {
    if (result.verdict !== 'limiting') return null;
    const ends = candidate.getIdealPoints();
    if (!ends) return null;
    return ends.reduce((best, e) => (Math.abs(e.getY()) < Math.abs(best.getY()) ? e : best));
  }, [result.verdict, candidate]);

  const fan = useMemo(() => {
    if (!showFan) return [];
    return [-70, -50, -limit, -20, 0, 20, limit, 50, 70]
      .filter((a) => Math.abs(a - candidateAngleDeg) > 2)
      .map((a) => ({ d: fullLinePath(lineAt(a)), color: VERDICT_COLOR[classifyParallelCandidate('hyperbolic', a).verdict] }));
  }, [showFan, limit, candidateAngleDeg]);

  const [px, py] = toSvg(P);

  return (
    <div className="absolute inset-0 bg-paper flex items-center justify-center p-4 pb-10">
      <div className="h-full max-w-full aspect-square">
        <PoincareDisk ariaLabel="Line L and a line through P on the Poincaré disk">
          {fan.map((f, i) => (
            <path key={i} d={f.d} fill="none" stroke={f.color} strokeOpacity={0.45} strokeWidth={1.25} {...stroke} />
          ))}

          {/* The perpendicular from P to L: its length is d, and Π(d) is measured from it */}
          <path d={segmentPath(P, Point.ORIGIN)} fill="none" stroke={palette.inkMuted} strokeWidth={1.25} strokeDasharray="4 3" {...stroke} />
          <text x={0.03} y={py / 2 + 0.02} fontSize="0.06" fontFamily="'Newsreader Variable', Georgia, serif" fontStyle="italic" fill={palette.inkMuted}>
            d
          </text>

          <path d={fullLinePath(L)} fill="none" stroke={palette.ink} strokeWidth={3} {...stroke} />
          <path d={fullLinePath(candidate)} fill="none" stroke={VERDICT_COLOR[result.verdict]} strokeWidth={3} {...stroke} />

          {crossing && <circle cx={toSvg(crossing)[0]} cy={toSvg(crossing)[1]} r={0.022} fill={palette.red} />}
          {sharedEnd && <circle cx={toSvg(sharedEnd)[0]} cy={toSvg(sharedEnd)[1]} r={0.03} fill={palette.ochre} />}

          <circle cx={px} cy={py} r={0.024} fill={palette.blue} stroke={palette.paperRaised} strokeWidth={1.5} {...stroke} />

          <text x={0.8} y={-0.04} fontSize="0.075" fontFamily="'Newsreader Variable', Georgia, serif" fontStyle="italic" fill={palette.ink}>
            L
          </text>
          <text x={px + 0.045} y={py - 0.04} fontSize="0.075" fontFamily="'Newsreader Variable', Georgia, serif" fontStyle="italic" fill={palette.ink}>
            P
          </text>
        </PoincareDisk>
      </div>
      <p className="absolute bottom-3 left-4 right-4 pointer-events-none text-[12px] text-ink-muted">
        The saddle's geometry drawn flat on the Poincaré disk. Straight lines are arcs that meet the rim at right angles.
      </p>
    </div>
  );
};
