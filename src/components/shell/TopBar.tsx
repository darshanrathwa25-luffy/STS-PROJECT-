import React from 'react';
import { useGeometryStore, WorldKind, LabKind, AppMode } from '../../store/geometryStore';
import {
  Compass,
  Volume2,
  VolumeX,
  RotateCcw,
  Info,
  Layers,
  Activity,
  Triangle as TriangleIcon,
  HelpCircle,
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    world,
    setWorld,
    lab,
    setLab,
    appMode,
    setAppMode,
    soundEnabled,
    setSoundEnabled,
    resetLab,
    detailsOpen,
    setDetailsOpen,
    setIsLanding,
  } = useGeometryStore();

  const worlds: { id: WorldKind; label: string; curvature: string }[] = [
    { id: 'flat', label: 'Flat', curvature: 'K = 0' },
    { id: 'sphere', label: 'Sphere', curvature: 'K > 0' },
    { id: 'hyperbolic', label: 'Hyperbolic', curvature: 'K < 0' },
  ];

  return (
    <header className="h-14 bg-[#12141A]/95 backdrop-blur-md border-b border-[#292C35] px-4 sm:px-6 flex items-center justify-between z-30 select-none relative shrink-0">
      {/* Left: Wordmark & STS Pill */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsLanding(true)}
          className="flex items-center gap-2.5 group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#69A3FF] rounded-lg p-1 transition"
          title="Return to Introduction / Landing"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#181B22] border border-[#292C35] text-[#69A3FF] group-hover:border-[#69A3FF]/50 transition">
            <Compass className="w-4 h-4 transition-transform group-hover:rotate-45" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-wide text-[#E8EAF0] uppercase font-mono">
                Curvature Lab
              </span>
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-[#181B22] text-[#69A3FF] border border-[#69A3FF]/30">
                STS
              </span>
            </div>
            <span className="text-[10px] text-[#858B9A] font-sans hidden sm:block">
              Interactive Geometry Playground
            </span>
          </div>
        </button>
      </div>

      {/* Center: Centered World Switcher (Hidden in Compare Mode) */}
      {appMode !== 'compare' && (
        <nav
          aria-label="Geometry World Selector"
          className="absolute left-1/2 -translate-x-1/2 flex items-center bg-[#0D0F14] p-1 rounded-xl border border-[#292C35] shadow-inner"
        >
          {worlds.map((w) => {
            const active = world === w.id;
            return (
              <button
                key={w.id}
                onClick={() => setWorld(w.id)}
                className={`px-3 py-1 rounded-lg text-xs transition flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#69A3FF] ${
                  active
                    ? 'bg-[#181B22] text-[#69A3FF] border border-[#69A3FF]/40 font-semibold shadow-sm'
                    : 'text-[#858B9A] hover:text-[#E8EAF0] hover:bg-[#181B22]/40'
                }`}
              >
                <span>{w.label}</span>
                <span
                  className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                    active
                      ? 'bg-[#69A3FF]/15 text-[#69A3FF]'
                      : 'bg-[#181B22] text-[#858B9A]'
                  }`}
                >
                  {w.curvature}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Right Controls: Mode Toggle, Lab Menu, Reset, Audio, Details */}
      <div className="flex items-center gap-2">
        {/* Lab Switcher: Triangle | Parallel */}
        <div className="flex items-center bg-[#0D0F14] p-0.5 rounded-lg border border-[#292C35]">
          <button
            onClick={() => setLab('triangle')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition flex items-center gap-1 ${
              lab === 'triangle'
                ? 'bg-[#181B22] text-[#FFD166] border border-[#FFD166]/30 shadow-sm'
                : 'text-[#858B9A] hover:text-[#E8EAF0]'
            }`}
            title="Triangle Lab (Angle Sums & Curvature)"
          >
            <TriangleIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Triangle</span>
          </button>
          <button
            onClick={() => setLab('parallel')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition flex items-center gap-1 ${
              lab === 'parallel'
                ? 'bg-[#181B22] text-[#06D6A0] border border-[#06D6A0]/30 shadow-sm'
                : 'text-[#858B9A] hover:text-[#E8EAF0]'
            }`}
            title="Parallel Lines Lab (Euclid's 5th Postulate)"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Parallel</span>
          </button>
        </div>

        {/* Explore | Compare Mode Toggle */}
        <div className="hidden lg:flex items-center bg-[#0D0F14] p-0.5 rounded-lg border border-[#292C35]">
          <button
            onClick={() => setAppMode('explore')}
            className={`px-2 py-1 text-xs rounded-md transition font-mono ${
              appMode === 'explore'
                ? 'bg-[#181B22] text-[#E8EAF0] font-semibold'
                : 'text-[#858B9A] hover:text-[#E8EAF0]'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => setAppMode('compare')}
            className={`px-2 py-1 text-xs rounded-md transition font-mono flex items-center gap-1 ${
              appMode === 'compare'
                ? 'bg-[#181B22] text-[#69A3FF] font-semibold'
                : 'text-[#858B9A] hover:text-[#E8EAF0]'
            }`}
          >
            <Layers className="w-3 h-3" />
            Compare
          </button>
        </div>

        {/* Reset Button */}
        <button
          onClick={resetLab}
          className="p-1.5 rounded-lg bg-[#181B22] hover:bg-[#202530] text-[#858B9A] hover:text-[#E8EAF0] border border-[#292C35] transition"
          title="Reset Geometry Lab"
          aria-label="Reset Lab"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Audio Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-1.5 rounded-lg border transition ${
            soundEnabled
              ? 'bg-[#181B22] text-[#69A3FF] border-[#69A3FF]/40'
              : 'bg-[#12141A] text-[#858B9A] hover:text-[#E8EAF0] border-[#292C35]'
          }`}
          title={soundEnabled ? 'Mute Audio' : 'Unmute Sound'}
          aria-label={soundEnabled ? 'Mute Audio' : 'Unmute Sound'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-[#69A3FF]" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

        {/* Math & STS Details Drawer Toggle */}
        <button
          onClick={() => setDetailsOpen(!detailsOpen)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition ${
            detailsOpen
              ? 'bg-[#181B22] text-[#69A3FF] border-[#69A3FF]/40'
              : 'bg-[#181B22] text-[#858B9A] hover:text-[#E8EAF0] border-[#292C35]'
          }`}
          title="Toggle Math & STS Details Drawer"
          aria-expanded={detailsOpen}
        >
          <Info className="w-4 h-4" />
          <span className="hidden sm:inline">Details</span>
        </button>
      </div>
    </header>
  );
};

