import React, { useState, useMemo } from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import {
  euclideanPointToLineDistance,
  intersectEuclideanLines,
  sphericalDistance,
  intersectGreatCircles,
  DEFAULT_SPHERE_RADIUS,
  hyperbolicDistance,
  computeGeodesicThroughPointAndAngle,
  computeGeodesicThroughPoints,
  intersectHyperbolicGeodesics,
  angleOfParallelism,
  radToDeg,
  degToRad,
} from '../../geometry-engine';
import { GuidedExperimentFrame, GuidedExperimentStage } from './GuidedExperimentFrame';
import { RotateCcw, Split, CheckCircle2, HelpCircle, Lightbulb, FlaskConical, Eye, BookOpen } from 'lucide-react';

export const ParallelLinesExperiment: React.FC = () => {
  const {
    geometry,
    setGeometry,
    parallelExperiment,
    setCandidateAngle,
    setShowFan,
  } = useGeometryStore();

  const { candidateAngleDeg, showFan } = parallelExperiment;
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);

  // Live analytical evaluation
  const analysis = useMemo(() => {
    const angleRad = degToRad(candidateAngleDeg);

    if (geometry === 'euclidean') {
      const p1 = { x: 0, y: 0 };
      const v1 = { x: 1, y: 0 };
      const P = { x: 0, y: 2 };
      const vCandidate = { x: Math.cos(angleRad), y: Math.sin(angleRad) };

      const dist = euclideanPointToLineDistance(P, { x: -10, y: 0 }, { x: 10, y: 0 });
      const intersection = intersectEuclideanLines(p1, v1, P, vCandidate);
      const isParallel = intersection.type === 'none';

      return {
        dist: dist.toFixed(2),
        distLabel: 'd = 2.00',
        angleDeg: candidateAngleDeg.toFixed(1),
        classification: isParallel ? 'PARALLEL' : 'INTERSECTING',
        badgeColor: isParallel
          ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/50'
          : 'text-rose-400 bg-rose-950/60 border-rose-500/50',
        summary: isParallel
          ? 'Direction collinear with L (angle = 0°). Geodesic never intersects L.'
          : `Intersects line L at x = ${(intersection.points[0] as { x: number; y: number })?.x.toFixed(2)}.`,
        parallelCount: 'Exactly 1 parallel line exists',
        axiomText: 'Euclid\'s 5th Postulate holds: Through external point P, there is exactly one line parallel to L.',
        correctPrediction: 'one',
      };
    } else if (geometry === 'spherical') {
      const R = DEFAULT_SPHERE_RADIUS;
      const nEquator = { x: 0, y: 1, z: 0 };
      const latP = degToRad(35);
      const P = {
        x: 0,
        y: R * Math.sin(latP),
        z: R * Math.cos(latP),
      };

      const tEast = { x: 1, y: 0, z: 0 };
      const tNorth = { x: 0, y: Math.cos(latP), z: -Math.sin(latP) };

      const candidateTangent = {
        x: tEast.x * Math.cos(angleRad) + tNorth.x * Math.sin(angleRad),
        y: tEast.y * Math.cos(angleRad) + tNorth.y * Math.sin(angleRad),
        z: tEast.z * Math.cos(angleRad) + tNorth.z * Math.sin(angleRad),
      };

      const nCandidate = {
        x: P.y * candidateTangent.z - P.z * candidateTangent.y,
        y: P.z * candidateTangent.x - P.x * candidateTangent.z,
        z: P.x * candidateTangent.y - P.y * candidateTangent.x,
      };

      const intersection = intersectGreatCircles(nEquator, nCandidate, R);
      const dist = sphericalDistance(P, { x: 0, y: 0, z: R }, R);

      return {
        dist: dist.toFixed(2),
        distLabel: `d = ${dist.toFixed(2)} (lat 35°)`,
        angleDeg: candidateAngleDeg.toFixed(1),
        classification: 'INTERSECTING (ANTIPODAL PAIR)',
        badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-500/50',
        summary: `Meets equator great circle at 2 antipodal points. Dihedral angle: ${(
          radToDeg(intersection.angle || 0)
        ).toFixed(1)}°.`,
        parallelCount: 'Zero parallel lines exist',
        axiomText: 'Elliptic Axiom: All distinct great circles intersect. Parallel lines do not exist on a sphere.',
        correctPrediction: 'zero',
      };
    } else {
      const refLine = computeGeodesicThroughPoints({ x: -0.8, y: 0 }, { x: 0.8, y: 0 });
      const P = { x: 0, y: 0.45 };
      const hypDist = hyperbolicDistance({ x: 0, y: 0 }, P);
      const piAngle = angleOfParallelism(hypDist);
      const piAngleDeg = radToDeg(piAngle);
      const limitThetaDeg = 90 - piAngleDeg;

      const candidateGeo = computeGeodesicThroughPointAndAngle(P, angleRad);
      const intersection = intersectHyperbolicGeodesics(refLine, candidateGeo);

      let classification = 'ULTRAPARALLEL';
      let badgeColor = 'text-cyan-400 bg-cyan-950/60 border-cyan-500/50';

      if (
        intersection.type === 'limiting_parallel' ||
        Math.abs(Math.abs(candidateAngleDeg) - limitThetaDeg) < 1.0
      ) {
        classification = 'LIMITING PARALLEL';
        badgeColor = 'text-amber-300 bg-amber-950/70 border-amber-400/60';
      } else if (intersection.type === 'unique') {
        classification = 'INTERSECTING';
        badgeColor = 'text-rose-400 bg-rose-950/60 border-rose-500/50';
      }

      return {
        dist: hypDist.toFixed(3),
        distLabel: `d = ${hypDist.toFixed(2)}`,
        angleDeg: candidateAngleDeg.toFixed(1),
        limitAngleDeg: limitThetaDeg.toFixed(1),
        piAngleDeg: piAngleDeg.toFixed(1),
        classification,
        badgeColor,
        summary:
          classification === 'LIMITING PARALLEL'
            ? `Critical boundary: meets L at infinity on ideal boundary |z|=1. Angle of parallelism Π(d) = ${piAngleDeg.toFixed(1)}°.`
            : classification === 'ULTRAPARALLEL'
            ? `Ultraparallel: lines diverge toward infinity with no intersection. Infinitely many such lines exist!`
            : `Intersects reference geodesic L inside the Poincaré disk.`,
        parallelCount: 'Infinitely many non-intersecting lines',
        axiomText: 'Lobachevskian Axiom: Through P, infinitely many ultraparallels exist, bounded by two limiting parallels.',
        correctPrediction: 'infinite',
      };
    }
  }, [geometry, candidateAngleDeg]);

  // Build the 5 pedagogical stages
  const stages: GuidedExperimentStage[] = [
    {
      id: 'question',
      label: 'Question',
      icon: <HelpCircle className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-2 text-xs leading-relaxed">
          <div className="font-semibold text-[#E8EAF0]">Can you draw a line that never meets this one?</div>
          <p className="text-[#858B9A]">
            Given reference line <span className="text-[#E8EAF0] font-mono font-bold">L</span> and point <span className="text-[#69A3FF] font-mono font-bold">P</span>, rotate the candidate line to test whether parallel lines exist in this geometry.
          </p>
          <div className="p-2 rounded bg-[#12141A] border border-[#20232B] text-[11px] text-[#858B9A]">
            Use the slider below or drag in the 3D canvas to rotate through angles.
          </div>
        </div>
      ),
    },
    {
      id: 'predict',
      label: 'Predict',
      icon: <Lightbulb className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-2.5 text-xs">
          <div className="font-semibold text-[#E8EAF0]">Formulate Your Hypothesis:</div>
          <p className="text-[11px] text-[#858B9A]">
            In <span className="text-[#69A3FF] capitalize font-medium">{geometry}</span> space, how many non-intersecting geodesics do you predict exist through point P?
          </p>
          <div className="space-y-1.5">
            {[
              { id: 'zero', text: 'Zero parallels — every complete geodesic must intersect.' },
              { id: 'one', text: 'Exactly one unique parallel line.' },
              { id: 'infinite', text: 'Infinitely many non-intersecting lines.' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedPrediction(opt.id)}
                className={`w-full text-left p-2 rounded text-xs transition border ${
                  selectedPrediction === opt.id
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
      label: 'Test',
      icon: <FlaskConical className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-3 text-xs">
          {/* Angle Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[#858B9A] flex items-center gap-1">
                <RotateCcw className="w-3 h-3 text-[#69A3FF]" />
                Candidate Angle (θ)
              </span>
              <span className="font-mono font-semibold text-[#69A3FF] bg-[#181B22] px-2 py-0.5 rounded border border-[#20232B]">
                {candidateAngleDeg}°
              </span>
            </div>
            <input
              type="range"
              min={-85}
              max={85}
              step={0.5}
              value={candidateAngleDeg}
              onChange={(e) => setCandidateAngle(parseFloat(e.target.value))}
              className="w-full accent-[#69A3FF] h-1.5 bg-[#1F2229] rounded cursor-pointer"
            />
          </div>

          {/* Quick Snaps */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setCandidateAngle(0)}
              className="flex-1 py-1 text-[10px] font-mono bg-[#181B22] hover:bg-[#202530] text-[#E8EAF0] rounded border border-[#20232B]"
            >
              0°
            </button>
            {geometry === 'hyperbolic' && analysis.limitAngleDeg && (
              <>
                <button
                  onClick={() => setCandidateAngle(parseFloat(analysis.limitAngleDeg))}
                  className="flex-1 py-1 text-[10px] font-mono bg-[#181B22] hover:bg-[#202530] text-[#FFD166] rounded border border-[#FFD166]/40"
                  title="Snap to Limiting Parallel"
                >
                  Limit (+)
                </button>
                <button
                  onClick={() => setCandidateAngle(-parseFloat(analysis.limitAngleDeg))}
                  className="flex-1 py-1 text-[10px] font-mono bg-[#181B22] hover:bg-[#202530] text-[#FFD166] rounded border border-[#FFD166]/40"
                  title="Snap to Limiting Parallel"
                >
                  Limit (-)
                </button>
              </>
            )}
            <button
              onClick={() => setCandidateAngle(45)}
              className="flex-1 py-1 text-[10px] font-mono bg-[#181B22] hover:bg-[#202530] text-[#E8EAF0] rounded border border-[#20232B]"
            >
              45°
            </button>
          </div>

          {/* Radiating Fan Toggle */}
          <div className="flex items-center justify-between p-2 rounded bg-[#12141A] border border-[#20232B]">
            <span className="text-[11px] text-[#858B9A] flex items-center gap-1.5">
              <Split className="w-3.5 h-3.5 text-[#69A3FF]" />
              Radiating Geodesic Fan
            </span>
            <button
              onClick={() => setShowFan(!showFan)}
              className={`px-2.5 py-0.5 text-[11px] rounded transition ${
                showFan ? 'bg-[#69A3FF] text-[#090A0D] font-bold' : 'bg-[#181B22] text-[#858B9A]'
              }`}
            >
              {showFan ? 'On' : 'Off'}
            </button>
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
          <div className={`p-2.5 rounded-lg border ${analysis.badgeColor}`}>
            <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider">
              <span>Status</span>
              <span className="font-bold">{analysis.classification}</span>
            </div>
            <div className="mt-1 font-medium text-[11px]">{analysis.summary}</div>
          </div>

          <div className="bg-[#12141A] p-2 rounded border border-[#20232B] space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#858B9A]">Distance to Line (d):</span>
              <span className="font-mono text-[#E8EAF0]">{analysis.distLabel}</span>
            </div>
            {geometry === 'hyperbolic' && analysis.piAngleDeg && (
              <div className="flex justify-between text-[11px]">
                <span className="text-[#858B9A]">Angle of Parallelism Π(d):</span>
                <span className="font-mono text-[#FFD166]">{analysis.piAngleDeg}°</span>
              </div>
            )}
            <div className="flex justify-between text-[11px]">
              <span className="text-[#858B9A]">Total Non-Intersecting Geodesics:</span>
              <span className="font-mono text-[#69A3FF] font-semibold">{analysis.parallelCount}</span>
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
          <div className="font-semibold text-[#E8EAF0]">{analysis.parallelCount}</div>
          <p className="text-[11px] text-[#858B9A]">{analysis.axiomText}</p>
          <div className="p-2.5 rounded bg-[#12141A] border border-[#20232B] text-[11px] text-[#858B9A]">
            <strong className="text-[#69A3FF]">STS Insight:</strong> When Lobachevsky and Bolyai published their discovery that replacing Euclid's 5th postulate produced a mathematically self-consistent geometry, it shattered the classical belief that Euclidean geometry was the necessary, God-given structure of physical reality.
          </div>
        </div>
      ),
    },
  ];

  return (
    <GuidedExperimentFrame
      title="How Many Parallels Exist?"
      subtitle={`Investigating Euclid's 5th Postulate in ${geometry} space`}
      stages={stages}
      onReset={() => {
        setCandidateAngle(0);
        setShowFan(false);
        setSelectedPrediction(null);
      }}
    />
  );
};
