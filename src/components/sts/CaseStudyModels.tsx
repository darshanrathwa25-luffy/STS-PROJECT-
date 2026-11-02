import React from 'react';
import { StsReflectionBox } from './StsReflectionBox';
import { Layers, Check, X, AlertTriangle, Eye, Compass, Scale } from 'lucide-react';

export const CaseStudyModels: React.FC = () => {
  const models = [
    {
      name: 'Euclidean Plane (ℝ²)',
      curvature: 'K = 0',
      type: 'Complete & Global',
      preserves: 'Distances, angles, parallelism, linear scaling',
      distorts: 'Cannot model non-zero curvature',
      limitation: 'Strictly restricted to flat space; fails near massive gravity wells.',
    },
    {
      name: 'Spherical Surface (S²)',
      curvature: 'K = +1/R² > 0',
      type: 'Complete & Global',
      preserves: 'Isometric 3D embedding in ℝ³, closed compact manifold',
      distorts: 'Cannot be flattened onto a flat map without tearing or stretching (Gauss)',
      limitation: 'Finite total surface area 4πR²; no parallel lines exist.',
    },
    {
      name: 'Poincaré Disk (ℍ²)',
      curvature: 'K = -1 < 0',
      type: 'Complete & Global',
      preserves: 'Conformal (preserves all angles accurately; geodesics meet at right angles)',
      distorts: 'Distorts distances near rim: infinite hyperbolic distance compressed into finite unit disk',
      limitation: 'Boundary circle |z|=1 is an ideal boundary at infinity, unreachable by interior points.',
    },
    {
      name: 'Pseudosphere (Tractricoid)',
      curvature: 'K = -1/R² < 0',
      type: 'Local Embedding Only',
      preserves: 'Local constant negative curvature in tangible 3D Euclidean space',
      distorts: 'Does not represent the complete hyperbolic plane; wraps only a local horocyclic strip',
      limitation: 'Hilbert\'s Theorem (1901): contains an unavoidable sharp cuspidal singularity at u=0.',
    },
  ];

  const reflectionQuestions = [
    {
      question: "Does a scientific model reproduce reality, or does it provide a useful way of understanding selected properties?",
      context:
        "Every mathematical model of hyperbolic space (Poincaré disk, Klein model, Pseudosphere, hyperboloid) sacrifices something: the disk preserves angles but distorts distances; the Klein model straightens geodesics but distorts angles; the pseudosphere embeds locally but cannot be extended globally without singularities.",
      promptHint: "How does the choice of model shape what a scientist can see or overlook?",
    },
    {
      question: "What is the philosophical difference between intrinsic and extrinsic geometry?",
      context:
        "Carl Friedrich Gauss proved in his Theorema Egregium ('Remarkable Theorem') that Gaussian curvature K depends purely on distances measured along the surface itself. A 2D creature can measure K by measuring triangles, without ever needing an external 3rd dimension. This opened the modern scientific concept of spacetime as an autonomous manifold without an 'outside'.",
      promptHint: "Why was intrinsic geometry crucial for developing modern cosmology?",
    },
    {
      question: "What are the epistemic risks when users mistake a visualization for the phenomenon itself?",
      context:
        "When students see the Poincaré disk, they often mistakenly believe hyperbolic space is crowded at the edge. To an inhabitant inside the disk, every region is identical and uniform out to infinity. The crowding is an artifact of the projection, not the geometry.",
      promptHint: "How can interactive educational tools make projection artifacts explicit to learners?",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Central Question Header */}
      <div className="bg-[#12141A] p-5 rounded-xl border border-[#292C35] shadow-panel space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#69A3FF]">
          <Scale className="w-4 h-4" />
          <span>Case Study 4 · Philosophy of Science & Models</span>
        </div>
        <h2 className="text-xl font-bold text-[#E8EAF0]">
          Models, Limitations & Scientific Representation
        </h2>
        <div className="p-3 rounded-lg bg-[#0D0F14] border border-[#20232B] text-xs leading-relaxed text-[#858B9A]">
          <strong className="text-[#69A3FF]">Central STS Question:</strong>{" "}
          <span className="text-[#E8EAF0] italic">
            "Does a scientific model reproduce reality, or does it provide a useful way of understanding selected properties of reality?"
          </span>
        </div>
      </div>

      {/* Comparative Model Matrix */}
      <div className="bg-[#12141A] rounded-xl border border-[#292C35] p-4 shadow-panel space-y-3">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#69A3FF] flex items-center gap-1.5">
          <Layers className="w-4 h-4" />
          <span>Comparative Taxonomy of Geometric Models</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#292C35] text-[#858B9A] font-mono text-[10px] uppercase">
                <th className="py-2 px-3">Model</th>
                <th className="py-2 px-3">Curvature K</th>
                <th className="py-2 px-3">Scope</th>
                <th className="py-2 px-3">What it Preserves</th>
                <th className="py-2 px-3">What it Distorts / Limitations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#20232B] text-[11px]">
              {models.map((m, idx) => (
                <tr key={idx} className="hover:bg-[#181B22]/50 transition">
                  <td className="py-2.5 px-3 font-semibold text-[#E8EAF0]">{m.name}</td>
                  <td className="py-2.5 px-3 font-mono text-[#69A3FF]">{m.curvature}</td>
                  <td className="py-2.5 px-3 text-[#858B9A]">{m.type}</td>
                  <td className="py-2.5 px-3 text-emerald-400">{m.preserves}</td>
                  <td className="py-2.5 px-3 text-rose-400">{m.distorts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intrinsic vs Extrinsic Deep Dive Card */}
      <div className="bg-[#12141A] rounded-xl border border-[#292C35] p-5 shadow-panel space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FFD166]">
          <Compass className="w-4 h-4" />
          <span>Gauss's Theorema Egregium (1827): Intrinsic vs Extrinsic Geometry</span>
        </div>

        <p className="text-xs text-[#E8EAF0] leading-relaxed">
          Before Gauss, surfaces were studied extrinsically — as objects sitting inside a 3-dimensional Euclidean room. Gauss discovered that Gaussian curvature K is an <strong className="text-[#69A3FF]">intrinsic invariant</strong>: two-dimensional creatures living on a surface can measure its curvature by determining the perimeter of small circles or the sum of angles in a triangle, without any knowledge of a third dimension.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
          <div className="bg-[#0D0F14] p-3 rounded-lg border border-[#20232B] space-y-1">
            <div className="font-semibold text-emerald-400">Intrinsic Properties</div>
            <p className="text-[#858B9A] text-[11px] leading-relaxed">
              Geodesic distances, interior angles, Gaussian curvature K, parallel transport. Inhabitants experience these directly without external reference.
            </p>
          </div>
          <div className="bg-[#0D0F14] p-3 rounded-lg border border-[#20232B] space-y-1">
            <div className="font-semibold text-rose-400">Extrinsic Artifacts</div>
            <p className="text-[#858B9A] text-[11px] leading-relaxed">
              The apparent bending of a cylinder (which has K = 0), the edge of the Poincaré disk, the funnel neck of the pseudosphere in ℝ³.
            </p>
          </div>
        </div>
      </div>

      {/* Reflection Framework */}
      <StsReflectionBox questions={reflectionQuestions} />
    </div>
  );
};

