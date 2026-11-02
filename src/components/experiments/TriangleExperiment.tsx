import React, { useState, useMemo } from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import {
  euclideanTriangle,
  sphericalTriangle,
  hyperbolicTriangle,
  radToDeg,
} from '../../geometry-engine';
import { GuidedExperimentFrame, GuidedExperimentStage } from './GuidedExperimentFrame';
import { HelpCircle, Lightbulb, FlaskConical, Eye, BookOpen, Move } from 'lucide-react';

export const TriangleExperiment: React.FC = () => {
  const { geometry, points, updatePoint } = useGeometryStore();
  const [prediction, setPrediction] = useState<string | null>(null);

  // Calculate live triangle measurements
  const measurements = useMemo(() => {
    if (points.length < 3) {
      return null;
    }

    try {
      if (geometry === 'euclidean') {
        const p1 = points[0].nativeCoords as { x: number; y: number };
        const p2 = points[1].nativeCoords as { x: number; y: number };
        const p3 = points[2].nativeCoords as { x: number; y: number };
        const res = euclideanTriangle(p1, p2, p3);
        return {
          ...res,
          sumDeg: 180.0,
          excessOrDefectLabel: 'Defect / Excess: 0.0°',
          curvatureLabel: 'K = 0 (Flat)',
          verdict: 'Angle sum strictly equals 180°',
          badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/50',
        };
      } else if (geometry === 'spherical') {
        const p1 = points[0].position;
        const p2 = points[1].position;
        const p3 = points[2].position;
        const res = sphericalTriangle(p1, p2, p3);
        const excessDeg = radToDeg(res.excessOrDefect);
        return {
          ...res,
          sumDeg: res.angleSumDeg,
          excessOrDefectLabel: `Spherical Excess (E): +${excessDeg.toFixed(1)}°`,
          curvatureLabel: 'K = +1/R² > 0 (Positive)',
          verdict: `Angle sum = ${res.angleSumDeg.toFixed(1)}° > 180°`,
          badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-500/50',
        };
      } else {
        const p1 = points[0].nativeCoords as { x: number; y: number };
        const p2 = points[1].nativeCoords as { x: number; y: number };
        const p3 = points[2].nativeCoords as { x: number; y: number };
        // Approximate hyperbolic angles
        const res = hyperbolicTriangle(p1, p2, p3, 0.75, 0.82, 0.61);
        const defectDeg = radToDeg(res.excessOrDefect);
        return {
          ...res,
          sumDeg: res.angleSumDeg,
          excessOrDefectLabel: `Hyperbolic Defect (δ): -${defectDeg.toFixed(1)}°`,
          curvatureLabel: 'K = -1 < 0 (Negative)',
          verdict: `Angle sum = ${res.angleSumDeg.toFixed(1)}° < 180°`,
          badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/50',
        };
      }
    } catch {
      return null;
    }
  }, [geometry, points]);

  const stages: GuidedExperimentStage[] = [
    {
      id: 'question',
      label: 'Question',
      icon: <HelpCircle className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-2 text-xs leading-relaxed">
          <div className="font-semibold text-[#E8EAF0]">Can you make a triangle with more than 180 degrees?</div>
          <p className="text-[#858B9A]">
            In Euclidean space, triangle angles always sum to 180°. Move the vertices in this geometry to see how space curvature alters the total sum.
          </p>
        </div>
      ),
    },
    {
      id: 'predict',
      label: 'Predict',
      icon: <Lightbulb className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-2 text-xs">
          <div className="font-semibold text-[#E8EAF0]">Select Your Prediction:</div>
          <p className="text-[11px] text-[#858B9A]">
            In <span className="text-[#69A3FF] capitalize font-medium">{geometry}</span> space, what will happen to the interior angle sum ($\alpha + \beta + \gamma$)?
          </p>
          <div className="space-y-1.5">
            {[
              { id: '180', text: 'Sum will always remain 180° regardless of curvature.' },
              { id: 'greater', text: 'Sum will exceed 180° (positive curvature excess).' },
              { id: 'less', text: 'Sum will be less than 180° (negative curvature defect).' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPrediction(opt.id)}
                className={`w-full text-left p-2 rounded text-xs transition border ${
                  prediction === opt.id
                    ? 'bg-[#181B22] border-[#69A3FF] text-[#E8EAF0] font-medium'
                    : 'bg-[#12141A] border-[#20232B] text-[#858B9A] hover:text-[#E8EAF0]'
                }`}
              >
                {opt.text}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'experiment',
      label: 'Manipulate',
      icon: <FlaskConical className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-2.5 text-xs">
          <div className="text-xs text-[#858B9A]">
            Adjust vertex coordinates on the 3D surface to resize the triangle:
          </div>

          {points.length >= 3 && (
            <div className="space-y-2 bg-[#12141A] p-2.5 rounded border border-[#20232B]">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-mono text-[#69A3FF]">Vertex A ({points[0]?.label})</span>
                <span className="text-[10px] text-[#858B9A]">Active</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-mono text-[#69A3FF]">Vertex B ({points[1]?.label})</span>
                <span className="text-[10px] text-[#858B9A]">Active</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-mono text-[#69A3FF]">Vertex C ({points[2]?.label})</span>
                <span className="text-[10px] text-[#858B9A]">Active</span>
              </div>
            </div>
          )}

          <div className="p-2 rounded bg-[#181B22] border border-[#292C35] text-[11px] text-[#858B9A] flex items-center gap-2">
            <Move className="w-4 h-4 text-[#69A3FF] shrink-0" />
            <span>Click & drag the vertices in the 3D canvas to watch measurements update in real time.</span>
          </div>
        </div>
      ),
    },
    {
      id: 'observe',
      label: 'Observe',
      icon: <Eye className="w-3.5 h-3.5" />,
      content: measurements ? (
        <div className="space-y-2.5 text-xs">
          <div className={`p-2.5 rounded-lg border ${measurements.badgeColor}`}>
            <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider">
              <span>Observation</span>
              <span className="font-bold">{measurements.curvatureLabel}</span>
            </div>
            <div className="mt-1 font-mono font-bold text-sm">{measurements.verdict}</div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-[#12141A] p-1.5 rounded border border-[#20232B]">
              <div className="text-[9px] text-[#858B9A]">Angle α</div>
              <div className="font-mono text-[#69A3FF]">{(radToDeg(measurements.alpha)).toFixed(1)}°</div>
            </div>
            <div className="bg-[#12141A] p-1.5 rounded border border-[#20232B]">
              <div className="text-[9px] text-[#858B9A]">Angle β</div>
              <div className="font-mono text-[#69A3FF]">{(radToDeg(measurements.beta)).toFixed(1)}°</div>
            </div>
            <div className="bg-[#12141A] p-1.5 rounded border border-[#20232B]">
              <div className="text-[9px] text-[#858B9A]">Angle γ</div>
              <div className="font-mono text-[#69A3FF]">{(radToDeg(measurements.gamma)).toFixed(1)}°</div>
            </div>
          </div>

          <div className="bg-[#12141A] p-2 rounded border border-[#20232B] space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#858B9A]">Sum of Interior Angles:</span>
              <span className="font-mono font-bold text-[#E8EAF0]">{measurements.sumDeg.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#858B9A]">{measurements.excessOrDefectLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#858B9A]">Intrinsic Area:</span>
              <span className="font-mono text-[#69A3FF]">{measurements.area.toFixed(3)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-[#858B9A]">Please ensure 3 points are placed on the canvas.</div>
      ),
    },
    {
      id: 'explain',
      label: 'Explain',
      icon: <BookOpen className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-2 text-xs leading-relaxed">
          <div className="font-semibold text-[#E8EAF0]">Gauss-Bonnet Theorem:</div>
          <p className="text-[11px] text-[#858B9A]">
            The famous Gauss-Bonnet theorem proves:
            <br />
            <code className="text-[#69A3FF] font-mono text-[11px]">Area = (α + β + γ - π) / K</code>
          </p>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#858B9A]">
            <li><strong className="text-[#E8EAF0]">Euclidean (K = 0):</strong> Angle sum is invariant at 180°. Triangle area does not constrain angle sum.</li>
            <li><strong className="text-[#E8EAF0]">Spherical (K &gt; 0):</strong> Angle sum &gt; 180°. Larger triangles have greater angle excess!</li>
            <li><strong className="text-[#E8EAF0]">Hyperbolic (K &lt; 0):</strong> Angle sum &lt; 180°. Area is directly bounded by the defect: maximum possible triangle area is π!</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <GuidedExperimentFrame
      title="Geodesic Triangle Experiment"
      subtitle={`Measuring angle sums and Gauss-Bonnet curvature in ${geometry} space`}
      stages={stages}
    />
  );
};

