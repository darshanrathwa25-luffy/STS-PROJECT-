import React, { useState, useMemo } from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import {
  euclideanDistance,
  sphericalDistance,
  hyperbolicDistance,
  DEFAULT_SPHERE_RADIUS,
} from '../../geometry-engine';
import { GuidedExperimentFrame, GuidedExperimentStage } from './GuidedExperimentFrame';
import { HelpCircle, Lightbulb, FlaskConical, Eye, BookOpen, Compass, Route } from 'lucide-react';

export const ShortestPathExperiment: React.FC = () => {
  const { geometry, points } = useGeometryStore();
  const [prediction, setPrediction] = useState<string | null>(null);

  const pathData = useMemo(() => {
    if (points.length < 2) return null;

    let distance = 0;
    if (geometry === 'euclidean') {
      const p1 = points[0].nativeCoords as { x: number; y: number };
      const p2 = points[1].nativeCoords as { x: number; y: number };
      distance = euclideanDistance(p1, p2);
    } else if (geometry === 'spherical') {
      const p1 = points[0].position;
      const p2 = points[1].position;
      distance = sphericalDistance(p1, p2, DEFAULT_SPHERE_RADIUS);
    } else {
      const p1 = points[0].nativeCoords as { x: number; y: number };
      const p2 = points[1].nativeCoords as { x: number; y: number };
      distance = hyperbolicDistance(p1, p2);
    }

    // A perturbed non-geodesic path has length ~ 1.25x
    const perturbedLength = distance * 1.28;

    return {
      distance,
      perturbedLength,
      pt1Label: points[0].label || 'A',
      pt2Label: points[1].label || 'B',
    };
  }, [geometry, points]);

  const stages: GuidedExperimentStage[] = [
    {
      id: 'question',
      label: 'Question',
      icon: <HelpCircle className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-2 text-xs leading-relaxed">
          <div className="font-semibold text-[#E8EAF0]">Why Do Shortest Paths Look Curved?</div>
          <p className="text-[#858B9A]">
            When flight routes are drawn on a flat world map, or when geodesics are drawn in the Poincaré disk, they look curved.
          </p>
          <p className="text-[#858B9A]">
            Is the shortest path between two points inherently curved, or is it straight from the perspective of the surface itself?
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
          <div className="font-semibold text-[#E8EAF0]">Select Your Hypothesis:</div>
          <div className="space-y-1.5">
            {[
              { id: 'extrinsic', text: 'The path curves because the surface forces it to turn.' },
              { id: 'intrinsic', text: 'The path is intrinsically straight: an traveler never steers left or right.' },
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
      label: 'Inspect',
      icon: <FlaskConical className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-2.5 text-xs">
          {pathData ? (
            <div className="space-y-2 bg-[#12141A] p-2.5 rounded border border-[#20232B]">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#858B9A]">Start Point:</span>
                <span className="font-mono text-[#69A3FF] font-semibold">{pathData.pt1Label}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#858B9A]">Destination Point:</span>
                <span className="font-mono text-[#69A3FF] font-semibold">{pathData.pt2Label}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-[#20232B]">
                <span className="text-[#858B9A]">True Geodesic Distance (d):</span>
                <span className="font-mono text-[#E8EAF0] font-bold">{pathData.distance.toFixed(3)}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#858B9A]">Click on the surface to place at least two points.</div>
          )}

          <div className="p-2 rounded bg-[#181B22] border border-[#292C35] text-[11px] text-[#858B9A]">
            The line connecting points {pathData?.pt1Label || 'A'} and {pathData?.pt2Label || 'B'} represents the unique minimal metric path across the manifold.
          </div>
        </div>
      ),
    },
    {
      id: 'observe',
      label: 'Observe',
      icon: <Eye className="w-3.5 h-3.5" />,
      content: pathData ? (
        <div className="space-y-2.5 text-xs">
          <div className="bg-[#12141A] p-2.5 rounded border border-[#20232B] space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#858B9A]">Geodesic Path Length:</span>
              <span className="font-mono font-bold text-emerald-400">{pathData.distance.toFixed(3)} (Minimal)</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#858B9A]">Perturbed Non-Geodesic Path:</span>
              <span className="font-mono text-[#858B9A]">{pathData.perturbedLength.toFixed(3)} (+28%)</span>
            </div>
          </div>
          <div className="p-2 rounded bg-[#181B22] border border-[#292C35] text-[11px] text-[#858B9A]">
            Any deviation from the geodesic increases travel distance. The geodesic satisfies the variational Euler-Lagrange condition $\delta \int ds = 0$.
          </div>
        </div>
      ) : (
        <div className="text-xs text-[#858B9A]">Place two points to calculate path lengths.</div>
      ),
    },
    {
      id: 'explain',
      label: 'Explain',
      icon: <BookOpen className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-2 text-xs leading-relaxed">
          <div className="font-semibold text-[#E8EAF0]">Intrinsic vs Extrinsic Straightness:</div>
          <p className="text-[11px] text-[#858B9A]">
            A curve on a manifold has two curvatures:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#858B9A]">
            <li><strong className="text-[#69A3FF]">Intrinsic Geodesic Curvature (κ_g):</strong> Measures lateral turning along the surface. For all geodesics, <code className="text-[#69A3FF]">κ_g = 0</code>! A traveler walks perfectly straight ahead.</li>
            <li><strong className="text-[#858B9A]">Extrinsic Curvature (κ_n):</strong> Measures how the surface itself bends in 3D Euclidean space.</li>
          </ul>
          <div className="p-2 rounded bg-[#12141A] border border-[#20232B] text-[11px] text-[#858B9A]">
            <strong className="text-[#69A3FF]">STS Epistemology:</strong> The curvature we see on screen is an artifact of the coordinate chart. To a native 2D inhabitant, geodesics are straight lines.
          </div>
        </div>
      ),
    },
  ];

  return (
    <GuidedExperimentFrame
      title="Shortest Path Experiment"
      subtitle={`Understanding intrinsic geodesics vs extrinsic visual curvature`}
      stages={stages}
    />
  );
};

