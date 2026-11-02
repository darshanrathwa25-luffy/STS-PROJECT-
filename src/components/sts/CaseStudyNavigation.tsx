import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { StsReflectionBox } from './StsReflectionBox';
import {
  sphericalToCartesian,
  generateGreatCircleArc,
  DEFAULT_SPHERE_RADIUS,
  degToRad,
} from '../../geometry-engine';
import { Globe, Plane, Compass, AlertCircle, Map } from 'lucide-react';

interface FlightRoute {
  name: string;
  from: { name: string; lat: number; lon: number };
  to: { name: string; lat: number; lon: number };
  greatCircleKm: number;
  rhumbLineKm: number;
  description: string;
}

export const CaseStudyNavigation: React.FC = () => {
  const routes: FlightRoute[] = [
    {
      name: 'Tokyo ➔ San Francisco',
      from: { name: 'Tokyo', lat: 35.67, lon: 139.65 },
      to: { name: 'San Francisco', lat: 37.77, lon: -122.41 },
      greatCircleKm: 8280,
      rhumbLineKm: 9200,
      description:
        'A straight line on a flat Mercator map sails straight across the middle Pacific. But the true shortest great-circle path arcs far north over the Aleutian Islands of Alaska, saving over 900 kilometers (almost an hour of jet fuel)!',
    },
    {
      name: 'London ➔ New York',
      from: { name: 'London', lat: 51.5, lon: -0.12 },
      to: { name: 'New York', lat: 40.71, lon: -74.0 },
      greatCircleKm: 5570,
      rhumbLineKm: 5800,
      description:
        'Transatlantic flights do not fly in a straight flat line across the mid-Atlantic. They fly north toward Greenland and Newfoundland along the great-circle orthodrome.',
    },
    {
      name: 'Sydney ➔ Santiago',
      from: { name: 'Sydney', lat: -33.86, lon: 151.2 },
      to: { name: 'Santiago', lat: -33.44, lon: -70.66 },
      greatCircleKm: 11350,
      rhumbLineKm: 13500,
      description:
        'In the Southern Hemisphere, a flat map suggests flying due east along latitude 33°S. The actual shortest path arcs down into sub-Antarctic polar waters, saving over 2,150 kilometers!',
    },
  ];

  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);
  const activeRoute = routes[selectedRouteIdx];

  const R = DEFAULT_SPHERE_RADIUS;

  // 3D globe curve points
  const routeCurves = useMemo(() => {
    const lat1 = degToRad(activeRoute.from.lat);
    const lon1 = degToRad(activeRoute.from.lon);
    const lat2 = degToRad(activeRoute.to.lat);
    const lon2 = degToRad(activeRoute.to.lon);

    const pA = sphericalToCartesian(lat1, lon1, R);
    const pB = sphericalToCartesian(lat2, lon2, R);

    // Great circle geodesic
    const gcArc = generateGreatCircleArc(pA, pB, 64, R, 1.006);
    const gcPoints = gcArc.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));

    // Rhumb line (constant latitude/bearing interpolation on Mercator)
    const rhumbPoints: THREE.Vector3[] = [];
    const samples = 64;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const lat = lat1 + t * (lat2 - lat1);
      // Shortest longitude difference
      let dLon = lon2 - lon1;
      if (dLon > Math.PI) dLon -= 2 * Math.PI;
      if (dLon < -Math.PI) dLon += 2 * Math.PI;
      const lon = lon1 + t * dLon;
      const pt = sphericalToCartesian(lat, lon, R * 1.004);
      rhumbPoints.push(new THREE.Vector3(pt.x, pt.y, pt.z));
    }

    return {
      pA: new THREE.Vector3(pA.x, pA.y, pA.z),
      pB: new THREE.Vector3(pB.x, pB.y, pB.z),
      gcPoints,
      rhumbPoints,
    };
  }, [activeRoute, R]);

  const reflectionQuestions = [
    {
      question: "Why was the Mercator map projection adopted globally despite huge area distortions?",
      context:
        "Gerardus Mercator published his map in 1569 specifically for 16th-century sailing navigators. On a Mercator map, lines of constant compass bearing (rhumb lines) are straight lines, allowing a sailor to navigate with just a magnetic compass and ruler.",
      promptHint: "How does technological necessity dictate the choice of mathematical representation?",
    },
    {
      question: "How does the Mercator projection distort global geopolitical perception?",
      context:
        "Because Mercator stretches poles by sec(latitude), Greenland appears as large as all of Africa on flat world maps. In reality, Africa (30.4M km²) is 14 times larger than Greenland (2.16M km²). Generations of students grew up with a Eurocentric perception of geographical scale.",
      promptHint: "In what ways do map projections embed political and cultural biases?",
    },
    {
      question: "How did GPS and computer navigation change the role of great-circle geometry?",
      context:
        "Pre-digital navigators favored straight-line compass rhumb lines because calculating spherical trigonometry by hand at sea was prone to error. Today, satellite avionics constantly steer along true great circles, saving airlines millions of gallons of fuel annually.",
      promptHint: "How do computational technologies enable non-Euclidean methods in everyday industry?",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Central Question Header */}
      <div className="bg-[#12141A] p-5 rounded-xl border border-[#292C35] shadow-panel space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#69A3FF]">
          <Globe className="w-4 h-4" />
          <span>Case Study 2 · Geometry & Cartography</span>
        </div>
        <h2 className="text-xl font-bold text-[#E8EAF0]">
          Geometry, Navigation & Map Projections
        </h2>
        <div className="p-3 rounded-lg bg-[#0D0F14] border border-[#20232B] text-xs leading-relaxed text-[#858B9A]">
          <strong className="text-[#69A3FF]">Central STS Question:</strong>{" "}
          <span className="text-[#E8EAF0] italic">
            "How does the representation of the Earth influence global navigation and our perception of geographical space?"
          </span>
        </div>
      </div>

      {/* Flight Route Selector & Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {routes.map((r, idx) => {
          const isSelected = idx === selectedRouteIdx;
          return (
            <button
              key={idx}
              onClick={() => setSelectedRouteIdx(idx)}
              className={`p-3.5 rounded-xl border text-left transition ${
                isSelected
                  ? 'bg-[#181B22] border-[#69A3FF] text-[#E8EAF0] shadow-glow-accent'
                  : 'bg-[#12141A] border-[#292C35] text-[#858B9A] hover:text-[#E8EAF0]'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
                <Plane className="w-3.5 h-3.5 text-[#69A3FF]" />
                <span>{r.name}</span>
              </div>
              <div className="mt-2 text-[11px] space-y-0.5">
                <div className="text-emerald-400 font-mono">Great Circle: {r.greatCircleKm.toLocaleString()} km</div>
                <div className="text-rose-400 font-mono">Flat Map Path: {r.rhumbLineKm.toLocaleString()} km</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3D Interactive Earth Canvas */}
      <div className="bg-[#12141A] rounded-xl border border-[#292C35] overflow-hidden shadow-panel">
        <div className="p-3 bg-[#0D0F14] border-b border-[#20232B] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400 font-mono font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              Great-Circle Orthodrome (Shortest Geodesic)
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-mono font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
              Flat Mercator Straight Line (Rhumb Line)
            </span>
          </div>
          <span className="text-[10px] text-[#858B9A] font-mono">Rotate Globe: Drag | Zoom: Scroll</span>
        </div>

        <div className="h-[360px] relative w-full bg-[#090A0D]">
          <Canvas camera={{ position: [0, 2.5, 5.5], fov: 45 }}>
            <ambientLight intensity={0.65} />
            <directionalLight position={[10, 15, 10]} intensity={0.8} />
            <OrbitControls makeDefault enableDamping dampingFactor={0.05} />

            {/* Translucent Sphere Base */}
            <mesh>
              <sphereGeometry args={[R, 48, 48]} />
              <meshStandardMaterial
                color="#0f1522"
                roughness={0.4}
                metalness={0.6}
                transparent
                opacity={0.8}
              />
            </mesh>

            {/* Latitude and Longitude Grids */}
            <gridHelper args={[10, 10, 0x292c35, 0x181b22]} position={[0, -R, 0]} />

            {/* Start and End Cities */}
            <mesh position={routeCurves.pA}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshBasicMaterial color="#69A3FF" />
            </mesh>
            <mesh position={routeCurves.pB}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshBasicMaterial color="#69A3FF" />
            </mesh>

            {/* Great Circle Geodesic Arc (Emerald Green) */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={routeCurves.gcPoints.length}
                  array={new Float32Array(routeCurves.gcPoints.flatMap((v) => [v.x, v.y, v.z]))}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#06D6A0" linewidth={3} />
            </line>

            {/* Rhumb Line Path (Rose Red) */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={routeCurves.rhumbPoints.length}
                  array={new Float32Array(routeCurves.rhumbPoints.flatMap((v) => [v.x, v.y, v.z]))}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#EF476F" linewidth={2} />
            </line>
          </Canvas>
        </div>

        {/* Route Story Narrative */}
        <div className="p-4 bg-[#12141A] border-t border-[#20232B] text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#E8EAF0]">{activeRoute.name} Comparison</span>
            <span className="font-mono text-emerald-400 font-bold">
              Fuel/Distance Savings: {(activeRoute.rhumbLineKm - activeRoute.greatCircleKm).toLocaleString()} km
            </span>
          </div>
          <p className="text-[#858B9A] leading-relaxed">{activeRoute.description}</p>
        </div>
      </div>

      {/* Reflection Framework */}
      <StsReflectionBox questions={reflectionQuestions} />
    </div>
  );
};

