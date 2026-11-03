import React from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { STEPS, chapterOf, pagesOf, currentStepIndex } from '../../content/chapters';
import { worldColor } from '../../theme/palette';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';

/** Where you are in the book: the chapter, its pages, and Back / Next. */
export const PageBar: React.FC = () => {
  const { lab, world, goToStep, setIsLanding } = useGeometryStore();
  const exploration = useGeometryStore((s) => s.disk.exploration);

  const index = currentStepIndex(lab, world, exploration);
  const step = STEPS[index];
  if (!step) return null;

  const chapter = chapterOf(step);
  const pages = pagesOf(chapter.number);
  const prev = STEPS[index - 1];
  const next = STEPS[index + 1];
  const nextIsNewChapter = next && next.chapter !== step.chapter;

  return (
    <div className="shrink-0 border-b border-rule bg-paper px-3 sm:px-5 h-12 flex items-center gap-3 sm:gap-4 select-none">
      <div className="flex items-baseline gap-2 min-w-0 md:shrink-0">
        <span className="font-serif text-[15px] text-ink-muted">{chapter.numeral}</span>
        <h1 className="font-serif text-[18px] leading-none text-ink whitespace-nowrap truncate">{chapter.title}</h1>
      </div>

      {pages.length > 1 && (
        <>
          {/* Page tabs on wider screens */}
          <nav aria-label="Pages in this chapter" className="hidden md:flex items-center rounded-lg border border-rule bg-paper-raised p-0.5">
            {pages.map((p) => {
              const active = p === step;
              return (
                <button
                  key={p.slug}
                  onClick={() => goToStep(p)}
                  aria-current={active ? 'page' : undefined}
                  aria-label={p.world ? `Switch to ${p.world === 'hyperbolic' ? 'Hyperbolic' : p.label} world` : p.label}
                  className={`flex items-center gap-2 px-3 h-8 rounded-md text-[13px] transition-colors ${
                    active ? 'bg-paper-sunk text-ink font-medium' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {p.world && (
                    <span
                      className="w-2.5 h-2.5 shrink-0"
                      style={{ background: worldColor[p.world], opacity: active ? 1 : 0.55 }}
                      aria-hidden="true"
                    />
                  )}
                  {p.label}
                </button>
              );
            })}
          </nav>

          {/* A compact picker on phones */}
          <label className="md:hidden relative shrink-0 mr-1">
            <span className="sr-only">Page</span>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
            <select
              value={step.slug}
              onChange={(e) => {
                const p = pages.find((pg) => pg.slug === e.target.value);
                if (p) goToStep(p);
              }}
              className="h-8 pl-2 pr-6 text-[13px] bg-paper-raised border border-rule text-ink appearance-none"
            >
              {pages.map((p, i) => (
                <option key={p.slug} value={p.slug}>
                  {i + 1}. {p.label}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      <div className="ml-auto flex items-center gap-1 shrink-0">
        <button
          onClick={() => (prev ? goToStep(prev) : setIsLanding(true))}
          className="inline-flex items-center gap-1 h-8 px-2 text-[13px] text-ink-soft hover:text-ink"
          title={prev ? `Back to ${chapterOf(prev).title}: ${prev.label}` : 'Back to the cover'}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{prev ? 'Back' : 'Cover'}</span>
        </button>
        {next && (
          <button
            onClick={() => goToStep(next)}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-[13px] bg-ink text-paper hover:bg-ink-soft"
            title={`${chapterOf(next).title}: ${next.label}`}
          >
            {nextIsNewChapter ? (
              <>
                <span className="sm:hidden">Next</span>
                <span className="hidden sm:inline">
                  Next: {chapterOf(next).numeral}. {chapterOf(next).title}
                </span>
              </>
            ) : (
              'Next'
            )}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
