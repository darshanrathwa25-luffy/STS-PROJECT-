import React, { useMemo } from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import {
  euclideanTriangle,
  sphericalTriangle,
  saddleTriangle,
} from '../../geometry-engine';
import {
  X,
  BookOpen,
  Calculator,
  Compass,
  Sparkles,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

export const DetailsDrawer: React.FC = () => {
  const {
    world,
    lab,
    detailsOpen,
    setDetailsOpen,
    flatTriangle: fTri,
    sphereTriangle: sTri,
    saddleTriangle: hTri,
    parallel,
    reflectionText,
    setReflectionText,
  } = useGeometryStore();

  // Compute live mathematical measurements depending on world
  const triangleData = useMemo(() => {
    if (lab !== 'triangle') return null;

    if (world === 'flat') {
      const tri = euclideanTriangle(fTri.p1, fTri.p2, fTri.p3);
      return {
        curvature: 'K = 0 (Constant Flat)',
        sides: [tri.a, tri.b, tri.c],
        anglesDeg: [
          (tri.alpha * 180) / Math.PI,
          (tri.beta * 180) / Math.PI,
          (tri.gamma * 180) / Math.PI,
        ],
        sumDeg: tri.angleSumDeg,
        diffLabel: 'Discrepancy (Sum - 180°)',
        diffValue: `${(tri.angleSumDeg - 180).toFixed(2)}°`,
        area: tri.area,
        gaussBonnetNote: '∫∫ K dA = 0 = Σ - π',
      };
    } else if (world === 'sphere') {
      const tri = sphericalTriangle(sTri.p1, sTri.p2, sTri.p3);
      return {
        curvature: 'K = +1.0 (Constant Positive)',
        sides: [tri.a, tri.b, tri.c],
        anglesDeg: [
          (tri.alpha * 180) / Math.PI,
          (tri.beta * 180) / Math.PI,
          (tri.gamma * 180) / Math.PI,
        ],
        sumDeg: tri.angleSumDeg,
        diffLabel: 'Spherical Excess E',
        diffValue: `+${(tri.angleSumDeg - 180).toFixed(2)}°`,
        area: tri.area,
        gaussBonnetNote: '∫∫ K dA = Area = Σ - π',
      };
    } else {
      const tri = saddleTriangle(hTri.p1, hTri.p2, hTri.p3);
      return {
        curvature: 'K(0,0) = -1.0 (Variable Negative)',
        sides: tri.sides,
        anglesDeg: [
          (tri.alpha * 180) / Math.PI,
          (tri.beta * 180) / Math.PI,
          (tri.gamma * 180) / Math.PI,
        ],
        sumDeg: tri.angleSumDeg,
        diffLabel: 'Hyperbolic Defect δ',
        diffValue: `-${tri.defectDeg.toFixed(2)}°`,
        area: tri.defectFromIntegral,
        gaussBonnetNote: '∫∫ K dA = -δ = Σ - π',
      };
    }
  }, [world, lab, fTri, sTri, hTri]);

  // Compute parallel line metrics
  const parallelData = useMemo(() => {
    if (lab !== 'parallel') return null;

    const d = parallel.h;
    const piDistRad = 2 * Math.atan(Math.exp(-d));
    const piDistDeg = (piDistRad * 180) / Math.PI;

    if (world === 'flat') {
      return {
        parallelCount: 'Exactly 1 Line',
        postulateStatus: "Euclid's 5th Postulate Holds",
        distance: d.toFixed(2),
        limitingAngle: '0° (Always Transverse)',
        classification: 'Euclidean Parallelism',
      };
    } else if (world === 'sphere') {
      return {
        parallelCount: '0 Lines (None)',
        postulateStatus: 'Riemannian / Elliptic',
        distance: d.toFixed(2),
        limitingAngle: 'N/A (All Great Circles Meet)',
        classification: 'Antipodal Intersections',
      };
    } else {
      return {
        parallelCount: '∞ Infinitely Many (Fan)',
        postulateStatus: 'Lobachevskian / Hyperbolic',
        distance: d.toFixed(2),
        limitingAngle: `Π(d) = ${piDistDeg.toFixed(1)}°`,
        classification: 'Ultraparallels & Limiting Rays',
      };
    }
  }, [world, lab, parallel]);

  if (!detailsOpen) return null;

  return (
    <div
      role="complementary"
      aria-label="Mathematical and STS Details"
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-[380px] bg-[#12141A]/95 backdrop-blur-xl border-l border-[#292C35] shadow-2xl flex flex-col justify-between text-[#E8EAF0] p-5 overflow-y-auto animate-slideInRight select-none"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[#292C35]">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#69A3FF]" />
            <h2 className="text-sm font-bold font-mono tracking-wide uppercase">
              Lab Readouts & STS
            </h2>
          </div>
          <button
            onClick={() => setDetailsOpen(false)}
            className="p-1 rounded-lg text-[#858B9A] hover:text-[#E8EAF0] hover:bg-[#181B22] transition"
            aria-label="Close details panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Space Curvature Badge */}
        <div className="mt-4 p-3 rounded-xl bg-[#0D0F14] border border-[#292C35] space-y-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#858B9A]">Active Geometry</span>
            <span className="font-semibold text-[#69A3FF] capitalize">{world}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#858B9A]">Gaussian Curvature</span>
            <span className="text-[#FFD166]">{triangleData?.curvature || (world === 'flat' ? 'K = 0' : world === 'sphere' ? 'K > 0' : 'K < 0')}</span>
          </div>
        </div>

        {/* Triangle Lab Real-Time Measurements */}
        {lab === 'triangle' && triangleData && (
          <div className="mt-4 space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#858B9A] font-semibold">
              Differential Measurements
            </div>

            <div className="grid grid-cols-3 gap-2 bg-[#0D0F14] p-2.5 rounded-xl border border-[#292C35] text-center font-mono">
              <div>
                <span className="text-[10px] text-[#858B9A] block">Angle α</span>
                <span className="text-xs font-semibold text-[#69A3FF]">
                  {triangleData.anglesDeg[0].toFixed(1)}°
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#858B9A] block">Angle β</span>
                <span className="text-xs font-semibold text-[#69A3FF]">
                  {triangleData.anglesDeg[1].toFixed(1)}°
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#858B9A] block">Angle γ</span>
                <span className="text-xs font-semibold text-[#69A3FF]">
                  {triangleData.anglesDeg[2].toFixed(1)}°
                </span>
              </div>
            </div>

            {/* Sum & Defect/Excess Readout */}
            <div className="p-3 rounded-xl bg-[#181B22] border border-[#292C35] space-y-2 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#C5CAD4]">Sum Σ = α + β + γ</span>
                <span className="text-sm font-bold text-[#FFD166]">
                  {triangleData.sumDeg.toFixed(2)}°
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#858B9A]">{triangleData.diffLabel}</span>
                <span
                  className={`font-semibold ${
                    world === 'flat'
                      ? 'text-[#858B9A]'
                      : world === 'sphere'
                      ? 'text-[#06D6A0]'
                      : 'text-[#EF476F]'
                  }`}
                >
                  {triangleData.diffValue}
                </span>
              </div>
              <div className="pt-2 border-t border-[#292C35]/60 text-[10px] text-[#858B9A] flex items-center justify-between">
                <span>Gauss-Bonnet Formula</span>
                <span className="text-[#E8EAF0] font-sans">{triangleData.gaussBonnetNote}</span>
              </div>
            </div>
          </div>
        )}

        {/* Parallel Lines Readouts */}
        {lab === 'parallel' && parallelData && (
          <div className="mt-4 space-y-3 font-mono">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#858B9A] font-semibold">
              Parallel Postulate Metrics
            </div>

            <div className="p-3 rounded-xl bg-[#0D0F14] border border-[#292C35] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#858B9A]">Distance d(P, L)</span>
                <span className="text-[#E8EAF0]">{parallelData.distance}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#858B9A]">Number of Parallels</span>
                <span className="font-bold text-[#06D6A0]">{parallelData.parallelCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#858B9A]">Angle of Parallelism</span>
                <span className="text-[#FFD166]">{parallelData.limitingAngle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#858B9A]">Classification</span>
                <span className="text-[#69A3FF]">{parallelData.classification}</span>
              </div>
            </div>
          </div>
        )}

        {/* STS & Historical Context */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#858B9A] font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-[#69A3FF]" />
            <span>STS Perspective</span>
          </div>

          <div className="p-3 rounded-xl bg-[#0D0F14] border border-[#292C35] text-xs text-[#858B9A] leading-relaxed space-y-2 font-sans">
            <p>
              For over two millennia, mathematicians considered Euclidean geometry the only conceivable model of physical space. The failure to prove Euclid’s 5th Postulate revealed that mathematics develops models—not absolute physical dogmas.
            </p>
            <p className="text-[11px] text-[#69A3FF]">
              Bolyai & Lobachevsky (1820s) liberated geometry, paving the mathematical road for Riemann and Einstein's General Relativity.
            </p>
          </div>
        </div>
      </div>

      {/* Student Reflection Input */}
      <div className="pt-4 border-t border-[#292C35] space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-[#C5CAD4] font-medium">
          <MessageSquare className="w-3.5 h-3.5 text-[#06D6A0]" />
          <span>Lab Notes & Observations</span>
        </div>
        <textarea
          value={reflectionText}
          onChange={(e) => setReflectionText(e.target.value)}
          placeholder="Record what surprised you during this experiment..."
          className="w-full h-20 bg-[#0D0F14] border border-[#292C35] rounded-xl p-2.5 text-xs text-[#E8EAF0] placeholder-[#5A6070] focus:outline-none focus:border-[#69A3FF] resize-none font-sans"
        />
      </div>
    </div>
  );
};

