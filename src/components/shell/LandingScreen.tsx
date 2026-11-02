import React, { useState } from 'react';
import { useGeometryStore, WorldKind, LabKind } from '../../store/geometryStore';
import {
  Compass,
  ArrowRight,
  Play,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';

export const LandingScreen: React.FC = () => {
  const { setIsLanding, setWorld, setLab } = useGeometryStore();
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);

  const startWith = (world: WorldKind, lab: LabKind) => {
    setWorld(world);
    setLab(lab);
    setIsLanding(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#090A0D] text-[#E8EAF0] flex flex-col justify-between p-6 sm:p-10 select-none animate-fadeIn">
      {/* Header */}
      <header className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#181B22] border border-[#292C35] text-[#69A3FF]">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-base tracking-wider text-[#E8EAF0] uppercase font-mono">
              Curvature Lab
            </span>
            <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded bg-[#181B22] text-[#69A3FF] border border-[#69A3FF]/30">
              STS Project
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowVideoModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181B22] hover:bg-[#202530] text-xs font-mono text-[#858B9A] hover:text-[#E8EAF0] border border-[#292C35] transition"
          >
            <Play className="w-3.5 h-3.5 text-[#69A3FF]" />
            <span>STS Video</span>
          </button>
          <a
            href="https://github.com/darshanrathwa25-luffy/STS-PROJECT-"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-xs text-[#858B9A] hover:text-[#E8EAF0] font-mono"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-4xl mx-auto w-full my-auto py-8 text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181B22] border border-[#292C35] text-xs text-[#69A3FF] font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Non-Euclidean Geometry Playground</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#E8EAF0] leading-[1.15]">
            Add up the angles of a triangle.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#69A3FF] via-[#A8C7FA] to-[#06D6A0]">
              Always 180°? Let's find out.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#858B9A] leading-relaxed font-sans">
            For 2,000 years, geometry assumed Euclid's 5th Postulate was universal truth.
            Manipulate triangles and parallel lines across three different spatial curvatures to discover the reality of space yourself.
          </p>
        </div>

        {/* Enter CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setIsLanding(false)}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#69A3FF] hover:bg-[#528FE8] text-[#090A0D] font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#69A3FF]/20 transition transform hover:-translate-y-0.5"
          >
            <span>Enter Playground</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowVideoModal(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#181B22] hover:bg-[#202530] text-[#E8EAF0] border border-[#292C35] font-semibold text-sm flex items-center justify-center gap-2 transition"
          >
            <Play className="w-4 h-4 text-[#69A3FF]" />
            <span>Watch Explanatory Video</span>
          </button>
        </div>

        {/* 3 Geometry Worlds Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
          {/* Flat */}
          <div
            onClick={() => startWith('flat', 'triangle')}
            className="p-5 rounded-2xl bg-[#12141A]/90 hover:bg-[#181B22] border border-[#292C35] hover:border-[#69A3FF]/40 cursor-pointer transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-[#E8EAF0] group-hover:text-[#69A3FF]">
                Euclidean Plane
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#090A0D] text-[#858B9A]">
                K = 0
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-[#E8EAF0] mb-1">
              Σ = 180°
            </div>
            <p className="text-xs text-[#858B9A] leading-relaxed">
              Angles always sum to 180°. Exactly one parallel line exists through any external point.
            </p>
          </div>

          {/* Sphere */}
          <div
            onClick={() => startWith('sphere', 'triangle')}
            className="p-5 rounded-2xl bg-[#12141A]/90 hover:bg-[#181B22] border border-[#292C35] hover:border-[#06D6A0]/40 cursor-pointer transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-[#E8EAF0] group-hover:text-[#06D6A0]">
                Spherical Surface
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#090A0D] text-[#06D6A0]">
                K &gt; 0
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-[#06D6A0] mb-1">
              Σ &gt; 180°
            </div>
            <p className="text-xs text-[#858B9A] leading-relaxed">
              Angles sum to more than 180° by spherical excess. All straight lines (great circles) intersect.
            </p>
          </div>

          {/* Hyperbolic */}
          <div
            onClick={() => startWith('hyperbolic', 'triangle')}
            className="p-5 rounded-2xl bg-[#12141A]/90 hover:bg-[#181B22] border border-[#292C35] hover:border-[#FFD166]/40 cursor-pointer transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-[#E8EAF0] group-hover:text-[#FFD166]">
                Hyperbolic Saddle
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#090A0D] text-[#FFD166]">
                K &lt; 0
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-[#FFD166] mb-1">
              Σ &lt; 180°
            </div>
            <p className="text-xs text-[#858B9A] leading-relaxed">
              Angles sum to less than 180° by hyperbolic defect. Infinitely many ultraparallel lines miss L.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full pt-4 border-t border-[#292C35]/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#5A6070] font-mono gap-2">
        <span>Science, Technology & Society (STS) Educational Interactive</span>
        <span>"Don't explain everything. Let students discover it."</span>
      </footer>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#12141A] border border-[#292C35] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#292C35]">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-[#69A3FF]" />
                <h3 className="text-sm font-bold font-mono text-[#E8EAF0]">
                  STS Explanatory Video
                </h3>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-1 rounded-lg text-[#858B9A] hover:text-[#E8EAF0] hover:bg-[#181B22]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-[#0D0F14] rounded-xl border border-[#292C35] flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#181B22] border border-[#69A3FF]/30 text-[#69A3FF] flex items-center justify-center">
                <Play className="w-6 h-6 ml-0.5" />
              </div>
              <p className="text-sm font-semibold text-[#E8EAF0]">
                Non-Euclidean Geometry & The Nature of Space
              </p>
              <p className="text-xs text-[#858B9A] max-w-md">
                This project accompanies the STS lecture and video presentation investigating how mathematical models shape our understanding of physical space.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowVideoModal(false)}
                className="px-4 py-2 rounded-lg bg-[#69A3FF] text-[#090A0D] text-xs font-bold font-mono"
              >
                Continue to Lab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

