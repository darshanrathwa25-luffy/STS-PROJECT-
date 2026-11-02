import React from 'react';
import { useGeometryStore, GeometryKind } from '../../store/geometryStore';
import {
  Compass,
  Volume2,
  VolumeX,
  Layers,
  Columns,
  GraduationCap,
  Sparkles,
  Github,
} from 'lucide-react';

export const TopNavigation: React.FC = () => {
  const {
    geometry,
    setGeometry,
    mode,
    setMode,
    appSection,
    setAppSection,
    soundEnabled,
    setSoundEnabled,
  } = useGeometryStore();

  return (
    <header className="h-[58px] bg-[#12141A] border-b border-[#292C35] px-4 flex items-center justify-between z-20 select-none">
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => setAppSection('lab')}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#181B22] border border-[#292C35] text-[#69A3FF] cursor-pointer hover:border-[#69A3FF]/50 transition"
        >
          <Compass className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              onClick={() => setAppSection('lab')}
              className="font-bold text-sm tracking-wide text-[#E8EAF0] uppercase font-mono cursor-pointer hover:text-[#69A3FF] transition"
            >
              Curvature Lab
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#181B22] text-[#69A3FF] border border-[#69A3FF]/30">
              v2.0 STS
            </span>
          </div>
          <p className="text-[10px] text-[#858B9A] -mt-0.5 font-sans">
            Science, Technology & Society Geometry Laboratory
          </p>
        </div>
      </div>

      {/* Center: Lab Mode Tabs & STS Lens Trigger */}
      <div className="flex items-center gap-3">
        {/* Main Section Navigation */}
        <div className="flex bg-[#0D0F14] p-1 rounded-lg border border-[#292C35]">
          <button
            onClick={() => {
              setAppSection('lab');
              setMode('explore');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition ${
              appSection === 'lab' && mode === 'explore'
                ? 'bg-[#181B22] text-[#69A3FF] font-semibold border border-[#69A3FF]/30 shadow-sm'
                : 'text-[#858B9A] hover:text-[#E8EAF0]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Explore Mode</span>
          </button>

          <button
            onClick={() => {
              setAppSection('lab');
              setMode('compare');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition ${
              appSection === 'lab' && mode === 'compare'
                ? 'bg-[#181B22] text-[#69A3FF] font-semibold border border-[#69A3FF]/30 shadow-sm'
                : 'text-[#858B9A] hover:text-[#E8EAF0]'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Compare Mode</span>
          </button>

          <div className="w-[1px] h-4 bg-[#292C35] my-auto mx-1" />

          {/* STS LENS Button */}
          <button
            onClick={() => setAppSection('sts')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition ${
              appSection === 'sts'
                ? 'bg-[#69A3FF] text-[#090A0D] font-bold shadow-glow-accent'
                : 'text-[#FFD166] hover:bg-[#181B22]'
            }`}
            title="Open Science, Technology & Society Case Studies"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="font-semibold tracking-wide">STS LENS</span>
          </button>
        </div>

        {/* Quick Geometry Pills (visible when in 3D Lab) */}
        {appSection === 'lab' && (
          <div className="hidden lg:flex bg-[#0D0F14] p-1 rounded-lg border border-[#292C35]">
            {(['euclidean', 'spherical', 'hyperbolic'] as GeometryKind[]).map((kind) => {
              const active = geometry === kind;
              return (
                <button
                  key={kind}
                  onClick={() => setGeometry(kind)}
                  className={`px-2.5 py-1 text-xs font-mono capitalize rounded transition ${
                    active
                      ? 'bg-[#181B22] text-[#E8EAF0] font-semibold border border-[#292C35]'
                      : 'text-[#858B9A] hover:text-[#E8EAF0]'
                  }`}
                >
                  {kind}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Sound & External Links */}
      <div className="flex items-center gap-2">
        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition ${
            soundEnabled
              ? 'bg-[#181B22] text-[#69A3FF] border-[#69A3FF]/40'
              : 'bg-[#12141A] text-[#858B9A] hover:text-[#E8EAF0] border-[#292C35]'
          }`}
          title={soundEnabled ? 'Mute Procedural Audio' : 'Enable Procedural Audio'}
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

        {/* GitHub link */}
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
