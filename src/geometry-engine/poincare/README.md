# Poincaré disk geometry (`geometry-engine/poincare`)

A TypeScript port of the geometry core of
[hyperbolic-canvas](https://github.com/ItsNickBarry/hyperbolic-canvas) by Nick Barry,
ported from commit `152453e` (13 Mar 2026). It is MIT licensed; the original notice is
in [`LICENSE`](./LICENSE) and must stay with this code.

`Circle.intersects` is adapted (by the original author) from a Stack Overflow answer by
01AutoMonkey, licensed CC BY-SA 3.0. That attribution is kept in the source.

## What it is

The hyperbolic plane drawn as the unit disk. Points are inside the disk, the
boundary circle is "infinitely far away", and straight lines are diameters or arcs
of circles meeting the boundary at right angles.

| Module | Upstream file | Contents |
|---|---|---|
| `constants.ts` | `hyperbolic_canvas.js` | `ZERO`, `INFINITY`, `TAU` |
| `angle.ts` | `angle.js` | angle normalisation and conversion |
| `point.ts` | `point.js` | points; hyperbolic distance; walking a distance in a direction |
| `line.ts` | `line.js` | lines, hyperbolic geodesics, intersections, ideal (boundary) points |
| `circle.ts` | `circle.js` | circles with Euclidean and hyperbolic centre/radius, area, circumference |
| `polygon.ts` | `polygon.js` | polygons, regular and ideal polygons |

Use it through the engine barrel: `import { Poincare } from '../geometry-engine'`, then
`Poincare.Point.givenCoordinates(0.2, 0.3)` and so on.

## Differences from upstream

- ES modules and TypeScript classes instead of functions attached to a shared global.
- `Math.TAU` is no longer added to the global `Math`; use `TAU` from `constants.ts`.
- `Point.ORIGIN`, `Line.X_AXIS`, `Line.Y_AXIS` and `Circle.UNIT` are lazy static getters
  (the modules import each other, so they can't be built while loading). The origin and
  unit circle are subclasses instead of instances with patched methods.
- Behaviour is otherwise unchanged, including returning `false` where upstream does.
  One upstream quirk to know: `Line.X_AXIS` and `Line.Y_AXIS` derive their second point on
  the rim, so they count as "off the plane" and `Line.hyperbolicIntersect` returns `false`
  for them. Build diameters from two interior points instead.
- `canvas.js` (drawing onto an HTML canvas) is not part of this folder. Drawing lives in
  `src/components/poincare/`, rendered as SVG.

## Tests

`__tests__/` holds the upstream test suite converted from `node:test` to Vitest, with a
fixed random seed (set `SEED` to change it). `canvas.test.js` is not ported, since it tests
drawing.
