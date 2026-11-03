import React, { useEffect, useMemo } from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import {
  euclideanTriangle,
  sphericalTriangle,
  saddleTriangle,
  classifyParallelCandidate,
  DEFAULT_SPHERE_RADIUS,
} from '../../geometry-engine';
import { X } from 'lucide-react';
import { worldColor } from '../../theme/palette';

const deg = (rad: number) => (rad * 180) / Math.PI;

interface Row {
  label: React.ReactNode;
  value: string;
}

const Rows: React.FC<{ rows: Row[] }> = ({ rows }) => (
  <dl className="divide-y divide-rule border-y border-rule">
    {rows.map((r, i) => (
      <div key={i} className="flex items-baseline justify-between gap-4 py-2">
        <dt className="text-[14px] text-ink-soft">{r.label}</dt>
        <dd className="font-mono text-[13px] text-ink tabular text-right">{r.value}</dd>
      </div>
    ))}
  </dl>
);

const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="font-serif text-[20px] text-ink">{children}</h3>
);

const Var: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="font-serif italic text-[16px]">{children}</span>
);

export const DetailsDrawer: React.FC = () => {
  const {
    world,
    lab,
    detailsOpen,
    setDetailsOpen,
    flatTriangle: fTri,
    sphereTriangle: sTri,
    saddleTriangle: hTri,
    parallelExperiment,
    reflectionText,
    setReflectionText,
  } = useGeometryStore();

  // Close on Escape
  useEffect(() => {
    if (!detailsOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDetailsOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detailsOpen, setDetailsOpen]);

  const triangleData = useMemo(() => {
    if (lab !== 'triangle') return null;

    if (world === 'flat') {
      const tri = euclideanTriangle(fTri.p1, fTri.p2, fTri.p3);
      return {
        curvature: '0 everywhere',
        sides: [tri.a, tri.b, tri.c],
        angles: [tri.alpha, tri.beta, tri.gamma].map(deg),
        sumDeg: tri.angleSumDeg,
        extra: [{ label: 'Area', value: tri.area.toFixed(3) }] as Row[],
        gaussBonnet: 'No curvature to enclose, so nothing is added or lost: the sum stays at 180°.',
      };
    }
    if (world === 'sphere') {
      const R = DEFAULT_SPHERE_RADIUS;
      const tri = sphericalTriangle(sTri.p1, sTri.p2, sTri.p3, R);
      return {
        curvature: `1/R² = ${(1 / (R * R)).toFixed(2)} everywhere`,
        sides: [tri.a, tri.b, tri.c],
        angles: [tri.alpha, tri.beta, tri.gamma].map(deg),
        sumDeg: tri.angleSumDeg,
        extra: [
          { label: 'Area', value: tri.area.toFixed(3) },
          { label: 'Excess', value: `+${(tri.angleSumDeg - 180).toFixed(2)}°` },
        ] as Row[],
        gaussBonnet: `The excess equals the area divided by R² (here R = ${R}). Double the area and you double the excess.`,
      };
    }
    const tri = saddleTriangle(hTri.p1, hTri.p2, hTri.p3);
    return {
      curvature: 'negative, strongest at the centre (−1)',
      sides: tri.sides,
      angles: [tri.alpha, tri.beta, tri.gamma].map(deg),
      sumDeg: tri.angleSumDeg,
      extra: [
        { label: 'Defect, from the angles', value: `${tri.defectDeg.toFixed(2)}°` },
        { label: 'Defect, from ∫∫ K dA', value: `${deg(tri.defectFromIntegral).toFixed(2)}°` },
      ] as Row[],
      gaussBonnet:
        'The defect equals the total curvature inside the triangle. The two figures above are computed independently, one from the corners and one by integrating K over the area, and they agree.',
    };
  }, [world, lab, fTri, sTri, hTri]);

  const parallelData = useMemo(() => {
    if (lab !== 'parallel') return null;
    const kind = world === 'flat' ? 'euclidean' : world === 'sphere' ? 'spherical' : 'hyperbolic';
    const r = classifyParallelCandidate(kind, parallelExperiment.candidateAngleDeg);
    const rows: Row[] = [
      { label: <>Distance from <Var>P</Var> to <Var>L</Var></>, value: r.distance.toFixed(2) },
      {
        label: 'Lines through P that miss L',
        value: world === 'flat' ? 'exactly 1' : world === 'sphere' ? 'none' : 'infinitely many',
      },
    ];
    if (r.angleOfParallelismDeg !== undefined) {
      rows.push({ label: <>Angle of parallelism Π(<Var>d</Var>)</>, value: `${r.angleOfParallelismDeg.toFixed(1)}°` });
    }
    return rows;
  }, [world, lab, parallelExperiment.candidateAngleDeg]);

  if (!detailsOpen) return null;

  return (
    <>
      {/* Scrim on small screens, where the sheet covers the lab */}
      <div className="fixed inset-0 z-30 bg-ink/20 md:hidden" onClick={() => setDetailsOpen(false)} aria-hidden="true" />

      <div
        role="complementary"
        aria-label="Mathematical and STS Details"
        className="fixed top-0 md:top-14 bottom-0 right-0 z-40 w-full sm:w-[400px] bg-paper-raised border-l border-ink/80 shadow-sheet flex flex-col text-ink select-none"
      >
        <div className="flex items-center justify-between px-6 h-14 border-b border-rule shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5" style={{ background: worldColor[world] }} aria-hidden="true" />
            <h2 className="font-serif text-[20px]">Notes</h2>
          </div>
          <button
            onClick={() => setDetailsOpen(false)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-muted hover:text-ink hover:bg-paper-sunk"
            aria-label="Close details panel"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {triangleData && (
            <>
              <section className="space-y-3">
                <Heading>Measurements</Heading>
                <Rows
                  rows={[
                    { label: <>Curvature <Var>K</Var></>, value: triangleData.curvature },
                    ...(['a', 'b', 'c'] as const).map((n, i) => ({
                      label: <>Side <Var>{n}</Var></>,
                      value: triangleData.sides[i].toFixed(3),
                    })),
                    ...(['α', 'β', 'γ'] as const).map((n, i) => ({
                      label: <>Angle <Var>{n}</Var></>,
                      value: `${triangleData.angles[i].toFixed(2)}°`,
                    })),
                    { label: <>Sum <Var>α</Var> + <Var>β</Var> + <Var>γ</Var></>, value: `${triangleData.sumDeg.toFixed(2)}°` },
                    ...triangleData.extra,
                  ]}
                />
              </section>

              <section className="space-y-3">
                <Heading>Gauss–Bonnet</Heading>
                <p className="font-serif text-[19px] text-center py-1">
                  <Var>α</Var> + <Var>β</Var> + <Var>γ</Var> − π = ∬ <Var>K</Var> d<Var>A</Var>
                </p>
                <p className="text-[14px] leading-relaxed text-ink-soft">{triangleData.gaussBonnet}</p>
              </section>
            </>
          )}

          {parallelData && (
            <section className="space-y-3">
              <Heading>Measurements</Heading>
              <Rows rows={parallelData} />
            </section>
          )}

          <section className="space-y-3">
            <Heading>Why it mattered</Heading>
            <p className="text-[14px] leading-relaxed text-ink-soft">
              For two thousand years Euclidean geometry was taken to be the geometry of the world, not one
              model among others. The failed attempts to prove the fifth postulate ended with Lobachevsky
              and Bolyai showing that other geometries were just as consistent.
            </p>
            <p className="text-[14px] leading-relaxed text-ink-soft">
              That changed what mathematics was understood to be. Which geometry fits physical space became
              a question for measurement. A century later Einstein’s general relativity described gravity
              as the curvature of spacetime, using the geometry Riemann had built on that foundation.
            </p>
          </section>

          <section className="space-y-3">
            <Heading>Your notes</Heading>
            <label htmlFor="lab-notes" className="block text-[13px] text-ink-muted">
              What surprised you? What would you test next?
            </label>
            <textarea
              id="lab-notes"
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="The sum went past 190° once the triangle covered…"
              className="w-full h-32 bg-paper border border-rule p-3 text-[14px] leading-relaxed text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink resize-y select-text"
            />
          </section>
        </div>
      </div>
    </>
  );
};
