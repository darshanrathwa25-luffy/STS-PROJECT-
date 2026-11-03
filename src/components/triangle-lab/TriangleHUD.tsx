import React, { useMemo, useEffect, useState } from 'react';
import { useGeometryStore, WorldKind } from '../../store/geometryStore';
import {
  euclideanTriangle,
  sphericalTriangle,
  saddleTriangle,
  constructTriangleFromSides,
  constructSaddleTriangleFromSides,
  DEFAULT_SPHERE_RADIUS,
} from '../../geometry-engine';
import { palette, worldColor, worldInk } from '../../theme/palette';

const WORLD_META: Record<WorldKind, { label: string; curvature: string }> = {
  flat: { label: 'Flat plane', curvature: 'K = 0' },
  sphere: { label: 'Sphere', curvature: 'K > 0' },
  hyperbolic: { label: 'Saddle', curvature: 'K < 0' },
};

// The angle bar spans 0°–270°, so 180° sits two-thirds of the way along.
const BAR_MAX = 270;

/** Side lengths the saddle page accepts; see setWorld in the store. */
const SADDLE_SIDE_RANGE = [0.3, 1.5] as const;

/** North Pole and two points on the equator a quarter-turn apart: three right angles. */
const R = DEFAULT_SPHERE_RADIUS;
const RIGHT_ANGLE_TRIANGLE = {
  p1: { x: 0, y: R, z: 0 },
  p2: { x: 0, y: 0, z: R },
  p3: { x: R, y: 0, z: 0 },
};

export const TriangleHUD: React.FC = () => {
  const {
    world,
    setWorld,
    sides,
    flatTriangle,
    sphereTriangle,
    saddleTriangle: hTri,
    updateSphereVertex,
    resetCamera,
  } = useGeometryStore();

  const setRightAngles = () => {
    (['p1', 'p2', 'p3'] as const).forEach((k) => updateSphereVertex(k, RIGHT_ANGLE_TRIANGLE[k]));
    resetCamera();
  };

  // Active world measurements
  const activeMeasurements = useMemo(() => {
    const tri =
      world === 'flat'
        ? euclideanTriangle(flatTriangle.p1, flatTriangle.p2, flatTriangle.p3)
        : world === 'sphere'
        ? sphericalTriangle(sphereTriangle.p1, sphereTriangle.p2, sphereTriangle.p3, DEFAULT_SPHERE_RADIUS)
        : saddleTriangle(hTri.p1, hTri.p2, hTri.p3);
    return {
      sum: tri.angleSumDeg,
      angles: [tri.alpha, tri.beta, tri.gamma].map((r) => (r * 180) / Math.PI),
      defectOrExcess: tri.angleSumDeg - 180,
    };
  }, [world, flatTriangle, sphereTriangle, hTri]);

  // Ease the big number towards its target so drags read as motion, not flicker
  const [displaySum, setDisplaySum] = useState<number>(activeMeasurements.sum);

  useEffect(() => {
    let animId: number;
    const startVal = displaySum;
    const targetVal = activeMeasurements.sum;
    const startTime = performance.now();
    const duration = 240;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplaySum(startVal + (targetVal - startVal) * ease);
      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [activeMeasurements.sum]);

  // Same side lengths evaluated in each world
  const stripData = useMemo(() => {
    const { a, b, c } = sides;

    let sphereSum: number | null = null;
    const sTriConstructed = constructTriangleFromSides('spherical', a, b, c, DEFAULT_SPHERE_RADIUS);
    if (sTriConstructed) {
      const m = sphericalTriangle(
        sTriConstructed.a as any,
        sTriConstructed.b as any,
        sTriConstructed.c as any,
        DEFAULT_SPHERE_RADIUS
      );
      if (!m.degenerate) sphereSum = m.angleSumDeg;
    }

    // Only sides the saddle page can actually show (it clamps to this range when you switch)
    let hypSum: number | null = null;
    const fitsSaddle = [a, b, c].every((x) => x >= SADDLE_SIDE_RANGE[0] && x <= SADDLE_SIDE_RANGE[1]);
    const hTriConstructed = fitsSaddle ? constructSaddleTriangleFromSides(a, b, c) : null;
    if (hTriConstructed) {
      const m = saddleTriangle(hTriConstructed.a, hTriConstructed.b, hTriConstructed.c);
      if (!m.degenerate) hypSum = m.angleSumDeg;
    }

    return [
      { id: 'flat' as WorldKind, sum: 180 as number | null },
      { id: 'sphere' as WorldKind, sum: sphereSum },
      { id: 'hyperbolic' as WorldKind, sum: hypSum },
    ];
  }, [sides]);

  const delta = activeMeasurements.defectOrExcess;
  const isFlat = Math.abs(delta) < 0.05;
  const isGreater = delta > 0.05;
  const meta = WORLD_META[world];

  const pct = (deg: number) => `${(Math.min(deg, BAR_MAX) / BAR_MAX) * 100}%`;
  const angleShades = [palette.inkSoft, palette.inkMuted, palette.inkFaint];

  return (
    <section aria-label="Angle sum readout" className="px-5 pt-5 pb-6 border-b border-rule">
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-ink-muted">Angle sum</span>
        <span className="flex items-center gap-1.5 text-ink-soft">
          <span className="w-2.5 h-2.5" style={{ background: worldColor[world] }} aria-hidden="true" />
          {meta.label}
          <span className="font-mono text-[11px] text-ink-muted">{meta.curvature}</span>
        </span>
      </div>

      <div className="mt-2 font-serif text-[64px] leading-[0.95] tracking-tight text-ink tabular" aria-live="polite">
        {displaySum.toFixed(1)}°
      </div>

      <p className="mt-2 text-[14px] text-ink-soft">
        {isFlat ? (
          <>Exactly 180°, however you drag it.</>
        ) : (
          <>
            180° {isGreater ? '+' : '−'}{' '}
            <span className="font-medium tabular" style={{ color: worldInk[world] }}>
              {Math.abs(delta).toFixed(1)}° {isGreater ? 'excess' : 'defect'}
            </span>
          </>
        )}
      </p>

      {/* α + β + γ laid end to end, against the 180° mark */}
      <div className="mt-5" aria-hidden="true">
        <div className="relative h-3">
          <div className="absolute inset-0 bg-paper-sunk" />
          {(() => {
            let start = 0;
            return activeMeasurements.angles.map((deg, i) => {
              const left = start;
              start += deg;
              return (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-r border-paper-raised"
                  style={{ left: pct(left), width: `calc(${pct(left + deg)} - ${pct(left)})`, background: angleShades[i] }}
                />
              );
            });
          })()}
          {!isFlat && (
            <div
              className="absolute top-0 bottom-0"
              style={{
                left: pct(Math.min(180, activeMeasurements.sum)),
                width: `calc(${pct(Math.max(180, activeMeasurements.sum))} - ${pct(Math.min(180, activeMeasurements.sum))})`,
                background: isGreater ? worldColor[world] : 'transparent',
                outline: isGreater ? 'none' : `1.5px dashed ${worldColor[world]}`,
                outlineOffset: '-1.5px',
              }}
            />
          )}
          <div className="absolute -top-1 -bottom-1 w-px bg-ink" style={{ left: pct(180) }} />
        </div>
        <div className="relative h-4 mt-1 font-mono text-[10px] text-ink-muted">
          <span className="absolute" style={{ left: pct(180), transform: 'translateX(-50%)' }}>180°</span>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2">
        {(['α', 'β', 'γ'] as const).map((name, i) => (
          <div key={name} className="flex items-baseline gap-1.5">
            <dt className="flex items-center gap-1 text-[13px] text-ink-muted">
              <span className="w-2 h-2" style={{ background: angleShades[i] }} aria-hidden="true" />
              <span className="font-serif italic text-[15px]">{name}</span>
            </dt>
            <dd className="font-mono text-[13px] text-ink tabular">{activeMeasurements.angles[i].toFixed(1)}°</dd>
          </div>
        ))}
      </dl>

      {world === 'sphere' && (
        <button
          onClick={setRightAngles}
          className="mt-4 h-8 px-3 text-[13px] border border-rule text-ink-soft hover:border-rule-strong hover:text-ink transition-colors"
        >
          Try: three right angles
        </button>
      )}

      {/* Same sides, other worlds */}
      <div className="mt-6">
        <h3 className="text-[13px] text-ink-muted">Same side lengths in each world</h3>
        <ul className="mt-2 divide-y divide-rule border-y border-rule">
          {stripData.map((item) => {
            const isActive = world === item.id;
            const isPossible = item.sum !== null;
            const label = WORLD_META[item.id].label;
            return (
              <li key={item.id}>
                <button
                  onClick={() => isPossible && setWorld(item.id)}
                  disabled={!isPossible}
                  aria-current={isActive}
                  className={`w-full flex items-center gap-2.5 py-2 px-1 text-left text-[14px] transition-colors ${
                    isActive ? 'text-ink' : isPossible ? 'text-ink-soft hover:bg-paper-sunk' : 'text-ink-faint cursor-not-allowed'
                  }`}
                  title={
                    isPossible
                      ? `Switch to ${label}`
                      : item.id === 'hyperbolic'
                      ? 'These sides are outside what the saddle page can show (0.3 to 1.5)'
                      : `These side lengths can't close into a triangle on the ${label.toLowerCase()}`
                  }
                >
                  <span
                    className="w-2.5 h-2.5 shrink-0"
                    style={{ background: worldColor[item.id], opacity: isPossible ? 1 : 0.35 }}
                    aria-hidden="true"
                  />
                  <span className={isActive ? 'font-medium' : ''}>{label}</span>
                  <span className="ml-auto font-mono text-[13px] tabular">
                    {isPossible ? `${item.sum!.toFixed(1)}°` : item.id === 'hyperbolic' ? 'won’t fit' : 'won’t close'}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-ink' : 'bg-transparent'}`} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
