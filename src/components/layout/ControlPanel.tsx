import React, { useState } from 'react';
import { useGeometryStore, ExperimentId } from '../../store/geometryStore';
import { ParallelLinesExperiment } from '../experiments/ParallelLinesExperiment';
import { TriangleExperiment } from '../experiments/TriangleExperiment';
import {
  Activity,
  Triangle,
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
      id: 'triangle',
      label: 'Triangle Lab',
      prompt: 'Can a triangle total > 180°?',
      icon: <Triangle className="w-3.5 h-3.5 text-[#FFD166]" />,
    },
    {
      id: 'parallel-lines',
      label: 'Parallel Lines',
      prompt: 'Can you draw a line that never meets?',
      icon: <Activity className="w-3.5 h-3.5 text-[#69A3FF]" />,
    },
  ];

  return (
    <aside className="w-[310px] shrink-0 h-full bg-[#12141A] border-l border-[#292C35] overflow-y-auto overflow-x-hidden flex flex-col justify-between select-none text-[#E8EAF0] p-4 space-y-4">
      {/* Top: Experiments Selector */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#858B9A] font-semibold">
          Select Lab
        </div>
        <div className="grid grid-cols-2 gap-1 bg-[#0D0F14] p-1 rounded-xl border border-[#292C35]">
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
      </div>

      {/* Bottom: Appearance & Controls Settings */}
      <div className="border-t border-[#292C35] pt-3 space-y-2">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-xs text-[#858B9A] hover:text-[#E8EAF0] py-1 font-mono transition"
        >
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" /> View Options
          </span>
          {showAdvanced ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {showAdvanced && (
          <div className="space-y-3 bg-[#0D0F14] p-3 rounded-xl border border-[#20232B] text-xs">
            {/* Surface Opacity */}
            <div>
              <div className="flex justify-between text-[11px] text-[#858B9A] mb-1 font-mono">
                <span>Surface Opacity</span>
                <span>{(appearance.surfaceOpacity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.9"
                step="0.05"
                value={appearance.surfaceOpacity}
                onChange={(e) =>
                  setAppearance({ surfaceOpacity: parseFloat(e.target.value) })
                }
                className="w-full h-1 bg-[#20232B] rounded-lg appearance-none cursor-pointer accent-[#69A3FF]"
              />
            </div>

            {/* Orbit Sensitivity */}
            <div>
              <div className="flex justify-between text-[11px] text-[#858B9A] mb-1 font-mono">
                <span>Orbit Sensitivity</span>
                <span>{orbitSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.1"
                value={orbitSensitivity}
                onChange={(e) =>
                  setOrbitSensitivity(parseFloat(e.target.value))
                }
                className="w-full h-1 bg-[#20232B] rounded-lg appearance-none cursor-pointer accent-[#69A3FF]"
              />
            </div>

            {/* Reset Camera Button */}
            <button
              onClick={resetCamera}
              className="w-full py-1.5 px-2 rounded-lg bg-[#181B22] hover:bg-[#202530] text-[#858B9A] hover:text-[#E8EAF0] border border-[#292C35] text-[11px] font-mono flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3 h-3" /> Reset Camera
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
