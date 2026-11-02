import React, { useState } from 'react';
import { StsReflectionBox } from './StsReflectionBox';
import { History, Milestone, Compass, Sparkles, BookOpen } from 'lucide-react';

interface TimelineEvent {
  year: string;
  figure: string;
  title: string;
  summary: string;
  impact: string;
  quote?: string;
}

export const CaseStudyHistory: React.FC = () => {
  const [selectedEventIndex, setSelectedEventIndex] = useState<number>(3); // Default Lobachevsky

  const timeline: TimelineEvent[] = [
    {
      year: '~300 BCE',
      figure: 'Euclid of Alexandria',
      title: "The Elements & The Fifth Postulate",
      summary:
        "Euclid formulated 5 foundational postulates. The first four were simple (e.g. 'a line can be drawn between any two points'). The fifth (the Parallel Postulate) was verbose and complicated. For millennia, mathematicians regarded it as a flaw or a theorem awaiting proof.",
      impact:
        "Established Euclidean geometry as the perceived universal truth of physical space for over twenty centuries.",
    },
    {
      year: '1733',
      figure: 'Giovanni Girolamo Saccheri',
      title: "Euclid Vindicated of All Flaws (Proof by Contradiction)",
      summary:
        "Saccheri attempted to prove the parallel postulate by contradiction using quadrilaterals with right base angles. He examined the 'hypothesis of the acute angle' and proved many valid theorems of hyperbolic geometry, but rejected them because the results seemed aesthetically repugnant to classical intuition.",
      impact:
        "Demonstrated how deeply philosophical prejudice can prevent an investigator from recognizing a new mathematical reality.",
    },
    {
      year: '1813–1824',
      figure: 'Carl Friedrich Gauss',
      title: "The Silent Discovery of Non-Euclidean Geometry",
      summary:
        "Gauss realized that geometry with angle sums less than 180° was completely logical and consistent. However, he refused to publish his findings because he feared 'the clamor of the Boeotians' (the dogmatic Kantian philosophers who held Euclidean space as an innate necessity of human cognition).",
      impact:
        "Shows how institutional and cultural pressure can suppress revolutionary scientific ideas.",
      quote: "I am becoming more and more convinced that the necessity of our geometry cannot be proved.",
    },
    {
      year: '1829',
      figure: 'Nikolai Lobachevsky',
      title: "The First Published Non-Euclidean Geometry",
      summary:
        "A professor at Kazan University in Russia, Lobachevsky independently took the bold step of publishing 'Imaginary Geometry' in the Kazan Messenger. He proved that an infinite family of parallel lines exists through an external point and worked out hyperbolic trigonometry.",
      impact:
        "Known as the 'Copernicus of Geometry' for daring to dismantle Euclid's 2,000-year monopoly.",
      quote: "There is no contradiction in our mind if we admit that some forces in nature follow one geometry and other forces another.",
    },
    {
      year: '1832',
      figure: 'János Bolyai',
      title: "The Absolute Science of Space",
      summary:
        "Working as an Austro-Hungarian military engineer, young Bolyai independently discovered hyperbolic geometry. His father, Farkas Bolyai, had spent his life failing to prove the 5th postulate and begged his son to abandon it. János persevered.",
      impact:
        "Proved that Euclidean and non-Euclidean geometries can be unified under a single axiomatic framework.",
      quote: "Out of nothing I have created a strange new universe.",
    },
    {
      year: '1854',
      figure: 'Bernhard Riemann',
      title: "On the Hypotheses which lie at the Bases of Geometry",
      summary:
        "In his historic Habilitation lecture at Göttingen, Riemann generalized geometry from flat surfaces to n-dimensional manifolds. He introduced positive curvature (where parallel lines do not exist at all) and defined the metric tensor g_ij.",
      impact:
        "Directly provided the mathematical machinery that Albert Einstein needed 60 years later to formulate General Relativity.",
      quote: "Space is only a particular case of a triply extended magnitude.",
    },
    {
      year: '1868–1882',
      figure: 'Beltrami, Klein & Poincaré',
      title: "Euclidean Models of Non-Euclidean Space",
      summary:
        "Beltrami showed that non-Euclidean geometry was just as consistent as Euclidean geometry by embedding it into Euclidean models (the Pseudosphere in 1868). Felix Klein and Henri Poincaré created conformal disk and half-plane coordinate charts.",
      impact:
        "Proved equiconsistency: if hyperbolic geometry contains a contradiction, Euclidean geometry must also contain a contradiction.",
    },
  ];

  const current = timeline[selectedEventIndex];

  const reflectionQuestions = [
    {
      question: "What historical assumptions held back the discovery of non-Euclidean geometry?",
      context:
        "For over 2,000 years, Kantian philosophy and common sense asserted that 3D Euclidean space was the only conceivable arena for physical reality. Saccheri proved valid hyperbolic theorems but discarded them because he assumed Euclid had to be right.",
      promptHint: "How do foundational assumptions in modern science mirror Euclid's fifth postulate?",
    },
    {
      question: "What new knowledge became possible once the 5th postulate was abandoned?",
      context:
        "Untethering geometry from Euclid enabled Riemann's metric manifolds, which enabled Einstein's General Relativity. Without non-Euclidean geometry, gravity could only ever be treated as an instantaneous mysterious force rather than the curvature of spacetime.",
      promptHint: "What technologies today depend on non-Euclidean spacetime? (e.g. GPS satellite timing)",
    },
    {
      question: "What does this tell us about mathematical 'truth' vs physical reality?",
      context:
        "Euclidean geometry is mathematically true under its axioms, but so are spherical and hyperbolic geometries under theirs. Which geometry describes our physical universe is an empirical question for physics, not pure thought.",
      promptHint: "How did this shift affect the relationship between mathematics and physical science?",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Central Question Header */}
      <div className="bg-[#12141A] p-5 rounded-xl border border-[#292C35] shadow-panel space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#69A3FF]">
          <History className="w-4 h-4" />
          <span>Case Study 1 · Historical Epistemology</span>
        </div>
        <h2 className="text-xl font-bold text-[#E8EAF0]">
          The Revolution of Non-Euclidean Geometry
        </h2>
        <div className="p-3 rounded-lg bg-[#0D0F14] border border-[#20232B] text-xs leading-relaxed text-[#858B9A]">
          <strong className="text-[#69A3FF]">Central STS Question:</strong>{" "}
          <span className="text-[#E8EAF0] italic">
            "How did questioning a foundational mathematical assumption change the scientific understanding of space?"
          </span>
        </div>
      </div>

      {/* Interactive Timeline Stepper */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#858B9A]">
          <span className="flex items-center gap-1.5">
            <Milestone className="w-3.5 h-3.5 text-[#69A3FF]" />
            Chronological Timeline
          </span>
          <span>Click any milestone to inspect</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 bg-[#0D0F14] p-1.5 rounded-xl border border-[#292C35]">
          {timeline.map((ev, idx) => {
            const isSelected = idx === selectedEventIndex;
            return (
              <button
                key={idx}
                onClick={() => setSelectedEventIndex(idx)}
                className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 ${
                  isSelected
                    ? 'bg-[#181B22] border border-[#69A3FF]/50 text-[#69A3FF] shadow-glow-accent'
                    : 'text-[#858B9A] hover:text-[#E8EAF0] hover:bg-[#181B22]/40'
                }`}
              >
                <span className="font-mono text-[11px] font-bold">{ev.year}</span>
                <span className="text-[10px] truncate max-w-[90px]">{ev.figure.split(' ')[1] || ev.figure}</span>
              </button>
            );
          })}
        </div>

        {/* Milestone Detail Card */}
        <div className="bg-[#12141A] rounded-xl border border-[#292C35] p-5 space-y-3 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#20232B] pb-3">
            <div>
              <div className="text-xs font-mono text-[#69A3FF]">{current.year} · {current.figure}</div>
              <h3 className="text-base font-bold text-[#E8EAF0] mt-0.5">{current.title}</h3>
            </div>
            {current.quote && (
              <div className="text-xs italic text-[#FFD166] bg-[#181B22] px-3 py-1.5 rounded-lg border border-[#292C35] max-w-sm">
                "{current.quote}"
              </div>
            )}
          </div>

          <p className="text-xs text-[#E8EAF0] leading-relaxed">{current.summary}</p>

          <div className="p-3 rounded-lg bg-[#0D0F14] border border-[#20232B] text-xs">
            <div className="text-[10px] font-mono text-[#858B9A] uppercase tracking-wider">Philosophical & STS Significance</div>
            <div className="text-[#858B9A] mt-1 leading-relaxed">{current.impact}</div>
          </div>
        </div>
      </div>

      {/* Reflection Framework */}
      <StsReflectionBox questions={reflectionQuestions} />
    </div>
  );
};

