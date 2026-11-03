import React from 'react';
import { useGeometryStore, WorldKind } from '../../store/geometryStore';
import { circleMeasurements, sphereMaxCircleRadius, DEFAULT_SPHERE_RADIUS, GeometryKind } from '../../geometry-engine';
import { palette, worldColor, worldInk } from '../../theme/palette';
import { FLAT_CIRCLE_MAX } from './FlatCircleView';

const KIND: Record<WorldKind, GeometryKind> = { flat: 'euclidean', sphere: 'spherical', hyperbolic: 'hyperbolic' };
const LABEL: Record<WorldKind, string> = { flat: 'Flat plane', sphere: 'Sphere', hyperbolic: 'Saddle (hyperbolic)' };

const EQUATOR = sphereMaxCircleRadius(DEFAULT_SPHERE_RADIUS) / 2;

const RANGE: Record<WorldKind, { max: number; step: number; snaps: { label: string; value: number }[] }> = {
  flat: { max: FLAT_CIRCLE_MAX, step: 0.05, snaps: [0.5, 1, 2].map((v) => ({ label: `r = ${v}`, value: v })) },
  sphere: {
    max: sphereMaxCircleRadius(DEFAULT_SPHERE_RADIUS) - 0.05,
    step: 0.05,
    snaps: [
      { label: 'r = 1', value: 1 },
      { label: 'r = 2', value: 2 },
      { label: 'Equator', value: Math.round(EQUATOR * 100) / 100 },
      { label: 'Past it', value: 6 },
    ],
  },
  hyperbolic: { max: 5, step: 0.1, snaps: [1, 2, 3, 4].map((v) => ({ label: `r = ${v}`, value: v })) },
};

const FORMULA: Record<WorldKind, React.ReactNode> = {
  flat: <>Around: 2π<i>r</i>. Area: π<i>r</i>².</>,
  sphere: <>Around: 2π<i>R</i>·sin(<i>r</i>/<i>R</i>). Area: 2π<i>R</i>²(1 − cos(<i>r</i>/<i>R</i>)), with <i>R</i> = {DEFAULT_SPHERE_RADIUS}.</>,
  hyperbolic: <>Around: 2π·sinh <i>r</i>. Area: 2π(cosh <i>r</i> − 1), with curvature −1.</>,
};

/** Readout and radius control for the three circle pages. */
export const CircleLabPanel: React.FC = () => {
  const world = useGeometryStore((s) => s.world);
  const r = useGeometryStore((s) => (s.world === 'hyperbolic' ? s.disk.circle.r : s.circles[s.world as 'flat' | 'sphere']));
  const setCircleRadius = useGeometryStore((s) => s.setCircleRadius);
  const m = circleMeasurements(KIND[world], r);
  const ratio = m.circumference / m.flatCircumference;
  const range = RANGE[world];

  return (
    <section aria-label="Circle readout" className="px-5 pt-5 pb-6 border-b border-rule">
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-ink-muted">Distance around the circle</span>
        <span className="flex items-center gap-1.5 text-ink-soft">
          <span className="w-2.5 h-2.5" style={{ background: worldColor[world] }} aria-hidden="true" />
          {LABEL[world]}
        </span>
      </div>
      <div className="mt-2 font-serif text-[64px] leading-[0.95] tracking-tight text-ink tabular">{m.circumference.toFixed(2)}</div>
      <p className="mt-2 text-[14px] text-ink-soft">
        {world === 'flat' ? (
          <>Exactly 2π<i>r</i> = {m.flatCircumference.toFixed(2)}, at every size.</>
        ) : (
          <>
            A flat circle of the same radius: <span className="font-mono tabular">{m.flatCircumference.toFixed(2)}</span>. That's{' '}
            <span className="font-medium tabular" style={{ color: worldInk[world] }}>
              ×{ratio.toFixed(2)}
            </span>
            .
          </>
        )}
      </p>
      {world === 'sphere' && r > EQUATOR && (
        <p className="mt-1 text-[13px] text-ink-muted">Past the equator: the circle is getting smaller again.</p>
      )}

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="circle-r" className="text-[14px] text-ink-soft">
            Radius <span className="font-serif italic text-[16px]">r</span>
          </label>
          <span className="font-mono text-[14px] text-ink tabular">{r.toFixed(2)}</span>
        </div>
        <input
          id="circle-r"
          type="range"
          min={0.1}
          max={range.max}
          step={range.step}
          value={r}
          onChange={(e) => setCircleRadius(world, parseFloat(e.target.value))}
          className="mt-2 w-full cursor-pointer"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {range.snaps.map((s) => (
            <button
              key={s.label}
              onClick={() => setCircleRadius(world, s.value)}
              className={`h-7 px-2.5 text-[12px] border transition-colors ${
                Math.abs(r - s.value) < 1e-6 ? 'border-ink text-ink bg-paper-sunk' : 'border-rule text-ink-soft hover:border-rule-strong hover:text-ink'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <table className="mt-5 w-full text-[13px]">
        <thead>
          <tr className="text-ink-muted text-left">
            <th className="font-normal py-1.5" />
            <th className="font-normal py-1.5 text-right">Here</th>
            <th className="font-normal py-1.5 text-right">Flat</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular">
          <tr className="border-t border-rule">
            <td className="py-2 font-sans text-[14px] text-ink-soft">Around</td>
            <td className="py-2 text-right text-ink">{m.circumference.toFixed(2)}</td>
            <td className="py-2 text-right text-ink-muted">{m.flatCircumference.toFixed(2)}</td>
          </tr>
          <tr className="border-y border-rule">
            <td className="py-2 font-sans text-[14px] text-ink-soft">Area</td>
            <td className="py-2 text-right text-ink">{m.area.toFixed(2)}</td>
            <td className="py-2 text-right text-ink-muted">{m.flatArea.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-3 text-[13px] text-ink-muted" style={{ color: palette.inkMuted }}>
        {FORMULA[world]}
      </p>
    </section>
  );
};
