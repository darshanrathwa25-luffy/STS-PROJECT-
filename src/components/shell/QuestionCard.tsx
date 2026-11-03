import React, { useMemo, useState, useEffect } from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { findQuestion } from '../../content/questions';
import { Check } from 'lucide-react';

export const QuestionCard: React.FC = () => {
  const { world, lab, solvedQuestions, markQuestionSolved } = useGeometryStore();
  const exploration = useGeometryStore((st) => st.disk.exploration);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [idleTriggered, setIdleTriggered] = useState<boolean>(false);

  const activeQuestion = useMemo(
    () =>
      findQuestion(lab, world, exploration) ?? {
        id: `${lab}_${world}`,
        title: 'Explore',
        prompt: 'Move the shapes and watch how curvature changes the result.',
        hint: 'Curvature K changes the rules of geometry.',
        reveal: 'Which geometry describes physical space is a question for measurement, not logic.',
      },
    [lab, world, exploration]
  );

  const isSolved = Boolean(solvedQuestions[activeQuestion.id]);

  // Offer a hint after 20 seconds on the same question
  useEffect(() => {
    setShowHint(false);
    setIdleTriggered(false);
    const timer = setTimeout(() => setIdleTriggered(true), 20000);
    return () => clearTimeout(timer);
  }, [activeQuestion.id]);

  return (
    <section aria-label="Active Inquiry Card" className="px-5 pt-5 pb-6 select-none">
      <div className="text-[13px] text-ink-muted">Question</div>
      <h2 className="mt-1 font-serif text-[24px] leading-tight text-ink">{activeQuestion.title}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft" aria-live="polite">
        {activeQuestion.prompt}
      </p>

      {!isSolved && (
        <div className="mt-3">
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-[13px] text-blue underline decoration-blue/30 underline-offset-4 hover:decoration-blue"
          >
            {showHint ? 'Hide the hint' : idleTriggered ? 'Stuck? Show a hint' : 'Show a hint'}
          </button>
          {showHint && (
            <p className="mt-2 pl-3 border-l-2 border-rule-strong text-[14px] leading-relaxed text-ink-soft">
              {activeQuestion.hint}
            </p>
          )}
        </div>
      )}

      {isSolved && (
        <div className="mt-4 pl-4 border-l-[3px] border-yellow">
          <div className="text-[13px] font-medium text-ochre">What you found</div>
          <p className="mt-1 font-serif text-[17px] leading-relaxed text-ink">{activeQuestion.reveal}</p>
        </div>
      )}

      <button
        onClick={() => markQuestionSolved(activeQuestion.id, !isSolved)}
        aria-pressed={isSolved}
        aria-label="Mark discovery as observed"
        className="mt-5 inline-flex items-center gap-2 text-[13px] text-ink-soft hover:text-ink"
      >
        <span
          className={`inline-flex items-center justify-center w-4 h-4 border transition-colors ${
            isSolved ? 'bg-ink border-ink text-paper' : 'border-rule-strong bg-paper-raised'
          }`}
          aria-hidden="true"
        >
          {isSolved && <Check className="w-3 h-3" strokeWidth={3} />}
        </span>
        {isSolved ? 'Observed' : "I've seen it"}
      </button>
    </section>
  );
};
