# CURVATURE LAB — Interactive 3D Non-Euclidean Geometry & STS Laboratory

An interactive 3D scientific and educational web laboratory designed to make non-Euclidean geometry and the philosophy of mathematical models understandable through visual exploration, rigorous calculations, and Science, Technology & Society (STS) case studies.

---

## 🔬 Project Overview

Curvature Lab explores geometry and the epistemological nature of physical models through the lens of Gaussian curvature $K$:

1. **Euclidean Geometry ($K = 0$):** Flat manifold governed by standard Euclidean metric and Euclid's Fifth Postulate.
2. **Spherical Geometry ($K = +1/R^2$):** Elliptic manifold with positive curvature; all geodesics are great circles, parallel lines do not exist, and triangle interior angles sum to $> 180^\circ$.
3. **Hyperbolic Geometry ($K = -1$):** Negative curvature explored through two complementary representations:
   - **Poincaré Disk Model:** The authoritative global conformal coordinate chart ($\|z\| < 1$), featuring concentric equal-hyperbolic-distance rings ($r = \tanh(d/2)$), geodesic diameters, orthogonal circular arcs, and right-angle boundary markers proving orthogonality to the ideal boundary $\partial\mathbb{D}$ at infinity.
   - **3D Pseudosphere (Tractricoid):** A physical 3D surface with constant negative Gaussian curvature $K = -1/R^2$. It provides a tangible saddle/horn visual embedding while explicitly demonstrating **Hilbert's Theorem (1901)** regarding the impossibility of a complete smooth isometric embedding of the hyperbolic plane in $\mathbb{R}^3$.
   - **Dual Representation Mode:** Side-by-side comparative inspection highlighting what each representation preserves and distorts.

---

## 🧭 Science, Technology & Society (STS) Lens

The application features a dedicated **STS Lens** examining four foundational case studies:

### 1. History of Non-Euclidean Geometry
- **Chronological Timeline:** From Euclid (~300 BCE) and Saccheri (1733) to Gauss, Lobachevsky (1829), Bolyai (1832), Riemann (1854), Beltrami (1868), and Poincaré (1882).
- **Epistemological Investigation:** How trying to prove Euclid's 5th Postulate as a theorem accidentally shattered 2,000 years of dogmatic belief in Euclidean space as the only conceivable reality.
- **Central Question:** *"How did questioning a foundational mathematical assumption change the scientific understanding of space?"*

### 2. Geometry and Navigation
- **Interactive 3D Earth Globe:** Compare true Great-Circle orthodromes (shortest distance) with flat-map straight lines (Mercator rhumb lines) across real flight routes (e.g., Tokyo $\leftrightarrow$ San Francisco, Sydney $\leftrightarrow$ Santiago).
- **Map Projections:** Analysis of Gerardus Mercator's 1569 conformal projection, showing why sailing compass utility led to massive high-latitude area distortions (Greenland vs. Africa) and influenced geopolitical perception.
- **Central Question:** *"How does the representation of the Earth influence navigation and our perception of geographical space?"*

### 3. Geometry and Gravity (General Relativity)
- **3D Spacetime Fabric:** Interactive deformed coordinate grid simulating the curvature caused by a central mass, displaying bent null-geodesic light trajectories (gravitational lensing) and Arthur Eddington's 1919 eclipse verification.
- **Essential Scientific Caveat:** Explains that Einstein's GR operates on four-dimensional pseudo-Riemannian spacetime with metric signature $(+,-,-,-)$; gravity is not an extrinsic spatial funnel, but intrinsic geodesic deviation and gravitational time dilation.
- **Central Question:** *"How did mathematical geometry contribute to a different scientific understanding of gravity?"*

### 4. Models and Scientific Representation
- **Taxonomy of Geometric Models:** Comparative matrix analyzing the Euclidean Plane, 2-Sphere, Poincaré Disk, and Pseudosphere (what each preserves, what it distorts, and mathematical limitations).
- **Gauss's *Theorema Egregium* (1827):** Intrinsic curvature vs. extrinsic visual artifacts.
- **Central Question:** *"Does a scientific model reproduce reality, or does it provide a useful way of understanding selected properties of reality?"*

### STS Reflection Framework
Every case study and experiment includes guided prompts prompting students to evaluate:
- Historical assumptions influencing scientific theories
- New knowledge unlocked by paradigm shifts
- Technological infrastructures made possible (e.g. GPS relativistic satellite corrections)
- Inherent model distortions and cognitive limitations

---

## 🧪 5-Stage Guided Experiments

All presets function as 5-stage inquiry learning modules:
1. **QUESTION:** Poses the fundamental scientific/geometric question.
2. **PREDICT:** Users formulate an intuitive hypothesis before experimenting.
3. **EXPERIMENT:** Interactive manipulation (dragging vertices, adjusting candidate geodesic angles, expanding circle radius).
4. **OBSERVE:** Real-time calculated measurements, angle sums, perimeter/area ratios, and intersection verdicts.
5. **EXPLAIN:** Pedagogical synthesis linking mathematics, axioms, and history.

### Available Experiments:
- **Parallel Lines:** Sweep candidate geodesics through point $P$ to test Euclid's 5th Postulate (Euclidean: 1 parallel, Spherical: 0 parallels / antipodal pairs, Hyperbolic: infinitely many ultraparallels bounded by 2 limiting parallels at Lobachevsky's Angle of Parallelism $\Pi(d) = 2\arctan(e^{-d})$).
- **Geodesic Triangle:** Drag vertices to observe Gauss-Bonnet curvature ($\Sigma = 180^\circ$ in Euclidean, $\Sigma > 180^\circ$ with spherical excess, $\Sigma < 180^\circ$ with hyperbolic defect bounded by $\pi$).
- **Circle Experiment:** Vary geodesic radius $r$ and compare circumference growth ($C = 2\pi r$ vs. $C = 2\pi R\sin(r/R)$ vs. $C = 2\pi\sinh r$).
- **Shortest Path:** Place points to discover why geodesics have zero intrinsic curvature ($\kappa_g = 0$) even when their extrinsic chart representation looks curved.

---

## 🛠️ Technology Stack

- **Framework:** React 18 + TypeScript (Strict typing)
- **3D Graphics:** Three.js, React Three Fiber, React Three Drei
- **Styling:** Tailwind CSS (Dark scientific laboratory palette: `#090A0D`, `#12141A`, `#69A3FF`, `#FFD166`)
- **State Management:** Zustand
- **Icons:** Lucide React
- **Audio:** Native Web Audio API procedural synthesis (muted by default)
- **Testing:** Vitest (15 unit tests covering distances, pseudosphere mesh, circle metrics, intersections)
- **Build Tool:** Vite 5

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/darshanrathwa25-luffy/STS-PROJECT-.git
cd STS-PROJECT-

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Unit Tests
```bash
npm test
```

### Production Build
```bash
npm run build
```

---

## 📜 License
MIT License. Developed for Curvature Lab (STS Project).
