import React, { useMemo } from 'react';
import { useGeometryStore, WorldKind } from '../../store/geometryStore';
import { classifyParallelCandidate, GeometryKind, ParallelVerdict } from '../../geometry-engine';
import { palette } from '../../theme/palette';

const KIND: Record<WorldKind, GeometryKind> = {
  flat: 'euclidean',
  sphere: 'spherical',
  hyperbolic: 'hyperbolic',
};

// Same colours the scenes use for the line through P
const VERDICT_COLOR: Record<ParallelVerdict, string> = {
  meets: palette.red,
  misses: palette.blue,
  limiting: palette.ochre,
};

const VERDICT_TEXT: Record<ParallelVerdict, string> = {
  meets: 'Meets L',
  misses: 'Never meets L',
  limiting: 'Only meets L at infinity',
};

/** Margin-column controls for the Parallel lab: rotate the line through P and read the verdict. */
export const ParallelControls: React.FC = () => {
  const { world, parallelExperiment, setCandidateAngle, setShowFan, mode, solvedQuestions } = useGeometryStore();
  // In the tutorial, finding the limit is the task, so its shortcut waits until it's found
  const showLimitSnaps = mode === 'explorer' || solvedQuestions['par_hyperbolic'];
  const { candidateAngleDeg, showFan } = parallelExperiment;

  const result = useMemo(
    () => classifyParallelCandidate(KIND[world], candidateAngleDeg),
    [world, candidateAngleDeg]
  );

  const limit = result.limitAngleDeg;

  const summary =
    world === 'flat'
      ? 'Only the perfectly level line (0°) misses L. Tilt it by any amount and the two lines cross somewhere.'
      : world === 'sphere'
      ? 'Straight lines on a sphere are great circles, and any two of them cross twice, at opposite sides of the globe. Try every angle: none escapes.'
      : `Every angle between −${limit!.toFixed(1)}° and +${limit!.toFixed(1)}° misses L. Those two edges are the limiting parallels; between them is a whole fan of lines that never meet L. Measured from the dashed perpendicular PL instead, a limiting parallel is at Π(d) = ${result.angleOfParallelismDeg!.toFixed(1)}°: the angle of parallelism, for d = ${result.distance.toFixed(2)}.`;

  const snaps: { label: string; value: number }[] = [{ label: 'Level, 0°', value: 0 }];
  if (limit !== undefined && showLimitSnaps) {
    snaps.push(
      { label: `Limit, +${limit.toFixed(1)}°`, value: Math.round(limit * 2) / 2 },
      { label: `−${limit.toFixed(1)}°`, value: -Math.round(limit * 2) / 2 }
    );
  }

  return (
    <section aria-label="Parallel line controls" className="px-5 pt-5 pb-6 border-b border-rule">
      <div className="text-[13px] text-ink-muted">Line through P</div>

      <div className="mt-2 flex items-center gap-2.5">
        <span className="w-3 h-3 shrink-0" style={{ background: VERDICT_COLOR[result.verdict] }} aria-hidden="true" />
        <span className="font-serif text-[28px] leading-tight text-ink" aria-live="polite">
          {VERDICT_TEXT[result.verdict]}
        </span>
      </div>
      {result.verdict === 'meets' && (
        <p className="mt-1 text-[14px] text-ink-soft">
          {result.crossings === 2 ? 'It crosses L twice.' : 'It crosses L once.'}
        </p>
      )}

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <label htmlFor="parallel-angle" className="text-[14px] text-ink-soft">
            Angle <span className="font-serif italic text-[16px]">θ</span>
          </label>
          <span className="font-mono text-[14px] text-ink tabular">{candidateAngleDeg.toFixed(1)}°</span>
        </div>
        <input
          id="parallel-angle"
          type="range"
          min={-85}
          max={85}
          step={0.5}
          value={candidateAngleDeg}
          onChange={(e) => setCandidateAngle(parseFloat(e.target.value))}
          className="mt-2 w-full cursor-pointer"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {snaps.map((s) => (
            <button
              key={s.label}
              onClick={() => setCandidateAngle(s.value)}
              className={`h-7 px-2.5 text-[12px] border transition-colors ${
                candidateAngleDeg === s.value
                  ? 'border-ink text-ink bg-paper-sunk'
                  : 'border-rule text-ink-soft hover:border-rule-strong hover:text-ink'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-5 text-[14px] leading-relaxed text-ink-soft">{summary}</p>
      {world === 'hyperbolic' && (
        <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
          The saddle in Chapter I is only a small patch, and its curvature changes from place to place, so it can't
          show whole straight lines. This page uses the Poincaré disk instead: a map of the entire hyperbolic plane,
          where the curvature is the same everywhere. Chapter III explores it.
        </p>
      )}

      <button
        onClick={() => setShowFan(!showFan)}
        aria-pressed={showFan}
        className="mt-5 inline-flex items-center gap-2 text-[13px] text-ink-soft hover:text-ink"
      >
        <span
          className={`inline-flex w-4 h-4 border ${showFan ? 'bg-ink border-ink' : 'border-rule-strong bg-paper-raised'}`}
          aria-hidden="true"
        />
        Show other lines through P
      </button>

      <ul className="mt-5 space-y-1.5 text-[13px] text-ink-muted">
        {(['meets', 'misses', ...(world === 'hyperbolic' ? ['limiting'] : [])] as ParallelVerdict[]).map((v) => (
          <li key={v} className="flex items-center gap-2">
            <span className="w-4 h-[3px]" style={{ background: VERDICT_COLOR[v] }} aria-hidden="true" />
            {v === 'meets' ? 'crosses L' : v === 'misses' ? 'never meets L' : 'limiting parallel'}
          </li>
        ))}
      </ul>
    </section>
  );
};
