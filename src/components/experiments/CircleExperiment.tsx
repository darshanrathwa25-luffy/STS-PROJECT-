import React, { useState, useMemo } from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { computeCircleMetrics } from '../../geometry-engine';
import { GuidedExperimentFrame, GuidedExperimentStage } from './GuidedExperimentFrame';
import { HelpCircle, Lightbulb, FlaskConical, Eye, BookOpen, CircleDot } from 'lucide-react';

export const CircleExperiment: React.FC = () => {
  const { geometry, circleRadius, setCircleRadius } = useGeometryStore();
  const [prediction, setPrediction] = useState<string | null>(null);

  const metrics = useMemo(() => {
    return computeCircleMetrics(geometry, circleRadius);
  }, [geometry, circleRadius]);

  const stages: GuidedExperimentStage[] = [
    {
      id: 'question',
      label: 'Question',
      icon: <HelpCircle className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-2 text-xs leading-relaxed">
          <div className="font-semibold text-[#E8EAF0]">Is Circumference Always 2πr?</div>
          <p className="text-[#858B9A]">
            Archimedes showed that in flat space, the ratio of a circle's circumference to its diameter is always the universal constant $\pi \approx 3.14159$.
          </p>
          <p className="text-[#858B9A]">
            Does this ratio remain true when drawing circles on a curved surface?
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
          <div className="font-semibold text-[#E8EAF0]">What Will Happen to the Ratio C / (2r)?</div>
          <div className="space-y-1.5">
            {[
              { id: 'equal', text: 'Ratio remains exactly π in all spaces.' },
              { id: 'less', text: 'Circumference will be LESS than 2πr (deficit).' },
              { id: 'greater', text: 'Circumference will be GREATER than 2πr (expansion).' },
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
      label: 'Radius',
      icon: <FlaskConical className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[#858B9A] flex items-center gap-1.5">
                <CircleDot className="w-3.5 h-3.5 text-[#69A3FF]" />
                Geodesic Radius (r)
              </span>
              <span className="font-mono font-bold text-[#69A3FF] bg-[#181B22] px-2 py-0.5 rounded border border-[#20232B]">
                r = {circleRadius.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0.3}
              max={geometry === 'spherical' ? 3.5 : 2.5}
              step={0.05}
              value={circleRadius}
              onChange={(e) => setCircleRadius(parseFloat(e.target.value))}
              className="w-full accent-[#69A3FF] h-1.5 bg-[#1F2229] rounded cursor-pointer"
            />
          </div>

          <div className="flex gap-1.5">
            {[0.5, 1.0, 1.5, 2.0].map((presetR) => (
              <button
                key={presetR}
                onClick={() => setCircleRadius(presetR)}
                className={`flex-1 py-1 text-[10px] font-mono rounded border transition ${
                  circleRadius === presetR
                    ? 'bg-[#69A3FF] text-[#090A0D] font-bold border-[#69A3FF]'
                    : 'bg-[#181B22] text-[#858B9A] hover:text-[#E8EAF0] border-[#20232B]'
                }`}
              >
                r={presetR}
              </button>
            ))}
          </div>

          <div className="p-2.5 rounded bg-[#12141A] border border-[#20232B] text-[11px] text-[#858B9A]">
            Notice how the geodesic circle ring resizes on the 3D manifold in real time.
          </div>
        </div>
      ),
    },
    {
      id: 'observe',
      label: 'Observe',
      icon: <Eye className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-2.5 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#12141A] p-2 rounded border border-[#20232B]">
              <div className="text-[10px] text-[#858B9A]">Curved Circumference (C)</div>
              <div className="font-mono text-base font-bold text-[#69A3FF]">
                {metrics.circumference.toFixed(2)}
              </div>
            </div>
            <div className="bg-[#12141A] p-2 rounded border border-[#20232B]">
              <div className="text-[10px] text-[#858B9A]">Flat Euclidean (2πr)</div>
              <div className="font-mono text-base font-bold text-[#858B9A]">
                {metrics.euclideanCircumference.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-[#12141A] p-2 rounded border border-[#20232B] space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#858B9A]">Divergence from Flat Space:</span>
              <span
                className={`font-mono font-bold ${
                  metrics.differenceRatio > 0.01
                    ? 'text-cyan-400'
                    : metrics.differenceRatio < -0.01
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {(metrics.differenceRatio * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#858B9A]">Geodesic Area:</span>
              <span className="font-mono text-[#E8EAF0]">{metrics.area.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#858B9A]">Ratio C / (2r):</span>
              <span className="font-mono text-[#69A3FF]">
                {(metrics.circumference / (2 * circleRadius)).toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'explain',
      label: 'Explain',
      icon: <BookOpen className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-2 text-xs leading-relaxed">
          <div className="font-semibold text-[#E8EAF0]">Curvature Dictates Perimeter Growth:</div>
          <p className="text-[11px] text-[#858B9A]">{metrics.explanation}</p>
          <div className="p-2 rounded bg-[#12141A] border border-[#20232B] text-[11px] text-[#858B9A]">
            <strong className="text-[#69A3FF]">Key Insight:</strong> In hyperbolic geometry ($K &lt; 0$), the exponential expansion of perimeter ($C = 2\pi\sinh r$) makes room for an infinity of diverging geodesics, explaining why there are infinitely many parallel lines!
          </div>
        </div>
      ),
    },
  ];

  return (
    <GuidedExperimentFrame
      title="Geodesic Circle Experiment"
      subtitle={`Investigating circumference C(r) and area A(r) across curvatures`}
      stages={stages}
    />
  );
};

