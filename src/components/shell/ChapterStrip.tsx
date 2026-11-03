import React from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { CHAPTERS, STEPS, currentStepIndex, firstStepOfChapter } from '../../content/chapters';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/** The guided path: chapter numerals, where you are, and Back / Next. */
export const ChapterStrip: React.FC = () => {
  const { lab, world, goToStep } = useGeometryStore();
  const exploration = useGeometryStore((s) => s.disk.exploration);

  const index = currentStepIndex(lab, world, exploration);
  const step = STEPS[index];
  const chapter = CHAPTERS.find((c) => c.number === step?.chapter);
  const inChapter = STEPS.filter((s) => s.chapter === step?.chapter);
  const position = inChapter.indexOf(step) + 1;

  const go = (i: number) => {
    const s = STEPS[i];
    if (s) goToStep(s);
  };

  return (
    <div className="shrink-0 h-11 border-b border-rule bg-paper px-3 sm:px-5 flex items-center gap-3 sm:gap-5 select-none">
      <nav aria-label="Chapters" className="flex items-center">
        {CHAPTERS.map((c) => {
          const active = c.number === step?.chapter;
          return (
            <button
              key={c.number}
              onClick={() => go(firstStepOfChapter(c.number))}
              title={`${c.numeral}. ${c.title}`}
              aria-current={active ? 'step' : undefined}
              className={`min-w-[30px] h-8 px-1.5 font-serif text-[15px] border-b-2 transition-colors ${
                active ? 'border-ink text-ink' : 'border-transparent text-ink-faint hover:text-ink-soft'
              }`}
            >
              {c.numeral}
            </button>
          );
        })}
      </nav>

      {chapter && (
        <div className="min-w-0 flex items-baseline gap-2">
          <span className="font-serif text-[16px] text-ink truncate">{chapter.title}</span>
          {inChapter.length > 1 && (
            <span className="hidden sm:inline text-[12px] text-ink-muted whitespace-nowrap">
              {step.label} · {position} of {inChapter.length}
            </span>
          )}
        </div>
      )}

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={() => go(index - 1)}
          disabled={index <= 0}
          className="inline-flex items-center gap-1 h-8 px-2 text-[13px] text-ink-soft hover:text-ink disabled:opacity-30"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <button
          onClick={() => go(index + 1)}
          disabled={index < 0 || index >= STEPS.length - 1}
          className="inline-flex items-center gap-1.5 h-8 px-3 text-[13px] bg-ink text-paper hover:bg-ink-soft disabled:opacity-30"
        >
          Next
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
