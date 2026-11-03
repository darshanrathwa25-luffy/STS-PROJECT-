import React from 'react';
import { useGeometryStore, WorldKind } from '../../store/geometryStore';
import { ArrowRight } from 'lucide-react';
import { palette, worldColor } from '../../theme/palette';
import { ByrneMark } from './ByrneMark';

// Fig. 1: one triangle drawn three ways. Vertices are shared; only the edges change.
// Sphere edges bow outward (excess), saddle edges bow inward (defect).
const A = '20,120';
const B = '140,120';
const C = '80,16';

const FIGURES: {
  world: WorldKind;
  name: string;
  sum: string;
  note: string;
  path: string;
}[] = [
  {
    world: 'flat',
    name: 'Plane',
    sum: 'Σ = 180°',
    note: 'Flat. Euclid’s geometry.',
    path: `M${A} L${B} L${C} Z`,
  },
  {
    world: 'sphere',
    name: 'Sphere',
    sum: 'Σ > 180°',
    note: 'Curves like a ball.',
    path: `M${A} Q80,136 ${B} Q130,60 ${C} Q30,60 ${A} Z`,
  },
  {
    world: 'hyperbolic',
    name: 'Saddle',
    sum: 'Σ < 180°',
    note: 'Curves two ways at once.',
    path: `M${A} Q80,100 ${B} Q94,78 ${C} Q66,78 ${A} Z`,
  },
];

export const LandingScreen: React.FC = () => {
  const { setIsLanding, setWorld, setLab } = useGeometryStore();

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

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <button
                onClick={() => startWith('flat')}
                className="inline-flex items-center gap-2 h-11 px-5 bg-ink text-paper text-[15px] font-medium hover:bg-ink-soft transition-colors"
              >
                Start with a flat triangle
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsLanding(false)}
                className="text-[15px] text-ink-soft hover:text-ink underline decoration-rule-strong underline-offset-4"
              >
                Or carry on where you left off
              </button>
            </div>
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
                  aria-label={`Open the ${f.name.toLowerCase()}`}
                >
                  <svg viewBox="0 0 160 140" className="w-full" aria-hidden="true">
                    <path
                      d={f.path}
                      fill={worldColor[f.world]}
                      stroke={palette.ink}
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    {[A, B, C].map((p) => {
                      const [x, y] = p.split(',');
                      return <circle key={p} cx={x} cy={y} r="3.2" fill={palette.ink} />;
                    })}
                  </svg>
                  <div className="mt-4 font-serif text-[19px] sm:text-[21px] leading-tight">{f.name}</div>
                  <div className="mt-0.5 font-mono text-[12px] sm:text-[13px] text-ink-soft tabular">{f.sum}</div>
                  <p className="mt-2 text-[13px] leading-snug text-ink-muted hidden sm:block min-h-[2.5em]">{f.note}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[13px] text-ink-muted group-hover:text-ink transition-colors">
                    Open <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              ))}
            </div>
            <figcaption className="mt-3 text-[13px] text-ink-muted">
              <span className="font-serif italic text-ink-soft">Fig. 1.</span> The same three corners, joined by the
              straightest possible lines on each surface.
            </figcaption>
          </figure>
        </main>

        <footer className="py-6 border-t border-rule flex flex-col sm:flex-row gap-2 justify-between text-[13px] text-ink-muted">
          <span>Made for a Science, Technology and Society course.</span>
          <span>Euclid · Gauss · Lobachevsky · Bolyai · Riemann</span>
        </footer>
      </div>
    </div>
  );
};
