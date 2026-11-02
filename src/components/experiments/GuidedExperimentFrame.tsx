import React, { useState } from 'react';
import {
  HelpCircle,
  Lightbulb,
  FlaskConical,
  Eye,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
} from 'lucide-react';

export type StageId = 'question' | 'predict' | 'experiment' | 'observe' | 'explain';

export interface GuidedExperimentStage {
  id: StageId;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface GuidedExperimentFrameProps {
  title: string;
  subtitle: string;
  stages: GuidedExperimentStage[];
  currentStageIndex?: number;
  onStageChange?: (index: number) => void;
  onReset?: () => void;
}

export const GuidedExperimentFrame: React.FC<GuidedExperimentFrameProps> = ({
  title,
  subtitle,
  stages,
  onReset,
}) => {
  const [activeStage, setActiveStage] = useState<number>(0);

  const stageIcons: Record<StageId, React.ReactNode> = {
    question: <HelpCircle className="w-3.5 h-3.5" />,
    predict: <Lightbulb className="w-3.5 h-3.5" />,
    experiment: <FlaskConical className="w-3.5 h-3.5" />,
    observe: <Eye className="w-3.5 h-3.5" />,
    explain: <BookOpen className="w-3.5 h-3.5" />,
  };

  const handleNext = () => {
    if (activeStage < stages.length - 1) {
      setActiveStage(activeStage + 1);
    }
  };

  const handlePrev = () => {
    if (activeStage > 0) {
      setActiveStage(activeStage - 1);
    }
  };

  const current = stages[activeStage];

  return (
    <div className="space-y-3 bg-[#0D0F14] p-3.5 rounded-xl border border-[#292C35] text-[#E8EAF0] shadow-panel">
      {/* Title & Reset */}
      <div className="flex items-start justify-between border-b border-[#20232B] pb-2.5">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#69A3FF] font-semibold">
            Guided Investigation
          </div>
          <h4 className="text-sm font-semibold text-[#E8EAF0] mt-0.5">{title}</h4>
          <p className="text-[11px] text-[#858B9A] mt-0.5">{subtitle}</p>
        </div>
        {onReset && (
          <button
            onClick={() => {
              setActiveStage(0);
              onReset();
            }}
            className="p-1.5 rounded-lg bg-[#181B22] hover:bg-[#202530] text-[#858B9A] hover:text-[#E8EAF0] border border-[#292C35] transition"
            title="Reset Experiment to Step 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 5-Stage Stepper Pills */}
      <div className="grid grid-cols-5 gap-1 bg-[#12141A] p-1 rounded-lg border border-[#20232B]">
        {stages.map((stage, idx) => {
          const isActive = idx === activeStage;
          const isPassed = idx < activeStage;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStage(idx)}
              className={`py-1.5 px-1 rounded flex flex-col items-center justify-center gap-0.5 text-[9px] font-mono uppercase transition ${
                isActive
                  ? 'bg-[#181B22] text-[#69A3FF] border border-[#69A3FF]/40 font-bold shadow-sm'
                  : isPassed
                  ? 'text-[#E8EAF0] hover:bg-[#181B22]/50'
                  : 'text-[#565C6B] hover:text-[#858B9A]'
              }`}
              title={`${idx + 1}. ${stage.label}`}
            >
              <span>{stage.icon || stageIcons[stage.id]}</span>
              <span className="truncate w-full text-center">{stage.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Stage Body */}
      <div className="min-h-[140px] pt-1">
        {current.content}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[#20232B] text-xs">
        <button
          onClick={handlePrev}
          disabled={activeStage === 0}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded bg-[#181B22] text-[#858B9A] hover:text-[#E8EAF0] disabled:opacity-30 disabled:pointer-events-none border border-[#292C35] transition"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <span className="text-[10px] font-mono text-[#858B9A]">
          Step {activeStage + 1} of {stages.length}
        </span>

        <button
          onClick={handleNext}
          disabled={activeStage === stages.length - 1}
          className="flex items-center gap-1 px-3 py-1 text-[11px] font-medium rounded bg-[#69A3FF] text-[#090A0D] font-semibold hover:bg-[#87B5FF] disabled:opacity-30 disabled:pointer-events-none transition"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

