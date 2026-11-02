import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { StsReflectionBox } from './StsReflectionBox';
import { Sparkles, Sun, AlertTriangle, Lightbulb, Compass, Orbit } from 'lucide-react';

export const CaseStudyGravity: React.FC = () => {
  const [mass, setMass] = useState<number>(1.6); // Mass slider

  // Generate 3D warped coordinate grid (Flamm's paraboloid / rubber-sheet embedding)
  const spacetimeGrid = useMemo(() => {
    const size = 12;
    const divisions = 32;
    const step = size / divisions;
    const lines: THREE.Vector3[][] = [];

    // Parametric well: y = -mass / sqrt(r^2 + 0.4)
    const getDepth = (x: number, z: number) => {
      const r2 = x * x + z * z;
      return -mass / Math.sqrt(r2 + 0.6);
    };

    // Parallel grid lines along X
    for (let i = -divisions / 2; i <= divisions / 2; i++) {
      const z = i * step;
      const pts: THREE.Vector3[] = [];
      for (let j = -divisions / 2; j <= divisions / 2; j++) {
        const x = j * step;
        pts.push(new THREE.Vector3(x, getDepth(x, z), z));
      }
      lines.push(pts);
    }

    // Parallel grid lines along Z
    for (let j = -divisions / 2; j <= divisions / 2; j++) {
      const x = j * step;
      const pts: THREE.Vector3[] = [];
      for (let i = -divisions / 2; i <= divisions / 2; i++) {
        const z = i * step;
        pts.push(new THREE.Vector3(x, getDepth(x, z), z));
      }
      lines.push(pts);
    }

    // Light ray path (null geodesic) passing near mass:
    // Impact parameter b = 1.2
    const b = 1.2;
    const lightPts: THREE.Vector3[] = [];
    const unbentPts: THREE.Vector3[] = [];
    const samples = 60;

    for (let i = 0; i <= samples; i++) {
      const x = -6 + (i / samples) * 12;
      // Gravitational deflection: delta z ~ -mass / (x^2 + b^2)
      // Integrate deflection angle: z(x) = b - (4GM / c^2) * ...
      const deflection = (mass * 0.45) / (1 + Math.abs(x) * 0.6);
      const zCurved = b - (x > 0 ? deflection : -deflection * 0.2);
      const yCurved = getDepth(x, zCurved) + 0.05;

      lightPts.push(new THREE.Vector3(x, yCurved, zCurved));
      unbentPts.push(new THREE.Vector3(x, 0.05, b));
    }

    return { lines, lightPts, unbentPts, wellDepth: getDepth(0, 0) };
  }, [mass]);

  const reflectionQuestions = [
    {
      question: "How did non-Euclidean geometry enable Einstein to redefine gravity?",
      context:
        "Newton described gravity as an invisible force pulling objects across static Euclidean space. Einstein, using Riemann's non-Euclidean geometry, showed that mass curves spacetime itself ($G_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}$). Objects in freefall are not pulled by a force; they are simply moving along straight geodesics through curved spacetime.",
      promptHint: "How does conceptualizing gravity as geometry change our understanding of physics?",
    },
    {
      question: "What are the limitations of the classic 'rubber sheet' visual analogy?",
      context:
        "The popular rubber-sheet funnel model is extrinsic: it embeds a 2D surface into a 3D Euclidean space and relies on gravity pulling downward to explain gravity! In reality, spacetime has 4 intrinsic dimensions (Lorentzian signature), and gravity is primarily caused by the gradient in time dilation ($g_{00}$), not a spatial pit.",
      promptHint: "Can a visual metaphor mislead scientific intuition if taken literally?",
    },
    {
      question: "What modern technological infrastructure relies on general relativity?",
      context:
        "GPS satellites experience weaker spacetime curvature in orbit, causing their atomic clocks to run ~45 microseconds per day faster than clocks on Earth. If engineers did not correct for non-Euclidean relativistic curvature, GPS navigation would drift by over 10 kilometers every day!",
      promptHint: "How did an abstract mathematical theory become a vital global technology?",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Central Question Header */}
      <div className="bg-[#12141A] p-5 rounded-xl border border-[#292C35] shadow-panel space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#69A3FF]">
          <Orbit className="w-4 h-4" />
          <span>Case Study 3 · Relativity & Spacetime</span>
        </div>
        <h2 className="text-xl font-bold text-[#E8EAF0]">
          Geometry and Gravity: Curved Spacetime
        </h2>
        <div className="p-3 rounded-lg bg-[#0D0F14] border border-[#20232B] text-xs leading-relaxed text-[#858B9A]">
          <strong className="text-[#69A3FF]">Central STS Question:</strong>{" "}
          <span className="text-[#E8EAF0] italic">
            "How did mathematical geometry contribute to a fundamentally different scientific understanding of gravity?"
          </span>
        </div>
      </div>

      {/* Critical Scientific Caveat Alert */}
      <div className="bg-[#12141A] p-4 rounded-xl border border-amber-500/40 shadow-panel space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
          <AlertTriangle className="w-4 h-4" />
          <span>ESSENTIAL SCIENTIFIC CAVEAT: 4D LORENTZIAN SPACETIME</span>
        </div>
        <p className="text-xs text-[#858B9A] leading-relaxed">
          General Relativity describes <strong className="text-[#E8EAF0]">four-dimensional Lorentzian spacetime</strong> with metric signature (+, -, -, -). Gravity is not a literal funnel pulled into a third dimension. The 2D warped grid below is an extrinsic teaching analogy (Flamm's paraboloid); real spacetime curvature manifests as gravitational time dilation and geodesic convergence in four dimensions.
        </p>
      </div>

      {/* Interactive 3D Canvas */}
      <div className="bg-[#12141A] rounded-xl border border-[#292C35] overflow-hidden shadow-panel">
        <div className="p-3 bg-[#0D0F14] border-b border-[#20232B] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-amber-300 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              Bent Light Geodesic (Lensing)
            </span>
            <span className="flex items-center gap-1.5 text-[#565C6B] font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-[#565C6B] inline-block" />
              Straight Unbent Ray
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#858B9A] font-mono text-[11px]">Mass Scale (M):</span>
            <input
              type="range"
              min={0.5}
              max={3.0}
              step={0.1}
              value={mass}
              onChange={(e) => setMass(parseFloat(e.target.value))}
              className="w-28 accent-[#69A3FF] h-1.5 bg-[#1F2229] rounded cursor-pointer"
            />
            <span className="font-mono text-[#69A3FF] w-8">{mass.toFixed(1)}</span>
          </div>
        </div>

        <div className="h-[380px] relative w-full bg-[#090A0D]">
          <Canvas camera={{ position: [0, 5, 8], fov: 45 }}>
            <ambientLight intensity={0.65} />
            <directionalLight position={[10, 15, 10]} intensity={0.8} />
            <directionalLight position={[-10, -5, -5]} intensity={0.3} color="#69A3FF" />
            <OrbitControls makeDefault enableDamping dampingFactor={0.05} />

            {/* Central Gravitational Mass */}
            <mesh position={[0, spacetimeGrid.wellDepth + 0.3, 0]}>
              <sphereGeometry args={[0.55, 32, 32]} />
              <meshStandardMaterial
                color="#FFD166"
                emissive="#FFD166"
                emissiveIntensity={0.6}
                roughness={0.2}
              />
            </mesh>

            {/* Deformed Coordinate Grid Lines */}
            {spacetimeGrid.lines.map((pts, idx) => (
              <line key={idx}>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={pts.length}
                    array={new Float32Array(pts.flatMap((v) => [v.x, v.y, v.z]))}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color="#2B3245" transparent opacity={0.5} />
              </line>
            ))}

            {/* Bent Light Trajectory (Gravitational Lensing) */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={spacetimeGrid.lightPts.length}
                  array={new Float32Array(spacetimeGrid.lightPts.flatMap((v) => [v.x, v.y, v.z]))}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#FFD166" linewidth={3} />
            </line>

            {/* Unbent Straight Reference Trajectory */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={spacetimeGrid.unbentPts.length}
                  array={new Float32Array(spacetimeGrid.unbentPts.flatMap((v) => [v.x, v.y, v.z]))}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#3A4356" transparent opacity={0.35} />
            </line>
          </Canvas>
        </div>

        {/* Narrative Box */}
        <div className="p-4 bg-[#12141A] border-t border-[#20232B] text-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-[#E8EAF0]">Light Deflection in Gravitational Fields</span>
            <span className="font-mono text-[#FFD166]">
              Eddington Deflection: Δθ = 4GM / (c² b) = {(1.75 * mass).toFixed(2)} arcsec
            </span>
          </div>
          <p className="text-[#858B9A] leading-relaxed">
            In May 1919, Sir Arthur Eddington photographed the solar eclipse on the island of Príncipe and in Sobral, Brazil. He observed stars whose apparent positions shifted by ~1.75 arcseconds as their light grazed the Sun's mass, directly verifying Einstein's non-Euclidean gravitational geodesics over Newton's particle model.
          </p>
        </div>
      </div>

      {/* Reflection Framework */}
      <StsReflectionBox questions={reflectionQuestions} />
    </div>
  );
};

