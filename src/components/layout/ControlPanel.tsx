import React, { useState } from 'react';
import { useGeometryStore, ExperimentId } from '../../store/geometryStore';
import { ParallelLinesExperiment } from '../experiments/ParallelLinesExperiment';
import { TriangleExperiment } from '../experiments/TriangleExperiment';
import { TessellationExperiment } from '../experiments/TessellationExperiment';
import {
  Activity,
  Triangle,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

export const ControlPanel: React.FC = () => {
  const {
    experiment,
    setExperiment,
    appearance,
    setAppearance,
    orbitSensitivity,
    setOrbitSensitivity,
    resetCamera,
  } = useGeometryStore();

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const experimentTabs: {
    id: ExperimentId;
    label: string;
    prompt: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'parallel-lines',
      label: 'Parallel Lines',
      prompt: 'Can you draw a line that never meets?',
      icon: <Activity className="w-3.5 h-3.5 text-[#69A3FF]" />,
    },
    {
      id: 'triangle',
      label: 'Triangle',
      prompt: 'Can a triangle total > 180°?',
      icon: <Triangle className="w-3.5 h-3.5 text-[#FFD166]" />,
    },
    {
      id: 'tessellation',
      label: 'Infinite Tiles',
      prompt: 'Why do tiles shrink outward?',
      icon: <Sparkles className="w-3.5 h-3.5 text-[#06D6A0]" />,
    },
  ];

  return (
    <aside className="w-[310px] shrink-0 h-full bg-[#12141A] border-l border-[#292C35] overflow-y-auto overflow-x-hidden flex flex-col justify-between select-none text-[#E8EAF0] p-4 space-y-4">
      {/* Top: Experiments Selector */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#858B9A] font-semibold">
          Select Playground Activity
        </div>
        <div className="grid grid-cols-3 gap-1 bg-[#0D0F14] p-1 rounded-xl border border-[#292C35]">
          {experimentTabs.map((tab) => {
            const active = experiment === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setExperiment(tab.id)}
                className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 ${
                  active
                    ? 'bg-[#181B22] border border-[#69A3FF]/40 text-[#69A3FF] font-semibold shadow-sm'
                    : 'text-[#858B9A] hover:text-[#E8EAF0] hover:bg-[#181B22]/40'
                }`}
                title={tab.prompt}
              >
                <span>{tab.icon}</span>
                <span className="text-[11px] truncate w-full">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Center: Contextual Active Experiment Controls */}
      <div className="flex-1">
        {experiment === 'parallel-lines' && <ParallelLinesExperiment />}
        {experiment === 'triangle' && <TriangleExperiment />}
        {experiment === 'tessellation' && <TessellationExperiment />}
      </div>

      {/* Bottom: Minimal Advanced View Controls Toggle */}
      <div className="pt-2 border-t border-[#20232B] space-y-2 text-xs">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-[11px] text-[#858B9A] hover:text-[#E8EAF0] transition py-1"
        >
          <span className="flex items-center gap-1.5 font-mono">
            <Sliders className="w-3 h-3 text-[#69A3FF]" />
            <span>Display Controls</span>
          </span>
          {showAdvanced ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {showAdvanced && (
          <div className="space-y-2.5 bg-[#0D0F14] p-2.5 rounded-lg border border-[#20232B] text-[11px]">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[#858B9A]">Particle Surface</span>
              <input
                type="checkbox"
                checked={appearance.showSurface}
                onChange={(e) => setAppearance({ showSurface: e.target.checked })}
                className="accent-[#69A3FF] rounded cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[#858B9A]">Coordinate Guides</span>
              <input
                type="checkbox"
                checked={appearance.showGrid}
                onChange={(e) => setAppearance({ showGrid: e.target.checked })}
                className="accent-[#69A3FF] rounded cursor-pointer"
              />
            </label>
            <div>
              <div className="flex justify-between text-[10px] text-[#858B9A] mb-1">
                <span>Orbit Sensitivity</span>
                <span className="font-mono text-[#E8EAF0]">{orbitSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={orbitSensitivity}
                onChange={(e) => setOrbitSensitivity(parseFloat(e.target.value))}
                className="w-full accent-[#69A3FF] h-1 bg-[#1F2229] rounded cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
