import React, { useState, useEffect } from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { findQuestion, QuestionSpec } from '../../content/questions';
import { STEPS, currentStepIndex, chapterOf } from '../../content/chapters';
import { Check, ArrowRight, ChevronDown } from 'lucide-react';

const HintToggle: React.FC<{ question: QuestionSpec }> = ({ question }) => {
  const [show, setShow] = useState(false);
  const [idle, setIdle] = useState(false);

  // Offer the hint more prominently after 20 seconds on the same question
  useEffect(() => {
    setShow(false);
    setIdle(false);
    const t = setTimeout(() => setIdle(true), 20000);
    return () => clearTimeout(t);
  }, [question.id]);

  return (
    <div className="mt-3">
      <button
        onClick={() => setShow(!show)}
        className="text-[13px] text-blue underline decoration-blue/30 underline-offset-4 hover:decoration-blue"
      >
        {show ? 'Hide the hint' : idle ? 'Stuck? Show a hint' : 'Show a hint'}
      </button>
      {show && <p className="mt-2 pl-3 border-l-2 border-rule-strong text-[14px] leading-relaxed text-ink-soft">{question.hint}</p>}
    </div>
  );
};

const Explanation: React.FC<{ question: QuestionSpec }> = ({ question }) => (
  <div className="pl-4 border-l-[3px] border-yellow">
    <div className="text-[13px] font-medium text-ochre">What's going on</div>
    <p className="mt-1 font-serif text-[17px] leading-relaxed text-ink">{question.reveal}</p>
  </div>
);

/** Tutorial: predict → do the task → see whether you were right, and why. */
const TutorialCard: React.FC<{ question: QuestionSpec }> = ({ question }) => {
  const { predictions, solvedQuestions, restartQuestion, lab, world, goToStep } = useGeometryStore();
  const exploration = useGeometryStore((s) => s.disk.exploration);
  const predicted = predictions[question.id];
  const solved = Boolean(solvedQuestions[question.id]);
  const option = (id?: string) => question.predict.options.find((o) => o.id === id)?.label;
  const correct = predicted === question.predict.answer;

  const next = STEPS[currentStepIndex(lab, world, exploration) + 1];

  return (
    <section aria-label="Active Inquiry Card" className="px-5 pt-5 pb-6 select-none">
      <div className="text-[13px] text-ink-muted">Question</div>
      <h2 className="mt-1 font-serif text-[24px] leading-tight text-ink">{question.title}</h2>

      {!predicted && !solved ? (
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">Make your prediction on the figure first.</p>
      ) : (
        <>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{question.prompt}</p>

          {predicted && (
            <p className="mt-3 text-[14px] text-ink-soft">
              You predicted: <span className="font-medium text-ink">{option(predicted)}</span>
            </p>
          )}

          <div className={`mt-4 border px-4 py-3 ${solved ? 'border-ink bg-paper' : 'border-rule'}`}>
            <div className="flex items-center gap-2 text-[13px] text-ink-muted">
              <span
                className={`inline-flex items-center justify-center w-4 h-4 border ${
                  solved ? 'bg-ink border-ink text-paper' : 'border-rule-strong bg-paper-raised'
                }`}
                aria-hidden="true"
              >
                {solved && <Check className="w-3 h-3" strokeWidth={3} />}
              </span>
              {solved ? 'Done' : 'Your task'}
            </div>
            <p className="mt-1.5 text-[15px] leading-relaxed text-ink">{question.goal}</p>
          </div>

          {!solved && <HintToggle question={question} />}

          {solved && (
            <div className="mt-5 space-y-4">
              {predicted && (
                <p className="text-[15px] leading-relaxed text-ink">
                  {correct ? (
                    <>You were right: <span className="font-medium">{option(question.predict.answer)}</span>.</>
                  ) : (
                    <>
                      Not what you predicted. The answer is <span className="font-medium">{option(question.predict.answer)}</span>.
                    </>
                  )}
                </p>
              )}
              <Explanation question={question} />
              {next && (
                <button
                  onClick={() => goToStep(next)}
                  className="inline-flex items-center gap-2 h-10 px-4 bg-ink text-paper text-[14px] hover:bg-ink-soft"
                >
                  Next: {next.chapter !== STEPS[currentStepIndex(lab, world, exploration)]?.chapter ? `${chapterOf(next).title}` : next.label}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => restartQuestion(question.id)}
            className="mt-5 block text-[13px] text-ink-muted underline decoration-rule-strong underline-offset-4 hover:text-ink"
          >
            Start this page again
          </button>
        </>
      )}
    </section>
  );
};

/** Explorer: no gates. The task is a suggestion and the explanation is one click away. */
const ExplorerCard: React.FC<{ question: QuestionSpec }> = ({ question }) => {
  const [open, setOpen] = useState(false);
  const solved = useGeometryStore((s) => Boolean(s.solvedQuestions[question.id]));

  useEffect(() => setOpen(false), [question.id]);

  return (
    <section aria-label="Active Inquiry Card" className="px-5 pt-5 pb-6 select-none">
      <div className="flex items-center gap-2 text-[13px] text-ink-muted">
        This page
        {solved && <Check className="w-3.5 h-3.5 text-ochre" aria-label="found" />}
      </div>
      <h2 className="mt-1 font-serif text-[24px] leading-tight text-ink">{question.title}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{question.prompt}</p>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
        <span className="text-ink-muted">Try this: </span>
        {question.goal}
      </p>

      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="mt-5 inline-flex items-center gap-1.5 text-[14px] text-ink hover:text-ink-soft"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        {open ? 'Hide the explanation' : 'Explain what’s going on'}
      </button>
      {open && (
        <div className="mt-3">
          <Explanation question={question} />
        </div>
      )}
    </section>
  );
};

export const QuestionCard: React.FC = () => {
  const { world, lab, mode } = useGeometryStore();
  const exploration = useGeometryStore((st) => st.disk.exploration);
  const question = findQuestion(lab, world, exploration);
  if (!question) return null;
  return mode === 'tutorial' ? <TutorialCard question={question} /> : <ExplorerCard question={question} />;
};

/** True when the figure should wait for a prediction. */
export function usePredictionPending(): QuestionSpec | null {
  const { world, lab, mode, predictions, solvedQuestions } = useGeometryStore();
  const exploration = useGeometryStore((st) => st.disk.exploration);
  const question = findQuestion(lab, world, exploration);
  if (!question || mode !== 'tutorial') return null;
  return predictions[question.id] || solvedQuestions[question.id] ? null : question;
}
