import React, { useMemo, useState, useEffect } from 'react';
import { useGeometryStore, WorldKind, LabKind } from '../../store/geometryStore';
import { Check } from 'lucide-react';

interface QuestionSpec {
  id: string;
  world: WorldKind;
  lab: LabKind;
  title: string;
  prompt: string;
  hint: string;
  reveal: string;
}

const QUESTIONS: QuestionSpec[] = [
  {
    id: 'tri_flat',
    world: 'flat',
    lab: 'triangle',
    title: 'Can you break 180°?',
    prompt: 'Drag the corners. Try to make a triangle whose angles add up to anything other than 180°.',
    hint: 'Stretch it long and thin, or squash it flat. Watch the bar: it never passes the 180° mark.',
    reveal: "On a flat plane the sum is always exactly 180°. This follows from Euclid's fifth postulate, and for two thousand years it was taken as a plain fact about space, built into surveying, architecture and Newton's mechanics.",
  },
  {
    id: 'tri_sphere',
    world: 'sphere',
    lab: 'triangle',
    title: 'Where does the extra come from?',
    prompt: 'On a sphere the angles add up to more than 180°. Make the triangle bigger. What happens to the excess?',
    hint: 'Compare a small triangle with one that covers a large part of the globe. The excess tracks the area enclosed.',
    reveal: "The excess is proportional to the triangle's area (Girard's theorem, a case of Gauss–Bonnet). It's why no flat map of the Earth can keep every distance and angle true, a problem navigators and mapmakers lived with for centuries.",
  },
  {
    id: 'tri_hyperbolic',
    world: 'hyperbolic',
    lab: 'triangle',
    title: 'Where did the missing degrees go?',
    prompt: 'On a saddle the angles add up to less than 180°. Spread the triangle out. Does the defect grow or shrink?',
    hint: 'Negative curvature pulls straight lines apart, so the corners get sharper as the triangle grows.',
    reveal: "The defect grows with area. In 1829 Lobachevsky published a geometry built on exactly this, and showed it was as consistent as Euclid's. Euclid's axioms turned out to be one choice among several, not a law of nature.",
  },
  {
    id: 'par_flat',
    world: 'flat',
    lab: 'parallel',
    title: "Euclid's fifth postulate",
    prompt: 'Rotate the line through P. How many positions never meet line L?',
    hint: 'Look for the angle where the two lines stop converging on either side.',
    reveal: "Exactly one. On a flat plane a single parallel passes through P. For two thousand years mathematicians tried to prove this from Euclid's other axioms, and couldn't.",
  },
  {
    id: 'par_sphere',
    world: 'sphere',
    lab: 'parallel',
    title: 'Do parallels exist on a sphere?',
    prompt: 'Straight lines on a sphere are great circles. Can you find one through P that never meets L?',
    hint: 'Follow any great circle all the way round. Where does it cross the other one?',
    reveal: "None exist: every pair of great circles meets twice, at opposite points. Riemann showed that a consistent geometry with no parallels at all is possible, and it became a foundation for Einstein's curved spacetime.",
  },
  {
    id: 'par_hyperbolic',
    world: 'hyperbolic',
    lab: 'parallel',
    title: 'How many parallels?',
    prompt: 'Rotate the line through P. How many positions avoid line L? Find the boundary angle Π(d).',
    hint: 'There are two limiting lines. Everything between them misses L.',
    reveal: "Infinitely many. Between the two limiting parallels at angle Π(d) lies a whole fan of lines that never meet L, the discovery Lobachevsky and Bolyai made independently in the 1820s and 30s.",
  },
];

export const QuestionCard: React.FC = () => {
  const { world, lab, solvedQuestions, markQuestionSolved } = useGeometryStore();
  const [showHint, setShowHint] = useState<boolean>(false);
  const [idleTriggered, setIdleTriggered] = useState<boolean>(false);

  const activeQuestion = useMemo(() => {
    return (
      QUESTIONS.find((q) => q.world === world && q.lab === lab) || {
        id: `${lab}_${world}`,
        world,
        lab,
        title: 'Explore',
        prompt: 'Move the shapes and watch how curvature changes the result.',
        hint: 'Curvature K changes the rules of geometry.',
        reveal: 'Which geometry describes physical space is a question for measurement, not logic.',
      }
    );
  }, [world, lab]);

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
