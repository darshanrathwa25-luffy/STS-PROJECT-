import React from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { VALID_PATTERNS } from '../../geometry-engine';
import { Sparkles, Eye, RotateCcw, Check, Info, Grid } from 'lucide-react';

export const TessellationExperiment: React.FC = () => {
  const {
    tilingP,
    tilingQ,
    selectedTileId,
    showTileOutlines,
    showTileFill,
    setTilingPattern,
    setSelectedTileId,
    setShowTileOutlines,
    resetCamera,
  } = useGeometryStore();

  // Theoretical hyperbolic area of each tile: Area = (p - 2 - 2p/q) * pi
  const tileArea = (tilingP - 2 - (2 * tilingP) / tilingQ) * Math.PI;
  const vertexAngleDeg = (360 / tilingQ).toFixed(1);

  return (
    <div className="space-y-3.5 text-xs text-[#E8EAF0]">
      {/* Central Discovery Prompt */}
      <div className="bg-[#181B22] p-3 rounded-lg border border-[#69A3FF]/30">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#69A3FF] font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Discovery</span>
        </div>
        <p className="text-sm font-semibold text-[#E8EAF0] mt-1 leading-snug">
          "Why do the tiles look smaller as you move outward?"
        </p>
        <p className="text-[11px] text-[#858B9A] mt-1 italic">
          They look smaller, but are they?
        </p>
      </div>

      {/* Pattern Presets */}
      <div>
        <label className="text-[10px] font-mono uppercase tracking-wider text-[#858B9A] block mb-1.5 font-semibold">
          Regular Hyperbolic Tilings &#123;p, q&#125;
        </label>
        <div className="space-y-1.5">
          {VALID_PATTERNS.map((pat) => {
            const isSelected = tilingP === pat.p && tilingQ === pat.q;
            return (
              <button
                key={`${pat.p}-${pat.q}`}
                onClick={() => setTilingPattern(pat.p, pat.q)}
                className={`w-full text-left p-2.5 rounded-lg border transition ${
                  isSelected
                    ? 'bg-[#181B22] border-[#69A3FF] text-[#E8EAF0] shadow-sm'
                    : 'bg-[#12141A] border-[#20232B] text-[#858B9A] hover:text-[#E8EAF0] hover:bg-[#181B22]/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-semibold text-xs text-[#E8EAF0]">{pat.name}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#69A3FF]" />}
                </div>
                <div className="text-[10px] text-[#858B9A] mt-0.5">{pat.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Tile Information & Discovery Insight */}
      <div className="bg-[#12141A] p-3 rounded-lg border border-[#20232B] space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#858B9A]">Tile Status</span>
          <span className="font-mono text-[11px] text-[#69A3FF]">
            {selectedTileId ? `Selected (${selectedTileId})` : 'Click any tile on disk'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-[#0D0F14] p-2 rounded border border-[#20232B]">
            <div className="text-[10px] text-[#858B9A]">Intrinsic Area (Exact)</div>
            <div className="font-mono font-bold text-[#E8EAF0]">{tileArea.toFixed(3)}</div>
          </div>
          <div className="bg-[#0D0F14] p-2 rounded border border-[#20232B]">
            <div className="text-[10px] text-[#858B9A]">Vertex Angle (2π/q)</div>
            <div className="font-mono font-bold text-[#E8EAF0]">{vertexAngleDeg}°</div>
          </div>
        </div>

        <div className="p-2 rounded bg-[#0D0F14] border border-[#20232B] text-[11px] text-[#858B9A] leading-relaxed flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[#69A3FF] shrink-0 mt-0.5" />
          <span>
            Every single tile in this infinite pattern has the <strong className="text-[#E8EAF0]">exact same hyperbolic size</strong>. The visual shrinkage is purely an artifact of the conformal projection compressing infinite space into a finite circular boundary.
          </span>
        </div>
      </div>

      {/* View Options */}
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#12141A] border border-[#20232B]">
        <span className="text-xs text-[#858B9A]">Geodesic Outlines</span>
        <button
          onClick={() => setShowTileOutlines(!showTileOutlines)}
          className={`px-2.5 py-1 text-xs rounded transition ${
            showTileOutlines ? 'bg-[#69A3FF] text-[#090A0D] font-bold' : 'bg-[#181B22] text-[#858B9A]'
          }`}
        >
          {showTileOutlines ? 'Shown' : 'Hidden'}
        </button>
      </div>

      {/* Reset Camera button */}
      <button
        onClick={resetCamera}
        className="w-full py-2 bg-[#181B22] hover:bg-[#202530] text-[#E8EAF0] rounded-lg border border-[#292C35] flex items-center justify-center gap-1.5 font-medium transition text-xs"
      >
        <RotateCcw className="w-3.5 h-3.5 text-[#69A3FF]" />
        <span>Reset Poincaré Disk View</span>
      </button>
    </div>
  );
};
