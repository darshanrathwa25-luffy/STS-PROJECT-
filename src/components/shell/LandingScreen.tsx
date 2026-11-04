import React from 'react';
import { useGeometryStore, WorldKind } from '../../store/geometryStore';
import { ArrowRight } from 'lucide-react';
import { palette, worldColor } from '../../theme/palette';
import { ByrneMark } from './ByrneMark';
import { Credits } from './Credits';
import { CHAPTERS, STEPS, firstStepOfChapter } from '../../content/chapters';

// Fig. 1: the three surfaces that curve the same amount everywhere, each with a triangle
// whose sides are that surface's straightest lines. Drawn as flat SVG sketches.
const SURFACE = { fill: palette.paperRaised, stroke: palette.ruleStrong };

const PlaneSketch: React.FC<{ color: string }> = ({ color }) => (
  <g>
    {/* A sheet of paper seen at an angle, with a light grid */}
    <path d="M8,120 L128,120 L152,44 L32,44 Z" fill={SURFACE.fill} stroke={SURFACE.stroke} strokeWidth="1.2" />
    {[1, 2, 3].map((i) => (
      <path key={`u${i}`} d={`M${8 + 30 * i},120 L${32 + 30 * i},44`} stroke={palette.rule} strokeWidth="0.8" />
    ))}
    {[1, 2].map((i) => {
      const t = i / 3;
      return <path key={`v${i}`} d={`M${8 + 24 * t},${120 - 76 * t} L${128 + 24 * t},${120 - 76 * t}`} stroke={palette.rule} strokeWidth="0.8" />;
    })}
    <path d="M30,108 L124,108 L86,54 Z" fill={color} stroke={palette.ink} strokeWidth="2" strokeLinejoin="round" />
    {[[30, 108], [124, 108], [86, 54]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3.2" fill={palette.ink} />)}
  </g>
);

const SphereSketch: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <circle cx="80" cy="72" r="58" fill={SURFACE.fill} stroke={SURFACE.stroke} strokeWidth="1.2" />
    {/* Equator and one meridian, so it reads as a ball */}
    <ellipse cx="80" cy="72" rx="58" ry="15" fill="none" stroke={palette.rule} strokeWidth="0.8" />
    <ellipse cx="80" cy="72" rx="24" ry="58" fill="none" stroke={palette.rule} strokeWidth="0.8" />
    {/* Sides bulge outward: the corners are wider than on the plane */}
    <path
      d="M44,98 Q80,114 116,98 Q114,58 80,28 Q46,58 44,98 Z"
      fill={color}
      stroke={palette.ink}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {[[44, 98], [116, 98], [80, 28]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3.2" fill={palette.ink} />)}
  </g>
);

// The saddle z = u² − v² over a round patch, seen from the front and a little above.
// A drawing aid only; the measurements live in the geometry engine.
const saddleXY = (u: number, v: number): [number, number] => {
  const z = u * u - v * v;
  return [80 + 70 * u, 62 + 40 * v - 26 * z];
};
const toPath = (pts: [number, number][], close = false) =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + (close ? ' Z' : '');

const SADDLE = (() => {
  const rim = toPath(
    Array.from({ length: 73 }, (_, i) => {
      const t = (i / 72) * 2 * Math.PI;
      return saddleXY(Math.cos(t), Math.sin(t));
    }),
    true
  );
  const grid: string[] = [];
  for (const c of [-0.6, -0.3, 0, 0.3, 0.6]) {
    const h = Math.sqrt(1 - c * c);
    const line = (f: (s: number) => [number, number]) =>
      toPath(Array.from({ length: 25 }, (_, i) => f(-h + (2 * h * i) / 24)));
    grid.push(line((s) => saddleXY(c, s)), line((s) => saddleXY(s, c)));
  }
  // Triangle corners in (u, v); sides pulled toward the middle, as geodesics on a saddle look
  const corners: [number, number][] = [[-0.52, 0.6], [0.52, 0.6], [0, -0.72]];
  const cu = 0, cv = (0.6 + 0.6 - 0.72) / 3;
  const edge: [number, number][] = [];
  for (let k = 0; k < 3; k++) {
    const [u0, v0] = corners[k];
    const [u1, v1] = corners[(k + 1) % 3];
    for (let i = 0; i < 20; i++) {
      const t = i / 20;
      const pull = 0.32 * Math.sin(Math.PI * t);
      const u = u0 + (u1 - u0) * t, v = v0 + (v1 - v0) * t;
      edge.push(saddleXY(u + (cu - u) * pull, v + (cv - v) * pull));
    }
  }
  return { rim, grid, triangle: toPath(edge, true), dots: corners.map(([u, v]) => saddleXY(u, v)) };
})();

const SaddleSketch: React.FC<{ color: string }> = ({ color }) => (
  <g>
    {/* A saddle (like a mountain pass): it rises to the left and right and falls to the front and back */}
    <path d={SADDLE.rim} fill={SURFACE.fill} stroke={SURFACE.stroke} strokeWidth="1.2" strokeLinejoin="round" />
    {SADDLE.grid.map((d, i) => (
      <path key={i} d={d} fill="none" stroke={palette.rule} strokeWidth="0.8" />
    ))}
    {/* Sides pinch inward: the corners are narrower than on the plane */}
    <path d={SADDLE.triangle} fill={color} stroke={palette.ink} strokeWidth="2" strokeLinejoin="round" />
    {SADDLE.dots.map(([x, y]) => <circle key={x} cx={x} cy={y} r="3.2" fill={palette.ink} />)}
  </g>
);

const FIGURES: {
  world: WorldKind;
  name: string;
  curvature: string;
  sum: string;
  note: string;
  Sketch: React.FC<{ color: string }>;
}[] = [
  {
    world: 'flat',
    name: 'Plane',
    curvature: 'Curvature zero',
    sum: 'Σ = 180°',
    note: 'Flat everywhere. Euclid’s geometry.',
    Sketch: PlaneSketch,
  },
  {
    world: 'sphere',
    name: 'Sphere',
    curvature: 'Positive curvature',
    sum: 'Σ > 180°',
    note: 'Curves the same way in every direction, like a ball.',
    Sketch: SphereSketch,
  },
  {
    world: 'hyperbolic',
    name: 'Saddle',
    curvature: 'Negative curvature',
    sum: 'Σ < 180°',
    note: 'Curves up one way and down the other, like a mountain pass.',
    Sketch: SaddleSketch,
  },
];

export const LandingScreen: React.FC = () => {
  const { setIsLanding, setWorld, setLab, goToStep, setMode } = useGeometryStore();

  const startWith = (world: WorldKind) => {
    setWorld(world);
    setLab('triangle');
    setIsLanding(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-paper text-ink select-none">
      <div className="min-h-full max-w-6xl mx-auto px-5 sm:px-10 flex flex-col">
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2.5">
            <ByrneMark className="w-6 h-6" />
            <span className="font-serif text-[20px] leading-none">Curvature Lab</span>
          </div>
          <a
            href="https://github.com/darshanrathwa25-luffy/STS-PROJECT-"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-ink-muted hover:text-ink underline decoration-rule-strong underline-offset-4"
          >
            Source on GitHub
          </a>
        </header>

        <main className="flex-1 grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-12 lg:gap-14 items-center py-10 lg:py-16">
          <div className="max-w-[40rem]">
            <p className="text-[13px] text-ink-muted">An interactive lab on the shape of space</p>
            <h1 className="mt-4 font-serif text-[42px] sm:text-[56px] xl:text-[62px] leading-[1.03] tracking-tight">
              The angles of a triangle add up to 180°.
              <span className="block italic text-ink-soft mt-2">Except when they don’t.</span>
            </h1>
            <p className="mt-7 text-[17px] leading-relaxed text-ink-soft max-w-[34rem]">
              For two thousand years Euclid’s geometry was treated as the truth about space. In the
              1820s, Lobachevsky and Bolyai showed it was only one option. Draw a triangle on a plane,
              a sphere and a saddle, and find out for yourself what changes and why it mattered.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setMode('tutorial');
                  goToStep(STEPS[0]);
                }}
                className="inline-flex items-center gap-2 h-11 px-5 bg-ink text-paper text-[15px] font-medium hover:bg-ink-soft transition-colors"
              >
                Start the tutorial
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setMode('explorer');
                  goToStep(STEPS[0]);
                }}
                className="inline-flex items-center h-11 px-5 border border-ink text-ink text-[15px] hover:bg-paper-raised transition-colors"
              >
                Explore freely
              </button>
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-ink-muted max-w-[34rem]">
              The tutorial asks you to predict each result before you test it. Explorer opens everything at once, with
              the explanations a click away.{' '}
              <button
                onClick={() => setIsLanding(false)}
                className="text-ink-soft hover:text-ink underline decoration-rule-strong underline-offset-4"
              >
                Carry on where you left off
              </button>
            </p>
          </div>

          {/* Fig. 1 */}
          <figure>
            <div className="grid grid-cols-3 border-y border-ink">
              {FIGURES.map((f, i) => (
                <button
                  key={f.world}
                  onClick={() => startWith(f.world)}
                  className={`group text-left px-2 sm:px-4 pt-5 pb-4 hover:bg-paper-raised transition-colors ${
                    i > 0 ? 'border-l border-rule' : ''
                  }`}
                  aria-label={`Draw a triangle on the ${f.name.toLowerCase()}`}
                >
                  <svg viewBox="0 0 160 130" className="w-full" aria-hidden="true">
                    <f.Sketch color={worldColor[f.world]} />
                  </svg>
                  <div className="mt-4 font-serif text-[19px] sm:text-[21px] leading-tight">{f.name}</div>
                  <div className="mt-0.5 text-[12px] sm:text-[13px] text-ink-soft">{f.curvature}</div>
                  <div className="mt-1.5 font-mono text-[12px] sm:text-[13px] text-ink tabular">{f.sum}</div>
                  <p className="mt-2 text-[13px] leading-snug text-ink-muted hidden sm:block min-h-[3.75em]">{f.note}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[13px] text-ink-muted group-hover:text-ink transition-colors">
                    Draw one <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              ))}
            </div>
            <figcaption className="mt-3 text-[13px] text-ink-muted">
              <span className="font-serif italic text-ink-soft">Fig. 1.</span> Every surface that curves the same amount
              everywhere is one of these three. On each, the triangle’s sides are the straightest lines the surface
              allows, and Σ is the sum of its three angles.
            </figcaption>
          </figure>
        </main>

        <section aria-labelledby="contents-heading" className="pb-14">
          <h2 id="contents-heading" className="font-serif text-[30px] text-ink">
            Contents
          </h2>
          <ol className="mt-5 border-t border-ink">
            {CHAPTERS.map((c) => (
              <li key={c.number} className="border-b border-rule">
                <button
                  onClick={() => goToStep(STEPS[firstStepOfChapter(c.number)])}
                  className="group w-full grid grid-cols-[3rem_minmax(0,1fr)_auto] sm:grid-cols-[4rem_minmax(0,1fr)_auto] items-baseline gap-3 py-5 text-left hover:bg-paper-raised transition-colors"
                >
                  <span className="font-serif text-[24px] text-ink-muted pl-1">{c.numeral}</span>
                  <span>
                    <span className="block font-serif text-[23px] leading-tight text-ink">{c.title}</span>
                    <span className="block mt-1 text-[15px] leading-relaxed text-ink-soft">{c.summary}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 mr-2 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                </button>
              </li>
            ))}
          </ol>
        </section>

        <footer className="py-6 border-t border-rule flex flex-col sm:flex-row gap-2 justify-between text-[13px] text-ink-muted">
          <span>Made for a Science, Technology and Society course.</span>
          <span>Euclid · Gauss · Lobachevsky · Bolyai · Riemann</span>
        </footer>
        <div className="pb-8">
          <Credits />
        </div>
      </div>
    </div>
  );
};
