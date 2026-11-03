import React from 'react';
import { useGeometryStore } from '../store/geometryStore';
import type { QuestionSpec } from '../content/questions';

/** Covers the figure until the student commits to a prediction (tutorial mode). */
export const PredictionVeil: React.FC<{ question: QuestionSpec }> = ({ question }) => {
  const setPrediction = useGeometryStore((s) => s.setPrediction);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-paper/90">
      <div
        role="dialog"
        aria-labelledby="predict-heading"
        className="w-full max-w-md bg-paper-raised border border-ink/80 shadow-sheet px-6 py-6"
      >
        <div className="text-[13px] text-ink-muted">Predict first</div>
        <h2 id="predict-heading" className="mt-1 font-serif text-[23px] leading-snug text-ink">
          {question.predict.prompt}
        </h2>
        <div className="mt-5 grid gap-2">
          {question.predict.options.map((o) => (
            <button
              key={o.id}
              onClick={() => setPrediction(question.id, o.id)}
              className="w-full text-left h-11 px-4 text-[15px] border border-rule text-ink hover:border-ink hover:bg-paper-sunk transition-colors"
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-ink-muted">There's no penalty for guessing wrong. You'll test it straight away.</p>
      </div>
    </div>
  );
};

/** Stands in for the readout panel until the prediction is made. */
export const VeiledReadout: React.FC = () => (
  <section className="px-5 pt-5 pb-6 border-b border-rule">
    <div className="text-[13px] text-ink-muted">Measurements</div>
    <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
      These appear once you've made your prediction, so the numbers don't give the answer away.
    </p>
  </section>
);
