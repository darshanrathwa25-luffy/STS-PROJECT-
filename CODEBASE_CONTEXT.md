# Curvature Lab — Codebase Context (`CODEBASE_CONTEXT.md`)

*Describes the repository as it exists at commit `0f7162c` ("phase 3a: triangle lab explore mode") on branch `refactor/epic-lab`.*
*Written from a direct read of the source. Tests/build were NOT executed when this was written (see §12).*

> **Read §11 first if you have also seen the older `D:\Projects\sts project\CODEBASE_CONTEXT.md`.**
> That document describes a *later/different* state (SAT overlay labels, `userHasDragged`, R3F flat scene, compare mode removed, 49 tests). Several of those things do **not** exist in this repo. Trust this file and the code over that one.

---

## 1. What this project is

**Curvature Lab** is an interactive, browser-only educational lab (STS = Science, Technology & Society course project). Students drag triangle vertices in three geometries and watch the interior-angle sum change with Gaussian curvature **K**:

| World | K | Angle sum Σ | Renderer |
|---|---|---|---|
| Flat (Euclidean) | 0 | exactly 180° | SVG (`FlatTriangleView`) |
| Sphere | > 0 (R = 2.5, K = 1/R²) | > 180° (spherical excess) | R3F Canvas (`SphericalTriangleScene`) |
| Hyperbolic "saddle" | < 0 (Monge patch, K(0,0) = −1) | < 180° (defect) | R3F Canvas (`SaddleTriangleScene`) |

Pedagogical idea: "don't explain everything, let students discover it" — a bottom **QuestionCard** poses a prompt per world, then reveals a historical/STS explanation.

There is also a second lab, **Parallel Lines** (Euclid's 5th postulate), still on the older scene code (§6), and two STS case-study components (navigation, gravity) that exist in `src/components/sts/` (see §6 for whether they are wired in).

No backend, no database, no env vars/API keys. Static SPA.

## 2. Tech stack

React 18.3, TypeScript 5.6 (strict), Vite 5, Three.js 0.169 + `@react-three/fiber` 8 + `@react-three/drei` 9, Zustand 5, Tailwind 3, lucide-react, `@fontsource/inter` + `jetbrains-mono`, Vitest 2, Playwright (dev, used by `scripts/take-screenshots.mjs`).

Scripts (`package.json`): `dev` (vite, port 3000, host 0.0.0.0), `build` (`tsc && vite build`), `test` (`vitest run`), `test:watch`, `preview`, `lint` (`eslint .` — **no ESLint config or dependency is present**, so `npm run lint` will not work as-is).

`vite.config.ts`: `@` alias → `./src`; dev server `allowedHosts` contains a hard-coded ngrok host (`grouped-brick-affair.ngrok-free.dev`).

Theme: **"Byrne notebook"** (light; after Oliver Byrne's 1847 colour Euclid). Tokens live in `tailwind.config.js` (`paper`, `paper-raised`, `paper-sunk`, `rule`, `rule-strong`, `ink`, `ink-soft`, `ink-muted`, `ink-faint`, `blue`, `red`, `yellow`, `ochre`) and, for Three.js/SVG literals, in `src/theme/palette.ts` (keep the two in sync). One primary per world: flat = blue, sphere = red, saddle = yellow (use `ochre` for yellow *text*). Fonts: Newsreader (serif: headings, big numbers, variables), IBM Plex Sans (UI), IBM Plex Mono (values). Don't add raw hex classes in active components. Layout: top bar, the figure (stage) on the left, a margin column on the right with the readout (`TriangleHUD`) and the question (`QuestionCard`); `DetailsDrawer` is the "Notes" sheet.

## 3. Repository layout (actual)

```
STS-PROJECT-/
├── index.html, package.json, vite.config.ts, tailwind.config.js, postcss.config.js
├── tsconfig.json, tsconfig.node.json, README.md (partly stale, see §11)
├── docs/screenshots/            # screenshot output folder
├── scripts/
│   ├── capture.ps1              # window screenshot helper
│   └── take-screenshots.mjs     # Playwright capture runner
└── src/
    ├── main.tsx, App.tsx, index.css
    ├── store/
    │   ├── geometryStore.ts             # the single Zustand store
    │   └── __tests__/triangleLab.test.ts   (7 tests)
    ├── geometry-engine/                 # pure math, no React/Three
    │   ├── index.ts                     # barrel re-export
    │   ├── shared/   types, numerical, vectors, circleMetrics, triangleConstruction
    │   ├── euclidean/   distance, geodesics, intersections
    │   ├── spherical/   distance, greatCircle, intersections
    │   ├── hyperbolic/  distance, geodesics, intersections, poincareDisk, saddle
    │   └── __tests__/geometry.test.ts   (40 tests)
    ├── components/
    │   ├── layout/AppShell.tsx
    │   ├── shell/       TopBar, QuestionCard, DetailsDrawer, LandingScreen, index.ts
    │   ├── triangle-lab/  TriangleLabStage, TriangleHUD, FlatTriangleView,
    │   │                  SphericalTriangleScene, SaddleTriangleScene, index.ts
    │   ├── geometry/GeometryCanvas.tsx     # canvas for the Parallel lab
    │   ├── experiments/ GuidedExperimentFrame, ParallelLinesExperiment, TriangleExperiment  # legacy
    │   └── sts/         CaseStudyGravity, CaseStudyNavigation, StsReflectionBox
    ├── scenes/          EuclideanScene, SphericalScene, HyperbolicScene   # legacy 3D scenes (Parallel lab)
    └── utils/           audio.ts (Web Audio tick), cn.ts (clsx + tailwind-merge)
```

~4,500 lines across `src/components` + `src/scenes`.

## 4. Architecture and data flow

```
User (pointer / keyboard)
   │
   ▼
Scene components ──drag──► store.updateFlat/Sphere/SaddleVertex(vertex, pos)
                              │  recomputes `sides` from the geometry engine, sets `driver`
                              ▼
                    Zustand geometryStore  ◄── TopBar (world/lab/mode), DetailsDrawer, QuestionCard
                              │
      components call geometry-engine pure functions (useMemo) to get angles/sums/defects
                              ▼
        TriangleHUD · DetailsDrawer · scene labels · QuestionCard solve checks
```

Key points:
- **The engine is the source of truth.** Components never hard-code angle sums; they call `euclideanTriangle`, `sphericalTriangle`, `saddleTriangle` and render the result.
- **Each world keeps its own vertex set in the store** (`flatTriangle`, `sphereTriangle`, `saddleTriangle`), plus a shared `sides {a,b,c}`.
- **Switching worlds preserves side lengths.** `setWorld(w)` (`geometryStore.ts:255`) rebuilds the *target* world's triangle from `sides` using `constructTriangleFromSides` / `constructSaddleTriangleFromSides`, clamping sides (sphere ≤ 2.5; saddle 0.3–1.5), and bumps `cameraResetSeq`. If construction returns `null` the old triangle is kept.
- **Navigation is state-driven, no router.** `AppShell` renders `LandingScreen` when `isLanding`, otherwise `TopBar` + (`TriangleLabStage` if `lab === 'triangle'`, else `GeometryCanvas`) + `QuestionCard` + `DetailsDrawer`.
- **Canvas handling:** `TriangleLabStage` renders the flat world as SVG (no WebGL) and mounts a single `<Canvas>` for sphere/saddle, swapping the scene child by `world`. So the Canvas **does** unmount when going to Flat and back (unlike the older doc's claim of a single persistent canvas).
- **Vertex dragging:** pointer capture + `isDragging` flag in the store; `OrbitControls` is `enabled={!isDragging}`. Flat: SVG `getScreenCTM().inverse()` transform (clamped x∈[−2.5,2.5], y∈[−2.2,2.2]). Sphere: ray vs. invisible sphere radius R, projected to |p|=R. Saddle: ray vs. plane y=0 (see bug note in §10).
- **Keyboard** (`TriangleLabStage.tsx:35`): Tab / Shift+Tab cycle selected vertex; arrow keys nudge by 0.05 (ignored while typing in INPUT/TEXTAREA).

## 5. Geometry engine (`src/geometry-engine/`)

Pure TypeScript, no DOM/React/Three. Barrel: `index.ts`. Core types in `shared/types.ts`: `Point2D`, `Point3D`, `GeometryKind` (`euclidean|spherical|hyperbolic`), `TriangleMeasurements {a,b,c,alpha,beta,gamma,angleSum,angleSumDeg,area,excessOrDefect,degenerate?}`, `ConstructedTriangle<T>`, intersection types (`none|unique|antipodal_pair|limiting_parallel|coincident|divergent`).

- **Euclidean** — `euclideanTriangle(p1,p2,p3)`: sides, angles, area; Σ ≡ 180°.
- **Spherical** — `spherical/distance.ts`: `DEFAULT_SPHERE_RADIUS = 2.5`; `sphericalDistance`, `sphericalAngleAt` (tangent vectors at vertex), `sphericalTriangle` (excess = Σ−π, area = R²·excess). Degenerate input (coincident, near-antipodal, collinear, non-positive excess) returns `degenerate: true`, never NaN. `greatCircle.ts` provides `generateGreatCircleArc`.
- **Hyperbolic / Poincaré** — `distance`, `geodesics`, `intersections`, `poincareDisk` (orthogonal-circle geodesics, ideal endpoints, hyperbolic law of cosines, angle of parallelism Π(d) = 2·arctan(e^(−d))). Used by the Parallel lab and by `constructSaddleTriangleFromSides` (initial guess via hyperbolic law of cosines).
- **Saddle (`hyperbolic/saddle.ts`)** — the most complex module. Surface `z = c(u² − v²)`, `DEFAULT_SADDLE_C = 0.5`, `DEFAULT_SADDLE_DOMAIN = 2.0`.
  - `saddlePosition(u,v)` returns `{x:u, y:v, z:c(u²−v²)}` (**z is height**).
  - `saddleGaussianCurvature = −4c²/(1+4c²(u²+v²))²`, `saddleNormal`, `saddlePrincipalCurvatures`, `saddleCurvatureRange`.
  - `saddleGeodesicRK4` (geodesic ODE), `saddleGeodesicBetween` (Newton shooting, 10 iters, tolerance 1e-6, falls back to `saddlePolylineRelax`), `saddleGeodesicPoints3D`.
  - `constructSaddleTriangleFromSides(a,b,c)`: A at origin, B on x-axis at geodesic distance c (`invertXAxis`), C by secant search on shooting angle; returns `null` if infeasible/outside domain.
  - `saddleTriangle(p1,p2,p3)` returns `SaddleTriangleMeasurements` with 3D edges, angles, `defectDeg`, and a Gauss–Bonnet cross-check (`integralKdA`, `defectFromIntegral`, `gaussBonnetDiscrepancy`). Out-of-domain / coincident / collinear → `degenerate: true`.
  - Note: `saddleTriangle` returns `sides` as a **tuple** `[a,b,c]`, whereas Euclidean/spherical return `.a .b .c`.
- **Poincaré port (`poincare/`)** — TypeScript port of the geometry core of [hyperbolic-canvas](https://github.com/ItsNickBarry/hyperbolic-canvas) (Nick Barry, MIT; `LICENSE` must stay in the folder). Classes `Point`, `Line`, `Circle`, `Polygon`, `Angle`, exported from the barrel as the `Poincare` namespace. Adds what `hyperbolic/` lacks: hyperbolic circles (centre + radius, area, circumference), regular and ideal polygons, walking a distance along a geodesic (`hyperbolicDistantPoint`), boundary points. Upstream's 237 tests are ported under `poincare/__tests__/` (seeded random; `SEED=` to vary), plus `crossCheck.test.ts` comparing it with `hyperbolic/` and with `parallelLab.ts`. `measure.ts` (ours, not upstream) adds polygon angles/area and regular-polygon corner angles. Used by the disk lab and the saddle Parallels view. See `poincare/README.md`.
- **Shared** — `numerical.ts` (clamp, Newton helpers), `vectors.ts`, `circleMetrics.ts`, `triangleConstruction.ts` (`constructTriangleFromSides(kind,a,b,c[,R])`, `angleSumsForSides`).

## 6. UI components

**Shell (`components/shell/`)**
- `TopBar` — wordmark (click → landing), world switcher (hidden when `appMode === 'compare'`), lab switcher Triangle/Parallel, **Explore/Compare toggle**, reset, sound toggle, details toggle.
- `TriangleHUD` — floating top-center card: large animated Σ (240 ms ease-out lerp), excess/defect chip, α β γ, and a **"For Current Sides" three-worlds strip** (Σ for the current side lengths in each world; click to switch; disabled if the sides can't form a triangle there).
- `QuestionCard` — six hard-coded questions (`tri_flat`, `tri_sphere`, `tri_hyperbolic`, `par_flat`, `par_sphere`, `par_hyperbolic`), keyed by `world`+`lab`. Hint toggle, 20-second idle pulse on the hint button, reveal text when solved. The "Exploring/Discovered" pill is a **manual toggle** (`markQuestionSolved(id, !isSolved)`); there is no drag gating here.
- `DetailsDrawer` — slide-in right panel: live angles, Σ, excess/defect label, Gauss–Bonnet note; Parallel-lab metrics (Π(d) = 2·atan(e^−d)); static STS blurb; reflection textarea bound to `reflectionText`. It does **not** contain the "same side lengths, other worlds" table the older doc mentions (that lives in the HUD strip).
- `LandingScreen` — intro/landing; entered when `isLanding` true. Store default is `isLanding: false`.

**Triangle lab (`components/triangle-lab/`)**
- `TriangleLabStage` — described in §4. Also auto-solves `tri_sphere` when Σ > 185° and `tri_hyperbolic` when Σ < 175° (non-degenerate). `tri_flat` is only solved via the manual pill. Shows a Tab/arrow hint pill on md+.
- `FlatTriangleView` — SVG viewBox `-3.2 -2.4 6.4 4.8`, y flipped; grid, shaded polygon, angle arcs/labels, side labels a/b/c, vertex handles (invisible 0.3 hit radius).
- `SphericalTriangleScene` — dark solid sphere + lat/long graticule, subdivided gold patch (N=12), gold great-circle edges (`generateGreatCircleArc`), vertex sphere handles, drei `<Html>` angle labels shown only when the vertex faces the camera. (No Fibonacci point cloud / custom shader in this version.)
- `SaddleTriangleScene` — dark surface mesh (36×36) + wireframe overlay, green patch, green geodesic edges from `saddleGeodesicPoints3D`, handles + `<Html>` angle labels.

**Parallel lab (older code, not refactored yet)**
- `geometry/GeometryCanvas` → `scenes/EuclideanScene | SphericalScene | HyperbolicScene`; `experiments/ParallelLinesExperiment`, `TriangleExperiment`, `GuidedExperimentFrame` are legacy compat UIs. The roadmap (older doc) says a future "Phase 4a" replaces the hyperbolic parallel scene with a 2D Poincaré-disk SVG.
- `components/sts/CaseStudyNavigation`, `CaseStudyGravity`, `StsReflectionBox` exist. **Not verified** whether they are mounted anywhere in the current `AppShell` flow — `AppShell` does not render them directly; check `LandingScreen` / `GeometryCanvas` / `experiments/*` before assuming they are reachable. Store fields `appSection`, `activeStsCaseStudy` ('history'|'navigation'|'gravity'|'models') are leftovers from that earlier navigation.

## 6b. Guided path, disk lab and content (added Nov 2026)

- **Content lives in `src/content/`**: `questions.ts` (every question, hint, reveal and the short `finding` shown in the findings table) and `chapters.ts` (five chapters, and `STEPS`, the ordered stops on the path). Edit lesson text there, not in components.
- **Navigation is one book, organised by question** (topic-first). Chapters and pages (`STEPS`), each with an address:
  I Triangles (`#/triangles/flat|sphere|saddle`) · II Parallel lines (`#/parallels/…`) · III Circles (`#/circles/…`) · IV The hyperbolic plane (`#/disk/walk|tiles|tiling|polygons`) · V What it means (`#/meaning`). `#/` is the cover; `MOVED` in `chapters.ts` redirects old addresses (`#/disk/circles` → `#/circles/saddle`). Chapters I–III form a 3 × 3 grid (question × surface); the saddle pages of II and III draw the hyperbolic plane on the Poincaré disk.
  `TopBar` = logo (cover), **Contents** menu (every page, ticks for answered questions), reset, sound, Notes. `PageBar` = chapter title, page tabs (a select on phones), Back / Next ("Next: II. Parallel lines" across chapters). There are no separate lab tabs, world switcher, disk tab row or Explore/Compare toggle any more (`appMode` still exists in the store, unused).
  The current page is derived from `lab` + `world` + `disk.exploration`; `src/navigation/routing.ts` keeps `location.hash` and the store in sync both ways (Back/Forward and refresh work; writes are batched per page change). `src/store/persistence.ts` saves `solvedQuestions` and `reflectionText` to `localStorage`.
- **Two modes** (`mode: 'tutorial' | 'explorer'`, toggle in `TopBar`, choice on the landing page). Tutorial: `PredictionVeil` covers the figure and `VeiledReadout` hides the numbers until the student picks a prediction; then `QuestionCard` shows the task (`goal`), a hint, and on success "You were right / Not what you predicted", the explanation and Next. Explorer: no veil; the task is a suggestion and the explanation sits behind "Explain what's going on". Each question in `content/questions.ts` has `predict` (options + answer) and `goal`; the checks live in `src/tutorial/goals.ts` (with `goalFlags` for memory such as "has tilted the line"). `GoalRunner` runs the current page's check on every store change and marks the discovery (in both modes; in the tutorial only after predicting). `goals.test.ts` asserts no page's start state already meets its goal. Old per-stage auto-solve effects were removed.
- **Circles lab** (`lab: 'circle'`, `components/circles-lab/`): `FlatCircleView` (SVG, drag the edge), `SphereCircleCanvas` (lazy 3D; circle centred on the North Pole, camera follows the edge's latitude until the reader turns the globe; a "Follow the circle again" button resumes it), and the disk `CirclesFigure` for the saddle page; `CircleLabPanel` for all three. Radii in the store's `circles` slice (saddle uses `disk.circle.r`). Measurements from `geometry-engine/circles.ts`.
- **Tiling** (`disk.exploration = 'tiling'`): `TilingFigure` draws a regular {p, q} tiling generated by reflections (`poincare/tiling.ts`) and slides it with Möbius maps (`poincare/mobius.ts`) as you drag, rebuilding from the tile nearest the centre each move so the disk stays full. `disk.tiling.home` tracks where the original centre tile went (red).
- **Code splitting**: Three.js lives only in lazily imported modules (`TriangleCanvas3D`, `ParallelCanvas3D`, `SphereCircleCanvas`); keep 3D imports out of the barrels and the shell. Main bundle ≈300 kB, 3D chunk ≈850 kB fetched on first 3D page. Every lazy 3D figure is wrapped in `shell/Stage3D` (Suspense + error boundary + a WebGL check), which shows a plain message instead of a blank stage when WebGL is missing or the figure crashes.
- `components/experiments/*` and `components/sts/*` were removed (unused).
- **Disk lab** (`lab: 'disk'`): `components/disk-lab/` (`DiskLabStage`, `DiskLabPanel`, `figures.tsx`) drawn with `components/poincare/` (`PoincareDisk` SVG + path builders replacing upstream `canvas.js`). State is the store's `disk` slice (plain numbers; points rebuilt with `Poincare`). Discoveries auto-solve when the student does the thing the question asks.
- **Parallels, saddle world** now renders `geometry/ParallelDiskView` (2D disk) instead of the removed `scenes/HyperbolicScene`.
- `FindingsTable` (Notes drawer and Chapter IV) fills from `solvedQuestions`. `Credits` (landing, Notes, Chapter IV) credits hyperbolic-canvas (MIT); keep it.

## 7. State: `store/geometryStore.ts`

Single Zustand store `useGeometryStore`. Types: `WorldKind = 'flat'|'sphere'|'hyperbolic'`, `LabKind = 'triangle'|'parallel'|'disk'|'reflection'`, `DiskExploration = 'walk'|'circles'|'tiles'|'polygon'`, `AppMode = 'explore'|'compare'`.

Main state: `world`, `lab`, `appMode`, `isLanding` (default false), `detailsOpen`, `sides` (default `{1.2,1.2,1.2}`), `sizeScale`, `driver`, `flatTriangle`/`sphereTriangle`/`saddleTriangle`, `parallel` (θ, h=1.2, showFan, fanCount, verdict…), `selectedVertex` (default `'p1'`), `isDragging`, `solvedQuestions`, `reflectionText`, `soundEnabled` (default false), `orbitSensitivity`, `cameraResetSeq`.

Initial vertices: flat `(−0.9,−0.6) (0.9,−0.6) (0,0.8)`; sphere `(0,0,R) (1.3,0,√(R²−1.3²)) (0.65,1.1,…)`; saddle `(0,0) (1,0) (0.5,0.8)` in (u,v).

Legacy/compat fields kept for the older scenes: `geometry`, `experiment`, `tool`, `hyperbolicRepresentation`, `appSection`, `activeStsCaseStudy`, `instructionText`, `points`, `geodesics`, `selectedPointId`, `parallelExperiment`, `appearance`, and their setters. `loadExperiment` populates `points` for the old scenes and is invoked from `setWorld`, `setLab`, `resetLab`.

Behaviours worth knowing:
- Vertex updaters (`updateFlatVertex` etc.) recompute `sides` from the engine and set `driver`.
- `nudgeSelectedVertex` clamps: flat ±2.5; saddle ±1.8 (while the engine domain is 2.0); sphere renormalised to |p|=R.
- `resetLab` restores all three triangles, sides and parallel state, bumps `cameraResetSeq`, reloads the experiment.
- Many actions call `soundManager.playTick()` (Web Audio sine tick, muted by default).
- Tests call `useGeometryStore.getState().resetLab()` in `beforeEach`.

## 8. Tests

47 `it(...)` cases found by grep: `geometry-engine/__tests__/geometry.test.ts` (40) and `store/__tests__/triangleLab.test.ts` (7). Store tests cover: flat Σ≈180, sphere default Σ>180, saddle default Σ<180, side lengths preserved across world switch, `nudgeSelectedVertex`, `cycleSelectedVertex`, and the sphere "solved" condition. (The last test re-implements the app's solve condition and calls `markQuestionSolved` itself, so it does not exercise `TriangleLabStage`'s effect.) Run with `npm test`. No component/e2e tests besides the Playwright screenshot script.

## 9. Setup

```bash
git clone https://github.com/darshanrathwa25-luffy/STS-PROJECT-.git
cd STS-PROJECT-
npm install
npm run dev        # http://localhost:3000
npm test           # vitest run
npx tsc --noEmit   # typecheck
npm run build      # tsc && vite build
```
Node 18+. No `.env`. `node_modules`, `dist` are git-ignored.

**Deploy**: `.github/workflows/deploy.yml` typechecks, tests, builds and publishes `dist` to GitHub Pages on every push to `refactor/epic-lab`. `vite.config.ts` uses `base: './'` so the build works from the repo sub-folder (routes live after `#`). One-time setup in the repo: Settings → Pages → Source: GitHub Actions.

## 10. Known issues / suspected bugs (found by reading, not yet reproduced)

1. **Saddle drag-plane axis mismatch (likely bug).** `saddlePosition` returns `{x:u, y:v, z:height}` and `SaddleTriangleScene` renders vertices at `[pos.x, pos.y, pos.z]`, but the drag handler raycasts the plane **y = 0** and maps `u = intersect.x`, `v = intersect.z` (`SaddleTriangleScene.tsx:137,154`). The rendered "height" axis (z) is being used as the drag axis for v. Verify in the browser; the fix is either to render with y/z swapped (y-up convention) or to change the plane/mapping.
2. **Domain constants disagree:** engine `DEFAULT_SADDLE_DOMAIN = 2.0`, scene comment says 1.8, store nudge clamps to 1.8.
3. **Compare mode is half-present:** `appMode` / `setAppMode` / TopBar toggle exist but nothing renders a compare view; choosing "Compare" just hides the world switcher.
4. **`npm run lint`** references ESLint that is not installed/configured.
5. **README is stale** (pseudosphere/Poincaré experiments, "15 unit tests").
6. **`setWorld`** calls `prev.loadExperiment(...)` through the pre-`set` snapshot — works only because `loadExperiment` re-reads `geometry` itself via `get()`.
7. **Hard-coded ngrok host** in `vite.config.ts` `allowedHosts`.
8. **Bundle size:** Three + R3F + drei produce a large single chunk (older doc: ≈1.1 MB); no code-splitting.
9. **AudioContext** needs a user gesture; `audio.ts` should swallow the resulting errors (not re-verified).

## 11. Differences from the older `D:\Projects\sts project\CODEBASE_CONTEXT.md`

| Older doc claims | This repository |
|---|---|
| `FlatTriangleScene.tsx` (R3F dotted grid) | `FlatTriangleView.tsx` (SVG) |
| `TriangleOverlayLabels.tsx` with 10-pass SAT label collision | Not present; labels are drei `<Html>` (3D worlds) or SVG text (flat) |
| Sphere = 5,500-point Fibonacci cloud + custom GLSL | Solid sphere + graticule, no shader |
| Saddle: purple emissive mesh, orange tubes, auto-rotate | Dark mesh + wireframe, green `<Line>` edges, no auto-rotate |
| Compare mode removed; no "For current sides" strip | Compare toggle still in TopBar/store; strip still in `TriangleHUD` |
| `userHasDragged` gates questions | Field does not exist; solve = angle thresholds or manual pill |
| Default sides ≈2.36, other initial coords | Sides 1.2; coords in §7 |
| DetailsDrawer has "Same side lengths, other worlds" table + side-length toggle | Drawer has readouts + STS blurb + reflection only |
| 49 tests (40 + 9) | 47 `it` cases (40 + 7) |
| Single persistent `<Canvas>` | Flat world is SVG; Canvas remounts for sphere/saddle |

Likely explanations: the newer work lives only in the author's local copy (`C:\Users\RATHWA DARSHAN\Desktop\STS-PROJECT-`) and was never pushed, or the doc describes planned/ongoing work. **Ask the user which is authoritative before building on either.**

## 12. Verification status of this document

- Source files read in full: `geometryStore.ts`, `saddle.ts`, `spherical/distance.ts`, `TriangleLabStage`, `TriangleHUD`, `FlatTriangleView`, `SphericalTriangleScene`, `SaddleTriangleScene`, `TopBar`, `QuestionCard`, `DetailsDrawer`, `AppShell`, `triangleLab.test.ts`, `geometry-engine/index.ts`, `shared/types.ts`, `vite.config.ts`, `package.json`, `README.md`.
- **Only listed, not read:** `LandingScreen`, `GeometryCanvas`, legacy `scenes/*`, `experiments/*`, `sts/*`, `audio.ts`, other engine files (`euclidean/*`, `hyperbolic/{distance,geodesics,intersections,poincareDisk}`, `spherical/{greatCircle,intersections}`, `shared/{numerical,vectors,circleMetrics,triangleConstruction}`), `geometry.test.ts`, CSS/Tailwind config, `scripts/*`. Statements about them are inferred from names/imports.
- Run on 2026-11-03: `npm install` OK (247 packages; `npm audit` reports 6 vulnerabilities — 3 moderate, 1 high, 2 critical — not investigated). `npx tsc --noEmit` exit 0, no errors. `npm run build` succeeded in ~6.5 s; main JS chunk 1,100 kB (305 kB gzip), Vite warns about chunks > 500 kB.
- **Not run yet:** `npm test` (deferred by the user) and the dev server / browser behaviour (so §10 items are still unreproduced).

## 13. Working rules for AI agents in this repo

1. Keep math in `src/geometry-engine/`; UI must call it, never re-derive angle sums.
2. Don't break existing tests; run `npm test` and `npx tsc --noEmit` before finishing (and `npm run build` for larger changes).
3. Keep `strict` TypeScript (`noUnusedLocals/Parameters` are on in `tsconfig.json` per the older doc — confirm before relying on it).
4. Prefer extending the store with immutable `set` updates; keep legacy compat fields until the Parallel lab is migrated.
5. Resolve the §11 question (which version is authoritative) with the user before large refactors.
6. Suggested next steps from the project's own roadmap: Poincaré-disk SVG for the Parallel lab, code-splitting scenes with `React.lazy`, finish or remove Compare mode, fix the saddle drag axis (§10.1).
