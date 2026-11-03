import React, { useMemo, useState, useEffect } from 'react';
import { useGeometryStore, WorldKind, LabKind } from '../../store/geometryStore';
import { HelpCircle, CheckCircle2, ChevronUp, ChevronDown, Lightbulb, Sparkles } from 'lucide-react';

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
    title: 'The Euclidean Invariant',
    prompt: 'Can you construct a triangle whose angles do NOT sum to exactly 180°? Drag the vertices to explore.',
    hint: 'In a flat plane (K = 0), Euclid proved the angle sum is invariant—always exactly 180°, regardless of shape or scale.',
    reveal: "In flat Euclidean space (K = 0), the angle sum is strictly 180.00°. Euclid's 5th postulate guarantees this constancy, which anchored classical mechanics and architecture for two millennia.",
  },
  {
    id: 'tri_sphere',
    world: 'sphere',
    lab: 'triangle',
    title: 'Spherical Excess',
    prompt: 'Notice that the angle sum is strictly greater than 180°. How large can you make the excess by expanding the triangle?',
    hint: 'By Gauss-Bonnet, the spherical excess (Sum - 180°) is directly proportional to the enclosed surface area.',
    reveal: "Positive curvature bends paths together, creating an excess (Sum - 180°) proportional to area. 18th-century navigators learned sea charts inevitably distorted global distances because Earth's spherical geometry cannot be flattened.",
  },
  {
    id: 'tri_hyperbolic',
    world: 'hyperbolic',
    lab: 'triangle',
    title: 'Hyperbolic Defect',
    prompt: 'Notice that the angle sum is strictly less than 180°. What happens to the defect as the triangle expands across the saddle?',
    hint: 'Negative curvature forces triangles to be "thin". The defect (180° - Sum) grows as the triangle consumes more area.',
    reveal: "Negative curvature forces geodesics apart, creating a defect (180° - Sum). In 1829, Lobachevsky proved this geometry was logically consistent, shattering the ancient belief that Euclid's axioms were natural physical laws.",
  },
  {
    id: 'par_flat',
    world: 'flat',
    lab: 'parallel',
    title: "Euclid's Fifth Postulate",
    prompt: 'Through external point P, rotate the candidate line. How many lines can you draw that never intersect line L?',
    hint: 'In Euclidean geometry, there is exactly ONE line through P parallel to L.',
    reveal: "Euclid's 5th Postulate defines flat space: exactly one parallel line passes through P. For 2,000 years, thinkers assumed this was self-evident rather than an experimental model of space.",
  },
  {
    id: 'par_sphere',
    world: 'sphere',
    lab: 'parallel',
    title: 'Great Circle Convergence',
    prompt: 'Can two straight lines (great circles) ever remain parallel on a sphere without intersecting?',
    hint: 'All great circles intersect at two antipodal points. On a sphere, ZERO parallel lines exist.',
    reveal: "On a sphere, parallel lines cannot exist—all great circles intersect at antipodal poles. Riemannian geometry proved that spaces without parallels are mathematically complete.",
  },
  {
    id: 'par_hyperbolic',
    world: 'hyperbolic',
    lab: 'parallel',
    title: 'The Fan of Parallels',
    prompt: 'Rotate the line through P. How many lines avoid intersecting line L? Find the boundary angle Π(d).',
    hint: 'Lobachevsky & Bolyai proved that infinitely many non-intersecting lines pass through P.',
    reveal: "Between the two limiting parallels at angle Π(d), an infinite fan of ultraparallel lines passes through P without ever meeting L. This opened the mathematical universe to general relativity.",
  },
];

export const QuestionCard: React.FC = () => {
  const { world, lab, solvedQuestions, markQuestionSolved } = useGeometryStore();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [idleTriggered, setIdleTriggered] = useState<boolean>(false);

  const activeQuestion = useMemo(() => {
    return (
      QUESTIONS.find((q) => q.world === world && q.lab === lab) || {
        id: `${lab}_${world}`,
        world,
        lab,
        title: 'Geometric Exploration',
        prompt: 'Manipulate the geometric elements on screen and observe how spatial curvature alters the results.',
        hint: 'Curvature K changes the fundamental laws of geometry.',
        reveal: 'Space is physical and geometric models describe its behavior.',
      }
    );
  }, [world, lab]);

  const isSolved = Boolean(solvedQuestions[activeQuestion.id]);

  // 20s idle hint trigger
  useEffect(() => {
    setShowHint(false);
    setIdleTriggered(false);
    const timer = setTimeout(() => {
      setIdleTriggered(true);
    }, 20000);

    return () => clearTimeout(timer);
  }, [activeQuestion.id]);

  return (
    <aside
      aria-label="Active Inquiry Card"
      className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[92vw] max-w-lg bg-[#12141A]/95 backdrop-blur-md border border-[#292C35] rounded-2xl shadow-panel p-3.5 transition-all duration-200 select-none"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#181B22] border border-[#292C35] text-[#FFD166]">
            {isSolved ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#06D6A0]" />
            ) : (
              <HelpCircle className="w-3.5 h-3.5" />
            )}
          </span>
          <h2 className="text-xs font-semibold text-[#E8EAF0] uppercase tracking-wider font-mono">
            {activeQuestion.title}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Solved status pill */}
          <button
            onClick={() => markQuestionSolved(activeQuestion.id, !isSolved)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono transition ${
              isSolved
                ? 'bg-[#06D6A0]/15 text-[#06D6A0] border border-[#06D6A0]/40'
                : 'bg-[#181B22] text-[#858B9A] border border-[#292C35] hover:text-[#E8EAF0]'
            }`}
            title="Mark discovery as observed"
          >
            <span>{isSolved ? 'Discovered' : 'Exploring'}</span>
          </button>

          {/* Collapse/expand toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md text-[#858B9A] hover:text-[#E8EAF0] hover:bg-[#181B22] transition"
            aria-label={collapsed ? 'Expand prompt' : 'Collapse prompt'}
          >
            {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Question Content (Collapsible) */}
      {!collapsed && (
        <div className="space-y-2 mt-1">
          {/* If Solved: Show Reveal Card with STS hook */}
          {isSolved ? (
            <div className="p-3 rounded-xl bg-[#0D0F14] border border-[#06D6A0]/30 text-xs text-[#E8EAF0] leading-relaxed space-y-1 font-sans animate-fadeIn">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#06D6A0] uppercase font-bold tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>Discovery Confirmed</span>
              </div>
              <p>{activeQuestion.reveal}</p>
            </div>
          ) : (
            <p
              className="text-xs text-[#C5CAD4] leading-relaxed font-sans"
              aria-live="polite"
            >
              {activeQuestion.prompt}
            </p>
          )}

          {/* Hint Dropdown */}
          {showHint && !isSolved && (
            <div className="p-2.5 rounded-lg bg-[#181B22] border border-[#292C35] text-[11px] text-[#858B9A] leading-relaxed flex items-start gap-1.5 animate-fadeIn">
              <Lightbulb className="w-3.5 h-3.5 text-[#FFD166] shrink-0 mt-0.5" />
              <span>{activeQuestion.hint}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {!isSolved ? (
              <button
                onClick={() => setShowHint(!showHint)}
                className={`text-[10px] font-mono hover:underline focus:outline-none transition ${
                  idleTriggered ? 'text-[#FFD166] font-bold animate-pulse' : 'text-[#69A3FF]'
                }`}
              >
                {showHint ? 'Hide Hint' : idleTriggered ? 'Need a hint?' : 'Show Hint'}
              </button>
            ) : (
              <span className="text-[10px] font-mono text-[#06D6A0]">
                STS Insight Unlocked
              </span>
            )}

            <span className="text-[9px] font-mono text-[#5A6070]">
              {activeQuestion.world.toUpperCase()} • {activeQuestion.lab.toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
