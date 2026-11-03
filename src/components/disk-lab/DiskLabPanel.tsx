import React, { useEffect, useState } from 'react';
import { useGeometryStore, DISK_WALK_LIMIT } from '../../store/geometryStore';
import { Poincare } from '../../geometry-engine';
import { palette } from '../../theme/palette';
import { tilesAtCorner, MAX_POLYGON_CORNERS } from './figures';
import { WALK_STEP, WALK_TURN } from './DiskLabStage';
import { RotateCcw, RotateCw, ArrowUp, Play, Pause } from 'lucide-react';


const deg = (rad: number) => (rad * 180) / Math.PI;

const button =
  'inline-flex items-center justify-center gap-1.5 h-8 px-3 text-[13px] border border-rule text-ink-soft hover:border-rule-strong hover:text-ink transition-colors disabled:opacity-40 disabled:hover:border-rule';
const chip = (active: boolean) =>
  `h-7 px-2.5 text-[12px] border transition-colors ${
    active ? 'border-ink text-ink bg-paper-sunk' : 'border-rule text-ink-soft hover:border-rule-strong hover:text-ink'
  }`;

const Row: React.FC<{ label: React.ReactNode; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="flex items-baseline justify-between gap-4 py-2">
    <dt className="text-[14px] text-ink-soft">{label}</dt>
    <dd className="text-right">
      <span className="font-mono text-[13px] text-ink tabular">{value}</span>
      {sub && <span className="block font-mono text-[11px] text-ink-muted tabular">{sub}</span>}
    </dd>
  </div>
);

const Big: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <div className="text-[13px] text-ink-muted">{label}</div>
    <div className="mt-1 font-serif text-[44px] leading-none tracking-tight text-ink tabular">{children}</div>
  </div>
);

// ---------------------------------------------------------------- Walk

const WalkPanel: React.FC = () => {
  const { walker, walked } = useGeometryStore((s) => s.disk);
  const { diskWalk, diskTurn, resetDiskWalk } = useGeometryStore();
  const [playing, setPlaying] = useState(false);

  const here = Poincare.Point.givenCoordinates(walker.x, walker.y);
  const fromCentre = here.getHyperbolicRadius();
  const onMap = here.getEuclideanRadius();
  const atLimit = fromCentre >= DISK_WALK_LIMIT - 1e-6;

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => diskWalk(WALK_STEP / 2), 90);
    return () => window.clearInterval(id);
  }, [playing, diskWalk]);

  useEffect(() => {
    if (atLimit) setPlaying(false);
  }, [atLimit]);

  return (
    <>
      <Big label="Distance from the centre">{fromCentre.toFixed(2)}</Big>
      <p className="mt-2 text-[14px] text-ink-soft">
        On the map you are <span className="font-medium text-ink tabular">{(onMap * 100).toFixed(onMap > 0.99 ? 3 : 1)}%</span> of the way to the rim.
      </p>

      <dl className="mt-4 divide-y divide-rule border-y border-rule">
        <Row label="Distance walked" value={walked.toFixed(2)} />
        <Row label="Length of each step" value={WALK_STEP.toFixed(2)} />
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className={button} onClick={() => diskTurn(WALK_TURN)} aria-label="Turn left">
          <RotateCcw className="w-4 h-4" /> Left
        </button>
        <button className={button} onClick={() => diskWalk(WALK_STEP)} disabled={atLimit} aria-label="Step forward">
          <ArrowUp className="w-4 h-4" /> Step
        </button>
        <button className={button} onClick={() => diskTurn(-WALK_TURN)} aria-label="Turn right">
          <RotateCw className="w-4 h-4" /> Right
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button className={button} onClick={() => setPlaying(!playing)} disabled={atLimit && !playing}>
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {playing ? 'Stop' : 'Keep walking'}
        </button>
        <button className={button} onClick={() => { setPlaying(false); resetDiskWalk(); }}>
          Back to the centre
        </button>
      </div>
      {atLimit && (
        <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
          The lab stops you at {DISK_WALK_LIMIT} units, where the map can no longer tell you apart from the rim. The plane itself goes on for ever.
        </p>
      )}
    </>
  );
};

// ---------------------------------------------------------------- Circles

const CirclesPanel: React.FC = () => {
  const { cx, cy, r } = useGeometryStore((s) => s.disk.circle);
  const setDiskCircle = useGeometryStore((s) => s.setDiskCircle);
  const circle = Poincare.Circle.givenHyperbolicCenterRadius(Poincare.Point.givenCoordinates(cx, cy), r) as Poincare.Circle;
  const around = circle.getHyperbolicCircumference();
  const area = circle.getHyperbolicArea();
  const flatAround = Poincare.flatCircleCircumference(r);
  const flatArea = Poincare.flatCircleArea(r);

  return (
    <>
      <Big label="Distance around">{around.toFixed(2)}</Big>
      <p className="mt-2 text-[14px] text-ink-soft">
        A flat circle of the same radius: <span className="font-mono tabular">{flatAround.toFixed(2)}</span>.{' '}
        That's <span className="font-medium tabular" style={{ color: palette.ochre }}>×{(around / flatAround).toFixed(2)}</span>.
      </p>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="circle-radius" className="text-[14px] text-ink-soft">
            Radius <span className="font-serif italic text-[16px]">r</span>
          </label>
          <span className="font-mono text-[14px] text-ink tabular">{r.toFixed(1)}</span>
        </div>
        <input
          id="circle-radius"
          type="range"
          min={0.1}
          max={5}
          step={0.1}
          value={r}
          onChange={(e) => setDiskCircle({ r: parseFloat(e.target.value) })}
          className="mt-2 w-full cursor-pointer"
        />
        <div className="mt-2 flex gap-1.5">
          {[1, 2, 3, 4].map((v) => (
            <button key={v} className={chip(Math.abs(r - v) < 1e-9)} onClick={() => setDiskCircle({ r: v })}>
              r = {v}
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
            <td className="py-2 text-right text-ink">{around.toFixed(2)}</td>
            <td className="py-2 text-right text-ink-muted">{flatAround.toFixed(2)}</td>
          </tr>
          <tr className="border-y border-rule">
            <td className="py-2 font-sans text-[14px] text-ink-soft">Area</td>
            <td className="py-2 text-right text-ink">{area.toFixed(2)}</td>
            <td className="py-2 text-right text-ink-muted">{flatArea.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-3 text-[13px] text-ink-muted">
        Here: 2π sinh <i>r</i> around and 2π(cosh <i>r</i> − 1) inside. Flat: 2π<i>r</i> and π<i>r</i>².
      </p>
    </>
  );
};

// ---------------------------------------------------------------- Tiles

const TilesPanel: React.FC = () => {
  const { sides, radius } = useGeometryStore((s) => s.disk.tiles);
  const setDiskTiles = useGeometryStore((s) => s.setDiskTiles);
  const { angle, fit, gap } = tilesAtCorner(sides, radius);
  const flatAngle = Math.PI - (2 * Math.PI) / sides;
  const flatFit = (2 * Math.PI) / flatAngle;
  const exact = gap < (0.5 * Math.PI) / 180;

  // Counts that need tiles bigger than flat ones: more than fit on a flat floor
  const firstFit = Math.floor(flatFit + 1e-9) + 1;
  const fits = Array.from({ length: 5 }, (_, i) => firstFit + i);

  const name = ['', '', '', 'triangle', 'square', 'pentagon', 'hexagon', 'heptagon', 'octagon'][sides];

  return (
    <>
      <Big label="Tiles around the corner">
        {fit}
        {!exact && <span className="text-[22px] text-ink-muted"> + a gap</span>}
      </Big>
      <p className="mt-2 text-[14px] text-ink-soft">
        Each corner is <span className="font-mono tabular">{deg(angle).toFixed(1)}°</span>. A flat {name}'s corner is{' '}
        <span className="font-mono tabular">{deg(flatAngle).toFixed(1)}°</span>
        {Number.isInteger(Math.round(flatFit * 1e6) / 1e6) ? `, and ${Math.round(flatFit)} fit on a flat floor.` : ', which never tiles a flat floor.'}
      </p>
      {!exact && (
        <p className="mt-1 text-[13px] text-ink-muted">
          Gap left over: <span className="font-mono tabular" style={{ color: palette.red }}>{deg(gap).toFixed(1)}°</span>
        </p>
      )}

      <div className="mt-5">
        <div className="text-[14px] text-ink-soft">Sides</div>
        <div className="mt-2 flex gap-1.5">
          {[3, 4, 5, 6, 7, 8].map((n) => (
            <button key={n} className={chip(n === sides)} onClick={() => setDiskTiles({ sides: n })}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="tile-size" className="text-[14px] text-ink-soft">
            Size (centre to corner)
          </label>
          <span className="font-mono text-[14px] text-ink tabular">{radius.toFixed(2)}</span>
        </div>
        <input
          id="tile-size"
          type="range"
          min={0.05}
          max={3}
          step={0.01}
          value={radius}
          onChange={(e) => setDiskTiles({ radius: parseFloat(e.target.value) })}
          className="mt-2 w-full cursor-pointer"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {fits.map((k) => {
            const r = Poincare.regularPolygonRadiusForCornerAngle(sides, (2 * Math.PI) / k);
            if (!Number.isFinite(r) || r > 3) return null;
            return (
              <button key={k} className={chip(exact && fit === k)} onClick={() => setDiskTiles({ radius: r })}>
                Fit {k}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------- Polygon

const PolygonPanel: React.FC = () => {
  const vertices = useGeometryStore((s) => s.disk.polygon);
  const setDiskPolygon = useGeometryStore((s) => s.setDiskPolygon);
  const m =
    vertices.length >= 3
      ? Poincare.measurePolygon(vertices.map((v) => Poincare.Point.givenCoordinates(v.x, v.y)))
      : null;

  // Push every corner out towards the rim along its own radius
  const stretch = () =>
    setDiskPolygon(
      vertices.map((v) => {
        const r = Math.hypot(v.x, v.y) || 1;
        return { x: (v.x / r) * 0.96, y: (v.y / r) * 0.96 };
      })
    );

  return (
    <>
      {m ? (
        <>
          <Big label="Angle sum">{deg(m.angleSum).toFixed(1)}°</Big>
          <p className="mt-2 text-[14px] text-ink-soft">
            A flat shape with {vertices.length} corners: <span className="font-mono tabular">{deg(m.flatAngleSum).toFixed(0)}°</span>. Short by{' '}
            <span className="font-medium tabular" style={{ color: palette.ochre }}>{deg(m.defect).toFixed(1)}°</span>.
          </p>
          <dl className="mt-4 divide-y divide-rule border-y border-rule">
            <Row label="Corners" value={String(vertices.length)} />
            <Row label="Shortfall, in radians" value={m.defect.toFixed(3)} />
            <Row label="Area" value={m.area.toFixed(3)} />
          </dl>
          <p className="mt-3 text-[13px] text-ink-muted">The shortfall and the area are the same number. That's Gauss–Bonnet.</p>
        </>
      ) : (
        <p className="text-[15px] leading-relaxed text-ink-soft">
          Click inside the disk to place corners. You need at least three.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button className={button} onClick={() => setDiskPolygon(vertices.slice(0, -1))} disabled={vertices.length === 0}>
          Remove last corner
        </button>
        <button className={button} onClick={() => setDiskPolygon([])} disabled={vertices.length === 0}>
          Clear
        </button>
        <button className={button} onClick={stretch} disabled={vertices.length < 3}>
          Stretch to the rim
        </button>
      </div>
      {vertices.length >= MAX_POLYGON_CORNERS && (
        <p className="mt-2 text-[13px] text-ink-muted">That's the most corners this lab allows.</p>
      )}
    </>
  );
};

// ---------------------------------------------------------------- Panel

export const DiskLabPanel: React.FC = () => {
  const exploration = useGeometryStore((s) => s.disk.exploration);

  return (
    <section aria-label="Disk lab controls" className="px-5 pt-5 pb-6 border-b border-rule">
      <div>
        {exploration === 'walk' && <WalkPanel />}
        {exploration === 'circles' && <CirclesPanel />}
        {exploration === 'tiles' && <TilesPanel />}
        {exploration === 'polygon' && <PolygonPanel />}
      </div>
    </section>
  );
};
