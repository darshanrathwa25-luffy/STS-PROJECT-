import React, { useEffect, useRef, useState } from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { Volume2, VolumeX, RotateCcw, PanelRight, ChevronDown, Check } from 'lucide-react';
import { CHAPTERS, STEPS, pagesOf, currentStepIndex } from '../../content/chapters';
import { ByrneMark } from './ByrneMark';

const iconButton =
  'inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-muted hover:text-ink hover:bg-paper-sunk transition-colors';

/** Tutorial: predict, then a task, then the explanation. Explorer: everything open. */
const ModeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { mode, setMode } = useGeometryStore();
  return (
    <div role="group" aria-label="Mode" className={`flex items-center border border-rule bg-paper-raised p-0.5 rounded-md ${className}`}>
      {(
        [
          ['tutorial', 'Tutorial', 'Predict, try a task, then see the explanation'],
          ['explorer', 'Explorer', 'Everything open: no predictions or tasks'],
        ] as const
      ).map(([id, label, title]) => (
        <button
          key={id}
          onClick={() => setMode(id)}
          aria-pressed={mode === id}
          title={title}
          className={`h-7 px-2.5 rounded text-[13px] transition-colors ${
            mode === id ? 'bg-paper-sunk text-ink font-medium' : 'text-ink-muted hover:text-ink'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

/** Every chapter and page, with a tick where the page's question has been answered. */
const ContentsMenu: React.FC = () => {
  const { lab, world, goToStep, setIsLanding, solvedQuestions } = useGeometryStore();
  const exploration = useGeometryStore((s) => s.disk.exploration);
  const current = STEPS[currentStepIndex(lab, world, exploration)];
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`inline-flex items-center gap-1.5 h-8 px-2.5 text-[13px] border transition-colors ${
          open ? 'border-ink text-ink bg-paper-sunk' : 'border-rule text-ink-soft hover:border-rule-strong hover:text-ink'
        }`}
      >
        Contents
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-2 z-50 w-[min(88vw,340px)] max-h-[75vh] overflow-y-auto bg-paper-raised border border-ink/80 shadow-sheet py-2"
        >
          <div className="sm:hidden px-4 pb-2 mb-1 border-b border-rule">
            <ModeToggle className="w-fit" />
          </div>
          <button
            role="menuitem"
            onClick={() => {
              setIsLanding(true);
              setOpen(false);
            }}
            className="w-full text-left px-4 py-1.5 text-[13px] text-ink-muted hover:text-ink hover:bg-paper-sunk"
          >
            Cover
          </button>
          {CHAPTERS.map((c) => {
            const pages = pagesOf(c.number);
            const single = pages.length === 1;
            return (
              <div key={c.number} className="pt-2">
                <button
                  role="menuitem"
                  onClick={() => {
                    goToStep(pages[0]);
                    setOpen(false);
                  }}
                  className={`w-full flex items-baseline gap-3 px-4 py-1.5 text-left hover:bg-paper-sunk ${
                    current?.chapter === c.number ? 'text-ink' : 'text-ink-soft'
                  }`}
                >
                  <span className="w-6 font-serif text-[15px] text-ink-muted">{c.numeral}</span>
                  <span className="font-serif text-[17px]">{c.title}</span>
                  {single && current === pages[0] && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ink self-center" />}
                </button>
                {!single && (
                  <ul className="pl-[52px] pr-4">
                    {pages.map((p) => {
                      const here = p === current;
                      const done = p.questionId ? solvedQuestions[p.questionId] : false;
                      return (
                        <li key={p.slug}>
                          <button
                            role="menuitem"
                            aria-current={here ? 'page' : undefined}
                            onClick={() => {
                              goToStep(p);
                              setOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 py-1 text-left text-[14px] hover:text-ink ${
                              here ? 'text-ink font-medium' : 'text-ink-soft'
                            }`}
                          >
                            {p.label}
                            {done && <Check className="w-3.5 h-3.5 text-ochre" aria-label="answered" />}
                            {here && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ink" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const TopBar: React.FC = () => {
  const { soundEnabled, setSoundEnabled, resetLab, detailsOpen, setDetailsOpen, setIsLanding } = useGeometryStore();

  return (
    <header className="shrink-0 h-14 border-b border-rule bg-paper px-3 sm:px-5 flex items-center gap-3 sm:gap-5 z-30 select-none">
      <button
        onClick={() => setIsLanding(true)}
        className="flex items-center gap-2.5 rounded-md -m-1 p-1"
        title="Back to the cover"
        aria-label="Return to Introduction / Landing"
      >
        <ByrneMark className="w-6 h-6 shrink-0" />
        <span className="font-serif text-[19px] leading-none text-ink whitespace-nowrap hidden sm:inline">Curvature Lab</span>
      </button>

      <ContentsMenu />
      <ModeToggle className="hidden sm:flex" />

      <div className="ml-auto flex items-center gap-1">
        <button onClick={resetLab} className={iconButton} title="Reset this page" aria-label="Reset Lab">
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`${iconButton} ${soundEnabled ? 'text-blue' : ''}`}
          title={soundEnabled ? 'Mute sound' : 'Turn sound on'}
          aria-label={soundEnabled ? 'Mute Audio' : 'Unmute Sound'}
          aria-pressed={soundEnabled}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setDetailsOpen(!detailsOpen)}
          className={`ml-1 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[13px] border transition-colors ${
            detailsOpen ? 'border-ink text-ink bg-paper-sunk' : 'border-rule text-ink-soft hover:text-ink hover:border-rule-strong'
          }`}
          title="Show the maths, your findings and your notes"
          aria-label="Toggle Math & STS Details Drawer"
          aria-expanded={detailsOpen}
        >
          <PanelRight className="w-4 h-4" />
          <span className="hidden sm:inline">Notes</span>
        </button>
      </div>
    </header>
  );
};
