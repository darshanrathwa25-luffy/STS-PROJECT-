import React, { useMemo, useEffect, useState } from 'react';
import { useGeometryStore, WorldKind } from '../../store/geometryStore';
import {
  euclideanTriangle,
  sphericalTriangle,
  saddleTriangle,
  constructTriangleFromSides,
  constructSaddleTriangleFromSides,
  DEFAULT_SPHERE_RADIUS,
} from '../../geometry-engine';
import { Sparkles, ArrowRight, CornerDownRight } from 'lucide-react';

export const TriangleHUD: React.FC = () => {
  const {
    world,
    setWorld,
    sides,
    flatTriangle,
    sphereTriangle,
    saddleTriangle: hTri,
  } = useGeometryStore();

  // Active world measurements
  const activeMeasurements = useMemo(() => {
    if (world === 'flat') {
      const tri = euclideanTriangle(flatTriangle.p1, flatTriangle.p2, flatTriangle.p3);
      return {
        sum: tri.angleSumDeg,
        angles: [
          (tri.alpha * 180) / Math.PI,
          (tri.beta * 180) / Math.PI,
          (tri.gamma * 180) / Math.PI,
        ],
        defectOrExcess: tri.angleSumDeg - 180,
      };
    } else if (world === 'sphere') {
      const tri = sphericalTriangle(sphereTriangle.p1, sphereTriangle.p2, sphereTriangle.p3, DEFAULT_SPHERE_RADIUS);
      return {
        sum: tri.angleSumDeg,
        angles: [
          (tri.alpha * 180) / Math.PI,
          (tri.beta * 180) / Math.PI,
          (tri.gamma * 180) / Math.PI,
        ],
        defectOrExcess: tri.angleSumDeg - 180,
      };
    } else {
      const tri = saddleTriangle(hTri.p1, hTri.p2, hTri.p3);
      return {
        sum: tri.angleSumDeg,
        angles: [
          (tri.alpha * 180) / Math.PI,
          (tri.beta * 180) / Math.PI,
          (tri.gamma * 180) / Math.PI,
        ],
        defectOrExcess: tri.angleSumDeg - 180,
      };
    }
  }, [world, flatTriangle, sphereTriangle, hTri]);

  // Smooth lerp for angle sum display (300ms feel)
  const [displaySum, setDisplaySum] = useState<number>(activeMeasurements.sum);

  useEffect(() => {
    let animId: number;
    const startVal = displaySum;
    const targetVal = activeMeasurements.sum;
    const startTime = performance.now();
    const duration = 240;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplaySum(startVal + (targetVal - startVal) * ease);

      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [activeMeasurements.sum]);

  // Three-Worlds Strip: evaluate current side lengths in all three worlds
  const stripData = useMemo(() => {
    const { a, b, c } = sides;

    // 1. Flat: always exactly 180°
    const flatSum = '180.0°';

    // 2. Sphere: construct triangle on sphere
    let sphereSum = 'N/A';
    const sTriConstructed = constructTriangleFromSides('spherical', a, b, c, DEFAULT_SPHERE_RADIUS);
    if (sTriConstructed) {
      const m = sphericalTriangle(
        sTriConstructed.a as any,
        sTriConstructed.b as any,
        sTriConstructed.c as any,
        DEFAULT_SPHERE_RADIUS
      );
      if (!m.degenerate) {
        sphereSum = `${m.angleSumDeg.toFixed(1)}°`;
      }
    }

    // 3. Hyperbolic (Saddle): construct triangle on saddle
    let hypSum = 'N/A';
    const hTriConstructed = constructSaddleTriangleFromSides(
      Math.min(a, 1.5),
      Math.min(b, 1.5),
      Math.min(c, 1.5)
    );
    if (hTriConstructed) {
      const m = saddleTriangle(hTriConstructed.a, hTriConstructed.b, hTriConstructed.c);
      if (!m.degenerate) {
        hypSum = `${m.angleSumDeg.toFixed(1)}°`;
      }
    }

    return [
      { id: 'flat' as WorldKind, label: 'Flat', sum: flatSum, sub: 'K = 0' },
      { id: 'sphere' as WorldKind, label: 'Sphere', sum: sphereSum, sub: 'K > 0' },
      { id: 'hyperbolic' as WorldKind, label: 'Hyperbolic', sum: hypSum, sub: 'K < 0' },
    ];
  }, [sides]);

  const isFlat = Math.abs(activeMeasurements.sum - 180) < 0.05;
  const isGreater = activeMeasurements.sum > 180 + 0.05;

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 select-none pointer-events-none w-full max-w-xl px-4">
      {/* Primary Angle Sum HUD Card */}
      <div className="bg-[#12141A]/95 backdrop-blur-md border border-[#292C35] rounded-2xl p-3 shadow-panel flex flex-col items-center pointer-events-auto transition-all duration-200">
        <div className="flex items-center gap-3">
          {/* Main Sum Display */}
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-[11px] text-[#858B9A] uppercase tracking-wider font-semibold">
              Angle Sum Σ =
            </span>
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isFlat
                  ? 'text-[#E8EAF0]'
                  : isGreater
                  ? 'text-[#FFD166]'
                  : 'text-[#06D6A0]'
              }`}
            >
              {displaySum.toFixed(1)}°
            </span>
          </div>

          {/* Excess / Defect Chip */}
          {!isFlat && (
            <div
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border flex items-center gap-1 ${
                isGreater
                  ? 'bg-[#FFD166]/15 text-[#FFD166] border-[#FFD166]/30'
                  : 'bg-[#06D6A0]/15 text-[#06D6A0] border-[#06D6A0]/30'
              }`}
            >
              <span>
                {isGreater
                  ? `+${activeMeasurements.defectOrExcess.toFixed(1)}° excess`
                  : `${activeMeasurements.defectOrExcess.toFixed(1)}° defect`}
              </span>
            </div>
          )}

          {isFlat && (
            <div className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#181B22] text-[#858B9A] border border-[#292C35]">
              Exact Invariant
            </div>
          )}
        </div>

        {/* Individual Angles breakdown */}
        <div className="flex items-center gap-4 mt-1 pt-1.5 border-t border-[#292C35]/60 text-xs font-mono text-[#858B9A]">
          <span>
            α ={' '}
            <strong className="text-[#E8EAF0]">{activeMeasurements.angles[0].toFixed(1)}°</strong>
          </span>
          <span>•</span>
          <span>
            β ={' '}
            <strong className="text-[#E8EAF0]">{activeMeasurements.angles[1].toFixed(1)}°</strong>
          </span>
          <span>•</span>
          <span>
            γ ={' '}
            <strong className="text-[#E8EAF0]">{activeMeasurements.angles[2].toFixed(1)}°</strong>
          </span>
        </div>
      </div>

      {/* Three-Worlds Comparison Strip */}
      <div className="flex items-center gap-1.5 bg-[#0D0F14]/90 backdrop-blur-md p-1 rounded-xl border border-[#292C35] pointer-events-auto text-xs font-mono">
        <span className="text-[10px] text-[#5A6070] px-2 uppercase font-semibold hidden sm:inline">
          For Current Sides:
        </span>
        {stripData.map((item) => {
          const isActive = world === item.id;
          const isPossible = item.sum !== 'N/A';

          return (
            <button
              key={item.id}
              onClick={() => isPossible && setWorld(item.id)}
              disabled={!isPossible}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#181B22] text-[#69A3FF] border border-[#69A3FF]/40 font-bold shadow-sm'
                  : isPossible
                  ? 'text-[#858B9A] hover:text-[#E8EAF0] hover:bg-[#181B22]/50'
                  : 'text-[#414552] cursor-not-allowed opacity-50'
              }`}
              title={
                isPossible
                  ? `Switch to ${item.label} world`
                  : `Side lengths cannot form a triangle in ${item.label} space`
              }
            >
              <span>{item.label}</span>
              <span className={`text-[10px] ${isActive ? 'text-[#FFD166]' : 'text-[#858B9A]'}`}>
                {item.sum}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
