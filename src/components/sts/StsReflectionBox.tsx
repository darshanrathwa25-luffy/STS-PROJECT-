import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronRight, PenTool, CheckCircle } from 'lucide-react';

interface StsReflectionBoxProps {
  questions: {
    question: string;
    context: string;
    promptHint?: string;
  }[];
}

export const StsReflectionBox: React.FC<StsReflectionBoxProps> = ({ questions }) => {
  const [openIdx, setOpenIdx] = useState<number>(0);
  const [notes, setNotes] = useState<Record<number, string>>({});

  return (
    <div className="bg-[#12141A] rounded-xl border border-[#292C35] p-4 text-xs space-y-3 shadow-panel">
      <div className="flex items-center gap-2 text-[#69A3FF] font-mono text-[11px] uppercase tracking-wider font-semibold border-b border-[#20232B] pb-2">
        <HelpCircle className="w-4 h-4" />
        <span>STS Reflection Framework</span>
      </div>

      <div className="space-y-2">
        {questions.map((q, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="rounded-lg border border-[#20232B] bg-[#0D0F14] overflow-hidden transition"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                className="w-full text-left p-3 flex items-center justify-between text-xs font-medium text-[#E8EAF0] hover:bg-[#181B22]/50 transition"
              >
                <span className="font-semibold">{q.question}</span>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#69A3FF]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#858B9A]" />
                )}
              </button>

              {isOpen && (
                <div className="px-3 pb-3 space-y-2.5 text-[11px] border-t border-[#1F2229] pt-2">
                  <p className="text-[#858B9A] leading-relaxed">{q.context}</p>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#69A3FF] flex items-center gap-1">
                      <PenTool className="w-3 h-3" />
                      <span>{q.promptHint || 'Student Reflection Note:'}</span>
                    </label>
                    <textarea
                      rows={2}
                      value={notes[idx] || ''}
                      onChange={(e) => setNotes({ ...notes, [idx]: e.target.value })}
                      placeholder="Type your notes or insights here..."
                      className="w-full bg-[#181B22] border border-[#292C35] rounded p-2 text-xs text-[#E8EAF0] placeholder-[#565C6B] focus:border-[#69A3FF] focus:outline-none transition resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

