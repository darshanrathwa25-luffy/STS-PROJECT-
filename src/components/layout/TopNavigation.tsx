import React from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import {
  Compass,
  Volume2,
  VolumeX,
  Layers,
  Columns,
  Github,
} from 'lucide-react';

export const TopNavigation: React.FC = () => {
  const {
    mode,
    setMode,
    soundEnabled,
    setSoundEnabled,
  } = useGeometryStore();

  return (
    <header className="h-[58px] bg-[#12141A] border-b border-[#292C35] px-5 flex items-center justify-between z-20 select-none">
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#181B22] border border-[#292C35] text-[#69A3FF]">
          <Compass className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide text-[#E8EAF0] uppercase font-mono">
              Curvature Lab
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#181B22] text-[#69A3FF] border border-[#69A3FF]/30">
              Interactive
            </span>
          </div>
          <p className="text-[10px] text-[#858B9A] -mt-0.5 font-sans">
            Non-Euclidean Geometry Playground
          </p>
        </div>
      </div>

      {/* Center: Explore & Compare Mode Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex bg-[#0D0F14] p-1 rounded-lg border border-[#292C35]">
          <button
            onClick={() => setMode('explore')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md transition ${
              mode === 'explore'
                ? 'bg-[#181B22] text-[#69A3FF] font-semibold border border-[#69A3FF]/30 shadow-sm'
                : 'text-[#858B9A] hover:text-[#E8EAF0]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Explore</span>
          </button>

          <button
            onClick={() => setMode('compare')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md transition ${
              mode === 'compare'
                ? 'bg-[#181B22] text-[#69A3FF] font-semibold border border-[#69A3FF]/30 shadow-sm'
                : 'text-[#858B9A] hover:text-[#E8EAF0]'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Compare</span>
          </button>
        </div>
      </div>

      {/* Right: Sound & External Repository */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition ${
            soundEnabled
              ? 'bg-[#181B22] text-[#69A3FF] border-[#69A3FF]/40'
              : 'bg-[#12141A] text-[#858B9A] hover:text-[#E8EAF0] border-[#292C35]'
          }`}
          title={soundEnabled ? 'Mute Audio' : 'Enable Subtle Procedural Audio'}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-[#69A3FF]" />
              <span className="hidden sm:inline font-mono text-[11px]">Audio On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4" />
              <span className="hidden sm:inline font-mono text-[11px]">Muted</span>
            </>
          )}
        </button>

        <a
          href="https://github.com/darshanrathwa25-luffy/STS-PROJECT-"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg bg-[#181B22] hover:bg-[#202530] text-[#858B9A] hover:text-[#E8EAF0] border border-[#292C35] transition"
          title="Repository"
        >
          <Github className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
};
